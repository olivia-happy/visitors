import Link from "next/link";

const entryCards = [
  {
    href: "/plan/new?entry=quick",
    eyebrow: "Quick Entry",
    title: "先定城市和节奏，再补证据。",
    body: "适合已经知道去哪、想快速生成一版可执行路线的人。",
    accent: "bg-accent text-white",
  },
  {
    href: "/plan/new?entry=xiaohongshu",
    eyebrow: "Xiaohongshu Entry",
    title: "先贴证据，再把预约风险前置。",
    body: "适合已经刷到攻略、想把预约提醒和踩点证据直接带进路线的人。",
    accent: "bg-white/85 text-foreground",
  },
];

export function PlanEntryHero() {
  return (
    <section className="grid gap-5 rounded-[2rem] border border-line/70 bg-card/90 p-5 shadow-[0_18px_70px_rgba(35,82,61,0.08)] backdrop-blur sm:p-8">
      <div className="grid gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.32em] text-accent">
          Dual Entry
        </p>
        <h1 className="max-w-4xl text-4xl font-semibold leading-tight sm:text-6xl">
          先决定你是要快速起草，还是先把小红书证据钉进路线里。
        </h1>
        <p className="max-w-2xl text-sm leading-7 text-muted sm:text-base">
          这版移动端 intake 会把预约风险、执行节奏和自驾停车要求提前到输入阶段，不再让结果页替你兜底。
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {entryCards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className={`grid gap-4 rounded-[1.75rem] border border-line/70 p-5 transition hover:-translate-y-0.5 hover:shadow-[0_16px_50px_rgba(35,82,61,0.1)] ${card.accent}`}
          >
            <div className="grid gap-2">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] opacity-80">
                {card.eyebrow}
              </p>
              <h2 className="text-2xl font-semibold leading-snug">{card.title}</h2>
            </div>
            <p className="text-sm leading-7 opacity-85">{card.body}</p>
            <span className="text-sm font-semibold">
              进入三步向导
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
