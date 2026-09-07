"use client";

import {
  type FocusEvent as ReactFocusEvent,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  useState,
} from "react";

import { formatBudgetRange } from "@/lib/currency";
import { buildExportBudgetSummary } from "@/lib/export-helpers";
import {
  formatCityName,
  formatEntryMode,
  formatExecutionPace,
  formatSeverity,
  formatTravelMode,
} from "@/lib/result-formatters";
import {
  buildPlanSharePayload,
  buildReservationChecklistText,
  buildShareViewHref,
  buildTodayRouteText,
} from "@/lib/share-helpers";
import type {
  ExchangeRateSnapshot,
  OutputLanguage,
  PlanDraft,
} from "@/lib/schemas";

type PlanShareBarProps = {
  exchangeRateSnapshot: ExchangeRateSnapshot;
  language: OutputLanguage;
  mode: "live" | "showcase";
  onEnterStageMode?: () => void;
  plan: PlanDraft | null;
  planId: string;
  themeMode: "light" | "dark";
};

type DockTone = "line" | "soft" | "warm" | "primary";
type ReceiptState =
  | "idle"
  | "shared"
  | "copiedShare"
  | "copiedReservation"
  | "copiedToday"
  | "openedPrint"
  | "openedStage"
  | "shareFailed"
  | "reservationFailed"
  | "todayFailed";

type SignalCard = {
  label: string;
  note: string;
  tone: DockTone;
  value: string;
};

type ActionCard = {
  code: string;
  featured?: boolean;
  label: string;
  meta: string;
  note: string;
  onClick: () => void | Promise<void>;
  tone: DockTone;
};

