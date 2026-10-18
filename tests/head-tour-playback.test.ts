import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createHeadTourPlaybackController,
  HEAD_TOUR_READING_MS,
  type HeadTourPlaybackContext,
  type HeadTourPlaybackState,
} from '../lib/head-tour-playback.ts';

const revision = 'a'.repeat(64);

function fixture() {
  let now = 0;
  let serial = 0;
  let allowed = true;
  const jobs = new Map<number, {at: number; callback: () => void; canceled: boolean}>();
  const notices: HeadTourPlaybackState[] = [];
  const advances: string[] = [];
  let onState = (_state: HeadTourPlaybackState) => {};
  let onAdvance = (_id: string) => {};
  const controller = createHeadTourPlaybackController({
    schedule(callback, milliseconds) {
      const id = ++serial;
      jobs.set(id, {at: now + milliseconds, callback, canceled: false});
      return id;
    },
    cancel(handle) { const job = jobs.get(handle as number); if (job) job.canceled = true; },
    canAdvance: () => allowed,
    onState(state) { notices.push(state); onState(state); },
  });
  const identity = {};
  const step = (index = 0, changes: Partial<HeadTourPlaybackContext> = {}): HeadTourPlaybackContext => ({
    identity, revision, sequenceId: 'synthetic-sequence', stepId: ['one', 'two', 'three'][index],
    index, total: 3, nextId: ['two', 'three', null][index], ready: true, blocked: false,
    onAdvance(id) { advances.push(id); onAdvance(id); },
    ...changes,
  });
  const pending = () => [...jobs.entries()].filter(([, job]) => !job.canceled).map(([id, job]) => ({id, at: job.at}));
  function fire(id: number) { jobs.get(id)?.callback(); }
  function tick(milliseconds: number) {
    const target = now + milliseconds;
    while (true) {
      const due = [...jobs.entries()].filter(([, job]) => !job.canceled && job.at <= target)
        .sort((a, b) => a[1].at - b[1].at || a[0] - b[0])[0];
      if (!due) break;
      now = due[1].at;
      jobs.delete(due[0]);
      due[1].callback();
    }
    now = target;
  }
  return {controller, step, pending, fire, tick, advances, notices,
    setAllowed(value: boolean) { allowed = value; },
    onState(callback: typeof onState) { onState = callback; },
    onAdvance(callback: typeof onAdvance) { onAdvance = callback; },
  };
}

test('requires explicit play, then spends the full reading dwell at each allowed speed', () => {
  assert.equal(HEAD_TOUR_READING_MS, 12000);
  for (const speed of [0.5, 1, 1.5, 2] as const) {
    const f = fixture();
    f.controller.update(f.step());
    assert.deepEqual(f.pending(), []);
    assert.equal(f.controller.state().playing, false);
    f.controller.setSpeed(speed);
    assert.equal(f.controller.play(), true);
    assert.deepEqual(f.pending().map(job => job.at), [12000 / speed]);
    f.tick(12000 / speed - 1);
    assert.deepEqual(f.advances, []);
    f.tick(1);
    assert.deepEqual(f.advances, ['two']);
  }
});

test('waits for exact readiness before dwell and for next committed step before another dwell', () => {
  const f = fixture();
  f.controller.update(f.step(0, {ready: false}));
  assert.equal(f.controller.play(), true);
  f.tick(20000);
  assert.deepEqual(f.pending(), []);
  f.controller.update(f.step(0, {ready: true}));
  assert.deepEqual(f.pending().map(job => job.at), [32000]);
  f.tick(12000);
  assert.deepEqual(f.advances, ['two']);
  f.controller.update(f.step(0, {ready: true}));
  f.tick(24000);
  assert.deepEqual(f.advances, ['two']);
  assert.deepEqual(f.pending(), []);
  f.controller.update(f.step(1, {ready: false}));
  f.tick(24000);
  assert.deepEqual(f.advances, ['two']);
  assert.deepEqual(f.pending(), []);
  f.controller.update(f.step(1));
  f.tick(11999);
  assert.deepEqual(f.advances, ['two']);
  f.tick(1);
  assert.deepEqual(f.advances, ['two', 'three']);
});

test('losing readiness during a dwell retires it and requires a fresh full dwell', () => {
  const f = fixture();
  f.controller.update(f.step());
  f.controller.play();
  f.tick(6000);
  const stale = f.pending()[0].id;
  f.controller.update(f.step(0, {ready: false}));
  f.fire(stale);
  f.tick(30000);
  assert.deepEqual(f.advances, []);
  assert.equal(f.controller.state().playing, true);
  f.controller.update(f.step());
  f.tick(11999);
  assert.deepEqual(f.advances, []);
  f.tick(1);
  assert.deepEqual(f.advances, ['two']);
});

