'use client';

import { create } from 'zustand';
import {
  emptyCounts,
  parseCounts,
  recordRandomOpen,
  recordStoryOpen,
  type GateCounts,
  type GateTrigger,
} from '@/lib/signup-gate';

const storageKey = 'global-fail-map-signup-gate';

function readCounts(): GateCounts {
  try {
    const raw = localStorage.getItem(storageKey);
    return raw ? parseCounts(JSON.parse(raw)) : emptyCounts;
  } catch {
    /* Private browsing and disabled storage leave the reader ungated. */
    return emptyCounts;
  }
}

function writeCounts(counts: GateCounts) {
  try {
    localStorage.setItem(storageKey, JSON.stringify(counts));
  } catch {
    /* The counters are a nudge, not a paywall. Losing them is survivable. */
  }
}

interface SignupGateStore {
  counts: GateCounts;
  /** Which rule opened the modal, so the copy can name it. */
  trigger: GateTrigger | null;
  hydrated: boolean;
  hydrate: () => void;
  /**
   * Each of these returns true when the action was blocked, and the caller is
   * expected to stop and let the modal do the talking.
   *
   * `enforce` separates counting from blocking. While the session request is
   * still in flight nobody knows yet whether this reader has an account, so
   * the atlas keeps tallying but lets the action through rather than risk
   * showing a sign-up wall to somebody already signed in. The tally survives,
   * so the ask arrives on the next action once the answer is known.
   */
  gateRandom: (enforce: boolean) => boolean;
  gateStory: (storyId: string, enforce: boolean) => boolean;
  /**
   * Research takes no `enforce`: it cannot run without an account under any
   * circumstance, so it always asks rather than waiting on the session.
   */
  gateResearch: () => boolean;
  dismiss: () => void;
  reset: () => void;
}

export const useSignupGate = create<SignupGateStore>((set, get) => ({
  counts: emptyCounts,
  trigger: null,
  hydrated: false,
  hydrate: () => {
    if (get().hydrated) return;
    set({ counts: readCounts(), hydrated: true });
  },
  gateRandom: (enforce) => {
    const { counts, gated } = recordRandomOpen(get().counts);
    if (gated) {
      if (!enforce) return false;
      set({ trigger: 'random' });
      return true;
    }
    writeCounts(counts);
    set({ counts });
    return false;
  },
  gateStory: (storyId, enforce) => {
    const { counts, gated } = recordStoryOpen(get().counts, storyId);
    if (gated) {
      if (!enforce) return false;
      set({ trigger: 'stories' });
      return true;
    }
    if (counts !== get().counts) {
      writeCounts(counts);
      set({ counts });
    }
    return false;
  },
  /* Research needs an account on the first attempt, so nothing is counted. */
  gateResearch: () => {
    set({ trigger: 'research' });
    return true;
  },
  dismiss: () => set({ trigger: null }),
  reset: () => {
    try {
      localStorage.removeItem(storageKey);
    } catch {
      /* Nothing to clear. */
    }
    set({ counts: emptyCounts, trigger: null });
  },
}));
