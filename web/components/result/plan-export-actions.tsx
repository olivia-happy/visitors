"use client";

import Link from "next/link";
import {
  type FocusEvent as ReactFocusEvent,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  useState,
} from "react";

import type { OutputLanguage } from "@/lib/schemas";
import { buildViewHref } from "@/lib/view-state";

type PlanExportActionsProps = {
  backHref: string;
  cityName: string;
  dayCount: number;
  language: OutputLanguage;
  reservationCount: number;
  shareHref: string;
  themeMode: "light" | "dark";
};

const copyByLanguage = {
  "zh-CN": {
    header: {
      kicker: "分享动作 // 转发与打印",
      title: "这一页直接给同行人用，不需要你再口头解释。",
      note: "把当前语言、主题、路线语气和预约重点压成一张更适合截图、转发、打印的执行页。",
    },
    badges: ["截图友好", "同行人版", "PDF 就绪"],
    metrics: {
      trip: "行程",
      reservation: "预约",
      view: "视图",
      tripNote: "给同行人先建立路线共识",
      reservationNote: "先把需要锁定的景点解决掉",
      viewNote: "链接会保持当前语言与明暗",
      tripValue: (cityName: string, dayCount: number) =>
        `${cityName} · ${dayCount} 天`,
      reservationValue: (reservationCount: number) =>
        reservationCount > 0 ? `${reservationCount} 条重点提醒` : "暂无硬性预约",
      viewValue: (themeMode: "light" | "dark") =>
        themeMode === "dark" ? "中文 · 暗色" : "中文 · 亮色",
    },
    buttons: {
      print: "打印 / 导出 PDF",
      printNote: "适合纸质路线卡、截图存档和演示录屏",
      copy: "复制分享链接",
      copyNote: "把当前页面的语言与主题一起带走",
      back: "回到完整行程",
      backNote: "继续调整预算、路线和行前清单",
    },
    status: {
      label: "当前说明",
      copied: "已复制分享页链接。",
      copyFailed: "复制分享页链接失败。",
      idle: "这是给同行人和家人看的轻量执行版，不是给自己二次编辑的工作台。",
    },
  },
  en: {
    header: {
      kicker: "Share controls // send and print",
      title: "This page should be ready to hand off without extra explanation.",
      note: "Compress the current language, theme, route tone, and reservation alerts into a cleaner sheet for screenshots, sharing, and printing.",
    },
    badges: ["screenshot-ready", "partner handoff", "PDF-ready"],
    metrics: {
      trip: "Trip",
      reservation: "Reservations",
      view: "View",
      tripNote: "Set the route context at a glance",
      reservationNote: "Resolve booking-sensitive spots first",
      viewNote: "The link keeps the current language and theme",
      tripValue: (cityName: string, dayCount: number) =>
        `${cityName} · ${dayCount} days`,
      reservationValue: (reservationCount: number) =>
        reservationCount > 0
          ? `${reservationCount} booking alert${reservationCount > 1 ? "s" : ""}`
          : "No mandatory booking",
      viewValue: (themeMode: "light" | "dark") =>
        themeMode === "dark" ? "English · Dark" : "English · Light",
    },
    buttons: {
      print: "Print / Export PDF",
      printNote: "Best for paper, archived captures, and demo recording",
      copy: "Copy share link",
      copyNote: "Carry over the current language and theme state",
      back: "Back to full plan",
      backNote: "Keep editing budget, route, and prep details",
    },
    status: {
      label: "Current note",
      copied: "Share page link copied.",
      copyFailed: "Failed to copy the share page link.",
      idle: "This is the lighter execution sheet for travel partners and family, not the workspace for deeper editing.",
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

export function PlanExportActions({
  backHref,
  cityName,
  dayCount,
  language,
  reservationCount,
  shareHref,
  themeMode,
}: PlanExportActionsProps) {
  const [status, setStatus] = useState("");
  const copy = copyByLanguage[language];
  const resolvedShareHref = buildViewHref(shareHref, {
    language,
    theme: themeMode,
  });
  const resolvedBackHref = buildViewHref(backHref, {
    language,
    theme: themeMode,
  });
  const metrics = [
    {
      label: copy.metrics.trip,
      note: copy.metrics.tripNote,
      tone: "warm" as const,
      value: copy.metrics.tripValue(cityName, dayCount),
    },
    {
      label: copy.metrics.reservation,
      note: copy.metrics.reservationNote,
      tone: "soft" as const,
      value: copy.metrics.reservationValue(reservationCount),
    },
    {
      label: copy.metrics.view,
      note: copy.metrics.viewNote,
      tone: "line" as const,
      value: copy.metrics.viewValue(themeMode),
    },
  ];

  async function handleCopyShareLink() {
    try {
      const absoluteHref =
        typeof window === "undefined"
          ? resolvedShareHref
          : `${window.location.origin}${resolvedShareHref}`;
      await navigator.clipboard.writeText(absoluteHref);
      setStatus(copy.status.copied);
    } catch {
      setStatus(copy.status.copyFailed);
    }
  }

  function handlePrint() {
    window.print();
  }

  return (
    <div
      className="result-action-ribbon liquid-float-surface liquid-float-shell print:hidden sticky top-4 z-30 mb-4"
      data-liquid-kind="ribbon"
      data-liquid-tone="line"
      data-liquid-active="false"
      {...liquidSurfaceHandlers}
    >
      <div className="share-control-grid">
        <div className="share-control-story">
          <div className="result-panel-head">
            <p className="result-panel-kicker">{copy.header.kicker}</p>
            <h2 className="share-control-title">{copy.header.title}</h2>
            <p className="result-panel-copy">{copy.header.note}</p>
          </div>

          <div className="share-control-badge-row">
            {copy.badges.map((badge) => (
              <span key={badge} className="share-control-badge">
                {badge}
              </span>
            ))}
          </div>

          <p className="share-control-status" aria-live="polite">
            <span className="share-control-status-label">{copy.status.label}</span>
            <span>{status || copy.status.idle}</span>
          </p>
        </div>

        <div
          className="share-control-console liquid-float-surface liquid-float-shell"
          data-liquid-kind="console"
          data-liquid-tone="soft"
          data-liquid-active="false"
          {...liquidSurfaceHandlers}
        >
          <div className="share-control-metrics">
            {metrics.map((metric) => (
              <article
                key={metric.label}
                className="share-control-metric liquid-float-surface liquid-float-shell"
                data-liquid-kind="metric"
                data-liquid-active="false"
                data-tone={metric.tone}
                data-liquid-tone={metric.tone}
                {...liquidSurfaceHandlers}
              >
                <span className="share-control-metric-label">{metric.label}</span>
                <span className="share-control-metric-value">{metric.value}</span>
                <span className="share-control-metric-note">{metric.note}</span>
              </article>
            ))}
          </div>

          <div className="result-action-grid share-control-actions">
            <button
              className="result-action-button share-control-button liquid-float-surface liquid-float-shell result-action-wide"
              onClick={handlePrint}
              type="button"
              data-tone="primary"
              data-liquid-kind="button"
              data-liquid-tone="primary"
              data-liquid-active="false"
              data-liquid-pressed="false"
              {...liquidPressHandlers}
            >
              <span className="share-control-button-code">01</span>
              <span className="share-control-button-label">
                {copy.buttons.print}
              </span>
              <span className="share-control-button-note">
                {copy.buttons.printNote}
              </span>
            </button>
            <button
              className="result-action-button share-control-button liquid-float-surface liquid-float-shell"
              onClick={handleCopyShareLink}
              type="button"
              data-liquid-kind="button"
              data-liquid-tone="line"
              data-liquid-active="false"
              data-liquid-pressed="false"
              {...liquidPressHandlers}
            >
              <span className="share-control-button-code">02</span>
              <span className="share-control-button-label">
                {copy.buttons.copy}
              </span>
              <span className="share-control-button-note">
                {copy.buttons.copyNote}
              </span>
            </button>
            <Link
              className="result-action-button share-control-button liquid-float-surface liquid-float-shell"
              href={resolvedBackHref}
              data-liquid-kind="button"
              data-liquid-tone="soft"
              data-liquid-active="false"
              data-liquid-pressed="false"
              {...liquidPressHandlers}
            >
              <span className="share-control-button-code">03</span>
              <span className="share-control-button-label">
                {copy.buttons.back}
              </span>
              <span className="share-control-button-note">
                {copy.buttons.backNote}
              </span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
