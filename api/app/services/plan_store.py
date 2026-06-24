from datetime import datetime, timezone
from functools import lru_cache
from typing import Any, Protocol
from uuid import uuid4

import httpx

from app.core.config import get_settings
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
    PlanRecord,
    ReservationRisk,
    ReservationHint,
    TimelineItem,
    WeatherSummary,
)
from app.services.planner import GeneratedPlanOutput


class PlanStore(Protocol):
    def create(
        self,
        payload: PlanCreateRequest,
        reservation_hints: list[ReservationHint],
        generated: GeneratedPlanOutput,
    ) -> PlanRecord: ...

    def get(self, plan_id: str) -> PlanRecord | None: ...


class InMemoryPlanStore:
    def __init__(self) -> None:
        self._plans: dict[str, PlanRecord] = {}

    def create(
        self,
        payload: PlanCreateRequest,
        reservation_hints: list[ReservationHint],
        generated: GeneratedPlanOutput,
    ) -> PlanRecord:
        plan = build_plan_record(
            plan_id=str(uuid4()),
            created_at=datetime.now(timezone.utc),
            payload=payload,
            reservation_hints=reservation_hints,
            generated=generated,
        )
        self._plans[plan.id] = plan
        return plan

    def get(self, plan_id: str) -> PlanRecord | None:
        return self._plans.get(plan_id)


class SupabaseRestClient:
    def __init__(
        self,
        supabase_url: str,
        service_role_key: str,
        timeout: float = 10.0,
    ) -> None:
        base_url = f"{supabase_url.rstrip('/')}/rest/v1"
        self._client = httpx.Client(
            base_url=base_url,
            timeout=timeout,
            headers={
                "apikey": service_role_key,
                "Authorization": f"Bearer {service_role_key}",
                "Content-Type": "application/json",
            },
        )

    def insert_one(self, table: str, payload: dict[str, Any]) -> dict[str, Any]:
        response = self._client.post(
            f"/{table}",
            headers={"Prefer": "return=representation"},
            json=payload,
        )
        response.raise_for_status()
        return response.json()[0]

    def insert_many(
        self, table: str, payloads: list[dict[str, Any]]
    ) -> list[dict[str, Any]]:
        if not payloads:
            return []

        response = self._client.post(
            f"/{table}",
            headers={"Prefer": "return=representation"},
            json=payloads,
        )
        response.raise_for_status()
        return response.json()

    def select_one(
        self, table: str, filters: dict[str, Any]
    ) -> dict[str, Any] | None:
        rows = self.select_many(table=table, filters=filters)
        return rows[0] if rows else None

    def select_many(
        self, table: str, filters: dict[str, Any]
    ) -> list[dict[str, Any]]:
        response = self._client.get(f"/{table}", params=_build_eq_filters(filters))
        response.raise_for_status()
        return response.json()

    def delete_many(self, table: str, filters: dict[str, Any]) -> None:
        response = self._client.delete(f"/{table}", params=_build_eq_filters(filters))
        response.raise_for_status()


