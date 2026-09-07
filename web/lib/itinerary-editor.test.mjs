import test from "node:test";
import assert from "node:assert/strict";

import {
  buildEditableTimeline,
  getTimelineItemKey,
  removeTimelineStop,
  toggleLockedTimelineStop,
} from "./itinerary-editor.js";

const timeline = [
  {
    day_index: 1,
    start_time: "09:00",
    end_time: "11:30",
    title: "Suzhou Museum",
    transport_mode: "metro",
    transport_duration_minutes: 20,
    notes: "Book first.",
    reservation_hint: { poi_name: "Suzhou Museum" },
  },
  {
    day_index: 1,
    start_time: "13:00",
    end_time: "15:30",
    title: "Pingjiang Road",
    transport_mode: "walk",
    transport_duration_minutes: 15,
    notes: "Slow walk.",
    reservation_hint: null,
  },
  {
    day_index: 1,
    start_time: "16:00",
    end_time: "17:30",
    title: "Couple's Retreat Garden",
    transport_mode: "taxi",
    transport_duration_minutes: 10,
    notes: "Garden stop.",
    reservation_hint: null,
  },
];

test("toggleLockedTimelineStop adds and removes locked stops", () => {
  const museumKey = getTimelineItemKey(timeline[0]);

  const locked = toggleLockedTimelineStop([], museumKey);
  assert.deepEqual(locked, [museumKey]);

  const unlocked = toggleLockedTimelineStop(locked, museumKey);
  assert.deepEqual(unlocked, []);
});

test("removeTimelineStop does not remove a locked stop", () => {
  const museumKey = getTimelineItemKey(timeline[0]);

  const removed = removeTimelineStop({
    lockedKeys: [museumKey],
    removedKeys: [],
    stopKey: museumKey,
  });

  assert.deepEqual(removed, []);
});

test("buildEditableTimeline hides removed stops and preserves locked stop slots", () => {
  const museumKey = getTimelineItemKey(timeline[0]);
  const pingjiangKey = getTimelineItemKey(timeline[1]);

  const result = buildEditableTimeline(timeline, {
    lockedKeys: [museumKey],
    optimizationVersion: 1,
    removedKeys: [pingjiangKey],
  });

  assert.deepEqual(
    result.timeline.map((item) => item.title),
    ["Suzhou Museum", "Couple's Retreat Garden"],
  );
  assert.equal(result.lockedCount, 1);
  assert.equal(result.removedCount, 1);
  assert.equal(result.flexibleCount, 1);
});

test("buildEditableTimeline reorders only flexible stops when optimizing", () => {
  const lockedMiddleKey = getTimelineItemKey(timeline[1]);

  const result = buildEditableTimeline(timeline, {
    lockedKeys: [lockedMiddleKey],
    optimizationVersion: 1,
    removedKeys: [],
  });

  assert.equal(result.timeline[1].title, "Pingjiang Road");
  assert.equal(result.timeline[0].title, "Suzhou Museum");
  assert.equal(result.timeline[2].title, "Couple's Retreat Garden");
});
