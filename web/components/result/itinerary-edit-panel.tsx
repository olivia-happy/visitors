"use client";

import { getTimelineItemKey } from "@/lib/itinerary-editor";
import { formatTransportMode } from "@/lib/result-formatters";
import type { OutputLanguage, TimelineItem } from "@/lib/schemas";

type EditableTimelineStats = {
  flexibleCount: number;
  lockedCount: number;
  removedCount: number;
};

type ItineraryEditPanelProps = {
  language: OutputLanguage;
  lockedKeys: string[];
  optimizationVersion: number;
  removedStops: TimelineItem[];
  stats: EditableTimelineStats;
  timeline: TimelineItem[];
  onOptimize: () => void;
  onRemoveStop: (stopKey: string) => void;
  onReset: () => void;
  onRestoreStop: (stopKey: string) => void;
  onToggleLock: (stopKey: string) => void;
};

const copyByLanguage = {
  "zh-CN": {
    kicker: "智能协同调度",
    title: "锁住必去点，只重排剩余行程。",
    intro:
      "适合临时改计划：保留博物馆、酒店、预约场次这类硬约束，把可替换景点交给系统重新排序。",
    effect: "锁定点不会移动；重新优化会优先处理预约风险，再压缩交通耗时。",
    optimize: "重新优化剩余路线",
    reset: "恢复默认",
    locked: "已锁定",
    lock: "锁定",
    unlock: "解锁",
    remove: "移除",
    restore: "恢复",
    reservation: "需预约",
    flexible: "可重排",
    empty: "暂无可调整行程。",
    removedTitle: "暂存移除",
    removedEmpty: "被移除的点会在这里，随时可以恢复。",
    dayTime: "第{day}天 · {start}-{end}",
    metrics: {
      locked: "锁定",
      removed: "移除",
      flexible: "可优化",
      version: "优化版",
    },
  },
  en: {
    kicker: "AI co-planning",
    title: "Lock must-go stops and re-order only the flexible route.",
    intro:
      "Use this when the plan changes: keep museums, hotels, and booked slots fixed while AI re-sorts replaceable stops.",
    effect:
      "Locked stops stay in place; optimization prioritizes booking risk first, then shorter transfer time.",
    optimize: "Re-optimize flexible route",
    reset: "Reset",
    locked: "Locked",
    lock: "Lock",
    unlock: "Unlock",
    remove: "Remove",
    restore: "Restore",
    reservation: "Booking",
    flexible: "Flexible",
    empty: "No itinerary stops to edit yet.",
    removedTitle: "Removed tray",
    removedEmpty: "Removed stops will appear here and can be restored anytime.",
    dayTime: "D{day} · {start}-{end}",
    metrics: {
      locked: "Locked",
      removed: "Removed",
      flexible: "Flexible",
      version: "Version",
    },
  },
} as const;

