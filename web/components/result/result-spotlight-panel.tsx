"use client";

import { AmapPlanMap } from "@/components/map/amap-plan-map";
import {
  formatBudgetAmount,
  formatBudgetRange,
  formatExchangeRateNote,
} from "@/lib/currency";
import { buildExportBudgetSummary } from "@/lib/export-helpers";
import {
  formatBudgetBand,
  formatBudgetCategory,
  formatCityName,
  formatParkingSort,
  formatTransportMode,
  formatTravelMode,
  formatWeatherTag,
} from "@/lib/result-formatters";
import type {
  BudgetItem,
  ExchangeRateSnapshot,
  ExecutionSummary,
  HotelAreaRecommendation,
  MapPoint,
  OutputLanguage,
  ParkingGuide,
  TimelineItem,
  WeatherSummary,
} from "@/lib/schemas";

type ResultSpotlightPanelProps = {
  budgetItems: BudgetItem[];
  cityName: string;
  exchangeRateSnapshot: ExchangeRateSnapshot;
  executionSummary: ExecutionSummary | null;
  hotelAreas: HotelAreaRecommendation[];
  language: OutputLanguage;
  mapPoints: MapPoint[];
  parkingGuides: ParkingGuide[];
  timeline: TimelineItem[];
  weatherSummary: WeatherSummary | null;
};

const copyByLanguage = {
  "zh-CN": {
    kicker: "城市落地台",
    title: "把路线比例、停驻片区和花销边界压成一张到城图。",
    badges: {
      atlas: "到城视图",
      route: "{days} 天 · {points} 个落点",
      budget: "{value} 条预算线",
    },
    summary: {
      firstMove: "第一落点",
      anchor: "停驻锚点",
      budget: "最高支出",
      pending: "待补",
      window: "{start} - {end}",
    },
    map: {
      kicker: "空间比例地图",
      note: "路线按真实顺序缩成同屏参考，用来判断片区距离和转场密度。",
      pending: "时间窗待补",
    },
    arrival: {
      kicker: "停驻策略",
      emptyTitle: "先锁今晚回撤点",
      emptyBody:
        "酒店片区、停车场和第一段到达方式会直接影响你在城里的转场成本。",
      stay: "推荐片区",
      parking: "推荐停车场",
      walk: "步行距离",
      walkValue: "{value} 分钟",
      modes: "适配方式",
      ease: "停车便利",
      difficulty: "停车难度",
      sort: "排序方式",
      budgetBand: "住宿预算",
      price: "停车参考",
    },
    weather: {
      kicker: "天气信号",
      emptyTitle: "天气待补",
      emptyBody: "天气、温度和穿搭提醒会在拿到预报后落到这里。",
      clothing: "穿搭",
      reportTime: "更新时间 {value}",
      tempPending: "温度待补",
      tempUpTo: "最高 {value}C",
      tempAround: "约 {value}C",
      tempRange: "{low}-{high}C",
      tagsEmpty: "暂无天气标签",
    },
    budget: {
      kicker: "预算压强",
      total: "总预算边界",
      empty: "预算待补",
      adjustable: "可调",
      fixed: "相对固定",
      share: "占高位预算 {value}%",
    },
  },
  en: {
    kicker: "City arrival desk",
    title: "Compress route scale, stay anchors, and spend boundaries into one arrival sheet.",
    badges: {
      atlas: "Arrival view",
      route: "{days} days · {points} mapped stops",
      budget: "{value} budget lines",
    },
    summary: {
      firstMove: "First stop",
      anchor: "Stay anchor",
      budget: "Top spend",
      pending: "Pending",
      window: "{start} - {end}",
    },
    map: {
      kicker: "Spatial route map",
      note: "The route is compressed into one same-screen distance reference so the traveler can judge cluster spacing and transfer density.",
      pending: "Window pending",
    },
    arrival: {
      kicker: "Stay strategy",
      emptyTitle: "Lock the nightly return point first",
      emptyBody:
        "Stay area, parking lot, and the first arrival leg directly change the cost of moving across the city.",
      stay: "Recommended area",
      parking: "Recommended lot",
      walk: "Walk distance",
      walkValue: "{value} min",
      modes: "Best for",
      ease: "Parking ease",
      difficulty: "Parking difficulty",
      sort: "Sort mode",
      budgetBand: "Stay budget",
      price: "Parking note",
    },
    weather: {
      kicker: "Weather signal",
      emptyTitle: "Weather pending",
      emptyBody:
        "Forecast, temperature, and clothing guidance will land here once weather data is available.",
      clothing: "Wear",
      reportTime: "Updated {value}",
      tempPending: "Temp pending",
      tempUpTo: "Up to {value}C",
      tempAround: "Around {value}C",
      tempRange: "{low}-{high}C",
      tagsEmpty: "No weather tags yet",
    },
    budget: {
      kicker: "Budget pressure",
      total: "Total budget boundary",
      empty: "Budget pending",
      adjustable: "Adjustable",
      fixed: "Mostly fixed",
      share: "{value}% of the upper-bound budget",
    },
  },
} as const;

