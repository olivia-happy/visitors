const cityAliases = {
  suzhou: {
    "zh-CN": "苏州",
    en: "Suzhou",
  },
  city: {
    "zh-CN": "城市",
    en: "City",
  },
};

export function buildExportSections(plan) {
  const sections = [
    "summary",
    "reservation_risks",
    "execution_route",
    "budget",
  ];

  if (plan?.parking_required) {
    sections.push("parking_guides", "hotel_areas");
  }

  return sections;
}

export function buildExportBudgetSummary(budgetItems = []) {
  return budgetItems.reduce(
    (summary, item) => ({
      low: summary.low + (item.amount_low ?? 0),
      high: summary.high + (item.amount_high ?? 0),
    }),
    { low: 0, high: 0 },
  );
}

export function buildExportTitle(plan, language = "zh-CN") {
  const city = formatCityName(plan?.city, language);
  const days = plan?.days ?? 1;

  if (language === "en") {
    return `${city} · ${days}-day print sheet`;
  }

  return `${city} · ${days} 天执行分享页`;
}

function formatCityName(city, language) {
  const normalized = String(city ?? "").trim();
  const alias = cityAliases[normalized.toLowerCase()];
  if (alias) {
    return alias[language] ?? alias["zh-CN"];
  }

  return normalized || cityAliases.city[language] || cityAliases.city["zh-CN"];
}
