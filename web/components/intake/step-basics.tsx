import type { OutputLanguage } from "@/lib/schemas";

const transportOptionsByLanguage = {
  "zh-CN": [
    { value: "high_speed_rail", label: "高铁", note: "城际优先" },
    { value: "metro", label: "地铁", note: "市区穿梭" },
    { value: "drive", label: "自驾", note: "停车约束" },
    { value: "taxi", label: "打车", note: "点对点" },
  ],
  en: [
    { value: "high_speed_rail", label: "High-speed rail", note: "Intercity" },
    { value: "metro", label: "Metro", note: "Urban hops" },
    { value: "drive", label: "Drive", note: "Parking-sensitive" },
    { value: "taxi", label: "Taxi", note: "Point to point" },
  ],
} as const;

const copyByLanguage = {
  "zh-CN": {
    sections: {
      route: {
        code: "一 // 路线边界",
        title: "先定落脚点、天数和预算边界。",
        body:
          "这里填的不是理想状态，而是真实可执行边界。城市、天数和预算越准确，后面的路线越不会空转。",
      },
      transport: {
        code: "二 // 交通设置",
        title: "交通方式先定，自驾条件一起前置。",
        body:
          "只要包含自驾，停车逻辑就不该被藏到最后。它会直接改变路线排序、景点组合和酒店片区建议。",
        noteTitle: "交通方式 // 可多选",
        noteBody:
          "高铁、地铁、打车可以混搭；一旦勾上自驾，系统就会把“好不好停”视为路线条件，而不是附加说明。",
      },
      parking: {
        code: "三 // 停车约束",
        title: "自驾场景里，把停车条件写清楚。",
        body:
          "对出去玩的人来说，“好不好停”不是附属标签，而是会直接改变景区顺序和落脚片区的路线条件。",
      },
    },
    fields: {
      city: {
        code: "01 // 城市",
        label: "城市",
        note:
          "填真正落脚的国内主城市，支持任意国内城市；苏州只作为演示样例。",
        placeholder: "苏州 / 重庆 / 厦门",
      },
      days: {
        code: "02 // 天数",
        label: "天数",
        note: "优先填完整停留天数，而不是模糊的周末。",
        placeholder: "2",
      },
      budgetMin: {
        code: "03 // 预算下限",
        label: "预算下限",
        note: "给系统一个你能接受的低位，而不是理想值。",
        placeholder: "1200",
      },
      budgetMax: {
        code: "04 // 预算上限",
        label: "预算上限",
        note: "这会决定门票、住宿和转场大致能走到哪一档。",
        placeholder: "2000",
      },
      languageSync: {
        code: "05 // 语言联动",
        label: "生成语言",
        note:
          "页面右上角切到英文时，生成的行程、预算和提醒内容也会一起切到英文。",
        valuePrefix: "当前：",
        zh: "中文",
        en: "英文",
      },
      parkingSort: {
        code: "06 // 排序方式",
        label: "停车排序",
        note: "决定优先推更近，还是更省。",
        options: [
          { value: "distance", label: "距离优先" },
          { value: "price", label: "价格优先" },
        ],
      },
      walkTolerance: {
        code: "07 // 步行范围",
        label: "步行容忍",
        note: "默认 30 分钟内；超过这个范围，就不算“好停”。",
        placeholder: "30",
      },
    },
  },
  en: {
    sections: {
      route: {
        code: "I // Route frame",
        title: "Set the city, trip length, and budget boundaries first.",
        body:
          "These inputs should reflect real execution limits, not an ideal wishlist. The tighter the city, days, and budget, the sharper the route becomes.",
      },
      transport: {
        code: "II // Transport setup",
        title: "Lock transport early and surface driving constraints up front.",
        body:
          "The moment driving is involved, parking stops being a side note. It changes route order, attraction grouping, and stay-area choices.",
        noteTitle: "Transport modes // multi-select",
        noteBody:
          "Rail, metro, and taxi can mix. Once driving is selected, the planner treats parking convenience as a route rule, not an afterthought.",
      },
      parking: {
        code: "III // Parking rules",
        title: "In driving mode, write the parking constraints clearly.",
        body:
          "For real trips, parking convenience is not a decorative tag. It changes stop order, scenic area choices, and which parking lots should be recommended nearby.",
      },
    },
    fields: {
      city: {
        code: "01 // City",
        label: "City",
        note: "Enter the actual domestic city you will stay in. Suzhou is only the demo sample.",
        placeholder: "e.g. Suzhou / Chongqing / Xiamen",
      },
      days: {
        code: "02 // Days",
        label: "Days",
        note: "Prefer the real number of full days instead of a vague weekend window.",
        placeholder: "2",
      },
      budgetMin: {
        code: "03 // Budget floor",
        label: "Budget floor",
        note: "Give the system a realistic lower band you can accept.",
        placeholder: "1200",
      },
      budgetMax: {
        code: "04 // Budget ceiling",
        label: "Budget ceiling",
        note: "This shapes what tier of tickets, hotels, and transfers makes sense.",
        placeholder: "2000",
      },
      languageSync: {
        code: "05 // Language sync",
        label: "Output language",
        note:
          "When the top-right switch moves to English, the generated itinerary, budget, and reminders move to English too.",
        valuePrefix: "Current: ",
        zh: "Chinese",
        en: "English",
      },
      parkingSort: {
        code: "06 // Sort mode",
        label: "Parking sort",
        note: "Choose whether to rank by shorter distance or lower price.",
        options: [
          { value: "distance", label: "Distance first" },
          { value: "price", label: "Price first" },
        ],
      },
      walkTolerance: {
        code: "07 // Walk range",
        label: "Walk tolerance",
        note: "Default is within 30 minutes; beyond that, it no longer counts as easy parking.",
        placeholder: "30",
      },
    },
  },
} as const;

