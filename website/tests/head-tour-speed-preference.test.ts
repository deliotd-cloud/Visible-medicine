import assert from 'node:assert/strict';
import test from 'node:test';
import {HEAD_TOUR_SPEEDS} from '../lib/head-tour-playback.ts';
import {HEAD_TOUR_SPEED_PREFERENCE_KEY, readHeadTourSpeedPreference, writeHeadTourSpeedPreference} from '../lib/head-tour-speed-preference.ts';

test('reads only exact supported speeds and never writes during hydration', () => {
  let raw: string | null = null;
  const writes: Array<[string, string]> = [];
  const storage = () => ({
    getItem(key: string) { assert.equal(key, HEAD_TOUR_SPEED_PREFERENCE_KEY); return raw; },
    setItem(key: string, value: string) { writes.push([key, value]); raw = value; },
  });
  assert.equal(readHeadTourSpeedPreference(storage), null);
  for (const speed of HEAD_TOUR_SPEEDS) {
    raw = String(speed);
    assert.equal(readHeadTourSpeedPreference(storage), speed);
  }
  for (const stale of ['0', '4', '1.0', '01', 'NaN', 'Infinity', 'playing', '{}', '']) {
    raw = stale;
    assert.equal(readHeadTourSpeedPreference(storage), null);
  }
  assert.deepEqual(writes, []);
  assert.equal(writeHeadTourSpeedPreference(storage, 1.5), true);
  assert.deepEqual(writes, [[HEAD_TOUR_SPEED_PREFERENCE_KEY, '1.5']]);
  assert.equal(readHeadTourSpeedPreference(storage), 1.5);
});

test('ignores unsupported writes and unavailable or throwing storage', () => {
  let writes = 0;
  const storage = () => ({getItem: () => null, setItem: () => { writes++; }});
  for (const speed of [0, 1.25, 4, NaN, Infinity]) {
    assert.equal(writeHeadTourSpeedPreference(storage, speed), false);
  }
  assert.equal(writes, 0);
  assert.equal(readHeadTourSpeedPreference(() => null), null);
  assert.equal(writeHeadTourSpeedPreference(() => null, 2), false);
  const inaccessible = () => { throw Error('storage getter blocked'); };
  assert.equal(readHeadTourSpeedPreference(inaccessible), null);
  assert.equal(writeHeadTourSpeedPreference(inaccessible, 2), false);
  assert.equal(readHeadTourSpeedPreference(() => ({getItem() { throw Error('read blocked'); }, setItem() {}})), null);
  assert.equal(writeHeadTourSpeedPreference(() => ({getItem() { return null; }, setItem() { throw Error('write blocked'); }}), 2), false);
});
