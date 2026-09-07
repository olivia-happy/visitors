import Link from "next/link";

import { PlanEntryHero } from "@/components/intake/plan-entry-hero";

const valueCards = [
  {
    code: "01",
    title: "任意国内城市都能直接输入",
    body:
      "真实使用从城市、天数、预算和出行方式开始，苏州只保留为样例，不会限制产品能力边界。",
  },
  {
    code: "02",
    title: "预约风险会被提前拎出来",
    body:
      "不是先堆景点，而是先把免费但难约的馆、预约渠道、价格和证据摘录前置，避免到出发前才发现卡点。",
  },
  {
    code: "03",
    title: "最后拿到的是执行面板",
    body:
      "不是一篇长攻略，而是一张能直接看懂的旅行控制台：时间轴、预算、停车、行前清单和节点关系图都在同一套结果里。",
  },
] as const;

const deliverables = [
  "小时级每日时间轴",
  "预约提示与预约渠道",
  "预算区间与结构化明细",
  "停车难度与推荐停车场",
  "酒店片区与通勤判断",
  "天气/证件/穿搭清单",
  "节点关系图与分享页",
  "中英输出与汇率换算",
] as const;

const routeSignals = [
  {
    eyebrow: "输入",
    title: "城市 / 天数 / 预算 / 出行方式",
    body: "先决定真实边界，再让系统去压缩路线。",
  },
  {
    eyebrow: "证据",
    title: "小红书线索 / 预约证据 / 停车约束",
    body: "把会影响执行的隐性风险提前结构化。",
  },
  {
    eyebrow: "结果",
    title: "行程图 / 预算面板 / 分享页",
    body: "输出不是文案，而是可以直接拿去用的方案。",
  },
] as const;

const demoSteps = [
  {
    label: "先看样例",
    value: "苏州 2 天",
    note: "适合第一次打开，快速理解完整结果长什么样。",
  },
  {
    label: "再输真实需求",
    value: "任意国内城市",
    note: "城市、预算、交通和偏好都走真实表单，不绑定样例。",
  },
  {
    label: "最后拿结果",
    value: "可分享控制台",
    note: "适合录屏、截图、发给同行人，或者当作品展示。",
  },
] as const;

