import {
  formatExecutionPace,
  formatTransportMode,
} from "@/lib/result-formatters";
import type {
  ExecutionSummary,
  OutputLanguage,
  TimelineItem,
} from "@/lib/schemas";

type ExecutionRoutePanelProps = {
  executionSummary: ExecutionSummary | null;
  language: OutputLanguage;
  timeline: TimelineItem[];
};

const copyByLanguage = {
  "zh-CN": {
    kicker: "执行路线",
    title: "先把城市里的移动逻辑压成一条可走的线。",
    coverKicker: "路线主控",
    stopLabel: "首屏节点",
    windowLabel: "时间窗口",
    paceLabel: "节奏",
    transport: "交通策略 {value}",
    dayCode: "第 {day} 天",
    routeMeta: "{mode} · {minutes} 分钟",
    reservationReady: "含预约",
    reservationMissing: "自由进入",
    reservationLabel: "预约提示",
    emptySummary: "生成成功后，这里会先给出首屏路线预览。",
  },
  en: {
    kicker: "Execution route",
    title: "Compress the city movement logic into one route you can actually follow.",
    coverKicker: "Route desk",
    stopLabel: "Front-screen stops",
    windowLabel: "Time window",
    paceLabel: "Pace",
    transport: "Transport {value}",
    dayCode: "Day {day}",
    routeMeta: "{mode} · {minutes} min",
    reservationReady: "Reservation",
    reservationMissing: "Open entry",
    reservationLabel: "Booking note",
    emptySummary: "A first-screen route preview will appear here after generation.",
  },
} as const;

export function ExecutionRoutePanel({
  executionSummary,
  language,
  timeline,
}: ExecutionRoutePanelProps) {
  const copy = copyByLanguage[language];
  const sortedTimeline = [...timeline].sort((left, right) => {
    if (left.day_index !== right.day_index) {
      return left.day_index - right.day_index;
    }

    const startDiff = left.start_time.localeCompare(right.start_time);
    if (startDiff !== 0) {
      return startDiff;
    }

    return left.end_time.localeCompare(right.end_time);
  });
  const routePreview = sortedTimeline.slice(0, 4);
  const firstItem = sortedTimeline[0] ?? null;
  const lastItem = sortedTimeline.at(-1) ?? null;
  const timeWindow =
    firstItem && lastItem
      ? `${firstItem.start_time} - ${lastItem.end_time}`
      : "--:-- - --:--";
  const bestFor = executionSummary?.best_for ?? [];

  return (
    <section className="result-card result-priority-shell p-5">
      <div className="result-panel-head">
        <p className="result-panel-kicker">{copy.kicker}</p>
        <h2 className="result-panel-title">{copy.title}</h2>
      </div>

      <section className="result-priority-hero" data-tone="soft">
        <div className="result-priority-hero-main">
          <p className="result-priority-hero-kicker">{copy.coverKicker}</p>
          <p className="result-priority-hero-copy">
            {executionSummary?.headline ?? copy.emptySummary}
          </p>

          <div className="result-priority-tag-row">
            {executionSummary?.transport_strategy ? (
              <span className="result-chip-soft text-[0.62rem] font-semibold">
                {copy.transport.replace(
                  "{value}",
                  executionSummary.transport_strategy,
                )}
              </span>
            ) : null}
            {bestFor.map((item) => (
              <span
                key={item}
                className="result-chip-line text-[0.62rem] font-semibold text-foreground"
              >
                {item}
              </span>
            ))}
          </div>
        </div>

        <div className="result-priority-metric-grid">
          <article className="result-priority-metric">
            <span className="result-priority-metric-label">
              {copy.stopLabel}
            </span>
            <span className="result-priority-metric-value">
              {String(routePreview.length).padStart(2, "0")}
            </span>
          </article>
          <article className="result-priority-metric">
            <span className="result-priority-metric-label">
              {copy.windowLabel}
            </span>
            <span className="result-priority-metric-copy">{timeWindow}</span>
          </article>
          <article className="result-priority-metric">
            <span className="result-priority-metric-label">
              {copy.paceLabel}
            </span>
            <span className="result-priority-metric-value">
              {formatExecutionPace(executionSummary?.pace, language)}
            </span>
          </article>
        </div>
      </section>

      <div className="result-priority-list">
        {routePreview.length ? (
          routePreview.map((item, index) => (
            <article
              key={`${item.day_index}-${item.start_time}-${item.title}`}
              className="result-priority-card"
              data-tone={item.reservation_hint ? "warm" : "line"}
            >
              <div className="result-priority-card-head">
                <span className="result-priority-card-index">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div className="min-w-0">
                  <p className="result-priority-card-code">
                    {copy.dayCode.replace("{day}", String(item.day_index))}
                  </p>
                  <h3 className="result-priority-card-title">{item.title}</h3>
                </div>
                <span className="result-chip-soft text-[0.62rem] font-semibold">
                  {copy.routeMeta
                    .replace(
                      "{mode}",
                      formatTransportMode(item.transport_mode, language),
                    )
                    .replace("{minutes}", String(item.transport_duration_minutes))}
                </span>
              </div>

              <div className="result-priority-meta-row">
                <span className="result-chip-line text-[0.62rem] text-foreground">
                  {item.start_time} - {item.end_time}
                </span>
                <span
                  className={
                    item.reservation_hint
                      ? "result-chip-warm text-[0.62rem] font-semibold text-foreground"
                      : "result-chip-line text-[0.62rem] text-foreground"
                  }
                >
                  {item.reservation_hint
                    ? copy.reservationReady
                    : copy.reservationMissing}
                </span>
              </div>

              <p className="result-priority-card-copy">{item.notes}</p>

              {item.reservation_hint ? (
                <div className="result-priority-detail-grid">
                  <div className="result-priority-detail">
                    <span className="result-priority-detail-label">
                      {copy.reservationLabel}
                    </span>
                    <p className="result-priority-detail-copy">
                      {item.reservation_hint.reminder_text}
                    </p>
                  </div>
                </div>
              ) : null}
            </article>
          ))
        ) : (
          <p className="result-surface px-4 py-4 text-[0.78rem] leading-6 text-muted">
            {copy.emptySummary}
          </p>
        )}
      </div>
    </section>
  );
}
