const travelModes = [
  {
    value: "photo",
    label: "Photo",
    body: "更强调出片点位、夜景和转场节奏。",
  },
  {
    value: "citywalk",
    label: "Citywalk",
    body: "适合街巷慢逛和步行串联。",
  },
  {
    value: "nature",
    label: "Nature",
    body: "适合湖边、山水和户外留白。",
  },
  {
    value: "garden_culture",
    label: "Garden",
    body: "更偏园林、人文和博物馆主线。",
  },
];

const preferenceTagOptions = [
  "food",
  "photo_ready",
  "night_view",
  "coffee_break",
  "local_breakfast",
];

const interestTagOptions = [
  "museum",
  "citywalk",
  "garden",
  "food",
  "landmark",
];

type StepStyleProps = {
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
  return (
    <section className="grid gap-6 rounded-[2rem] border border-line/70 bg-card p-5 shadow-[0_18px_60px_rgba(35,82,61,0.08)] sm:p-7">
      <div className="grid gap-2">
        <p className="text-xs font-semibold uppercase tracking-[0.26em] text-accent">
          Step 2
        </p>
        <h3 className="text-2xl font-semibold">把路线风格说清楚。</h3>
        <p className="text-sm leading-7 text-muted">
          旅行风格会映射到执行摘要，偏好标签会直接进入新的 `preference_tags` 契约。
        </p>
      </div>

      <div className="grid gap-3">
        <p className="text-sm font-semibold text-foreground">Travel Mode</p>
        <div className="grid gap-3 sm:grid-cols-2">
          {travelModes.map((mode) => {
            const isActive = travelMode === mode.value;
            return (
              <button
                key={mode.value}
                type="button"
                onClick={() => onTravelModeChange(mode.value)}
                className={`grid gap-2 rounded-[1.5rem] border p-4 text-left transition ${
                  isActive
                    ? "border-accent bg-accent text-white"
                    : "border-line bg-white/80 text-foreground"
                }`}
              >
                <span className="text-lg font-semibold">{mode.label}</span>
                <span className="text-sm leading-7 opacity-85">{mode.body}</span>
              </button>
            );
          })}
        </div>
      </div>

      <TagGroup
        title="Preference Tags"
        body="这些标签更偏结果页的执行体验，比如出片、夜景和补给偏好。"
        values={preferenceTags}
        options={preferenceTagOptions}
        onToggle={onTogglePreferenceTag}
      />

      <TagGroup
        title="Interest Tags"
        body="保留现有后端能力所需的兴趣分类，避免回退现有 planner。"
        values={interestTags}
        options={interestTagOptions}
        onToggle={onToggleInterestTag}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-2 text-sm">
          <span className="font-medium text-foreground">Stay Preference</span>
          <input
            className="rounded-[1.2rem] border border-line bg-white px-4 py-3 outline-none transition focus:border-accent"
            placeholder="boutique_hotel"
            value={stayPreference}
            onChange={(event) =>
              onFieldChange("stayPreference", event.target.value)
            }
          />
        </label>

        <label className="grid gap-2 text-sm">
          <span className="font-medium text-foreground">Special Requirements</span>
          <textarea
            className="min-h-28 rounded-[1.2rem] border border-line bg-white px-4 py-3 outline-none transition focus:border-accent"
            placeholder="Need student discount, low walking intensity..."
            value={specialRequirements}
            onChange={(event) =>
              onFieldChange("specialRequirements", event.target.value)
            }
          />
        </label>
      </div>
    </section>
  );
}

type TagGroupProps = {
  title: string;
  body: string;
  values: string[];
  options: string[];
  onToggle: (value: string) => void;
};

function TagGroup({
  title,
  body,
  values,
  options,
  onToggle,
}: TagGroupProps) {
  return (
    <div className="grid gap-3">
      <div className="grid gap-1">
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <p className="text-sm leading-7 text-muted">{body}</p>
      </div>
      <div className="flex flex-wrap gap-3">
        {options.map((option) => {
          const isActive = values.includes(option);
          return (
            <button
              key={option}
              type="button"
              onClick={() => onToggle(option)}
              className={`rounded-full border px-4 py-3 text-sm font-semibold transition ${
                isActive
                  ? "border-accent bg-accent text-white"
                  : "border-line bg-white/80 text-foreground"
              }`}
            >
              {option}
            </button>
          );
        })}
      </div>
    </div>
  );
}
