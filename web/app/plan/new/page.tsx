import { PlanIntakeForm } from "@/components/intake/plan-intake-form";
import { getExchangeRateSnapshot } from "@/lib/exchange-rate";

type NewPlanPageProps = {
  searchParams?: Promise<{
    entry?: string | string[];
    preset?: string | string[];
    surface?: string | string[];
  }>;
};

function normalizeEntryMode(entry: string | string[] | undefined) {
  const value = Array.isArray(entry) ? entry[0] : entry;
  return value === "xiaohongshu" ? "xiaohongshu" : "quick";
}

function normalizeDemoPreset(preset: string | string[] | undefined) {
  const value = Array.isArray(preset) ? preset[0] : preset;
  if (value === "demo" || value === "showcase") {
    return "suzhou" as const;
  }

  if (value === "suzhou") {
    return value;
  }

  return undefined;
}

function normalizeResultSurfaceMode(surface: string | string[] | undefined) {
  const value = Array.isArray(surface) ? surface[0] : surface;
  return value === "stage" ? "stage" : "default";
}

export default async function NewPlanPage({
  searchParams,
}: NewPlanPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const entryMode = normalizeEntryMode(resolvedSearchParams?.entry);
  const demoPreset = normalizeDemoPreset(resolvedSearchParams?.preset);
  const initialResultSurfaceMode = normalizeResultSurfaceMode(
    resolvedSearchParams?.surface,
  );
  const exchangeRateSnapshot = await getExchangeRateSnapshot();

  return (
    <PlanIntakeForm
      demoPreset={demoPreset}
      entryMode={entryMode}
      exchangeRateSnapshot={exchangeRateSnapshot}
      initialResultSurfaceMode={initialResultSurfaceMode}
    />
  );
}