export function ItineraryEditPanel({
  language,
  lockedKeys,
  optimizationVersion,
  removedStops,
  stats,
  timeline,
  onOptimize,
  onRemoveStop,
  onReset,
  onRestoreStop,
  onToggleLock,
}: ItineraryEditPanelProps) {
  const copy = copyByLanguage[language];
  const lockedSet = new Set(lockedKeys);
  const visibleStops = timeline.slice(0, 6);
  const minuteUnit = language === "en" ? "min" : "分钟";
  const hasEdits =
    stats.lockedCount > 0 || stats.removedCount > 0 || optimizationVersion > 0;

  return (
    <section className="result-card result-editorial-frame result-itinerary-editor liquid-float-surface p-5">
      <div className="result-itinerary-editor-head">
        <div className="result-panel-head">
          <p className="result-panel-kicker">{copy.kicker}</p>
          <h2 className="result-panel-title">{copy.title}</h2>
        </div>
        <span className="result-itinerary-editor-mark" aria-hidden="true">
          ⇄
        </span>
      </div>

      <p className="result-itinerary-editor-intro">{copy.intro}</p>

      <div className="result-itinerary-editor-metrics">
        <Metric label={copy.metrics.locked} value={stats.lockedCount} />
        <Metric label={copy.metrics.removed} value={stats.removedCount} />
        <Metric label={copy.metrics.flexible} value={stats.flexibleCount} />
        <Metric label={copy.metrics.version} value={optimizationVersion} />
      </div>

      <div className="result-itinerary-editor-actions">
        <button
          type="button"
          className="result-itinerary-editor-primary"
          disabled={!timeline.length}
          onClick={onOptimize}
        >
          {copy.optimize}
        </button>
        <button
          type="button"
          className="result-itinerary-editor-secondary"
          disabled={!hasEdits}
          onClick={onReset}
        >
          {copy.reset}
        </button>
      </div>

      <p className="result-itinerary-editor-effect">{copy.effect}</p>

      <div className="result-itinerary-editor-list">
        {visibleStops.length ? (
          visibleStops.map((item) => {
            const stopKey = getTimelineItemKey(item);
            const isLocked = lockedSet.has(stopKey);
            const routeMeta = copy.dayTime
              .replace("{day}", String(item.day_index))
              .replace("{start}", item.start_time)
              .replace("{end}", item.end_time);

            return (
              <article
                key={stopKey}
                className="result-itinerary-editor-stop"
                data-state={isLocked ? "locked" : "flexible"}
              >
                <div className="result-itinerary-editor-stop-main">
                  <span className="result-itinerary-editor-stop-time">
                    {routeMeta}
                  </span>
                  <h3 className="result-itinerary-editor-stop-title">
                    {item.title}
                  </h3>
                  <div className="result-itinerary-editor-stop-tags">
                    <span className="result-chip-line text-[0.58rem] text-foreground">
                      {formatTransportMode(item.transport_mode, language)} ·{" "}
                      {item.transport_duration_minutes} {minuteUnit}
                    </span>
                    <span
                      className={
                        item.reservation_hint
                          ? "result-chip-warm text-[0.58rem] font-semibold text-foreground"
                          : "result-chip-soft text-[0.58rem] font-semibold"
                      }
                    >
                      {item.reservation_hint ? copy.reservation : copy.flexible}
                    </span>
                    {isLocked ? (
                      <span className="result-itinerary-editor-lock-chip">
                        {copy.locked}
                      </span>
                    ) : null}
                  </div>
                </div>

                <div className="result-itinerary-editor-stop-actions">
                  <button
                    type="button"
                    className="result-itinerary-editor-mini"
                    onClick={() => onToggleLock(stopKey)}
                  >
                    {isLocked ? copy.unlock : copy.lock}
                  </button>
                  <button
                    type="button"
                    className="result-itinerary-editor-mini"
                    disabled={isLocked}
                    onClick={() => onRemoveStop(stopKey)}
                  >
                    {copy.remove}
                  </button>
                </div>
              </article>
            );
          })
        ) : (
          <p className="result-itinerary-editor-empty">{copy.empty}</p>
        )}
      </div>

      <div className="result-itinerary-editor-removed">
        <div className="result-itinerary-editor-removed-head">
          <span>{copy.removedTitle}</span>
          <span>{String(removedStops.length).padStart(2, "0")}</span>
        </div>
        {removedStops.length ? (
          <div className="result-itinerary-editor-removed-list">
            {removedStops.map((item) => {
              const stopKey = getTimelineItemKey(item);

              return (
                <button
                  key={`removed-${stopKey}`}
                  type="button"
                  className="result-itinerary-editor-restore"
                  onClick={() => onRestoreStop(stopKey)}
                >
                  <span>{item.title}</span>
                  <span>{copy.restore}</span>
                </button>
              );
            })}
          </div>
        ) : (
          <p className="result-itinerary-editor-empty">{copy.removedEmpty}</p>
        )}
      </div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <article className="result-itinerary-editor-metric">
      <span className="result-itinerary-editor-metric-label">{label}</span>
      <span className="result-itinerary-editor-metric-value">
        {String(value).padStart(2, "0")}
      </span>
    </article>
  );
}
