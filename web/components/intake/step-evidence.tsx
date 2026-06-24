type StepEvidenceProps = {
  entryMode: "quick" | "xiaohongshu";
  xiaohongshuLink: string;
  xiaohongshuNotes: string;
  onFieldChange: (
    name: "xiaohongshuLink" | "xiaohongshuNotes",
    value: string,
  ) => void;
};

export function StepEvidence({
  entryMode,
  xiaohongshuLink,
  xiaohongshuNotes,
  onFieldChange,
}: StepEvidenceProps) {
  const isEvidenceFirst = entryMode === "xiaohongshu";

  return (
    <section className="grid gap-6 rounded-[2rem] border border-line/70 bg-card p-5 shadow-[0_18px_60px_rgba(35,82,61,0.08)] sm:p-7">
      <div className="grid gap-2">
        <p className="text-xs font-semibold uppercase tracking-[0.26em] text-accent">
          Step 3
        </p>
        <h3 className="text-2xl font-semibold">
          {isEvidenceFirst ? "把预约证据贴进来。" : "补充可验证的预约线索。"}
        </h3>
        <p className="text-sm leading-7 text-muted">
          这里只有小红书链接和摘录会进入预约风险判断，不会额外猜测没有证据的提醒。
        </p>
      </div>

      <div
        className={`grid gap-2 rounded-[1.5rem] border p-4 ${
          isEvidenceFirst
            ? "border-accent/20 bg-accent-soft/70"
            : "border-line bg-white/70"
        }`}
      >
        <p className="text-sm font-semibold text-foreground">
          {isEvidenceFirst ? "当前入口：证据优先" : "当前入口：快速起草"}
        </p>
        <p className="text-sm leading-7 text-muted">
          {isEvidenceFirst
            ? "你是从小红书入口进入，所以这一步会默认聚焦预约提醒和证据摘录。"
            : "你是从快速入口进入，所以这一步可以只补最关键的预约证据。"}
        </p>
      </div>

      <label className="grid gap-2 text-sm">
        <span className="font-medium text-foreground">Xiaohongshu Link</span>
        <input
          className="rounded-[1.2rem] border border-line bg-white px-4 py-3 outline-none transition focus:border-accent"
          placeholder="https://www.xiaohongshu.com/..."
          value={xiaohongshuLink}
          onChange={(event) =>
            onFieldChange("xiaohongshuLink", event.target.value)
          }
        />
      </label>

      <label className="grid gap-2 text-sm">
        <span className="font-medium text-foreground">Evidence Notes</span>
        <textarea
          className="min-h-40 rounded-[1.4rem] border border-line bg-white px-4 py-3 outline-none transition focus:border-accent"
          placeholder="贴上预约、价格、排队、停车等你希望保留下来的证据摘录。"
          value={xiaohongshuNotes}
          onChange={(event) =>
            onFieldChange("xiaohongshuNotes", event.target.value)
          }
        />
      </label>
    </section>
  );
}
