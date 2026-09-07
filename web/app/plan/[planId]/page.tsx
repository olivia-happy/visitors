import type { Metadata } from "next";

import { PlanResultShell } from "@/components/result/plan-result-shell";
import { getExchangeRateSnapshot } from "@/lib/exchange-rate";
import { fetchPlan } from "@/lib/api";
import { formatCityName } from "@/lib/result-formatters";
import { readViewState } from "@/lib/view-state";

type PlanPageProps = {
  params: Promise<{
    planId: string;
  }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({
  params,
  searchParams,
}: PlanPageProps): Promise<Metadata> {
  const { planId } = await params;
  const plan = await fetchPlan(planId);
  const viewState = readViewState((await searchParams) ?? {}, {
    language: plan?.output_language === "en" ? "en" : "zh-CN",
    theme: "light",
  });

  if (!plan) {
    return {
      title: viewState.language === "en" ? "Trip Result" : "行程结果",
    };
  }

  const cityName = formatCityName(plan.city, viewState.language);

  return {
    title:
      viewState.language === "en"
        ? `${cityName} · Trip Result`
        : `${cityName} · 行程结果`,
  };
}

export default async function PlanDetailPage({
  params,
  searchParams,
}: PlanPageProps) {
  const { planId } = await params;
  const [plan, exchangeRateSnapshot] = await Promise.all([
    fetchPlan(planId),
    getExchangeRateSnapshot(),
  ]);
  const viewState = readViewState((await searchParams) ?? {}, {
    language: plan?.output_language === "en" ? "en" : "zh-CN",
    theme: "light",
  });

  return (
    <PlanResultShell
      exchangeRateSnapshot={exchangeRateSnapshot}
      initialLanguage={viewState.language}
      initialSurfaceMode={viewState.surface}
      initialThemeMode={viewState.theme}
      plan={plan}
      planId={planId}
    />
  );
}

