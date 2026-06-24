import test from "node:test";
import assert from "node:assert/strict";

import {
  buildPrimaryResultSections,
  shouldRenderParkingPanels,
} from "./result-helpers.js";

test("shouldRenderParkingPanels only returns true for parking-required plans", () => {
  assert.equal(shouldRenderParkingPanels({ parking_required: true }), true);
  assert.equal(shouldRenderParkingPanels({ parking_required: false }), false);
});

test("buildPrimaryResultSections keeps reservation and execution first", () => {
  const sections = buildPrimaryResultSections({
    parking_required: true,
    execution_summary: { headline: "先预约后慢逛" },
    reservation_risks: [{ poi_name: "苏州博物馆" }],
  });

  assert.deepEqual(sections.slice(0, 3), [
    "hero",
    "reservation_risks",
    "execution_route",
  ]);
  assert.equal(sections.includes("parking_guides"), true);
  assert.equal(sections.includes("hotel_areas"), true);
});
