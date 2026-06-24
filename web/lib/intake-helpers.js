const DRIVE_TRANSPORT_MODES = new Set(["drive", "car", "self_drive"]);
const DEFAULT_MAX_WALK_MINUTES = 30;

const baseWizardState = {
  currentStep: 1,
  entryMode: "quick",
  city: "Suzhou",
  days: "2",
  budgetMin: "1200",
  budgetMax: "2000",
  transportPreferences: ["metro"],
  travelMode: "photo",
  preferenceTags: ["food", "photo_ready"],
  interestTags: ["museum", "citywalk"],
  stayPreference: "boutique_hotel",
  specialRequirements: "low walking intensity",
  xiaohongshuLink: "",
  xiaohongshuNotes: "",
  outputLanguage: "zh-CN",
  parkingSort: "distance",
  maxWalkFromParkingMinutes: String(DEFAULT_MAX_WALK_MINUTES),
};

export function shouldShowParkingFields(transportPreferences = []) {
  return transportPreferences.some((item) =>
    DRIVE_TRANSPORT_MODES.has(String(item).toLowerCase()),
  );
}

export function getInitialWizardState({ entryMode = "quick" } = {}) {
  const normalizedEntryMode = normalizeEntryMode(entryMode);
  return {
    ...baseWizardState,
    entryMode: normalizedEntryMode,
    currentStep: normalizedEntryMode === "xiaohongshu" ? 3 : 1,
    xiaohongshuNotes:
      normalizedEntryMode === "xiaohongshu"
        ? "苏州博物馆虽然免费但是要提前很久预约，公众号预约。"
        : "",
  };
}

export function buildPlanPayload(formState) {
  const transportPreferences = normalizeStringArray(
    formState.transportPreferences,
  );
  const parkingRequired = shouldShowParkingFields(transportPreferences);
  const walkMinutes =
    parseOptionalNumber(formState.maxWalkFromParkingMinutes) ??
    DEFAULT_MAX_WALK_MINUTES;

  return {
    city: String(formState.city ?? "").trim(),
    days: Number(formState.days),
    budget_min: parseOptionalNumber(formState.budgetMin),
    budget_max: parseOptionalNumber(formState.budgetMax),
    transport_preferences: transportPreferences,
    entry_mode: normalizeEntryMode(formState.entryMode),
    travel_mode: toNullableString(formState.travelMode),
    preference_tags: normalizeStringArray(formState.preferenceTags),
    stay_preference: toNullableString(formState.stayPreference),
    interest_tags: normalizeStringArray(formState.interestTags),
    special_requirements: toNullableString(formState.specialRequirements),
    xiaohongshu_link: toNullableString(formState.xiaohongshuLink),
    xiaohongshu_notes: toNullableString(formState.xiaohongshuNotes),
    output_language: formState.outputLanguage === "en" ? "en" : "zh-CN",
    parking_required: parkingRequired,
    parking_sort: parkingRequired
      ? normalizeParkingSort(formState.parkingSort)
      : null,
    max_walk_from_parking_minutes: parkingRequired ? walkMinutes : null,
  };
}

function normalizeEntryMode(entryMode) {
  return entryMode === "xiaohongshu" ? "xiaohongshu" : "quick";
}

function normalizeParkingSort(parkingSort) {
  return parkingSort === "price" ? "price" : "distance";
}

function normalizeStringArray(value) {
  if (!value) {
    return [];
  }

  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }

  return String(value)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseOptionalNumber(value) {
  const trimmed = String(value ?? "").trim();
  if (!trimmed) {
    return null;
  }

  const parsed = Number(trimmed);
  return Number.isNaN(parsed) ? null : parsed;
}

function toNullableString(value) {
  const trimmed = String(value ?? "").trim();
  return trimmed ? trimmed : null;
}
