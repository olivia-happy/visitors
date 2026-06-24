import Link from "next/link";

import { PlanEntryHero } from "@/components/intake/plan-entry-hero";

export default function Home() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.95),_transparent_40%),linear-gradient(135deg,_#f6f0e3,_#e9dec5)] px-6 py-10 text-foreground">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10">
        <PlanEntryHero />

        <section className="grid gap-4 md:grid-cols-3">
          {[
            "三步向导只展示当前步骤，移动端不会再把所有字段一次性摊开。",
            "预约提醒仍然只来自小红书证据，不会被结果页视觉层绕开边界。",
            "自驾时才会出现停车排序和步行容忍度，非自驾场景默认完全隐藏。",
          ].map((item) => (
            <div
              key={item}
              className="rounded-[1.75rem] border border-line/70 bg-card p-5 shadow-[0_10px_40px_rgba(35,82,61,0.06)]"
            >
              <p className="text-sm leading-7 text-muted">{item}</p>
            </div>
          ))}
        </section>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            className="inline-flex items-center justify-center rounded-full bg-accent px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90"
            href="/plan/new?entry=quick"
          >
            直接开始快速入口
          </Link>
          <Link
            className="inline-flex items-center justify-center rounded-full border border-line bg-white/70 px-6 py-3 text-sm font-semibold text-foreground transition hover:bg-white"
            href="/showcase"
          >
            View Demo Result
          </Link>
        </div>
      </div>
    </main>
  );
}
