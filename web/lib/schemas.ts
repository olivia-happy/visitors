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

export type WeatherSummary = {
  city_name: string;
  condition_summary: string;
  temperature_low_c: number | null;
  temperature_high_c: number | null;
  report_time: string | null;
  overview: string;
  clothing_tip: string | null;
  advisory_tags: string[];
};

export type ExecutionSummary = {
  headline: string;
  pace: string;
  transport_strategy: string;
  best_for: string[];
};

export type ReservationRisk = {
  poi_name: string;
  severity: string;
  reservation_channel: string | null;
  price_note: string | null;
  evidence_excerpt: string;
};

export type ParkingGuide = {
  poi_name: string;
  parking_difficulty: string;
  recommended_lot_name: string;
  walking_minutes: number;
  price_note: string | null;
  sort_mode: string;
};

export type HotelAreaRecommendation = {
  area_name: string;
  parking_convenience: string;
  parking_price_note: string | null;
  access_note: string;
  suitable_modes: string[];
  budget_band: string | null;
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
  entry_mode: "quick" | "xiaohongshu";
  travel_mode: "photo" | "citywalk" | "nature" | "garden_culture" | null;
  preference_tags: string[];
  parking_required: boolean;
  parking_sort: "distance" | "price" | null;
  max_walk_from_parking_minutes: number | null;
  stay_preference: string | null;
  interest_tags: string[];
  special_requirements: string | null;
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
  weather_summary: WeatherSummary | null;
  execution_summary: ExecutionSummary | null;
  reservation_risks: ReservationRisk[];
  parking_guides: ParkingGuide[];
  hotel_area_recommendations: HotelAreaRecommendation[];
  graph: PlanGraph;
  created_at: string;
  reservation_hints: ReservationHint[];
};
