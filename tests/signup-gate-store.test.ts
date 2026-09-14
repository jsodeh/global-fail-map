import assert from 'node:assert/strict';
import { test } from 'node:test';

/**
 * The store is where counting and blocking are told apart, so it is tested
 * against a stub of the one browser API it touches. The stub is installed
 * before the module loads, because the store reads storage on hydrate.
 */
const stored: Record<string, string> = {};
(globalThis as unknown as { localStorage: unknown }).localStorage = {
  getItem: (key: string) => (key in stored ? stored[key] : null),
  setItem: (key: string, value: string) => {
    stored[key] = value;
  },
  removeItem: (key: string) => {
    delete stored[key];
  },
};

const storageKey = 'global-fail-map-signup-gate';

async function freshGate() {
  const { useSignupGate } = await import('../src/lib/stores/use-signup-gate');
  useSignupGate.getState().reset();
  return () => useSignupGate.getState();
}

test('while the session is unknown the atlas counts but never blocks', async () => {
  const gate = await freshGate();

  assert.equal(gate().gateRandom(false), false);
  assert.equal(gate().counts.randomOpens, 1);

  /*
   * Past the cap but still unenforced: a reader who may turn out to be
   * signed in is let through rather than shown a sign-up wall.
   */
  assert.equal(gate().gateRandom(false), false);
  assert.equal(gate().trigger, null);

  /* The tally survived, so the ask lands as soon as the session answers. */
  assert.equal(
    stored[storageKey],
    JSON.stringify({ randomOpens: 1, storyIds: [] }),
  );
  assert.equal(gate().gateRandom(true), true);
  assert.equal(gate().trigger, 'random');
});

test('a research click always asks, even before the session has answered', async () => {
  const gate = await freshGate();
  /*
   * No `enforce` argument exists here on purpose. Research cannot run signed
   * out, so there is no window in which letting it through helps anyone.
   */
  assert.equal(gate().gateResearch(), true);
  assert.equal(gate().trigger, 'research');

  gate().dismiss();
  assert.equal(gate().gateResearch(), true);
});

test('explored stories are counted while unknown and blocked once known', async () => {
  const gate = await freshGate();
  for (const id of ['a', 'b'])
    assert.equal(gate().gateStory(id, false), false);
  assert.deepEqual(gate().counts.storyIds, ['a', 'b']);

  assert.equal(gate().gateStory('c', false), false);
  assert.equal(gate().trigger, null);
  assert.equal(gate().gateStory('c', true), true);
  assert.equal(gate().trigger, 'stories');

  /* A story already read stays open even with the ask armed. */
  assert.equal(gate().gateStory('a', true), false);
});

test('signing in clears the tally from memory and from storage', async () => {
  const gate = await freshGate();
  gate().gateRandom(false);
  gate().gateStory('a', false);
  assert.ok(stored[storageKey]);

  gate().reset();
  assert.equal(stored[storageKey], undefined);
  assert.deepEqual(gate().counts, { randomOpens: 0, storyIds: [] });
  assert.equal(gate().trigger, null);
});
