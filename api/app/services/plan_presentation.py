from collections import Counter

from app.schemas.plan import (
    ExecutionSummary,
    PlanCreateRequest,
    ReservationHint,
    ReservationRisk,
    TimelineItem,
    WeatherSummary,
)


def build_execution_summary(
    payload: PlanCreateRequest,
    timeline: list[TimelineItem],
    weather_summary: WeatherSummary | None,
) -> ExecutionSummary:
    language = "en" if payload.output_language == "en" else "zh-CN"
    has_reservation_stop = any(item.reservation_hint for item in timeline)
    headline = _build_headline(
        language=language,
        has_reservation_stop=has_reservation_stop,
        travel_mode=payload.travel_mode,
        weather_summary=weather_summary,
    )

    return ExecutionSummary(
        headline=headline,
        pace=_build_pace(days=payload.days, stop_count=len(timeline)),
        transport_strategy=_build_transport_strategy(language, timeline),
        best_for=_build_best_for(language, payload),
    )


def build_reservation_risks(
    reservation_hints: list[ReservationHint],
) -> list[ReservationRisk]:
    return [
        ReservationRisk(
            poi_name=hint.poi_name,
            severity=_classify_risk_severity(hint),
            reservation_channel=hint.reservation_channel,
            price_note=hint.price_note,
            evidence_excerpt=hint.evidence_excerpt,
        )
        for hint in reservation_hints
    ]


def _build_headline(
    language: str,
    has_reservation_stop: bool,
    travel_mode: str | None,
    weather_summary: WeatherSummary | None,
) -> str:
    if language == "en":
        segments: list[str] = []
        if has_reservation_stop:
            segments.append("Handle reservation-based stops earlier in the day")
        else:
            segments.append("Follow the main route in a low-friction order")

        segments.append(_travel_mode_phrase(language, travel_mode))

        if weather_summary and "rain" in set(weather_summary.advisory_tags):
            segments.append("Keep indoor stops ahead of exposed walking segments")

        return ". ".join(segment for segment in segments if segment) + "."

    segments = []
    if has_reservation_stop:
        segments.append("这趟更适合上午先完成预约景点")
    else:
        segments.append("这条路线更适合先按主线景点顺序推进")

    travel_phrase = _travel_mode_phrase(language, travel_mode)
    if travel_phrase:
        segments.append(travel_phrase)

    if weather_summary and "rain" in set(weather_summary.advisory_tags):
        segments.append("遇到降雨时优先把室内点走完")

    return "，".join(segments) + "。"


def _travel_mode_phrase(language: str, travel_mode: str | None) -> str:
    if language == "en":
        phrases = {
            "photo": "Leave the afternoon for photo-friendly stops and slower walks",
            "citywalk": "Keep the later half focused on relaxed street wandering",
            "nature": "Save the later half for open-air stops and longer views",
            "garden_culture": "Reserve the later half for gardens and cultural pacing",
        }
        return phrases.get(travel_mode, "Leave room for a practical second-half follow-through")

    phrases = {
        "photo": "下午再转入拍照和慢逛",
        "citywalk": "后半程把节奏留给街巷慢逛",
        "nature": "后半程更适合留给户外透气和开阔景别",
        "garden_culture": "后半程适合转入园林和人文点位",
    }
    return phrases.get(travel_mode, "后半程保留给机动调整和轻量收尾")


def _build_pace(days: int, stop_count: int) -> str:
    if stop_count <= days * 2:
        return "relaxed"
    if stop_count >= days * 4:
        return "dense"
    return "balanced"


def _build_transport_strategy(language: str, timeline: list[TimelineItem]) -> str:
    if not timeline:
        return "Flexible city transit" if language == "en" else "灵活机动出行"

    dominant_mode = Counter(item.transport_mode for item in timeline).most_common(1)[0][0]
    if dominant_mode == "drive":
        return "Self-drive + short walks" if language == "en" else "自驾 + 短距离步行"
    if dominant_mode == "metro":
        return "Metro + short walks" if language == "en" else "地铁 + 短距离步行"
    if dominant_mode == "bus":
        return "Bus + walking transfers" if language == "en" else "公交 + 步行换乘"
    if dominant_mode == "walk":
        return "Mostly walking" if language == "en" else "以步行为主"
    return "Flexible city transit" if language == "en" else "灵活机动出行"


def _build_best_for(language: str, payload: PlanCreateRequest) -> list[str]:
    items: list[str] = []
    if language == "en":
        travel_mode_labels = {
            "photo": "Photo-focused stops",
            "citywalk": "Relaxed citywalk",
            "nature": "Open-air route",
            "garden_culture": "Gardens and culture",
        }
        if payload.travel_mode:
            items.append(travel_mode_labels.get(payload.travel_mode, payload.travel_mode))
        items.append(
            f"{payload.days}-day city trip" if payload.days != 2 else "Weekend 2-day trip"
        )
        return items

    travel_mode_labels = {
        "photo": "出片打卡",
        "citywalk": "慢逛街巷",
        "nature": "户外透气",
        "garden_culture": "园林人文",
    }
    if payload.travel_mode:
        items.append(travel_mode_labels.get(payload.travel_mode, payload.travel_mode))
    items.append("周末 2 天" if payload.days == 2 else f"{payload.days} 天城市旅行")
    return items


def _classify_risk_severity(hint: ReservationHint) -> str:
    text = " ".join(
        value
        for value in (
            hint.reminder_text,
            hint.evidence_excerpt,
            hint.reservation_channel,
        )
        if value
    ).lower()

    if any(keyword in text for keyword in ("提前", "advance", "实名", "reserve")):
        return "high"
    if any(keyword in text for keyword in ("排队", "queue", "限流", "slots")):
        return "medium"
    return "low"