export function ResultSpotlightPanel({
  budgetItems,
  cityName,
  exchangeRateSnapshot,
  executionSummary,
  hotelAreas,
  language,
  mapPoints,
  parkingGuides,
  timeline,
  weatherSummary,
}: ResultSpotlightPanelProps) {
  const copy = copyByLanguage[language];
  const budgetSummary = buildExportBudgetSummary(budgetItems);
  const hasBudget = budgetItems.length > 0;
  const orderedTimeline = [...timeline].sort((left, right) => {
    if (left.day_index !== right.day_index) {
      return left.day_index - right.day_index;
    }

    const startDiff = left.start_time.localeCompare(right.start_time);
    if (startDiff !== 0) {
      return startDiff;
    }

    return left.end_time.localeCompare(right.end_time);
  });
  const firstTimelineItem = orderedTimeline[0] ?? null;
  const lastTimelineItem = orderedTimeline.at(-1) ?? null;
  const timeWindow =
    firstTimelineItem && lastTimelineItem
      ? copy.summary.window
          .replace("{start}", firstTimelineItem.start_time)
          .replace("{end}", lastTimelineItem.end_time)
      : copy.map.pending;
  const weatherText = formatTemperatureRange(copy.weather, weatherSummary);
  const weatherTags = weatherSummary?.advisory_tags ?? [];
  const dayCount = new Set(mapPoints.map((point) => point.day_index)).size;
  const mapPointCount = mapPoints.length;
  const topBudgetItem = [...budgetItems].sort(
    (left, right) => (right.amount_high ?? 0) - (left.amount_high ?? 0),
  )[0] ?? null;
  const topHotel = hotelAreas[0] ?? null;
  const topParking = parkingGuides[0] ?? null;
  const exchangeRateNote = formatExchangeRateNote(
    language,
    exchangeRateSnapshot,
  );
  const budgetCeiling = Math.max(
    1,
    ...budgetItems.map((item) => item.amount_high),
  );
  const arrivalTitle =
    topHotel?.area_name ??
    topParking?.recommended_lot_name ??
    firstTimelineItem?.title ??
    cityName;
  const arrivalBody =
    topHotel?.access_note ??
    (topParking
      ? `${topParking.poi_name} · ${topParking.parking_difficulty}`
      : executionSummary?.headline ?? copy.arrival.emptyBody);
  const arrivalDetails = buildArrivalDetails({
    copy,
    language,
    topHotel,
    topParking,
  });
  const transportHint =
    executionSummary?.transport_strategy ??
    formatTransportMode(firstTimelineItem?.transport_mode, language);

  const summaryCards = [
    {
      label: copy.summary.firstMove,
      value: firstTimelineItem?.title ?? copy.summary.pending,
      note: firstTimelineItem
        ? copy.summary.window
            .replace("{start}", firstTimelineItem.start_time)
            .replace("{end}", firstTimelineItem.end_time)
        : timeWindow,
      tone: "soft",
    },
    {
      label: copy.summary.anchor,
      value:
        topHotel?.area_name ??
        topParking?.recommended_lot_name ??
        copy.summary.pending,
      note:
        topHotel?.parking_convenience ??
        topParking?.poi_name ??
        copy.arrival.emptyBody,
      tone: "line",
    },
    {
      label: copy.summary.budget,
      value: topBudgetItem
        ? formatBudgetCategory(topBudgetItem.category, language)
        : copy.budget.empty,
      note: topBudgetItem
        ? formatBudgetAmount(
            topBudgetItem.amount_high,
            language,
            exchangeRateSnapshot,
          )
        : exchangeRateNote || copy.summary.pending,
      tone: "warm",
    },
  ];

  return (
    <section className="result-card result-spotlight-frame p-5">
      <div className="result-spotlight-head">
        <div className="result-panel-head">
          <p className="result-panel-kicker">{copy.kicker}</p>
          <h2 className="result-panel-title">{copy.title}</h2>
        </div>

        <div className="result-spotlight-chip-row text-[0.62rem]">
          <span className="result-chip-soft font-semibold">{copy.badges.atlas}</span>
          <span className="result-chip-line font-semibold text-foreground">
            {copy.badges.route
              .replace("{days}", String(dayCount || 0))
              .replace("{points}", String(mapPointCount || 0))}
          </span>
          <span className="result-chip-warm font-semibold text-foreground">
            {copy.badges.budget.replace("{value}", String(budgetItems.length))}
          </span>
        </div>
      </div>

      <div className="result-city-atlas-summary">
        {summaryCards.map((card) => (
          <article
            key={card.label}
            className="result-city-atlas-summary-card"
            data-tone={card.tone}
          >
            <span className="result-city-atlas-summary-label">{card.label}</span>
            <h3 className="result-city-atlas-summary-value">{card.value}</h3>
            <p className="result-city-atlas-summary-note">{card.note}</p>
          </article>
        ))}
      </div>

      <div className="result-spotlight-grid">
        <div className="result-spotlight-map-frame">
          <div className="result-spotlight-map-overlay">
            <p className="result-spotlight-map-kicker">{copy.map.kicker}</p>
            <h3 className="result-spotlight-map-title">{cityName}</h3>
            <p className="result-spotlight-map-copy">{copy.map.note}</p>
            <div className="result-city-atlas-map-meta">
              <span className="result-chip-soft text-[0.62rem] font-semibold">
                {timeWindow}
              </span>
              <span className="result-chip-line text-[0.62rem] text-foreground">
                {transportHint}
              </span>
            </div>
          </div>

          <div className="result-spotlight-map">
            <AmapPlanMap
              city={cityName}
              language={language}
              mapPoints={mapPoints}
            />
          </div>
        </div>

        <aside className="result-spotlight-side">
          <article className="result-spotlight-module" data-tone="line">
            <div className="flex items-start justify-between gap-3">
              <div className="grid gap-1">
                <p className="result-spotlight-kicker">{copy.arrival.kicker}</p>
                <h3 className="result-spotlight-title">{arrivalTitle}</h3>
              </div>
              {topHotel?.budget_band ? (
                <span className="result-chip-warm text-[0.62rem] font-semibold text-foreground">
                  {formatBudgetBand(topHotel.budget_band, language)}
                </span>
              ) : topParking ? (
                <span className="result-chip-soft text-[0.62rem] font-semibold">
                  {formatParkingSort(topParking.sort_mode, language)}
                </span>
              ) : null}
            </div>

            <p className="result-spotlight-copy">{arrivalBody}</p>

            <div className="result-city-atlas-detail-grid">
              {arrivalDetails.map((detail) => (
                <div
                  key={`${detail.label}-${detail.value}`}
                  className="result-city-atlas-detail"
                >
                  <span className="result-city-atlas-detail-label">
                    {detail.label}
                  </span>
                  <p className="result-city-atlas-detail-value">{detail.value}</p>
                </div>
              ))}
            </div>
          </article>

          <article className="result-spotlight-module" data-tone="soft">
            <div className="flex items-start justify-between gap-3">
              <div className="grid gap-1">
                <p className="result-spotlight-kicker">{copy.weather.kicker}</p>
                <h3 className="result-spotlight-title">
                  {weatherSummary?.condition_summary ?? copy.weather.emptyTitle}
                </h3>
              </div>
              <span className="result-chip-soft text-[0.62rem] font-semibold">
                {weatherText}
              </span>
            </div>

            {weatherSummary ? (
              <div className="grid gap-3">
                <p className="result-spotlight-copy">{weatherSummary.overview}</p>
                {weatherSummary.clothing_tip ? (
                  <p className="result-spotlight-note">
                    {copy.weather.clothing}: {weatherSummary.clothing_tip}
                  </p>
                ) : null}
                <div className="result-spotlight-tag-board">
                  <span className="result-chip-line text-foreground">
                    {formatCityName(weatherSummary.city_name, language)}
                  </span>
                  {weatherTags.length ? (
                    weatherTags.map((tag) => (
                      <span
                        key={tag}
                        className="result-chip-line text-foreground"
                      >
                        {formatWeatherTag(tag, language)}
                      </span>
                    ))
                  ) : (
                    <span className="result-chip-line text-foreground">
                      {copy.weather.tagsEmpty}
                    </span>
                  )}
                </div>
                {weatherSummary.report_time ? (
                  <p className="result-spotlight-note">
                    {copy.weather.reportTime.replace(
                      "{value}",
                      weatherSummary.report_time,
                    )}
                  </p>
                ) : null}
              </div>
            ) : (
              <p className="result-spotlight-copy">{copy.weather.emptyBody}</p>
            )}
          </article>

          <article className="result-spotlight-module" data-tone="warm">
            <div className="grid gap-1">
              <p className="result-spotlight-kicker">{copy.budget.kicker}</p>
              <h3 className="result-spotlight-total">
                {hasBudget
                  ? formatBudgetRange(
                      budgetSummary.low,
                      budgetSummary.high,
                      language,
                      exchangeRateSnapshot,
                    )
                  : copy.budget.empty}
              </h3>
              <p className="result-spotlight-copy">{copy.budget.total}</p>
              {exchangeRateNote ? (
                <p className="result-spotlight-note">{exchangeRateNote}</p>
              ) : null}
            </div>

            <div className="grid gap-3">
              {budgetItems.map((item) => {
                const fillPercent = Math.max(
                  12,
                  Math.round((item.amount_high / budgetCeiling) * 100),
                );
                const fillWidth = `${fillPercent}%`;

                return (
                  <div key={item.category} className="grid gap-2.5">
                    <div className="result-spotlight-row">
                      <div className="grid gap-0.5">
                        <span className="result-spotlight-row-label">
                          {formatBudgetCategory(item.category, language)}
                        </span>
                        <span className="result-spotlight-row-note">
                          {item.is_adjustable
                            ? copy.budget.adjustable
                            : copy.budget.fixed}
                        </span>
                      </div>
                      <span className="result-spotlight-row-value">
                        {`${formatBudgetAmount(
                          item.amount_low,
                          language,
                          exchangeRateSnapshot,
                        )}-${formatBudgetAmount(
                          item.amount_high,
                          language,
                          exchangeRateSnapshot,
                        )}`}
                      </span>
                    </div>

                    <div className="result-spotlight-bar-track">
                      <span
                        className="result-spotlight-bar-fill"
                        data-tone={item.is_adjustable ? "soft" : "warm"}
                        style={{ width: fillWidth }}
                      />
                    </div>
                    <p className="result-spotlight-note">
                      {copy.budget.share.replace("{value}", String(fillPercent))}
                    </p>
                  </div>
                );
              })}
            </div>
          </article>
        </aside>
      </div>
    </section>
  );
}

