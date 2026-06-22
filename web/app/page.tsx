import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.95),_transparent_40%),linear-gradient(135deg,_#f6f0e3,_#e9dec5)] px-6 py-10 text-foreground">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10">
        <header className="flex flex-col gap-4 rounded-[2rem] border border-line/70 bg-card/90 p-6 shadow-[0_20px_80px_rgba(35,82,61,0.08)] backdrop-blur">
          <p className="text-sm font-medium uppercase tracking-[0.3em] text-accent">
            Visitors
          </p>
          <h1 className="max-w-3xl text-4xl font-semibold leading-tight sm:text-6xl">
            China-first AI travel planning for people who want a trip plan they
            can actually follow.
          </h1>
          <p className="max-w-2xl text-base leading-8 text-muted sm:text-lg">
            Build an hour-level itinerary, city planning map, reservation hints,
            budget panel, and preparation checklist from one structured intake.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              className="inline-flex items-center justify-center rounded-full bg-accent px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90"
              href="/plan/new"
            >
              Start A Plan
            </Link>
            <Link
              className="inline-flex items-center justify-center rounded-full border border-line bg-white/70 px-6 py-3 text-sm font-semibold text-foreground transition hover:bg-white"
              href="/plan/demo-hangzhou"
            >
              View Demo Result
            </Link>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-3">
          {[
            "Hour-level itinerary with transport and timing.",
            "Reservation reminders with source evidence and price notes.",
            "Budget, checklist, and graph view designed for practical planning.",
          ].map((item) => (
            <div
              key={item}
              className="rounded-[1.75rem] border border-line/70 bg-card p-5 shadow-[0_10px_40px_rgba(35,82,61,0.06)]"
            >
              <p className="text-sm leading-7 text-muted">{item}</p>
            </div>
          ))}
        </section>
      </div>
    </main>
  );
}
