from dataclasses import dataclass
from typing import Protocol

from app.schemas.plan import (
    BudgetItem,
    ChecklistItem,
    ExecutionSummary,
    GraphEdge,
    GraphNode,
    HotelAreaRecommendation,
    MapPoint,
    ParkingGuide,
    PlanCreateRequest,
    PlanGraph,
    ReservationRisk,
    ReservationHint,
    TimelineItem,
    WeatherSummary,
)
from app.services.amap_service import ResolvedStop, normalize_city_query
from app.services.parking_service import (
    build_hotel_area_recommendations,
    build_parking_guides_for_plan,
)
from app.services.plan_presentation import (
    build_execution_summary,
    build_reservation_risks,
)
from app.services.weather_service import WeatherForecast


@dataclass
class GeneratedPlanOutput:
    summary: str
    timeline: list[TimelineItem]
    map_points: list[MapPoint]
    budget_items: list[BudgetItem]
    checklist_items: list[ChecklistItem]
    weather_summary: WeatherSummary | None
    execution_summary: ExecutionSummary | None
    reservation_risks: list[ReservationRisk]
    parking_guides: list[ParkingGuide]
    hotel_area_recommendations: list[HotelAreaRecommendation]
    graph: PlanGraph


@dataclass(frozen=True)
class TemplateStop:
    name: str
    fallback_lat: float
    fallback_lng: float
    kind: str


class RouteAwareMapService(Protocol):
    def resolve_stop(
        self,
        city_query: str,
        stop_name: str,
        kind: str,
        fallback_lat: float,
        fallback_lng: float,
    ) -> ResolvedStop: ...

    def estimate_segment_duration_minutes(
        self,
        origin: ResolvedStop,
        destination: ResolvedStop,
        transport_mode: str,
    ) -> int: ...


class WeatherLookupService(Protocol):
    def get_city_weather(self, adcode: str) -> WeatherForecast | None: ...


CITY_TEMPLATES = {
    "Suzhou": {
        "summary": "Museum-first citywalk plan with balanced pacing and reservation awareness.",
        "stops": [
            TemplateStop("苏州博物馆", 31.3246, 120.6171, "museum"),
            TemplateStop("平江路", 31.3197, 120.6288, "citywalk"),
            TemplateStop("双塔市集", 31.3088, 120.6324, "food"),
            TemplateStop("山塘街", 31.3324, 120.5966, "night"),
        ],
    },
    "Xi'an": {
        "summary": "History-heavy city plan with museums, walls, and compact urban transit.",
        "stops": [
            TemplateStop("陕西历史博物馆", 34.2258, 108.9536, "museum"),
            TemplateStop("大雁塔", 34.2194, 108.9608, "landmark"),
            TemplateStop("永兴坊", 34.2712, 108.9737, "food"),
            TemplateStop("西安城墙", 34.2654, 108.9542, "citywalk"),
        ],
    },
    "Hangzhou": {
        "summary": "Photo-friendly lakeside route with low-friction citywalking.",
        "stops": [
            TemplateStop("西湖", 30.2480, 120.1500, "landmark"),
            TemplateStop("孤山", 30.2572, 120.1420, "photo"),
            TemplateStop("法喜寺", 30.2345, 120.1078, "landmark"),
            TemplateStop("龙翔桥", 30.2536, 120.1683, "stay"),
        ],
    },
}


TIME_SLOTS = [
    ("09:00", "11:30", "metro", 20),
    ("12:30", "15:00", "walk", 15),
    ("16:00", "18:30", "taxi", 25),
    ("19:30", "21:00", "metro", 20),
]


