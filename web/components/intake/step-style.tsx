import type { OutputLanguage } from "@/lib/schemas";

const copyByLanguage = {
  "zh-CN": {
    travelModes: [
      {
        value: "photo",
        code: "08",
        label: "出片",
        title: "出片打卡",
        body: "夜景、妆造、镜头感会被排得更靠前。",
        facets: {
          scene: "夜景妆造",
          rhythm: "黄金时段优先",
          stay: "住在出片片区附近",
        },
        signals: ["镜头位", "夜景段", "妆造友好"],
      },
      {
        value: "citywalk",
        code: "09",
        label: "漫游",
        title: "街区慢逛",
        body: "优先步行串联和低压力节奏。",
        facets: {
          scene: "街区巷子",
          rhythm: "低压慢逛",
          stay: "贴近主步行线",
        },
        signals: ["慢节奏", "小店停靠", "步行连线"],
      },
      {
        value: "nature",
        code: "10",
        label: "自然",
        title: "自然留白",
        body: "更适合湖边、山水和舒缓停留。",
        facets: {
          scene: "山水湖边",
          rhythm: "留白停顿",
          stay: "安静或景区片区",
        },
        signals: ["留白段", "景观位", "低噪声"],
      },
      {
        value: "garden_culture",
        code: "11",
        label: "园林",
        title: "园林人文",
        body: "园林、馆舍和街巷密度会更高。",
        facets: {
          scene: "园林馆舍",
          rhythm: "密集但克制",
          stay: "老城文化片区",
        },
        signals: ["馆舍位", "园林段", "老城肌理"],
      },
    ],
    preferenceTags: [
      { value: "food", label: "吃饭", note: "吃饭优先" },
      { value: "photo_ready", label: "出片", note: "出片优先" },
      { value: "night_view", label: "夜景", note: "夜景优先" },
      { value: "coffee_break", label: "咖啡", note: "中途停靠" },
      { value: "local_breakfast", label: "早饭", note: "本地早餐" },
    ],
    interestTags: [
      { value: "museum", label: "博物馆", note: "馆舍" },
      { value: "citywalk", label: "街区", note: "城市漫游" },
      { value: "garden", label: "园林", note: "园林景观" },
      { value: "food", label: "美食", note: "吃" },
      { value: "landmark", label: "地标", note: "城市地标" },
    ],
    sections: {
      mode: {
        code: "四 // 路线气质",
        title: "先选这次旅行最核心的气质。",
        body:
          "模式不是装饰，它会改变路线摘要、景点排序和停留方式。这里要的是主语气，而不是全选。",
        selected: "已选",
        boardKicker: "风格摘要 // 当前路线语气",
        boardTitle: "这一种气质会主导整个行程。",
        boardNote:
          "先把旅行的主语气定住，后面的标签和住宿才是在这个框架里继续收紧。",
        pending: "待补充",
        labels: {
          scene: "主场景",
          rhythm: "节奏",
          stay: "落脚建议",
        },
      },
      preference: {
        code: "12",
        title: "偏好标签",
        body:
          "这些标签更像编辑批注，用来告诉系统你在乎的画面、停顿和补给方式。",
      },
      interest: {
        code: "13",
        title: "兴趣标签",
        body:
          "这里保留内容类标签，避免规划结果回退成泛化路线。",
      },
      stay: {
        code: "五 // 住宿与约束",
        title: "最后补住宿和特殊约束。",
        body:
          "这部分不是锦上添花。学生票、少走路、避开人潮，都会直接影响城市内部动线。",
      },
    },
    fields: {
      stayPreference: {
        code: "14 // 住宿偏好",
        label: "住宿偏好",
        note: "可以填精品酒店、青旅、园林民宿这类偏好。",
        placeholder: "精品酒店",
      },
      specialRequirements: {
        code: "15 // 特殊要求",
        label: "特殊要求",
        note: "例如学生票、少走路、避开网红拥挤时段。",
        placeholder: "学生票优先、少走一点、想保留夜景时段……",
      },
    },
  },
  en: {
    travelModes: [
      {
        value: "photo",
        code: "08",
        label: "Photo",
        title: "Photo-led route",
        body: "Night views, styling, and strong camera moments move up the plan.",
        facets: {
          scene: "Night looks",
          rhythm: "Golden-hour first",
          stay: "Stay near photo zones",
        },
        signals: ["Camera spots", "Night slot", "Styling-ready"],
      },
      {
        value: "citywalk",
        code: "09",
        label: "Citywalk",
        title: "Slow urban drift",
        body: "Prefer walkable sequencing and a lower-pressure pace.",
        facets: {
          scene: "District lanes",
          rhythm: "Low-pressure drift",
          stay: "Near the walking spine",
        },
        signals: ["Slow pace", "Small stops", "Walkable chain"],
      },
      {
        value: "nature",
        code: "10",
        label: "Nature",
        title: "Nature reset",
        body: "Better for lakeside, mountain, and slower scenic pauses.",
        facets: {
          scene: "Lakes and hills",
          rhythm: "Pause and breathe",
          stay: "Quiet or scenic zones",
        },
        signals: ["Pause slots", "Viewpoints", "Low noise"],
      },
      {
        value: "garden_culture",
        code: "11",
        label: "Gardens",
        title: "Gardens and culture",
        body: "Gardens, museums, and lane density rise in priority.",
        facets: {
          scene: "Gardens and halls",
          rhythm: "Dense but restrained",
          stay: "Old-town culture area",
        },
        signals: ["Museum slots", "Garden loops", "Old-town fabric"],
      },
    ],
    preferenceTags: [
      { value: "food", label: "Food", note: "Meals first" },
      { value: "photo_ready", label: "Photo", note: "Camera-ready" },
      { value: "night_view", label: "Night", note: "Night views" },
      { value: "coffee_break", label: "Coffee", note: "Pause stop" },
      { value: "local_breakfast", label: "Breakfast", note: "Local breakfast" },
    ],
    interestTags: [
      { value: "museum", label: "Museum", note: "Indoor culture" },
      { value: "citywalk", label: "District", note: "Urban walk" },
      { value: "garden", label: "Garden", note: "Garden scenery" },
      { value: "food", label: "Food", note: "Eat" },
      { value: "landmark", label: "Landmark", note: "City icon" },
    ],
    sections: {
      mode: {
        code: "IV // Route tone",
        title: "Pick the dominant tone of this trip first.",
        body:
          "The mode is not decoration. It changes route summaries, attraction ranking, and how long each stop should breathe.",
        selected: "Selected",
        boardKicker: "Tone brief // active route voice",
        boardTitle: "One tone should lead the whole trip.",
        boardNote:
          "Lock the lead tone first. Preference tags and stay style should tighten the same frame instead of fighting it.",
        pending: "Pending",
        labels: {
          scene: "Scene",
          rhythm: "Rhythm",
          stay: "Stay hint",
        },
      },
      preference: {
        code: "12",
        title: "Preference tags",
        body:
          "These work like editorial notes, telling the planner what kind of visuals, pauses, and recharge moments matter to you.",
      },
      interest: {
        code: "13",
        title: "Interest tags",
        body:
          "Keep content-oriented tags here so the final plan does not collapse back into a generic route.",
      },
      stay: {
        code: "V // Stay and constraints",
        title: "Add stay style and special constraints last.",
        body:
          "This is not decorative detail. Student tickets, lower walking load, or avoiding crowded internet-famous slots all change the internal route.",
      },
    },
    fields: {
      stayPreference: {
        code: "14 // Stay style",
        label: "Stay style",
        note: "Examples: boutique hotel, hostel, or a garden-style guesthouse.",
        placeholder: "Boutique hotel",
      },
      specialRequirements: {
        code: "15 // Special asks",
        label: "Special asks",
        note: "Examples: student ticket priority, lower walking intensity, avoid peak influencer crowds.",
        placeholder: "Student fares first, shorter walks, keep a night-view slot…",
      },
    },
  },
} as const;

