import { applyCurrencyDisplayToPlan } from "./currency.js";
import {
  formatPlanCityName,
  localizePlanDraft,
  resolvePlanLanguage,
} from "./plan-localizations.js";
import { buildViewHref } from "./view-state.js";

const transportModeLabels = {
  drive: {
    "zh-CN": "自驾",
    en: "Drive",
  },
  metro: {
    "zh-CN": "地铁",
    en: "Metro",
  },
  walk: {
    "zh-CN": "步行",
    en: "Walk",
  },
  taxi: {
    "zh-CN": "打车",
    en: "Taxi",
  },
  bus: {
    "zh-CN": "公交",
    en: "Bus",
  },
  high_speed_rail: {
    "zh-CN": "高铁",
    en: "High-speed rail",
  },
};

const severityLabels = {
  high: {
    "zh-CN": "高",
    en: "High",
  },
  medium: {
    "zh-CN": "中",
    en: "Medium",
  },
  low: {
    "zh-CN": "低",
    en: "Low",
  },
};

function pickExecutionHeadline(plan, language) {
  return (
    plan?.execution_summary?.headline ??
    plan?.summary ??
    (language === "en"
      ? "VisitFlow generated a structured travel plan."
      : "Visitors 已生成结构化行程方案。")
  );
}

function formatRoutePreview(timeline = [], dayIndex = 1) {
  return timeline
    .filter((item) => item.day_index === dayIndex)
    .slice(0, 3)
    .map((item) => `${item.start_time} ${item.title}`)
    .join(" -> ");
}

function formatTransportModeLabel(transportMode, language) {
  const key = String(transportMode ?? "").toLowerCase();
  return transportModeLabels[key]?.[language] ?? transportMode;
}

function formatSeverityLabel(severity, language) {
  const key = String(severity ?? "").toLowerCase();
  return severityLabels[key]?.[language] ?? severity;
}

export function buildShareViewHref(planId, mode = "live", viewState) {
  const baseHref =
    mode === "showcase" ? "/showcase/share" : `/plan/${planId}/share`;

  if (viewState) {
    return buildViewHref(baseHref, viewState);
  }

  return baseHref;
}

export function buildPlanSharePayload(
  plan,
  url,
  languageOverride,
  exchangeRateSnapshot,
) {
  const language = resolvePlanLanguage(plan, languageOverride);
  const displayPlan = applyCurrencyDisplayToPlan(
    localizePlanDraft(plan, language),
    language,
    exchangeRateSnapshot,
  );
  const city = formatPlanCityName(displayPlan?.city, language);
  const days = displayPlan?.days ?? 1;
  const title =
    language === "en"
      ? `${city} ${days}-day travel plan`
      : `${city} ${days} 天游玩计划`;
  const bestFor = displayPlan?.execution_summary?.best_for?.length
    ? language === "en"
      ? `Best for: ${displayPlan.execution_summary.best_for.join(" / ")}`
      : `适合：${displayPlan.execution_summary.best_for.join(" / ")}`
    : "";
  const routePreview = formatRoutePreview(displayPlan?.timeline ?? []);

  const text = [
    language === "en" ? `${city} ${days}-day route` : `${city} ${days} 天游玩路线`,
    pickExecutionHeadline(displayPlan, language),
    bestFor,
    routePreview
      ? language === "en"
        ? `Day 1 route: ${routePreview}`
        : `第 1 天路线：${routePreview}`
      : "",
  ]
    .filter(Boolean)
    .join("\n");

  return {
    title,
    text,
    url,
  };
}

export function buildReservationChecklistText(
  plan,
  languageOverride,
  exchangeRateSnapshot,
) {
  const language = resolvePlanLanguage(plan, languageOverride);
  const displayPlan = applyCurrencyDisplayToPlan(
    localizePlanDraft(plan, language),
    language,
    exchangeRateSnapshot,
  );
  const city = formatPlanCityName(displayPlan?.city, language);
  const risks = displayPlan?.reservation_risks ?? [];
  if (!risks.length) {
    return language === "en"
      ? "No clear reservation evidence is available yet.\nPlease verify the official booking channel again before departure."
      : "当前还没有提取到明确的预约证据。\n出发前请再次核对官方预约渠道。";
  }

  const lines = [
    language === "en" ? `${city} reservation checklist` : `${city}预约清单`,
    ...risks.map((risk, index) =>
      [
        `${index + 1}. ${risk.poi_name}`,
        language === "en"
          ? `Risk level: ${formatSeverityLabel(risk.severity, language)}`
          : `风险等级：${formatSeverityLabel(risk.severity, language)}`,
        risk.reservation_channel
          ? language === "en"
            ? `Channel: ${risk.reservation_channel}`
            : `渠道：${risk.reservation_channel}`
          : "",
        risk.price_note
          ? language === "en"
            ? `Price: ${risk.price_note}`
            : `价格：${risk.price_note}`
          : "",
        language === "en"
          ? `Evidence: ${risk.evidence_excerpt}`
          : `证据摘录：${risk.evidence_excerpt}`,
      ]
        .filter(Boolean)
        .join("\n"),
    ),
    language === "en"
      ? "Please verify the official booking channel, price, and release timing again before departure."
      : "出发前请再次核对官方预约渠道、价格和放票时间。",
  ];

  return lines.join("\n\n");
}

export function buildTodayRouteText(
  plan,
  dayIndex = 1,
  languageOverride,
  exchangeRateSnapshot,
) {
  const language = resolvePlanLanguage(plan, languageOverride);
  const displayPlan = applyCurrencyDisplayToPlan(
    localizePlanDraft(plan, language),
    language,
    exchangeRateSnapshot,
  );
  const city = formatPlanCityName(displayPlan?.city, language);
  const dayItems = (displayPlan?.timeline ?? []).filter(
    (item) => item.day_index === dayIndex,
  );

  if (!dayItems.length) {
    return language === "en"
      ? `Day ${dayIndex} route data is not available yet.`
      : `第 ${dayIndex} 天暂时没有路线数据。`;
  }

  const lines = [
    language === "en" ? `${city} Day ${dayIndex} route` : `${city}第 ${dayIndex} 天路线`,
    pickExecutionHeadline(displayPlan, language),
    ...dayItems.map((item) =>
      [
        `${item.start_time}-${item.end_time}`,
        item.title,
        formatTransportModeLabel(item.transport_mode, language),
        language === "en"
          ? `${item.transport_duration_minutes} min`
          : `${item.transport_duration_minutes} 分钟`,
        item.notes,
      ].join(" · "),
    ),
  ];

  return lines.join("\n");
}