def build_plan_output(
    payload: PlanCreateRequest,
    reservation_hints: list[ReservationHint],
    amap_service: RouteAwareMapService | None = None,
    weather_service: WeatherLookupService | None = None,
) -> GeneratedPlanOutput:
    template = CITY_TEMPLATES.get(payload.city, _generic_template(payload.city))
    stop_count = max(payload.days * 2, 3)
    stops = template["stops"][:stop_count]
    resolved_stops = _resolve_stops(
        city=payload.city,
        stops=stops,
        amap_service=amap_service,
    )

    timeline = _build_timeline(
        stops=resolved_stops,
        reservation_hints=reservation_hints,
        days=payload.days,
        output_language=payload.output_language,
        transport_preferences=payload.transport_preferences,
        amap_service=amap_service,
    )
    map_points = _build_map_points(stops=resolved_stops, days=payload.days)
    budget_items = _build_budget_items(payload)
    weather_summary = _build_weather_summary(
        stops=resolved_stops,
        output_language=payload.output_language,
        weather_service=weather_service,
    )
    checklist_items = _build_checklist_items(payload, weather_summary)
    execution_summary = build_execution_summary(
        payload=payload,
        timeline=timeline,
        weather_summary=weather_summary,
    )
    reservation_risks = build_reservation_risks(reservation_hints)
    parking_guides = build_parking_guides_for_plan(
        parking_required=payload.parking_required,
        city=payload.city,
        poi_names=[item.title for item in timeline],
        parking_sort=payload.parking_sort or "distance",
        max_walk_minutes=payload.max_walk_from_parking_minutes or 30,
    )
    hotel_area_recommendations = (
        build_hotel_area_recommendations(payload.city)
        if payload.parking_required
        else []
    )
    graph = _build_graph(
        city=payload.city,
        days=payload.days,
        timeline=timeline,
        budget_items=budget_items,
        reservation_hints=reservation_hints,
    )

    return GeneratedPlanOutput(
        summary=template["summary"],
        timeline=timeline,
        map_points=map_points,
        budget_items=budget_items,
        checklist_items=checklist_items,
        weather_summary=weather_summary,
        execution_summary=execution_summary,
        reservation_risks=reservation_risks,
        parking_guides=parking_guides,
        hotel_area_recommendations=hotel_area_recommendations,
        graph=graph,
    )


def _resolve_stops(
    city: str,
    stops: list[TemplateStop],
    amap_service: RouteAwareMapService | None,
) -> list[ResolvedStop]:
    if not amap_service:
        return [
            ResolvedStop(
                name=stop.name,
                kind=stop.kind,
                lat=stop.fallback_lat,
                lng=stop.fallback_lng,
            )
            for stop in stops
        ]

    city_query = normalize_city_query(city)
    resolved: list[ResolvedStop] = []
    for stop in stops:
        try:
            resolved.append(
                amap_service.resolve_stop(
                    city_query=city_query,
                    stop_name=stop.name,
                    kind=stop.kind,
                    fallback_lat=stop.fallback_lat,
                    fallback_lng=stop.fallback_lng,
                )
            )
        except Exception:
            resolved.append(
                ResolvedStop(
                    name=stop.name,
                    kind=stop.kind,
                    lat=stop.fallback_lat,
                    lng=stop.fallback_lng,
                )
            )
    return resolved


