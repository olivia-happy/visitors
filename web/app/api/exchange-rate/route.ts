import { NextResponse } from "next/server";

import { getExchangeRateSnapshot } from "@/lib/exchange-rate";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const snapshot = await getExchangeRateSnapshot();

  return NextResponse.json(snapshot, {
    headers: {
      "Cache-Control": "no-store, max-age=0",
    },
  });
}
