import assert from 'node:assert/strict';
import { readContentJson } from './content-contract-tools.mjs';
import { createHash } from 'node:crypto';
const hash = (v) =>
  createHash('sha256').update(JSON.stringify(v)).digest('hex');
/** Offline historical comparison only. Runtime/export always use current teaching. */
export async function authoringBeforePelvicVesselClinical(context) {
  const { api, catalog } = context;
  const before = await readContentJson(
    'content/pelvic-vessel-clinical-curriculum.before.json',
  );
  const after = await readContentJson(
    'content/pelvic-vessel-clinical-curriculum.transition.json',
  );
  assert.equal(
    hash(before),
    '9c3356e9c15acf9127e5681b68a70db65b300b2b2e923d5e171aa9904a6520b4',
  );
  assert.equal(
    hash(after),
    '8dc23311cd7de7d7707db5acaecf0abf9c3008f87d6be30c741b5cf7ae90a3f5',
  );
  assert.equal(before.sourceCommit, 'a605cf0785e741deeacb9cf6df376fe8a53facdf');
  assert.equal(after.sourceCommit, before.sourceCommit);
  assert.equal(before.scope, 'body');
  assert.deepEqual(before.regions, ['pelvis']);
  assert.equal(before.entries.length, 12);
  assert.deepEqual(
    after.entries.map((e) => [e.id, e.fmaId]),
    before.entries.map((e) => [e.id, e.fmaId]),
  );
  const originals = new Map();
  for (const [i, e] of before.entries.entries()) {
    const s = catalog.structures.find((s) => s.id === e.id);
    assert(s && s.system === 'vessels');
    for (const [field, key] of [
      ['fmaId', 'fmaId'],
      ['name', 'name'],
      ['category', 'category'],
      ['laterality', 'side'],
      ['region', 'region'],
      ['regions', 'regions'],
      ['sourceTree', 'tree'],
    ])
      assert.deepEqual(s[field], e[key]);
    assert.deepEqual(
      s.sources.map((p) => p.file),
      e.files,
    );
    for (const sections of [e.sections, after.entries[i].sections])
      assert.deepEqual(Object.keys(sections), ['pathology', 'clinical']);
    for (const t of ['pathology', 'clinical']) {
      assert.equal(e.sections[t].readiness, 'pending');
      const lesson = api.bodyLesson(s, t);
      assert.equal(lesson.readiness, 'draft');
      assert.equal(
        hash(lesson),
        after.entries[i].sections[t],
        'Unrecorded pelvic vessel clinical edit: ' + s.id + ' / ' + t,
      );
      const { readiness: _r, ...shown } = lesson;
      assert.deepEqual(shown, api.bodyContent(s, t));
      originals.set(s.id + '|' + t, e.sections[t]);
    }
  }
  assert.equal(originals.size, 24);
  const bodyLesson = (s, t) =>
    originals.has(s.id + '|' + t)
      ? structuredClone(originals.get(s.id + '|' + t))
      : api.bodyLesson(s, t);
  const bodyContent = (s, t) => {
    if (!originals.has(s.id + '|' + t)) return api.bodyContent(s, t);
    const { readiness: _r, ...shown } = bodyLesson(s, t);
    return shown;
  };
  return { ...api, bodyLesson, bodyContent };
}
