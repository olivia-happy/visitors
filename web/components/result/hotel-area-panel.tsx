import {
  formatBudgetBand,
  formatTravelMode,
  formatTransportMode,
} from "@/lib/result-formatters";
import type {
  HotelAreaRecommendation,
  OutputLanguage,
} from "@/lib/schemas";

type HotelAreaPanelProps = {
  areas: HotelAreaRecommendation[];
  language: OutputLanguage;
};

const copyByLanguage = {
  "zh-CN": {
    kicker: "酒店片区",
    title: "住哪一片，会直接影响每天的转场成本。",
    coverKicker: "住宿策略",
    coverBody:
      "先把晚上的回撤位置和第二天出发半径定下来，路线才不会越走越散。",
    countLabel: "候选片区",
    modeLabel: "适配场景",
    budgetLabel: "预算带",
    parkingLabel: "停车便利",
    accessLabel: "动线说明",
    priceLabel: "停车参考",
    empty: "当前还没有明确的住宿片区建议。",
  },
  en: {
    kicker: "Hotel areas",
    title: "Where you stay directly changes every transfer cost in the trip.",
    coverKicker: "Stay strategy",
    coverBody:
      "Lock the nightly return zone and next-morning launch radius before the route starts to drift.",
    countLabel: "Candidate areas",
    modeLabel: "Best for",
    budgetLabel: "Budget band",
    parkingLabel: "Parking convenience",
    accessLabel: "Access note",
    priceLabel: "Parking note",
    empty: "No clear stay-area recommendation is attached yet.",
  },
} as const;

export function HotelAreaPanel({ areas, language }: HotelAreaPanelProps) {
  const copy = copyByLanguage[language];
  const sortedAreas = [...areas].sort((left, right) => {
    if (left.budget_band && !right.budget_band) {
      return -1;
    }

    if (!left.budget_band && right.budget_band) {
      return 1;
    }

    return left.area_name.localeCompare(right.area_name);
  });
  const topArea = sortedAreas[0] ?? null;

  return (
    <section className="result-card result-priority-shell p-5">
      <div className="result-panel-head">
        <p className="result-panel-kicker">{copy.kicker}</p>
        <h2 className="result-panel-title">{copy.title}</h2>
      </div>

      {sortedAreas.length ? (
        <>
          <section className="result-priority-hero" data-tone="warm">
            <div className="result-priority-hero-main">
              <p className="result-priority-hero-kicker">{copy.coverKicker}</p>
              <p className="result-priority-hero-copy">
                {topArea?.access_note ?? copy.coverBody}
              </p>

              {topArea ? (
                <div className="result-priority-tag-row">
                  <span className="result-chip-soft text-[0.62rem] font-semibold">
                    {topArea.area_name}
                  </span>
                  <span className="result-chip-line text-[0.62rem] text-foreground">
                    {topArea.parking_convenience}
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
                  {String(sortedAreas.length).padStart(2, "0")}
                </span>
              </article>
              <article className="result-priority-metric">
                <span className="result-priority-metric-label">
                  {copy.modeLabel}
                </span>
                <span className="result-priority-metric-copy">
                  {topArea?.suitable_modes?.length
                    ? topArea.suitable_modes
                        .slice(0, 2)
                        .map((mode) => formatSuitableMode(mode, language))
                        .join(" · ")
                    : "--"}
                </span>
              </article>
              <article className="result-priority-metric">
                <span className="result-priority-metric-label">
                  {copy.budgetLabel}
                </span>
                <span className="result-priority-metric-value">
                  {topArea?.budget_band
                    ? formatBudgetBand(topArea.budget_band, language)
                    : "--"}
                </span>
              </article>
            </div>
          </section>

          <div className="result-priority-list">
            {sortedAreas.map((area, index) => (
              <article
                key={area.area_name}
                className="result-priority-card"
                data-tone={index === 0 ? "warm" : "line"}
              >
                <div className="result-priority-card-head">
                  <span className="result-priority-card-index">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div className="min-w-0">
                    <p className="result-priority-card-code">
                      {(area.suitable_modes ?? [])
                        .slice(0, 2)
                        .map((mode) => formatSuitableMode(mode, language))
                        .join(" · ") || copy.modeLabel}
                    </p>
                    <h3 className="result-priority-card-title">
                      {area.area_name}
                    </h3>
                  </div>
                  {area.budget_band ? (
                    <span className="result-chip-warm text-[0.62rem] font-semibold text-foreground">
                      {formatBudgetBand(area.budget_band, language)}
                    </span>
                  ) : null}
                </div>

                <div className="result-priority-meta-row">
                  <span className="result-chip-line text-[0.62rem] text-foreground">
                    {area.parking_convenience}
                  </span>
                  {area.parking_price_note ? (
                    <span className="result-chip-soft text-[0.62rem] font-semibold">
                      {area.parking_price_note}
                    </span>
                  ) : null}
                </div>

                <div className="result-priority-detail-grid">
                  <div className="result-priority-detail">
                    <span className="result-priority-detail-label">
                      {copy.parkingLabel}
                    </span>
                    <p className="result-priority-detail-copy">
                      {area.parking_convenience}
                    </p>
                  </div>
                  <div className="result-priority-detail">
                    <span className="result-priority-detail-label">
                      {copy.accessLabel}
                    </span>
                    <p className="result-priority-detail-copy">
                      {area.access_note}
                    </p>
                  </div>
                  {area.parking_price_note ? (
                    <div className="result-priority-detail">
                      <span className="result-priority-detail-label">
                        {copy.priceLabel}
                      </span>
                      <p className="result-priority-detail-copy">
                        {area.parking_price_note}
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

function formatSuitableMode(mode: string, language: OutputLanguage) {
  const normalized = String(mode).toLowerCase();
  if (["high_speed_rail", "metro", "drive", "taxi", "walk"].includes(normalized)) {
    return formatTransportMode(mode, language);
  }

  return formatTravelMode(mode, language);
}
