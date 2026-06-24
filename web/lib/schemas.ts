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
  created_at: string;
  reservation_hints: ReservationHint[];
};

