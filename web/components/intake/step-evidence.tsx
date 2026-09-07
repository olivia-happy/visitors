import type { EvidencePreview, OutputLanguage } from "@/lib/schemas";

type EvidencePreviewStatus = "idle" | "loading" | "ready" | "stale" | "error";

type StepEvidenceProps = {
  language: OutputLanguage;
  entryMode: "quick" | "xiaohongshu";
  xiaohongshuLink: string;
  xiaohongshuNotes: string;
  previewStatus: EvidencePreviewStatus;
  preview: EvidencePreview | null;
  previewError: string;
  onPreviewEvidence: () => void;
  onFieldChange: (
    name: "xiaohongshuLink" | "xiaohongshuNotes",
    value: string,
  ) => void;
};

const copyByLanguage = {
  "zh-CN": {
    sections: {
      evidence: {
        code: "六 // 预约证据",
        title: {
          quick: "把最后的可验证线索补进来。",
          xiaohongshu: "把预约证据钉进工作台。",
        },
        body:
          "这里只收会影响执行判断的内容。链接、摘录、价格、预约渠道，最终都应该进入风险提醒卡，而不是被留在备注角落。",
      },
      source: {
        code: "七 // 原始素材",
        title: "链接和摘录分开放。",
        body:
          "先交链接，再补摘录。这样后面做结构化预约提醒时，证据来源和人工补充不会混在一起。",
      },
    },
    notes: {
      entryLabel: "入口",
      quickEntry: "快速建方案",
      evidenceEntry: "证据优先",
      quickBody:
        "你是从快速入口进来的，所以这里只补最后会影响预约判断的关键信息。",
      evidenceBody:
        "你是从小红书入口进来的，所以这里默认把预约提醒、预约渠道和证据摘录放得更靠前。",
      reserveLabel: "保留信息",
      reserveTitle: "只留证据",
      reserveBody:
        "例如：需要提前很久预约、免费但限量、公众号预约、节假日排队长、附近更好停的停车场、证件限制或价格线索。",
    },
    fields: {
      link: {
        code: "16 // 小红书链接",
        label: "链接",
        note:
          "只贴链接时，系统会先尝试解析标题和摘要；抓不到关键句，再回退到你手动补摘录。",
        placeholder: "粘贴小红书分享链接",
      },
      notes: {
        code: "17 // 证据摘录",
        label: "证据摘录",
        note:
          "这里更像资料摘录区，不是随手备注。尽量留下渠道、价格、预约难度和时间线索。",
        placeholder:
          "可直接粘贴分享文案，或补一句：虽然免费但要提前很久预约 / 公众号预约 / 节假日排队长 / 附近更好停的停车场……",
      },
    },
    preview: {
      code: "18 // 预约预览",
      title: "先看系统识别出了什么。",
      body:
        "这一步是作品最该被看见的地方：系统不会等到最后才告诉你哪里要预约，而是先把证据、渠道和价格拆出来。",
      action: "解析预约证据",
      loading: "解析中…",
      emptyTitle: "还没有结构化预约点",
      emptyBody:
        "如果内容只是在推荐拍照、路线或餐厅，系统会保持保守，不会强行生成预约提醒。",
      stale: "证据已修改，重新解析后再生成更稳。",
      error: "解析失败，请检查链接或保留手动摘录。",
      cards: {
        channel: "渠道",
        price: "价格",
        confidence: "置信度",
        evidence: "证据",
        source: "来源",
        unknown: "待确认",
      },
    },
  },
  en: {
    sections: {
      evidence: {
        code: "VI // Reservation proof",
        title: {
          quick: "Patch in the last verifiable clues.",
          xiaohongshu: "Pin the reservation proof into the desk.",
        },
        body:
          "Only feed proof that changes execution. Links, excerpts, prices, and booking channels should land in the alert cards instead of hiding in loose notes.",
      },
      source: {
        code: "VII // Raw source",
        title: "Keep links and excerpts separate.",
        body:
          "Submit the link first, then add the excerpt. That keeps structured reservation signals separate from your manual notes.",
      },
    },
    notes: {
      entryLabel: "Entry",
      quickEntry: "Quick route start",
      evidenceEntry: "Evidence-first start",
      quickBody:
        "You entered through the quick route flow, so this step only needs the last clues that might change reservation judgment.",
      evidenceBody:
        "You entered through the Xiaohongshu flow, so reservation alerts, booking channels, and evidence excerpts move to the front.",
      reserveLabel: "Keep only",
      reserveTitle: "Evidence",
      reserveBody:
        "Examples: needs booking far in advance, free but limited, official account booking, long holiday queues, easier nearby parking lots, ID limits, or price clues.",
    },
    fields: {
      link: {
        code: "16 // Xiaohongshu link",
        label: "Link",
        note:
          "If you only paste the link, the system first tries to parse title and summary. When that is not enough, you can add the excerpt manually.",
        placeholder: "Paste a Xiaohongshu share link",
      },
      notes: {
        code: "17 // Evidence excerpt",
        label: "Evidence excerpt",
        note:
          "Treat this like a research excerpt area, not a casual note. Keep the booking channel, price, difficulty, and timing clues.",
        placeholder:
          "Paste the share text, or add a line like: free but books out early / official account booking / long holiday queue / better nearby parking lot…",
      },
    },
    preview: {
      code: "18 // Reservation preview",
      title: "Inspect what the system found first.",
      body:
        "This is the core product difference: booking-sensitive evidence is exposed before final generation, with channel, price, and excerpt attached.",
      action: "Parse evidence",
      loading: "Parsing…",
      emptyTitle: "No structured reservation stop yet",
      emptyBody:
        "When the note only recommends photos, routes, or restaurants, the system stays conservative instead of inventing a booking alert.",
      stale: "Evidence changed. Parse again before generating a safer plan.",
      error: "Parsing failed. Check the link or keep the manual excerpt.",
      cards: {
        channel: "Channel",
        price: "Price",
        confidence: "Confidence",
        evidence: "Evidence",
        source: "Source",
        unknown: "Unknown",
      },
    },
  },
} as const;

