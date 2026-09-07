"use client";

import { PlanWizard } from "@/components/intake/plan-wizard";
import type { ExchangeRateSnapshot } from "@/lib/schemas";

type PlanIntakeFormProps = {
  demoPreset?: "suzhou";
  entryMode?: "quick" | "xiaohongshu";
  exchangeRateSnapshot: ExchangeRateSnapshot;
  initialResultSurfaceMode?: "default" | "stage";
};

export function PlanIntakeForm({
  demoPreset,
  entryMode = "quick",
  exchangeRateSnapshot,
  initialResultSurfaceMode = "default",
}: PlanIntakeFormProps) {
  return (
    <PlanWizard
      demoPreset={demoPreset}
      entryMode={entryMode}
      exchangeRateSnapshot={exchangeRateSnapshot}
      initialResultSurfaceMode={initialResultSurfaceMode}
    />
  );
}
