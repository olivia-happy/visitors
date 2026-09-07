export function getTimelineItemKey(item) {
  return [
    item?.day_index ?? "day",
    item?.start_time ?? "start",
    item?.end_time ?? "end",
    item?.transport_mode ?? "mode",
    item?.transport_duration_minutes ?? "duration",
  ].join("::");
}

export function toggleLockedTimelineStop(lockedKeys, stopKey) {
  const current = new Set(lockedKeys);
  if (current.has(stopKey)) {
    current.delete(stopKey);
  } else {
    current.add(stopKey);
  }

  return Array.from(current);
}

export function removeTimelineStop({ lockedKeys, removedKeys, stopKey }) {
  if (new Set(lockedKeys).has(stopKey)) {
    return [...removedKeys];
  }

  return Array.from(new Set([...removedKeys, stopKey]));
}

export function restoreTimelineStop(removedKeys, stopKey) {
  return removedKeys.filter((key) => key !== stopKey);
}

export function buildEditableTimeline(
  timeline,
  { lockedKeys = [], optimizationVersion = 0, removedKeys = [] } = {},
) {
  const lockedSet = new Set(lockedKeys);
  const removedSet = new Set(removedKeys);
  const visibleTimeline = timeline.filter(
    (item) => !removedSet.has(getTimelineItemKey(item)),
  );
  const shouldOptimize = optimizationVersion > 0;
  const editedTimeline = shouldOptimize
    ? optimizeTimelineByDay(visibleTimeline, lockedSet)
    : [...visibleTimeline];

  return {
    timeline: editedTimeline,
    flexibleCount: editedTimeline.filter(
      (item) => !lockedSet.has(getTimelineItemKey(item)),
    ).length,
    lockedCount: editedTimeline.filter((item) =>
      lockedSet.has(getTimelineItemKey(item)),
    ).length,
    removedCount: timeline.filter((item) =>
      removedSet.has(getTimelineItemKey(item)),
    ).length,
  };
}

function optimizeTimelineByDay(timeline, lockedSet) {
  const dayMap = new Map();
  timeline.forEach((item) => {
    const dayItems = dayMap.get(item.day_index) ?? [];
    dayItems.push(item);
    dayMap.set(item.day_index, dayItems);
  });

  return Array.from(dayMap.entries())
    .sort(([leftDay], [rightDay]) => leftDay - rightDay)
    .flatMap(([, dayItems]) => optimizeDayItems(dayItems, lockedSet));
}

function optimizeDayItems(dayItems, lockedSet) {
  const slots = [...dayItems].sort(compareByOriginalTime);
  const flexibleItems = slots
    .filter((item) => !lockedSet.has(getTimelineItemKey(item)))
    .sort(compareFlexibleStops);
  let flexibleIndex = 0;

  return slots.map((item) => {
    if (lockedSet.has(getTimelineItemKey(item))) {
      return item;
    }

    const nextFlexibleItem = flexibleItems[flexibleIndex];
    flexibleIndex += 1;
    return nextFlexibleItem ?? item;
  });
}

function compareByOriginalTime(left, right) {
  const startDiff = String(left.start_time).localeCompare(String(right.start_time));
  if (startDiff !== 0) {
    return startDiff;
  }

  return String(left.end_time).localeCompare(String(right.end_time));
}

function compareFlexibleStops(left, right) {
  const reservationDiff =
    Number(Boolean(right.reservation_hint)) - Number(Boolean(left.reservation_hint));
  if (reservationDiff !== 0) {
    return reservationDiff;
  }

  const transitDiff =
    Number(left.transport_duration_minutes ?? 0) -
    Number(right.transport_duration_minutes ?? 0);
  if (transitDiff !== 0) {
    return transitDiff;
  }

  return compareByOriginalTime(left, right);
}
