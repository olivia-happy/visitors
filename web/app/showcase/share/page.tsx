import type { Metadata } from "next";

import { PlanExportSheet } from "@/components/result/plan-export-sheet";
import { getExchangeRateSnapshot } from "@/lib/exchange-rate";
import { showcasePlan } from "@/lib/mock-plan";
import { formatCityName } from "@/lib/result-formatters";
import { readViewState } from "@/lib/view-state";

type ShowcaseSharePageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({
  searchParams,
}: ShowcaseSharePageProps): Promise<Metadata> {
  const viewState = readViewState((await searchParams) ?? {}, {
    language: showcasePlan.output_language,
    theme: "light",
  });
  const cityName = formatCityName(showcasePlan.city, viewState.language);

  return {
    title:
      viewState.language === "en"
        ? `${cityName} · Trip Share Sheet`
        : `${cityName} · 行程分享页`,
  };
}

export default async function ShowcaseSharePage({
  searchParams,
}: ShowcaseSharePageProps) {
  const exchangeRateSnapshot = await getExchangeRateSnapshot();
  const viewState = readViewState((await searchParams) ?? {}, {
    language: showcasePlan.output_language,
    theme: "light",
  });

  return (
    <PlanExportSheet
      backHref="/showcase"
      exchangeRateSnapshot={exchangeRateSnapshot}
      initialLanguage={viewState.language}
      initialThemeMode={viewState.theme}
      plan={showcasePlan}
      planId="showcase-suzhou"
      shareHref="/showcase/share"
    />
  );
}
