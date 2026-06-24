from fastapi import APIRouter, HTTPException, status

from app.schemas.plan import PlanCreateRequest, PlanRecord
from app.services.planner import build_plan_output
from app.services.plan_store import plan_store
from app.services.reservation_hint_service import extract_reservation_hints


router = APIRouter(prefix="/plans", tags=["plans"])


@router.get("/ping")
def ping_plans() -> dict[str, str]:
    return {"status": "pending"}


@router.post("", response_model=PlanRecord, status_code=status.HTTP_201_CREATED)
def create_plan(payload: PlanCreateRequest) -> PlanRecord:
    reservation_hints = extract_reservation_hints(
        notes=payload.xiaohongshu_notes,
        source_url=payload.xiaohongshu_link,
    )
    generated = build_plan_output(
        payload=payload,
        reservation_hints=reservation_hints,
    )
    return plan_store.create(
        payload=payload,
        reservation_hints=reservation_hints,
        generated=generated,
    )


@router.get("/{plan_id}", response_model=PlanRecord)
def get_plan(plan_id: str) -> PlanRecord:
    plan = plan_store.get(plan_id)
    if not plan:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Plan not found")
    return plan
