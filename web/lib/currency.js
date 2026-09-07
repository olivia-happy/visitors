import { getFallbackExchangeRateSnapshot } from "./exchange-rate.js";

const ENGLISH_ONSITE_RATE_NOTE = "Refer to on-site posted rates.";
const CHINESE_ONSITE_RATE_NOTE = "以现场公示为准";

export function normalizeExchangeRateSnapshot(snapshot) {
  return snapshot ?? getFallbackExchangeRateSnapshot();
}

export function convertCnyToUsd(amountCny, snapshot) {
  return Number(amountCny ?? 0) * normalizeExchangeRateSnapshot(snapshot).usdPerCny;
}

export function formatBudgetAmount(
  amountCny,
  language,
  snapshot,
  options = {},
) {
  const safeAmount = Number(amountCny ?? 0);
  const maximumFractionDigits = options.maximumFractionDigits ?? 0;
  const minimumFractionDigits =
    options.minimumFractionDigits ?? maximumFractionDigits;
  const rawAmount =
    language === "en" ? convertCnyToUsd(safeAmount, snapshot) : safeAmount;
  const roundedAmount = roundTo(rawAmount, maximumFractionDigits);
  const locale = language === "en" ? "en-US" : "zh-CN";
  const symbol = language === "en" ? "$" : "￥";

  return `${symbol}${new Intl.NumberFormat(locale, {
    minimumFractionDigits,
    maximumFractionDigits,
  }).format(roundedAmount)}`;
}

export function formatBudgetRange(lowCny, highCny, language, snapshot) {
  return `${formatBudgetAmount(lowCny, language, snapshot)} - ${formatBudgetAmount(
    highCny,
    language,
    snapshot,
  )}`;
}

export function formatPriceNote(priceNote, language, snapshot) {
  const normalized = String(priceNote ?? "").trim();
  if (!normalized) {
    return null;
  }

  if (normalized === "免费" || normalized === "Free") {
    return language === "en" ? "Free" : "免费";
  }

  if (
    normalized === CHINESE_ONSITE_RATE_NOTE ||
    normalized === ENGLISH_ONSITE_RATE_NOTE
  ) {
    return language === "en" ? ENGLISH_ONSITE_RATE_NOTE : CHINESE_ONSITE_RATE_NOTE;
  }

  if (language === "en") {
    return normalized
      .replace(
        /About\s+RMB\s*(\d+(?:\.\d+)?)\s*\/\s*hour/giu,
        (_, amount) =>
          `About ${formatBudgetAmount(Number(amount), "en", snapshot, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}/hour`,
      )
      .replace(
        /RMB\s*(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)\s*\/\s*hour/giu,
        (_, low, high) =>
          `${formatBudgetAmount(Number(low), "en", snapshot, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}-${formatBudgetAmount(Number(high), "en", snapshot, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}/hour`,
      )
      .replace(
        /RMB\s*(\d+(?:\.\d+)?)\s*\/\s*hour/giu,
        (_, amount) =>
          `${formatBudgetAmount(Number(amount), "en", snapshot, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}/hour`,
      );
  }

  return normalized
    .replace(
      /约\s*(\d+(?:\.\d+)?)\s*元\s*\/\s*小时/gu,
      (_, amount) =>
        `约 ${formatBudgetAmount(Number(amount), "zh-CN", snapshot, {
          minimumFractionDigits: 0,
          maximumFractionDigits: 2,
        })}/小时`,
    )
    .replace(
      /(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)\s*元\s*\/\s*小时/gu,
      (_, low, high) =>
        `${formatBudgetAmount(Number(low), "zh-CN", snapshot, {
          minimumFractionDigits: 0,
          maximumFractionDigits: 2,
        })}-${formatBudgetAmount(Number(high), "zh-CN", snapshot, {
          minimumFractionDigits: 0,
          maximumFractionDigits: 2,
        })}/小时`,
    )
    .replace(
      /(\d+(?:\.\d+)?)\s*元\s*\/\s*小时/gu,
      (_, amount) =>
        `${formatBudgetAmount(Number(amount), "zh-CN", snapshot, {
          minimumFractionDigits: 0,
          maximumFractionDigits: 2,
        })}/小时`,
    );
}

export function applyCurrencyDisplayToPlan(plan, language, snapshot) {
  if (!plan) {
    return plan;
  }

  return {
    ...plan,
    timeline: Array.isArray(plan.timeline)
      ? plan.timeline.map((item) => ({
          ...item,
          reservation_hint: item.reservation_hint
            ? {
                ...item.reservation_hint,
                price_note: formatPriceNote(
                  item.reservation_hint.price_note,
                  language,
                  snapshot,
                ),
              }
            : null,
        }))
      : plan.timeline,
    reservation_risks: Array.isArray(plan.reservation_risks)
      ? plan.reservation_risks.map((risk) => ({
          ...risk,
          price_note: formatPriceNote(risk.price_note, language, snapshot),
        }))
      : plan.reservation_risks,
    parking_guides: Array.isArray(plan.parking_guides)
      ? plan.parking_guides.map((guide) => ({
          ...guide,
          price_note: formatPriceNote(guide.price_note, language, snapshot),
        }))
      : plan.parking_guides,
    hotel_area_recommendations: Array.isArray(plan.hotel_area_recommendations)
      ? plan.hotel_area_recommendations.map((area) => ({
          ...area,
          parking_price_note: formatPriceNote(
            area.parking_price_note,
            language,
            snapshot,
          ),
        }))
      : plan.hotel_area_recommendations,
    reservation_hints: Array.isArray(plan.reservation_hints)
      ? plan.reservation_hints.map((hint) => ({
          ...hint,
          price_note: formatPriceNote(hint.price_note, language, snapshot),
        }))
      : plan.reservation_hints,
  };
}

export function formatExchangeRateNote(language, snapshot) {
  const meta = formatExchangeRateMeta(language, snapshot);
  return `${meta.badge} · ${meta.detail}`;
}

export function formatExchangeRateMeta(language, snapshot) {
  const normalizedSnapshot = normalizeExchangeRateSnapshot(snapshot);
  const cnyPerUsd = new Intl.NumberFormat("zh-CN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(roundTo(normalizedSnapshot.cnyPerUsd, 2));
  const usdPerCny = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 4,
    maximumFractionDigits: 4,
  }).format(roundTo(normalizedSnapshot.usdPerCny, 4));

  if (language === "en") {
    return {
      badge: "Live FX",
      boardTitle: "FX intelligence",
      detail: normalizedSnapshot.rateDate,
      summary: `1 USD ≈ ￥${cnyPerUsd} · 1 CNY ≈ $${usdPerCny}`,
      sourceDetail: `Source · ${normalizedSnapshot.sourceLabel}`,
      actionLabel: "Refresh FX",
      loadingLabel: "Refreshing...",
      successLabel: "FX updated",
      errorLabel: "FX refresh failed",
    };
  }

  return {
    badge: "汇率更新",
    boardTitle: "实时汇率情报",
    detail: normalizedSnapshot.rateDate,
    summary: `1 美元 ≈ ￥${cnyPerUsd}`,
    sourceDetail: `来源 · ${normalizedSnapshot.sourceLabel}`,
    actionLabel: "刷新汇率",
    loadingLabel: "刷新中...",
    successLabel: "汇率已更新",
    errorLabel: "汇率刷新失败",
  };
}

function roundTo(value, digits) {
  const factor = 10 ** digits;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}
