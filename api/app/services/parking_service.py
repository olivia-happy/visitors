from app.schemas.plan import HotelAreaRecommendation, ParkingGuide


class ParkingLotTemplate(dict):
    pass


CITY_PARKING_TEMPLATES: dict[str, dict[str, list[ParkingLotTemplate]]] = {
    "Suzhou": {
        "拙政园": [
            {
                "lot_name": "苏州博物馆北停车场",
                "walking_minutes": 8,
                "price_note": "约 8 元/小时",
                "hourly_price": 8,
                "parking_difficulty": "一般",
            },
            {
                "lot_name": "园林博物馆停车场",
                "walking_minutes": 12,
                "price_note": "约 6 元/小时",
                "hourly_price": 6,
                "parking_difficulty": "偏紧张",
            },
        ],
        "苏州博物馆": [
            {
                "lot_name": "苏州博物馆北停车场",
                "walking_minutes": 6,
                "price_note": "约 8 元/小时",
                "hourly_price": 8,
                "parking_difficulty": "一般",
            }
        ],
        "平江路": [
            {
                "lot_name": "相门城墙停车场",
                "walking_minutes": 10,
                "price_note": "约 7 元/小时",
                "hourly_price": 7,
                "parking_difficulty": "周末偏紧张",
            }
        ],
        "双塔市集": [
            {
                "lot_name": "双塔停车场",
                "walking_minutes": 5,
                "price_note": "约 6 元/小时",
                "hourly_price": 6,
                "parking_difficulty": "一般",
            }
        ],
        "山塘街": [
            {
                "lot_name": "山塘街游客中心停车场",
                "walking_minutes": 9,
                "price_note": "约 8 元/小时",
                "hourly_price": 8,
                "parking_difficulty": "节假日偏紧张",
            }
        ],
    }
}


CITY_HOTEL_AREA_TEMPLATES: dict[str, list[HotelAreaRecommendation]] = {
    "Suzhou": [
        HotelAreaRecommendation(
            area_name="平江路东侧",
            parking_convenience="停车场选择多，适合晚回酒店后步行补逛",
            parking_price_note="商圈停车多为 6-8 元/小时",
            access_note="去博物馆、平江路和双塔市集都比较顺路",
            suitable_modes=["drive", "photo", "citywalk"],
            budget_band="mid",
        ),
        HotelAreaRecommendation(
            area_name="金鸡湖东岸",
            parking_convenience="酒店自带停车位概率更高，进出城压力更小",
            parking_price_note="高端酒店更常见免费或封顶停车",
            access_note="适合把古城和湖区拆成两段开车完成",
            suitable_modes=["drive", "nature", "garden_culture"],
            budget_band="upper_mid",
        ),
    ]
}


def build_parking_guides(
    city: str,
    poi_names: list[str],
    parking_sort: str = "distance",
    max_walk_minutes: int = 30,
) -> list[ParkingGuide]:
    guides: list[ParkingGuide] = []
    city_templates = CITY_PARKING_TEMPLATES.get(city, {})

    for poi_name in poi_names:
        candidates = city_templates.get(poi_name) or [_build_fallback_lot(poi_name)]
        selected = _select_lot(
            candidates=candidates,
            parking_sort=parking_sort,
            max_walk_minutes=max_walk_minutes,
        )
        guides.append(
            ParkingGuide(
                poi_name=poi_name,
                parking_difficulty=selected["parking_difficulty"],
                recommended_lot_name=selected["lot_name"],
                walking_minutes=selected["walking_minutes"],
                price_note=selected.get("price_note"),
                sort_mode=parking_sort,
            )
        )

    return guides


def build_parking_guides_for_plan(
    parking_required: bool,
    city: str,
    poi_names: list[str],
    parking_sort: str = "distance",
    max_walk_minutes: int = 30,
) -> list[ParkingGuide]:
    if not parking_required:
        return []

    return build_parking_guides(
        city=city,
        poi_names=poi_names,
        parking_sort=parking_sort,
        max_walk_minutes=max_walk_minutes,
    )


def build_hotel_area_recommendations(city: str) -> list[HotelAreaRecommendation]:
    return CITY_HOTEL_AREA_TEMPLATES.get(city, [])


def _select_lot(
    candidates: list[ParkingLotTemplate],
    parking_sort: str,
    max_walk_minutes: int,
) -> ParkingLotTemplate:
    filtered = [
        candidate
        for candidate in candidates
        if candidate["walking_minutes"] <= max_walk_minutes
    ] or candidates

    if parking_sort == "price":
        return min(
            filtered,
            key=lambda item: (item.get("hourly_price", 999), item["walking_minutes"]),
        )

    return min(
        filtered,
        key=lambda item: (item["walking_minutes"], item.get("hourly_price", 999)),
    )


def _build_fallback_lot(poi_name: str) -> ParkingLotTemplate:
    return {
        "lot_name": f"{poi_name}官方停车场",
        "walking_minutes": 10,
        "price_note": "以现场公示为准",
        "hourly_price": 10,
        "parking_difficulty": "一般",
    }
