import { PlanResultShell } from "@/components/result/plan-result-shell";
import { showcasePlan } from "@/lib/mock-plan";

export default function ShowcasePage() {
  return (
    <PlanResultShell
      mode="showcase"
      plan={showcasePlan}
      planId="showcase-suzhou"
    />
  );
}

