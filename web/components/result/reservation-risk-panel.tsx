import type { ReservationRisk } from "@/lib/schemas";

type ReservationRiskPanelProps = {
  risks: ReservationRisk[];
};

export function ReservationRiskPanel({
  risks,
}: ReservationRiskPanelProps) {
  return (
    <section className="grid gap-4 rounded-[2rem] border border-line/70 bg-card p-6 shadow-[0_18px_50px_rgba(35,82,61,0.08)]">
      <div className="grid gap-1">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-accent">
          Reservation Risks
        </p>
        <h2 className="text-2xl font-semibold">先把需要预约的点位挑出来。</h2>
      </div>

      <div className="grid gap-3">
        {risks.length ? (
          risks.map((risk) => (
            <article
              key={`${risk.poi_name}-${risk.evidence_excerpt}`}
              className="grid gap-3 rounded-[1.5rem] border border-line/70 bg-[#fffdf7] p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="text-lg font-semibold">{risk.poi_name}</h3>
                <span className="rounded-full bg-accent-soft px-3 py-2 text-xs font-semibold text-accent">
                  {risk.severity}
                </span>
              </div>
              <div className="flex flex-wrap gap-2 text-xs">
                {risk.reservation_channel ? (
                  <span className="rounded-full bg-accent-soft px-3 py-2 font-semibold text-accent">
                    渠道：{risk.reservation_channel}
                  </span>
                ) : null}
                {risk.price_note ? (
                  <span className="rounded-full bg-[#efe7d4] px-3 py-2 font-semibold text-foreground">
                    价格：{risk.price_note}
                  </span>
                ) : null}
              </div>
              <p className="text-sm leading-7 text-muted">
                证据摘录：{risk.evidence_excerpt}
              </p>
            </article>
          ))
        ) : (
          <p className="rounded-[1.5rem] border border-line/70 bg-[#fffdf7] px-4 py-4 text-sm leading-7 text-muted">
            当前没有提取到明确的预约证据。
          </p>
        )}
      </div>
    </section>
  );
}
