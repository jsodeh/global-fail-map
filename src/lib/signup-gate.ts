/**
 * Counts what a signed-out reader has already sampled, so the atlas can ask
 * for an account once the sampling is clearly a habit rather than a glance.
 *
 * The rules the counters serve:
 *   - a random story opens freely once, and the second click asks
 *   - researching a place asks the first time, because research is the
 *     product and it cannot run without an account anyway
 *   - stories opened from the explore list run freely twice, and the third
 *     distinct story asks
 *
 * Only distinct stories count. Reopening one already read is not new
 * exploration, and gating it would punish a reader for going back.
 *
 * This module is pure. It holds no storage and no React, so the thresholds
 * can be tested directly.
 */

export type GateTrigger = 'random' | 'research' | 'stories';

export interface GateCounts {
  /** Random stories opened while signed out. */
  randomOpens: number;
  /** Distinct story ids opened from the explore list while signed out. */
  storyIds: string[];
}

/** Random stories a reader opens before the ask. */
export const freeRandomOpens = 1;

/** Distinct explored stories a reader opens before the ask. */
export const freeStoryOpens = 2;

export const emptyCounts: GateCounts = { randomOpens: 0, storyIds: [] };

/** A blocked attempt leaves the counters alone, so the ask keeps repeating. */
export interface GateDecision {
  counts: GateCounts;
  gated: boolean;
}

/**
 * Reads counters that have been through localStorage, a browser extension or
 * an older version of this code. Anything unrecognised resets to zero rather
 * than throwing, because a broken counter must not break the atlas.
 */
export function parseCounts(raw: unknown): GateCounts {
  if (!raw || typeof raw !== 'object') return emptyCounts;
  const value = raw as Partial<Record<keyof GateCounts, unknown>>;
  const randomOpens =
    typeof value.randomOpens === 'number' &&
    Number.isFinite(value.randomOpens) &&
    value.randomOpens > 0
      ? Math.floor(value.randomOpens)
      : 0;
  const storyIds = Array.isArray(value.storyIds)
    ? Array.from(
        new Set(
          value.storyIds.filter(
            (id): id is string => typeof id === 'string' && id.length > 0,
          ),
        ),
      )
    : [];
  return { randomOpens, storyIds };
}

/** The second random story, and every one after it, asks for an account. */
export function recordRandomOpen(counts: GateCounts): GateDecision {
  if (counts.randomOpens >= freeRandomOpens) return { counts, gated: true };
  return {
    counts: { ...counts, randomOpens: counts.randomOpens + 1 },
    gated: false,
  };
}

/**
 * The third distinct story asks. A story already read stays open to the
 * reader for good, including after the gate has started firing.
 */
export function recordStoryOpen(
  counts: GateCounts,
  storyId: string,
): GateDecision {
  if (!storyId || counts.storyIds.includes(storyId))
    return { counts, gated: false };
  if (counts.storyIds.length >= freeStoryOpens) return { counts, gated: true };
  return {
    counts: { ...counts, storyIds: [...counts.storyIds, storyId] },
    gated: false,
  };
}

/** How many free opens are left, for the line of copy in the modal. */
export function remainingStoryOpens(counts: GateCounts): number {
  return Math.max(0, freeStoryOpens - counts.storyIds.length);
}