class SupabasePlanStore:
    def __init__(self, rest_client: SupabaseRestClient) -> None:
        self._rest_client = rest_client

    def create(
        self,
        payload: PlanCreateRequest,
        reservation_hints: list[ReservationHint],
        generated: GeneratedPlanOutput,
    ) -> PlanRecord:
        plan = build_plan_record(
            plan_id=str(uuid4()),
            created_at=datetime.now(timezone.utc),
            payload=payload,
            reservation_hints=reservation_hints,
            generated=generated,
        )

        self._rest_client.insert_one("plans", _serialize_plan_row(plan))

        try:
            self._rest_client.insert_many(
                "plan_reservation_hints",
                _serialize_reservation_rows(plan.id, reservation_hints),
            )
            self._rest_client.insert_many(
                "plan_itineraries",
                _serialize_timeline_rows(plan.id, plan.timeline),
            )
            self._rest_client.insert_many(
                "plan_map_points",
                _serialize_map_point_rows(plan.id, plan.map_points),
            )
            self._rest_client.insert_many(
                "plan_budget_items",
                _serialize_budget_rows(plan.id, plan.budget_items),
            )
            self._rest_client.insert_many(
                "plan_checklist_items",
                _serialize_checklist_rows(plan.id, plan.checklist_items),
            )
            self._rest_client.insert_many(
                "plan_graph_nodes",
                _serialize_graph_node_rows(plan.id, plan.graph.nodes),
            )
            self._rest_client.insert_many(
                "plan_graph_edges",
                _serialize_graph_edge_rows(plan.id, plan.graph.edges),
            )
        except Exception:
            self._rest_client.delete_many("plans", {"id": plan.id})
            raise

        return plan

    def get(self, plan_id: str) -> PlanRecord | None:
        plan_row = self._rest_client.select_one("plans", {"id": plan_id})
        if not plan_row:
            return None

        reservation_hints = self._fetch_reservation_hints(plan_id)
        reservation_hint_by_poi = {
            hint.poi_name: hint for hint in reservation_hints
        }

        timeline_rows = self._rest_client.select_many(
            "plan_itineraries", {"plan_id": plan_id}
        )
        timeline = [
            TimelineItem(
                day_index=row["day_index"],
                start_time=row["start_time"],
                end_time=row["end_time"],
                title=row["title"],
                transport_mode=row["transport_mode"],
                transport_duration_minutes=row["transport_duration_minutes"],
                notes=row["notes"],
                reservation_hint=reservation_hint_by_poi.get(row["title"]),
            )
            for row in sorted(
                timeline_rows,
                key=lambda item: (
                    item["day_index"],
                    item["start_time"],
                    item["end_time"],
                    item["title"],
                ),
            )
        ]

        map_points = [
            MapPoint(
                name=row["name"],
                lat=float(row["lat"]),
                lng=float(row["lng"]),
                day_index=row["day_index"],
                sequence_no=row["sequence_no"],
            )
            for row in sorted(
                self._rest_client.select_many("plan_map_points", {"plan_id": plan_id}),
                key=lambda item: item["sequence_no"],
            )
        ]

        budget_items = [
            BudgetItem(
                category=row["category"],
                amount_low=row["amount_low"],
                amount_high=row["amount_high"],
                is_adjustable=row["is_adjustable"],
            )
            for row in sorted(
                self._rest_client.select_many(
                    "plan_budget_items", {"plan_id": plan_id}
                ),
                key=lambda item: _budget_sort_key(item["category"]),
            )
        ]

        checklist_items = [
            ChecklistItem(
                category=row["category"],
                item_name=row["item_name"],
                reason=row["reason"],
            )
            for row in sorted(
                self._rest_client.select_many(
                    "plan_checklist_items", {"plan_id": plan_id}
                ),
                key=lambda item: (item["category"], item["item_name"]),
            )
        ]

        graph_nodes = [
            GraphNode(
                id=row["node_key"],
                label=row["label"],
                type=row["node_type"],
            )
            for row in self._rest_client.select_many(
                "plan_graph_nodes", {"plan_id": plan_id}
            )
        ]
        graph_edges = [
            GraphEdge(
                source=row["source_key"],
                target=row["target_key"],
                label=row.get("label"),
            )
            for row in self._rest_client.select_many(
                "plan_graph_edges", {"plan_id": plan_id}
            )
        ]

        return PlanRecord.model_validate(
            {
                "id": plan_row["id"],
                "city": plan_row["city"],
                "days": plan_row["days"],
                "budget_min": plan_row.get("budget_min"),
                "budget_max": plan_row.get("budget_max"),
                "transport_preferences": plan_row.get("transport_preferences", []),
                "entry_mode": plan_row.get("entry_mode", "quick"),
                "travel_mode": plan_row.get("travel_mode"),
                "preference_tags": plan_row.get("preference_tags", []),
                "parking_required": plan_row.get("parking_required", False),
                "parking_sort": plan_row.get("parking_sort"),
                "max_walk_from_parking_minutes": plan_row.get(
                    "max_walk_from_parking_minutes"
                ),
                "stay_preference": plan_row.get("stay_preference"),
                "interest_tags": plan_row.get("interest_tags", []),
                "special_requirements": plan_row.get("special_requirements"),
                "xiaohongshu_link": plan_row.get("xiaohongshu_link"),
                "xiaohongshu_notes": plan_row.get("xiaohongshu_notes"),
                "output_language": plan_row.get("output_language", "zh-CN"),
                "status": plan_row.get("status", "draft"),
                "summary": plan_row.get("summary", ""),
                "timeline": timeline,
                "map_points": map_points,
                "budget_items": budget_items,
                "checklist_items": checklist_items,
                "weather_summary": (
                    WeatherSummary.model_validate(plan_row["weather_summary"])
                    if plan_row.get("weather_summary")
                    else None
                ),
                "execution_summary": (
                    ExecutionSummary.model_validate(plan_row["execution_summary"])
                    if plan_row.get("execution_summary")
                    else None
                ),
                "reservation_risks": [
                    ReservationRisk.model_validate(item)
                    for item in plan_row.get("reservation_risks", [])
                ],
                "parking_guides": [
                    ParkingGuide.model_validate(item)
                    for item in plan_row.get("parking_guides", [])
                ],
                "hotel_area_recommendations": [
                    HotelAreaRecommendation.model_validate(item)
                    for item in plan_row.get("hotel_area_recommendations", [])
                ],
                "graph": PlanGraph(nodes=graph_nodes, edges=graph_edges),
                "reservation_hints": reservation_hints,
                "created_at": plan_row["created_at"],
            }
        )

    def _fetch_reservation_hints(self, plan_id: str) -> list[ReservationHint]:
        rows = self._rest_client.select_many(
            "plan_reservation_hints", {"plan_id": plan_id}
        )
        return [
            ReservationHint(
                poi_name=row["poi_name"],
                reminder_text=row["reminder_text"],
                reservation_channel=row.get("reservation_channel"),
                price_note=row.get("price_note"),
                source_url=row["source_url"],
                source_type=row.get("source_type", "xiaohongshu"),
                confidence=float(row.get("confidence", 0.9)),
                evidence_excerpt=row["evidence_excerpt"],
            )
            for row in sorted(rows, key=lambda item: item["poi_name"])
        ]


