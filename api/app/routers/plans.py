from fastapi import APIRouter, HTTPException, status

from app.services.amap_service import get_amap_service
from app.schemas.plan import (
    EvidencePreviewRequest,
    EvidencePreviewResponse,
    PlanCreateRequest,
    PlanRecord,
    ReservationHint,
)
from app.services.planner import build_plan_output
from app.services.plan_store import get_plan_store
from app.services.reservation_hint_service import extract_reservation_hints
from app.services.weather_service import get_weather_service
from app.services.xiaohongshu_service import get_xiaohongshu_service


router = APIRouter(prefix="/plans", tags=["plans"])


@router.get("/ping")
def ping_plans() -> dict[str, str]:
    return {"status": "pending"}


@router.post("/evidence-preview", response_model=EvidencePreviewResponse)
def preview_evidence(payload: EvidencePreviewRequest) -> EvidencePreviewResponse:
    source_url, notes, reservation_hints = _resolve_evidence(
        link=payload.xiaohongshu_link,
        notes=payload.xiaohongshu_notes,
    )
    has_input = bool(payload.xiaohongshu_link or payload.xiaohongshu_notes)
    message = _build_preview_message(
        has_input=has_input,
        hint_count=len(reservation_hints),
        output_language=payload.output_language,
    )

    return EvidencePreviewResponse(
        source_url=source_url,
        resolved_notes=notes,
        reservation_hints=reservation_hints,
        message=message,
    )


@router.post("", response_model=PlanRecord, status_code=status.HTTP_201_CREATED)
def create_plan(payload: PlanCreateRequest) -> PlanRecord:
    store = get_plan_store()
    source_url, notes, reservation_hints = _resolve_evidence(
        link=payload.xiaohongshu_link,
        notes=payload.xiaohongshu_notes,
    )
    resolved_payload = payload.model_copy(
        update={
            "xiaohongshu_link": source_url or payload.xiaohongshu_link,
            "xiaohongshu_notes": notes or payload.xiaohongshu_notes,
        }
    )
    generated = build_plan_output(
        payload=resolved_payload,
        reservation_hints=reservation_hints,
        amap_service=get_amap_service(),
        weather_service=get_weather_service(),
    )
    return store.create(
        payload=resolved_payload,
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


def _resolve_evidence(
    link: str | None,
    notes: str | None,
) -> tuple[str | None, str | None, list[ReservationHint]]:
    xiaohongshu_evidence = get_xiaohongshu_service().resolve_evidence(
        link=link,
        notes=notes,
    )
    source_url = xiaohongshu_evidence.source_url or link
    resolved_notes = xiaohongshu_evidence.notes or notes
    hint_source_url = source_url or (
        "manual://xiaohongshu-notes" if resolved_notes else None
    )
    reservation_hints = extract_reservation_hints(
        notes=resolved_notes,
        source_url=hint_source_url,
    )

    return source_url, resolved_notes, reservation_hints


def _build_preview_message(
    has_input: bool,
    hint_count: int,
    output_language: str,
) -> str:
    if output_language == "en":
        if not has_input:
            return "Paste a Xiaohongshu link or evidence excerpt first."
        if hint_count == 0:
            return "No explicit reservation requirement was detected yet."
        return f"Found {hint_count} reservation-sensitive stop."

    if not has_input:
        return "先粘贴小红书链接或证据摘录。"
    if hint_count == 0:
        return "暂未识别到明确预约要求。"
    return f"已识别 {hint_count} 个需要关注预约的点位。"
