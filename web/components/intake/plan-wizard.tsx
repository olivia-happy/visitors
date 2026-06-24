"use client";

import { useRouter } from "next/navigation";
import { FormEvent, startTransition, useState } from "react";

import { StepBasics } from "@/components/intake/step-basics";
import { StepEvidence } from "@/components/intake/step-evidence";
import { StepStyle } from "@/components/intake/step-style";
import { createPlan } from "@/lib/api";
import {
  buildPlanPayload,
  getInitialWizardState,
  shouldShowParkingFields,
} from "@/lib/intake-helpers";
import type { OutputLanguage, PlanInput } from "@/lib/schemas";

type EntryMode = "quick" | "xiaohongshu";
type TravelMode = "" | "photo" | "citywalk" | "nature" | "garden_culture";
type ParkingSort = "distance" | "price";

type WizardState = {
  currentStep: 1 | 2 | 3;
  entryMode: EntryMode;
  city: string;
  days: string;
  budgetMin: string;
  budgetMax: string;
  transportPreferences: string[];
  travelMode: TravelMode;
  preferenceTags: string[];
  interestTags: string[];
  stayPreference: string;
  specialRequirements: string;
  xiaohongshuLink: string;
  xiaohongshuNotes: string;
  outputLanguage: OutputLanguage;
  parkingSort: ParkingSort;
  maxWalkFromParkingMinutes: string;
};

type PlanWizardProps = {
  entryMode: EntryMode;
};

const steps = [
  {
    id: 1 as const,
    label: "Basics",
    title: "先定行程骨架和出行方式",
    detail: "城市、预算、交通和停车条件都会在这一步锁定。",
  },
  {
    id: 2 as const,
    label: "Style",
    title: "再决定你要的出片感和节奏",
    detail: "把偏好的旅行风格和兴趣标签提前映射到后端契约。",
  },
  {
    id: 3 as const,
    label: "Evidence",
    title: "最后补预约证据和补充说明",
    detail: "小红书证据会直接进入预约风险视图，不再只是备注。",
  },
];

type TextFieldName =
  | "city"
  | "days"
  | "budgetMin"
  | "budgetMax"
  | "stayPreference"
  | "specialRequirements"
  | "xiaohongshuLink"
  | "xiaohongshuNotes"
  | "maxWalkFromParkingMinutes";

type SelectFieldName = "travelMode" | "parkingSort" | "outputLanguage";
type ArrayFieldName =
  | "transportPreferences"
  | "preferenceTags"
  | "interestTags";

