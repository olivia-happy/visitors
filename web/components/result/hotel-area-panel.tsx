import type { HotelAreaRecommendation } from "@/lib/schemas";

type HotelAreaPanelProps = {
  areas: HotelAreaRecommendation[];
};

export function HotelAreaPanel({ areas }: HotelAreaPanelProps) {
  return (
    <section className="grid gap-4 rounded-[2rem] border border-line/70 bg-card p-6 shadow-[0_18px_50px_rgba(35,82,61,0.08)]">
      <div className="grid gap-1">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-accent">
          Hotel Areas
        </p>
        <h2 className="text-2xl font-semibold">酒店片区建议也放在执行层。</h2>
      </div>

      <div className="grid gap-3">
        {areas.map((area) => (
          <article
            key={area.area_name}
            className="grid gap-2 rounded-[1.5rem] border border-line/70 bg-[#fffdf7] p-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-base font-semibold">{area.area_name}</h3>
              {area.budget_band ? (
                <span className="rounded-full bg-[#efe7d4] px-3 py-2 text-xs font-semibold text-foreground">
                  {area.budget_band}
                </span>
              ) : null}
            </div>
            <p className="text-sm leading-7 text-muted">
              停车便利：{area.parking_convenience}
            </p>
            <p className="text-sm leading-7 text-muted">
              动线说明：{area.access_note}
            </p>
            {area.parking_price_note ? (
              <p className="text-sm leading-7 text-muted">
                费用提示：{area.parking_price_note}
              </p>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  );
}
