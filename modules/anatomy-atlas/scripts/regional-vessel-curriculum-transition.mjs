import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readContentJson } from './content-contract-tools.mjs';
const hash = (value) =>
  createHash('sha256').update(JSON.stringify(value)).digest('hex');

/** Offline preservation only; runtime and exports always use current lessons. */
export async function authoringBeforeRegionalVessels(context) {
  const { api, catalog } = context;
  const before = await readContentJson(
    'content/regional-vessel-curriculum.before.json',
  );
  const after = await readContentJson(
    'content/regional-vessel-curriculum.transition.json',
  );
  assert.equal(
    hash(before),
    '76b7eaa5ae37d1b828e49dc445252eaaf73620ac9474a80bcf25bbfa5a4bb124',
  );
  assert.equal(
    hash(after),
    '5a76cffec75f754ffad15ff1513c95789ee0d39965837053fc3da9bcede034a7',
  );
  assert.equal(before.sourceCommit, '3722ecef2403a34e80b542cead884944c1387017');
  assert.equal(after.sourceCommit, before.sourceCommit);
  assert.equal(before.scope, 'body');
  assert.deepEqual(before.regions, ['head-neck', 'thigh', 'leg', 'foot']);
  assert.deepEqual(before.tabs, ['anatomy', 'function']);
  assert.equal(before.entries.length, 40);
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
        'Unrecorded regional-vessel edit: ' + s.id + ' ' + t,
      );
      const { readiness: _readiness, ...displayed } = lesson;
      assert.deepEqual(displayed, api.bodyContent(s, t));
    }
    originals.set(s.id, e.sections);
  }
  assert.equal(originals.size, 40);
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