test('missing canonical step pauses and does not skip or restart without user action', () => {
  const f = fixture();
  f.controller.update(f.step());
  f.controller.play();
  f.tick(12000);
  f.controller.update(f.step(1, {blocked: true, ready: false}));
  assert.deepEqual(f.advances, ['two']);
  assert.equal(f.controller.state().playing, false);
  f.controller.update(f.step(1));
  f.tick(120000);
  assert.deepEqual(f.advances, ['two']);
  assert.equal(f.controller.play(), true);
  f.tick(12000);
  assert.deepEqual(f.advances, ['two', 'three']);
});

test('final dwell finishes without navigating or recording another action', () => {
  const f = fixture();
  f.controller.update(f.step(2));
  f.controller.play();
  f.tick(11999);
  assert.equal(f.controller.state().finished, false);
  f.tick(1);
  assert.deepEqual(f.advances, []);
  assert.deepEqual(f.pending(), []);
  assert.deepEqual(f.controller.state(), {playing: false, finished: true, speed: 1});
});

test('unexpected step, source identity, sequence, revision, and reset retire old callbacks', () => {
  const changes: Array<Partial<HeadTourPlaybackContext>> = [
    {stepId: 'unexpected'}, {identity: {}}, {sequenceId: 'other-sequence'},
    {revision: 'b'.repeat(64)}, {stepId: null}, {total: 4},
  ];
  for (const change of changes) {
    const f = fixture();
    f.controller.update(f.step());
    f.controller.play();
    const stale = f.pending()[0].id;
    f.controller.update(f.step(0, change));
    f.fire(stale);
    f.tick(120000);
    assert.deepEqual(f.advances, [], JSON.stringify(change));
    assert.equal(f.controller.state().playing, false);
  }
});

test('manual pause and a previously queued callback cannot advance', () => {
  const f = fixture();
  f.controller.update(f.step());
  f.controller.play();
  const stale = f.pending()[0].id;
  f.controller.pause();
  f.fire(stale);
  f.tick(12000);
  assert.deepEqual(f.advances, []);
  assert.equal(f.controller.state().playing, false);
});

test('speed accepts only the offered values and restarts a fresh dwell on change', () => {
  const f = fixture();
  f.controller.update(f.step());
  f.controller.play();
  f.tick(4000);
  const stale = f.pending()[0].id;
  for (const value of [0, -1, 0.75, 3, NaN, Infinity]) f.controller.setSpeed(value);
  assert.deepEqual(f.pending().map(job => job.at), [12000]);
  assert.equal(f.controller.state().speed, 1);
  f.controller.setSpeed(2);
  f.fire(stale);
  assert.deepEqual(f.pending().map(job => job.at), [10000]);
  f.tick(5999);
  assert.deepEqual(f.advances, []);
  f.tick(1);
  assert.deepEqual(f.advances, ['two']);
});

test('canAdvance denies start and stops a queued advance when permission disappears', () => {
  const f = fixture();
  f.controller.update(f.step());
  f.setAllowed(false);
  assert.equal(f.controller.play(), false);
  assert.deepEqual(f.pending(), []);
  f.setAllowed(true);
  assert.equal(f.controller.play(), true);
  f.setAllowed(false);
  f.tick(12000);
  assert.deepEqual(f.advances, []);
  assert.equal(f.controller.state().playing, false);
});

test('reentrant pause or source update during play notification cannot arm a timer', () => {
  for (const action of ['pause', 'update'] as const) {
    const f = fixture();
    f.controller.update(f.step());
    f.onState(state => {
      if (!state.playing) return;
      if (action === 'pause') f.controller.pause();
      else f.controller.update(f.step(0, {identity: {}}));
    });
    assert.equal(f.controller.play(), false);
    assert.deepEqual(f.pending(), []);
    assert.deepEqual(f.advances, []);
  }
});

test('reentrant pause or update inside advance cannot queue another canonical step', () => {
  for (const action of ['pause', 'update'] as const) {
    const f = fixture();
    f.controller.update(f.step());
    f.onAdvance(() => {
      if (action === 'pause') f.controller.pause();
      else f.controller.update(f.step(1, {ready: false}));
    });
    f.controller.play();
    f.tick(12000);
    assert.deepEqual(f.advances, ['two']);
    assert.deepEqual(f.pending(), []);
    f.tick(120000);
    assert.deepEqual(f.advances, ['two']);
  }
});

test('synchronous committed next-step notification schedules exactly one next dwell', () => {
  const f = fixture();
  f.controller.update(f.step());
  f.onAdvance(() => f.controller.update(f.step(1)));
  f.controller.play();
  f.tick(12000);
  assert.deepEqual(f.advances, ['two']);
  assert.deepEqual(f.pending().map(job => job.at), [24000]);
  f.tick(12000);
  assert.deepEqual(f.advances, ['two', 'three']);
  assert.deepEqual(f.pending(), []);
});
