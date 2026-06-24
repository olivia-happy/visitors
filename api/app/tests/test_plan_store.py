from copy import deepcopy

import pytest

from app.schemas.plan import PlanCreateRequest, ReservationHint
from app.services.amap_service import ResolvedStop
from app.services.plan_store import SupabasePlanStore, get_plan_store
from app.services.planner import build_plan_output
from app.services.weather_service import WeatherForecast


class FakeSupabaseRestClient:
    def __init__(self) -> None:
        self.tables: dict[str, list[dict]] = {}

    def insert_one(self, table: str, payload: dict) -> dict:
        row = deepcopy(payload)
        self.tables.setdefault(table, []).append(row)
        return deepcopy(row)

    def insert_many(self, table: str, payloads: list[dict]) -> list[dict]:
        rows = [deepcopy(payload) for payload in payloads]
        self.tables.setdefault(table, []).extend(rows)
        return deepcopy(rows)

    def select_one(self, table: str, filters: dict[str, str]) -> dict | None:
        rows = self.select_many(table, filters)
        return rows[0] if rows else None

    def select_many(
        self,
        table: str,
        filters: dict[str, str],
        order_by: str | None = None,
    ) -> list[dict]:
        rows = [
            deepcopy(row)
            for row in self.tables.get(table, [])
            if all(str(row.get(key)) == str(value) for key, value in filters.items())
        ]

        if order_by:
            rows.sort(key=lambda row: row[order_by])

        return rows

    def delete_many(self, table: str, filters: dict[str, str]) -> None:
        self.tables[table] = [
            row
            for row in self.tables.get(table, [])
            if not all(str(row.get(key)) == str(value) for key, value in filters.items())
        ]


def test_supabase_plan_store_round_trips_structured_plan() -> None:
    class FakeAmapService:
        def resolve_stop(
            self,
            city_query: str,
            stop_name: str,
            kind: str,
            fallback_lat: float,
            fallback_lng: float,
        ) -> ResolvedStop:
            return ResolvedStop(
                name=stop_name,
                kind=kind,
                lat=fallback_lat,
                lng=fallback_lng,
                citycode="028",
                adcode="510100",
            )

        def estimate_segment_duration_minutes(
            self,
            origin: ResolvedStop,
            destination: ResolvedStop,
            transport_mode: str,
        ) -> int:
            return 18

    class FakeWeatherService:
        def get_city_weather(self, adcode: str) -> WeatherForecast | None:
            return WeatherForecast(
                city_name="Chengdu",
                adcode=adcode,
                day_weather="小雨",
                night_weather="阴",
                temperature_low_c=18,
                temperature_high_c=27,
                report_time="2026-06-24 08:00:00",
            )

    payload = PlanCreateRequest(
        city="Suzhou",
        days=2,
        budget_min=1600,
        budget_max=2400,
        transport_preferences=["drive", "metro"],
        stay_preference="design_hotel",
        interest_tags=["museum", "photo_spots"],
        entry_mode="quick",
        travel_mode="photo",
        preference_tags=["food", "photo_ready"],
        parking_required=True,
        parking_sort="distance",
        max_walk_from_parking_minutes=30,
        special_requirements="student discount preferred",
        xiaohongshu_link="https://www.xiaohongshu.com/example",
        xiaohongshu_notes="苏州博物馆需要提前预约。",
        output_language="en",
    )
    reservation_hints = [
        ReservationHint(
            poi_name="苏州博物馆",
            reminder_text="Advance reservation required.",
            reservation_channel="official mini program",
            price_note="free",
            source_url="https://www.xiaohongshu.com/example",
            evidence_excerpt="苏州博物馆需要提前预约。",
        )
    ]
    generated = build_plan_output(
        payload=payload,
        reservation_hints=reservation_hints,
        amap_service=FakeAmapService(),
        weather_service=FakeWeatherService(),
    )

    store = SupabasePlanStore(rest_client=FakeSupabaseRestClient())
    created = store.create(
        payload=payload,
        reservation_hints=reservation_hints,
        generated=generated,
    )

    fetched = store.get(created.id)

    assert fetched is not None
    assert fetched.id == created.id
    assert fetched.summary == created.summary
    assert fetched.weather_summary is not None
    assert fetched.weather_summary == created.weather_summary
    assert fetched.transport_preferences == ["drive", "metro"]
    assert fetched.entry_mode == "quick"
    assert fetched.travel_mode == "photo"
    assert fetched.preference_tags == ["food", "photo_ready"]
    assert fetched.parking_required is True
    assert fetched.parking_sort == "distance"
    assert fetched.max_walk_from_parking_minutes == 30
    assert fetched.execution_summary is not None
    assert fetched.execution_summary == created.execution_summary
    assert fetched.reservation_risks == created.reservation_risks
    assert fetched.parking_guides == created.parking_guides
    assert (
        fetched.hotel_area_recommendations
        == created.hotel_area_recommendations
    )
    assert fetched.timeline[0].title == "苏州博物馆"
    assert fetched.timeline[0].reservation_hint is not None
    assert fetched.timeline[0].reservation_hint.poi_name == "苏州博物馆"
    assert fetched.map_points[0].sequence_no == 1
    assert any(item.category == "tickets" for item in fetched.budget_items)
    assert any(item.item_name == "Student card" for item in fetched.checklist_items)
    assert fetched.graph.nodes[0].type == "city"
    assert fetched.graph.edges[0].label == "contains"


def test_get_plan_store_switches_to_supabase_with_credentials(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setenv("SUPABASE_URL", "https://example.supabase.co")
    monkeypatch.setenv("SUPABASE_SERVICE_ROLE_KEY", "service-role-key")
    get_plan_store.cache_clear()

    store = get_plan_store()

    assert isinstance(store, SupabasePlanStore)

    get_plan_store.cache_clear()
