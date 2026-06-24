from app.schemas.plan import PlanCreateRequest, ReservationHint
from app.services.amap_service import ResolvedStop
from app.services.planner import build_plan_output
from app.services.weather_service import WeatherForecast


def test_build_plan_output_generates_budget_checklist_and_graph() -> None:
    payload = PlanCreateRequest(
        city="Suzhou",
        days=2,
        budget_min=1200,
        budget_max=2000,
        transport_preferences=["high_speed_rail", "metro"],
        stay_preference="boutique_hotel",
        interest_tags=["museum", "photo_spots", "citywalk"],
        special_requirements="student discount preferred",
        xiaohongshu_link="https://www.xiaohongshu.com/example",
        xiaohongshu_notes="苏州博物馆虽然免费但是要提前很久预约，公众号预约。",
        output_language="zh-CN",
    )
    reservation_hints = [
        ReservationHint(
            poi_name="苏州博物馆",
            reminder_text="Needs advance reservation.",
            reservation_channel="公众号",
            price_note="free",
            source_url="https://www.xiaohongshu.com/example",
            evidence_excerpt="苏州博物馆虽然免费但是要提前很久预约，公众号预约。",
        )
    ]

    output = build_plan_output(payload, reservation_hints)

    assert output.summary
    assert len(output.timeline) >= 3
    assert len(output.map_points) >= 3
    assert any(item.category == "tickets" for item in output.budget_items)
    assert any(item.item_name == "学生证" for item in output.checklist_items)
    assert output.graph.nodes[0].type == "city"
    museum_stop = next(item for item in output.timeline if item.title == "苏州博物馆")
    assert museum_stop.reservation_hint is not None


def test_build_plan_output_uses_amap_service_for_coords_and_segment_duration() -> None:
    class FakeAmapService:
        def __init__(self) -> None:
            self.segments: list[tuple[str, str, str]] = []

        def resolve_stop(
            self,
            city_query: str,
            stop_name: str,
            kind: str,
            fallback_lat: float,
            fallback_lng: float,
        ) -> ResolvedStop:
            overrides = {
                "苏州博物馆": (31.3201, 120.6201),
                "平江路": (31.3102, 120.6302),
                "双塔市集": (31.3003, 120.6403),
            }
            lat, lng = overrides.get(stop_name, (fallback_lat, fallback_lng))
            return ResolvedStop(
                name=stop_name,
                kind=kind,
                lat=lat,
                lng=lng,
                citycode="0512",
            )

        def estimate_segment_duration_minutes(
            self,
            origin: ResolvedStop,
            destination: ResolvedStop,
            transport_mode: str,
        ) -> int:
            self.segments.append((origin.name, destination.name, transport_mode))
            return 33

    payload = PlanCreateRequest(
        city="Suzhou",
        days=2,
        budget_min=1200,
        budget_max=2000,
        transport_preferences=["metro"],
        stay_preference="boutique_hotel",
        interest_tags=["museum", "citywalk"],
        special_requirements="",
        xiaohongshu_link=None,
        xiaohongshu_notes=None,
        output_language="zh-CN",
    )

    amap_service = FakeAmapService()

    output = build_plan_output(
        payload=payload,
        reservation_hints=[],
        amap_service=amap_service,
    )

    assert output.map_points[0].lat == 31.3201
    assert output.map_points[1].lng == 120.6302
    assert output.timeline[1].transport_mode == "metro"
    assert output.timeline[1].transport_duration_minutes == 33
    assert amap_service.segments[0] == ("苏州博物馆", "平江路", "metro")


def test_build_plan_output_adds_weather_summary_and_weather_driven_checklist() -> None:
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
                citycode="0512",
                adcode="320500",
            )

        def estimate_segment_duration_minutes(
            self,
            origin: ResolvedStop,
            destination: ResolvedStop,
            transport_mode: str,
        ) -> int:
            return 24

    class FakeWeatherService:
        def __init__(self) -> None:
            self.queries: list[str] = []

        def get_city_weather(self, adcode: str) -> WeatherForecast | None:
            self.queries.append(adcode)
            return WeatherForecast(
                city_name="苏州",
                adcode=adcode,
                day_weather="小雨",
                night_weather="多云",
                temperature_low_c=19,
                temperature_high_c=31,
                report_time="2026-06-24 08:00:00",
            )

    payload = PlanCreateRequest(
        city="Suzhou",
        days=2,
        budget_min=1200,
        budget_max=2000,
        transport_preferences=["metro"],
        stay_preference="boutique_hotel",
        interest_tags=["photo_spots"],
        special_requirements="",
        output_language="zh-CN",
    )

    weather_service = FakeWeatherService()

    output = build_plan_output(
        payload=payload,
        reservation_hints=[],
        amap_service=FakeAmapService(),
        weather_service=weather_service,
    )

    assert output.weather_summary is not None
    assert output.weather_summary.temperature_high_c == 31
    assert output.weather_summary.condition_summary == "小雨 -> 多云"
    checklist_names = {item.item_name for item in output.checklist_items}
    assert "雨伞" in checklist_names
    assert "防晒霜" in checklist_names
    assert "薄外套" in checklist_names
    assert weather_service.queries == ["320500"]


def test_build_plan_output_generates_execution_summary_and_reservation_risks() -> None:
    payload = PlanCreateRequest(
        city="Suzhou",
        days=2,
        travel_mode="photo",
        transport_preferences=["metro"],
        preference_tags=["night_view", "photo_ready"],
        output_language="zh-CN",
    )
    hints = [
        ReservationHint(
            poi_name="苏州博物馆",
            reminder_text="需要提前预约",
            reservation_channel="公众号",
            price_note="免费",
            source_url="https://www.xiaohongshu.com/example",
            evidence_excerpt="虽然免费但是要提前预约。",
        )
    ]

    output = build_plan_output(payload=payload, reservation_hints=hints)

    assert output.execution_summary is not None
    assert "预约" in output.execution_summary.headline
    assert "拍照" in output.execution_summary.headline
    assert output.execution_summary.transport_strategy == "地铁 + 短距离步行"
    assert "出片打卡" in output.execution_summary.best_for
    assert output.reservation_risks[0].poi_name == "苏州博物馆"


def test_build_plan_output_only_adds_parking_sections_for_drive_mode() -> None:
    transit_output = build_plan_output(
        payload=PlanCreateRequest(
            city="Suzhou",
            days=2,
            transport_preferences=["metro"],
            parking_required=False,
            output_language="zh-CN",
        ),
        reservation_hints=[],
    )

    assert transit_output.parking_guides == []
    assert transit_output.hotel_area_recommendations == []

    drive_output = build_plan_output(
        payload=PlanCreateRequest(
            city="Suzhou",
            days=2,
            transport_preferences=["drive"],
            parking_required=True,
            parking_sort="distance",
            max_walk_from_parking_minutes=30,
            output_language="zh-CN",
        ),
        reservation_hints=[],
    )

    assert drive_output.parking_guides
    assert drive_output.hotel_area_recommendations