const copyByLanguage = {
  "zh-CN": {
    header: {
      kicker: "分享控制台",
      title: "把这条路线发出去，同时保留它现在的执行语气。",
      note:
        "分享时会一起带走当前语言、明暗、预算窗口和预约重点，适合直接发给同行人、家人或面试官。",
      badges: ["截图友好", "保留当前语言", "可直接转发"],
    },
    signals: {
      city: "城市",
      budget: "预算窗口",
      focus: "当前重点",
      view: "当前视图",
      budgetNote: "发出去时会保留这个预算口径",
      focusNone: "当前没有明显高压预约点",
      viewShowcase: "样例模式",
      viewLive: "实时模式",
      viewKeep: "链接会保持现在的语言和明暗",
      language: "中文",
      light: "亮色",
      dark: "暗色",
      todayPending: "今天路线待补",
      stageMeta: "P · 1-5 · Esc",
      routeFallback: "执行节奏待补",
      shareMeta: "摘要 + 链接 + 当前语气",
      printMeta: "独立分享页 · 截图 / 录屏 / 打印",
    },
    receipt: {
      label: "当前回执",
      states: {
        idle: {
          badge: "就绪",
          message: "分享、复制和打印都会保留当前语言与明暗。",
          tone: "line" as DockTone,
        },
        shared: {
          badge: "已分享",
          message: "已调起系统分享。",
          tone: "primary" as DockTone,
        },
        copiedShare: {
          badge: "已复制",
          message: "已复制行程摘要和分享链接。",
          tone: "soft" as DockTone,
        },
        copiedReservation: {
          badge: "已复制",
          message: "已复制预约重点清单。",
          tone: "soft" as DockTone,
        },
        copiedToday: {
          badge: "已复制",
          message: "已复制今天的路线。",
          tone: "soft" as DockTone,
        },
        openedPrint: {
          badge: "已打开",
          message: "已打开独立分享页。",
          tone: "primary" as DockTone,
        },
        openedStage: {
          badge: "已切换",
          message: "已切到展示模式。",
          tone: "primary" as DockTone,
        },
        shareFailed: {
          badge: "重试",
          message: "分享失败，请稍后再试。",
          tone: "warm" as DockTone,
        },
        reservationFailed: {
          badge: "重试",
          message: "复制预约重点失败。",
          tone: "warm" as DockTone,
        },
        todayFailed: {
          badge: "重试",
          message: "复制今天路线失败。",
          tone: "warm" as DockTone,
        },
      },
    },
    buttons: {
      share: {
        label: "分享这条路线",
        note: "把摘要、链接和当前语言一起发出去",
      },
      reservation: {
        label: "复制预约重点",
        note: "单独发给同行人，先锁需要抢的点",
        emptyMeta: "当前没有高压预约点",
      },
      today: {
        label: "复制今天路线",
        note: "出发前把今天这条线直接发到聊天",
        emptyMeta: "今天路线待补",
      },
      print: {
        label: "打开分享页",
        note: "进入适合截图、录屏和打印的独立页面",
      },
      stage: {
        label: "进入展示模式",
        note: "切到更适合演示的舞台视图",
      },
    },
  },
  en: {
    header: {
      kicker: "Share console",
      title: "Send the route out without losing its current execution tone.",
      note:
        "Sharing carries the current language, theme, budget window, and booking focus so the handoff stays clean for partners, family, or interview demos.",
      badges: ["Screenshot-ready", "Keep current language", "Forward-ready"],
    },
    signals: {
      city: "City",
      budget: "Budget window",
      focus: "Current focus",
      view: "Current view",
      budgetNote: "The shared view keeps this budget frame",
      focusNone: "No obvious booking bottleneck right now",
      viewShowcase: "Showcase mode",
      viewLive: "Live mode",
      viewKeep: "The link keeps the current language and theme",
      language: "English",
      light: "Light",
      dark: "Dark",
      todayPending: "Today route pending",
      stageMeta: "P · 1-5 · Esc",
      routeFallback: "Execution pace pending",
      shareMeta: "Summary + link + current tone",
      printMeta: "Standalone share page · capture / demo / print",
    },
    receipt: {
      label: "Receipt",
      states: {
        idle: {
          badge: "Ready",
          message: "Sharing, copying, and printing keep the current language and theme.",
          tone: "line" as DockTone,
        },
        shared: {
          badge: "Shared",
          message: "System share opened.",
          tone: "primary" as DockTone,
        },
        copiedShare: {
          badge: "Copied",
          message: "Plan summary and share link copied.",
          tone: "soft" as DockTone,
        },
        copiedReservation: {
          badge: "Copied",
          message: "Reservation checklist copied.",
          tone: "soft" as DockTone,
        },
        copiedToday: {
          badge: "Copied",
          message: "Today route copied.",
          tone: "soft" as DockTone,
        },
        openedPrint: {
          badge: "Opened",
          message: "Standalone share page opened.",
          tone: "primary" as DockTone,
        },
        openedStage: {
          badge: "Switched",
          message: "Presentation mode entered.",
          tone: "primary" as DockTone,
        },
        shareFailed: {
          badge: "Retry",
          message: "Sharing failed. Please try again.",
          tone: "warm" as DockTone,
        },
        reservationFailed: {
          badge: "Retry",
          message: "Failed to copy the reservation checklist.",
          tone: "warm" as DockTone,
        },
        todayFailed: {
          badge: "Retry",
          message: "Failed to copy today route.",
          tone: "warm" as DockTone,
        },
      },
    },
    buttons: {
      share: {
        label: "Share this route",
        note: "Send the summary, link, and current language together",
      },
      reservation: {
        label: "Copy booking focus",
        note: "Send the must-book stops to a travel partner first",
        emptyMeta: "No urgent booking stop",
      },
      today: {
        label: "Copy today route",
        note: "Push the day route right before departure",
        emptyMeta: "Today route pending",
      },
      print: {
        label: "Open share page",
        note: "Use the standalone page for screenshots, demos, and print",
      },
      stage: {
        label: "Enter presentation",
        note: "Switch into the stage view for demos",
      },
    },
  },
} as const;

function resetLiquidSurface(element: HTMLElement) {
  element.dataset.liquidActive = "false";
  element.dataset.liquidPressed = "false";
  element.style.setProperty("--liquid-x", "50%");
  element.style.setProperty("--liquid-y", "50%");
  element.style.setProperty("--liquid-rx", "0.5");
  element.style.setProperty("--liquid-ry", "0.5");
}