export function StepEvidence({
  language,
  entryMode,
  xiaohongshuLink,
  xiaohongshuNotes,
  previewStatus,
  preview,
  previewError,
  onPreviewEvidence,
  onFieldChange,
}: StepEvidenceProps) {
  const copy = copyByLanguage[language];
  const isEvidenceFirst = entryMode === "xiaohongshu";
  const hasEvidenceInput = Boolean(
    xiaohongshuLink.trim() || xiaohongshuNotes.trim(),
  );
  const previewHints = preview?.reservation_hints ?? [];
  const showEmptyPreview =
    previewStatus === "ready" && previewHints.length === 0;

  return (
    <div className="grid gap-3.5">
      <section
        className="planner-sheet"
        data-tone={isEvidenceFirst ? "warm" : "tint"}
      >
        <div className="planner-section-head">
          <p className="planner-section-code">{copy.sections.evidence.code}</p>
          <h3 className="planner-section-title">
            {copy.sections.evidence.title[entryMode]}
          </h3>
          <p className="planner-section-copy">{copy.sections.evidence.body}</p>
        </div>

        <div className="grid gap-3 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="planner-note-box">
            <p className="planner-kicker">
              {copy.notes.entryLabel} {"//"}{" "}
              {isEvidenceFirst
                ? copy.notes.evidenceEntry
                : copy.notes.quickEntry}
            </p>
            <p className="planner-note">
              {isEvidenceFirst ? copy.notes.evidenceBody : copy.notes.quickBody}
            </p>
          </div>

          <div className="planner-note-box">
            <p className="planner-kicker">
              {copy.notes.reserveLabel} {"//"} {copy.notes.reserveTitle}
            </p>
            <p className="planner-note">{copy.notes.reserveBody}</p>
          </div>
        </div>
      </section>

      <section className="planner-sheet">
        <div className="planner-section-head">
          <p className="planner-section-code">{copy.sections.source.code}</p>
          <h3 className="planner-section-title">{copy.sections.source.title}</h3>
          <p className="planner-section-copy">{copy.sections.source.body}</p>
        </div>

        <div className="grid gap-3">
          <label
            className="planner-field"
            data-filled={xiaohongshuLink.trim() ? "true" : undefined}
          >
            <span className="planner-field-head">
              <span className="planner-field-code">{copy.fields.link.code}</span>
              <span className="planner-field-label">
                {copy.fields.link.label}
              </span>
            </span>
            <span className="planner-field-note">{copy.fields.link.note}</span>
            <input
              className="planner-input"
              placeholder={copy.fields.link.placeholder}
              value={xiaohongshuLink}
              onChange={(event) =>
                onFieldChange("xiaohongshuLink", event.target.value)
              }
            />
          </label>

          <label
            className="planner-field"
            data-filled={xiaohongshuNotes.trim() ? "true" : undefined}
          >
            <span className="planner-field-head">
              <span className="planner-field-code">{copy.fields.notes.code}</span>
              <span className="planner-field-label">
                {copy.fields.notes.label}
              </span>
            </span>
            <span className="planner-field-note">{copy.fields.notes.note}</span>
            <textarea
              className="planner-textarea min-h-40"
              placeholder={copy.fields.notes.placeholder}
              value={xiaohongshuNotes}
              onChange={(event) =>
                onFieldChange("xiaohongshuNotes", event.target.value)
              }
            />
          </label>
        </div>
      </section>

      <section className="planner-evidence-preview" data-state={previewStatus}>
        <div className="planner-evidence-preview-head">
          <div className="grid gap-1">
            <p className="planner-section-code">{copy.preview.code}</p>
            <h3 className="planner-section-title">{copy.preview.title}</h3>
            <p className="planner-section-copy">{copy.preview.body}</p>
          </div>

          <button
            type="button"
            className="planner-evidence-preview-button"
            disabled={!hasEvidenceInput || previewStatus === "loading"}
            onClick={onPreviewEvidence}
          >
            {previewStatus === "loading" ? copy.preview.loading : copy.preview.action}
          </button>
        </div>

        {previewStatus === "stale" ? (
          <p className="planner-evidence-preview-alert">{copy.preview.stale}</p>
        ) : null}

        {previewStatus === "error" ? (
          <p className="planner-evidence-preview-alert" data-tone="danger">
            {previewError || copy.preview.error}
          </p>
        ) : null}

        {preview?.message && previewStatus !== "error" ? (
          <p className="planner-evidence-preview-message">{preview.message}</p>
        ) : null}

        {showEmptyPreview ? (
          <div className="planner-evidence-empty">
            <span>{copy.preview.emptyTitle}</span>
            <p>{copy.preview.emptyBody}</p>
          </div>
        ) : null}

        {previewHints.length ? (
          <div className="planner-evidence-card-grid">
            {previewHints.map((hint) => (
              <article
                key={`${hint.poi_name}-${hint.evidence_excerpt}`}
                className="planner-evidence-card"
              >
                <div className="planner-evidence-card-top">
                  <h4>{hint.poi_name}</h4>
                  <span>
                    {copy.preview.cards.confidence}{" "}
                    {Math.round(hint.confidence * 100)}%
                  </span>
                </div>

                <div className="planner-evidence-meta-grid">
                  <span>
                    {copy.preview.cards.channel}:{" "}
                    {hint.reservation_channel ?? copy.preview.cards.unknown}
                  </span>
                  <span>
                    {copy.preview.cards.price}:{" "}
                    {hint.price_note ?? copy.preview.cards.unknown}
                  </span>
                </div>

                <p className="planner-evidence-excerpt">
                  {copy.preview.cards.evidence}: {hint.evidence_excerpt}
                </p>

                <p className="planner-evidence-source">
                  {copy.preview.cards.source}: {hint.source_url}
                </p>
              </article>
            ))}
          </div>
        ) : null}
      </section>
    </div>
  );
}
