from app.services.parking_service import (
    build_parking_guides,
    build_parking_guides_for_plan,
)


def test_build_parking_guides_respects_distance_sort() -> None:
    guides = build_parking_guides(
        city="Suzhou",
        poi_names=["拙政园"],
        parking_sort="distance",
        max_walk_minutes=30,
    )

    assert guides[0].sort_mode == "distance"


def test_build_parking_guides_returns_empty_for_non_drive_mode() -> None:
    guides = build_parking_guides_for_plan(
        parking_required=False,
        city="Suzhou",
        poi_names=["拙政园"],
    )

    assert guides == []
