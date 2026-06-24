import type { PlanDraft } from "@/lib/schemas";

type PlanHeroSummaryProps = {
  mode: "live" | "showcase";
  plan: PlanDraft | null;
  planId: string;
};

export function PlanHeroSummary({
  mode,
  plan,
  planId,
}: PlanHeroSummaryProps) {
  return (
    <section className="grid gap-5 rounded-[2rem] border border-line/70 bg-card p-6 shadow-[0_20px_70px_rgba(35,82,61,0.08)]">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="grid gap-2">
          <p className="text-sm uppercase tracking-[0.28em] text-accent">
            {mode === "showcase" ? "Showcase" : "Execution First"}
          </p>
          <h1 className="text-3xl font-semibold leading-tight sm:text-5xl">
            {plan
              ? `${plan.city} · ${plan.days} 天执行方案`
              : `Plan shell for ${planId}`}
          </h1>
        </div>
        <div className="flex flex-wrap gap-2 text-xs">
          {plan?.entry_mode ? (
            <span className="rounded-full bg-accent-soft px-3 py-2 font-semibold text-accent">
              Entry: {plan.entry_mode}
            </span>
          ) : null}
          {plan?.travel_mode ? (
            <span className="rounded-full bg-[#efe7d4] px-3 py-2 font-semibold text-foreground">
              Mode: {plan.travel_mode}
            </span>
          ) : null}
        </div>
      </div>

      <div className="grid gap-4 rounded-[1.5rem] border border-line/70 bg-[#fffdf7] p-5">
        <p className="text-lg font-semibold leading-8 text-foreground">
          {plan?.execution_summary?.headline ??
            plan?.summary ??
            "Execution summary will appear here after generation."}
        </p>
        <div className="flex flex-wrap gap-2 text-xs">
          {plan?.execution_summary?.pace ? (
            <span className="rounded-full bg-accent-soft px-3 py-2 font-semibold text-accent">
              Pace: {plan.execution_summary.pace}
            </span>
          ) : null}
          {plan?.execution_summary?.transport_strategy ? (
            <span className="rounded-full bg-[#efe7d4] px-3 py-2 font-semibold text-foreground">
              {plan.execution_summary.transport_strategy}
            </span>
          ) : null}
          {(plan?.execution_summary?.best_for ?? []).map((item) => (
            <span
              key={item}
              className="rounded-full border border-line bg-white px-3 py-2 font-semibold text-foreground"
            >
              {item}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