function updateLiquidSurfacePosition(
  element: HTMLElement,
  clientX: number,
  clientY: number,
) {
  const rect = element.getBoundingClientRect();
  const relativeX = Math.min(Math.max((clientX - rect.left) / rect.width, 0), 1);
  const relativeY = Math.min(Math.max((clientY - rect.top) / rect.height, 0), 1);

  element.dataset.liquidActive = "true";
  element.style.setProperty("--liquid-x", `${(relativeX * 100).toFixed(2)}%`);
  element.style.setProperty("--liquid-y", `${(relativeY * 100).toFixed(2)}%`);
  element.style.setProperty("--liquid-rx", relativeX.toFixed(4));
  element.style.setProperty("--liquid-ry", relativeY.toFixed(4));
}

function setLiquidPressed(element: HTMLElement, pressed: boolean) {
  element.dataset.liquidPressed = pressed ? "true" : "false";
}

function handleLiquidPointerMove(event: ReactPointerEvent<HTMLElement>) {
  if (event.pointerType === "touch") {
    return;
  }

  updateLiquidSurfacePosition(event.currentTarget, event.clientX, event.clientY);
}

function handleLiquidPointerDown(event: ReactPointerEvent<HTMLElement>) {
  updateLiquidSurfacePosition(event.currentTarget, event.clientX, event.clientY);
  setLiquidPressed(event.currentTarget, true);
}

function handleLiquidPointerUp(event: ReactPointerEvent<HTMLElement>) {
  const element = event.currentTarget;
  setLiquidPressed(element, false);

  if (event.pointerType === "touch") {
    resetLiquidSurface(element);
  }
}

function handleLiquidPointerCancel(event: ReactPointerEvent<HTMLElement>) {
  resetLiquidSurface(event.currentTarget);
}

function handleLiquidPointerLeave(event: ReactPointerEvent<HTMLElement>) {
  resetLiquidSurface(event.currentTarget);
}

function handleLiquidBlur(event: ReactFocusEvent<HTMLElement>) {
  resetLiquidSurface(event.currentTarget);
}

function handleLiquidKeyDown(event: ReactKeyboardEvent<HTMLElement>) {
  if (event.key !== "Enter" && event.key !== " ") {
    return;
  }

  const element = event.currentTarget;
  element.dataset.liquidActive = "true";
  setLiquidPressed(element, true);
}

function handleLiquidKeyUp(event: ReactKeyboardEvent<HTMLElement>) {
  if (event.key !== "Enter" && event.key !== " ") {
    return;
  }

  resetLiquidSurface(event.currentTarget);
}

const liquidSurfaceHandlers = {
  onPointerLeave: handleLiquidPointerLeave,
  onPointerMove: handleLiquidPointerMove,
};

const liquidPressHandlers = {
  ...liquidSurfaceHandlers,
  onBlur: handleLiquidBlur,
  onKeyDown: handleLiquidKeyDown,
  onKeyUp: handleLiquidKeyUp,
  onPointerCancel: handleLiquidPointerCancel,
  onPointerDown: handleLiquidPointerDown,
  onPointerUp: handleLiquidPointerUp,
};