const routeDeskCopyByLanguage = {
  "zh-CN": {
    kicker: "即时边界 // 路线草案",
    title: "这些输入已经在定义路线密度。",
    note:
      "城市、天数、预算和交通不是普通表单项，它们会直接限制景点顺序、停留长度和消费档位。",
    budgetKicker: "预算带 // 真实上下限",
    budgetNote: "不用先算得很准，但要先把你愿意接受的区间圈出来。",
    labels: {
      city: "城市",
      days: "天数",
      budget: "预算带",
      transport: "交通栈",
    },
    pending: "待补充",
    daysUnit: "天",
  },
  en: {
    kicker: "Live frame // route draft",
    title: "These inputs are already setting route density.",
    note:
      "City, days, budget, and transport are not generic form fields. They directly limit stop order, stay length, and spend band.",
    budgetKicker: "Budget band // real floor and ceiling",
    budgetNote:
      "It does not need to be perfect yet, but it should define the spend window you can actually accept.",
    labels: {
      city: "City",
      days: "Days",
      budget: "Budget band",
      transport: "Transport stack",
    },
    pending: "Pending",
    daysUnit: "days",
  },
} as const;

type StepBasicsProps = {
  language: OutputLanguage;
  city: string;
  days: string;
  budgetMin: string;
  budgetMax: string;
  transportPreferences: string[];
  outputLanguage: OutputLanguage;
  parkingSort: string;
  maxWalkFromParkingMinutes: string;
  showParkingFields: boolean;
  fieldErrors?: Partial<Record<"city" | "days", string>>;
  onFieldChange: (
    name:
      | "city"
      | "days"
      | "budgetMin"
      | "budgetMax"
      | "maxWalkFromParkingMinutes",
    value: string,
  ) => void;
  onSelectChange: (name: "parkingSort", value: string) => void;
  onToggleTransport: (value: string) => void;
};

