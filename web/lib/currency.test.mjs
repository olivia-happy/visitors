import assert from "node:assert/strict";
import test from "node:test";

import {
  applyCurrencyDisplayToPlan,
  formatExchangeRateMeta,
  formatBudgetRange,
  formatPriceNote,
} from "./currency.js";

const exchangeRateSnapshot = {
  usdPerCny: 1.1406 / 7.7492,
  cnyPerUsd: 7.7492 / 1.1406,
  rateDate: "2026-06-29",
  sourceLabel: "ECB reference rates",
  sourceUrl: "https://data-api.ecb.europa.eu/service/data/EXR",
};

test("formatBudgetRange uses localized symbols and converts English budgets with the latest rate snapshot", () => {
  assert.equal(
    formatBudgetRange(672, 1440, "zh-CN", exchangeRateSnapshot),
    "￥672 - ￥1,440",
  );
  assert.equal(
    formatBudgetRange(672, 1440, "en", exchangeRateSnapshot),
    "$99 - $212",
  );
});

test("formatPriceNote converts hourly RMB notes into language-specific display", () => {
  assert.equal(
    formatPriceNote("约 8 元/小时", "zh-CN", exchangeRateSnapshot),
    "约 ￥8/小时",
  );
  assert.equal(
    formatPriceNote("About RMB 8/hour", "en", exchangeRateSnapshot),
    "About $1.18/hour",
  );
  assert.equal(
    formatPriceNote(
      "Most commercial lots are around RMB 6-8/hour",
      "en",
      exchangeRateSnapshot,
    ),
    "Most commercial lots are around $0.88-$1.18/hour",
  );
});

test("applyCurrencyDisplayToPlan rewrites nested price notes for the active language", () => {
  const plan = {
    timeline: [
      {
        reservation_hint: {
          price_note: "About RMB 8/hour",
        },
      },
      {
        reservation_hint: null,
      },
    ],
    reservation_risks: [
      {
        price_note: "About RMB 8/hour",
      },
    ],
    parking_guides: [
      {
        price_note: "About RMB 8/hour",
      },
    ],
    hotel_area_recommendations: [
      {
        parking_price_note: "Most commercial lots are around RMB 6-8/hour",
      },
    ],
    reservation_hints: [
      {
        price_note: "About RMB 8/hour",
      },
    ],
  };

  const displayPlan = applyCurrencyDisplayToPlan(
    plan,
    "en",
    exchangeRateSnapshot,
  );

  assert.equal(
    displayPlan.timeline[0].reservation_hint.price_note,
    "About $1.18/hour",
  );
  assert.equal(displayPlan.reservation_risks[0].price_note, "About $1.18/hour");
  assert.equal(displayPlan.parking_guides[0].price_note, "About $1.18/hour");
  assert.equal(
    displayPlan.hotel_area_recommendations[0].parking_price_note,
    "Most commercial lots are around $0.88-$1.18/hour",
  );
  assert.equal(displayPlan.reservation_hints[0].price_note, "About $1.18/hour");
});

test("formatExchangeRateMeta returns localized timestamp and FX summary text", () => {
  assert.deepEqual(formatExchangeRateMeta("zh-CN", exchangeRateSnapshot), {
    badge: "汇率更新",
    boardTitle: "实时汇率情报",
    detail: "2026-06-29",
    summary: "1 美元 ≈ ￥6.79",
    sourceDetail: "来源 · ECB reference rates",
    actionLabel: "刷新汇率",
    loadingLabel: "刷新中...",
    successLabel: "汇率已更新",
    errorLabel: "汇率刷新失败",
  });

  assert.deepEqual(formatExchangeRateMeta("en", exchangeRateSnapshot), {
    badge: "Live FX",
    boardTitle: "FX intelligence",
    detail: "2026-06-29",
    summary: "1 USD ≈ ￥6.79 · 1 CNY ≈ $0.1472",
    sourceDetail: "Source · ECB reference rates",
    actionLabel: "Refresh FX",
    loadingLabel: "Refreshing...",
    successLabel: "FX updated",
    errorLabel: "FX refresh failed",
  });
});
