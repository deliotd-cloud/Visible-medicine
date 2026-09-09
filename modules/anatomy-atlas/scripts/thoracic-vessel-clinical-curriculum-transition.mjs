import assert from 'node:assert/strict';
import { readContentJson } from './content-contract-tools.mjs';
import { createHash } from 'node:crypto';
const hash = (v) =>
  createHash('sha256').update(JSON.stringify(v)).digest('hex');
/** Offline historical comparison only. Runtime/export always use current teaching. */
export async function authoringBeforeThoracicVesselClinical(context) {
  const { api, catalog } = context;
  const before = await readContentJson(
    'content/thoracic-vessel-clinical-curriculum.before.json',
  );
  const after = await readContentJson(
    'content/thoracic-vessel-clinical-curriculum.transition.json',
  );
  assert.equal(
    hash(before),
    'e7616faa6a48bb07818a2307dbb68c44dd09291f2cd9e9c1fb0203463011adbf',
  );
  assert.equal(
    hash(after),
    '65ebd386ff4520eebffae7a3d0a589da31e3c53f4256e58909bb3d031be33d76',
  );
  assert.equal(before.sourceCommit, '910684092e85f0063a2e6a84552ae6757a0ca1ae');
  assert.equal(after.sourceCommit, before.sourceCommit);
  assert.equal(before.scope, 'body');
  assert.deepEqual(before.regions, ['thorax']);
  assert.equal(before.entries.length, 38);
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
        'Unrecorded thoracic vessel clinical edit: ' + s.id + ' / ' + t,
      );
      const { readiness: _r, ...shown } = lesson;
      assert.deepEqual(shown, api.bodyContent(s, t));
      originals.set(s.id + '|' + t, e.sections[t]);
    }
  }
  assert.equal(originals.size, 76);
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
