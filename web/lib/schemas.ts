export type OutputLanguage = "zh-CN" | "en";

export type ReservationHint = {
  poi_name: string;
  reminder_text: string;
  reservation_channel: string | null;
  price_note: string | null;
  source_url: string;
  source_type: string;
  confidence: number;
  evidence_excerpt: string;
};

export type TimelineItem = {
  day_index: number;
  start_time: string;
  end_time: string;
  title: string;
  transport_mode: string;
  transport_duration_minutes: number;
  notes: string;
  reservation_hint: ReservationHint | null;
};

export type MapPoint = {
  name: string;
  lat: number;
  lng: number;
  day_index: number;
  sequence_no: number;
};

export type BudgetItem = {
  category: string;
  amount_low: number;
  amount_high: number;
  is_adjustable: boolean;
};

export type ChecklistItem = {
  category: string;
  item_name: string;
  reason: string;
};

export type GraphNode = {
  id: string;
  label: string;
  type: string;
};

export type GraphEdge = {
  source: string;
  target: string;
  label: string | null;
};

export type PlanGraph = {
  nodes: GraphNode[];
  edges: GraphEdge[];
};

export type PlanInput = {
  city: string;
  days: number;
  budget_min: number | null;
  budget_max: number | null;
  transport_preferences: string[];
  stay_preference: string;
  interest_tags: string[];
  special_requirements: string;
  xiaohongshu_link: string | null;
  xiaohongshu_notes: string | null;
  output_language: OutputLanguage;
};

export type PlanDraft = PlanInput & {
  id: string;
  status: string;
  summary: string;
  timeline: TimelineItem[];
  map_points: MapPoint[];
  budget_items: BudgetItem[];
  checklist_items: ChecklistItem[];
  graph: PlanGraph;
  created_at: string;
  reservation_hints: ReservationHint[];
};
