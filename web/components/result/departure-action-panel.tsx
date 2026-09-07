import {
  formatBudgetAmount,
  formatBudgetRange,
} from "@/lib/currency";
import { buildExportBudgetSummary } from "@/lib/export-helpers";
import {
  formatBudgetBand,
  formatBudgetCategory,
  formatChecklistCategory,
  formatCityName,
  formatEntryMode,
  formatParkingSort,
  formatSeverity,
  formatTransportMode,
  formatTravelMode,
  formatWeatherTag,
} from "@/lib/result-formatters";
import type {
  ExchangeRateSnapshot,
  OutputLanguage,
  PlanDraft,
} from "@/lib/schemas";

type DepartureActionPanelProps = {
  exchangeRateSnapshot: ExchangeRateSnapshot;
  language: OutputLanguage;
  onJumpToSection: (sectionId: string) => void;
  plan: PlanDraft | null;
};

type ActionTone = "soft" | "warm" | "line" | "primary";

type ActionCard = {
  body: string;
  cta: string;
  label: string;
  meta: string;
  phase: string;
  sectionId: string;
  status: string;
  title: string;
  tone: ActionTone;
};

type SignalCard = {
  label: string;
  note: string;
  value: string;
};

type LeadFact = {
  label: string;
  value: string;
};

const copyByLanguage = {
  "zh-CN": {
    kicker: "出发前操作台",
    title: "先锁住最影响执行的四件事。",
    note:
      "这不是摘要，而是你出发前真正要按顺序处理的动作层。先把预约、落地、穿搭和预算压成一个台面。",
    signals: {
      city: "主城市",
      alerts: "预约压力",
      budget: "预算窗口",
      noAlert: "当前没有明显高压预约点",
      allocated: "当前结构化上沿 {value}",
      travelModeFallback: "行程风格待补",
    },
    lead: {
      kicker: "第一动作",
      button: "打开对应模块",
      noRiskTitle: "路线已经可执行，先把落地和清单压实。",
      noRiskBody:
        "当前没有会强制改线的预约瓶颈，可以先处理到达方式、停车或住宿片区，再补天气和随身物品。",
      riskTitle: "先锁 {poi}",
      riskBody:
        "只要这个点位没锁住，后面的吃饭、出片和转场都可能被动重排。",
      facts: {
        move: "路线起笔",
        route: "执行主轴",
        access: "落地约束",
      },
      accessDrive: "{sort} · 步行上限 {minutes} 分钟",
      accessTransit: "先按公共交通和住宿片区落地",
      routePending: "交通策略待补",
      movePending: "首个动作待补",
    },
    cards: {
      reservation: {
        label: "预约优先",
        phase: "01 / 预约",
        emptyTitle: "预约压力较轻",
        emptyBody:
          "当前没有明确的高压预约点位，可以先处理其他落地问题。",
        emptyStatus: "可后看",
        open: "查看预约卡",
        metaFallback: "预约渠道待补",
      },
      access: {
        label: "落地动线",
        phase: "02 / 落地",
        hotelStatus: "住哪里",
        emptyTitle: "先定到达方式",
        emptyBody:
          "还没有明确停车点或酒店片区时，先把到达动线收紧。",
        emptyStatus: "待收口",
        open: "查看落地层",
        metaFallback: "落地约束待补",
      },
      prep: {
        label: "天气与清单",
        phase: "03 / 行前",
        emptyTitle: "准备层待补",
        emptyBody:
          "天气、穿搭和证件提醒还没有完全压缩到出发层。",
        emptyStatus: "待补",
        open: "查看行前层",
        metaFallback: "清单信号待补",
      },
      budget: {
        label: "预算边界",
        phase: "04 / 控价",
        emptyTitle: "预算待补",
        emptyBody:
          "先把预算窗口钉住，避免路线看起来可行但总价失控。",
        emptyStatus: "待补",
        open: "查看预算层",
        metaAllocated: "当前结构化估算 {value}",
        metaTopCategory: "最高支出类目 {value}",
      },
    },
    access: {
      parkingFor: "对应 {value}",
      parkingMeta: "步行约 {minutes} 分钟 · {sort}",
      hotelMeta: "停车条件 {value} · {note}",
    },
    prep: {
      weatherMeta: "{tip} · {tags}",
      weatherFallbackTag: "天气信号待补",
      checklistMeta: "{category} · {reason}",
      checklistFallbackCategory: "行前清单",
    },
  },
  en: {
    kicker: "Departure desk",
    title: "Lock the four things that can derail execution first.",
    note:
      "This is not a recap. It is the action layer to work through before leaving: booking, arrival logic, packing, and budget control.",
    signals: {
      city: "City",
      alerts: "Booking load",
      budget: "Budget window",
      noAlert: "No obvious booking bottleneck right now",
      allocated: "Structured upper estimate {value}",
      travelModeFallback: "Travel mode pending",
    },
    lead: {
      kicker: "First move",
      button: "Open linked section",
      noRiskTitle: "The route is executable. Tighten arrival and prep next.",
      noRiskBody:
        "There is no booking bottleneck forcing a reroute right now, so arrival logic, parking or hotel area, and packing details should move first.",
      riskTitle: "Lock {poi} first",
      riskBody:
        "If this stop stays unlocked, meals, photo buffers, and transfers further down the route can all shift under pressure.",
      facts: {
        move: "Route opener",
        route: "Route spine",
        access: "Ground rule",
      },
      accessDrive: "{sort} · walk cap {minutes} min",
      accessTransit: "Land through transit and stay zone first",
      routePending: "Transport strategy pending",
      movePending: "First move pending",
    },
    cards: {
      reservation: {
        label: "Booking first",
        phase: "01 / Book",
        emptyTitle: "Reservation pressure is lighter",
        emptyBody:
          "No clearly urgent booking stop is active right now, so other ground decisions can move forward first.",
        emptyStatus: "Can wait",
        open: "Open reservation card",
        metaFallback: "Booking channel pending",
      },
      access: {
        label: "Ground access",
        phase: "02 / Arrive",
        hotelStatus: "Stay zone",
        emptyTitle: "Set the arrival logic first",
        emptyBody:
          "When there is no confirmed parking lot or stay area yet, tighten the arrival path first.",
        emptyStatus: "Open loop",
        open: "Open access layer",
        metaFallback: "Arrival rule pending",
      },
      prep: {
        label: "Weather + prep",
        phase: "03 / Pack",
        emptyTitle: "Prep layer pending",
        emptyBody:
          "Weather, clothing, and document reminders still need to be compressed into one departure layer.",
        emptyStatus: "Pending",
        open: "Open prep layer",
        metaFallback: "Prep signal pending",
      },
      budget: {
        label: "Budget guardrail",
        phase: "04 / Cap",
        emptyTitle: "Budget pending",
        emptyBody:
          "Lock the budget window early so the route does not look valid while total cost drifts.",
        emptyStatus: "Pending",
        open: "Open budget layer",
        metaAllocated: "Structured estimate {value}",
        metaTopCategory: "Highest spend category {value}",
      },
    },
    access: {
      parkingFor: "For {value}",
      parkingMeta: "About {minutes} min on foot · {sort}",
      hotelMeta: "Parking conditions {value} · {note}",
    },
    prep: {
      weatherMeta: "{tip} · {tags}",
      weatherFallbackTag: "Weather signal pending",
      checklistMeta: "{category} · {reason}",
      checklistFallbackCategory: "Departure checklist",
    },
  },
} as const;

