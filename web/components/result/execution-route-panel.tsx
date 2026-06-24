import type { ExecutionSummary, TimelineItem } from "@/lib/schemas";

type ExecutionRoutePanelProps = {
  executionSummary: ExecutionSummary | null;
  timeline: TimelineItem[];
};

export function ExecutionRoutePanel({
  executionSummary,
  timeline,
}: ExecutionRoutePanelProps) {
  const routePreview = timeline.slice(0, 4);

  return (
    <section className="grid gap-4 rounded-[2rem] border border-line/70 bg-card p-6 shadow-[0_18px_50px_rgba(35,82,61,0.08)]">
      <div className="grid gap-1">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-accent">
          Execution Route
        </p>
        <h2 className="text-2xl font-semibold">先看怎么走，再决定细节。</h2>
      </div>

      <div className="grid gap-4 rounded-[1.5rem] border border-line/70 bg-[#fffdf7] p-5">
        <p className="text-sm leading-7 text-muted">
          {executionSummary?.headline ??
            "Execution summary will appear here after generation."}
        </p>
        {executionSummary?.transport_strategy ? (
          <p className="text-sm font-semibold text-foreground">
            交通策略：{executionSummary.transport_strategy}
          </p>
        ) : null}
      </div>

      <div className="grid gap-3">
        {routePreview.length ? (
          routePreview.map((item) => (
            <article
              key={`${item.day_index}-${item.start_time}-${item.title}`}
              className="flex flex-col gap-2 rounded-[1.5rem] border border-line/70 bg-white/85 p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="text-base font-semibold">
                  Day {item.day_index} · {item.title}
                </h3>
                <span className="rounded-full bg-accent-soft px-3 py-2 text-xs font-semibold text-accent">
                  {item.transport_mode} · {item.transport_duration_minutes} min
                </span>
              </div>
              <p className="text-sm leading-7 text-muted">
                {item.start_time} - {item.end_time} · {item.notes}
              </p>
            </article>
          ))
        ) : (
          <p className="text-sm leading-7 text-muted">
            生成后会在这里先给出首屏路线预览。
          </p>
        )}
      </div>
    </section>
  );
}
