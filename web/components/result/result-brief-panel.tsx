import { formatBudgetRange } from "@/lib/currency";
import {
  formatBudgetCategory,
  formatCityName,
  formatEntryMode,
  formatExecutionPace,
  formatParkingSort,
  formatSeverity,
  formatTravelMode,
  formatWeatherTag,
} from "@/lib/result-formatters";
import type {
  ExchangeRateSnapshot,
  OutputLanguage,
  PlanDraft,
} from "@/lib/schemas";

type ResultBriefPanelProps = {
  exchangeRateSnapshot: ExchangeRateSnapshot;
  language: OutputLanguage;
  plan: PlanDraft | null;
};

type ConstraintRow = {
  label: string;
  note: string;
  value: string;
};

const copyByLanguage = {
  "zh-CN": {
    kicker: "\u7ed3\u679c\u603b\u89c8 // \u6267\u884c\u8d26\u672c",
    title: "\u628a\u51fa\u53d1\u524d\u771f\u6b63\u9700\u8981\u5224\u65ad\u7684\u4fe1\u606f\u6536\u5728\u4e00\u5f20\u5361\u91cc\u3002",
    note: "\u4e0d\u8bb2\u7cfb\u7edf\u5c42\uff0c\u53ea\u544a\u8bc9\u4f60\u9884\u7b97\u538b\u5728\u54ea\uff0c\u9884\u7ea6\u4f1a\u4e0d\u4f1a\u62d6\u6162\u51fa\u53d1\uff0c\u4ee5\u53ca\u73b0\u573a\u6700\u5bb9\u6613\u51fa\u95ee\u9898\u7684\u7ea6\u675f\u3002",
    labels: {
      city: "\u57ce\u5e02",
      budget: "\u9884\u7b97\u7a97\u53e3",
      route: "\u8def\u7ebf\u753b\u50cf",
      constraints: "\u73b0\u573a\u7ea6\u675f",
      ledger: "\u82b1\u9500\u53bb\u5411",
      adjustable: "\u53ef\u8c03",
      fixed: "\u9501\u5b9a",
      days: "\u5929\u6570",
      stops: "\u8282\u70b9",
      alerts: "\u9884\u7ea6",
      weather: "\u5929\u6c14",
      booking: "\u9884\u7ea6",
      access: "\u843d\u5730",
      pending: "\u5f85\u8865",
      none: "\u6682\u65e0",
    },
    units: {
      days: "\u5929",
    },
    routeNote: "\u5148\u7528\u8fd9\u4e00\u7ec4\u6807\u7b7e\u5224\u65ad\u5b83\u66f4\u504f\u51fa\u7247\uff0c\u8fd8\u662f\u66f4\u504f\u843d\u5730\u6267\u884c\u3002",
    ledgerEmpty: "\u9884\u7b97\u62c6\u5206\u8fd8\u6ca1\u751f\u6210\u3002",
    alertNone: "\u5f53\u524d\u6ca1\u6709\u660e\u663e\u7684\u9884\u7ea6\u9ad8\u538b\u70b9\u3002",
    accessDrive:
      "\u505c\u8f66\u6392\u5e8f\uff1a{value} \u00b7 \u6b65\u884c\u4e0a\u9650 {minutes} \u5206\u949f",
    accessTransit:
      "\u5f53\u524d\u8def\u7ebf\u4e0d\u4f9d\u8d56\u505c\u8f66\uff0c\u4f18\u5148\u770b\u843d\u5730\u4ea4\u901a\u548c\u4f4f\u5bbf\u7247\u533a\u3002",
    bookingWithChannel: "{severity} \u00b7 {channel}",
    bookingWithPrice: "{base} \u00b7 {price}",
    bookingFallbackChannel: "\u6e20\u9053\u5f85\u8865",
  },
  en: {
    kicker: "Result desk // execution ledger",
    title: "Compress the trip into one leave-now judgment card.",
    note: "This card skips the system layer and focuses on where budget is pinned, what may block departure, and which on-ground constraints deserve attention first.",
    labels: {
      city: "City",
      budget: "Budget edge",
      route: "Route profile",
      constraints: "Ground rules",
      ledger: "Cost ledger",
      adjustable: "Flexible",
      fixed: "Fixed",
      days: "Days",
      stops: "Stops",
      alerts: "Alerts",
      weather: "Weather",
      booking: "Booking",
      access: "Access",
      pending: "Pending",
      none: "None",
    },
    units: {
      days: "days",
    },
    routeNote:
      "Use this strip to decide whether the route leans photo-heavy, logistics-heavy, or slow and scenic.",
    ledgerEmpty: "Budget breakdown pending.",
    alertNone: "No obvious booking-pressure stop is active right now.",
    accessDrive: "Parking sort: {value} · walk cap {minutes} min",
    accessTransit:
      "This route does not depend on parking first. Focus on arrival transit and stay zone.",
    bookingWithChannel: "{severity} · {channel}",
    bookingWithPrice: "{base} · {price}",
    bookingFallbackChannel: "Channel pending",
  },
} as const;

