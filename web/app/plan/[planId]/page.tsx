import { PlanResultShell } from "@/components/result/plan-result-shell";
import { fetchPlan } from "@/lib/api";

type PlanPageProps = {
  params: Promise<{
    planId: string;
  }>;
};

export default async function PlanDetailPage({ params }: PlanPageProps) {
  const { planId } = await params;
  const plan = await fetchPlan(planId);

  return <PlanResultShell plan={plan} planId={planId} />;
}