def _build_timeline(
    stops: list[ResolvedStop],
    reservation_hints: list[ReservationHint],
    days: int,
    output_language: str,
    transport_preferences: list[str],
    amap_service: RouteAwareMapService | None,
) -> list[TimelineItem]:
    items: list[TimelineItem] = []
    for index, stop in enumerate(stops):
        title = stop.name
        start_time, end_time, fallback_transport_mode, fallback_duration = TIME_SLOTS[
            index % len(TIME_SLOTS)
        ]
        transport_mode = _pick_transport_mode(
            transport_preferences=transport_preferences,
            fallback_transport_mode=fallback_transport_mode,
            kind=stop.kind,
        )
        reservation_hint = next(
            (hint for hint in reservation_hints if hint.poi_name == title),
            None,
        )
        note = _describe_stop(kind=stop.kind, output_language=output_language)
        duration = fallback_duration

        if index > 0 and amap_service:
            try:
                duration = amap_service.estimate_segment_duration_minutes(
                    origin=stops[index - 1],
                    destination=stop,
                    transport_mode=transport_mode,
                )
            except Exception:
                duration = fallback_duration

        items.append(
            TimelineItem(
                day_index=min(index // 2 + 1, days),
                start_time=start_time,
                end_time=end_time,
                title=title,
                transport_mode=transport_mode,
                transport_duration_minutes=duration,
                notes=note,
                reservation_hint=reservation_hint,
            )
        )

    return items


def _pick_transport_mode(
    transport_preferences: list[str],
    fallback_transport_mode: str,
    kind: str,
) -> str:
    normalized = {preference.lower() for preference in transport_preferences}

    if {"metro", "subway"} & normalized:
        return "metro"
    if {"drive", "car", "self_drive", "taxi"} & normalized:
        return "drive"
    if {"bus", "public_transit"} & normalized:
        return "bus"
    if kind == "citywalk":
        return "walk"

    return fallback_transport_mode


def _build_map_points(
    stops: list[ResolvedStop], days: int
) -> list[MapPoint]:
    points: list[MapPoint] = []
    for index, stop in enumerate(stops):
        points.append(
            MapPoint(
                name=stop.name,
                lat=stop.lat,
                lng=stop.lng,
                day_index=min(index // 2 + 1, days),
                sequence_no=index + 1,
            )
        )
    return points


def _build_budget_items(payload: PlanCreateRequest) -> list[BudgetItem]:
    base_low = payload.budget_min or payload.days * 700
    base_high = payload.budget_max or payload.days * 1000

    def portion(value: int, ratio: float) -> int:
        return max(int(value * ratio), 1)

    return [
        BudgetItem(
            category="tickets",
            amount_low=portion(base_low, 0.08),
            amount_high=portion(base_high, 0.12),
            is_adjustable=False,
        ),
        BudgetItem(
            category="food",
            amount_low=portion(base_low, 0.18),
            amount_high=portion(base_high, 0.22),
            is_adjustable=True,
        ),
        BudgetItem(
            category="stay",
            amount_low=portion(base_low, 0.30),
            amount_high=portion(base_high, 0.38),
            is_adjustable=False,
        ),
        BudgetItem(
            category="local_transport",
            amount_low=portion(base_low, 0.08),
            amount_high=portion(base_high, 0.12),
            is_adjustable=True,
        ),
        BudgetItem(
            category="intercity_transport",
            amount_low=portion(base_low, 0.18),
            amount_high=portion(base_high, 0.26),
            is_adjustable=False,
        ),
        BudgetItem(
            category="flexible",
            amount_low=portion(base_low, 0.08),
            amount_high=portion(base_high, 0.12),
            is_adjustable=True,
        ),
    ]


def _build_checklist_items(
    payload: PlanCreateRequest,
    weather_summary: WeatherSummary | None,
) -> list[ChecklistItem]:
    items = [
        ChecklistItem(
            category="documents",
            item_name=_translate("ID card", payload.output_language),
            reason=_translate(
                "Required for transport and hotel check-in.",
                payload.output_language,
            ),
        ),
        ChecklistItem(
            category="electronics",
            item_name=_translate("Power bank", payload.output_language),
            reason=_translate(
                "Useful for map navigation and trip recording.",
                payload.output_language,
            ),
        ),
    ]

    if "student" in (payload.special_requirements or "").lower():
        items.append(
            ChecklistItem(
                category="documents",
                item_name=_translate("Student card", payload.output_language),
                reason=_translate(
                    "Needed for student-price tickets when available.",
                    payload.output_language,
                ),
            )
        )

    if "photo_spots" in payload.interest_tags:
        items.append(
            ChecklistItem(
                category="photo",
                item_name=_translate(
                    "Camera or extra storage", payload.output_language
                ),
                reason=_translate(
                    "Useful for photo-focused stops.", payload.output_language
                ),
            )
        )

    if weather_summary:
        tags = set(weather_summary.advisory_tags)
        if "rain" in tags:
            items.append(
                ChecklistItem(
                    category="weather",
                    item_name=_translate("Umbrella", payload.output_language),
                    reason=_translate(
                        "Rain is expected, so keep it handy for transfers and citywalk segments.",
                        payload.output_language,
                    ),
                )
            )
        if "sun" in tags:
            items.append(
                ChecklistItem(
                    category="weather",
                    item_name=_translate("Sunscreen", payload.output_language),
                    reason=_translate(
                        "Midday UV and heat are likely to be stronger.",
                        payload.output_language,
                    ),
                )
            )
        if "layering" in tags:
            items.append(
                ChecklistItem(
                    category="weather",
                    item_name=_translate("Light jacket", payload.output_language),
                    reason=_translate(
                        "There may be a cooler evening or a noticeable day-night temperature gap.",
                        payload.output_language,
                    ),
                )
            )

    return items


def _build_weather_summary(
    stops: list[ResolvedStop],
    output_language: str,
    weather_service: WeatherLookupService | None,
) -> WeatherSummary | None:
    if not weather_service:
        return None

    adcode = next((stop.adcode for stop in stops if stop.adcode), None)
    if not adcode:
        return None

    try:
        forecast = weather_service.get_city_weather(adcode)
    except Exception:
        return None

    if not forecast:
        return None

    advisory_tags = _build_weather_tags(forecast)
    condition_summary = _format_condition_summary(forecast, output_language)
    return WeatherSummary(
        city_name=forecast.city_name,
        condition_summary=condition_summary,
        temperature_low_c=forecast.temperature_low_c,
        temperature_high_c=forecast.temperature_high_c,
        report_time=forecast.report_time,
        overview=_build_weather_overview(
            forecast=forecast,
            condition_summary=condition_summary,
            output_language=output_language,
        ),
        clothing_tip=_build_clothing_tip(
            advisory_tags=advisory_tags,
            output_language=output_language,
        ),
        advisory_tags=advisory_tags,
    )


def _build_graph(
    city: str,
    days: int,
    timeline: list[TimelineItem],
    budget_items: list[BudgetItem],
    reservation_hints: list[ReservationHint],
) -> PlanGraph:
    nodes: list[GraphNode] = [GraphNode(id="city", label=city, type="city")]
    edges: list[GraphEdge] = []

    for day in range(1, days + 1):
        day_id = f"day-{day}"
        nodes.append(GraphNode(id=day_id, label=f"Day {day}", type="day"))
        edges.append(GraphEdge(source="city", target=day_id, label="contains"))

    for index, item in enumerate(timeline, start=1):
        poi_id = f"poi-{index}"
        nodes.append(GraphNode(id=poi_id, label=item.title, type="attraction"))
        edges.append(
            GraphEdge(
                source=f"day-{item.day_index}",
                target=poi_id,
                label="visit",
            )
        )

    for budget_item in budget_items:
        budget_id = f"budget-{budget_item.category}"
        nodes.append(
            GraphNode(
                id=budget_id,
                label=budget_item.category,
                type="budget",
            )
        )
        edges.append(GraphEdge(source="city", target=budget_id, label="budget"))

    for index, hint in enumerate(reservation_hints, start=1):
        reservation_id = f"reservation-{index}"
        nodes.append(
            GraphNode(
                id=reservation_id,
                label=hint.poi_name,
                type="reservation",
            )
        )
        edges.append(GraphEdge(source="city", target=reservation_id, label="reserve"))

    return PlanGraph(nodes=nodes, edges=edges)


def _describe_stop(kind: str, output_language: str) -> str:
    descriptions = {
        "museum": {
            "zh-CN": "适合安排为主行程节点，注意入场与停留时长。",
            "en": "Best used as a primary stop with controlled entry timing.",
        },
        "citywalk": {
            "zh-CN": "适合慢节奏步行和拍照记录。",
            "en": "Good for slower citywalking and photo-friendly pacing.",
        },
        "food": {
            "zh-CN": "适合作为补能和本地风味体验节点。",
            "en": "Useful as a recharge stop with local food options.",
        },
        "night": {
            "zh-CN": "适合安排在傍晚或夜间收尾。",
            "en": "Works well as an evening or night close-out stop.",
        },
        "landmark": {
            "zh-CN": "适合作为城市代表性地标安排。",
            "en": "A strong landmark stop for city identity.",
        },
        "photo": {
            "zh-CN": "适合出片和轻量记录。",
            "en": "Useful for photo-oriented and lightweight recording stops.",
        },
        "stay": {
            "zh-CN": "适合作为住宿或换乘便利参考区域。",
            "en": "Useful as a stay area or transport anchor.",
        },
    }
    language = "en" if output_language == "en" else "zh-CN"
    return descriptions.get(kind, descriptions["citywalk"])[language]


def _build_weather_tags(forecast: WeatherForecast) -> list[str]:
    tags: list[str] = []
    weather_text = f"{forecast.day_weather} {forecast.night_weather}"

    if any(keyword in weather_text for keyword in ("雨", "雪", "雷", "storm", "shower")):
        tags.append("rain")

    if (
        forecast.temperature_high_c is not None
        and forecast.temperature_high_c >= 30
    ):
        tags.append("sun")

    if (
        forecast.temperature_low_c is not None
        and forecast.temperature_high_c is not None
        and (
            forecast.temperature_low_c <= 16
            or forecast.temperature_high_c - forecast.temperature_low_c >= 8
        )
    ):
        tags.append("layering")

    return tags


def _format_condition_summary(
    forecast: WeatherForecast,
    output_language: str,
) -> str:
    day_weather = _localize_weather_label(forecast.day_weather, output_language)
    night_weather = _localize_weather_label(
        forecast.night_weather,
        output_language,
    )
    if day_weather == night_weather:
        return day_weather
    return f"{day_weather} -> {night_weather}"


def _build_weather_overview(
    forecast: WeatherForecast,
    condition_summary: str,
    output_language: str,
) -> str:
    temperature_text = _format_temperature_range(
        forecast.temperature_low_c,
        forecast.temperature_high_c,
        output_language,
    )
    if output_language == "en":
        return f"Forecast: {condition_summary}, {temperature_text}."

    return f"天气预计{condition_summary}，{temperature_text}。"


def _build_clothing_tip(advisory_tags: list[str], output_language: str) -> str:
    tips: list[str] = []
    if "layering" in advisory_tags:
        tips.append(
            _translate(
                "Pack a light jacket for the cooler hours.",
                output_language,
            )
        )
    if "sun" in advisory_tags:
        tips.append(
            _translate(
                "Short sleeves and sun protection work better for midday outdoor stops.",
                output_language,
            )
        )
    if "rain" in advisory_tags:
        tips.append(
            _translate(
                "A compact umbrella will reduce friction when moving between stops.",
                output_language,
            )
        )

    if not tips:
        return _translate(
            "Weather looks relatively stable, so keep the outfit practical for long walks.",
            output_language,
        )

    return " ".join(tips)


def _format_temperature_range(
    temperature_low_c: int | None,
    temperature_high_c: int | None,
    output_language: str,
) -> str:
    if temperature_low_c is None and temperature_high_c is None:
        return (
            "temperature range unavailable"
            if output_language == "en"
            else "温度区间暂未返回"
        )
    if temperature_low_c is None:
        return (
            f"up to {temperature_high_c}°C"
            if output_language == "en"
            else f"最高约 {temperature_high_c}°C"
        )
    if temperature_high_c is None:
        return (
            f"around {temperature_low_c}°C"
            if output_language == "en"
            else f"约 {temperature_low_c}°C"
        )
    return f"{temperature_low_c}-{temperature_high_c}°C"


def _localize_weather_label(condition: str, output_language: str) -> str:
    if output_language != "en":
        return condition

    if "转" in condition:
        parts = [part.strip() for part in condition.split("转") if part.strip()]
        return " to ".join(_localize_weather_label(part, output_language) for part in parts)

    translations = {
        "晴": "Sunny",
        "多云": "Cloudy",
        "阴": "Overcast",
        "阵雨": "Showers",
        "小雨": "Light rain",
        "中雨": "Moderate rain",
        "大雨": "Heavy rain",
        "暴雨": "Storm rain",
        "雷阵雨": "Thunder showers",
        "小雪": "Light snow",
        "中雪": "Snow",
        "大雪": "Heavy snow",
    }
    return translations.get(condition, condition)


def _translate(text: str, output_language: str) -> str:
    if output_language != "en":
        translations = {
            "ID card": "身份证",
            "Power bank": "充电宝",
            "Umbrella": "雨伞",
            "Sunscreen": "防晒霜",
            "Light jacket": "薄外套",
            "Student card": "学生证",
            "Camera or extra storage": "相机或额外存储卡",
            "Required for transport and hotel check-in.": "用于交通出行和酒店入住核验。",
            "Useful for map navigation and trip recording.": "方便导航、拍照和记录旅程。",
            "Carry it for uncertain weather and long citywalks.": "应对不确定天气和长时间 citywalk。",
            "Needed for student-price tickets when available.": "景点存在学生票时可直接使用。",
            "Useful for photo-focused stops.": "适合拍照节点较多的行程。",
            "Rain is expected, so keep it handy for transfers and citywalk segments.": "有降雨风险，换乘和步行段都更方便应对。",
            "Midday UV and heat are likely to be stronger.": "中午时段紫外线和体感热度会更明显。",
            "There may be a cooler evening or a noticeable day-night temperature gap.": "晚间偏凉，或昼夜温差会比较明显。",
            "Pack a light jacket for the cooler hours.": "建议带一件薄外套，应对早晚偏凉时段。",
            "Short sleeves and sun protection work better for midday outdoor stops.": "白天户外节点更适合短袖，并补充防晒。",
            "A compact umbrella will reduce friction when moving between stops.": "转场时随身带一把折叠伞会更省事。",
            "Weather looks relatively stable, so keep the outfit practical for long walks.": "天气整体较稳定，穿着以耐走和方便活动为主。",
        }
        return translations.get(text, text)

    return text


def _generic_template(city: str) -> dict[str, object]:
    return {
        "summary": f"Balanced city plan for {city} with practical pacing and flexible routing.",
        "stops": [
            TemplateStop(f"{city} Museum", 31.2304, 121.4737, "museum"),
            TemplateStop(f"{city} Old Street", 31.2280, 121.4780, "citywalk"),
            TemplateStop(f"{city} Food Block", 31.2260, 121.4800, "food"),
        ],
    }