export function ResultBriefPanel({
  exchangeRateSnapshot,
  language,
  plan,
}: ResultBriefPanelProps) {
  const copy = copyByLanguage[language];

  if (!plan) {
    return null;
  }

  const budgetLowFromItems = plan.budget_items.reduce(
    (sum, item) => sum + Number(item.amount_low ?? 0),
    0,
  );
  const budgetHighFromItems = plan.budget_items.reduce(
    (sum, item) => sum + Number(item.amount_high ?? 0),
    0,
  );
  const budgetLow = plan.budget_min ?? budgetLowFromItems;
  const budgetHigh = plan.budget_max ?? budgetHighFromItems;
  const budgetWindow =
    budgetLow || budgetHigh
      ? formatBudgetRange(
          budgetLow,
          budgetHigh,
          language,
          exchangeRateSnapshot,
        )
      : copy.labels.pending;

  const summaryMeta = [
    {
      label: copy.labels.days,
      value:
        language === "en"
          ? String(plan.days)
          : `${plan.days}${copy.units.days}`,
    },
    {
      label: copy.labels.stops,
      value: String(plan.timeline.length).padStart(2, "0"),
    },
    {
      label: copy.labels.alerts,
      value: String(plan.reservation_risks.length).padStart(2, "0"),
    },
  ];

  const routeTags = [
    formatEntryMode(plan.entry_mode, language),
    plan.travel_mode ? formatTravelMode(plan.travel_mode, language) : null,
    plan.execution_summary?.pace
      ? formatExecutionPace(plan.execution_summary.pace, language)
      : null,
  ].filter((item): item is string => Boolean(item));

  const constraintRows = buildConstraintRows(plan, language);

  return (
    <aside className="result-ledger result-showcase-brief">
      <div className="result-panel-head">
        <p className="result-panel-kicker">{copy.kicker}</p>
        <h2 className="result-showcase-brief-title">{copy.title}</h2>
        <p className="result-panel-copy">{copy.note}</p>
      </div>

      <div className="result-brief-hero-grid">
        <article className="result-brief-hero-card" data-tone="soft">
          <p className="result-brief-card-label">{copy.labels.city}</p>
          <h3 className="result-brief-city">
            {formatCityName(plan.city, language)}
          </h3>
          <div className="result-brief-meta-strip">
            {summaryMeta.map((item) => (
              <div key={item.label} className="result-brief-meta-chip">
                <span className="result-brief-meta-label">{item.label}</span>
                <span className="result-brief-meta-value">{item.value}</span>
              </div>
            ))}
          </div>
        </article>

        <article className="result-brief-hero-card" data-tone="warm">
          <p className="result-brief-card-label">{copy.labels.budget}</p>
          <h3 className="result-brief-budget-window">{budgetWindow}</h3>
          <p className="result-brief-card-copy">
            {plan.reservation_risks.length
              ? language === "en"
                ? `${plan.reservation_risks.length} booking-sensitive stop(s) should be sequenced before polishing optional spend.`
                : `${plan.reservation_risks.length}\u4e2a\u9884\u7ea6\u654f\u611f\u8282\u70b9\u8981\u5148\u6392\u5e8f\uff0c\u518d\u51b3\u5b9a\u8981\u4e0d\u8981\u8ffd\u52a0\u53ef\u9009\u6d88\u8d39\u3002`
              : language === "en"
                ? "Booking pressure is lighter, so optional spend can move more freely."
                : "\u9884\u7ea6\u538b\u529b\u8f83\u8f7b\uff0c\u53ef\u9009\u82b1\u9500\u53ef\u4ee5\u66f4\u81ea\u7531\u5730\u4e0a\u4e0b\u6d6e\u52a8\u3002"}
          </p>
        </article>
      </div>

      <article className="result-brief-panel-card">
        <div className="result-brief-panel-head">
          <p className="result-brief-card-label">{copy.labels.route}</p>
          <p className="result-brief-panel-note">{copy.routeNote}</p>
        </div>

        <div className="result-cover-summary-tags result-brief-route-tags text-[0.62rem]">
          {routeTags.length ? (
            routeTags.map((tag, index) => (
              <span
                key={`${tag}-${index}`}
                className={
                  index === 1
                    ? "result-chip-warm font-semibold text-foreground"
                    : index === 2
                      ? "result-chip-line font-semibold text-foreground"
                      : "result-chip-soft font-semibold"
                }
              >
                {tag}
              </span>
            ))
          ) : (
            <span className="result-chip-line font-semibold text-foreground">
              {copy.labels.pending}
            </span>
          )}
        </div>

        <p className="result-brief-panel-copy">
          {plan.execution_summary?.transport_strategy ??
            plan.execution_summary?.headline ??
            copy.labels.pending}
        </p>
      </article>

      <article className="result-brief-panel-card">
        <div className="result-brief-panel-head">
          <p className="result-brief-card-label">{copy.labels.constraints}</p>
        </div>
        <div className="result-brief-constraint-list">
          {constraintRows.map((row) => (
            <div key={row.label} className="result-brief-constraint-row">
              <div className="result-brief-constraint-head">
                <span className="result-brief-constraint-label">{row.label}</span>
                <span className="result-brief-constraint-value">{row.value}</span>
              </div>
              <p className="result-brief-constraint-copy">{row.note}</p>
            </div>
          ))}
        </div>
      </article>

      <article className="result-brief-panel-card">
        <div className="result-brief-panel-head">
          <p className="result-brief-card-label">{copy.labels.ledger}</p>
        </div>
        {plan.budget_items.length ? (
          <div className="result-brief-ledger-list">
            {plan.budget_items.map((item) => (
              <div
                key={`${item.category}-${item.amount_low}-${item.amount_high}`}
                className="result-brief-ledger-row"
              >
                <div className="result-brief-ledger-copy">
                  <span className="result-brief-ledger-title">
                    {formatBudgetCategory(item.category, language)}
                  </span>
                  <span className="result-brief-ledger-range">
                    {formatBudgetRange(
                      item.amount_low,
                      item.amount_high,
                      language,
                      exchangeRateSnapshot,
                    )}
                  </span>
                </div>
                <span
                  className={
                    item.is_adjustable
                      ? "result-chip-soft font-semibold"
                      : "result-chip-line font-semibold text-foreground"
                  }
                >
                  {item.is_adjustable
                    ? copy.labels.adjustable
                    : copy.labels.fixed}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="result-brief-panel-copy">{copy.ledgerEmpty}</p>
        )}
      </article>
    </aside>
  );
}

function buildConstraintRows(
  plan: PlanDraft,
  language: OutputLanguage,
): ConstraintRow[] {
  const copy = copyByLanguage[language];

  const weatherValue = plan.weather_summary?.overview ?? copy.labels.pending;
  const weatherNote =
    plan.weather_summary?.clothing_tip ??
    (plan.weather_summary?.advisory_tags.length
      ? plan.weather_summary.advisory_tags
          .map((tag) => formatWeatherTag(tag, language))
          .join(" · ")
      : copy.labels.pending);

  const topRisk = plan.reservation_risks[0] ?? null;
  const bookingValue = topRisk?.poi_name ?? copy.labels.none;
  const bookingBase = topRisk
    ? copy.bookingWithChannel
        .replace("{severity}", formatSeverity(topRisk.severity, language))
        .replace(
          "{channel}",
          topRisk.reservation_channel || copy.bookingFallbackChannel,
        )
    : copy.alertNone;
  const bookingNote =
    topRisk?.price_note
      ? copy.bookingWithPrice
          .replace("{base}", bookingBase)
          .replace("{price}", topRisk.price_note)
      : bookingBase;

  const accessValue = plan.parking_required
    ? copy.accessDrive
        .replace("{value}", formatParkingSort(plan.parking_sort, language))
        .replace(
          "{minutes}",
          String(plan.max_walk_from_parking_minutes ?? 30),
        )
    : plan.execution_summary?.transport_strategy ?? copy.labels.pending;
  const accessNote = plan.parking_required
    ? plan.parking_guides[0]?.recommended_lot_name ??
      plan.hotel_area_recommendations[0]?.area_name ??
      copy.labels.pending
    : plan.hotel_area_recommendations[0]?.access_note ?? copy.accessTransit;

  return [
    {
      label: copy.labels.weather,
      value: weatherValue,
      note: weatherNote,
    },
    {
      label: copy.labels.booking,
      value: bookingValue,
      note: bookingNote,
    },
    {
      label: copy.labels.access,
      value: accessValue,
      note: accessNote,
    },
  ];
}