def build_plan_record(
    plan_id: str,
    created_at: datetime,
    payload: PlanCreateRequest,
    reservation_hints: list[ReservationHint],
    generated: GeneratedPlanOutput,
) -> PlanRecord:
    return PlanRecord(
        id=plan_id,
        city=payload.city,
        days=payload.days,
        budget_min=payload.budget_min,
        budget_max=payload.budget_max,
        transport_preferences=payload.transport_preferences,
        entry_mode=payload.entry_mode,
        travel_mode=payload.travel_mode,
        preference_tags=payload.preference_tags,
        parking_required=payload.parking_required,
        parking_sort=payload.parking_sort,
        max_walk_from_parking_minutes=payload.max_walk_from_parking_minutes,
        stay_preference=payload.stay_preference,
        interest_tags=payload.interest_tags,
        special_requirements=payload.special_requirements,
        xiaohongshu_link=payload.xiaohongshu_link,
        xiaohongshu_notes=payload.xiaohongshu_notes,
        output_language=payload.output_language,
        summary=generated.summary,
        timeline=generated.timeline,
        map_points=generated.map_points,
        budget_items=generated.budget_items,
        checklist_items=generated.checklist_items,
        weather_summary=generated.weather_summary,
        execution_summary=generated.execution_summary,
        reservation_risks=generated.reservation_risks,
        parking_guides=generated.parking_guides,
        hotel_area_recommendations=generated.hotel_area_recommendations,
        graph=generated.graph,
        reservation_hints=reservation_hints,
        created_at=created_at,
    )


def _build_eq_filters(filters: dict[str, Any]) -> dict[str, str]:
    return {"select": "*", **{key: f"eq.{value}" for key, value in filters.items()}}


def _serialize_plan_row(plan: PlanRecord) -> dict[str, Any]:
    return {
        "id": plan.id,
        "city": plan.city,
        "days": plan.days,
        "budget_min": plan.budget_min,
        "budget_max": plan.budget_max,
        "transport_preferences": plan.transport_preferences,
        "entry_mode": plan.entry_mode,
        "travel_mode": plan.travel_mode,
        "preference_tags": plan.preference_tags,
        "parking_required": plan.parking_required,
        "parking_sort": plan.parking_sort,
        "max_walk_from_parking_minutes": plan.max_walk_from_parking_minutes,
        "stay_preference": plan.stay_preference,
        "interest_tags": plan.interest_tags,
        "special_requirements": plan.special_requirements,
        "xiaohongshu_link": plan.xiaohongshu_link,
        "xiaohongshu_notes": plan.xiaohongshu_notes,
        "output_language": plan.output_language,
        "status": plan.status,
        "summary": plan.summary,
        "weather_summary": (
            plan.weather_summary.model_dump(mode="json")
            if plan.weather_summary
            else None
        ),
        "execution_summary": (
            plan.execution_summary.model_dump(mode="json")
            if plan.execution_summary
            else None
        ),
        "reservation_risks": [
            item.model_dump(mode="json") for item in plan.reservation_risks
        ],
        "parking_guides": [
            item.model_dump(mode="json") for item in plan.parking_guides
        ],
        "hotel_area_recommendations": [
            item.model_dump(mode="json")
            for item in plan.hotel_area_recommendations
        ],
        "created_at": plan.created_at.isoformat(),
    }


