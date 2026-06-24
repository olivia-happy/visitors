from fastapi import APIRouter, HTTPException, status

from app.services.amap_service import get_amap_service
from app.schemas.plan import PlanCreateRequest, PlanRecord
from app.services.planner import build_plan_output
from app.services.plan_store import get_plan_store
from app.services.reservation_hint_service import extract_reservation_hints
from app.services.weather_service import get_weather_service


router = APIRouter(prefix="/plans", tags=["plans"])


@router.get("/ping")
def ping_plans() -> dict[str, str]:
    return {"status": "pending"}


@router.post("", response_model=PlanRecord, status_code=status.HTTP_201_CREATED)
def create_plan(payload: PlanCreateRequest) -> PlanRecord:
    store = get_plan_store()
    reservation_hints = extract_reservation_hints(
        notes=payload.xiaohongshu_notes,
        source_url=payload.xiaohongshu_link,
    )
    generated = build_plan_output(
        payload=payload,
        reservation_hints=reservation_hints,
        amap_service=get_amap_service(),
        weather_service=get_weather_service(),
    )
    return store.create(
        payload=payload,
        reservation_hints=reservation_hints,
        generated=generated,
    )


@router.get("/{plan_id}", response_model=PlanRecord)
def get_plan(plan_id: str) -> PlanRecord:
    store = get_plan_store()
    plan = store.get(plan_id)
    if not plan:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Plan not found")
    return plan
