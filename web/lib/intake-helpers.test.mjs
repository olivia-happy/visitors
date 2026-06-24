import test from "node:test";
import assert from "node:assert/strict";

import {
  buildPlanPayload,
  getInitialWizardState,
  shouldShowParkingFields,
} from "./intake-helpers.js";

test("shouldShowParkingFields returns true for drive mode", () => {
  assert.equal(shouldShowParkingFields(["drive"]), true);
  assert.equal(shouldShowParkingFields(["metro"]), false);
});

test("getInitialWizardState highlights evidence step for xiaohongshu entry", () => {
  const state = getInitialWizardState({ entryMode: "xiaohongshu" });

  assert.equal(state.entryMode, "xiaohongshu");
  assert.equal(state.currentStep, 3);
});

test("buildPlanPayload auto-fills parking fields for drive mode", () => {
  const payload = buildPlanPayload({
    city: "Suzhou",
    days: "2",
    budgetMin: "1200",
    budgetMax: "2000",
    transportPreferences: ["drive"],
    entryMode: "quick",
    travelMode: "photo",
    preferenceTags: ["food", "photo_ready"],
    interestTags: ["museum", "citywalk"],
    stayPreference: "boutique_hotel",
    specialRequirements: "low walking intensity",
    xiaohongshuLink: "",
    xiaohongshuNotes: "",
    outputLanguage: "zh-CN",
    parkingSort: "distance",
  });

  assert.equal(payload.parking_required, true);
  assert.equal(payload.parking_sort, "distance");
  assert.equal(payload.max_walk_from_parking_minutes, 30);
  assert.deepEqual(payload.preference_tags, ["food", "photo_ready"]);
});
