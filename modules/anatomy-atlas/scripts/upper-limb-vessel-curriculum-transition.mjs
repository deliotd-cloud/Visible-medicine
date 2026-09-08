import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readContentJson } from './content-contract-tools.mjs';
const hash = (value) =>
  createHash('sha256').update(JSON.stringify(value)).digest('hex');

/** Offline preservation only; runtime and exports always use current lessons. */
export async function authoringBeforeUpperLimbVessels(context) {
  const { api, catalog } = context;
  const before = await readContentJson(
    'content/upper-limb-vessel-curriculum.before.json',
  );
  const after = await readContentJson(
    'content/upper-limb-vessel-curriculum.transition.json',
  );
  assert.equal(
    hash(before),
    '12d932f18f153bb56b803a5a11de28d1eefa4d38ec00a7a4c4317e194e6b0e16',
  );
  assert.equal(
    hash(after),
    'da9ff9462962c652469e37295489113e1211c93a52579de050a8183c0fc44298',
  );
  assert.equal(before.sourceCommit, '35820915bdbfedccbff364cdcbd9ffa9156fdc4f');
  assert.equal(after.sourceCommit, before.sourceCommit);
  assert.equal(before.scope, 'body');
  assert.deepEqual(before.regions, ['shoulder-arm', 'forearm', 'hand']);
  assert.deepEqual(before.tabs, ['anatomy', 'function']);
  assert.equal(before.entries.length, 46);
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
        'Unrecorded upper-limb-vessel edit: ' + s.id + ' ' + t,
      );
      const { readiness: _readiness, ...displayed } = lesson;
      assert.deepEqual(displayed, api.bodyContent(s, t));
    }
    originals.set(s.id, e.sections);
  }
  assert.equal(originals.size, 46);
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