export function PlanShareBar({
  exchangeRateSnapshot,
  language,
  mode,
  onEnterStageMode,
  plan,
  planId,
  themeMode,
}: PlanShareBarProps) {
  const [receiptState, setReceiptState] = useState<ReceiptState>("idle");
  const copy = copyByLanguage[language];

  if (!plan) {
    return null;
  }

  const cityName = formatCityName(plan.city, language);
  const budgetSummary = buildExportBudgetSummary(plan.budget_items);
  const budgetLow = plan.budget_min ?? budgetSummary.low;
  const budgetHigh = plan.budget_max ?? budgetSummary.high;
  const budgetWindow = formatBudgetRange(
    budgetLow || 0,
    budgetHigh || 0,
    language,
    exchangeRateSnapshot,
  );
  const viewValue =
    language === "en"
      ? `${copy.signals.language} · ${
          themeMode === "dark" ? copy.signals.dark : copy.signals.light
        }`
      : `${copy.signals.language} · ${
          themeMode === "dark" ? copy.signals.dark : copy.signals.light
        }`;
  const topRisk = plan.reservation_risks[0] ?? null;
  const firstStop = plan.timeline[0] ?? null;
  const routeMode =
    plan.travel_mode
      ? formatTravelMode(plan.travel_mode, language)
      : formatEntryMode(plan.entry_mode, language);
  const pace =
    plan.execution_summary?.pace
      ? formatExecutionPace(plan.execution_summary.pace, language)
      : copy.signals.routeFallback;
  const modeLabel =
    mode === "showcase" ? copy.signals.viewShowcase : copy.signals.viewLive;

  const signalCards: SignalCard[] = [
    {
      label: copy.signals.city,
      value:
        language === "en"
          ? `${cityName} · ${plan.days} days`
          : `${cityName} · ${plan.days}天`,
      note: `${routeMode} · ${pace}`,
      tone: "soft",
    },
    {
      label: copy.signals.budget,
      value: budgetWindow,
      note: copy.signals.budgetNote,
      tone: "warm",
    },
    {
      label: copy.signals.focus,
      value: topRisk?.poi_name ?? copy.signals.focusNone,
      note: topRisk
        ? [
            formatSeverity(topRisk.severity, language),
            topRisk.reservation_channel,
          ]
            .filter(Boolean)
            .join(" · ")
        : copy.signals.focusNone,
      tone: "line",
    },
    {
      label: copy.signals.view,
      value: viewValue,
      note: `${modeLabel} · ${copy.signals.viewKeep}`,
      tone: "line",
    },
  ];

  const actionCards: ActionCard[] = [
    {
      code: "01",
      featured: true,
      label: copy.buttons.share.label,
      note: copy.buttons.share.note,
      meta: `${copy.signals.shareMeta} · ${viewValue}`,
      onClick: handleSharePlan,
      tone: "primary",
    },
    {
      code: "02",
      label: copy.buttons.reservation.label,
      note: copy.buttons.reservation.note,
      meta: topRisk
        ? [topRisk.poi_name, topRisk.reservation_channel]
            .filter(Boolean)
            .join(" · ")
        : copy.buttons.reservation.emptyMeta,
      onClick: handleCopyReservations,
      tone: "warm",
    },
    {
      code: "03",
      label: copy.buttons.today.label,
      note: copy.buttons.today.note,
      meta: firstStop
        ? `${firstStop.start_time} · ${firstStop.title}`
        : copy.buttons.today.emptyMeta,
      onClick: handleCopyTodayRoute,
      tone: "soft",
    },
    {
      code: "04",
      label: copy.buttons.print.label,
      note: copy.buttons.print.note,
      meta: `${copy.signals.printMeta} · ${cityName}`,
      onClick: handlePrint,
      tone: "line",
    },
  ];

  if (onEnterStageMode) {
    actionCards.push({
      code: "05",
      label: copy.buttons.stage.label,
      note: copy.buttons.stage.note,
      meta: copy.signals.stageMeta,
      onClick: handleEnterStageMode,
      tone: "soft",
    });
  }

  const receipt = copy.receipt.states[receiptState];

  async function handleSharePlan() {
    const shareHref = buildShareViewHref(planId, mode, {
      language,
      theme: themeMode,
    });
    const shareUrl = getAbsoluteShareUrl(shareHref);
    const payload = buildPlanSharePayload(
      plan,
      shareUrl,
      language,
      exchangeRateSnapshot,
    );

    try {
      if (navigator.share) {
        await navigator.share(payload);
        setReceiptState("shared");
        return;
      }

      await navigator.clipboard.writeText(`${payload.text}\n${shareUrl}`);
      setReceiptState("copiedShare");
    } catch {
      setReceiptState("shareFailed");
    }
  }

  async function handleCopyReservations() {
    try {
      await navigator.clipboard.writeText(
        buildReservationChecklistText(plan, language, exchangeRateSnapshot),
      );
      setReceiptState("copiedReservation");
    } catch {
      setReceiptState("reservationFailed");
    }
  }

  async function handleCopyTodayRoute() {
    try {
      await navigator.clipboard.writeText(
        buildTodayRouteText(plan, 1, language, exchangeRateSnapshot),
      );
      setReceiptState("copiedToday");
    } catch {
      setReceiptState("todayFailed");
    }
  }

  function handlePrint() {
    const shareHref = buildShareViewHref(planId, mode, {
      language,
      theme: themeMode,
    });
    window.open(shareHref, "_blank", "noopener,noreferrer");
    setReceiptState("openedPrint");
  }

  function handleEnterStageMode() {
    onEnterStageMode?.();
    setReceiptState("openedStage");
  }

  return (
    <div className="result-dock print:hidden">
      <div className="mx-auto w-full max-w-[90rem]">
        <div
          className="result-dock-shell liquid-float-surface liquid-float-shell"
          data-liquid-kind="dock"
          data-liquid-tone="line"
          data-liquid-active="false"
          {...liquidSurfaceHandlers}
        >
          <div className="result-dock-head">
            <div className="result-dock-story">
              <p className="result-dock-kicker">{copy.header.kicker}</p>
              <h2 className="result-dock-title">{copy.header.title}</h2>
              <p className="result-dock-story-note">{copy.header.note}</p>
              <div className="result-dock-badge-row">
                {copy.header.badges.map((badge) => (
                  <span key={badge} className="result-dock-badge">
                    {badge}
                  </span>
                ))}
              </div>
            </div>

            <div className="result-dock-status-card" data-tone={receipt.tone}>
              <div className="result-dock-status-head">
                <p className="result-dock-status-label">{copy.receipt.label}</p>
                <span className="result-dock-status-chip" data-tone={receipt.tone}>
                  {receipt.badge}
                </span>
              </div>
              <p className="result-dock-note" aria-live="polite">
                {receipt.message}
              </p>
              <div className="result-dock-metrics">
                {signalCards.map((card) => (
                  <article
                    key={card.label}
                    className="result-dock-metric"
                    data-tone={card.tone}
                  >
                    <span className="result-dock-metric-label">{card.label}</span>
                    <span className="result-dock-metric-value">{card.value}</span>
                    <span className="result-dock-metric-note">{card.note}</span>
                  </article>
                ))}
              </div>
            </div>
          </div>

          <div className="result-dock-actions">
            {actionCards.map((action) => (
              <ActionButton
                code={action.code}
                featured={action.featured}
                key={action.code}
                label={action.label}
                meta={action.meta}
                note={action.note}
                onClick={action.onClick}
                tone={action.tone}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function ActionButton({
  code,
  featured = false,
  label,
  meta,
  note,
  onClick,
  tone,
}: {
  code: string;
  featured?: boolean;
  label: string;
  meta: string;
  note: string;
  onClick: () => void | Promise<void>;
  tone: DockTone;
}) {
  return (
    <button
      className="result-action-button result-dock-button liquid-float-surface liquid-float-shell"
      data-featured={featured ? "true" : "false"}
      data-liquid-kind="button"
      data-liquid-tone={tone}
      data-liquid-active="false"
      data-liquid-pressed="false"
      data-tone={tone}
      onClick={onClick}
      type="button"
      {...liquidPressHandlers}
    >
      <span className="result-dock-button-head">
        <span className="result-dock-button-code">{code}</span>
        <span className="result-dock-button-meta">{meta}</span>
      </span>
      <span className="result-dock-button-label">{label}</span>
      <span className="result-dock-button-note">{note}</span>
    </button>
  );
}

function getAbsoluteShareUrl(shareHref: string) {
  if (typeof window === "undefined") {
    return shareHref;
  }

  return `${window.location.origin}${shareHref}`;
}
