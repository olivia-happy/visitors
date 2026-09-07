import test from "node:test";
import assert from "node:assert/strict";

import {
  buildPlanPayload,
  getInitialWizardState,
  shouldShowParkingFields,
  validateCoreTripInputs,
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

test("getInitialWizardState can prefill the suzhou showcase preset", () => {
  const state = getInitialWizardState({
    entryMode: "quick",
    preset: "suzhou",
  });

  assert.equal(state.city, "苏州");
  assert.equal(state.days, "2");
  assert.deepEqual(state.transportPreferences, ["drive", "metro"]);
  assert.equal(state.travelMode, "photo");
  assert.equal(state.parkingSort, "distance");
  assert.equal(state.maxWalkFromParkingMinutes, "30");
  assert.match(state.xiaohongshuNotes, /苏州博物馆/);
});

test("getInitialWizardState localizes the suzhou preset for english output", () => {
  const state = getInitialWizardState({
    entryMode: "quick",
    outputLanguage: "en",
    preset: "suzhou",
  });

  assert.equal(state.outputLanguage, "en");
  assert.equal(state.city, "Suzhou");
  assert.equal(state.stayPreference, "Boutique hotel");
  assert.match(state.xiaohongshuNotes, /Suzhou Museum/i);
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

test("validateCoreTripInputs requires city and valid days", () => {
  const result = validateCoreTripInputs(
    {
      city: " ",
      days: "0",
      budgetMin: "",
      budgetMax: "",
    },
    "zh-CN",
  );

  assert.equal(result.fieldErrors.city, "先填写要去的国内城市。");
  assert.equal(result.fieldErrors.days, "旅行天数需要在 1 到 14 天之间。");
  assert.equal(result.formError, null);
});

test("validateCoreTripInputs rejects inverted budget ranges", () => {
  const result = validateCoreTripInputs(
    {
      city: "Suzhou",
      days: "2",
      budgetMin: "2000",
      budgetMax: "1200",
    },
    "en",
  );

  assert.deepEqual(result.fieldErrors, {});
  assert.equal(
    result.formError,
    "Budget ceiling cannot be lower than the budget floor.",
  );
});