export function StepBasics({
  language,
  city,
  days,
  budgetMin,
  budgetMax,
  transportPreferences,
  outputLanguage,
  parkingSort,
  maxWalkFromParkingMinutes,
  showParkingFields,
  fieldErrors,
  onFieldChange,
  onSelectChange,
  onToggleTransport,
}: StepBasicsProps) {
  const copy = copyByLanguage[language];
  const transportOptions = transportOptionsByLanguage[language];
  const routeDesk = routeDeskCopyByLanguage[language];
  const transportSummary = transportPreferences.length
    ? transportOptions
        .filter((option) => transportPreferences.includes(option.value))
        .map((option) => option.label)
        .join(" · ")
    : routeDesk.pending;
  const routeBriefItems = [
    {
      label: routeDesk.labels.city,
      value: city.trim() || routeDesk.pending,
    },
    {
      label: routeDesk.labels.days,
      value: days.trim() ? `${days.trim()} ${routeDesk.daysUnit}` : routeDesk.pending,
    },
    {
      label: routeDesk.labels.budget,
      value: buildBudgetBandLabel({
        budgetMax,
        budgetMin,
        pendingLabel: routeDesk.pending,
      }),
    },
    {
      label: routeDesk.labels.transport,
      value: transportSummary,
    },
  ];

  return (
    <div className="grid gap-3.5">
      <section className="planner-sheet">
        <div className="planner-section-head">
          <p className="planner-section-code">{copy.sections.route.code}</p>
          <h3 className="planner-section-title">{copy.sections.route.title}</h3>
          <p className="planner-section-copy">{copy.sections.route.body}</p>
        </div>

        <div className="planner-route-setup-grid">
          <div className="planner-route-field-stack">
            <FieldCard
              code={copy.fields.city.code}
              label={copy.fields.city.label}
              note={copy.fields.city.note}
              placeholder={copy.fields.city.placeholder}
              inputId="planner-city-input"
              inputName="city"
              error={fieldErrors?.city}
              value={city}
              onChange={(value) => onFieldChange("city", value)}
            />

            <div className="planner-route-support-grid">
              <FieldCard
                code={copy.fields.days.code}
                label={copy.fields.days.label}
                note={copy.fields.days.note}
                placeholder={copy.fields.days.placeholder}
                inputId="planner-days-input"
                inputName="days"
                error={fieldErrors?.days}
                value={days}
                onChange={(value) => onFieldChange("days", value)}
              />

              <section className="planner-route-budget-board">
                <div className="planner-route-budget-head">
                  <p className="planner-kicker">{routeDesk.budgetKicker}</p>
                  <p className="planner-note">{routeDesk.budgetNote}</p>
                </div>

                <div className="planner-route-budget-grid">
                  <FieldCard
                    code={copy.fields.budgetMin.code}
                    label={copy.fields.budgetMin.label}
                    note={copy.fields.budgetMin.note}
                    placeholder={copy.fields.budgetMin.placeholder}
                    value={budgetMin}
                    onChange={(value) => onFieldChange("budgetMin", value)}
                  />
                  <FieldCard
                    code={copy.fields.budgetMax.code}
                    label={copy.fields.budgetMax.label}
                    note={copy.fields.budgetMax.note}
                    placeholder={copy.fields.budgetMax.placeholder}
                    value={budgetMax}
                    onChange={(value) => onFieldChange("budgetMax", value)}
                  />
                </div>
              </section>
            </div>
          </div>

          <aside className="planner-route-brief">
            <div className="grid gap-1.5">
              <p className="planner-kicker">{routeDesk.kicker}</p>
              <h4 className="planner-route-brief-title">{routeDesk.title}</h4>
              <p className="planner-note">{routeDesk.note}</p>
            </div>

            <div className="planner-route-brief-grid">
              {routeBriefItems.map((item) => (
                <article key={item.label} className="planner-route-brief-item">
                  <span className="planner-route-brief-label">{item.label}</span>
                  <span className="planner-route-brief-value">{item.value}</span>
                </article>
              ))}
            </div>
          </aside>
        </div>
      </section>

      <section className="planner-sheet" data-tone="tint">
        <div className="planner-section-head">
          <p className="planner-section-code">{copy.sections.transport.code}</p>
          <h3 className="planner-section-title">
            {copy.sections.transport.title}
          </h3>
          <p className="planner-section-copy">{copy.sections.transport.body}</p>
        </div>

        <div className="planner-note-box">
          <p className="planner-kicker">{copy.sections.transport.noteTitle}</p>
          <p className="planner-note">{copy.sections.transport.noteBody}</p>
        </div>

        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
          {transportOptions.map((option) => {
            const isActive = transportPreferences.includes(option.value);
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => onToggleTransport(option.value)}
                data-state={isActive ? "active" : "idle"}
                className="planner-choice grid min-h-[4.35rem] gap-1 rounded-[0.95rem] px-3 py-2.5 text-left"
              >
                <span className="text-[0.8rem] font-semibold">
                  {option.label}
                </span>
                <span className="text-[0.62rem] uppercase tracking-[0.18em] opacity-72">
                  {option.note}
                </span>
              </button>
            );
          })}
        </div>

        <div className="grid gap-3 lg:grid-cols-2">
          <StaticCard
            code={copy.fields.languageSync.code}
            label={copy.fields.languageSync.label}
            note={copy.fields.languageSync.note}
            value={`${copy.fields.languageSync.valuePrefix}${
              outputLanguage === "en"
                ? copy.fields.languageSync.en
                : copy.fields.languageSync.zh
            }`}
          />
        </div>
      </section>

      {showParkingFields ? (
        <section className="planner-sheet" data-tone="warm">
          <div className="planner-section-head">
            <p className="planner-section-code">{copy.sections.parking.code}</p>
            <h3 className="planner-section-title">
              {copy.sections.parking.title}
            </h3>
            <p className="planner-section-copy">{copy.sections.parking.body}</p>
          </div>

          <div className="grid gap-3 lg:grid-cols-2">
            <SelectCard
              code={copy.fields.parkingSort.code}
              label={copy.fields.parkingSort.label}
              note={copy.fields.parkingSort.note}
              value={parkingSort}
              onChange={(value) => onSelectChange("parkingSort", value)}
              options={copy.fields.parkingSort.options}
            />
            <FieldCard
              code={copy.fields.walkTolerance.code}
              label={copy.fields.walkTolerance.label}
              note={copy.fields.walkTolerance.note}
              placeholder={copy.fields.walkTolerance.placeholder}
              value={maxWalkFromParkingMinutes}
              onChange={(value) =>
                onFieldChange("maxWalkFromParkingMinutes", value)
              }
            />
          </div>
        </section>
      ) : null}
    </div>
  );
}

