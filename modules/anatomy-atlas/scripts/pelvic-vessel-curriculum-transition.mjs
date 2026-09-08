import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readContentJson } from './content-contract-tools.mjs';
const hash = (value) =>
  createHash('sha256').update(JSON.stringify(value)).digest('hex');

/** Offline preservation only; runtime and exports always use current lessons. */
export async function authoringBeforePelvicVessels(context) {
  const { api, catalog } = context;
  const before = await readContentJson(
    'content/pelvic-vessel-curriculum.before.json',
  );
  const after = await readContentJson(
    'content/pelvic-vessel-curriculum.transition.json',
  );
  assert.equal(
    hash(before),
    'fb24260302fd0082486b582cf9baa7e6a4d7644b9e0ad44e87dfab085a82a9a7',
  );
  assert.equal(
    hash(after),
    '37d8c931ebd2cd77b060011f2350961da9ae9b12c37d5df5851d5f8d0f392199',
  );
  assert.equal(before.sourceCommit, '39217578761b3c5aa2870fa84ea64c25b964be9d');
  assert.equal(after.sourceCommit, before.sourceCommit);
  assert.equal(before.scope, 'body');
  assert.deepEqual(before.regions, ['pelvis']);
  assert.deepEqual(before.tabs, ['anatomy', 'function']);
  assert.equal(before.entries.length, 12);
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
        'Unrecorded pelvic-vessel edit: ' + s.id + ' ' + t,
      );
      const { readiness: _readiness, ...displayed } = lesson;
      assert.deepEqual(displayed, api.bodyContent(s, t));
    }
    originals.set(s.id, e.sections);
  }
  assert.equal(originals.size, 12);
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
