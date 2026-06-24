import type { ParkingGuide } from "@/lib/schemas";

type ParkingGuidePanelProps = {
  guides: ParkingGuide[];
};

export function ParkingGuidePanel({ guides }: ParkingGuidePanelProps) {
  return (
    <section className="grid gap-4 rounded-[2rem] border border-line/70 bg-card p-6 shadow-[0_18px_50px_rgba(35,82,61,0.08)]">
      <div className="grid gap-1">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-accent">
          Parking Guides
        </p>
        <h2 className="text-2xl font-semibold">自驾时先看停车怎么落地。</h2>
      </div>

      <div className="grid gap-3">
        {guides.map((guide) => (
          <article
            key={`${guide.poi_name}-${guide.recommended_lot_name}`}
            className="grid gap-2 rounded-[1.5rem] border border-line/70 bg-[#fffdf7] p-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-base font-semibold">{guide.poi_name}</h3>
              <span className="rounded-full bg-accent-soft px-3 py-2 text-xs font-semibold text-accent">
                {guide.sort_mode}
              </span>
            </div>
            <p className="text-sm leading-7 text-muted">
              推荐停车点：{guide.recommended_lot_name}
            </p>
            <p className="text-sm leading-7 text-muted">
              步行约 {guide.walking_minutes} 分钟 · 停车难度：{guide.parking_difficulty}
            </p>
            {guide.price_note ? (
              <p className="text-sm leading-7 text-muted">
                费用提示：{guide.price_note}
              </p>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  );
}
