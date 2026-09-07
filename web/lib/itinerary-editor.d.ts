import type { TimelineItem } from "./schemas";

export type EditableTimelineOptions = {
  lockedKeys?: string[];
  optimizationVersion?: number;
  removedKeys?: string[];
};

export type EditableTimelineState = {
  flexibleCount: number;
  lockedCount: number;
  removedCount: number;
  timeline: TimelineItem[];
};

export function getTimelineItemKey(item: TimelineItem | null | undefined): string;

export function toggleLockedTimelineStop(
  lockedKeys: string[],
  stopKey: string,
): string[];

export function removeTimelineStop(options: {
  lockedKeys: string[];
  removedKeys: string[];
  stopKey: string;
}): string[];

export function restoreTimelineStop(
  removedKeys: string[],
  stopKey: string,
): string[];

export function buildEditableTimeline(
  timeline: TimelineItem[],
  options?: EditableTimelineOptions,
): EditableTimelineState;
