import assert from 'node:assert/strict';
import { readContentJson } from './content-contract-tools.mjs';
import { createHash } from 'node:crypto';
const hash = (v) =>
  createHash('sha256').update(JSON.stringify(v)).digest('hex');
/** Offline historical comparison only. Runtime/export always use current teaching. */
export async function authoringBeforeThoracicOrganClinical(context) {
  const { api, catalog } = context;
  const before = await readContentJson(
    'content/thoracic-organ-clinical-curriculum.before.json',
  );
  const after = await readContentJson(
    'content/thoracic-organ-clinical-curriculum.transition.json',
  );
  assert.equal(
    hash(before),
    '55ad6207fb148a3a765a1097a30ab15a8671c7b7311cead5ac660e0b040828ef',
  );
  assert.equal(
    hash(after),
    '5109c32931bb50d07859b476a1b0fc2deec688c8291e40d6dffb7700986cba19',
  );
  assert.equal(before.sourceCommit, 'cca440fc1db64e17f39af51338bc46cc28307163');
  assert.equal(after.sourceCommit, before.sourceCommit);
  assert.equal(before.scope, 'body');
  assert.deepEqual(before.regions, ['thorax']);
  assert.equal(before.entries.length, 8);
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
        'Unrecorded thoracic organ clinical edit: ' + s.id + ' / ' + t,
      );
      const { readiness: _r, ...shown } = lesson;
      assert.deepEqual(shown, api.bodyContent(s, t));
      originals.set(s.id + '|' + t, e.sections[t]);
    }
  }
  assert.equal(originals.size, 16);
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
