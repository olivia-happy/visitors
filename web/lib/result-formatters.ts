import type { OutputLanguage } from "./schemas";

const cityAliases: Record<string, { "zh-CN": string; en: string }> = {
  suzhou: {
    "zh-CN": "苏州",
    en: "Suzhou",
  },
  city: {
    "zh-CN": "城市",
    en: "City",
  },
};

const entryModeLabels = {
  quick: {
    "zh-CN": "快速入口",
    en: "Quick route",
  },
  xiaohongshu: {
    "zh-CN": "小红书证据入口",
    en: "Xiaohongshu evidence",
  },
} as const;

const travelModeLabels = {
  photo: {
    "zh-CN": "出片",
    en: "Photo-led",
  },
  citywalk: {
    "zh-CN": "城市漫游",
    en: "Citywalk",
  },
  nature: {
    "zh-CN": "自然",
    en: "Nature",
  },
  garden_culture: {
    "zh-CN": "园林",
    en: "Gardens",
  },
} as const;

const transportModeLabels: Record<string, { "zh-CN": string; en: string }> = {
  high_speed_rail: {
    "zh-CN": "高铁",
    en: "High-speed rail",
  },
  metro: {
    "zh-CN": "地铁",
    en: "Metro",
  },
  drive: {
    "zh-CN": "自驾",
    en: "Drive",
  },
  taxi: {
    "zh-CN": "打车",
    en: "Taxi",
  },
  walk: {
    "zh-CN": "步行",
    en: "Walk",
  },
};

const budgetCategoryLabels: Record<
  string,
  { "zh-CN": string; en: string }
> = {
  tickets: {
    "zh-CN": "门票",
    en: "Tickets",
  },
  food: {
    "zh-CN": "餐饮",
    en: "Food",
  },
  stay: {
    "zh-CN": "住宿",
    en: "Stay",
  },
  local_transport: {
    "zh-CN": "市内交通",
    en: "Local transport",
  },
};

const checklistCategoryLabels: Record<
  string,
  { "zh-CN": string; en: string }
> = {
  documents: {
    "zh-CN": "证件",
    en: "Documents",
  },
  weather: {
    "zh-CN": "天气",
    en: "Weather",
  },
};

const weatherTagLabels: Record<string, { "zh-CN": string; en: string }> = {
  rain: {
    "zh-CN": "防雨",
    en: "Rain prep",
  },
  sun: {
    "zh-CN": "防晒",
    en: "Sun protection",
  },
  layering: {
    "zh-CN": "叠穿",
    en: "Layering",
  },
};

const parkingSortLabels = {
  distance: {
    "zh-CN": "距离优先",
    en: "Distance first",
  },
  price: {
    "zh-CN": "价格优先",
    en: "Price first",
  },
} as const;

const severityLabels: Record<string, { "zh-CN": string; en: string }> = {
  high: {
    "zh-CN": "高风险",
    en: "High risk",
  },
  medium: {
    "zh-CN": "中风险",
    en: "Medium risk",
  },
  low: {
    "zh-CN": "低风险",
    en: "Low risk",
  },
};

const paceLabels: Record<string, { "zh-CN": string; en: string }> = {
  balanced: {
    "zh-CN": "平衡节奏",
    en: "Balanced",
  },
  relaxed: {
    "zh-CN": "轻松",
    en: "Relaxed",
  },
  compact: {
    "zh-CN": "紧凑",
    en: "Compact",
  },
};

const graphNodeTypeLabels: Record<
  string,
  { "zh-CN": string; en: string }
> = {
  city: {
    "zh-CN": "城市",
    en: "City",
  },
  day: {
    "zh-CN": "日期块",
    en: "Day block",
  },
  attraction: {
    "zh-CN": "景点",
    en: "Attraction",
  },
  budget: {
    "zh-CN": "预算",
    en: "Budget",
  },
  reservation: {
    "zh-CN": "预约",
    en: "Reservation",
  },
};

