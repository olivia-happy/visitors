import type { OutputLanguage } from "@/lib/schemas";

const transportOptions = [
  { value: "high_speed_rail", label: "高铁" },
  { value: "metro", label: "地铁" },
  { value: "drive", label: "自驾" },
  { value: "taxi", label: "打车" },
];

type StepBasicsProps = {
  city: string;
  days: string;
  budgetMin: string;
  budgetMax: string;
  transportPreferences: string[];
  outputLanguage: OutputLanguage;
  parkingSort: string;
  maxWalkFromParkingMinutes: string;
  showParkingFields: boolean;
  onFieldChange: (
    name:
      | "city"
      | "days"
      | "budgetMin"
      | "budgetMax"
      | "maxWalkFromParkingMinutes",
    value: string,
  ) => void;
  onSelectChange: (
    name: "parkingSort" | "outputLanguage",
    value: string,
  ) => void;
  onToggleTransport: (value: string) => void;
};

export function StepBasics({
  city,
  days,
  budgetMin,
  budgetMax,
  transportPreferences,
  outputLanguage,
  parkingSort,
  maxWalkFromParkingMinutes,
  showParkingFields,
  onFieldChange,
  onSelectChange,
  onToggleTransport,
}: StepBasicsProps) {
  return (
    <section className="grid gap-6 rounded-[2rem] border border-line/70 bg-card p-5 shadow-[0_18px_60px_rgba(35,82,61,0.08)] sm:p-7">
      <div className="grid gap-2">
        <p className="text-xs font-semibold uppercase tracking-[0.26em] text-accent">
          Step 1
        </p>
        <h3 className="text-2xl font-semibold">城市、预算和交通一起定。</h3>
        <p className="text-sm leading-7 text-muted">
          如果你选择自驾，停车排序和步行容忍度会直接进入后端请求，不靠结果页猜。
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <FieldCard
          label="Destination City"
          placeholder="Suzhou"
          value={city}
          onChange={(value) => onFieldChange("city", value)}
        />
        <FieldCard
          label="Travel Days"
          placeholder="2"
          value={days}
          onChange={(value) => onFieldChange("days", value)}
        />
        <FieldCard
          label="Budget Min"
          placeholder="1200"
          value={budgetMin}
          onChange={(value) => onFieldChange("budgetMin", value)}
        />
        <FieldCard
          label="Budget Max"
          placeholder="2000"
          value={budgetMax}
          onChange={(value) => onFieldChange("budgetMax", value)}
        />
      </div>

      <div className="grid gap-3">
        <div className="grid gap-1">
          <p className="text-sm font-semibold text-foreground">
            Transport Preferences
          </p>
          <p className="text-sm leading-7 text-muted">
            可以多选，但自驾一旦出现，就会激活停车规则。
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          {transportOptions.map((option) => {
            const isActive = transportPreferences.includes(option.value);
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => onToggleTransport(option.value)}
                className={`rounded-full border px-4 py-3 text-sm font-semibold transition ${
                  isActive
                    ? "border-accent bg-accent text-white"
                    : "border-line bg-white/80 text-foreground"
                }`}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </div>

      {showParkingFields ? (
        <div className="grid gap-4 rounded-[1.5rem] border border-accent/20 bg-accent-soft/70 p-4">
          <div className="grid gap-1">
            <p className="text-sm font-semibold text-foreground">Parking Rules</p>
            <p className="text-sm leading-7 text-muted">
              这一步决定结果页里停车推荐按距离还是按价格优先。
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-2 text-sm">
              <span className="font-medium text-foreground">Parking Sort</span>
              <select
                className="rounded-[1.2rem] border border-line bg-white px-4 py-3 outline-none transition focus:border-accent"
                value={parkingSort}
                onChange={(event) =>
                  onSelectChange("parkingSort", event.target.value)
                }
              >
                <option value="distance">按步行距离优先</option>
                <option value="price">按停车价格优先</option>
              </select>
            </label>

            <FieldCard
              label="Max Walk Minutes"
              placeholder="30"
              value={maxWalkFromParkingMinutes}
              onChange={(value) =>
                onFieldChange("maxWalkFromParkingMinutes", value)
              }
            />
          </div>
        </div>
      ) : null}

      <label className="grid gap-2 text-sm">
        <span className="font-medium text-foreground">Output Language</span>
        <select
          className="rounded-[1.2rem] border border-line bg-white px-4 py-3 outline-none transition focus:border-accent"
          value={outputLanguage}
          onChange={(event) =>
            onSelectChange("outputLanguage", event.target.value)
          }
        >
          <option value="zh-CN">中文</option>
          <option value="en">English</option>
        </select>
      </label>
    </section>
  );
}

type FieldCardProps = {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
};

function FieldCard({ label, placeholder, value, onChange }: FieldCardProps) {
  return (
    <label className="grid gap-2 text-sm">
      <span className="font-medium text-foreground">{label}</span>
      <input
        className="rounded-[1.2rem] border border-line bg-white px-4 py-3 outline-none transition focus:border-accent"
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}
