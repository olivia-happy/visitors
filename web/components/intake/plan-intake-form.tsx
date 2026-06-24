"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";

import { createPlan } from "@/lib/api";
import type { OutputLanguage, PlanInput } from "@/lib/schemas";

const defaultValues = {
  city: "Suzhou",
  days: "2",
  budgetMin: "1200",
  budgetMax: "2000",
  transport: "high_speed_rail, metro",
  stayPreference: "boutique_hotel",
  interestTags: "museum, photo_spots, citywalk",
  specialRequirements: "low walking intensity",
  xiaohongshuLink: "",
  xiaohongshuNotes: "苏州博物馆虽然免费但是要提前很久预约，公众号预约。",
  outputLanguage: "zh-CN" as OutputLanguage,
};

export function PlanIntakeForm() {
  const router = useRouter();
  const [values, setValues] = useState(defaultValues);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const transportTags = useMemo(
    () => splitCommaValues(values.transport),
    [values.transport],
  );
  const interestTags = useMemo(
    () => splitCommaValues(values.interestTags),
    [values.interestTags],
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const payload: PlanInput = {
        city: values.city.trim(),
        days: Number(values.days),
        budget_min: parseOptionalNumber(values.budgetMin),
        budget_max: parseOptionalNumber(values.budgetMax),
        transport_preferences: transportTags,
        stay_preference: values.stayPreference.trim(),
        interest_tags: interestTags,
        special_requirements: values.specialRequirements.trim(),
        xiaohongshu_link: toNullableString(values.xiaohongshuLink),
        xiaohongshu_notes: toNullableString(values.xiaohongshuNotes),
        output_language: values.outputLanguage,
      };

      const plan = await createPlan(payload);
      router.push(`/plan/${plan.id}`);
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : "Failed to create plan.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="grid gap-6" onSubmit={handleSubmit}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Destination City"
          name="city"
          onChange={setValues}
          placeholder="Suzhou"
          value={values.city}
        />
        <Field
          label="Travel Days"
          name="days"
          onChange={setValues}
          placeholder="2"
          value={values.days}
        />
        <Field
          label="Budget Min"
          name="budgetMin"
          onChange={setValues}
          placeholder="1200"
          value={values.budgetMin}
        />
        <Field
          label="Budget Max"
          name="budgetMax"
          onChange={setValues}
          placeholder="2000"
          value={values.budgetMax}
        />
        <Field
          label="Transport Preferences"
          name="transport"
          onChange={setValues}
          placeholder="high_speed_rail, metro"
          value={values.transport}
        />
        <Field
          label="Stay Preference"
          name="stayPreference"
          onChange={setValues}
          placeholder="boutique_hotel"
          value={values.stayPreference}
        />
      </div>

      <div className="grid gap-4">
        <TextArea
          label="Interest Tags"
          name="interestTags"
          onChange={setValues}
          placeholder="museum, photo_spots, citywalk"
          value={values.interestTags}
        />
        <TextArea
          label="Special Requirements"
          name="specialRequirements"
          onChange={setValues}
          placeholder="Need student discount, low walking intensity..."
          value={values.specialRequirements}
        />
        <Field
          label="Xiaohongshu Link"
          name="xiaohongshuLink"
          onChange={setValues}
          placeholder="https://www.xiaohongshu.com/..."
          value={values.xiaohongshuLink}
        />
        <TextArea
          label="Xiaohongshu Notes"
          name="xiaohongshuNotes"
          onChange={setValues}
          placeholder="Paste note excerpts if the parser is not wired yet."
          value={values.xiaohongshuNotes}
        />
      </div>

      <label className="grid gap-2 text-sm">
        <span className="font-medium text-foreground">Output Language</span>
        <select
          className="rounded-2xl border border-line bg-white px-4 py-3 text-sm outline-none transition focus:border-accent"
          name="outputLanguage"
          onChange={(event) =>
            setValues((current) => ({
              ...current,
              outputLanguage: event.target.value as OutputLanguage,
            }))
          }
          value={values.outputLanguage}
        >
          <option value="zh-CN">中文</option>
          <option value="en">English</option>
        </select>
      </label>

      {error ? (
        <p className="rounded-2xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <button
        className="inline-flex w-fit rounded-full bg-accent px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        disabled={isSubmitting}
        type="submit"
      >
        {isSubmitting ? "Creating Plan..." : "Create Plan"}
      </button>
    </form>
  );
}

type State = typeof defaultValues;

type FieldProps = {
  label: string;
  name: keyof State;
  placeholder: string;
  value: string;
  onChange: React.Dispatch<React.SetStateAction<State>>;
};

function Field({ label, name, placeholder, value, onChange }: FieldProps) {
  return (
    <label className="grid gap-2 text-sm">
      <span className="font-medium text-foreground">{label}</span>
      <input
        className="rounded-2xl border border-line bg-white px-4 py-3 text-sm outline-none transition focus:border-accent"
        name={name}
        onChange={(event) =>
          onChange((current) => ({ ...current, [name]: event.target.value }))
        }
        placeholder={placeholder}
        value={value}
      />
    </label>
  );
}

function TextArea({ label, name, placeholder, value, onChange }: FieldProps) {
  return (
    <label className="grid gap-2 text-sm">
      <span className="font-medium text-foreground">{label}</span>
      <textarea
        className="min-h-28 rounded-3xl border border-line bg-white px-4 py-3 text-sm outline-none transition focus:border-accent"
        name={name}
        onChange={(event) =>
          onChange((current) => ({ ...current, [name]: event.target.value }))
        }
        placeholder={placeholder}
        value={value}
      />
    </label>
  );
}

function splitCommaValues(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseOptionalNumber(value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const parsed = Number(trimmed);
  return Number.isNaN(parsed) ? null : parsed;
}

function toNullableString(value: string) {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