type StepStyleProps = {
  language: OutputLanguage;
  travelMode: string;
  preferenceTags: string[];
  interestTags: string[];
  stayPreference: string;
  specialRequirements: string;
  onFieldChange: (
    name: "stayPreference" | "specialRequirements",
    value: string,
  ) => void;
  onTravelModeChange: (value: string) => void;
  onTogglePreferenceTag: (value: string) => void;
  onToggleInterestTag: (value: string) => void;
};

export function StepStyle({
  language,
  travelMode,
  preferenceTags,
  interestTags,
  stayPreference,
  specialRequirements,
  onFieldChange,
  onTravelModeChange,
  onTogglePreferenceTag,
  onToggleInterestTag,
}: StepStyleProps) {
  const copy = copyByLanguage[language];
  const activeMode =
    copy.travelModes.find((mode) => mode.value === travelMode) ?? null;
  const modeBoardValues = [
    {
      label: copy.sections.mode.labels.scene,
      value: activeMode?.facets.scene ?? copy.sections.mode.pending,
    },
    {
      label: copy.sections.mode.labels.rhythm,
      value: activeMode?.facets.rhythm ?? copy.sections.mode.pending,
    },
    {
      label: copy.sections.mode.labels.stay,
      value: activeMode?.facets.stay ?? copy.sections.mode.pending,
    },
  ];

  return (
    <div className="grid gap-3.5">
      <section className="planner-sheet">
        <div className="planner-section-head">
          <p className="planner-section-code">{copy.sections.mode.code}</p>
          <h3 className="planner-section-title">{copy.sections.mode.title}</h3>
          <p className="planner-section-copy">{copy.sections.mode.body}</p>
        </div>

        <div className="planner-style-mode-grid">
          <div className="planner-style-mode-list">
            {copy.travelModes.map((mode) => {
              const isActive = travelMode === mode.value;
              return (
                <button
                  key={mode.value}
                  type="button"
                  onClick={() => onTravelModeChange(mode.value)}
                  data-state={isActive ? "active" : "idle"}
                  data-mode={mode.value}
                  className="planner-choice planner-mode-card grid gap-2 text-left"
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="planner-kicker text-inherit">
                      {mode.code} {"//"} {mode.label}
                    </p>
                    {isActive ? (
                      <span className="planner-mode-selected">
                        {copy.sections.mode.selected}
                      </span>
                    ) : null}
                  </div>

                  <div className="grid gap-1.5">
                    <span className="planner-mode-title">{mode.title}</span>
                    <span className="planner-mode-copy">{mode.body}</span>
                  </div>

                  <div className="planner-mode-facet-grid">
                    <span className="planner-mode-facet">{mode.facets.scene}</span>
                    <span className="planner-mode-facet">{mode.facets.rhythm}</span>
                    <span className="planner-mode-facet">{mode.facets.stay}</span>
                  </div>
                </button>
              );
            })}
          </div>

          <aside className="planner-style-board">
            <div className="grid gap-1.5">
              <p className="planner-kicker">{copy.sections.mode.boardKicker}</p>
              <h4 className="planner-style-board-title">
                {activeMode?.title ?? copy.sections.mode.boardTitle}
              </h4>
              <p className="planner-note">
                {activeMode?.body ?? copy.sections.mode.boardNote}
              </p>
            </div>

            <div className="planner-style-board-grid">
              {modeBoardValues.map((item) => (
                <article key={item.label} className="planner-style-board-item">
                  <span className="planner-style-board-label">{item.label}</span>
                  <span className="planner-style-board-value">{item.value}</span>
                </article>
              ))}
            </div>

            <div className="planner-style-board-signal-row">
              {(activeMode?.signals ?? [
                copy.sections.mode.pending,
                copy.sections.mode.pending,
                copy.sections.mode.pending,
              ]).map((signal) => (
                <span key={signal} className="planner-style-board-signal">
                  {signal}
                </span>
              ))}
            </div>
          </aside>
        </div>
      </section>

      <div className="planner-style-tag-grid">
        <TagGroup
          code={copy.sections.preference.code}
          title={copy.sections.preference.title}
          body={copy.sections.preference.body}
          values={preferenceTags}
          options={copy.preferenceTags}
          onToggle={onTogglePreferenceTag}
          tone="soft"
        />

        <TagGroup
          code={copy.sections.interest.code}
          title={copy.sections.interest.title}
          body={copy.sections.interest.body}
          values={interestTags}
          options={copy.interestTags}
          onToggle={onToggleInterestTag}
          tone="warm"
        />
      </div>

      <section className="planner-sheet" data-tone="tint">
        <div className="planner-section-head">
          <p className="planner-section-code">{copy.sections.stay.code}</p>
          <h3 className="planner-section-title">{copy.sections.stay.title}</h3>
          <p className="planner-section-copy">{copy.sections.stay.body}</p>
        </div>

        <div className="grid gap-3 lg:grid-cols-2">
          <FieldCard
            code={copy.fields.stayPreference.code}
            label={copy.fields.stayPreference.label}
            note={copy.fields.stayPreference.note}
            placeholder={copy.fields.stayPreference.placeholder}
            value={stayPreference}
            onChange={(value) => onFieldChange("stayPreference", value)}
          />
          <TextAreaCard
            code={copy.fields.specialRequirements.code}
            label={copy.fields.specialRequirements.label}
            note={copy.fields.specialRequirements.note}
            placeholder={copy.fields.specialRequirements.placeholder}
            value={specialRequirements}
            onChange={(value) => onFieldChange("specialRequirements", value)}
          />
        </div>
      </section>
    </div>
  );
}

