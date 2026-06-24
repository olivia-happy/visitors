from app.services.reservation_hint_service import extract_reservation_hints


def test_extract_reservation_hint_from_explicit_xiaohongshu_evidence() -> None:
    hints = extract_reservation_hints(
        notes=(
            "苏州博物馆虽然免费但是要提前很久预约，公众号预约。"
            "平江路适合 citywalk。"
        ),
        source_url="https://www.xiaohongshu.com/example",
    )

    assert len(hints) == 1
    hint = hints[0]
    assert hint.poi_name == "苏州博物馆"
    assert hint.reservation_channel == "公众号"
    assert hint.price_note == "free"
    assert "提前很久预约" in hint.evidence_excerpt


def test_extract_reservation_hint_returns_empty_without_explicit_reservation() -> None:
    hints = extract_reservation_hints(
        notes="平江路和山塘街都很适合拍照，咖啡店很多。",
        source_url="https://www.xiaohongshu.com/example",
    )

    assert hints == []

