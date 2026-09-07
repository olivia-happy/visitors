"use client";

import { useRouter } from "next/navigation";
import {
  type CSSProperties,
  type ReactNode,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
} from "react";

import { ExecutionRoutePanel } from "@/components/result/execution-route-panel";
import { DepartureActionPanel } from "@/components/result/departure-action-panel";
import { ExchangeRateControl } from "@/components/result/exchange-rate-control";
import { HotelAreaPanel } from "@/components/result/hotel-area-panel";
import { ItineraryEditPanel } from "@/components/result/itinerary-edit-panel";
import { ParkingGuidePanel } from "@/components/result/parking-guide-panel";
import { PlanHeroSummary } from "@/components/result/plan-hero-summary";
import { PlanShareBar } from "@/components/result/plan-share-bar";
import { ReservationRiskPanel } from "@/components/result/reservation-risk-panel";
import { ResultBriefPanel } from "@/components/result/result-brief-panel";
import { ResultSpotlightPanel } from "@/components/result/result-spotlight-panel";
import { applyCurrencyDisplayToPlan } from "@/lib/currency";
import {
  buildEditableTimeline,
  getTimelineItemKey,
  removeTimelineStop,
  restoreTimelineStop,
  toggleLockedTimelineStop,
} from "@/lib/itinerary-editor";
import { localizePlanDraft } from "@/lib/plan-localizations";
import {
  formatBudgetCategory,
  formatChecklistCategory,
  formatCityName,
  formatGraphEdgeLabel,
  formatGraphNodeType,
  formatTransportMode,
} from "@/lib/result-formatters";
import { buildPrimaryResultSections } from "@/lib/result-helpers";
import type {
  ChecklistItem,
  GraphEdge,
  GraphNode,
  OutputLanguage,
  PlanDraft,
  TimelineItem,
  ExchangeRateSnapshot,
} from "@/lib/schemas";
import { buildViewHref } from "@/lib/view-state";

type PlanResultShellProps = {
  exchangeRateSnapshot: ExchangeRateSnapshot;
  initialLanguage?: OutputLanguage;
  initialSurfaceMode?: SurfaceMode;
  initialThemeMode?: ThemeMode;
  plan: PlanDraft | null;
  planId: string;
  mode?: "live" | "showcase";
};

type SurfaceMode = "default" | "stage";
type ThemeMode = "light" | "dark";
type TimelineFilter = "all" | number;
type ExchangeRateRefreshStatus = "idle" | "success" | "error";

type EditableTimelineState = {
  flexibleCount: number;
  lockedCount: number;
  removedCount: number;
  timeline: TimelineItem[];
};

type TimelineCopy = {
  kicker: string;
  title: string;
  summary: (days: number) => string;
  pending: string;
  empty: string;
  allDays: string;
  currentScope: string;
  day: string;
  stops: string;
  reservations: string;
  transit: string;
  window: string;
  routeDuration: string;
  stopIndex: string;
  reservationReady: string;
  reservationMissing: string;
  noReservation: string;
  reservationChannel: string;
  reservationPrice: string;
};

type ChecklistCopy = {
  kicker: string;
  title: string;
  empty: string;
};

type GraphCopy = {
  kicker: string;
  title: string;
  nodes: string;
  edges: string;
  empty: string;
};

type ChecklistGroup = {
  category: string;
  label: string;
  items: ChecklistItem[];
};

type GraphNodeGroup = {
  type: string;
  label: string;
  nodes: GraphNode[];
};

type GraphEdgeRow = {
  source: string;
  target: string;
  label: string;
  sourceLabel: string;
  targetLabel: string;
};

const checklistCategoryOrder: Record<string, number> = {
  documents: 0,
  weather: 1,
};

const graphNodeTypeOrder: Record<string, number> = {
  city: 0,
  day: 1,
  attraction: 2,
  reservation: 3,
  budget: 4,
};

const copyByLanguage = {
  "zh-CN": {
    pageTitle: (city: string) => `${city} · 行程结果`,
    toolbar: {
      language: "语言",
      theme: "明暗",
      languageZh: "中文",
      languageEn: "EN",
      light: "亮色",
      dark: "暗色",
    },
    topStamps: {
      result: "结果页",
      bilingual: "中英切换",
      mobile: "适配手机",
    },
    brief: {
      kicker: "结果总览 // 执行账本",
      note: "把路线、预约、预算和地图压缩成一张可以直接截图分享的出行总控卡。",
      labels: {
        city: "城市",
        days: "天数",
        budget: "预算",
        stops: "行程节点",
        reservations: "预约提醒",
      },
      dayUnit: "天",
      stopUnit: "项",
      reservationUnit: "条",
      none: "暂无",
      pending: "待生成",
    },
    budget: {
      currency: "人民币 {low} - {high}",
    },
    timeline: {
      kicker: "时间轴",
      title: "完整时间轴",
      summary: (days: number) => `${days} 天结构化结果`,
      pending: "时间轴待生成",
      empty: "生成完成后，按小时展开的完整时间轴会显示在这里。",
      allDays: "全部天数",
      currentScope: "当前筛选",
      day: "第 {day} 天",
      stops: "{value} 个节点",
      reservations: "{value} 个预约点",
      transit: "交通 {value} 分钟",
      window: "{start} - {end}",
      routeDuration: "交通 // {mode} · {minutes} 分钟",
      stopIndex: "节点 {value}",
      reservationReady: "含预约",
      reservationMissing: "无预约",
      noReservation: "这个节点暂时没有明确的预约证据。",
      reservationChannel: "渠道：{value}",
      reservationPrice: "价格：{value}",
    },
    checklist: {
      kicker: "行前清单",
      title: "准备清单",
      empty: "证件、天气、穿搭和出发前提醒会显示在这里。",
    },
    graph: {
      kicker: "关系结构",
      title: "节点关系图",
      nodes: "节点",
      edges: "连线",
      empty: "生成后的关系图会把城市、日期块、景点、预算分类和预约依赖串联起来。",
    },
  },
  en: {
    pageTitle: (city: string) => `${city} · Trip Result`,
    toolbar: {
      language: "Language",
      theme: "Theme",
      languageZh: "CN",
      languageEn: "EN",
      light: "Light",
      dark: "Dark",
    },
    topStamps: {
      result: "Result view",
      bilingual: "CN / EN",
      mobile: "Mobile-ready",
    },
    brief: {
      kicker: "Result desk // execution ledger",
      note: "Compress route, reservations, budget, and map cues into one screenshot-ready travel brief.",
      labels: {
        city: "City",
        days: "Days",
        budget: "Budget",
        stops: "Stops",
        reservations: "Alerts",
      },
      dayUnit: "days",
      stopUnit: "legs",
      reservationUnit: "alerts",
      none: "None",
      pending: "Pending",
    },
    budget: {
      currency: "RMB {low} - {high}",
    },
    timeline: {
      kicker: "Timeline",
      title: "Full timeline",
      summary: (days: number) => `${days}-day structured result`,
      pending: "Timeline pending",
      empty: "The hour-level execution timeline will appear here after generation.",
      allDays: "All days",
      currentScope: "Current scope",
      day: "Day {day}",
      stops: "{value} stops",
      reservations: "{value} reservation stops",
      transit: "{value} min transit",
      window: "{start} - {end}",
      routeDuration: "Transit // {mode} · {minutes} min",
      stopIndex: "Stop {value}",
      reservationReady: "Reservation",
      reservationMissing: "No reservation",
      noReservation: "No explicit reservation evidence is attached to this stop yet.",
      reservationChannel: "Channel: {value}",
      reservationPrice: "Price: {value}",
    },
    checklist: {
      kicker: "Checklist",
      title: "Checklist",
      empty:
        "Documents, weather prep, clothing, and departure reminders will appear here.",
    },
    graph: {
      kicker: "Node graph",
      title: "Node graph",
      nodes: "Nodes",
      edges: "Edges",
      empty:
        "The generated graph will connect city, day blocks, attractions, budget categories, and reservation dependencies.",
    },
  },
} as const;

