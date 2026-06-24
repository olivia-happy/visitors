from fastapi.testclient import TestClient

from app.main import app


def test_create_plan_returns_plan_id_and_reservation_hints() -> None:
    client = TestClient(app)

    response = client.post(
        "/plans",
        json={
            "city": "Suzhou",
            "days": 2,
            "budget_min": 1200,
            "budget_max": 2000,
            "transport_preferences": ["high_speed_rail", "metro"],
            "stay_preference": "boutique_hotel",
            "interest_tags": ["museum", "photo_spots", "citywalk"],
            "special_requirements": "low walking intensity",
            "xiaohongshu_link": "https://www.xiaohongshu.com/example",
            "xiaohongshu_notes": "苏州博物馆虽然免费但是要提前很久预约，公众号预约。",
            "output_language": "zh-CN",
        },
    )

    assert response.status_code == 201
    body = response.json()
    assert body["status"] == "draft"
    assert body["city"] == "Suzhou"
    assert body["reservation_hints"][0]["poi_name"] == "苏州博物馆"
    assert body["reservation_hints"][0]["reservation_channel"] == "公众号"
    assert body["reservation_hints"][0]["price_note"] == "free"
    assert body["timeline"]
    assert body["map_points"]
    assert body["budget_items"]
    assert body["checklist_items"]
    assert body["graph"]["nodes"]
    assert body["graph"]["edges"]

    museum_stop = next(
        item for item in body["timeline"] if item["title"] == "苏州博物馆"
    )
    assert museum_stop["reservation_hint"]["poi_name"] == "苏州博物馆"
    assert museum_stop["reservation_hint"]["reservation_channel"] == "公众号"


def test_create_plan_accepts_mobile_dual_entry_fields() -> None:
    client = TestClient(app)

    response = client.post(
        "/plans",
        json={
            "city": "Suzhou",
            "days": 2,
            "transport_preferences": ["drive"],
            "entry_mode": "quick",
            "travel_mode": "photo",
            "preference_tags": ["food", "photo_ready"],
            "parking_required": True,
            "parking_sort": "distance",
            "max_walk_from_parking_minutes": 30,
            "output_language": "zh-CN",
        },
    )

    assert response.status_code == 201


def test_create_plan_rejects_invalid_parking_sort() -> None:
    client = TestClient(app)

    response = client.post(
        "/plans",
        json={
            "city": "Suzhou",
            "days": 2,
            "entry_mode": "quick",
            "travel_mode": "photo",
            "parking_required": True,
            "parking_sort": "random",
            "output_language": "zh-CN",
        },
    )

    assert response.status_code == 422


def test_get_created_plan_returns_structured_payload() -> None:
    client = TestClient(app)

    create_response = client.post(
        "/plans",
        json={
            "city": "Xi'an",
            "days": 4,
            "budget_min": 2400,
            "budget_max": 3600,
            "transport_preferences": ["flight", "metro"],
            "stay_preference": "convenient_hotel",
            "interest_tags": ["history", "museum"],
            "special_requirements": "student discount preferred",
            "xiaohongshu_link": "https://www.xiaohongshu.com/example-2",
            "xiaohongshu_notes": "陕西历史博物馆记得实名预约。",
            "output_language": "en",
        },
    )
    plan_id = create_response.json()["id"]

    response = client.get(f"/plans/{plan_id}")

    assert response.status_code == 200
    body = response.json()
    assert body["id"] == plan_id
    assert body["output_language"] == "en"
    assert body["reservation_hints"][0]["poi_name"] == "陕西历史博物馆"
    assert body["summary"]
    assert body["graph"]["nodes"][0]["type"] == "city"
    assert any(item["category"] == "tickets" for item in body["budget_items"])
    assert any(item["item_name"] == "ID card" for item in body["checklist_items"])
