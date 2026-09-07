import assert from "node:assert/strict";
import test from "node:test";

import {
  buildExportBudgetSummary,
  buildExportSections,
  buildExportTitle,
} from "./export-helpers.js";

const exportPlan = {
  city: "Suzhou",
  days: 2,
  parking_required: true,
  budget_items: [
    { category: "tickets", amount_low: 96, amount_high: 240 },
    { category: "food", amount_low: 216, amount_high: 440 },
    { category: "stay", amount_low: 360, amount_high: 760 },
  ],
};

test("buildExportSections keeps execution-first blocks and drive-only additions", () => {
  assert.deepEqual(buildExportSections(exportPlan), [
    "summary",
    "reservation_risks",
    "execution_route",
    "budget",
    "parking_guides",
    "hotel_areas",
  ]);
});

test("buildExportSections skips parking blocks for non-drive plans", () => {
  assert.deepEqual(
    buildExportSections({ ...exportPlan, parking_required: false }),
    ["summary", "reservation_risks", "execution_route", "budget"],
  );
});

test("buildExportBudgetSummary aggregates low and high totals", () => {
  assert.deepEqual(buildExportBudgetSummary(exportPlan.budget_items), {
    low: 672,
    high: 1440,
  });
});

test("buildExportTitle formats printable titles in both languages", () => {
  assert.equal(buildExportTitle(exportPlan), "苏州 · 2 天执行分享页");
  assert.equal(buildExportTitle(exportPlan, "en"), "Suzhou · 2-day print sheet");
});
