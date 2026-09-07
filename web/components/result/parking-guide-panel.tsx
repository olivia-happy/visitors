import { formatParkingSort } from "@/lib/result-formatters";
import type { OutputLanguage, ParkingGuide } from "@/lib/schemas";

type ParkingGuidePanelProps = {
  guides: ParkingGuide[];
  language: OutputLanguage;
};

const copyByLanguage = {
  "zh-CN": {
    kicker: "停车建议",
    title: "自驾方案先压实“停哪、走多远、难不难停”。",
    coverKicker: "停车策略",
    coverBody:
      "先把好停和步行距离锁住，再决定景区最后一跳要不要换乘。",
    countLabel: "停车点位",
    walkLabel: "最短步行",
    minutesValue: "{value} 分钟",
    sortLabel: "排序方式",
    lotLabel: "推荐停车场",
    difficultyLabel: "停车难度",
    priceLabel: "收费提示",
    empty: "当前还没有可执行的停车建议。",
  },
  en: {
    kicker: "Parking guides",
    title: "For driving plans, lock where to park, how far to walk, and how hard it is first.",
    coverKicker: "Parking logic",
    coverBody:
      "Lock parking ease and walking distance before deciding the final last-mile transfer.",
    countLabel: "Parking options",
    walkLabel: "Shortest walk",
    minutesValue: "{value} min",
    sortLabel: "Sort mode",
    lotLabel: "Recommended lot",
    difficultyLabel: "Parking difficulty",
    priceLabel: "Price note",
    empty: "No actionable parking guidance is attached yet.",
  },
} as const;

export function ParkingGuidePanel({
  guides,
  language,
}: ParkingGuidePanelProps) {
  const copy = copyByLanguage[language];
  const sortedGuides = [...guides].sort(
    (left, right) => left.walking_minutes - right.walking_minutes,
  );
  const topGuide = sortedGuides[0] ?? null;

  return (
    <section className="result-card result-priority-shell p-5">
      <div className="result-panel-head">
        <p className="result-panel-kicker">{copy.kicker}</p>
        <h2 className="result-panel-title">{copy.title}</h2>
      </div>

      {sortedGuides.length ? (
        <>
          <section className="result-priority-hero" data-tone="line">
            <div className="result-priority-hero-main">
              <p className="result-priority-hero-kicker">{copy.coverKicker}</p>
              <p className="result-priority-hero-copy">{copy.coverBody}</p>

              {topGuide ? (
                <div className="result-priority-tag-row">
                  <span className="result-chip-soft text-[0.62rem] font-semibold">
                    {topGuide.poi_name}
                  </span>
                  <span className="result-chip-line text-[0.62rem] text-foreground">
                    {topGuide.recommended_lot_name}
                  </span>
                </div>
              ) : null}
            </div>

            <div className="result-priority-metric-grid">
              <article className="result-priority-metric">
                <span className="result-priority-metric-label">
                  {copy.countLabel}
                </span>
                <span className="result-priority-metric-value">
                  {String(sortedGuides.length).padStart(2, "0")}
                </span>
              </article>
              <article className="result-priority-metric">
                <span className="result-priority-metric-label">
                  {copy.walkLabel}
                </span>
                <span className="result-priority-metric-value">
                  {copy.minutesValue.replace(
                    "{value}",
                    String(topGuide?.walking_minutes ?? 0),
                  )}
                </span>
              </article>
              <article className="result-priority-metric">
                <span className="result-priority-metric-label">
                  {copy.sortLabel}
                </span>
                <span className="result-priority-metric-copy">
                  {topGuide
                    ? formatParkingSort(topGuide.sort_mode, language)
                    : "--"}
                </span>
              </article>
            </div>
          </section>

          <div className="result-priority-list">
            {sortedGuides.map((guide, index) => (
              <article
                key={`${guide.poi_name}-${guide.recommended_lot_name}`}
                className="result-priority-card"
                data-tone={index === 0 ? "soft" : "line"}
              >
                <div className="result-priority-card-head">
                  <span className="result-priority-card-index">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div className="min-w-0">
                    <p className="result-priority-card-code">{guide.poi_name}</p>
                    <h3 className="result-priority-card-title">
                      {guide.recommended_lot_name}
                    </h3>
                  </div>
                  <span className="result-chip-soft text-[0.62rem] font-semibold">
                    {formatParkingSort(guide.sort_mode, language)}
                  </span>
                </div>

                <div className="result-priority-meta-row">
                  <span className="result-chip-line text-[0.62rem] text-foreground">
                    {copy.minutesValue.replace(
                      "{value}",
                      String(guide.walking_minutes),
                    )}
                  </span>
                  <span className="result-chip-line text-[0.62rem] text-foreground">
                    {guide.parking_difficulty}
                  </span>
                  {guide.price_note ? (
                    <span className="result-chip-warm text-[0.62rem] font-semibold text-foreground">
                      {guide.price_note}
                    </span>
                  ) : null}
                </div>

                <div className="result-priority-detail-grid">
                  <div className="result-priority-detail">
                    <span className="result-priority-detail-label">
                      {copy.lotLabel}
                    </span>
                    <p className="result-priority-detail-copy">
                      {guide.recommended_lot_name}
                    </p>
                  </div>
                  <div className="result-priority-detail">
                    <span className="result-priority-detail-label">
                      {copy.difficultyLabel}
                    </span>
                    <p className="result-priority-detail-copy">
                      {guide.parking_difficulty}
                    </p>
                  </div>
                  {guide.price_note ? (
                    <div className="result-priority-detail">
                      <span className="result-priority-detail-label">
                        {copy.priceLabel}
                      </span>
                      <p className="result-priority-detail-copy">
                        {guide.price_note}
                      </p>
                    </div>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        </>
      ) : (
        <p className="result-surface px-4 py-4 text-[0.78rem] leading-6 text-muted">
          {copy.empty}
        </p>
      )}
    </section>
  );
}