type FieldCardProps = {
  code: string;
  label: string;
  note: string;
  placeholder: string;
  inputId?: string;
  inputName?: string;
  error?: string;
  value: string;
  onChange: (value: string) => void;
};

function FieldCard({
  code,
  label,
  note,
  placeholder,
  inputId,
  inputName,
  error,
  value,
  onChange,
}: FieldCardProps) {
  return (
    <label
      className="planner-field"
      data-filled={value.trim() ? "true" : undefined}
      data-invalid={error ? "true" : undefined}
    >
      <span className="planner-field-head">
        <span className="planner-field-code">{code}</span>
        <span className="planner-field-label">{label}</span>
      </span>
      <span className="planner-field-note">{note}</span>
      <input
        className="planner-input"
        id={inputId}
        name={inputName}
        aria-invalid={error ? "true" : "false"}
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
      {error ? <span className="planner-field-alert">{error}</span> : null}
    </label>
  );
}

type SelectCardProps = {
  code: string;
  label: string;
  note: string;
  value: string;
  options: ReadonlyArray<{ value: string; label: string }>;
  onChange: (value: string) => void;
};

function SelectCard({
  code,
  label,
  note,
  value,
  options,
  onChange,
}: SelectCardProps) {
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
      <select
        className="planner-select"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

type StaticCardProps = {
  code: string;
  label: string;
  note: string;
  value: string;
};

function StaticCard({ code, label, note, value }: StaticCardProps) {
  return (
    <div className="planner-field" data-filled="true">
      <span className="planner-field-head">
        <span className="planner-field-code">{code}</span>
        <span className="planner-field-label">{label}</span>
      </span>
      <span className="planner-field-note">{note}</span>
      <span className="planner-static-value">{value}</span>
    </div>
  );
}

function buildBudgetBandLabel({
  budgetMax,
  budgetMin,
  pendingLabel,
}: {
  budgetMax: string;
  budgetMin: string;
  pendingLabel: string;
}) {
  const low = budgetMin.trim();
  const high = budgetMax.trim();

  if (!low && !high) {
    return pendingLabel;
  }

  return `${low || "?"} - ${high || "?"}`;
}
