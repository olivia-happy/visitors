/**
 * @typedef {Object} MapPointRecord
 * @property {string} name
 * @property {number} lat
 * @property {number} lng
 * @property {number} day_index
 * @property {number} sequence_no
 */

/**
 * @typedef {Object} DayGroup
 * @property {number} dayIndex
 * @property {MapPointRecord[]} points
 */

/**
 * @typedef {Object} MapSummary
 * @property {number} stopCount
 * @property {number} dayCount
 * @property {string | null} firstStopName
 * @property {string | null} lastStopName
 * @property {{ lat: number, lng: number } | null} center
 */

/**
 * @param {MapPointRecord[]} mapPoints
 * @returns {MapPointRecord[]}
 */
export function sortMapPointsByRoute(mapPoints) {
  return [...mapPoints].sort((left, right) => {
    if (left.sequence_no !== right.sequence_no) {
      return left.sequence_no - right.sequence_no;
    }

    if (left.day_index !== right.day_index) {
      return left.day_index - right.day_index;
    }

    return left.name.localeCompare(right.name);
  });
}

/**
 * @param {MapPointRecord[]} mapPoints
 * @returns {DayGroup[]}
 */
export function groupMapPointsByDay(mapPoints) {
  /** @type {DayGroup[]} */
  const groups = [];

  for (const point of sortMapPointsByRoute(mapPoints)) {
    const lastGroup = groups.at(-1);
    if (!lastGroup || lastGroup.dayIndex !== point.day_index) {
      groups.push({
        dayIndex: point.day_index,
        points: [point],
      });
      continue;
    }

    lastGroup.points.push(point);
  }

  return groups;
}

/**
 * @param {MapPointRecord[]} mapPoints
 * @returns {MapSummary}
 */
export function buildMapSummary(mapPoints) {
  const orderedPoints = sortMapPointsByRoute(mapPoints);

  if (!orderedPoints.length) {
    return {
      stopCount: 0,
      dayCount: 0,
      firstStopName: null,
      lastStopName: null,
      center: null,
    };
  }

  const latTotal = orderedPoints.reduce((sum, point) => sum + point.lat, 0);
  const lngTotal = orderedPoints.reduce((sum, point) => sum + point.lng, 0);

  return {
    stopCount: orderedPoints.length,
    dayCount: new Set(orderedPoints.map((point) => point.day_index)).size,
    firstStopName: orderedPoints[0].name,
    lastStopName: orderedPoints.at(-1)?.name ?? null,
    center: {
      lat: Number((latTotal / orderedPoints.length).toFixed(4)),
      lng: Number((lngTotal / orderedPoints.length).toFixed(4)),
    },
  };
}
