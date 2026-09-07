import {
  formatBudgetRange,
} from "@/lib/currency";
import {
  formatCityName,
  formatEntryMode,
  formatExecutionPace,
  formatTravelMode,
} from "@/lib/result-formatters";
import type {
  ExchangeRateSnapshot,
  OutputLanguage,
  PlanDraft,
} from "@/lib/schemas";

import { ResultCoverInsights } from "./result-cover-insights";

type PlanHeroSummaryProps = {
  exchangeRateSnapshot: ExchangeRateSnapshot;
  language: OutputLanguage;
  mode: "live" | "showcase";
  plan: PlanDraft | null;
  planId: string;
};

const copyByLanguage = {
  "zh-CN": {
    mode: {
      live: "执行优先",
      showcase: "展示样例",
    },
    title: (city: string, days: number) => `${city} · ${days} 天执行方案`,
    fallbackTitle: (planId: string) => `计划壳层 · ${planId}`,
    emptySummary: "生成成功后，这里会先给出一屏可执行摘要。",
    summaryKicker: "出发总控台 // 首屏判断",
    summaryTitle: "先判断这条路线能不能直接出发。",
    summaryNote: "先看天数、节点、预算边界，再看预约压力和落地动线。",
    entry: "入口：{value}",
    travelMode: "风格：{value}",
    pace: "节奏：{value}",
    days: "天数",
    stops: "节点",
    budget: "预算",
    alerts: "预约",
    budgetPending: "待补预算",
  },
  en: {
    mode: {
      live: "Execution first",
      showcase: "Showcase",
    },
    title: (city: string, days: number) => `${city} · ${days}-day plan`,
    fallbackTitle: (planId: string) => `Plan shell · ${planId}`,
    emptySummary: "A concise execution summary will appear here after generation.",
    summaryKicker: "Departure console // first-screen read",
    summaryTitle: "Judge whether this route is ready to leave.",
    summaryNote:
      "Check days, stop count, budget edge, and reservation load before polishing the smaller details.",
    entry: "Entry: {value}",
    travelMode: "Mode: {value}",
    pace: "Pace: {value}",
    days: "Days",
    stops: "Stops",
    budget: "Budget",
    alerts: "Alerts",
    budgetPending: "Budget pending",
  },
} as const;

export function PlanHeroSummary({
  exchangeRateSnapshot,
  language,
  mode,
  plan,
  planId,
}: PlanHeroSummaryProps) {
  const copy = copyByLanguage[language];
  const city = formatCityName(plan?.city, language);
  const heroHeadline =
    plan?.execution_summary?.headline ??
    plan?.summary ??
    copy.emptySummary;
  const heroSignals = buildHeroSignals(plan, language, exchangeRateSnapshot);
  const commandMetrics = buildHeroCommandMetrics(
    plan,
    language,
    exchangeRateSnapshot,
  );

  return (
    <section className="result-cover-shell">
      <div className="result-cover-stage">
        <div className="result-cover-title-stack">
          <p className="planner-kicker">
            {copy.mode[mode]}
          </p>
          <h1 className="planner-display max-w-[30rem] text-[clamp(1.88rem,4vw,3.5rem)]">
            {plan
              ? copy.title(city, plan.days)
              : copy.fallbackTitle(planId)}
          </h1>
          <p className="result-cover-deck">{heroHeadline}</p>
        </div>

        <div className="planner-rule result-cover-rule max-w-32" />

        <div className="result-cover-chip-row text-[0.62rem]">
          {plan?.entry_mode ? (
            <span className="result-chip-soft font-semibold">
              {copy.entry.replace(
                "{value}",
                formatEntryMode(plan.entry_mode, language),
              )}
            </span>
          ) : null}
          {plan?.travel_mode ? (
            <span className="result-chip-warm font-semibold text-foreground">
              {copy.travelMode.replace(
                "{value}",
                formatTravelMode(plan.travel_mode, language),
              )}
            </span>
          ) : null}
          {plan?.execution_summary?.pace ? (
            <span className="result-chip-line font-semibold text-foreground">
              {copy.pace.replace(
                "{value}",
                formatExecutionPace(plan.execution_summary.pace, language),
              )}
            </span>
          ) : null}
        </div>

        {heroSignals.length ? (
          <div className="result-hero-signal-grid result-cover-signal-grid">
            {heroSignals.map((signal) => (
              <article
                key={`${signal.eyebrow}-${signal.title}`}
                className="result-hero-signal-card"
                data-tone={signal.tone}
              >
                <p className="result-hero-signal-eyebrow">{signal.eyebrow}</p>
                <h2 className="result-hero-signal-title">{signal.title}</h2>
                <p className="result-hero-signal-copy">{signal.copy}</p>
              </article>
            ))}
          </div>
        ) : null}
      </div>

      <aside className="result-ledger result-cover-command">
        <div className="result-panel-head">
          <p className="result-panel-kicker">{copy.summaryKicker}</p>
          <h2 className="result-cover-command-title">{copy.summaryTitle}</h2>
          <p className="result-cover-command-note">{copy.summaryNote}</p>
        </div>
        <div className="result-cover-command-metrics">
          {commandMetrics.map((metric, index) => (
            <article
              key={metric.label}
              className="result-cover-command-metric"
              data-tone={index % 2 === 0 ? "soft" : "warm"}
            >
              <p className="result-cover-command-label">{metric.label}</p>
              <p className="result-cover-command-value">{metric.value}</p>
            </article>
          ))}
        </div>
        <div className="result-cover-summary-block">
          <p className="result-cover-summary-headline text-[0.88rem] font-semibold leading-7 text-white">
            {heroHeadline}
          </p>
        </div>
        <div className="result-cover-summary-tags text-[0.62rem]">
          {plan?.execution_summary?.transport_strategy ? (
            <span className="result-chip-warm font-semibold text-foreground">
              {plan.execution_summary.transport_strategy}
            </span>
          ) : null}
          {(plan?.execution_summary?.best_for ?? []).map((item) => (
            <span
              key={item}
              className="result-chip-line font-semibold text-foreground"
            >
              {item}
            </span>
          ))}
        </div>
        <ResultCoverInsights language={language} plan={plan} />
      </aside>
    </section>
  );
}

