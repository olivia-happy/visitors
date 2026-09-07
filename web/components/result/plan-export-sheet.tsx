"use client";

import { useRouter } from "next/navigation";
import { useEffect, useLayoutEffect, useState } from "react";

import {
  buildExportBudgetSummary,
  buildExportSections,
  buildExportTitle,
} from "@/lib/export-helpers";
import {
  applyCurrencyDisplayToPlan,
  formatBudgetAmount,
  formatBudgetRange,
} from "@/lib/currency";
import { localizePlanDraft } from "@/lib/plan-localizations";
import {
  formatBudgetBand,
  formatBudgetCategory,
  formatCityName,
  formatEntryMode,
  formatExecutionPace,
  formatParkingSort,
  formatSeverity,
  formatTransportMode,
  formatTravelMode,
} from "@/lib/result-formatters";
import type {
  ExchangeRateSnapshot,
  OutputLanguage,
  PlanDraft,
  TimelineItem,
} from "@/lib/schemas";
import { buildViewHref } from "@/lib/view-state";

import { PlanExportActions } from "./plan-export-actions";
import { ExchangeRateControl } from "./exchange-rate-control";

type PlanExportSheetProps = {
  backHref: string;
  exchangeRateSnapshot: ExchangeRateSnapshot;
  initialLanguage?: OutputLanguage;
  initialThemeMode?: ThemeMode;
  plan: PlanDraft;
  planId: string;
  shareHref: string;
};

type ThemeMode = "light" | "dark";
type ExchangeRateRefreshStatus = "idle" | "success" | "error";

type ShareHighlight = {
  copy: string;
  eyebrow: string;
  title: string;
  tone: "line" | "soft" | "warm";
};

