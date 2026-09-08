import assert from 'node:assert/strict';
import { readContentJson } from './content-contract-tools.mjs';
import { createHash } from 'node:crypto';
const hash = (v) =>
  createHash('sha256').update(JSON.stringify(v)).digest('hex');
/** Offline historical comparison only. Runtime/export always use current teaching. */
export async function authoringBeforeForearmClinical(context) {
  const { api, catalog } = context;
  const before = await readContentJson(
    'content/forearm-clinical-curriculum.before.json',
  );
  const after = await readContentJson(
    'content/forearm-clinical-curriculum.transition.json',
  );
  assert.equal(
    hash(before),
    '005bf61bb0dbd6ec4ce67edb7c185d753482a95aca59abf5b2389dce95ad6a15',
  );
  assert.equal(
    hash(after),
    'af93a659918b8c134f2bbe86bd0f6a3c7b15ba1ff4bc37e5091b91dac8ec5479',
  );
  assert.equal(before.sourceCommit, '5497b73f4224511da0f0b2af750c54933c11f00a');
  assert.equal(after.sourceCommit, before.sourceCommit);
  assert.equal(before.scope, 'body');
  assert.deepEqual(before.regions, ['forearm']);
  assert.equal(before.entries.length, 42);
  assert.deepEqual(
    after.entries.map((e) => [e.id, e.fmaId]),
    before.entries.map((e) => [e.id, e.fmaId]),
  );
  const originals = new Map();
  for (const [i, e] of before.entries.entries()) {
    const s = catalog.structures.find((s) => s.id === e.id);
    assert(s && s.system === 'muscles');
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
        'Unrecorded forearm clinical edit: ' + s.id + ' / ' + t,
      );
      const { readiness: _r, ...shown } = lesson;
      assert.deepEqual(shown, api.bodyContent(s, t));
      originals.set(s.id + '|' + t, e.sections[t]);
    }
  }
  assert.equal(originals.size, 84);
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
