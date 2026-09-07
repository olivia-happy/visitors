import type { Metadata } from "next";

import { PlanResultShell } from "@/components/result/plan-result-shell";
import { getExchangeRateSnapshot } from "@/lib/exchange-rate";
import { showcasePlan } from "@/lib/mock-plan";
import { formatCityName } from "@/lib/result-formatters";
import { readViewState } from "@/lib/view-state";

type ShowcasePageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({
  searchParams,
}: ShowcasePageProps): Promise<Metadata> {
  const viewState = readViewState((await searchParams) ?? {}, {
    language: showcasePlan.output_language,
    theme: "light",
  });
  const cityName = formatCityName(showcasePlan.city, viewState.language);

  return {
    title:
      viewState.language === "en"
        ? `${cityName} · Trip Result`
        : `${cityName} · 行程结果`,
  };
}

export default async function ShowcasePage({
  searchParams,
}: ShowcasePageProps) {
  const exchangeRateSnapshot = await getExchangeRateSnapshot();
  const viewState = readViewState((await searchParams) ?? {}, {
    language: showcasePlan.output_language,
    theme: "light",
  });

  return (
    <PlanResultShell
      exchangeRateSnapshot={exchangeRateSnapshot}
      initialLanguage={viewState.language}
      initialSurfaceMode={viewState.surface}
      initialThemeMode={viewState.theme}
      mode="showcase"
      plan={showcasePlan}
      planId="showcase-suzhou"
    />
  );
}