def _serialize_reservation_rows(
    plan_id: str, reservation_hints: list[ReservationHint]
) -> list[dict[str, Any]]:
    return [
        {
            "id": str(uuid4()),
            "plan_id": plan_id,
            "poi_name": hint.poi_name,
            "reminder_text": hint.reminder_text,
            "reservation_channel": hint.reservation_channel,
            "price_note": hint.price_note,
            "source_url": hint.source_url,
            "source_type": hint.source_type,
            "confidence": hint.confidence,
            "evidence_excerpt": hint.evidence_excerpt,
        }
        for hint in reservation_hints
    ]


def _serialize_timeline_rows(
    plan_id: str, timeline: list[TimelineItem]
) -> list[dict[str, Any]]:
    return [
        {
            "id": str(uuid4()),
            "plan_id": plan_id,
            "day_index": item.day_index,
            "start_time": item.start_time,
            "end_time": item.end_time,
            "title": item.title,
            "transport_mode": item.transport_mode,
            "transport_duration_minutes": item.transport_duration_minutes,
            "notes": item.notes,
        }
        for item in timeline
    ]


def _serialize_map_point_rows(
    plan_id: str, map_points: list[MapPoint]
) -> list[dict[str, Any]]:
    return [
        {
            "id": str(uuid4()),
            "plan_id": plan_id,
            "name": point.name,
            "lat": point.lat,
            "lng": point.lng,
            "day_index": point.day_index,
            "sequence_no": point.sequence_no,
        }
        for point in map_points
    ]


def _serialize_budget_rows(
    plan_id: str, budget_items: list[BudgetItem]
) -> list[dict[str, Any]]:
    return [
        {
            "id": str(uuid4()),
            "plan_id": plan_id,
            "category": item.category,
            "amount_low": item.amount_low,
            "amount_high": item.amount_high,
            "is_adjustable": item.is_adjustable,
        }
        for item in budget_items
    ]


def _serialize_checklist_rows(
    plan_id: str, checklist_items: list[ChecklistItem]
) -> list[dict[str, Any]]:
    return [
        {
            "id": str(uuid4()),
            "plan_id": plan_id,
            "category": item.category,
            "item_name": item.item_name,
            "reason": item.reason,
        }
        for item in checklist_items
    ]


def _serialize_graph_node_rows(
    plan_id: str, nodes: list[GraphNode]
) -> list[dict[str, Any]]:
    return [
        {
            "id": str(uuid4()),
            "plan_id": plan_id,
            "node_key": node.id,
            "label": node.label,
            "node_type": node.type,
        }
        for node in nodes
    ]


def _serialize_graph_edge_rows(
    plan_id: str, edges: list[GraphEdge]
) -> list[dict[str, Any]]:
    return [
        {
            "id": str(uuid4()),
            "plan_id": plan_id,
            "source_key": edge.source,
            "target_key": edge.target,
            "label": edge.label,
        }
        for edge in edges
    ]


def _budget_sort_key(category: str) -> tuple[int, str]:
    priority = {
        "tickets": 0,
        "food": 1,
        "stay": 2,
        "local_transport": 3,
        "intercity_transport": 4,
        "flexible": 5,
    }
    return (priority.get(category, 99), category)


@lru_cache
def get_plan_store() -> PlanStore:
    settings = get_settings()
    if settings.storage_mode == "supabase":
        return SupabasePlanStore(
            rest_client=SupabaseRestClient(
                supabase_url=settings.supabase_url,
                service_role_key=settings.supabase_service_role_key,
            )
        )
    return InMemoryPlanStore()
