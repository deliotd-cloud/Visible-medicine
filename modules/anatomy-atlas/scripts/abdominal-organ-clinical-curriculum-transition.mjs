import assert from 'node:assert/strict';
import { readContentJson } from './content-contract-tools.mjs';
import { createHash } from 'node:crypto';
const hash = (v) =>
  createHash('sha256').update(JSON.stringify(v)).digest('hex');
/** Offline historical comparison only. Runtime/export always use current teaching. */
export async function authoringBeforeAbdominalOrganClinical(context) {
  const { api, catalog } = context;
  const before = await readContentJson(
    'content/abdominal-organ-clinical-curriculum.before.json',
  );
  const after = await readContentJson(
    'content/abdominal-organ-clinical-curriculum.transition.json',
  );
  assert.equal(
    hash(before),
    '54425ab24ea5df9f3fba965b42a4bbf1ca1d1f90564d280c0a37298bf79de938',
  );
  assert.equal(
    hash(after),
    '24df7202944aa26e57c5b0dc6d51f0211cb7be89888196dfa2adcf4dbb4346b6',
  );
  assert.equal(before.sourceCommit, '8a289acdb4b9e0818f0fcd6072be4d8779582367');
  assert.equal(after.sourceCommit, before.sourceCommit);
  assert.equal(before.scope, 'body');
  assert.deepEqual(before.regions, ['abdomen', 'pelvis']);
  assert.equal(before.entries.length, 17);
  assert.deepEqual(
    after.entries.map((e) => [e.id, e.fmaId]),
    before.entries.map((e) => [e.id, e.fmaId]),
  );
  const originals = new Map();
  for (const [i, e] of before.entries.entries()) {
    const s = catalog.structures.find((s) => s.id === e.id);
    assert(s && s.system === 'organs');
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
        'Unrecorded abdominal organ clinical edit: ' + s.id + ' / ' + t,
      );
      const { readiness: _r, ...shown } = lesson;
      assert.deepEqual(shown, api.bodyContent(s, t));
      originals.set(s.id + '|' + t, e.sections[t]);
    }
  }
  assert.equal(originals.size, 34);
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
