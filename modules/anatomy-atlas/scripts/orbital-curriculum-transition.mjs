import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readContentJson } from './content-contract-tools.mjs';
const hash = (value) =>
  createHash('sha256').update(JSON.stringify(value)).digest('hex');

/** Offline preservation only; current runtime/exported lessons remain intact. */
export async function authoringBeforeOrbital(context) {
  const { api, catalog } = context;
  const before = await readContentJson(
    'content/orbital-curriculum.before.json',
  );
  const after = await readContentJson(
    'content/orbital-curriculum.transition.json',
  );
  assert.equal(
    hash(before),
    '75e00e2db5b51890dd66cd5cd6a644bdf062cbbe1ebb73dcced904984143b9df',
  );
  assert.equal(
    hash(after),
    'e2ecc91bdd02fcdca73af52585b424aa06e91d2f58ecac6bce1231252a64338f',
  );
  assert.equal(before.sourceCommit, '4b11005158a0d9ff1f79b68b1fc4f5ffb5ca0699');
  assert.equal(after.sourceCommit, before.sourceCommit);
  assert.equal(before.scope, 'body');
  assert.equal(before.region, 'head-neck');
  assert.deepEqual(before.tabs, ['anatomy', 'function']);
  assert.equal(before.entries.length, 14);
  assert.deepEqual(
    after.entries.map((e) => [e.id, e.fmaId]),
    before.entries.map((e) => [e.id, e.fmaId]),
  );
  const originals = new Map();
  for (const [i, entry] of before.entries.entries()) {
    const s = catalog.structures.find((s) => s.id === entry.id);
    assert(s && s.system === 'muscles' && s.regions.includes('head-neck'));
    assert.equal(s.fmaId, entry.fmaId);
    assert.equal(s.name, entry.name);
    for (const t of before.tabs) {
      assert.equal(
        entry.sections[t].readiness,
        t === 'anatomy' ? 'identity-only' : 'pending',
      );
      const lesson = api.bodyLesson(s, t);
      assert.equal(lesson.readiness, 'draft');
      assert.equal(
        hash(lesson),
        after.entries[i].sections[t],
        'Unrecorded orbital change: ' + s.id + ' ' + t,
      );
      const { readiness: _readiness, ...displayed } = lesson;
      assert.deepEqual(displayed, api.bodyContent(s, t));
    }
    originals.set(s.id, entry.sections);
  }
  assert.equal(originals.size, 14);
  const bodyLesson = (s, t) =>
    originals.get(s.id)?.[t]
      ? structuredClone(originals.get(s.id)[t])
      : api.bodyLesson(s, t);
  const bodyContent = (s, t) => {
    if (!originals.get(s.id)?.[t]) return api.bodyContent(s, t);
    const { readiness: _readiness, ...displayed } = bodyLesson(s, t);
    return displayed;
  };
  return { ...api, bodyLesson, bodyContent };
}