type TagGroupProps = {
  code: string;
  title: string;
  body: string;
  values: string[];
  options: ReadonlyArray<{ value: string; label: string; note: string }>;
  onToggle: (value: string) => void;
  tone?: "soft" | "warm";
};

function TagGroup({
  code,
  title,
  body,
  values,
  options,
  onToggle,
  tone = "soft",
}: TagGroupProps) {
  return (
    <section className="planner-sheet" data-tone={tone}>
      <div className="planner-section-head">
        <p className="planner-section-code">
          {code} {"//"} {title}
        </p>
        <h3 className="planner-section-title">{title}</h3>
        <p className="planner-section-copy">{body}</p>
      </div>

      <div className="flex flex-wrap gap-2.5">
        {options.map((option) => {
          const isActive = values.includes(option.value);
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onToggle(option.value)}
              data-state={isActive ? "active" : "idle"}
              className="planner-choice planner-tag-pill inline-flex flex-wrap items-center gap-1.5 rounded-full px-3 py-1.5 text-[0.74rem] font-semibold"
            >
              <span>{option.label}</span>
              <span className="text-[0.62rem] uppercase tracking-[0.16em] opacity-68">
                {option.note}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

type FieldCardProps = {
  code: string;
  label: string;
  note: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
};

function FieldCard({
  code,
  label,
  note,
  placeholder,
  value,
  onChange,
}: FieldCardProps) {
  return (
    <label
      className="planner-field"
      data-filled={value.trim() ? "true" : undefined}
    >
      <span className="planner-field-head">
        <span className="planner-field-code">{code}</span>
        <span className="planner-field-label">{label}</span>
      </span>
      <span className="planner-field-note">{note}</span>
      <input
        className="planner-input"
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

type TextAreaCardProps = FieldCardProps;

function TextAreaCard({
  code,
  label,
  note,
  placeholder,
  value,
  onChange,
}: TextAreaCardProps) {
  return (
    <label
      className="planner-field"
      data-filled={value.trim() ? "true" : undefined}
    >
      <span className="planner-field-head">
        <span className="planner-field-code">{code}</span>
        <span className="planner-field-label">{label}</span>
      </span>
      <span className="planner-field-note">{note}</span>
      <textarea
        className="planner-textarea"
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}