function buildHeroSignals(
  plan: PlanDraft | null,
  language: OutputLanguage,
  exchangeRateSnapshot: ExchangeRateSnapshot,
) {
  if (!plan) {
    return [];
  }

  const firstStop = plan.timeline[0];
  const budgetWindow =
    plan.budget_min != null && plan.budget_max != null
      ? formatBudgetRange(
          plan.budget_min,
          plan.budget_max,
          language,
          exchangeRateSnapshot,
        )
      : copyByLanguage[language].budgetPending;

  return [
    {
      eyebrow: language === "en" ? "First move" : "第一动作",
      title: firstStop?.title ?? (language === "en" ? "Pending" : "待补"),
      copy: firstStop
        ? `${firstStop.start_time} - ${firstStop.end_time}`
        : language === "en"
          ? "The route lead will appear after generation."
          : "生成后会在这里显示路线首个动作。",
      tone: "soft",
    },
    {
      eyebrow: language === "en" ? "Budget edge" : "预算边界",
      title: budgetWindow,
      copy:
        plan.budget_min != null && plan.budget_max != null
          ? language === "en"
            ? "Keep the stay zone, local transport, and ticket choices inside this window before adding nicer extras."
            : "先把住宿片区、市内交通和门票压在这个预算窗里，再决定要不要加更漂亮的选项。"
          : language === "en"
            ? "Set a hard budget edge first so the route does not drift while refining spots and stay style."
            : "先圈住预算边界，后面再细修景点和住宿风格时才不会一路漂。",
      tone: "warm",
    },
    {
      eyebrow: language === "en" ? "Route spine" : "路线主轴",
      title:
        plan.execution_summary?.transport_strategy ??
        (language === "en" ? "Transport pending" : "交通策略待补"),
      copy:
        plan.execution_summary?.headline ??
        plan.summary ??
        (language === "en"
          ? "The execution summary will anchor the route voice here."
          : "执行摘要会在这里钉住整条路线的语气。"),
      tone: "line",
    },
  ];
}

function buildHeroCommandMetrics(
  plan: PlanDraft | null,
  language: OutputLanguage,
  exchangeRateSnapshot: ExchangeRateSnapshot,
) {
  const copy = copyByLanguage[language];

  if (!plan) {
    return [];
  }

  return [
    {
      label: copy.days,
      value: language === "en" ? String(plan.days) : `${plan.days} 天`,
    },
    {
      label: copy.stops,
      value: String(plan.timeline.length).padStart(2, "0"),
    },
    {
      label: copy.alerts,
      value: String(plan.reservation_risks.length).padStart(2, "0"),
    },
    {
      label: copy.budget,
      value:
        plan.budget_min != null && plan.budget_max != null
          ? formatBudgetRange(
              plan.budget_min,
              plan.budget_max,
              language,
              exchangeRateSnapshot,
            )
          : copy.budgetPending,
    },
  ];
}
