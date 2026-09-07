import { formatSeverity } from "@/lib/result-formatters";
import type { OutputLanguage, ReservationRisk } from "@/lib/schemas";

type ReservationRiskPanelProps = {
  language: OutputLanguage;
  risks: ReservationRisk[];
};

const copyByLanguage = {
  "zh-CN": {
    kicker: "预约风险",
    title: "先把需要预约的点位挑出来。",
    coverKicker: "先处理什么",
    countLabel: "风险点位",
    topRiskLabel: "最高优先级",
    actionLabel: "建议动作",
    actionValue: "先锁预约，再排吃饭与补拍",
    coverTitle: "{poi} 需要先锁定",
    coverBody:
      "把预约渠道、价格和证据摘录从路线里单独拎出来，避免行程定好了才发现进不去。",
    priority: "优先处理",
    channel: "渠道：{value}",
    price: "价格：{value}",
    evidence: "证据摘录",
    empty: "当前还没有提取到明确的预约证据。",
  },
  en: {
    kicker: "Reservation risks",
    title: "Pull the reservation-sensitive stops out first.",
    coverKicker: "Handle first",
    countLabel: "Risk stops",
    topRiskLabel: "Highest priority",
    actionLabel: "Suggested move",
    actionValue: "Lock the reservation first, then schedule meals and photo buffers.",
    coverTitle: "{poi} should be locked first",
    coverBody:
      "Separate booking channel, price, and evidence from the route itself so the plan does not collapse after the route is already fixed.",
    priority: "Priority",
    channel: "Channel: {value}",
    price: "Price: {value}",
    evidence: "Evidence",
    empty: "No clear reservation evidence has been extracted yet.",
  },
} as const;

export function ReservationRiskPanel({
  language,
  risks,
}: ReservationRiskPanelProps) {
  const copy = copyByLanguage[language];
  const sortedRisks = [...risks].sort(
    (left, right) => getSeverityRank(right.severity) - getSeverityRank(left.severity),
  );
  const topRisk = sortedRisks[0] ?? null;

  return (
    <section className="result-card result-reservation-shell p-5">
      <div className="result-panel-head">
        <p className="result-panel-kicker">{copy.kicker}</p>
        <h2 className="result-panel-title">{copy.title}</h2>
      </div>

      {sortedRisks.length ? (
        <div className="result-reservation-layout">
          <section className="result-reservation-cover">
            <div className="result-reservation-cover-main">
              <p className="result-reservation-cover-kicker">
                {copy.coverKicker}
              </p>
              <h3 className="result-reservation-cover-title">
                {copy.coverTitle.replace("{poi}", topRisk?.poi_name ?? "")}
              </h3>
              <p className="result-reservation-cover-copy">{copy.coverBody}</p>
            </div>

            <div className="result-reservation-metric-grid">
              <article className="result-reservation-metric">
                <span className="result-reservation-metric-label">
                  {copy.countLabel}
                </span>
                <span className="result-reservation-metric-value">
                  {String(sortedRisks.length).padStart(2, "0")}
                </span>
              </article>
              <article className="result-reservation-metric">
                <span className="result-reservation-metric-label">
                  {copy.topRiskLabel}
                </span>
                <span className="result-reservation-metric-value">
                  {formatSeverity(topRisk?.severity, language)}
                </span>
              </article>
              <article className="result-reservation-metric">
                <span className="result-reservation-metric-label">
                  {copy.actionLabel}
                </span>
                <span className="result-reservation-metric-copy">
                  {copy.actionValue}
                </span>
              </article>
            </div>
          </section>

          <div className="result-reservation-list">
            {sortedRisks.map((risk, index) => (
              <article
                key={`${risk.poi_name}-${risk.evidence_excerpt}`}
                className="result-reservation-card"
              >
                <div className="result-reservation-card-head">
                  <span className="result-reservation-index">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div className="min-w-0">
                    <p className="result-reservation-priority">{copy.priority}</p>
                    <h3 className="result-reservation-title">{risk.poi_name}</h3>
                  </div>
                  <span className="result-chip-soft text-[0.62rem] font-semibold">
                    {formatSeverity(risk.severity, language)}
                  </span>
                </div>

                <div className="flex flex-wrap gap-2 text-[0.62rem]">
                  {risk.reservation_channel ? (
                    <span className="result-chip-soft font-semibold">
                      {copy.channel.replace("{value}", risk.reservation_channel)}
                    </span>
                  ) : null}
                  {risk.price_note ? (
                    <span className="result-chip-warm font-semibold text-foreground">
                      {copy.price.replace("{value}", risk.price_note)}
                    </span>
                  ) : null}
                </div>

                <div className="result-reservation-evidence">
                  <span className="result-reservation-evidence-label">
                    {copy.evidence}
                  </span>
                  <p className="result-reservation-evidence-copy">
                    {risk.evidence_excerpt}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>
      ) : (
        <p className="result-surface px-4 py-4 text-[0.78rem] leading-6 text-muted">
          {copy.empty}
        </p>
      )}
    </section>
  );
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
