import type { Metadata } from "next";
import Link from "next/link";

import { PlanExportSheet } from "@/components/result/plan-export-sheet";
import { fetchPlan } from "@/lib/api";
import { getExchangeRateSnapshot } from "@/lib/exchange-rate";
import { formatCityName } from "@/lib/result-formatters";
import { readViewState } from "@/lib/view-state";

type PlanSharePageProps = {
  params: Promise<{
    planId: string;
  }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({
  params,
  searchParams,
}: PlanSharePageProps): Promise<Metadata> {
  const { planId } = await params;
  const plan = await fetchPlan(planId);
  const viewState = readViewState((await searchParams) ?? {}, {
    language: plan?.output_language === "en" ? "en" : "zh-CN",
    theme: "light",
  });

  if (!plan) {
    return {
      title: viewState.language === "en" ? "Trip Share Sheet" : "行程分享页",
    };
  }

  const cityName = formatCityName(plan.city, viewState.language);

  return {
    title:
      viewState.language === "en"
        ? `${cityName} · Trip Share Sheet`
        : `${cityName} · 行程分享页`,
  };
}

export default async function PlanSharePage({
  params,
  searchParams,
}: PlanSharePageProps) {
  const { planId } = await params;
  const [plan, exchangeRateSnapshot] = await Promise.all([
    fetchPlan(planId),
    getExchangeRateSnapshot(),
  ]);
  const viewState = readViewState((await searchParams) ?? {}, {
    language: plan?.output_language === "en" ? "en" : "zh-CN",
    theme: "light",
  });

  if (!plan) {
    return (
      <main className="min-h-screen bg-[#f6f0e3] px-4 py-10 text-foreground">
        <div className="mx-auto grid w-full max-w-2xl gap-4 rounded-[2rem] border border-line/70 bg-card p-6 shadow-[0_18px_50px_rgba(35,82,61,0.08)]">
          <h1 className="text-2xl font-semibold">分享页暂时无法打开</h1>
          <p className="text-sm leading-7 text-muted">
            这份行程当前没有取回成功，可能是计划不存在，或 API 当前不可达。
          </p>
          <Link
            className="inline-flex w-fit items-center justify-center rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white"
            href="/"
          >
            返回首页
          </Link>
        </div>
      </main>
    );
  }

  return (
    <PlanExportSheet
      backHref={`/plan/${planId}`}
      exchangeRateSnapshot={exchangeRateSnapshot}
      initialLanguage={viewState.language}
      initialThemeMode={viewState.theme}
      plan={plan}
      planId={planId}
      shareHref={`/plan/${planId}/share`}
    />
  );
}