export function PlanWizard({ entryMode }: PlanWizardProps) {
  const router = useRouter();
  const [values, setValues] = useState<WizardState>(
    () => getInitialWizardState({ entryMode }) as WizardState,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const currentStepMeta = steps[values.currentStep - 1];
  const parkingVisible = shouldShowParkingFields(values.transportPreferences);

  function updateTextField(name: TextFieldName, value: string) {
    setValues((current) => ({ ...current, [name]: value }));
  }

  function updateSelectField(
    name: SelectFieldName,
    value: string,
  ) {
    setValues((current) => ({ ...current, [name]: value }));
  }

  function toggleListValue(name: ArrayFieldName, value: string) {
    setValues((current) => {
      const hasValue = current[name].includes(value);
      return {
        ...current,
        [name]: hasValue
          ? current[name].filter((item) => item !== value)
          : [...current[name], value],
      };
    });
  }

  function setCurrentStep(step: 1 | 2 | 3) {
    setValues((current) => ({ ...current, currentStep: step }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (values.currentStep < 3) {
      setCurrentStep((values.currentStep + 1) as 1 | 2 | 3);
      return;
    }

    setError("");
    setIsSubmitting(true);

    try {
      const payload = buildPlanPayload(values) as PlanInput;
      const plan = await createPlan(payload);
      startTransition(() => {
        router.push(`/plan/${plan.id}`);
      });
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
    <form className="grid gap-6 pb-28" onSubmit={handleSubmit}>
      <div className="sticky top-4 z-20 grid gap-4 rounded-[1.75rem] border border-line/70 bg-card/95 p-4 shadow-[0_18px_50px_rgba(35,82,61,0.08)] backdrop-blur">
        <div className="grid gap-1">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-accent">
            Three Step Wizard
          </p>
          <h2 className="text-2xl font-semibold leading-tight">
            {currentStepMeta.title}
          </h2>
          <p className="text-sm leading-7 text-muted">
            {currentStepMeta.detail}
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {steps.map((step) => {
            const isActive = values.currentStep === step.id;
            const isComplete = values.currentStep > step.id;
            return (
              <button
                key={step.id}
                type="button"
                onClick={() => setCurrentStep(step.id)}
                className={`grid gap-1 rounded-[1.25rem] border px-3 py-3 text-left transition ${
                  isActive
                    ? "border-accent bg-accent text-white"
                    : isComplete
                      ? "border-accent/30 bg-accent-soft text-foreground"
                      : "border-line bg-white/70 text-muted"
                }`}
              >
                <span className="text-xs font-semibold uppercase tracking-[0.2em]">
                  0{step.id}
                </span>
                <span className="text-sm font-semibold">{step.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {values.currentStep === 1 ? (
        <StepBasics
          city={values.city}
          days={values.days}
          budgetMin={values.budgetMin}
          budgetMax={values.budgetMax}
          transportPreferences={values.transportPreferences}
          outputLanguage={values.outputLanguage}
          parkingSort={values.parkingSort}
          maxWalkFromParkingMinutes={values.maxWalkFromParkingMinutes}
          showParkingFields={parkingVisible}
          onFieldChange={updateTextField}
          onSelectChange={updateSelectField}
          onToggleTransport={(value) =>
            toggleListValue("transportPreferences", value)
          }
        />
      ) : null}

      {values.currentStep === 2 ? (
        <StepStyle
          travelMode={values.travelMode}
          preferenceTags={values.preferenceTags}
          interestTags={values.interestTags}
          stayPreference={values.stayPreference}
          specialRequirements={values.specialRequirements}
          onFieldChange={updateTextField}
          onTravelModeChange={(value) =>
            updateSelectField("travelMode", value)
          }
          onTogglePreferenceTag={(value) =>
            toggleListValue("preferenceTags", value)
          }
          onToggleInterestTag={(value) =>
            toggleListValue("interestTags", value)
          }
        />
      ) : null}

      {values.currentStep === 3 ? (
        <StepEvidence
          entryMode={values.entryMode}
          xiaohongshuLink={values.xiaohongshuLink}
          xiaohongshuNotes={values.xiaohongshuNotes}
          onFieldChange={updateTextField}
        />
      ) : null}

      {error ? (
        <p className="rounded-[1.5rem] border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <div className="sticky bottom-4 z-20">
        <div className="flex items-center gap-3 rounded-[1.75rem] border border-line/70 bg-card/95 p-4 shadow-[0_18px_50px_rgba(35,82,61,0.08)] backdrop-blur">
          <button
            type="button"
            onClick={() =>
              setCurrentStep(Math.max(1, values.currentStep - 1) as 1 | 2 | 3)
            }
            disabled={values.currentStep === 1 || isSubmitting}
            className="inline-flex min-h-12 flex-1 items-center justify-center rounded-full border border-line bg-white/80 px-4 text-sm font-semibold text-foreground transition disabled:cursor-not-allowed disabled:opacity-50"
          >
            Back
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex min-h-12 flex-[1.4] items-center justify-center rounded-full bg-accent px-4 text-sm font-semibold text-white transition hover:opacity-92 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {values.currentStep < 3
              ? "Continue"
              : isSubmitting
                ? "Generating..."
                : "Generate Plan"}
          </button>
        </div>
      </div>
    </form>
  );
}