export default function Home() {
  return (
    <main
      className="planner-root planner-surface min-h-screen px-4 py-5 text-foreground sm:px-6 sm:py-6 xl:px-8"
      data-theme="light"
    >
      <div className="mx-auto grid w-full max-w-[90rem] gap-5">
        <section className="planner-hero rounded-[2rem] px-5 py-5 sm:px-7 sm:py-7 xl:px-9 xl:py-8">
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.04fr)_minmax(23rem,0.96fr)] xl:items-stretch">
            <div className="grid gap-5">
              <div className="flex flex-wrap gap-2">
                <span className="planner-stamp">国内旅行规划</span>
                <span className="planner-stamp" data-tone="soft">
                  苏州仅为样例
                </span>
                <span className="planner-stamp" data-tone="warm">
                  适合录屏展示
                </span>
              </div>

              <div className="grid gap-3">
                <p className="planner-kicker">旅行控制台 · 国内城市版本</p>
                <h1 className="planner-display planner-display-intake max-w-[12ch]">
                  输入任意国内城市，把模糊想法压缩成一张可执行旅行控制台。
                </h1>
                <p className="planner-copy max-w-[42rem]">
                  这不是只服务苏州的展示页，而是一个面向国内城市出行的
                  vibe coding 产品。它先帮你把预约风险、预算边界、停车约束和拍照偏好理清，再生成小时级路线、预算明细、行前清单和分享页。
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                {routeSignals.map((signal, index) => (
                  <article
                    key={signal.title}
                    className="planner-primary-card"
                    data-tone={index === 1 ? "warm" : "soft"}
                  >
                    <p className="planner-kicker">{signal.eyebrow}</p>
                    <h2 className="planner-priority-title">{signal.title}</h2>
                    <p className="planner-priority-helper">{signal.body}</p>
                  </article>
                ))}
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Link
                  className="planner-priority-button"
                  href="/plan/new?entry=quick"
                >
                  输入任意城市
                </Link>
                <Link
                  className="inline-flex items-center justify-center rounded-full border border-line/80 bg-white/78 px-5 py-3 text-[0.72rem] font-semibold tracking-[0.14em] text-foreground transition hover:-translate-y-0.5 hover:bg-white"
                  href="/showcase?lang=zh-CN&theme=dark"
                >
                  先看苏州样例
                </Link>
                <Link
                  className="inline-flex items-center justify-center rounded-full border border-line/80 bg-white/50 px-5 py-3 text-[0.72rem] font-semibold tracking-[0.14em] text-muted transition hover:-translate-y-0.5 hover:bg-white/72"
                  href="/showcase/share?lang=zh-CN&theme=dark"
                >
                  打开分享页样张
                </Link>
              </div>
            </div>

            <aside className="planner-preview">
              <div className="grid gap-2">
              <p className="planner-kicker">作品预览 · 用户最终看到什么</p>
                <h2 className="planner-identity-title">
                  不是“攻略文章”，而是可以直接出发的结果界面。
                </h2>
                <p className="planner-note">
                  这块专门服务第一次打开你 GitHub 或看你录屏的人，让他立刻看懂这个产品到底比普通攻略生成器多了什么。
                </p>
              </div>

              <div className="planner-identity-board">
                <div className="planner-identity-grid sm:grid-cols-2">
                  <article className="planner-identity-tile" data-tone="soft">
                    <p className="planner-identity-eyebrow">样例城市</p>
                    <h3 className="planner-identity-focus">苏州 · 2 天</h3>
                    <p className="planner-identity-copy">
                      样例只负责演示完整链路，真实输入仍然是任意国内城市。
                    </p>
                  </article>
                  <article className="planner-identity-tile" data-tone="warm">
                    <p className="planner-identity-eyebrow">优先判断</p>
                    <h3 className="planner-identity-focus">预约 / 停车 / 预算边界</h3>
                    <p className="planner-identity-copy">
                      先判断能不能顺利执行，再决定要不要继续加更漂亮的点。
                    </p>
                  </article>
                </div>

                <div className="planner-demo-actions sm:grid-cols-2">
                  {deliverables.slice(0, 4).map((item, index) => (
                    <article className="planner-tile" key={item}>
                      <p className="planner-tile-code">
                        {String(index + 1).padStart(2, "0")}
                      </p>
                      <h3 className="planner-tile-title">{item}</h3>
                    </article>
                  ))}
                </div>

                <div className="planner-demo-actions sm:grid-cols-2">
                  {deliverables.slice(4).map((item, index) => (
                    <article className="planner-tile" key={item}>
                      <p className="planner-tile-code">
                        {String(index + 5).padStart(2, "0")}
                      </p>
                      <h3 className="planner-tile-title">{item}</h3>
                    </article>
                  ))}
                </div>
              </div>
            </aside>
          </div>
        </section>

        <section className="grid gap-5 xl:grid-cols-[minmax(0,1.08fr)_minmax(20rem,0.92fr)]">
          <div className="planner-sheet">
            <div className="planner-section-head">
              <p className="planner-section-code">为什么它会更实用</p>
              <h2 className="planner-section-title">
                它不是只会生成“去哪玩”，而是会提前判断“能不能顺利玩完”。
              </h2>
              <p className="planner-section-copy">
                这一层是你和同类开源项目拉开差异的关键。普通项目更像路线推荐，这个产品更像旅行执行系统。
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {valueCards.map((card, index) => (
                <article
                  key={card.title}
                  className="planner-primary-card"
                  data-tone={index === 1 ? "warm" : "soft"}
                >
                  <p className="planner-section-code">{card.code}</p>
                  <h3 className="planner-priority-title">{card.title}</h3>
                  <p className="planner-priority-helper">{card.body}</p>
                </article>
              ))}
            </div>
          </div>

          <aside className="planner-rail-card" data-tone="dark">
            <div className="grid gap-2">
              <p className="planner-kicker">演示顺序</p>
              <h2 className="planner-identity-title">
                录屏和作品展示时，建议按这个顺序讲。
              </h2>
            </div>

            <div className="grid gap-3">
              {demoSteps.map((step, index) => (
                <article className="planner-brief-row" key={step.label}>
                  <p className="planner-brief-label">
                    {String(index + 1).padStart(2, "0")} · {step.label}
                  </p>
                  <p className="planner-brief-value">{step.value}</p>
                  <p className="planner-note text-white/72">{step.note}</p>
                </article>
              ))}
            </div>
          </aside>
        </section>

        <PlanEntryHero />
      </div>
    </main>
  );
}
