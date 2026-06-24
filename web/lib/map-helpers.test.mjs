import test from "node:test";
import assert from "node:assert/strict";

import {
  buildMapSummary,
  groupMapPointsByDay,
  sortMapPointsByRoute,
} from "./map-helpers.js";

test("sortMapPointsByRoute sorts points by sequence number", () => {
  const result = sortMapPointsByRoute([
    { name: "Stop 3", lat: 31.3, lng: 120.6, day_index: 2, sequence_no: 3 },
    { name: "Stop 1", lat: 31.1, lng: 120.4, day_index: 1, sequence_no: 1 },
    { name: "Stop 2", lat: 31.2, lng: 120.5, day_index: 1, sequence_no: 2 },
  ]);

  assert.deepEqual(result.map((item) => item.name), [
    "Stop 1",
    "Stop 2",
    "Stop 3",
  ]);
});

test("groupMapPointsByDay keeps route order inside each day", () => {
  const result = groupMapPointsByDay([
    { name: "Day 2 / 2", lat: 31.3, lng: 120.6, day_index: 2, sequence_no: 4 },
    { name: "Day 1 / 2", lat: 31.2, lng: 120.5, day_index: 1, sequence_no: 2 },
    { name: "Day 2 / 1", lat: 31.25, lng: 120.55, day_index: 2, sequence_no: 3 },
    { name: "Day 1 / 1", lat: 31.1, lng: 120.4, day_index: 1, sequence_no: 1 },
  ]);

  assert.equal(result.length, 2);
  assert.deepEqual(result[0].points.map((item) => item.name), [
    "Day 1 / 1",
    "Day 1 / 2",
  ]);
  assert.deepEqual(result[1].points.map((item) => item.name), [
    "Day 2 / 1",
    "Day 2 / 2",
  ]);
});

test("buildMapSummary returns aggregate route metadata", () => {
  const result = buildMapSummary([
    { name: "Stop 1", lat: 31.1, lng: 120.4, day_index: 1, sequence_no: 1 },
    { name: "Stop 2", lat: 31.2, lng: 120.5, day_index: 1, sequence_no: 2 },
    { name: "Stop 3", lat: 31.3, lng: 120.6, day_index: 2, sequence_no: 3 },
  ]);

  assert.equal(result.stopCount, 3);
  assert.equal(result.dayCount, 2);
  assert.equal(result.firstStopName, "Stop 1");
  assert.equal(result.lastStopName, "Stop 3");
  assert.deepEqual(result.center, {
    lat: 31.2,
    lng: 120.5,
  });
});
