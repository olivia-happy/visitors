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


class TimelineItem(BaseModel):
    day_index: int
    start_time: str
    end_time: str
    title: str
    transport_mode: str
    transport_duration_minutes: int
    notes: str
    reservation_hint: ReservationHint | None = None


class MapPoint(BaseModel):
    name: str
    lat: float
    lng: float
    day_index: int
    sequence_no: int


class BudgetItem(BaseModel):
    category: str
    amount_low: int
    amount_high: int
    is_adjustable: bool = True


class ChecklistItem(BaseModel):
    category: str
    item_name: str
    reason: str


class GraphNode(BaseModel):
    id: str
    label: str
    type: str


class GraphEdge(BaseModel):
    source: str
    target: str
    label: str | None = None


class PlanGraph(BaseModel):
    nodes: list[GraphNode] = Field(default_factory=list)
    edges: list[GraphEdge] = Field(default_factory=list)


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
    summary: str
    timeline: list[TimelineItem] = Field(default_factory=list)
    map_points: list[MapPoint] = Field(default_factory=list)
    budget_items: list[BudgetItem] = Field(default_factory=list)
    checklist_items: list[ChecklistItem] = Field(default_factory=list)
    graph: PlanGraph = Field(default_factory=PlanGraph)
    reservation_hints: list[ReservationHint] = Field(default_factory=list)
    created_at: datetime
