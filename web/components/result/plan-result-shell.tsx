import { AmapPlanMap } from "@/components/map/amap-plan-map";
import { ExecutionRoutePanel } from "@/components/result/execution-route-panel";
import { HotelAreaPanel } from "@/components/result/hotel-area-panel";
import { ParkingGuidePanel } from "@/components/result/parking-guide-panel";
import { PlanHeroSummary } from "@/components/result/plan-hero-summary";
import { ReservationRiskPanel } from "@/components/result/reservation-risk-panel";
import { buildPrimaryResultSections } from "@/lib/result-helpers";
import type {
  BudgetItem,
  ChecklistItem,
  GraphEdge,
  GraphNode,
  PlanDraft,
  TimelineItem,
  WeatherSummary,
} from "@/lib/schemas";

type PlanResultShellProps = {
  plan: PlanDraft | null;
  planId: string;
  mode?: "live" | "showcase";
};

export function PlanResultShell({
  plan,
  planId,
  mode = "live",
}: PlanResultShellProps) {
  const primarySections = buildPrimaryResultSections(plan);
  const timeline = plan?.timeline ?? [];
  const mapPoints = plan?.map_points ?? [];
  const budgetItems = plan?.budget_items ?? [];
  const checklistItems = plan?.checklist_items ?? [];
  const weatherSummary = plan?.weather_summary ?? null;
  const graphNodes = plan?.graph.nodes ?? [];
  const graphEdges = plan?.graph.edges ?? [];

  return (
    <main className="min-h-screen bg-[#f4efe4] px-6 py-10 text-foreground">
      <div className="mx-auto grid w-full max-w-7xl gap-6">
        <section className="grid gap-6">
          <PlanHeroSummary mode={mode} plan={plan} planId={planId} />
          {primarySections.includes("reservation_risks") ? (
            <ReservationRiskPanel risks={plan?.reservation_risks ?? []} />
          ) : null}
          {primarySections.includes("execution_route") ? (
            <ExecutionRoutePanel
              executionSummary={plan?.execution_summary ?? null}
              timeline={timeline}
            />
          ) : null}
          {primarySections.includes("parking_guides") ? (
            <ParkingGuidePanel guides={plan?.parking_guides ?? []} />
          ) : null}
          {primarySections.includes("hotel_areas") ? (
            <HotelAreaPanel
              areas={plan?.hotel_area_recommendations ?? []}
            />
          ) : null}
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="grid gap-6">
            <div className="rounded-[2rem] border border-dashed border-accent/40 bg-white/70 p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">City Planning Map</h2>
                <span className="rounded-full bg-accent-soft px-3 py-1 text-xs font-semibold text-accent">
                  AMap JS API
                </span>
              </div>
              <div className="mt-4">
                <AmapPlanMap city={plan?.city ?? "City"} mapPoints={mapPoints} />
              </div>
            </div>

            <div className="rounded-[2rem] border border-line bg-card p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Full Timeline</h2>
                <span className="text-sm text-muted">
                  {timeline.length
                    ? `${plan?.days} day structured output`
                    : "Timeline pending"}
                </span>
              </div>
              <div className="mt-5 grid gap-4">
                {timeline.length ? (
                  timeline.map((item) => (
                    <TimelineCard
                      key={`${item.day_index}-${item.start_time}-${item.title}`}
                      item={item}
                    />
                  ))
                ) : (
                  <p className="text-sm leading-7 text-muted">
                    Timeline data will appear here after plan generation.
                  </p>
                )}
              </div>
            </div>
          </div>

          <aside className="grid gap-6">
            <WeatherPanel weatherSummary={weatherSummary} />
            <BudgetPanel items={budgetItems} />
            <ChecklistPanel items={checklistItems} />
            <GraphPanel nodes={graphNodes} edges={graphEdges} />
          </aside>
        </section>
      </div>
    </main>
  );
}

function WeatherPanel({
  weatherSummary,
}: {
  weatherSummary: WeatherSummary | null;
}) {
  return (
    <section className="rounded-[2rem] border border-line bg-card p-5">
      <h2 className="text-lg font-semibold">Weather & Packing</h2>
      {weatherSummary ? (
        <div className="mt-4 grid gap-4">
          <article className="rounded-2xl border border-line/70 bg-[#fffdf7] px-4 py-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-accent">
                  {weatherSummary.city_name}
                </p>
                <h3 className="mt-1 text-lg font-semibold text-foreground">
                  {weatherSummary.condition_summary}
                </h3>
              </div>
              <span className="rounded-full bg-accent-soft px-3 py-1 text-xs font-semibold text-accent">
                {formatTemperatureRange(weatherSummary)}
              </span>
            </div>
            <p className="mt-3 text-sm leading-7 text-muted">
              {weatherSummary.overview}
            </p>
            {weatherSummary.clothing_tip ? (
              <p className="mt-3 text-sm leading-7 text-foreground/80">
                {weatherSummary.clothing_tip}
              </p>
            ) : null}
            {weatherSummary.advisory_tags.length ? (
              <div className="mt-4 flex flex-wrap gap-2 text-xs">
                {weatherSummary.advisory_tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-[#efe7d4] px-3 py-1 text-foreground"
                  >
                    {formatWeatherTag(tag)}
                  </span>
                ))}
              </div>
            ) : null}
            {weatherSummary.report_time ? (
              <p className="mt-3 text-xs leading-6 text-muted">
                Report time: {weatherSummary.report_time}
              </p>
            ) : null}
          </article>
        </div>
      ) : (
        <p className="mt-3 text-sm leading-7 text-muted">
          Temperature range, weather notes, and packing guidance will appear
          here when forecast data is available.
        </p>
      )}
    </section>
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

function formatTemperatureRange(weatherSummary: WeatherSummary) {
  const low = weatherSummary.temperature_low_c;
  const high = weatherSummary.temperature_high_c;

  if (low === null && high === null) {
    return "Temp pending";
  }

  if (low === null) {
    return `Up to ${high}°C`;
  }

  if (high === null) {
    return `Around ${low}°C`;
  }

  return `${low}-${high}°C`;
}

function formatWeatherTag(tag: string) {
  const labels: Record<string, string> = {
    rain: "Rain prep",
    sun: "Sun protection",
    layering: "Layering",
  };

  return labels[tag] ?? tag;
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
            Packing, weather, IDs, and preparation reminders will be rendered
            here.
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
                <p
                  key={`${edge.source}-${edge.target}-${index}`}
                  className="text-sm text-muted"
                >
                  {edge.source} {"->"} {edge.target}
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
