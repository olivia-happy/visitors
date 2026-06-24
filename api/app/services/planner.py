from dataclasses import dataclass

from app.schemas.plan import (
    BudgetItem,
    ChecklistItem,
    GraphEdge,
    GraphNode,
    MapPoint,
    PlanCreateRequest,
    PlanGraph,
    ReservationHint,
    TimelineItem,
)


@dataclass
class GeneratedPlanOutput:
    summary: str
    timeline: list[TimelineItem]
    map_points: list[MapPoint]
    budget_items: list[BudgetItem]
    checklist_items: list[ChecklistItem]
    graph: PlanGraph


CITY_TEMPLATES = {
    "Suzhou": {
        "summary": "Museum-first citywalk plan with balanced pacing and reservation awareness.",
        "stops": [
            ("苏州博物馆", 31.3246, 120.6171, "museum"),
            ("平江路", 31.3197, 120.6288, "citywalk"),
            ("双塔市集", 31.3088, 120.6324, "food"),
            ("山塘街", 31.3324, 120.5966, "night"),
        ],
    },
    "Xi'an": {
        "summary": "History-heavy city plan with museums, walls, and compact urban transit.",
        "stops": [
            ("陕西历史博物馆", 34.2258, 108.9536, "museum"),
            ("大雁塔", 34.2194, 108.9608, "landmark"),
            ("永兴坊", 34.2712, 108.9737, "food"),
            ("西安城墙", 34.2654, 108.9542, "citywalk"),
        ],
    },
    "Hangzhou": {
        "summary": "Photo-friendly lakeside route with low-friction citywalking.",
        "stops": [
            ("西湖", 30.2480, 120.1500, "landmark"),
            ("孤山", 30.2572, 120.1420, "photo"),
            ("法喜寺", 30.2345, 120.1078, "landmark"),
            ("龙翔桥", 30.2536, 120.1683, "stay"),
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
    payload: PlanCreateRequest, reservation_hints: list[ReservationHint]
) -> GeneratedPlanOutput:
    template = CITY_TEMPLATES.get(payload.city, _generic_template(payload.city))
    stop_count = max(payload.days * 2, 3)
    stops = template["stops"][:stop_count]

    timeline = _build_timeline(
        stops=stops,
        reservation_hints=reservation_hints,
        days=payload.days,
        output_language=payload.output_language,
    )
    map_points = _build_map_points(stops=stops, days=payload.days)
    budget_items = _build_budget_items(payload)
    checklist_items = _build_checklist_items(payload)
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
        graph=graph,
    )


def _build_timeline(
    stops: list[tuple[str, float, float, str]],
    reservation_hints: list[ReservationHint],
    days: int,
    output_language: str,
) -> list[TimelineItem]:
    items: list[TimelineItem] = []
    for index, stop in enumerate(stops):
        title, _, _, kind = stop
        start_time, end_time, transport_mode, duration = TIME_SLOTS[index % len(TIME_SLOTS)]
        reservation_hint = next(
            (hint for hint in reservation_hints if hint.poi_name == title),
            None,
        )
        note = _describe_stop(kind=kind, output_language=output_language)

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


def _build_map_points(
    stops: list[tuple[str, float, float, str]], days: int
) -> list[MapPoint]:
    points: list[MapPoint] = []
    for index, stop in enumerate(stops):
        title, lat, lng, _ = stop
        points.append(
            MapPoint(
                name=title,
                lat=lat,
                lng=lng,
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


def _build_checklist_items(payload: PlanCreateRequest) -> list[ChecklistItem]:
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
        ChecklistItem(
            category="basics",
            item_name=_translate("Umbrella", payload.output_language),
            reason=_translate(
                "Carry it for uncertain weather and long citywalks.",
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

    return items


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


def _translate(text: str, output_language: str) -> str:
    if output_language != "en":
        translations = {
            "ID card": "身份证",
            "Power bank": "充电宝",
            "Umbrella": "雨伞",
            "Student card": "学生证",
            "Camera or extra storage": "相机或额外存储卡",
            "Required for transport and hotel check-in.": "用于交通出行和酒店入住核验。",
            "Useful for map navigation and trip recording.": "方便导航、拍照和记录旅程。",
            "Carry it for uncertain weather and long citywalks.": "应对不确定天气和长时间 citywalk。",
            "Needed for student-price tickets when available.": "景点存在学生票时可直接使用。",
            "Useful for photo-focused stops.": "适合拍照节点较多的行程。",
        }
        return translations.get(text, text)

    return text


def _generic_template(city: str) -> dict[str, object]:
    return {
        "summary": f"Balanced city plan for {city} with practical pacing and flexible routing.",
        "stops": [
            (f"{city} Museum", 31.2304, 121.4737, "museum"),
            (f"{city} Old Street", 31.2280, 121.4780, "citywalk"),
            (f"{city} Food Block", 31.2260, 121.4800, "food"),
        ],
    }
