"use client";

import { PlanWizard } from "@/components/intake/plan-wizard";

type PlanIntakeFormProps = {
  entryMode?: "quick" | "xiaohongshu";
};

export function PlanIntakeForm({
  entryMode = "quick",
}: PlanIntakeFormProps) {
  return <PlanWizard entryMode={entryMode} />;
}
