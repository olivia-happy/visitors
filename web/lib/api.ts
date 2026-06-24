import type { PlanDraft, PlanInput } from "./schemas";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000";

export async function createPlan(input: PlanInput): Promise<PlanDraft> {
  const response = await fetch(`${API_BASE_URL}/plans`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw new Error("Failed to create plan.");
  }

  return (await response.json()) as PlanDraft;
}

export async function fetchPlan(planId: string): Promise<PlanDraft | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/plans/${planId}`, {
      cache: "no-store",
    });

    if (!response.ok) {
      return null;
    }

    return (await response.json()) as PlanDraft;
  } catch {
    return null;
  }
}
