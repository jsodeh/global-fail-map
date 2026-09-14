import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  emptyCounts,
  freeRandomOpens,
  freeStoryOpens,
  parseCounts,
  recordRandomOpen,
  recordStoryOpen,
  remainingStoryOpens,
  type GateCounts,
} from '../src/lib/signup-gate';

test('one random story is free and the second asks for an account', () => {
  let counts: GateCounts = emptyCounts;

  const first = recordRandomOpen(counts);
  assert.equal(first.gated, false);
  counts = first.counts;
  assert.equal(counts.randomOpens, freeRandomOpens);

  const second = recordRandomOpen(counts);
  assert.equal(second.gated, true);
  /* A blocked click is not spent, so the ask repeats on the next one. */
  assert.equal(second.counts.randomOpens, freeRandomOpens);
  assert.equal(recordRandomOpen(second.counts).gated, true);
});

test('two explored stories are free and the third asks for an account', () => {
  let counts: GateCounts = emptyCounts;
  for (const id of ['concorde', 'ajaokuta']) {
    const step = recordStoryOpen(counts, id);
    assert.equal(step.gated, false, `${id} should open freely`);
    counts = step.counts;
  }
  assert.equal(counts.storyIds.length, freeStoryOpens);
  assert.equal(remainingStoryOpens(counts), 0);

  const third = recordStoryOpen(counts, 'seasteading');
  assert.equal(third.gated, true);
  assert.deepEqual(third.counts.storyIds, counts.storyIds);
});

test('a story already read reopens freely, before and after the gate', () => {
  let counts: GateCounts = emptyCounts;
  counts = recordStoryOpen(counts, 'concorde').counts;

  const reopened = recordStoryOpen(counts, 'concorde');
  assert.equal(reopened.gated, false);
  /* Rereading must not burn one of the free opens. */
  assert.deepEqual(reopened.counts.storyIds, ['concorde']);

  counts = recordStoryOpen(counts, 'ajaokuta').counts;
  assert.equal(recordStoryOpen(counts, 'seasteading').gated, true);
  assert.equal(recordStoryOpen(counts, 'concorde').gated, false);
});

test('the two tallies are independent', () => {
  let counts: GateCounts = emptyCounts;
  counts = recordRandomOpen(counts).counts;
  assert.equal(recordRandomOpen(counts).gated, true);
  /* Exhausting the shuffle must not close the explore list. */
  assert.equal(recordStoryOpen(counts, 'concorde').gated, false);
});

test('unusable stored counters reset instead of throwing', () => {
  assert.deepEqual(parseCounts(null), emptyCounts);
  assert.deepEqual(parseCounts('nonsense'), emptyCounts);
  assert.deepEqual(
    parseCounts({ randomOpens: -4, storyIds: 'concorde' }),
    emptyCounts,
  );
  assert.deepEqual(
    parseCounts({ randomOpens: Number.NaN, storyIds: [1, null] }),
    emptyCounts,
  );
  assert.deepEqual(
    parseCounts({ randomOpens: 1.8, storyIds: ['a', 'a', ''] }),
    {
      randomOpens: 1,
      storyIds: ['a'],
    },
  );
});

test('counters restored from storage keep their place in the tally', () => {
  const restored = parseCounts(
    JSON.parse(JSON.stringify({ randomOpens: 1, storyIds: ['a', 'b'] })),
  );
  assert.equal(recordRandomOpen(restored).gated, true);
  assert.equal(recordStoryOpen(restored, 'd').gated, true);
});