const copyByLanguage = {
  "zh-CN": {
    pageTitle: (city: string) => `${city} · 行程分享页`,
    stamps: {
      share: "分享页",
      print: "打印友好",
      bilingual: "中英切换",
    },
    toolbar: {
      language: "语言",
      theme: "明暗",
      languageZh: "中文",
      languageEn: "EN",
      light: "亮色",
      dark: "暗色",
    },
    header: {
      kicker: "旅行分享页",
      note: "把路线、预约和预算压成一张更适合截图、转发、打印的执行页。",
      planId: "计划 ID：{value}",
      entry: "入口：{value}",
      travelMode: "风格：{value}",
      pace: "节奏：{value}",
      summary: {
        kicker: "摘要台",
        title: "给同行人看的精简执行版本。",
        note: "保留需要先做的事、今天怎么走、预算大概多少，以及自驾和住宿的落地信息。",
      },
      metrics: {
        days: "天数",
        stops: "节点",
        reservations: "预约",
        budget: "预算上限",
      },
      highlights: {
        firstMove: "第一动作",
        reservationLoad: "预约压力",
        routeSpine: "路线主轴",
        pending: "待补",
        noAlert: "暂无提醒",
        alertUnit: "条提醒",
        firstMoveEmpty: "生成后会把路线的第一个动作放在这里。",
        routeSpineEmpty: "执行摘要会在这里给同行人一个最快速的理解入口。",
        routeSpinePending: "交通策略待补",
      },
    },
    sections: {
      reservation: {
        kicker: "预约风险",
        title: "先把需要锁定的点挑出来。",
        channel: "渠道：{value}",
        price: "价格：{value}",
        evidence: "证据摘录：{value}",
        empty: "当前还没有提取到明确的预约证据。",
      },
      route: {
        kicker: "执行路线",
        title: "按天展开的可执行时间线。",
        day: "第 {day} 天",
        count: "{value} 个落点",
        rowTitle: "{start} - {end} · {title}",
        meta: "{mode} · {minutes} 分钟",
      },
      budget: {
        kicker: "预算摘要",
        title: "这趟出行的花销边界。",
        total: "总预算区间",
        currency: "人民币 {low} - {high}",
        itemRange: "¥{low}-{high}",
      },
      parking: {
        kicker: "停车建议",
        title: "如果自驾，先看落地怎么停。",
        lot: "推荐停车点：{value}",
        detail: "停车难度：{difficulty} · 步行 {minutes} 分钟",
      },
      hotel: {
        kicker: "酒店片区",
        title: "住哪一带，也提前说清。",
        parking: "停车便利：{value}",
        access: "{value}",
        parkingNote: "停车参考：{value}",
      },
      footer: {
        kicker: "行前提醒",
        title: "出发前再核一次官方预约规则。",
      },
    },
    footer:
      "预约提醒仅基于已提取到的小红书证据与结构化结果，出发前请再次核对官方预约渠道、价格和放票规则。",
  },
  en: {
    pageTitle: (city: string) => `${city} · Trip Share Sheet`,
    stamps: {
      share: "Share sheet",
      print: "Print-ready",
      bilingual: "CN / EN",
    },
    toolbar: {
      language: "Language",
      theme: "Theme",
      languageZh: "CN",
      languageEn: "EN",
      light: "Light",
      dark: "Dark",
    },
    header: {
      kicker: "Trip share sheet",
      note: "Compress route, booking reminders, and budget into a cleaner execution page for screenshots, forwarding, and printing.",
      planId: "Plan ID: {value}",
      entry: "Entry: {value}",
      travelMode: "Mode: {value}",
      pace: "Pace: {value}",
      summary: {
        kicker: "Summary deck",
        title: "A lighter execution version for travel partners.",
        note: "Keep the first moves, today's route, cost boundary, and practical driving or hotel context in one place.",
      },
      metrics: {
        days: "Days",
        stops: "Stops",
        reservations: "Alerts",
        budget: "Budget cap",
      },
      highlights: {
        firstMove: "First move",
        reservationLoad: "Reservation load",
        routeSpine: "Route spine",
        pending: "Pending",
        noAlert: "No alerts",
        alertUnit: "alerts",
        firstMoveEmpty: "The first route move will surface here after generation.",
        routeSpineEmpty: "The execution summary will become the fastest entry point for travel partners here.",
        routeSpinePending: "Transport strategy pending",
      },
    },
    sections: {
      reservation: {
        kicker: "Reservation risks",
        title: "Pull the booking-sensitive stops forward first.",
        channel: "Channel: {value}",
        price: "Price: {value}",
        evidence: "Evidence: {value}",
        empty: "No clear reservation evidence has been extracted yet.",
      },
      route: {
        kicker: "Execution route",
        title: "A day-by-day route that stays usable.",
        day: "Day {day}",
        count: "{value} stops",
        rowTitle: "{start} - {end} · {title}",
        meta: "{mode} · {minutes} min",
      },
      budget: {
        kicker: "Budget summary",
        title: "Set the spend boundary before leaving.",
        total: "Total budget range",
        currency: "RMB {low} - {high}",
        itemRange: "¥{low}-{high}",
      },
      parking: {
        kicker: "Driving and parking",
        title: "If you drive, settle the landing logic first.",
        lot: "Recommended lot: {value}",
        detail: "Parking difficulty: {difficulty} · {minutes} min walk",
      },
      hotel: {
        kicker: "Hotel areas",
        title: "Make the staying zone explicit too.",
        parking: "Parking convenience: {value}",
        access: "{value}",
        parkingNote: "Parking note: {value}",
      },
      footer: {
        kicker: "Departure note",
        title: "Verify the official booking rules once more before leaving.",
      },
    },
    footer:
      "Reservation reminders are based only on extracted Xiaohongshu evidence and the structured plan. Please verify the official booking channel, price, and release rules again before departure.",
  },
} as const;