const graphEdgeLabels: Record<string, { "zh-CN": string; en: string }> = {
  contains: {
    "zh-CN": "包含",
    en: "Contains",
  },
  visit: {
    "zh-CN": "到访",
    en: "Visit",
  },
  budget: {
    "zh-CN": "预算归属",
    en: "Budget link",
  },
  reserve: {
    "zh-CN": "预约依赖",
    en: "Reservation link",
  },
};

const budgetBandLabels: Record<string, { "zh-CN": string; en: string }> = {
  mid: {
    "zh-CN": "中档",
    en: "Mid-range",
  },
  upper_mid: {
    "zh-CN": "中高档",
    en: "Upper mid-range",
  },
};

export function formatCityName(city: string | null | undefined, language: OutputLanguage) {
  const normalized = String(city ?? "").trim();
  const alias = cityAliases[normalized.toLowerCase()];
  if (alias) {
    return alias[language];
  }

  return normalized || cityAliases.city[language];
}

export function formatEntryMode(
  entryMode: string | null | undefined,
  language: OutputLanguage,
) {
  if (entryMode === "xiaohongshu") {
    return entryModeLabels.xiaohongshu[language];
  }

  return entryModeLabels.quick[language];
}

export function formatTravelMode(
  travelMode: string | null | undefined,
  language: OutputLanguage,
) {
  if (!travelMode) {
    return language === "en" ? "Pending" : "待补充";
  }

  return travelModeLabels[travelMode as keyof typeof travelModeLabels]?.[
    language
  ] ?? travelMode;
}

export function formatTransportMode(
  transportMode: string | null | undefined,
  language: OutputLanguage,
) {
  if (!transportMode) {
    return language === "en" ? "Transport pending" : "交通待补充";
  }

  return transportModeLabels[String(transportMode).toLowerCase()]?.[language] ??
    String(transportMode);
}

export function formatBudgetCategory(
  category: string | null | undefined,
  language: OutputLanguage,
) {
  if (!category) {
    return language === "en" ? "Category" : "分类";
  }

  return budgetCategoryLabels[category]?.[language] ??
    String(category).replaceAll("_", " ");
}

export function formatChecklistCategory(
  category: string | null | undefined,
  language: OutputLanguage,
) {
  if (!category) {
    return language === "en" ? "Category" : "分类";
  }

  return checklistCategoryLabels[category]?.[language] ?? String(category);
}

export function formatWeatherTag(
  tag: string | null | undefined,
  language: OutputLanguage,
) {
  if (!tag) {
    return language === "en" ? "Weather" : "天气";
  }

  return weatherTagLabels[tag]?.[language] ?? String(tag);
}

export function formatParkingSort(
  sortMode: string | null | undefined,
  language: OutputLanguage,
) {
  if (sortMode === "price") {
    return parkingSortLabels.price[language];
  }

  return parkingSortLabels.distance[language];
}

export function formatSeverity(
  severity: string | null | undefined,
  language: OutputLanguage,
) {
  if (!severity) {
    return language === "en" ? "Pending" : "待确认";
  }

  return severityLabels[String(severity).toLowerCase()]?.[language] ??
    String(severity);
}

export function formatExecutionPace(
  pace: string | null | undefined,
  language: OutputLanguage,
) {
  if (!pace) {
    return language === "en" ? "Pace pending" : "节奏待补充";
  }

  return paceLabels[String(pace).toLowerCase()]?.[language] ?? String(pace);
}

export function formatGraphNodeType(
  type: string | null | undefined,
  language: OutputLanguage,
) {
  if (!type) {
    return language === "en" ? "Node" : "节点";
  }

  return graphNodeTypeLabels[String(type).toLowerCase()]?.[language] ?? String(type);
}

export function formatGraphEdgeLabel(
  label: string | null | undefined,
  language: OutputLanguage,
) {
  if (!label) {
    return "";
  }

  return graphEdgeLabels[String(label).toLowerCase()]?.[language] ?? String(label);
}

export function formatBudgetBand(
  band: string | null | undefined,
  language: OutputLanguage,
) {
  if (!band) {
    return language === "en" ? "Budget band" : "预算档位";
  }

  return budgetBandLabels[String(band).toLowerCase()]?.[language] ?? String(band);
}
