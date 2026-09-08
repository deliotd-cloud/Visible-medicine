import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readContentJson } from './content-contract-tools.mjs';
const hash = (value) =>
  createHash('sha256').update(JSON.stringify(value)).digest('hex');

/** Offline preservation only; runtime and exports always use current lessons. */
export async function authoringBeforeCranialBones(context) {
  const { api, catalog } = context;
  const before = await readContentJson(
    'content/cranial-bone-curriculum.before.json',
  );
  const after = await readContentJson(
    'content/cranial-bone-curriculum.transition.json',
  );
  assert.equal(
    hash(before),
    '7d1c46923c0fd5910b977bdbdf2451184163e448b4df2cccedca86134aad8bb7',
  );
  assert.equal(
    hash(after),
    '8ec7f1d909174d223c3ce934c6e0ded5467cd7edab6d7b54aefea0f002af9f09',
  );
  assert.equal(before.sourceCommit, '4ac6e32ba235be3181b93f64b8ef6c85d05ab906');
  assert.equal(after.sourceCommit, before.sourceCommit);
  assert.equal(before.scope, 'body');
  assert.deepEqual(before.regions, ['head-neck']);
  assert.deepEqual(before.tabs, ['anatomy', 'function']);
  assert.equal(before.entries.length, 23);
  assert.deepEqual(
    after.entries.map((e) => [e.id, e.fmaId]),
    before.entries.map((e) => [e.id, e.fmaId]),
  );
  const originals = new Map();
  for (const [i, e] of before.entries.entries()) {
    const s = catalog.structures.find((s) => s.id === e.id);
    assert(
      s &&
        s.system === 'skeleton' &&
        s.category === 'bone' &&
        s.region === 'head-neck' &&
        ['left', 'right', 'midline'].includes(s.laterality) &&
        before.regions.some((r) => s.regions.includes(r)),
    );
    assert.equal(s.fmaId, e.fmaId);
    assert.equal(s.name, e.name);
    for (const t of before.tabs) {
      assert.equal(
        e.sections[t].readiness,
        t === 'anatomy' ? 'identity-only' : 'pending',
      );
      const lesson = api.bodyLesson(s, t);
      assert.equal(lesson.readiness, 'draft');
      assert.equal(
        hash(lesson),
        after.entries[i].sections[t],
        'Unrecorded cranial-bone edit: ' + s.id + ' ' + t,
      );
      const { readiness: _readiness, ...displayed } = lesson;
      assert.deepEqual(displayed, api.bodyContent(s, t));
    }
    originals.set(s.id, e.sections);
  }
  assert.equal(originals.size, 23);
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
