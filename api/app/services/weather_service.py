from dataclasses import dataclass
from functools import lru_cache

import httpx

from app.core.config import get_settings


@dataclass(frozen=True)
class WeatherForecast:
    city_name: str
    adcode: str
    day_weather: str
    night_weather: str
    temperature_low_c: int | None
    temperature_high_c: int | None
    report_time: str | None = None


class AmapWeatherService:
    def __init__(self, api_key: str, client: httpx.Client | None = None) -> None:
        self.api_key = api_key
        self._client = client or httpx.Client(
            base_url="https://restapi.amap.com",
            timeout=10.0,
        )

    @property
    def enabled(self) -> bool:
        return bool(self.api_key)

    def get_city_weather(self, adcode: str) -> WeatherForecast | None:
        if not self.enabled or not adcode:
            return None

        payload = self._request(
            "/v3/weather/weatherInfo",
            {
                "key": self.api_key,
                "city": adcode,
                "extensions": "all",
                "output": "JSON",
            },
        )
        forecasts = payload.get("forecasts", [])
        if not forecasts:
            return None

        forecast = forecasts[0]
        casts = forecast.get("casts", [])
        if not casts:
            return None

        today = casts[0]
        return WeatherForecast(
            city_name=forecast.get("city") or adcode,
            adcode=forecast.get("adcode") or adcode,
            day_weather=today.get("dayweather", ""),
            night_weather=today.get("nightweather", ""),
            temperature_low_c=_to_int(today.get("nighttemp")),
            temperature_high_c=_to_int(today.get("daytemp")),
            report_time=forecast.get("reporttime"),
        )

    def _request(self, path: str, params: dict[str, str]) -> dict:
        response = self._client.get(path, params=params)
        response.raise_for_status()
        payload = response.json()

        if payload.get("status") != "1":
            raise ValueError(payload.get("info", "AMap weather request failed."))

        return payload


def _to_int(value: str | None) -> int | None:
    if value is None or value == "":
        return None
    return int(value)


@lru_cache
def get_weather_service() -> AmapWeatherService | None:
    settings = get_settings()
    if not settings.amap_web_service_key:
        return None

    return AmapWeatherService(api_key=settings.amap_web_service_key)
