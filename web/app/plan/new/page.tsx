import { PlanIntakeForm } from "@/components/intake/plan-intake-form";

type NewPlanPageProps = {
  searchParams?: Promise<{
    entry?: string | string[];
  }>;
};

function normalizeEntryMode(entry: string | string[] | undefined) {
  const value = Array.isArray(entry) ? entry[0] : entry;
  return value === "xiaohongshu" ? "xiaohongshu" : "quick";
}

export default async function NewPlanPage({
  searchParams,
}: NewPlanPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const entryMode = normalizeEntryMode(resolvedSearchParams?.entry);

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.9),_transparent_42%),linear-gradient(180deg,_#f7f1e5,_#efe4cb)] px-4 py-6 text-foreground sm:px-6 sm:py-10">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
        <header className="flex flex-col gap-3">
          <p className="text-sm font-medium uppercase tracking-[0.3em] text-accent">
            Plan Intake
          </p>
          <h1 className="text-3xl font-semibold sm:text-5xl">
            {entryMode === "xiaohongshu"
              ? "先把证据钉住，再生成能执行的路线。"
              : "先把路线骨架定下来，再补关键证据。"}
          </h1>
          <p className="max-w-3xl text-base leading-8 text-muted">
            现在的 `/plan/new` 已经改成三步移动端向导。顶部固定进度，底部固定主按钮，页面每次只展示当前步骤内容。
          </p>
        </header>

        <section className="rounded-[2rem] border border-line/70 bg-card/95 p-4 shadow-[0_20px_60px_rgba(35,82,61,0.08)] sm:p-6">
          <PlanIntakeForm entryMode={entryMode} />
        </section>
      </div>
    </main>
  );
}
