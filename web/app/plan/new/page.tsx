import { PlanIntakeForm } from "@/components/intake/plan-intake-form";

const sections = [
  "Trip Basics",
  "Budget & Transport",
  "Stay & Interests",
  "Special Requirements",
  "Xiaohongshu Source",
];

export default function NewPlanPage() {
  return (
    <main className="min-h-screen bg-background px-6 py-10 text-foreground">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <header className="flex flex-col gap-3">
          <p className="text-sm font-medium uppercase tracking-[0.3em] text-accent">
            Plan Intake
          </p>
          <h1 className="text-3xl font-semibold sm:text-5xl">
            Build a city trip brief before wiring the real planner.
          </h1>
          <p className="max-w-3xl text-base leading-8 text-muted">
            This is the first product shell for the structured intake flow. The
            real submit action will connect to FastAPI in the next step.
          </p>
        </header>

        <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-[2rem] border border-line bg-card p-6 shadow-[0_20px_60px_rgba(35,82,61,0.08)]">
            <PlanIntakeForm />
          </div>

          <aside className="rounded-[2rem] border border-line bg-[#f1eadb] p-6">
            <h2 className="text-lg font-semibold">Intake Sections</h2>
            <ul className="mt-4 grid gap-3">
              {sections.map((section, index) => (
                <li
                  key={section}
                  className="rounded-2xl border border-line/80 bg-white/70 px-4 py-3 text-sm text-muted"
                >
                  <span className="mr-2 font-semibold text-accent">
                    0{index + 1}
                  </span>
                  {section}
                </li>
              ))}
            </ul>
          </aside>
        </section>
      </div>
    </main>
  );
}
