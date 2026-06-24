import { fetchPlan } from "@/lib/api";

type PlanPageProps = {
  params: Promise<{
    planId: string;
  }>;
};

const timeline = [
  {
    time: "09:00 - 11:30",
    title: "Suzhou Museum",
    note: "Museum entry, architecture walk, and indoor photography window.",
    reservation: "Advance reservation mentioned in Xiaohongshu notes.",
  },
  {
    time: "12:00 - 13:30",
    title: "Pingjiang Road Lunch",
    note: "Local noodles and a slower midday pace.",
    reservation: "No reservation hint.",
  },
  {
    time: "14:00 - 17:00",
    title: "Citywalk + Cafe Stop",
    note: "Photo-friendly lane sequence with low walking intensity.",
    reservation: "No reservation hint.",
  },
];

export default async function PlanDetailPage({ params }: PlanPageProps) {
  const { planId } = await params;
  const plan = await fetchPlan(planId);
  const reservationHints = plan?.reservation_hints ?? [];

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
                ? `Output language: ${plan.output_language}. Reservation hints, budget panels, and graph data will build from this structured draft.`
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
            <div className="mt-4 flex min-h-72 items-center justify-center rounded-[1.5rem] bg-[linear-gradient(135deg,_#dae7d4,_#f5eedf)] text-sm text-muted">
              Interactive city route map will render here.
            </div>
          </div>

          <div className="rounded-[2rem] border border-line bg-card p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Hour-Level Timeline</h2>
              <span className="text-sm text-muted">Day 1 demo shell</span>
            </div>
            <div className="mt-5 grid gap-4">
              {(plan ? timeline.slice(0, Math.min(plan.days, timeline.length)) : timeline).map((item) => (
                <article
                  key={item.time}
                  className="rounded-[1.5rem] border border-line/80 bg-[#fffdf7] p-5"
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-accent">
                        {item.time}
                      </p>
                      <h3 className="mt-1 text-lg font-semibold">{item.title}</h3>
                    </div>
                    <span className="rounded-full bg-accent-soft px-3 py-1 text-xs font-semibold text-accent">
                      Reservation-ready card
                    </span>
                  </div>
                  <p className="mt-3 text-sm leading-7 text-muted">
                    {item.note}
                  </p>
                  <div className="mt-4 rounded-2xl border border-line/70 bg-white px-4 py-3 text-sm text-muted">
                    {item.reservation}
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <aside className="grid gap-6">
          <Panel
            title="Budget Panel"
            body="Tickets, food, stay, and transport ranges will be aggregated here."
          />
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
          <Panel
            title="Checklist"
            body="Packing, weather, IDs, and preparation reminders will be rendered here."
          />
          <Panel
            title="Graph View"
            body="The generated plan graph will map city, day blocks, attractions, budget categories, and reservation dependencies."
          />
        </aside>
      </div>
    </main>
  );
}

type PanelProps = {
  title: string;
  body: string;
};

function Panel({ title, body }: PanelProps) {
  return (
    <section className="rounded-[2rem] border border-line bg-card p-5">
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="mt-3 text-sm leading-7 text-muted">{body}</p>
    </section>
  );
}
