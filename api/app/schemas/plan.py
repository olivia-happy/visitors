from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


class ReservationHint(BaseModel):
    poi_name: str
    reminder_text: str
    reservation_channel: str | None = None
    price_note: str | None = None
    source_url: str
    source_type: str = "xiaohongshu"
    confidence: float = 0.9
    evidence_excerpt: str


class PlanCreateRequest(BaseModel):
    city: str = Field(min_length=1)
    days: int = Field(gt=0, le=14)
    budget_min: int | None = Field(default=None, ge=0)
    budget_max: int | None = Field(default=None, ge=0)
    transport_preferences: list[str] = Field(default_factory=list)
    stay_preference: str | None = None
    interest_tags: list[str] = Field(default_factory=list)
    special_requirements: str | None = None
    xiaohongshu_link: str | None = None
    xiaohongshu_notes: str | None = None
    output_language: Literal["zh-CN", "en"] = "zh-CN"


class PlanRecord(BaseModel):
    id: str
    city: str
    days: int
    budget_min: int | None = None
    budget_max: int | None = None
    transport_preferences: list[str] = Field(default_factory=list)
    stay_preference: str | None = None
    interest_tags: list[str] = Field(default_factory=list)
    special_requirements: str | None = None
    xiaohongshu_link: str | None = None
    xiaohongshu_notes: str | None = None
    output_language: Literal["zh-CN", "en"] = "zh-CN"
    status: str = "draft"
    reservation_hints: list[ReservationHint] = Field(default_factory=list)
    created_at: datetime

