const DRIVE_TRANSPORT_MODES = new Set(["drive", "car", "self_drive"]);
const DEFAULT_MAX_WALK_MINUTES = 30;
const DEFAULT_OUTPUT_LANGUAGE = "zh-CN";

/** @typedef {"zh-CN" | "en"} OutputLanguage */
/** @typedef {"quick" | "xiaohongshu"} EntryMode */
/** @typedef {"suzhou"} WizardPresetId */

const wizardPresetBaseById = {
  suzhou: {
    days: "2",
    budgetMin: "1200",
    budgetMax: "2000",
    transportPreferences: ["drive", "metro"],
    travelMode: "photo",
    preferenceTags: ["food", "photo_ready", "night_view"],
    interestTags: ["museum", "citywalk", "garden"],
    xiaohongshuLink: "https://www.xiaohongshu.com/example",
    parkingSort: "distance",
    maxWalkFromParkingMinutes: String(DEFAULT_MAX_WALK_MINUTES),
  },
};

const wizardPresetCopyById = {
  suzhou: {
    "zh-CN": {
      city: "苏州",
      stayPreference: "精品酒店",
      specialRequirements: "学生票优先，少走一点，保留夜景时段",
      xiaohongshuNotes:
        "苏州博物馆虽然免费，但是要提前很久预约，公众号预约。平江路更适合下午慢逛，夜景留到山塘街。",
    },
    en: {
      city: "Suzhou",
      stayPreference: "Boutique hotel",
      specialRequirements:
        "Student fares first, shorter walks, keep a night-view slot.",
      xiaohongshuNotes:
        "Suzhou Museum is free, but it usually needs advance booking through the official account. Pingjiang Road works better for a slower afternoon walk, and Shantang Street is better saved for night views.",
    },
  },
};

const baseWizardState = {
  currentStep: 1,
  entryMode: "quick",
  city: "",
  days: "",
  budgetMin: "",
  budgetMax: "",
  transportPreferences: ["metro"],
  travelMode: "photo",
  preferenceTags: [],
  interestTags: [],
  stayPreference: "",
  specialRequirements: "",
  xiaohongshuLink: "",
  xiaohongshuNotes: "",
  outputLanguage: DEFAULT_OUTPUT_LANGUAGE,
  parkingSort: "distance",
  maxWalkFromParkingMinutes: String(DEFAULT_MAX_WALK_MINUTES),
};

export function shouldShowParkingFields(transportPreferences = []) {
  return transportPreferences.some((item) =>
    DRIVE_TRANSPORT_MODES.has(String(item).toLowerCase()),
  );
}

/**
 * @param {{
 *   entryMode?: EntryMode;
 *   outputLanguage?: OutputLanguage;
 *   preset?: WizardPresetId | "demo" | "showcase";
 * }} [options]
 */
export function getInitialWizardState({
  entryMode = "quick",
  outputLanguage = DEFAULT_OUTPUT_LANGUAGE,
  preset,
} = {}) {
  const state = createBaseWizardState({
    entryMode,
    outputLanguage,
  });
  const normalizedPreset = normalizeWizardPreset(preset);

  if (!normalizedPreset) {
    return state;
  }

  return applyWizardPreset(state, normalizedPreset);
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

export function validateCoreTripInputs(
  formState,
  outputLanguage = DEFAULT_OUTPUT_LANGUAGE,
) {
  const messages = getValidationMessages(outputLanguage);
  const fieldErrors = {};
  const city = String(formState?.city ?? "").trim();
  const daysValue = String(formState?.days ?? "").trim();
  const days = Number(daysValue);
  const budgetMin = parseOptionalNumber(formState?.budgetMin);
  const budgetMax = parseOptionalNumber(formState?.budgetMax);

  if (!city) {
    fieldErrors.city = messages.cityRequired;
  }

  if (!daysValue) {
    fieldErrors.days = messages.daysRequired;
  } else if (!Number.isInteger(days) || days < 1 || days > 14) {
    fieldErrors.days = messages.daysRange;
  }

  return {
    fieldErrors,
    formError:
      budgetMin !== null && budgetMax !== null && budgetMax < budgetMin
        ? messages.budgetRange
        : null,
  };
}

function normalizeEntryMode(entryMode) {
  return entryMode === "xiaohongshu" ? "xiaohongshu" : "quick";
}

function normalizeOutputLanguage(outputLanguage) {
  return outputLanguage === "en" ? "en" : DEFAULT_OUTPUT_LANGUAGE;
}

function normalizeWizardPreset(preset) {
  if (preset === "showcase" || preset === "demo") {
    return "suzhou";
  }

  return preset === "suzhou" ? "suzhou" : null;
}

function createBaseWizardState({
  entryMode = "quick",
  outputLanguage = DEFAULT_OUTPUT_LANGUAGE,
} = {}) {
  const normalizedEntryMode = normalizeEntryMode(entryMode);

  return {
    ...baseWizardState,
    entryMode: normalizedEntryMode,
    outputLanguage: normalizeOutputLanguage(outputLanguage),
    currentStep: normalizedEntryMode === "xiaohongshu" ? 3 : 1,
  };
}

function applyWizardPreset(state, presetId) {
  const presetBase = wizardPresetBaseById[presetId];
  const presetCopy =
    wizardPresetCopyById[presetId]?.[normalizeOutputLanguage(state.outputLanguage)];

  if (!presetBase || !presetCopy) {
    return state;
  }

  return {
    ...state,
    ...presetBase,
    ...presetCopy,
  };
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

function getValidationMessages(outputLanguage) {
  if (outputLanguage === "en") {
    return {
      cityRequired: "Enter the destination city first.",
      daysRequired: "Enter the number of travel days first.",
      daysRange: "Travel days must be between 1 and 14.",
      budgetRange: "Budget ceiling cannot be lower than the budget floor.",
    };
  }

  return {
    cityRequired: "先填写要去的国内城市。",
    daysRequired: "先填写旅行天数。",
    daysRange: "旅行天数需要在 1 到 14 天之间。",
    budgetRange: "预算上限不能低于预算下限。",
  };
}
