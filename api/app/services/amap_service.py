from dataclasses import dataclass
from functools import lru_cache
from math import ceil

import httpx

from app.core.config import get_settings


@dataclass(frozen=True)
class ResolvedStop:
    name: str
    kind: str
    lat: float
    lng: float
    citycode: str | None = None
    adcode: str | None = None


class AmapService:
    def __init__(self, api_key: str, client: httpx.Client | None = None) -> None:
        self.api_key = api_key
        self._client = client or httpx.Client(
            base_url="https://restapi.amap.com",
            timeout=10.0,
        )

    @property
    def enabled(self) -> bool:
        return bool(self.api_key)

    def resolve_stop(
        self,
        city_query: str,
        stop_name: str,
        kind: str,
        fallback_lat: float,
        fallback_lng: float,
    ) -> ResolvedStop:
        if not self.enabled:
            return ResolvedStop(
                name=stop_name,
                kind=kind,
                lat=fallback_lat,
                lng=fallback_lng,
            )

        payload = self._request(
            "/v3/geocode/geo",
            {
                "key": self.api_key,
                "address": stop_name,
                "city": city_query,
                "output": "JSON",
            },
        )
        geocodes = payload.get("geocodes", [])

        if not geocodes:
            return ResolvedStop(
                name=stop_name,
                kind=kind,
                lat=fallback_lat,
                lng=fallback_lng,
            )

        location = geocodes[0]["location"]
        lng_text, lat_text = location.split(",")
        return ResolvedStop(
            name=stop_name,
            kind=kind,
            lat=float(lat_text),
            lng=float(lng_text),
            citycode=geocodes[0].get("citycode") or geocodes[0].get("adcode"),
            adcode=geocodes[0].get("adcode"),
        )

    def estimate_segment_duration_minutes(
        self,
        origin: ResolvedStop,
        destination: ResolvedStop,
        transport_mode: str,
    ) -> int:
        if not self.enabled:
            return 20

        endpoint, params = self._build_route_request(
            origin=origin,
            destination=destination,
            transport_mode=transport_mode,
        )
        payload = self._request(endpoint, params)
        seconds = self._extract_duration_seconds(payload, transport_mode)
        return max(ceil(seconds / 60), 1)

    def _build_route_request(
        self,
        origin: ResolvedStop,
        destination: ResolvedStop,
        transport_mode: str,
    ) -> tuple[str, dict[str, str]]:
        base_params = {
            "key": self.api_key,
            "origin": f"{origin.lng:.6f},{origin.lat:.6f}",
            "destination": f"{destination.lng:.6f},{destination.lat:.6f}",
            "show_fields": "cost",
            "output": "JSON",
        }

        normalized_mode = transport_mode.lower()
        if normalized_mode in {"metro", "subway", "bus", "public_transit"}:
            if not origin.citycode or not destination.citycode:
                raise ValueError("Transit routing requires citycode for both points.")
            return (
                "/v5/direction/transit/integrated",
                {
                    **base_params,
                    "city1": origin.citycode,
                    "city2": destination.citycode,
                },
            )

        if normalized_mode in {"drive", "car", "taxi", "self_drive"}:
            return (
                "/v5/direction/driving",
                {
                    **base_params,
                    "strategy": "32",
                },
            )

        return (
            "/v5/direction/walking",
            {
                **base_params,
                "isindoor": "0",
            },
        )

    def _extract_duration_seconds(self, payload: dict, transport_mode: str) -> int:
        route = payload.get("route", {})
        normalized_mode = transport_mode.lower()

        if normalized_mode in {"metro", "subway", "bus", "public_transit"}:
            transit = (route.get("transits") or [{}])[0]
            cost = transit.get("cost") or {}
            return int(cost["duration"])

        path = (route.get("paths") or [{}])[0]
        cost = path.get("cost") or {}
        return int(cost["duration"])

    def _request(self, path: str, params: dict[str, str]) -> dict:
        response = self._client.get(path, params=params)
        response.raise_for_status()
        payload = response.json()

        if payload.get("status") != "1":
            raise ValueError(payload.get("info", "AMap request failed."))

        return payload


CITY_QUERY_ALIASES = {
    "Suzhou": "苏州",
    "Xi'an": "西安",
    "Hangzhou": "杭州",
}


def normalize_city_query(city: str) -> str:
    return CITY_QUERY_ALIASES.get(city, city)


@lru_cache
def get_amap_service() -> AmapService | None:
    settings = get_settings()
    if not settings.amap_web_service_key:
        return None

    return AmapService(api_key=settings.amap_web_service_key)