export function PlanExportSheet({
  backHref,
  exchangeRateSnapshot: initialExchangeRateSnapshot,
  initialLanguage,
  initialThemeMode = "light",
  plan,
  planId,
  shareHref,
}: PlanExportSheetProps) {
  const router = useRouter();
  const [language, setLanguage] = useState<OutputLanguage>(
    initialLanguage ?? (plan.output_language === "en" ? "en" : "zh-CN"),
  );
  const [themeMode, setThemeMode] = useState<ThemeMode>(initialThemeMode);
  const [exchangeRateSnapshot, setExchangeRateSnapshot] = useState(
    initialExchangeRateSnapshot,
  );
  const [exchangeRateRefreshStatus, setExchangeRateRefreshStatus] =
    useState<ExchangeRateRefreshStatus>("idle");
  const [isRefreshingExchangeRate, setIsRefreshingExchangeRate] =
    useState(false);

  const displayPlan = applyCurrencyDisplayToPlan(
    localizePlanDraft(plan, language) ?? plan,
    language,
    exchangeRateSnapshot,
  ) as PlanDraft;
  const copy = copyByLanguage[language];
  const cityName = formatCityName(displayPlan.city, language);
  const pageTitle = copy.pageTitle(cityName);
  const sections = buildExportSections(displayPlan);
  const budgetSummary = buildExportBudgetSummary(displayPlan.budget_items);
  const requestedBudgetLow = displayPlan.budget_min ?? budgetSummary.low;
  const requestedBudgetHigh = displayPlan.budget_max ?? budgetSummary.high;
  const requestedBudgetRange = formatBudgetRange(
    requestedBudgetLow || 0,
    requestedBudgetHigh || 0,
    language,
    exchangeRateSnapshot,
  );
  const structuredBudgetRange = formatBudgetRange(
    budgetSummary.low,
    budgetSummary.high,
    language,
    exchangeRateSnapshot,
  );
  const budgetWindowChip =
    language === "en"
      ? `Budget window ${requestedBudgetRange}`
      : `预算窗口 ${requestedBudgetRange}`;
  const structuredBudgetLabel =
    language === "en" ? "Structured estimate" : "结构化估算";
  const timelineByDay = groupTimelineByDay(displayPlan.timeline);
  const exportTitle = buildExportTitle(displayPlan, language);
  const budgetCeiling = Math.max(
    1,
    ...displayPlan.budget_items.map((item) => item.amount_high),
  );
  const heroMetrics = buildHeroMetrics(
    displayPlan,
    copy,
    language,
    exchangeRateSnapshot,
    requestedBudgetHigh || 0,
  );
  const heroHighlights = buildShareHighlights(displayPlan, language, copy);
  useLayoutEffect(() => {
    const root = document.documentElement;
    const syncDocumentChrome = () => {
      if (root.getAttribute("lang") !== language) {
        root.setAttribute("lang", language);
      }
      if (document.title !== pageTitle) {
        document.title = pageTitle;
      }
    };

    syncDocumentChrome();

    const frame = window.requestAnimationFrame(syncDocumentChrome);
    const observer = new MutationObserver(syncDocumentChrome);
    observer.observe(root, {
      attributeFilter: ["lang"],
      attributes: true,
    });

    return () => {
      window.cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [language, pageTitle]);

  useEffect(() => {
    const currentHref = `${window.location.pathname}${window.location.search}`;
    const nextHref = buildViewHref(currentHref, {
      language,
      theme: themeMode,
    });
    if (currentHref !== nextHref) {
      router.replace(nextHref, { scroll: false });
    }
  }, [language, router, themeMode]);

  useEffect(() => {
    if (exchangeRateRefreshStatus === "idle") {
      return;
    }

    const timer = window.setTimeout(() => {
      setExchangeRateRefreshStatus("idle");
    }, 2200);

    return () => window.clearTimeout(timer);
  }, [exchangeRateRefreshStatus]);

  async function handleRefreshExchangeRate() {
    if (isRefreshingExchangeRate) {
      return;
    }

    setIsRefreshingExchangeRate(true);

    try {
      const response = await fetch("/api/exchange-rate", {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("Failed to refresh exchange rate.");
      }

      const nextSnapshot =
        (await response.json()) as ExchangeRateSnapshot;
      setExchangeRateSnapshot(nextSnapshot);
      setExchangeRateRefreshStatus("success");
    } catch {
      setExchangeRateRefreshStatus("error");
    } finally {
      setIsRefreshingExchangeRate(false);
    }
  }

  return (
    <main
      className="planner-root result-page min-h-screen px-4 py-5 pb-24 text-foreground print:bg-white print:px-0 print:py-0"
      data-theme={themeMode}
    >
      <div className="mx-auto w-full max-w-5xl">
        <div className="print:hidden result-hero-frame result-reveal mb-4 grid gap-5 px-5 py-5 sm:px-6 sm:py-6">
          <div className="planner-toolbar mb-0">
            <div className="flex flex-wrap gap-2">
              <span className="planner-stamp">{copy.stamps.share}</span>
              <span className="planner-stamp" data-tone="soft">
                {copy.stamps.bilingual}
              </span>
              <span className="planner-stamp" data-tone="warm">
                {copy.stamps.print}
              </span>
            </div>

            <div className="planner-toolbar-actions">
              <div className="planner-toolbar-block">
                <span className="planner-control-label">
                  {copy.toolbar.language}
                </span>
                <div className="planner-control-group">
                  <button
                    type="button"
                    onClick={() => setLanguage("zh-CN")}
                    data-state={language === "zh-CN" ? "active" : "idle"}
                    className="planner-segment"
                    aria-pressed={language === "zh-CN"}
                  >
                    {copy.toolbar.languageZh}
                  </button>
                  <button
                    type="button"
                    onClick={() => setLanguage("en")}
                    data-state={language === "en" ? "active" : "idle"}
                    className="planner-segment"
                    aria-pressed={language === "en"}
                  >
                    {copy.toolbar.languageEn}
                  </button>
                </div>
              </div>

              <div className="planner-toolbar-block">
                <span className="planner-control-label">{copy.toolbar.theme}</span>
                <div className="planner-control-group">
                  <button
                    type="button"
                    onClick={() => setThemeMode("light")}
                    data-state={themeMode === "light" ? "active" : "idle"}
                    className="planner-segment"
                    aria-pressed={themeMode === "light"}
                  >
                    {copy.toolbar.light}
                  </button>
                  <button
                    type="button"
                    onClick={() => setThemeMode("dark")}
                    data-state={themeMode === "dark" ? "active" : "idle"}
                    className="planner-segment"
                    aria-pressed={themeMode === "dark"}
                  >
                    {copy.toolbar.dark}
                  </button>
                </div>
              </div>

            </div>
          </div>

          <PlanExportActions
            backHref={backHref}
            cityName={cityName}
            dayCount={displayPlan.days}
            language={language}
            reservationCount={displayPlan.reservation_risks.length}
            shareHref={shareHref}
            themeMode={themeMode}
          />
        </div>

        <article className="result-hero-frame result-reveal share-sheet-frame p-6 print:rounded-none print:border-none print:bg-white print:p-0 print:shadow-none">
          <header className="share-sheet-hero border-b border-line/70 pb-6 print:pb-4">
            <div className="share-sheet-cover-grid">
              <div className="share-sheet-hero-head">
                <div className="share-sheet-title-block">
                  <div className="share-sheet-title-stack">
                    <p className="planner-kicker">{copy.header.kicker}</p>
                    <h1 className="planner-display max-w-[34rem] text-[clamp(2rem,5vw,4rem)]">
                      {exportTitle}
                    </h1>
                  </div>
                  <p className="share-sheet-hero-note">{copy.header.note}</p>
                </div>

                <div className="share-sheet-chip-row">
                  <span className="result-chip-soft font-semibold">
                    {copy.header.planId.replace("{value}", planId)}
                  </span>
                  <span className="result-chip-line font-semibold text-foreground">
                    {copy.header.entry.replace(
                      "{value}",
                      formatEntryMode(displayPlan.entry_mode, language),
                    )}
                  </span>
                  {displayPlan.travel_mode ? (
                    <span className="result-chip-warm font-semibold text-foreground">
                      {copy.header.travelMode.replace(
                        "{value}",
                        formatTravelMode(displayPlan.travel_mode, language),
                      )}
                    </span>
                  ) : null}
                  {displayPlan.execution_summary?.pace ? (
                    <span className="result-chip-line font-semibold text-foreground">
                      {copy.header.pace.replace(
                        "{value}",
                        formatExecutionPace(
                          displayPlan.execution_summary.pace,
                          language,
                        ),
                      )}
                    </span>
                  ) : null}
                </div>
              </div>

              <aside className="share-sheet-fx-column">
                <ExchangeRateControl
                  isRefreshing={isRefreshingExchangeRate}
                  language={language}
                  onRefresh={handleRefreshExchangeRate}
                  refreshStatus={exchangeRateRefreshStatus}
                  snapshot={exchangeRateSnapshot}
                  variant="hero"
                />
              </aside>
            </div>

            <div className="share-sheet-summary-grid">
              <section className="result-ledger share-sheet-summary-panel">
                <div className="result-panel-head">
                  <p className="result-panel-kicker">{copy.header.summary.kicker}</p>
                  <h2 className="share-sheet-summary-title">
                    {copy.header.summary.title}
                  </h2>
                  <p className="share-sheet-summary-copy">
                    {displayPlan.execution_summary?.headline ?? displayPlan.summary}
                  </p>
                  <p className="share-sheet-summary-note">
                    {copy.header.summary.note}
                  </p>
                </div>

                <div className="share-sheet-summary-tags text-[0.62rem]">
                  <span className="result-chip-soft font-semibold">
                    {budgetWindowChip}
                  </span>
                  {displayPlan.execution_summary?.transport_strategy ? (
                    <span className="result-chip-warm font-semibold text-foreground">
                      {displayPlan.execution_summary.transport_strategy}
                    </span>
                  ) : null}
                  {(displayPlan.execution_summary?.best_for ?? []).map((item) => (
                    <span
                      key={item}
                      className="result-chip-line font-semibold text-foreground"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </section>

              <aside className="share-sheet-insight-rail">
                <div className="share-sheet-metric-grid">
                  {heroMetrics.map((metric, index) => (
                    <article
                      key={metric.label}
                      className="share-sheet-metric"
                      data-tone={index === 1 ? "soft" : index === 3 ? "warm" : "line"}
                    >
                      <span className="share-sheet-metric-label">
                        {metric.label}
                      </span>
                      <span className="share-sheet-metric-value">
                        {metric.value}
                      </span>
                    </article>
                  ))}
                </div>

                <div className="share-sheet-signal-grid">
                  {heroHighlights.map((highlight) => (
                    <article
                      key={`${highlight.eyebrow}-${highlight.title}`}
                      className="share-sheet-signal"
                      data-tone={highlight.tone}
                    >
                      <p className="share-sheet-signal-eyebrow">
                        {highlight.eyebrow}
                      </p>
                      <h3 className="share-sheet-signal-title">{highlight.title}</h3>
                      <p className="share-sheet-signal-copy">{highlight.copy}</p>
                    </article>
                  ))}
                </div>
              </aside>
            </div>
          </header>

          <div className="share-sheet-columns pt-6 print:pt-4">
            <div className="grid gap-6">
              {sections.includes("execution_route") ? (
                <section className="grid gap-3">
                  <SectionHeading
                    kicker={copy.sections.route.kicker}
                    title={copy.sections.route.title}
                  />
                  {timelineByDay.map(([dayIndex, items]) => (
                    <article
                      key={`day-${dayIndex}`}
                      className="result-surface share-route-day p-4"
                    >
                      <div className="share-route-day-head">
                        <div className="grid gap-1">
                          <h3 className="share-route-day-title">
                            {copy.sections.route.day.replace(
                              "{day}",
                              String(dayIndex),
                            )}
                          </h3>
                          <p className="share-route-day-meta">
                            {items[0]?.start_time ?? "--:--"} -{" "}
                            {items.at(-1)?.end_time ?? "--:--"}
                          </p>
                        </div>
                        <span className="result-chip-soft text-[0.62rem] font-semibold">
                          {copy.sections.route.count.replace(
                            "{value}",
                            String(items.length),
                          )}
                        </span>
                      </div>

                      <div className="share-route-list">
                        {items.map((item, index) => (
                          <div
                            key={`${item.day_index}-${item.start_time}-${item.title}`}
                            className="share-route-item"
                          >
                            <div className="share-route-time">
                              <span className="share-route-time-start">
                                {item.start_time}
                              </span>
                              <span className="share-route-time-end">
                                {item.end_time}
                              </span>
                            </div>

                            <div className="share-route-body">
                              <div className="flex flex-wrap items-center justify-between gap-3">
                                <div className="grid gap-1">
                                  <p className="share-route-item-label">
                                    #{String(index + 1).padStart(2, "0")}
                                  </p>
                                  <h4 className="share-route-item-title">
                                    {copy.sections.route.rowTitle
                                      .replace("{start}", item.start_time)
                                      .replace("{end}", item.end_time)
                                      .replace("{title}", item.title)}
                                  </h4>
                                </div>
                                <span className="result-chip-line text-[0.62rem] font-semibold text-foreground">
                                  {copy.sections.route.meta
                                    .replace(
                                      "{mode}",
                                      formatTransportMode(
                                        item.transport_mode,
                                        language,
                                      ),
                                    )
                                    .replace(
                                      "{minutes}",
                                      String(item.transport_duration_minutes),
                                    )}
                                </span>
                              </div>
                              <p className="share-route-item-copy">{item.notes}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </article>
                  ))}
                </section>
              ) : null}

              {sections.includes("parking_guides") ? (
                <section className="grid gap-3">
                  <SectionHeading
                    kicker={copy.sections.parking.kicker}
                    title={copy.sections.parking.title}
                  />
                  <div className="grid gap-3">
                    {displayPlan.parking_guides.map((guide) => (
                      <article
                        key={`${guide.poi_name}-${guide.recommended_lot_name}`}
                        className="result-surface p-4"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <h3 className="text-[0.94rem] font-semibold text-foreground">
                            {guide.poi_name}
                          </h3>
                          <span className="result-chip-soft text-[0.62rem] font-semibold">
                            {formatParkingSort(guide.sort_mode, language)}
                          </span>
                        </div>
                        <p className="mt-2 text-[0.72rem] leading-7 text-muted">
                          {copy.sections.parking.lot.replace(
                            "{value}",
                            guide.recommended_lot_name,
                          )}
                        </p>
                        <p className="text-[0.72rem] leading-7 text-muted">
                          {copy.sections.parking.detail
                            .replace("{difficulty}", guide.parking_difficulty)
                            .replace("{minutes}", String(guide.walking_minutes))}
                          {guide.price_note ? ` · ${guide.price_note}` : ""}
                        </p>
                      </article>
                    ))}
                  </div>
                </section>
              ) : null}
            </div>

            <aside className="grid gap-6">
              {sections.includes("reservation_risks") ? (
                <section className="grid gap-3">
                  <SectionHeading
                    kicker={copy.sections.reservation.kicker}
                    title={copy.sections.reservation.title}
                  />
                  {displayPlan.reservation_risks.length ? (
                    displayPlan.reservation_risks.map((risk, index) => (
                      <article
                        key={`${risk.poi_name}-${risk.evidence_excerpt}`}
                        className="result-surface grid gap-3 p-4"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="grid gap-1">
                            <p className="share-card-code">
                              #{String(index + 1).padStart(2, "0")}
                            </p>
                            <h3 className="text-[0.94rem] font-semibold text-foreground">
                              {risk.poi_name}
                            </h3>
                          </div>
                          <span className="result-chip-soft text-[0.62rem] font-semibold">
                            {formatSeverity(risk.severity, language)}
                          </span>
                        </div>

                        <div className="flex flex-wrap gap-2 text-[0.62rem]">
                          {risk.reservation_channel ? (
                            <span className="result-chip-line font-semibold text-foreground">
                              {copy.sections.reservation.channel.replace(
                                "{value}",
                                risk.reservation_channel,
                              )}
                            </span>
                          ) : null}
                          {risk.price_note ? (
                            <span className="result-chip-warm font-semibold text-foreground">
                              {copy.sections.reservation.price.replace(
                                "{value}",
                                risk.price_note,
                              )}
                            </span>
                          ) : null}
                        </div>

                        <div className="rounded-[0.92rem] border border-dashed border-line/70 bg-white/55 px-3 py-3 text-[0.7rem] leading-6 text-muted dark:bg-white/0">
                          {copy.sections.reservation.evidence.replace(
                            "{value}",
                            risk.evidence_excerpt,
                          )}
                        </div>
                      </article>
                    ))
                  ) : (
                    <p className="result-surface px-4 py-4 text-sm leading-7 text-muted">
                      {copy.sections.reservation.empty}
                    </p>
                  )}
                </section>
              ) : null}

              {sections.includes("budget") ? (
                <section className="grid gap-3">
                  <SectionHeading
                    kicker={copy.sections.budget.kicker}
                    title={copy.sections.budget.title}
                  />
                  <div className="result-surface grid gap-4 p-4">
                    <div className="grid gap-1">
                      <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-muted">
                        {copy.sections.budget.total}
                      </p>
                      <p className="text-[1.48rem] font-semibold text-foreground">
                        {requestedBudgetRange}
                      </p>
                      <p className="text-[0.72rem] leading-6 text-muted">
                        {structuredBudgetLabel} · {structuredBudgetRange}
                      </p>
                    </div>

                    <div className="grid gap-3">
                      {displayPlan.budget_items.map((item) => {
                        const width = `${Math.max(
                          16,
                          Math.round((item.amount_high / budgetCeiling) * 100),
                        )}%`;

                        return (
                          <div key={item.category} className="grid gap-2">
                            <div className="flex items-center justify-between gap-3">
                              <span className="text-[0.74rem] font-semibold text-foreground">
                                {formatBudgetCategory(item.category, language)}
                              </span>
                              <span className="text-[0.68rem] text-muted">
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
                            <div className="h-2 rounded-full bg-black/[0.06] dark:bg-white/[0.08]">
                              <span
                                className="block h-full rounded-full bg-[linear-gradient(90deg,_rgba(31,53,45,0.88),_rgba(143,104,73,0.72))]"
                                style={{ width }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </section>
              ) : null}

              {sections.includes("hotel_areas") ? (
                <section className="grid gap-3">
                  <SectionHeading
                    kicker={copy.sections.hotel.kicker}
                    title={copy.sections.hotel.title}
                  />
                  <div className="grid gap-3">
                    {displayPlan.hotel_area_recommendations.map((area) => (
                      <article key={area.area_name} className="result-surface p-4">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <h3 className="text-[0.94rem] font-semibold text-foreground">
                            {area.area_name}
                          </h3>
                          {area.budget_band ? (
                            <span className="result-chip-warm text-[0.62rem] font-semibold text-foreground">
                              {formatBudgetBand(area.budget_band, language)}
                            </span>
                          ) : null}
                        </div>
                        <p className="mt-2 text-[0.72rem] leading-7 text-muted">
                          {copy.sections.hotel.parking.replace(
                            "{value}",
                            area.parking_convenience,
                          )}
                        </p>
                        <p className="text-[0.72rem] leading-7 text-muted">
                          {copy.sections.hotel.access.replace(
                            "{value}",
                            area.access_note,
                          )}
                        </p>
                        {area.parking_price_note ? (
                          <p className="text-[0.72rem] leading-7 text-muted">
                            {copy.sections.hotel.parkingNote.replace(
                              "{value}",
                              area.parking_price_note,
                            )}
                          </p>
                        ) : null}
                      </article>
                    ))}
                  </div>
                </section>
              ) : null}

              <section className="result-surface grid gap-3 p-4">
                <SectionHeading
                  kicker={copy.sections.footer.kicker}
                  title={copy.sections.footer.title}
                />
                <p className="text-[0.72rem] leading-7 text-muted">
                  {copy.footer}
                </p>
              </section>
            </aside>
          </div>
        </article>
      </div>
    </main>
  );
}

function SectionHeading({
  kicker,
  title,
}: {
  kicker: string;
  title: string;
}) {
  return (
    <div className="result-panel-head">
      <p className="result-panel-kicker">{kicker}</p>
      <h2 className="result-panel-title">{title}</h2>
    </div>
  );
}

function buildHeroMetrics(
  plan: PlanDraft,
  copy:
    | (typeof copyByLanguage)["zh-CN"]
    | (typeof copyByLanguage)["en"],
  language: OutputLanguage,
  exchangeRateSnapshot: ExchangeRateSnapshot,
  requestedBudgetHigh: number,
) {
  return [
    {
      label: copy.header.metrics.days,
      value: String(plan.days).padStart(2, "0"),
    },
    {
      label: copy.header.metrics.stops,
      value: String(plan.timeline.length).padStart(2, "0"),
    },
    {
      label: copy.header.metrics.reservations,
      value: String(plan.reservation_risks.length).padStart(2, "0"),
    },
    {
      label: copy.header.metrics.budget,
      value: formatBudgetAmount(
        requestedBudgetHigh,
        language,
        exchangeRateSnapshot,
      ),
    },
  ];
}

function buildShareHighlights(
  plan: PlanDraft,
  language: OutputLanguage,
  copy:
    | (typeof copyByLanguage)["zh-CN"]
    | (typeof copyByLanguage)["en"],
): ShareHighlight[] {
  const firstStop = plan.timeline[0];
  const reservationCount = plan.reservation_risks.length;

  return [
    {
      eyebrow: copy.header.highlights.firstMove,
      title:
        firstStop?.title ??
        copy.header.highlights.pending,
      copy: firstStop
        ? `${firstStop.start_time} - ${firstStop.end_time}`
        : copy.header.highlights.firstMoveEmpty,
      tone: "soft",
    },
    {
      eyebrow: copy.header.highlights.reservationLoad,
      title:
        reservationCount > 0
          ? language === "en"
            ? `${reservationCount} ${copy.header.highlights.alertUnit}`
            : `${reservationCount} ${copy.header.highlights.alertUnit}`
          : copy.header.highlights.noAlert,
      copy:
        reservationCount > 0
          ? plan.reservation_risks[0]?.poi_name ??
            copy.header.highlights.pending
          : copy.header.highlights.firstMoveEmpty,
      tone: "warm",
    },
    {
      eyebrow: copy.header.highlights.routeSpine,
      title:
        plan.execution_summary?.transport_strategy ??
        copy.header.highlights.routeSpinePending,
      copy:
        plan.execution_summary?.headline ??
        plan.summary ??
        copy.header.highlights.routeSpineEmpty,
      tone: "line",
    },
  ];
}

function groupTimelineByDay(timeline: TimelineItem[]) {
  const grouped = new Map<number, TimelineItem[]>();

  for (const item of timeline) {
    const dayItems = grouped.get(item.day_index) ?? [];
    dayItems.push(item);
    grouped.set(item.day_index, dayItems);
  }

  return Array.from(grouped.entries()).sort((left, right) => left[0] - right[0]);
}
