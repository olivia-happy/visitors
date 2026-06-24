from datetime import datetime, timezone
from uuid import uuid4

from app.schemas.plan import PlanCreateRequest, PlanRecord, ReservationHint


class InMemoryPlanStore:
    def __init__(self) -> None:
        self._plans: dict[str, PlanRecord] = {}

    def create(
        self, payload: PlanCreateRequest, reservation_hints: list[ReservationHint]
    ) -> PlanRecord:
        plan = PlanRecord(
            id=str(uuid4()),
            city=payload.city,
            days=payload.days,
            budget_min=payload.budget_min,
            budget_max=payload.budget_max,
            transport_preferences=payload.transport_preferences,
            stay_preference=payload.stay_preference,
            interest_tags=payload.interest_tags,
            special_requirements=payload.special_requirements,
            xiaohongshu_link=payload.xiaohongshu_link,
            xiaohongshu_notes=payload.xiaohongshu_notes,
            output_language=payload.output_language,
            reservation_hints=reservation_hints,
            created_at=datetime.now(timezone.utc),
        )
        self._plans[plan.id] = plan
        return plan

    def get(self, plan_id: str) -> PlanRecord | None:
        return self._plans.get(plan_id)


plan_store = InMemoryPlanStore()