export function DepartureActionPanel({
  exchangeRateSnapshot,
  language,
  onJumpToSection,
  plan,
}: DepartureActionPanelProps) {
  if (!plan) {
    return null;
  }

  const copy = copyByLanguage[language];
  const budgetSummary = buildExportBudgetSummary(plan.budget_items);
  const budgetWindow = resolveBudgetWindow(
    plan,
    budgetSummary,
    language,
    exchangeRateSnapshot,
  );
  const allocatedUpper = formatBudgetAmount(
    budgetSummary.high || 0,
    language,
    exchangeRateSnapshot,
  );
  const cityName = formatCityName(plan.city, language);
  const topRisk = [...plan.reservation_risks].sort(
    (left, right) =>
      getSeverityRank(right.severity) - getSeverityRank(left.severity),
  )[0];
  const topParking = plan.parking_guides[0] ?? null;
  const topHotel = plan.hotel_area_recommendations[0] ?? null;
  const topChecklist = plan.checklist_items[0] ?? null;
  const topBudgetItem = [...plan.budget_items].sort(
    (left, right) => (right.amount_high ?? 0) - (left.amount_high ?? 0),
  )[0];
  const weatherTags = (plan.weather_summary?.advisory_tags ?? [])
    .slice(0, 2)
    .map((tag) => formatWeatherTag(tag, language));
  const firstStop = plan.timeline[0] ?? null;
  const routeSpine =
    plan.execution_summary?.transport_strategy ??
    formatTransportMode(plan.transport_preferences[0], language);

  const signalCards: SignalCard[] = [
    {
      label: copy.signals.city,
      value: cityName,
      note:
        plan.travel_mode
          ? formatTravelMode(plan.travel_mode, language)
          : formatEntryMode(plan.entry_mode, language) ||
            copy.signals.travelModeFallback,
    },
    {
      label: copy.signals.alerts,
      value: String(plan.reservation_risks.length).padStart(2, "0"),
      note: topRisk
        ? `${formatSeverity(topRisk.severity, language)} · ${topRisk.poi_name}`
        : copy.signals.noAlert,
    },
    {
      label: copy.signals.budget,
      value: budgetWindow,
      note: copy.signals.allocated.replace("{value}", allocatedUpper),
    },
  ];

  const leadAction = topRisk
    ? {
        title: copy.lead.riskTitle.replace("{poi}", topRisk.poi_name),
        body: copy.lead.riskBody,
        sectionId: "result-priorities",
      }
    : {
        title: copy.lead.noRiskTitle,
        body: copy.lead.noRiskBody,
        sectionId:
          topParking || topHotel ? "result-priorities" : "result-city-stage",
      };

  const leadFacts: LeadFact[] = [
    {
      label: copy.lead.facts.move,
      value: firstStop
        ? `${firstStop.start_time} · ${firstStop.title}`
        : copy.lead.movePending,
    },
    {
      label: copy.lead.facts.route,
      value: routeSpine || copy.lead.routePending,
    },
    {
      label: copy.lead.facts.access,
      value: topParking
        ? copy.lead.accessDrive
            .replace("{sort}", formatParkingSort(topParking.sort_mode, language))
            .replace(
              "{minutes}",
              String(plan.max_walk_from_parking_minutes ?? topParking.walking_minutes),
            )
        : topHotel?.area_name || copy.lead.accessTransit,
    },
  ];

  const actionCards: ActionCard[] = [
    buildReservationCard(copy, language, topRisk),
    buildAccessCard({
      copy,
      language,
      plan,
      topHotel,
      topParking,
    }),
    buildPrepCard({
      copy,
      language,
      plan,
      topChecklist,
      weatherTags,
    }),
    buildBudgetCard({
      budgetSummary,
      budgetWindow,
      copy,
      exchangeRateSnapshot,
      language,
      topBudgetItem,
    }),
  ];

  return (
    <section className="result-action-ribbon result-action-wide result-departure-panel">
      <div className="result-departure-grid">
        <div className="result-departure-story">
          <div className="result-panel-head">
            <p className="result-panel-kicker">{copy.kicker}</p>
            <h2 className="share-control-title">{copy.title}</h2>
            <p className="result-action-status">{copy.note}</p>
          </div>

          <div className="result-departure-signal-grid">
            {signalCards.map((card, index) => (
              <article
                key={card.label}
                className="result-departure-signal-card"
                data-tone={index === 1 ? "warm" : index === 2 ? "line" : "soft"}
              >
                <span className="result-departure-signal-label">{card.label}</span>
                <span className="result-departure-signal-value">{card.value}</span>
                <span className="result-departure-signal-note">{card.note}</span>
              </article>
            ))}
          </div>

          <button
            type="button"
            onClick={() => onJumpToSection(leadAction.sectionId)}
            className="result-departure-lead"
          >
            <div className="result-departure-lead-main">
              <span className="result-departure-lead-kicker">
                {copy.lead.kicker}
              </span>
              <span className="result-departure-lead-title">
                {leadAction.title}
              </span>
              <span className="result-departure-lead-copy">{leadAction.body}</span>
              <span className="result-departure-lead-cta">
                {copy.lead.button} <span aria-hidden="true">-&gt;</span>
              </span>
            </div>

            <div className="result-departure-lead-side">
              {leadFacts.map((fact) => (
                <div key={fact.label} className="result-departure-lead-fact">
                  <span className="result-departure-lead-fact-label">
                    {fact.label}
                  </span>
                  <span className="result-departure-lead-fact-value">
                    {fact.value}
                  </span>
                </div>
              ))}
            </div>
          </button>
        </div>

        <div className="result-departure-actions">
          {actionCards.map((card) => (
            <button
              key={card.phase}
              type="button"
              onClick={() => onJumpToSection(card.sectionId)}
              className="result-action-button result-departure-card liquid-float-surface liquid-float-shell"
              data-liquid-kind="button"
              data-liquid-tone={card.tone}
              data-liquid-active="false"
              data-liquid-pressed="false"
            >
              <span className="result-departure-card-head">
                <span className="result-departure-card-label">{card.label}</span>
                <span className="result-departure-card-phase">{card.phase}</span>
              </span>
              <span className="result-departure-card-status">{card.status}</span>
              <span className="result-departure-card-title">{card.title}</span>
              <span className="result-departure-card-copy">{card.body}</span>
              <span className="result-departure-card-meta">{card.meta}</span>
              <span className="result-departure-card-cta">
                {card.cta} <span aria-hidden="true">-&gt;</span>
              </span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

function buildReservationCard(
  copy: (typeof copyByLanguage)["zh-CN"] | (typeof copyByLanguage)["en"],
  language: OutputLanguage,
  topRisk: PlanDraft["reservation_risks"][number] | undefined,
): ActionCard {
  if (topRisk) {
    return {
      label: copy.cards.reservation.label,
      phase: copy.cards.reservation.phase,
      status: formatSeverity(topRisk.severity, language),
      title: topRisk.poi_name,
      body: topRisk.evidence_excerpt,
      meta: [topRisk.reservation_channel, topRisk.price_note]
        .filter(Boolean)
        .join(" · ") || copy.cards.reservation.metaFallback,
      cta: copy.cards.reservation.open,
      sectionId: "result-priorities",
      tone: "warm",
    };
  }

  return {
    label: copy.cards.reservation.label,
    phase: copy.cards.reservation.phase,
    status: copy.cards.reservation.emptyStatus,
    title: copy.cards.reservation.emptyTitle,
    body: copy.cards.reservation.emptyBody,
    meta: copy.cards.reservation.metaFallback,
    cta: copy.cards.reservation.open,
    sectionId: "result-priorities",
    tone: "line",
  };
}

function buildAccessCard({
  copy,
  language,
  plan,
  topHotel,
  topParking,
}: {
  copy: (typeof copyByLanguage)["zh-CN"] | (typeof copyByLanguage)["en"];
  language: OutputLanguage;
  plan: PlanDraft;
  topHotel: PlanDraft["hotel_area_recommendations"][number] | null;
  topParking: PlanDraft["parking_guides"][number] | null;
}): ActionCard {
  if (topParking) {
    return {
      label: copy.cards.access.label,
      phase: copy.cards.access.phase,
      status: topParking.parking_difficulty,
      title: topParking.recommended_lot_name,
      body: copy.access
        .parkingFor
        .replace("{value}", topParking.poi_name),
      meta: copy.access.parkingMeta
        .replace("{minutes}", String(topParking.walking_minutes))
        .replace("{sort}", formatParkingSort(topParking.sort_mode, language)),
      cta: copy.cards.access.open,
      sectionId: "result-priorities",
      tone: "soft",
    };
  }

  if (topHotel) {
    return {
      label: copy.cards.access.label,
      phase: copy.cards.access.phase,
      status: topHotel.budget_band
        ? formatBudgetBand(topHotel.budget_band, language)
        : copy.cards.access.hotelStatus,
      title: topHotel.area_name,
      body: copy.access.hotelMeta
        .replace("{value}", topHotel.parking_convenience)
        .replace("{note}", topHotel.access_note),
      meta:
        topHotel.parking_price_note ||
        topHotel.suitable_modes.join(" · ") ||
        copy.cards.access.metaFallback,
      cta: copy.cards.access.open,
      sectionId: "result-priorities",
      tone: "line",
    };
  }

  return {
    label: copy.cards.access.label,
    phase: copy.cards.access.phase,
    status: copy.cards.access.emptyStatus,
    title:
      plan.execution_summary?.transport_strategy ??
      formatTransportMode(plan.transport_preferences[0], language) ??
      copy.cards.access.emptyTitle,
    body:
      plan.special_requirements ||
      plan.stay_preference ||
      copy.cards.access.emptyBody,
    meta: copy.cards.access.metaFallback,
    cta: copy.cards.access.open,
    sectionId: "result-city-stage",
    tone: "line",
  };
}

function buildPrepCard({
  copy,
  language,
  plan,
  topChecklist,
  weatherTags,
}: {
  copy: (typeof copyByLanguage)["zh-CN"] | (typeof copyByLanguage)["en"];
  language: OutputLanguage;
  plan: PlanDraft;
  topChecklist: PlanDraft["checklist_items"][number] | null;
  weatherTags: string[];
}): ActionCard {
  if (plan.weather_summary) {
    return {
      label: copy.cards.prep.label,
      phase: copy.cards.prep.phase,
      status: weatherTags[0] || copy.prep.weatherFallbackTag,
      title:
        plan.weather_summary.clothing_tip ??
        plan.weather_summary.condition_summary,
      body: copy.prep.weatherMeta
        .replace("{tip}", plan.weather_summary.overview)
        .replace("{tags}", weatherTags.join(" · ") || copy.prep.weatherFallbackTag),
      meta:
        plan.weather_summary.condition_summary ||
        copy.cards.prep.metaFallback,
      cta: copy.cards.prep.open,
      sectionId: "result-system",
      tone: "soft",
    };
  }

  if (topChecklist) {
    const checklistCategory =
      formatChecklistCategory(topChecklist.category, language) ||
      copy.prep.checklistFallbackCategory;

    return {
      label: copy.cards.prep.label,
      phase: copy.cards.prep.phase,
      status: checklistCategory,
      title: topChecklist.item_name,
      body: copy.prep.checklistMeta
        .replace("{category}", checklistCategory)
        .replace("{reason}", topChecklist.reason),
      meta: topChecklist.reason,
      cta: copy.cards.prep.open,
      sectionId: "result-system",
      tone: "soft",
    };
  }

  return {
    label: copy.cards.prep.label,
    phase: copy.cards.prep.phase,
    status: copy.cards.prep.emptyStatus,
    title: copy.cards.prep.emptyTitle,
    body: copy.cards.prep.emptyBody,
    meta: copy.cards.prep.metaFallback,
    cta: copy.cards.prep.open,
    sectionId: "result-system",
    tone: "line",
  };
}

function buildBudgetCard({
  budgetSummary,
  budgetWindow,
  copy,
  exchangeRateSnapshot,
  language,
  topBudgetItem,
}: {
  budgetSummary: { high: number; low: number };
  budgetWindow: string;
  copy: (typeof copyByLanguage)["zh-CN"] | (typeof copyByLanguage)["en"];
  exchangeRateSnapshot: ExchangeRateSnapshot;
  language: OutputLanguage;
  topBudgetItem: PlanDraft["budget_items"][number] | null;
}): ActionCard {
  if (budgetSummary.low || budgetSummary.high || budgetWindow) {
    const structuredEstimate = formatBudgetRange(
      budgetSummary.low,
      budgetSummary.high,
      language,
      exchangeRateSnapshot,
    );

    return {
      label: copy.cards.budget.label,
      phase: copy.cards.budget.phase,
      status: topBudgetItem
        ? formatBudgetCategory(topBudgetItem.category, language)
        : copy.cards.budget.emptyStatus,
      title: budgetWindow,
      body: topBudgetItem
        ? copy.cards.budget.metaTopCategory.replace(
            "{value}",
            formatBudgetCategory(topBudgetItem.category, language),
          )
        : copy.cards.budget.emptyBody,
      meta: copy.cards.budget.metaAllocated.replace(
        "{value}",
        structuredEstimate,
      ),
      cta: copy.cards.budget.open,
      sectionId: "result-city-stage",
      tone: "warm",
    };
  }

  return {
    label: copy.cards.budget.label,
    phase: copy.cards.budget.phase,
    status: copy.cards.budget.emptyStatus,
    title: copy.cards.budget.emptyTitle,
    body: copy.cards.budget.emptyBody,
    meta: copy.cards.budget.metaAllocated.replace("{value}", copy.cards.budget.emptyStatus),
    cta: copy.cards.budget.open,
    sectionId: "result-city-stage",
    tone: "line",
  };
}

function resolveBudgetWindow(
  plan: PlanDraft,
  budgetSummary: { high: number; low: number },
  language: OutputLanguage,
  exchangeRateSnapshot: ExchangeRateSnapshot,
) {
  const low = plan.budget_min ?? budgetSummary.low;
  const high = plan.budget_max ?? budgetSummary.high;

  if (!low && !high) {
    return language === "en" ? "Pending" : "待补";
  }

  return formatBudgetRange(low || 0, high || 0, language, exchangeRateSnapshot);
}

function getSeverityRank(severity: string | null | undefined) {
  switch (String(severity ?? "").toLowerCase()) {
    case "high":
      return 3;
    case "medium":
      return 2;
    case "low":
      return 1;
    default:
      return 0;
  }
}
