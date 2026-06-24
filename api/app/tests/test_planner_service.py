from app.schemas.plan import PlanCreateRequest, ReservationHint
from app.services.planner import build_plan_output


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
