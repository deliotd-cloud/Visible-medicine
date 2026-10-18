import assert from 'node:assert/strict';
import test from 'node:test';
import {createHeadSlicePlaybackController, type HeadSlicePlaybackController} from '../lib/head-slice-playback.ts';

function clock() {
  let next = 0;
  const pending = new Map<number, {callback: () => void; delay: number}>();
  const callbacks = new Map<number, () => void>();
  return {
    pending,
    callbacks,
    schedule(callback: () => void, delay: number) {
      const id = ++next;
      callbacks.set(id, callback);
      pending.set(id, {callback, delay});
      return id;
    },
    cancel(handle: unknown) {pending.delete(handle as number);},
    tick() {
      assert.equal(pending.size, 1, 'exactly one tick is scheduled');
      const [id, task] = [...pending][0];
      pending.delete(id);
      task.callback();
    },
  };
}

for (const action of ['pause', 'reset', 'direction', 'count'] as const) {
  test(`playing notification can ${action} without leaving a retired start timer`, () => {
    const timer = clock(), emitted: number[] = [], states: boolean[] = [];
    let player: HeadSlicePlaybackController;
    player = createHeadSlicePlaybackController({slice: 1, sliceCount: 5, fps: 4, ...timer,
      onSlice: value => emitted.push(value),
      onPlayingChange(playing) {
        states.push(playing);
        if (!playing) return;
        if (action === 'pause') player.pause();
        if (action === 'reset') player.reset(3, 6, 2);
        if (action === 'direction') player.setDirection(-1);
        if (action === 'count') player.configure(6, 4);
      },
    });
    assert.equal(player.play(), false, 'the synchronous callback retired this start');
    assert.equal(player.isPlaying(), false);
    assert.equal(timer.pending.size, 0);
    for (const callback of timer.callbacks.values()) callback();
    assert.deepEqual(emitted, []);
    assert.deepEqual(states, [true, false]);
  });
}

test('playing notification speed change schedules only the replacement generation', () => {
  const timer = clock(), emitted: number[] = [];
  let player: HeadSlicePlaybackController;
  player = createHeadSlicePlaybackController({slice: 0, sliceCount: 5, fps: 4, ...timer,
    onSlice: value => emitted.push(value),
    onPlayingChange(playing) {if (playing) player.configure(5, 6);},
  });
  assert.equal(player.play(), false, 'the initial start was replaced during notification');
  assert.equal(player.isPlaying(), true);
  assert.equal(timer.pending.size, 1);
  assert.equal([...timer.pending.values()][0].delay, 1000 / 6);
  timer.tick();
  assert.deepEqual(emitted, [1]);
  assert.equal(timer.pending.size, 1);
  player.pause();
  assert.equal(timer.pending.size, 0);
});

test('playing notification pause and explicit replay preserve only the nested start', () => {
  const timer = clock(), emitted: number[] = [];
  let player: HeadSlicePlaybackController, redirected = false;
  player = createHeadSlicePlaybackController({slice: 0, sliceCount: 5, fps: 4, ...timer,
    onSlice: value => emitted.push(value),
    onPlayingChange(playing) {
      if (!playing || redirected) return;
      redirected = true;
      player.pause();
      assert.equal(player.play(), true);
    },
  });
  assert.equal(player.play(), false);
  timer.tick();
  assert.deepEqual(emitted, [1]);
  player.pause();
  assert.equal(timer.pending.size, 0);
});

test('restart does not overwrite a reset from its stopped notification', () => {
  const timer = clock(), emitted: number[] = [];
  let player: HeadSlicePlaybackController, redirect = false;
  player = createHeadSlicePlaybackController({slice: 2, sliceCount: 6, fps: 4, ...timer,
    onSlice: value => emitted.push(value),
    onPlayingChange(playing) {if (!playing && redirect) {redirect = false; player.reset(3, 6, 2);}},
  });
  player.play();
  const stale = timer.callbacks.get(1)!;
  redirect = true;
  assert.equal(player.restart(), false);
  assert.deepEqual(emitted, []);
  assert.equal(player.isPlaying(), false);
  assert.equal(timer.pending.size, 0);
  stale();
  player.play();
  timer.tick();
  assert.deepEqual(emitted, [4], 'the nested reset owns the next slice');
  player.pause();
});

for (const action of ['reset', 'direction'] as const) {
  test(`${action} applies its state before notifying so nested changes remain authoritative`, () => {
    const timer = clock(), emitted: number[] = [];
    let player: HeadSlicePlaybackController, redirect = false;
    player = createHeadSlicePlaybackController({slice: 2, sliceCount: 7, fps: 4, ...timer,
      onSlice: value => emitted.push(value),
      onPlayingChange(playing) {
        if (playing || !redirect) return;
        redirect = false;
        player.reset(4, 7, 6);
        player.setDirection(1);
        player.play();
      },
    });
    player.play();
    const stale = timer.callbacks.get(1)!;
    redirect = true;
    if (action === 'reset') player.reset(0, 3, 2);
    else player.setDirection(-1);
    stale();
    assert.deepEqual(emitted, []);
    assert.equal([...timer.pending.values()][0].delay, 1000 / 6);
    timer.tick();
    assert.deepEqual(emitted, [5], 'the nested stream retains its slice, count, speed and direction');
    player.pause();
  });
}

test('slice notification can replace playback and stale ticks cannot advance the new stream', () => {
  const timer = clock(), emitted: number[] = [];
  let player: HeadSlicePlaybackController, replaced = false;
  player = createHeadSlicePlaybackController({slice: 0, sliceCount: 5, fps: 4, ...timer,
    onSlice(value) {
      emitted.push(value);
      if (replaced) return;
      replaced = true;
      player.reset(4, 7, 2);
      player.setDirection(-1);
      player.play();
    },
  });
  player.play();
  const stale = timer.callbacks.get(1)!;
  timer.tick();
  assert.deepEqual(emitted, [1]);
  stale();
  assert.deepEqual(emitted, [1]);
  timer.tick();
  assert.deepEqual(emitted, [1, 3]);
  player.pause();
  assert.equal(timer.pending.size, 0);
});

for (const action of ['pause', 'reset', 'direction', 'count', 'speed'] as const) {
  test(`slice notification can ${action} without scheduling a stale follow-up`, () => {
    const timer = clock(), emitted: number[] = [];
    let player: HeadSlicePlaybackController, changed = false;
    player = createHeadSlicePlaybackController({slice: 0, sliceCount: 5, fps: 4, ...timer,
      onSlice(value) {
        emitted.push(value);
        if (changed) return;
        changed = true;
        if (action === 'pause') player.pause();
        if (action === 'reset') player.reset(3, 6, 2);
        if (action === 'direction') player.setDirection(-1);
        if (action === 'count') player.configure(6, 4);
        if (action === 'speed') player.configure(5, 6);
      },
    });
    player.play();
    const stale = timer.callbacks.get(1)!;
    timer.tick();
    stale();
    assert.deepEqual(emitted, [1]);
    if (action === 'speed') {
      assert.equal(player.isPlaying(), true);
      assert.equal(timer.pending.size, 1);
      assert.equal([...timer.pending.values()][0].delay, 1000 / 6);
      timer.tick();
      assert.deepEqual(emitted, [1, 2]);
    } else {
      assert.equal(player.isPlaying(), false);
      assert.equal(timer.pending.size, 0);
    }
    player.pause();
    assert.equal(timer.pending.size, 0);
  });
}
