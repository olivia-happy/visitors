import Link from "next/link";

const entryCards = [
  {
    href: "/plan/new?entry=quick",
    eyebrow: "快速入口",
    title: "先定城市、天数和预算，再生成可执行路线。",
    body:
      "适合已经知道想去哪个国内城市的人，想尽快拿到一版小时级行程、预算面板和行前提醒。",
    cta: "进入三步向导",
    note: "城市 / 天数 / 预算 / 出行方式",
    tone:
      "border-[rgba(31,53,45,0.1)] bg-[linear-gradient(180deg,rgba(31,53,45,0.98),rgba(24,42,35,0.98))] text-white shadow-[0_24px_60px_rgba(21,29,25,0.18)]",
  },
  {
    href: "/plan/new?entry=xiaohongshu",
    eyebrow: "证据入口",
    title: "先贴小红书线索，再把预约风险前置。",
    body:
      "适合已经刷到攻略的人，想把预约提示、预约渠道、价格和证据摘录直接带进结构化结果里。",
    cta: "进入证据向导",
    note: "链接 / 证据摘录 / 预约压力 / 价格",
    tone:
      "border-line/70 bg-[rgba(255,255,255,0.82)] text-foreground shadow-[0_18px_42px_rgba(31,53,45,0.08)]",
  },
] as const;

const supportNotes = [
  "苏州只作为演示样例保留。",
  "真实输入支持任意国内城市。",
  "手机打开时仍然按分步填写，不会一次性摊开全部字段。",
] as const;

export function PlanEntryHero() {
  return (
    <section className="planner-shell rounded-[2rem] px-5 py-5 sm:px-7 sm:py-7 xl:px-8 xl:py-8">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,0.76fr)_minmax(0,1.24fr)] xl:items-start">
        <div className="grid gap-4">
          <div className="flex flex-wrap gap-2">
            <span className="planner-stamp">选择进入方式</span>
            <span className="planner-stamp" data-tone="soft">
              任意国内城市
            </span>
            <span className="planner-stamp" data-tone="warm">
              样例可跳看
            </span>
          </div>

          <div className="grid gap-3">
            <p className="planner-kicker">进入方式</p>
            <h2 className="planner-section-title text-[clamp(1.2rem,2vw,1.9rem)]">
              先决定你是从“真实需求”进入，还是从“已有证据”进入。
            </h2>
            <p className="planner-section-copy">
              这一步的目标不是让用户填很多字段，而是用最短路径进入适合自己的输入方式。对录屏和真实使用都更直观。
            </p>
          </div>

          <div className="planner-note-box">
            {supportNotes.map((item) => (
              <p className="planner-note" key={item}>
                {item}
              </p>
            ))}
          </div>

          <Link
            className="inline-flex w-fit items-center justify-center rounded-full border border-line/80 bg-white px-4 py-2 text-[0.7rem] font-semibold tracking-[0.14em] text-foreground transition hover:-translate-y-0.5 hover:shadow-[0_12px_28px_rgba(21,29,25,0.08)]"
            href="/showcase?lang=zh-CN&theme=dark"
          >
            直接跳到苏州样例结果页
          </Link>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {entryCards.map((card) => (
            <Link
              key={card.href}
              href={card.href}
              className={`grid gap-4 rounded-[1.6rem] border p-5 transition hover:-translate-y-1 ${card.tone}`}
            >
              <div className="grid gap-2">
                <p className="text-[0.64rem] font-semibold uppercase tracking-[0.24em] opacity-78">
                  {card.eyebrow}
                </p>
                <h3 className="text-[1.4rem] font-semibold leading-[1.15]">
                  {card.title}
                </h3>
              </div>

              <p className="text-[0.82rem] leading-7 opacity-84">{card.body}</p>

              <div className="flex flex-wrap gap-2 text-[0.64rem] font-semibold">
                {card.note.split(" / ").map((item) => (
                  <span
                    key={item}
                    className="rounded-full border border-current/12 px-3 py-1.5 opacity-86"
                  >
                    {item}
                  </span>
                ))}
              </div>

              <span className="text-[0.78rem] font-semibold tracking-[0.1em]">
                {card.cta}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
