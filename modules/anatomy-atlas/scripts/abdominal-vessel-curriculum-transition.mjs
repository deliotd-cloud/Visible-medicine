import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readContentJson } from './content-contract-tools.mjs';
const hash = (value) =>
  createHash('sha256').update(JSON.stringify(value)).digest('hex');

/** Offline preservation only; runtime and exports always use current lessons. */
export async function authoringBeforeAbdominalVessels(context) {
  const { api, catalog } = context;
  const before = await readContentJson(
    'content/abdominal-vessel-curriculum.before.json',
  );
  const after = await readContentJson(
    'content/abdominal-vessel-curriculum.transition.json',
  );
  assert.equal(
    hash(before),
    '3ce65798d1a24cfece2f125c80988f3d8d40b7f418d89f49818707a22ec73eb4',
  );
  assert.equal(
    hash(after),
    'cfbc47de0dfedebdf7dbcf215583a570e5d6bd91405c182f8989912ae551b969',
  );
  assert.equal(before.sourceCommit, '9cd9e2f29be0536c23e812c5f8ade06f011c9935');
  assert.equal(after.sourceCommit, before.sourceCommit);
  assert.equal(before.scope, 'body');
  assert.deepEqual(before.regions, ['abdomen']);
  assert.deepEqual(before.tabs, ['anatomy', 'function']);
  assert.equal(before.entries.length, 14);
  assert.deepEqual(
    after.entries.map((e) => [e.id, e.fmaId]),
    before.entries.map((e) => [e.id, e.fmaId]),
  );
  const originals = new Map();
  for (const [i, e] of before.entries.entries()) {
    const s = catalog.structures.find((s) => s.id === e.id);
    assert(
      s &&
        s.system === 'vessels' &&
        s.category === 'vessel' &&
        before.regions.includes(s.region) &&
        ['left', 'right', 'midline', 'unspecified'].includes(s.laterality) &&
        before.regions.some((r) => s.regions.includes(r)),
    );
    assert.equal(s.fmaId, e.fmaId);
    assert.equal(s.name, e.name);
    for (const t of before.tabs) {
      assert.equal(e.sections[t].readiness, 'identity-only');
      const lesson = api.bodyLesson(s, t);
      assert.equal(lesson.readiness, 'draft');
      assert.equal(
        hash(lesson),
        after.entries[i].sections[t],
        'Unrecorded abdominal-vessel edit: ' + s.id + ' ' + t,
      );
      const { readiness: _readiness, ...displayed } = lesson;
      assert.deepEqual(displayed, api.bodyContent(s, t));
    }
    originals.set(s.id, e.sections);
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