const surfaceCopyByLanguage = {
  "zh-CN": {
    enter: "进入展示模式",
    exit: "退出展示",
    navKicker: "章节导航",
    navHint: "P 切换 · 1-5 跳转 · Esc 退出",
    sections: {
      overview: "总览",
      priorities: "优先项",
      cityStage: "城市中枢",
      timeline: "时间轴",
      system: "准备板",
    },
  },
  en: {
    enter: "Enter presentation",
    exit: "Exit presentation",
    navKicker: "Section nav",
    navHint: "P toggle · 1-5 jump · Esc exit",
    sections: {
      overview: "Overview",
      priorities: "Priorities",
      cityStage: "City stage",
      timeline: "Timeline",
      system: "Ready deck",
    },
  },
} as const;

const stageSystemLabelByLanguage = {
  "zh-CN": "行前与关系图",
  en: "Prep + graph",
} as const;

export function PlanResultShell({
  exchangeRateSnapshot: initialExchangeRateSnapshot,
  initialLanguage,
  initialSurfaceMode = "default",
  initialThemeMode = "light",
  plan,
  planId,
  mode = "live",
}: PlanResultShellProps) {
  const router = useRouter();
  const [language, setLanguage] = useState<OutputLanguage>(
    initialLanguage ?? (plan?.output_language === "en" ? "en" : "zh-CN"),
  );
  const [surfaceMode, setSurfaceMode] =
    useState<SurfaceMode>(initialSurfaceMode);
  const [themeMode, setThemeMode] = useState<ThemeMode>(initialThemeMode);
  const [exchangeRateSnapshot, setExchangeRateSnapshot] = useState(
    initialExchangeRateSnapshot,
  );
  const [exchangeRateRefreshStatus, setExchangeRateRefreshStatus] =
    useState<ExchangeRateRefreshStatus>("idle");
  const [isRefreshingExchangeRate, setIsRefreshingExchangeRate] =
    useState(false);
  const [activeTimelineDay, setActiveTimelineDay] =
    useState<TimelineFilter>("all");
  const [lockedTimelineKeys, setLockedTimelineKeys] = useState<string[]>([]);
  const [removedTimelineKeys, setRemovedTimelineKeys] = useState<string[]>([]);
  const [optimizationVersion, setOptimizationVersion] = useState(0);

  const displayPlan = applyCurrencyDisplayToPlan(
    localizePlanDraft(plan, language),
    language,
    exchangeRateSnapshot,
  ) as PlanDraft | null;
  const copy = copyByLanguage[language];
  const surfaceCopy = surfaceCopyByLanguage[language];
  const cityName = formatCityName(displayPlan?.city, language);
  const pageTitle = copy.pageTitle(cityName);
  const stageSections = useMemo(
    () => buildStageSections(surfaceCopy, language),
    [language, surfaceCopy],
  );

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
      surface: surfaceMode,
      theme: themeMode,
    });
    if (currentHref !== nextHref) {
      router.replace(nextHref, { scroll: false });
    }
  }, [language, router, surfaceMode, themeMode]);

  useEffect(() => {
    if (exchangeRateRefreshStatus === "idle") {
      return;
    }

    const timer = window.setTimeout(() => {
      setExchangeRateRefreshStatus("idle");
    }, 2200);

    return () => window.clearTimeout(timer);
  }, [exchangeRateRefreshStatus]);

  const primarySections = buildPrimaryResultSections(displayPlan);
  const sourceTimeline = displayPlan?.timeline ?? [];
  const editableTimelineState = buildEditableTimeline(sourceTimeline, {
    lockedKeys: lockedTimelineKeys,
    optimizationVersion,
    removedKeys: removedTimelineKeys,
  }) as EditableTimelineState;
  const timeline = editableTimelineState.timeline;
  const removedTimelineStops = sourceTimeline.filter((item) =>
    removedTimelineKeys.includes(getTimelineItemKey(item)),
  );
  const mapPoints = displayPlan?.map_points ?? [];
  const budgetItems = displayPlan?.budget_items ?? [];
  const checklistItems = displayPlan?.checklist_items ?? [];
  const weatherSummary = displayPlan?.weather_summary ?? null;
  const graphNodes = displayPlan?.graph.nodes ?? [];
  const graphEdges = displayPlan?.graph.edges ?? [];
  const timelineDays = groupTimelineByDay(timeline);
  const resolvedTimelineDay =
    activeTimelineDay === "all" ||
    timelineDays.some((day) => day.dayIndex === activeTimelineDay)
      ? activeTimelineDay
      : "all";
  const visibleTimelineDays =
    resolvedTimelineDay === "all"
      ? timelineDays
      : timelineDays.filter((day) => day.dayIndex === resolvedTimelineDay);
  const visibleTimelineItems = visibleTimelineDays.flatMap((day) => day.items);
  const timelineSummary = buildTimelineSummary(visibleTimelineItems);
  const activeTimelineScopeLabel =
    resolvedTimelineDay === "all"
      ? copy.timeline.allDays
      : copy.timeline.day.replace("{day}", String(resolvedTimelineDay));
  const isStageMode = surfaceMode === "stage";
  const [activeStageSection, setActiveStageSection] = useState(
    stageSections[0].id,
  );

  useEffect(() => {
    const targets = stageSections
      .map((section) => document.getElementById(section.id))
      .filter((section): section is HTMLElement => Boolean(section));

    if (!targets.length) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntries = entries
          .filter((entry) => entry.isIntersecting)
          .sort((left, right) => right.intersectionRatio - left.intersectionRatio);

        if (visibleEntries[0]?.target.id) {
          setActiveStageSection(visibleEntries[0].target.id);
        }
      },
      {
        rootMargin: "-16% 0px -54% 0px",
        threshold: [0.22, 0.38, 0.58],
      },
    );

    targets.forEach((target) => observer.observe(target));
    return () => observer.disconnect();
  }, [stageSections]);

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

  function handleEnterStageMode() {
    setSurfaceMode("stage");
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function handleExitStageMode() {
    setSurfaceMode("default");
  }

  function handleJumpToStageSection(sectionId: string) {
    const section = document.getElementById(sectionId);
    if (!section) {
      return;
    }

    setActiveStageSection(sectionId);
    section.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  function handleToggleTimelineLock(stopKey: string) {
    setLockedTimelineKeys((current) =>
      toggleLockedTimelineStop(current, stopKey),
    );
  }

  function handleRemoveTimelineStop(stopKey: string) {
    setRemovedTimelineKeys((current) =>
      removeTimelineStop({
        lockedKeys: lockedTimelineKeys,
        removedKeys: current,
        stopKey,
      }),
    );
  }

  function handleRestoreTimelineStop(stopKey: string) {
    setRemovedTimelineKeys((current) => restoreTimelineStop(current, stopKey));
  }

  function handleOptimizeTimeline() {
    setOptimizationVersion((current) => current + 1);
  }

  function handleResetTimelineEdits() {
    setLockedTimelineKeys([]);
    setRemovedTimelineKeys([]);
    setOptimizationVersion(0);
  }

  useEffect(() => {
    const handleKeydown = (event: KeyboardEvent) => {
      if (
        event.defaultPrevented ||
        event.altKey ||
        event.ctrlKey ||
        event.metaKey
      ) {
        return;
      }

      const target = event.target;
      if (
        target instanceof HTMLElement &&
        (target.isContentEditable ||
          ["INPUT", "SELECT", "TEXTAREA"].includes(target.tagName))
      ) {
        return;
      }

      if (event.key.toLowerCase() !== "p") {
        if (isStageMode && event.key === "Escape") {
          event.preventDefault();
          setSurfaceMode("default");
          return;
        }

        if (isStageMode && /^[1-5]$/.test(event.key)) {
          const section = stageSections[Number(event.key) - 1];
          if (section) {
            event.preventDefault();
            handleJumpToStageSection(section.id);
          }
        }

        return;
      }

      event.preventDefault();
      setSurfaceMode((current) =>
        current === "stage" ? "default" : "stage",
      );
    };

    window.addEventListener("keydown", handleKeydown);
    return () => window.removeEventListener("keydown", handleKeydown);
  }, [isStageMode, stageSections]);

  return (
    <main
      className="planner-root result-page min-h-screen px-4 py-5 pb-72 text-foreground sm:px-6 sm:py-6 sm:pb-64 md:pb-48"
      data-surface={surfaceMode}
      data-theme={themeMode}
    >
      {isStageMode ? (
        <ResultStageRail
          activeSection={activeStageSection}
          copy={surfaceCopy}
          onExit={handleExitStageMode}
          onJump={handleJumpToStageSection}
          sections={stageSections}
        />
      ) : null}

      <div className="mx-auto grid w-full max-w-[90rem] gap-5">
        <section
          id="result-overview"
          className="result-stage-section result-hero-frame result-showcase-hero result-reveal grid gap-5 px-5 py-5 sm:px-6 sm:py-6 xl:px-7 xl:py-7"
          data-stage-state={getStageSectionState("result-overview", activeStageSection)}
          style={buildRevealStyle(0)}
        >
          {isStageMode ? (
            <StageSectionLabel
              index="01"
              label={surfaceCopy.sections.overview}
            />
          ) : null}
          <div className="planner-toolbar mb-0">
            <div className="flex flex-wrap gap-2">
              <span className="planner-stamp">{copy.topStamps.result}</span>
              <span className="planner-stamp" data-tone="soft">
                {copy.topStamps.bilingual}
              </span>
              <span className="planner-stamp" data-tone="warm">
                {copy.topStamps.mobile}
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

              <ExchangeRateControl
                isRefreshing={isRefreshingExchangeRate}
                language={language}
                onRefresh={handleRefreshExchangeRate}
                refreshStatus={exchangeRateRefreshStatus}
                snapshot={exchangeRateSnapshot}
                variant="toolbar"
              />
            </div>
          </div>

          <div className="result-showcase-cover-grid">
            <PlanHeroSummary
              exchangeRateSnapshot={exchangeRateSnapshot}
              language={language}
              mode={mode}
              plan={displayPlan}
              planId={planId}
            />

            <ResultBriefPanel
              exchangeRateSnapshot={exchangeRateSnapshot}
              language={language}
              plan={displayPlan}
            />
          </div>
        </section>

        <section
          id="result-priorities"
          className="result-stage-section grid gap-5 xl:grid-cols-2"
          data-stage-state={getStageSectionState("result-priorities", activeStageSection)}
        >
          {isStageMode ? (
            <StageSectionLabel
              index="02"
              label={surfaceCopy.sections.priorities}
            />
          ) : null}
          <Reveal delay={70}>
            <DepartureActionPanel
              exchangeRateSnapshot={exchangeRateSnapshot}
              language={language}
              onJumpToSection={handleJumpToStageSection}
              plan={displayPlan}
            />
          </Reveal>
          {primarySections.includes("reservation_risks") ? (
            <Reveal delay={90}>
              <ReservationRiskPanel
                language={language}
                risks={displayPlan?.reservation_risks ?? []}
              />
            </Reveal>
          ) : null}
          {primarySections.includes("execution_route") ? (
            <Reveal delay={140}>
              <ExecutionRoutePanel
                executionSummary={displayPlan?.execution_summary ?? null}
                language={language}
                timeline={timeline}
              />
            </Reveal>
          ) : null}
          <Reveal delay={165}>
            <ItineraryEditPanel
              language={language}
              lockedKeys={lockedTimelineKeys}
              optimizationVersion={optimizationVersion}
              removedStops={removedTimelineStops}
              stats={editableTimelineState}
              timeline={timeline}
              onOptimize={handleOptimizeTimeline}
              onRemoveStop={handleRemoveTimelineStop}
              onReset={handleResetTimelineEdits}
              onRestoreStop={handleRestoreTimelineStop}
              onToggleLock={handleToggleTimelineLock}
            />
          </Reveal>
          {primarySections.includes("parking_guides") ? (
            <Reveal delay={190}>
              <ParkingGuidePanel
                guides={displayPlan?.parking_guides ?? []}
                language={language}
              />
            </Reveal>
          ) : null}
          {primarySections.includes("hotel_areas") ? (
            <Reveal delay={240}>
              <HotelAreaPanel
                areas={displayPlan?.hotel_area_recommendations ?? []}
                language={language}
              />
            </Reveal>
          ) : null}
        </section>

        <section className="result-lower-grid grid gap-5 xl:grid-cols-[1.24fr_0.76fr]">
          <div className="result-main-column grid gap-5">
            <section
              id="result-city-stage"
              className="result-stage-section"
              data-stage-state={getStageSectionState("result-city-stage", activeStageSection)}
            >
              {isStageMode ? (
                <StageSectionLabel
                  index="03"
                  label={surfaceCopy.sections.cityStage}
                />
              ) : null}
              <Reveal delay={300}>
                <ResultSpotlightPanel
                  budgetItems={budgetItems}
                  cityName={cityName}
                  exchangeRateSnapshot={exchangeRateSnapshot}
                  executionSummary={displayPlan?.execution_summary ?? null}
                  hotelAreas={displayPlan?.hotel_area_recommendations ?? []}
                  language={language}
                  mapPoints={mapPoints}
                  parkingGuides={displayPlan?.parking_guides ?? []}
                  timeline={timeline}
                  weatherSummary={weatherSummary}
              />
            </Reveal>
          </section>

            <div
              id="result-timeline"
              className="result-stage-section result-card result-editorial-frame result-timeline-frame result-reveal p-5"
              data-stage-state={getStageSectionState("result-timeline", activeStageSection)}
              style={buildRevealStyle(360)}
            >
              {isStageMode ? (
                <StageSectionLabel
                  index="04"
                  label={surfaceCopy.sections.timeline}
                />
              ) : null}
              <div className="result-timeline-head">
                <div className="result-panel-head">
                  <p className="result-panel-kicker">{copy.timeline.kicker}</p>
                  <h2 className="result-panel-title">{copy.timeline.title}</h2>
                </div>
                <span className="result-timeline-head-meta">
                  {timeline.length
                    ? copy.timeline.summary(displayPlan?.days ?? 1)
                    : copy.timeline.pending}
                </span>
              </div>

              <div className="mt-4">
                {timelineDays.length ? (
                  <div className="result-timeline-shell">
                    {timelineDays.length > 1 ? (
                      <div className="result-day-switcher">
                        <button
                          type="button"
                          className="result-day-switch"
                          data-state={
                            resolvedTimelineDay === "all" ? "active" : "idle"
                          }
                          onClick={() => setActiveTimelineDay("all")}
                        >
                          <span className="result-day-switch-label">
                            {copy.timeline.allDays}
                          </span>
                          <span className="result-day-switch-meta">
                            x{timeline.length}
                          </span>
                        </button>
                        {timelineDays.map((day) => (
                          <button
                            key={`switch-${day.dayIndex}`}
                            type="button"
                            className="result-day-switch"
                            data-state={
                              resolvedTimelineDay === day.dayIndex
                                ? "active"
                                : "idle"
                            }
                            onClick={() => setActiveTimelineDay(day.dayIndex)}
                          >
                            <span className="result-day-switch-label">
                              {copy.timeline.day.replace(
                                "{day}",
                                String(day.dayIndex),
                              )}
                            </span>
                            <span className="result-day-switch-meta">
                              {day.startTime} - {day.endTime} · x{day.items.length}
                            </span>
                          </button>
                        ))}
                      </div>
                    ) : null}

                    <div className="result-timeline-summary">
                      <span className="result-timeline-summary-badge">
                        {copy.timeline.currentScope}: {activeTimelineScopeLabel}
                      </span>
                      <span className="result-timeline-summary-chip">
                        {copy.timeline.stops.replace(
                          "{value}",
                          String(timelineSummary.stopCount),
                        )}
                      </span>
                      <span className="result-timeline-summary-chip">
                        {copy.timeline.reservations.replace(
                          "{value}",
                          String(timelineSummary.reservationCount),
                        )}
                      </span>
                      <span className="result-timeline-summary-chip">
                        {copy.timeline.transit.replace(
                          "{value}",
                          String(timelineSummary.transitMinutes),
                        )}
                      </span>
                      <span className="result-timeline-summary-chip">
                        {copy.timeline.window
                          .replace("{start}", timelineSummary.startTime)
                          .replace("{end}", timelineSummary.endTime)}
                      </span>
                    </div>

                    {visibleTimelineDays.map((day) => (
                      <section
                        key={`day-${day.dayIndex}`}
                        className="result-day-block"
                      >
                        <div className="result-day-header">
                          <div className="flex min-w-0 items-start gap-3">
                            <span className="result-day-index">
                              D{day.dayIndex}
                            </span>
                            <div className="min-w-0">
                              <h3 className="result-day-title">
                                {copy.timeline.day.replace(
                                  "{day}",
                                  String(day.dayIndex),
                                )}
                              </h3>
                              <p className="result-day-meta">
                                {day.startTime} - {day.endTime}
                              </p>
                            </div>
                          </div>
                          <span className="result-chip-line text-[0.62rem] font-semibold text-foreground">
                            x{day.items.length}
                          </span>
                        </div>

                        <div className="result-day-summary">
                          <span className="result-day-summary-chip">
                            {copy.timeline.stops.replace(
                              "{value}",
                              String(day.items.length),
                            )}
                          </span>
                          <span className="result-day-summary-chip">
                            {copy.timeline.reservations.replace(
                              "{value}",
                              String(
                                day.items.filter((item) => item.reservation_hint)
                                  .length,
                              ),
                            )}
                          </span>
                          <span className="result-day-summary-chip">
                            {copy.timeline.transit.replace(
                              "{value}",
                              String(
                                day.items.reduce(
                                  (sum, item) =>
                                    sum + item.transport_duration_minutes,
                                  0,
                                ),
                              ),
                            )}
                          </span>
                        </div>

                        <div className="result-day-rail">
                          {day.items.map((item, itemIndex) => (
                            <TimelineCard
                              copy={copy.timeline}
                              index={itemIndex + 1}
                              isLocked={lockedTimelineKeys.includes(
                                getTimelineItemKey(item),
                              )}
                              item={item}
                              key={`${item.day_index}-${item.start_time}-${item.title}`}
                              language={language}
                            />
                          ))}
                        </div>
                      </section>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm leading-7 text-muted">
                    {copy.timeline.empty}
                  </p>
                )}
              </div>
            </div>
          </div>

          <aside
            id="result-system"
            className="result-stage-section result-secondary-column grid gap-5"
            data-stage-state={getStageSectionState("result-system", activeStageSection)}
          >
            {isStageMode ? (
              <StageSectionLabel
                index="05"
                label={surfaceCopy.sections.system}
              />
            ) : null}
            <Reveal delay={420}>
              <ChecklistPanel
                copy={copy.checklist}
                items={checklistItems}
                language={language}
              />
            </Reveal>
            <Reveal delay={470}>
              <GraphPanel
                copy={copy.graph}
                edges={graphEdges}
                language={language}
                nodes={graphNodes}
              />
            </Reveal>
          </aside>
        </section>
      </div>

      {!isStageMode ? (
        <PlanShareBar
          exchangeRateSnapshot={exchangeRateSnapshot}
          language={language}
          mode={mode}
          onEnterStageMode={handleEnterStageMode}
          plan={displayPlan}
          planId={planId}
          themeMode={themeMode}
        />
      ) : null}
    </main>
  );
}

function Reveal({
  children,
  delay,
}: {
  children: ReactNode;
  delay: number;
}) {
  return (
    <div className="result-reveal" style={buildRevealStyle(delay)}>
      {children}
    </div>
  );
}

function buildRevealStyle(delay: number): CSSProperties {
  return {
    ["--result-reveal-delay" as string]: `${delay}ms`,
  };
}

function buildStageSections(
  copy: (typeof surfaceCopyByLanguage)["zh-CN"] | (typeof surfaceCopyByLanguage)["en"],
  language: OutputLanguage,
) {
  return [
    {
      id: "result-overview",
      index: "01",
      label: copy.sections.overview,
    },
    {
      id: "result-priorities",
      index: "02",
      label: copy.sections.priorities,
    },
    {
      id: "result-city-stage",
      index: "03",
      label: copy.sections.cityStage,
    },
    {
      id: "result-timeline",
      index: "04",
      label: copy.sections.timeline,
    },
    {
      id: "result-system",
      index: "05",
      label: stageSystemLabelByLanguage[language],
    },
  ];
}

function getStageSectionState(sectionId: string, activeSection: string) {
  return activeSection === sectionId ? "active" : "idle";
}

function StageSectionLabel({
  index,
  label,
}: {
  index: string;
  label: string;
}) {
  return (
    <div className="result-stage-scene-label" aria-hidden="true">
      <span className="result-stage-scene-index">{index}</span>
      <span className="result-stage-scene-name">{label}</span>
    </div>
  );
}

function ResultStageRail({
  activeSection,
  copy,
  onExit,
  onJump,
  sections,
}: {
  activeSection: string;
  copy: (typeof surfaceCopyByLanguage)["zh-CN"] | (typeof surfaceCopyByLanguage)["en"];
  onExit: () => void;
  onJump: (sectionId: string) => void;
  sections: Array<{
    id: string;
    index: string;
    label: string;
  }>;
}) {
  return (
    <nav className="result-stage-rail print:hidden" aria-label={copy.navKicker}>
      <div className="result-stage-rail-shell">
        <div className="result-stage-rail-head">
          <div className="grid gap-1">
            <p className="result-stage-rail-kicker">{copy.navKicker}</p>
            <p className="result-stage-rail-hint">{copy.navHint}</p>
          </div>
          <button
            type="button"
            className="result-stage-exit"
            onClick={onExit}
          >
            {copy.exit}
          </button>
        </div>

        <div className="result-stage-rail-list">
          {sections.map((section) => (
            <button
              key={section.id}
              type="button"
              className="result-stage-rail-button"
              data-state={activeSection === section.id ? "active" : "idle"}
              onClick={() => onJump(section.id)}
            >
              <span className="result-stage-rail-index">{section.index}</span>
              <span className="result-stage-rail-label">{section.label}</span>
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
}

function TimelineCard({
  copy,
  index,
  isLocked = false,
  item,
  language,
}: {
  copy: TimelineCopy;
  index: number;
  isLocked?: boolean;
  item: TimelineItem;
  language: OutputLanguage;
}) {
  const routeDuration = copy.routeDuration
    .replace("{mode}", formatTransportMode(item.transport_mode, language))
    .replace("{minutes}", String(item.transport_duration_minutes));

  return (
    <article className="result-timeline-stop">
      <div className="result-timeline-clock">
        <span className="result-timeline-time">{item.start_time}</span>
        <span className="result-timeline-time-end">{item.end_time}</span>
      </div>

      <div className="result-timeline-body">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="result-timeline-chip-row">
              <span className="result-timeline-step">
                {copy.stopIndex.replace("{value}", String(index).padStart(2, "0"))}
              </span>
              <span
                className={
                  item.reservation_hint
                    ? "result-chip-warm text-[0.62rem] font-semibold text-foreground"
                    : "result-chip-line text-[0.62rem] font-semibold text-foreground"
                }
              >
                {item.reservation_hint
                  ? copy.reservationReady
                  : copy.reservationMissing}
              </span>
              {item.reservation_hint?.price_note ? (
                <span className="result-chip-soft text-[0.62rem] font-semibold">
                  {item.reservation_hint.price_note}
                </span>
              ) : null}
              {isLocked ? (
                <span className="result-itinerary-editor-lock-chip">
                  {language === "en" ? "Locked" : "已锁定"}
                </span>
              ) : null}
            </div>
            <p className="result-timeline-route">{routeDuration}</p>
            <h3 className="result-timeline-title">{item.title}</h3>
          </div>
        </div>

        <p className="result-timeline-notes">{item.notes}</p>

        <div className="result-timeline-reservation result-surface-secondary">
          {item.reservation_hint ? (
            <div className="grid gap-2">
              <p className="result-timeline-reservation-copy">
                {item.reservation_hint.reminder_text}
              </p>
              <div className="flex flex-wrap gap-2 text-[0.62rem]">
                {item.reservation_hint.reservation_channel ? (
                  <span className="result-chip-soft">
                    {copy.reservationChannel.replace(
                      "{value}",
                      item.reservation_hint.reservation_channel,
                    )}
                  </span>
                ) : null}
                {item.reservation_hint.price_note ? (
                  <span className="result-chip-warm text-foreground">
                    {copy.reservationPrice.replace(
                      "{value}",
                      item.reservation_hint.price_note,
                    )}
                  </span>
                ) : null}
              </div>
            </div>
          ) : (
            <p className="result-timeline-reservation-copy">
              {copy.noReservation}
            </p>
          )}
        </div>
      </div>
    </article>
  );
}

function ChecklistPanel({
  copy,
  items,
  language,
}: {
  copy: ChecklistCopy;
  items: ChecklistItem[];
  language: OutputLanguage;
}) {
  const groups = groupChecklistByCategory(items, language);
  const totalItems = groups.reduce((sum, group) => sum + group.items.length, 0);
  const panelCopy =
    language === "en"
      ? {
          kicker: "Departure deck",
          title: "Pack and verify",
          itemsLabel: "Items",
          groupsLabel: "Lanes",
          summary: getChecklistBoardNote(groups, language),
        }
      : {
          kicker: "出发准备",
          title: "行前核验板",
          itemsLabel: "物品项",
          groupsLabel: "分类层",
          summary: getChecklistBoardNote(groups, language),
        };

  return (
    <section className="result-card result-editorial-frame result-side-panel result-checklist-panel p-5">
      <div className="result-panel-head">
        <p className="result-panel-kicker">{panelCopy.kicker}</p>
        <h2 className="result-panel-title">{panelCopy.title}</h2>
      </div>

      <div className="mt-4">
        {groups.length ? (
          <div className="result-checklist-board">
            <article className="result-checklist-brief">
              <div className="result-checklist-brief-grid">
                <div className="result-checklist-brief-metric">
                  <p className="result-checklist-brief-label">
                    {panelCopy.itemsLabel}
                  </p>
                  <p className="result-checklist-brief-value">
                    {String(totalItems).padStart(2, "0")}
                  </p>
                </div>
                <div className="result-checklist-brief-metric">
                  <p className="result-checklist-brief-label">
                    {panelCopy.groupsLabel}
                  </p>
                  <p className="result-checklist-brief-value">
                    {String(groups.length).padStart(2, "0")}
                  </p>
                </div>
              </div>
              <p className="result-checklist-brief-note">{panelCopy.summary}</p>
            </article>

            {groups.map((group, index) => (
              <article
                key={`${group.category}-${group.label}`}
                className="result-checklist-group"
                data-tone={getChecklistGroupTone(group.category, index)}
              >
                <div className="result-checklist-header">
                  <div className="result-checklist-header-copy">
                    <span
                      className={
                        getChecklistGroupTone(group.category, index) === "warm"
                          ? "result-chip-warm text-[0.62rem] font-semibold text-foreground"
                          : "result-chip-soft text-[0.62rem] font-semibold"
                      }
                    >
                      {group.label}
                    </span>
                    <p className="result-checklist-guide">
                      {getChecklistGroupNote(group.category, language)}
                    </p>
                  </div>
                  <span className="result-checklist-count">
                    {String(group.items.length).padStart(2, "0")}
                  </span>
                </div>

                <div className="result-checklist-items">
                  {group.items.map((checklistItem, itemIndex) => (
                    <div
                      key={`${checklistItem.category}-${checklistItem.item_name}`}
                      className="result-checklist-item"
                    >
                      <span className="result-checklist-item-index">
                        {String(itemIndex + 1).padStart(2, "0")}
                      </span>
                      <div className="result-checklist-item-copy">
                        <h3 className="result-checklist-item-name">
                          {checklistItem.item_name}
                        </h3>
                        <p className="result-checklist-item-reason">
                          {checklistItem.reason}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p className="text-sm leading-7 text-muted">{copy.empty}</p>
        )}
      </div>
    </section>
  );
}

function GraphPanel({
  copy,
  edges,
  language,
  nodes,
}: {
  copy: GraphCopy;
  edges: GraphEdge[];
  language: OutputLanguage;
  nodes: GraphNode[];
}) {
  const nodeGroups = groupGraphNodes(nodes, language);
  const edgeRows = buildGraphEdgeRows(edges, language, nodes);
  const panelCopy =
    language === "en"
      ? {
          kicker: "Route logic",
          title: "Decision map",
          groupsLabel: "Layers",
          flowLabel: "Primary chain",
          flowNote:
            "Read this strip from left to right to see what anchors the city, the day blocks, and the reservation or budget logic behind them.",
          linksLabel: "Dependency lines",
          linksNote:
            "These links show which city block, attraction, reservation cue, or budget bucket is tied together in the generated plan.",
          from: "From",
          to: "To",
          relationFallback: "Link",
          groupUnit: "links",
        }
      : {
          kicker: "路线逻辑",
          title: "决策关系图",
          groupsLabel: "分区层",
          flowLabel: "主链路",
          flowNote:
            "从左到右看这一条主链，就能快速判断这座城市、每天行程、预约提示和预算归属是怎么串起来的。",
          linksLabel: "依赖连线",
          linksNote:
            "下面这些连线会把城市骨架、景点节点、预约提醒和预算归属放进一张可直接判断先后顺序的图里。",
          from: "起点",
          to: "落点",
          relationFallback: "关联",
          groupUnit: "条关联",
        };

  return (
    <section className="result-card result-editorial-frame result-side-panel result-graph-panel p-5">
      <div className="result-panel-head">
        <p className="result-panel-kicker">{panelCopy.kicker}</p>
        <h2 className="result-panel-title">{panelCopy.title}</h2>
      </div>

      {nodes.length ? (
        <div className="result-graph-shell mt-4">
          <article className="result-graph-overview">
            <div className="result-graph-metrics">
              <article className="result-graph-metric">
                <p className="result-graph-metric-label">{copy.nodes}</p>
                <p className="result-graph-metric-value">{nodes.length}</p>
              </article>
              <article className="result-graph-metric">
                <p className="result-graph-metric-label">{copy.edges}</p>
                <p className="result-graph-metric-value">{edges.length}</p>
              </article>
              <article className="result-graph-metric">
                <p className="result-graph-metric-label">
                  {panelCopy.groupsLabel}
                </p>
                <p className="result-graph-metric-value">{nodeGroups.length}</p>
              </article>
            </div>

            <div className="result-graph-spine">
              <div className="result-graph-spine-head">
                <p className="result-graph-links-kicker">{panelCopy.flowLabel}</p>
                <span className="result-chip-soft text-[0.58rem] font-semibold">
                  x{nodeGroups.length}
                </span>
              </div>
              <div className="result-graph-spine-track">
                {nodeGroups.map((group, index) => (
                  <div className="result-graph-spine-step" key={group.type}>
                    <span
                      className="result-graph-spine-node"
                      data-tone={getGraphGroupTone(group.type, index)}
                    >
                      {group.label}
                    </span>
                    {index < nodeGroups.length - 1 ? (
                      <span className="result-graph-spine-arrow">-&gt;</span>
                    ) : null}
                  </div>
                ))}
              </div>
              <p className="result-graph-spine-note">{panelCopy.flowNote}</p>
            </div>
          </article>

          <div className="result-graph-clusters">
            {nodeGroups.map((group, index) => (
              <article
                key={group.type}
                className="result-graph-cluster"
                data-tone={getGraphGroupTone(group.type, index)}
              >
                <div className="result-graph-cluster-head">
                  <div className="result-graph-cluster-copy">
                    <p className="result-graph-cluster-title">{group.label}</p>
                    <p className="result-graph-cluster-note">
                      {getGraphGroupNote(group.type, language)}
                    </p>
                  </div>
                  <div className="result-graph-cluster-meta">
                    <span className="result-checklist-count">
                      {String(group.nodes.length).padStart(2, "0")}
                    </span>
                    <span className="result-graph-connection-chip">
                      {countEdgesForNodeGroup(group, edges)} {panelCopy.groupUnit}
                    </span>
                  </div>
                </div>
                <div className="result-graph-node-cloud">
                  {group.nodes.map((node) => (
                    <span
                      key={node.id}
                      className="result-chip-line text-[0.68rem] text-foreground"
                    >
                      {formatGraphNodeLabel(node, language)}
                    </span>
                  ))}
                </div>
              </article>
            ))}
          </div>

          {edgeRows.length ? (
            <div className="result-graph-links-section">
              <div className="result-graph-links-head">
                <div className="result-graph-links-copy">
                  <p className="result-graph-links-kicker">
                    {panelCopy.linksLabel}
                  </p>
                  <p className="result-graph-links-note">
                    {panelCopy.linksNote}
                  </p>
                </div>
                <span className="result-chip-soft text-[0.58rem] font-semibold">
                  x{edgeRows.length}
                </span>
              </div>
              <div className="result-graph-link-list">
                {edgeRows.map((edge, index) => (
                  <article
                    key={`${edge.source}-${edge.target}-${index}`}
                    className="result-graph-link"
                  >
                    <div className="result-graph-link-end">
                      <span className="result-graph-link-caption">
                        {panelCopy.from}
                      </span>
                      <span className="result-chip-line text-[0.66rem] text-foreground">
                        {edge.sourceLabel}
                      </span>
                    </div>
                    <span className="result-graph-link-label">
                      {edge.label || panelCopy.relationFallback}
                    </span>
                    <span className="result-graph-arrow">-&gt;</span>
                    <div
                      className="result-graph-link-end"
                      data-align="end"
                    >
                      <span className="result-graph-link-caption">
                        {panelCopy.to}
                      </span>
                      <span className="result-chip-soft text-[0.66rem] font-semibold">
                        {edge.targetLabel}
                      </span>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      ) : (
        <p className="mt-3 text-sm leading-7 text-muted">{copy.empty}</p>
      )}
    </section>
  );
}

function formatGraphNodeLabel(node: GraphNode, language: OutputLanguage) {
  if (node.type === "city") {
    return formatCityName(node.label, language);
  }

  if (node.type === "budget") {
    return formatBudgetCategory(node.label, language);
  }

  if (node.type === "day") {
    return formatGraphNodeRawLabel(node.label, language);
  }

  return node.label;
}

function formatGraphNodeRawLabel(label: string, language: OutputLanguage) {
  const dayMatch = label.match(/^Day\s+(\d+)$/i);
  if (dayMatch) {
    return language === "en" ? `Day ${dayMatch[1]}` : `第 ${dayMatch[1]} 天`;
  }

  return label;
}

function groupTimelineByDay(timeline: TimelineItem[]) {
  const dayMap = new Map<number, TimelineItem[]>();

  timeline.forEach((item) => {
    const current = dayMap.get(item.day_index) ?? [];
    current.push(item);
    dayMap.set(item.day_index, current);
  });

  return Array.from(dayMap.entries())
    .sort(([left], [right]) => left - right)
    .map(([dayIndex, items]) => {
      const sortedItems = [...items].sort((left, right) => {
        const startDiff = left.start_time.localeCompare(right.start_time);
        if (startDiff !== 0) {
          return startDiff;
        }

        return left.end_time.localeCompare(right.end_time);
      });

      return {
        dayIndex,
        items: sortedItems,
        startTime: sortedItems[0]?.start_time ?? "--:--",
        endTime: sortedItems.at(-1)?.end_time ?? "--:--",
      };
    });
}

function buildTimelineSummary(items: TimelineItem[]) {
  if (!items.length) {
    return {
      stopCount: 0,
      reservationCount: 0,
      transitMinutes: 0,
      startTime: "--:--",
      endTime: "--:--",
    };
  }

  const sortedItems = [...items].sort((left, right) => {
    if (left.day_index !== right.day_index) {
      return left.day_index - right.day_index;
    }

    const startDiff = left.start_time.localeCompare(right.start_time);
    if (startDiff !== 0) {
      return startDiff;
    }

    return left.end_time.localeCompare(right.end_time);
  });

  return {
    stopCount: sortedItems.length,
    reservationCount: sortedItems.filter((item) => item.reservation_hint).length,
    transitMinutes: sortedItems.reduce(
      (sum, item) => sum + item.transport_duration_minutes,
      0,
    ),
    startTime: sortedItems[0]?.start_time ?? "--:--",
    endTime: sortedItems.at(-1)?.end_time ?? "--:--",
  };
}

function groupChecklistByCategory(
  items: ChecklistItem[],
  language: OutputLanguage,
) {
  const categoryMap = new Map<string, ChecklistGroup>();

  items.forEach((item) => {
    const label = formatChecklistCategory(item.category, language);
    const current = categoryMap.get(item.category);
    if (current) {
      current.items.push(item);
      return;
    }

    categoryMap.set(item.category, {
      category: item.category,
      label,
      items: [item],
    });
  });

  return Array.from(categoryMap.values()).sort((left, right) => {
    const orderDiff =
      (checklistCategoryOrder[left.category] ?? Number.MAX_SAFE_INTEGER) -
      (checklistCategoryOrder[right.category] ?? Number.MAX_SAFE_INTEGER);
    if (orderDiff !== 0) {
      return orderDiff;
    }

    return left.label.localeCompare(right.label);
  });
}

function groupGraphNodes(nodes: GraphNode[], language: OutputLanguage) {
  const typeMap = new Map<string, GraphNodeGroup>();

  nodes.forEach((node) => {
    const current = typeMap.get(node.type);
    if (current) {
      current.nodes.push(node);
      return;
    }

    typeMap.set(node.type, {
      type: node.type,
      label: formatGraphNodeType(node.type, language),
      nodes: [node],
    });
  });

  return Array.from(typeMap.values()).sort((left, right) => {
    const orderDiff =
      (graphNodeTypeOrder[left.type] ?? Number.MAX_SAFE_INTEGER) -
      (graphNodeTypeOrder[right.type] ?? Number.MAX_SAFE_INTEGER);
    if (orderDiff !== 0) {
      return orderDiff;
    }

    return left.label.localeCompare(right.label);
  });
}

function buildGraphEdgeRows(
  edges: GraphEdge[],
  language: OutputLanguage,
  nodes: GraphNode[],
): GraphEdgeRow[] {
  return edges.map((edge) => {
    const sourceNode = nodes.find((node) => node.id === edge.source);
    const targetNode = nodes.find((node) => node.id === edge.target);

    return {
      source: edge.source,
      target: edge.target,
      label: formatGraphEdgeLabel(edge.label, language),
      sourceLabel: sourceNode
        ? formatGraphNodeLabel(sourceNode, language)
        : formatGraphNodeRawLabel(edge.source, language),
      targetLabel: targetNode
        ? formatGraphNodeLabel(targetNode, language)
        : formatGraphNodeRawLabel(edge.target, language),
      };
  });
}

function getChecklistBoardNote(
  groups: ChecklistGroup[],
  language: OutputLanguage,
) {
  const hasDocuments = groups.some((group) => group.category === "documents");
  const hasWeather = groups.some((group) => group.category === "weather");

  if (language === "en") {
    if (hasDocuments && hasWeather) {
      return "Lock identity and check-in items first, then adjust outfit and carry gear to the latest temperature, rain, and sun signals.";
    }

    if (hasDocuments) {
      return "Lock identity, ticket, and stay verification first so the route can run without check-in friction.";
    }

    if (hasWeather) {
      return "Use this board to trim clothing, sun gear, and rain cover right before you leave.";
    }

    return "Use this board as the final departure pass before you head into the city.";
  }

  if (hasDocuments && hasWeather) {
    return "先锁定证件和入住核验，再按最新温度、降雨和日晒信号补齐穿搭与随身物。";
  }

  if (hasDocuments) {
    return "先把证件、票务和入住核验放稳，这样出发时不会卡在进站和入住环节。";
  }

  if (hasWeather) {
    return "把这块当成出门前最后一次天气复核，按降雨和温度微调衣物与随身装备。";
  }

  return "把这块当成最后一道出发行前板，出门前逐项过一遍即可。";
}

function getChecklistGroupTone(category: string, index: number) {
  if (category === "weather") {
    return "warm";
  }

  if (category === "documents") {
    return "soft";
  }

  return index % 2 === 0 ? "soft" : "warm";
}

function getChecklistGroupNote(
  category: string,
  language: OutputLanguage,
) {
  if (language === "en") {
    if (category === "documents") {
      return "Keep these in the day bag so transport, hotel, and ticket checks do not stall the route.";
    }

    if (category === "weather") {
      return "Adjust these on the departure day according to rain, sun exposure, and real street temperature.";
    }

    return "Use this lane for extra items that should be verified before you head out.";
  }

  if (category === "documents") {
    return "优先放进随身包，避免进站、入住或景点核验时临时翻找。";
  }

  if (category === "weather") {
    return "按出发当天的降雨、日晒和真实体感温度做最后加减。";
  }

  return "把这一类当成出门前的补充核验，避免遗漏临场需要的东西。";
}

function getGraphGroupTone(type: string, index: number) {
  if (type === "reservation" || type === "budget") {
    return "warm";
  }

  if (type === "city" || type === "day") {
    return "soft";
  }

  return index % 2 === 0 ? "soft" : "warm";
}

function getGraphGroupNote(type: string, language: OutputLanguage) {
  if (language === "en") {
    if (type === "city") {
      return "This is the city anchor that everything else hangs from.";
    }

    if (type === "day") {
      return "Day blocks divide the route into execution windows you can follow on the ground.";
    }

    if (type === "attraction") {
      return "These are the actual stops that shape the route rhythm and photo or citywalk output.";
    }

    if (type === "reservation") {
      return "Reservation nodes expose free but scarce entries, booking channels, and timing pressure.";
    }

    if (type === "budget") {
      return "Budget buckets show where money is attached so the plan does not overspend silently.";
    }

    return "This lane captures one structural layer of the generated travel plan.";
  }

  if (type === "city") {
    return "这是整座城市的锚点，后面的天数、景点、预约和预算都会挂在这里。";
  }

  if (type === "day") {
    return "日期块把路线拆成可执行的时间窗，方便你按天落地推进。";
  }

  if (type === "attraction") {
    return "这里是实际要去的节点，会直接决定节奏、出片和城市漫游体验。";
  }

  if (type === "reservation") {
    return "预约节点会暴露免费但紧张的景点、预约渠道和时间压力。";
  }

  if (type === "budget") {
    return "预算节点会告诉你钱挂在哪一段，避免花销在执行时失控。";
  }

  return "这一层用于表达生成行程中的一个结构维度。";
}

function countEdgesForNodeGroup(group: GraphNodeGroup, edges: GraphEdge[]) {
  const nodeIds = new Set(group.nodes.map((node) => node.id));

  return edges.filter(
    (edge) => nodeIds.has(edge.source) || nodeIds.has(edge.target),
  ).length;
}
