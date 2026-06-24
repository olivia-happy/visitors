import { fetchPlan } from "@/lib/api";
import type { BudgetItem, ChecklistItem, GraphEdge, GraphNode, TimelineItem } from "@/lib/schemas";

type PlanPageProps = {
  params: Promise<{
    planId: string;
  }>;
};

export default async function PlanDetailPage({ params }: PlanPageProps) {
  const { planId } = await params;
  const plan = await fetchPlan(planId);
  const reservationHints = plan?.reservation_hints ?? [];
  const timeline = plan?.timeline ?? [];
  const mapPoints = plan?.map_points ?? [];
  const budgetItems = plan?.budget_items ?? [];
  const checklistItems = plan?.checklist_items ?? [];
  const graphNodes = plan?.graph.nodes ?? [];
  const graphEdges = plan?.graph.edges ?? [];

  return (
    <main className="min-h-screen bg-[#f4efe4] px-6 py-10 text-foreground">
      <div className="mx-auto grid w-full max-w-7xl gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <section className="grid gap-6">
          <div className="rounded-[2rem] border border-line bg-card p-6 shadow-[0_18px_50px_rgba(35,82,61,0.08)]">
            <p className="text-sm uppercase tracking-[0.3em] text-accent">
              Plan Result
            </p>
            <h1 className="mt-3 text-3xl font-semibold sm:text-5xl">
              {plan ? `${plan.city} · ${plan.days} day plan` : `Demo plan shell for ${planId}`}
            </h1>
            <p className="mt-3 max-w-3xl text-base leading-8 text-muted">
              {plan
                ? `${plan.summary} Output language: ${plan.output_language}.`
                : "This result page is the initial container for map, itinerary, reservation hints, and budget panels."}
            </p>
          </div>

          <div className="rounded-[2rem] border border-dashed border-accent/40 bg-white/70 p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">City Planning Map</h2>
              <span className="rounded-full bg-accent-soft px-3 py-1 text-xs font-semibold text-accent">
                AMap placeholder
              </span>
            </div>
            <div className="mt-4 min-h-72 rounded-[1.5rem] bg-[linear-gradient(135deg,_#dae7d4,_#f5eedf)] p-5">
              {mapPoints.length ? (
                <div className="grid gap-3">
                  <p className="text-sm leading-7 text-muted">
                    Interactive AMap rendering will be wired next. Current API
                    output already includes route point order and coordinates.
                  </p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {mapPoints.map((point) => (
                      <article
                        key={`${point.sequence_no}-${point.name}`}
                        className="rounded-2xl border border-line/70 bg-white/80 p-4 text-sm"
                      >
                        <p className="font-semibold text-accent">
                          #{point.sequence_no} · Day {point.day_index}
                        </p>
                        <h3 className="mt-1 font-semibold">{point.name}</h3>
                        <p className="mt-2 text-muted">
                          {point.lat.toFixed(4)}, {point.lng.toFixed(4)}
                        </p>
                      </article>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex min-h-60 items-center justify-center text-sm text-muted">
                  Interactive city route map will render here.
                </div>
              )}
            </div>
          </div>

          <div className="rounded-[2rem] border border-line bg-card p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Hour-Level Timeline</h2>
              <span className="text-sm text-muted">
                {timeline.length ? `${plan?.days} day structured output` : "Timeline pending"}
              </span>
            </div>
            <div className="mt-5 grid gap-4">
              {timeline.length ? (
                timeline.map((item) => (
                  <TimelineCard key={`${item.day_index}-${item.start_time}-${item.title}`} item={item} />
                ))
              ) : (
                <p className="text-sm leading-7 text-muted">
                  Timeline data will appear here after plan generation.
                </p>
              )}
            </div>
          </div>
        </section>

        <aside className="grid gap-6">
          <BudgetPanel items={budgetItems} />
          <section className="rounded-[2rem] border border-line bg-card p-5">
            <h2 className="text-lg font-semibold">Reservation Hints</h2>
            <p className="mt-3 text-sm leading-7 text-muted">
              Evidence-based reservation notes from Xiaohongshu appear here,
              including channel and price when available.
            </p>
            <div className="mt-4 grid gap-3">
              {reservationHints.length ? (
                reservationHints.map((hint) => (
                  <article
                    key={`${hint.poi_name}-${hint.evidence_excerpt}`}
                    className="rounded-[1.5rem] border border-line/70 bg-[#fffdf7] p-4"
                  >
                    <h3 className="text-sm font-semibold text-foreground">
                      {hint.poi_name}
                    </h3>
                    <p className="mt-2 text-sm leading-7 text-muted">
                      {hint.reminder_text}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2 text-xs">
                      {hint.reservation_channel ? (
                        <span className="rounded-full bg-accent-soft px-3 py-1 text-accent">
                          Channel: {hint.reservation_channel}
                        </span>
                      ) : null}
                      {hint.price_note ? (
                        <span className="rounded-full bg-[#efe7d4] px-3 py-1 text-foreground">
                          Price: {hint.price_note}
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-3 text-xs leading-6 text-muted">
                      Evidence: {hint.evidence_excerpt}
                    </p>
                  </article>
                ))
              ) : (
                <p className="text-sm leading-7 text-muted">
                  No explicit reservation evidence extracted yet.
                </p>
              )}
            </div>
          </section>
          <ChecklistPanel items={checklistItems} />
          <GraphPanel nodes={graphNodes} edges={graphEdges} />
        </aside>
      </div>
    </main>
  );
}

function TimelineCard({ item }: { item: TimelineItem }) {
  return (
    <article className="rounded-[1.5rem] border border-line/80 bg-[#fffdf7] p-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-accent">
            Day {item.day_index} · {item.start_time} - {item.end_time}
          </p>
          <h3 className="mt-1 text-lg font-semibold">{item.title}</h3>
        </div>
        <span className="rounded-full bg-accent-soft px-3 py-1 text-xs font-semibold text-accent">
          {item.transport_mode} · {item.transport_duration_minutes} min
        </span>
      </div>
      <p className="mt-3 text-sm leading-7 text-muted">{item.notes}</p>
      <div className="mt-4 rounded-2xl border border-line/70 bg-white px-4 py-3 text-sm text-muted">
        {item.reservation_hint ? (
          <div className="grid gap-2">
            <p>{item.reservation_hint.reminder_text}</p>
            <div className="flex flex-wrap gap-2 text-xs">
              {item.reservation_hint.reservation_channel ? (
                <span className="rounded-full bg-accent-soft px-3 py-1 text-accent">
                  Channel: {item.reservation_hint.reservation_channel}
                </span>
              ) : null}
              {item.reservation_hint.price_note ? (
                <span className="rounded-full bg-[#efe7d4] px-3 py-1 text-foreground">
                  Price: {item.reservation_hint.price_note}
                </span>
              ) : null}
            </div>
          </div>
        ) : (
          "No explicit reservation evidence attached to this stop."
        )}
      </div>
    </article>
  );
}

function BudgetPanel({ items }: { items: BudgetItem[] }) {
  return (
    <section className="rounded-[2rem] border border-line bg-card p-5">
      <h2 className="text-lg font-semibold">Budget Panel</h2>
      <div className="mt-4 grid gap-3">
        {items.length ? (
          items.map((item) => (
            <article
              key={item.category}
              className="rounded-2xl border border-line/70 bg-[#fffdf7] px-4 py-3"
            >
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-sm font-semibold capitalize">
                  {item.category.replaceAll("_", " ")}
                </h3>
                <span className="text-sm text-muted">
                  RMB {item.amount_low} - {item.amount_high}
                </span>
              </div>
              <p className="mt-2 text-xs text-muted">
                {item.is_adjustable ? "Adjustable" : "Mostly fixed"}
              </p>
            </article>
          ))
        ) : (
          <p className="text-sm leading-7 text-muted">
            Tickets, food, stay, and transport ranges will be aggregated here.
          </p>
        )}
      </div>
    </section>
  );
}

function ChecklistPanel({ items }: { items: ChecklistItem[] }) {
  return (
    <section className="rounded-[2rem] border border-line bg-card p-5">
      <h2 className="text-lg font-semibold">Checklist</h2>
      <div className="mt-4 grid gap-3">
        {items.length ? (
          items.map((item) => (
            <article
              key={`${item.category}-${item.item_name}`}
              className="rounded-2xl border border-line/70 bg-[#fffdf7] px-4 py-3"
            >
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-sm font-semibold">{item.item_name}</h3>
                <span className="rounded-full bg-accent-soft px-3 py-1 text-xs text-accent">
                  {item.category}
                </span>
              </div>
              <p className="mt-2 text-sm leading-6 text-muted">{item.reason}</p>
            </article>
          ))
        ) : (
          <p className="text-sm leading-7 text-muted">
            Packing, weather, IDs, and preparation reminders will be rendered here.
          </p>
        )}
      </div>
    </section>
  );
}

function GraphPanel({
  nodes,
  edges,
}: {
  nodes: GraphNode[];
  edges: GraphEdge[];
}) {
  return (
    <section className="rounded-[2rem] border border-line bg-card p-5">
      <h2 className="text-lg font-semibold">Graph View</h2>
      {nodes.length ? (
        <div className="mt-4 grid gap-4">
          <div className="grid gap-2">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">
              Nodes
            </p>
            <div className="flex flex-wrap gap-2">
              {nodes.map((node) => (
                <span
                  key={node.id}
                  className="rounded-full border border-line bg-[#fffdf7] px-3 py-2 text-xs text-foreground"
                >
                  {node.type}: {node.label}
                </span>
              ))}
            </div>
          </div>
          <div className="grid gap-2">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">
              Edges
            </p>
            <div className="grid gap-2">
              {edges.map((edge, index) => (
                <p key={`${edge.source}-${edge.target}-${index}`} className="text-sm text-muted">
                  {edge.source} → {edge.target}
                  {edge.label ? ` · ${edge.label}` : ""}
                </p>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <p className="mt-3 text-sm leading-7 text-muted">
          The generated plan graph will map city, day blocks, attractions,
          budget categories, and reservation dependencies.
        </p>
      )}
    </section>
  );
}
