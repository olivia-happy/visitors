const ECB_EXR_API_ROOT = "https://data-api.ecb.europa.eu/service/data/EXR";
const ECB_USD_EUR_URL =
  `${ECB_EXR_API_ROOT}/D.USD.EUR.SP00.A?lastNObservations=1&format=jsondata`;
const ECB_CNY_EUR_URL =
  `${ECB_EXR_API_ROOT}/D.CNY.EUR.SP00.A?lastNObservations=1&format=jsondata`;

const FALLBACK_EXCHANGE_RATE_SNAPSHOT = {
  usdPerCny: 1.1406 / 7.7492,
  cnyPerUsd: 7.7492 / 1.1406,
  rateDate: "2026-06-29",
  sourceLabel: "ECB reference rates",
  sourceUrl: ECB_EXR_API_ROOT,
  isFallback: true,
};

export function getFallbackExchangeRateSnapshot() {
  return { ...FALLBACK_EXCHANGE_RATE_SNAPSHOT };
}

export async function getExchangeRateSnapshot(fetchImpl = fetch) {
  try {
    const [usdResponse, cnyResponse] = await Promise.all([
      fetchImpl(ECB_USD_EUR_URL, {
        headers: {
          Accept: "application/json",
        },
        next: {
          revalidate: 3600,
        },
      }),
      fetchImpl(ECB_CNY_EUR_URL, {
        headers: {
          Accept: "application/json",
        },
        next: {
          revalidate: 3600,
        },
      }),
    ]);

    if (!usdResponse.ok || !cnyResponse.ok) {
      throw new Error("ECB exchange rate request failed.");
    }

    const [usdPayload, cnyPayload] = await Promise.all([
      usdResponse.json(),
      cnyResponse.json(),
    ]);

    return buildUsdCnySnapshotFromEcbResponses(usdPayload, cnyPayload);
  } catch {
    return getFallbackExchangeRateSnapshot();
  }
}

export function buildUsdCnySnapshotFromEcbResponses(
  usdPerEurResponse,
  cnyPerEurResponse,
) {
  const usdObservation = readLatestObservation(usdPerEurResponse);
  const cnyObservation = readLatestObservation(cnyPerEurResponse);
  const usdPerCny = usdObservation.value / cnyObservation.value;

  return {
    usdPerCny,
    cnyPerUsd: 1 / usdPerCny,
    rateDate: pickLatestRateDate(usdObservation.date, cnyObservation.date),
    sourceLabel: "ECB reference rates",
    sourceUrl: ECB_EXR_API_ROOT,
  };
}

function readLatestObservation(response) {
  const observationDimension = Array.isArray(
    response?.structure?.dimensions?.observation,
  )
    ? response?.structure?.dimensions?.observation?.[0]
    : response?.structure?.dimensions?.observation;
  const date = observationDimension?.values?.[0]?.id;
  const seriesCollection = Array.isArray(response?.dataSets)
    ? response?.dataSets?.[0]?.series
    : response?.dataSets?.series;
  const firstSeries = Object.values(seriesCollection ?? {})[0];
  const observationKey = Object.keys(firstSeries?.observations ?? {})[0];
  const value = firstSeries?.observations?.[observationKey]?.[0];

  if (!date || typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error("ECB response is missing the latest observation.");
  }

  return { date, value };
}

function pickLatestRateDate(...dates) {
  return dates.filter(Boolean).sort().at(-1) ?? FALLBACK_EXCHANGE_RATE_SNAPSHOT.rateDate;
}