function buildArrivalDetails({
  copy,
  language,
  topHotel,
  topParking,
}: {
  copy: (typeof copyByLanguage)["zh-CN"] | (typeof copyByLanguage)["en"];
  language: OutputLanguage;
  topHotel: HotelAreaRecommendation | null;
  topParking: ParkingGuide | null;
}) {
  const details: Array<{ label: string; value: string }> = [];

  if (topHotel) {
    details.push({
      label: copy.arrival.stay,
      value: topHotel.area_name,
    });
  }

  if (topParking) {
    details.push({
      label: copy.arrival.parking,
      value: topParking.recommended_lot_name,
    });
    details.push({
      label: copy.arrival.walk,
      value: copy.arrival.walkValue.replace(
        "{value}",
        String(topParking.walking_minutes),
      ),
    });
  }

  if (topHotel?.suitable_modes?.length) {
    details.push({
      label: copy.arrival.modes,
      value: topHotel.suitable_modes
        .slice(0, 2)
        .map((mode) => formatSuitableMode(mode, language))
        .join(" · "),
    });
  }

  if (details.length < 4 && topParking) {
    details.push({
      label: copy.arrival.difficulty,
      value: topParking.parking_difficulty,
    });
  }

  if (details.length < 4 && topHotel?.budget_band) {
    details.push({
      label: copy.arrival.budgetBand,
      value: formatBudgetBand(topHotel.budget_band, language),
    });
  }

  if (details.length < 4 && topHotel?.parking_convenience) {
    details.push({
      label: copy.arrival.ease,
      value: topHotel.parking_convenience,
    });
  }

  if (details.length < 4 && topParking?.price_note) {
    details.push({
      label: copy.arrival.price,
      value: topParking.price_note,
    });
  }

  if (details.length < 4 && topParking) {
    details.push({
      label: copy.arrival.sort,
      value: formatParkingSort(topParking.sort_mode, language),
    });
  }

  return details.slice(0, 4);
}

function formatSuitableMode(mode: string, language: OutputLanguage) {
  const normalized = String(mode).toLowerCase();
  if (["high_speed_rail", "metro", "drive", "taxi", "walk"].includes(normalized)) {
    return formatTransportMode(mode, language);
  }

  return formatTravelMode(mode, language);
}

function formatTemperatureRange(
  copy:
    | (typeof copyByLanguage)["zh-CN"]["weather"]
    | (typeof copyByLanguage)["en"]["weather"],
  weatherSummary: WeatherSummary | null,
) {
  const low = weatherSummary?.temperature_low_c ?? null;
  const high = weatherSummary?.temperature_high_c ?? null;

  if (low === null && high === null) {
    return copy.tempPending;
  }

  if (low === null) {
    return copy.tempUpTo.replace("{value}", String(high));
  }

  if (high === null) {
    return copy.tempAround.replace("{value}", String(low));
  }

  return copy.tempRange
    .replace("{low}", String(low))
    .replace("{high}", String(high));
}
