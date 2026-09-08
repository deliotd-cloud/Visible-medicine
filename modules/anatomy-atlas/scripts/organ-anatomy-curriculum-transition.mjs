import assert from 'node:assert/strict';
import { readContentJson } from './content-contract-tools.mjs';
import { createHash } from 'node:crypto';
const hash = (v) =>
  createHash('sha256').update(JSON.stringify(v)).digest('hex');
/** Offline historical comparison only. Runtime/export always use current teaching. */
export async function authoringBeforeOrganAnatomy(context) {
  const { api, catalog } = context;
  const before = await readContentJson(
    'content/organ-anatomy-curriculum.before.json',
  );
  const after = await readContentJson(
    'content/organ-anatomy-curriculum.transition.json',
  );
  assert.equal(
    hash(before),
    '349b50a2ebde2b6aa7c2978b2f487fa5b1cd5de89a1ab7f5256149c1295cdae0',
  );
  assert.equal(
    hash(after),
    'c590b6e66b945769e24471434d29a748fcf0319bb37f4920ce7f14e7ea185f8a',
  );
  assert.equal(before.sourceCommit, 'aaaef58d65000d4a83ac1fcd9845cb43c89a4533');
  assert.equal(after.sourceCommit, before.sourceCommit);
  assert.equal(before.scope, 'body');
  assert.deepEqual(before.regions, ['thorax', 'abdomen', 'pelvis']);
  assert.equal(before.entries.length, 21);
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
    assert.deepEqual(Object.keys(e.sections), ['anatomy']);
    assert.deepEqual(Object.keys(after.entries[i].sections), ['anatomy']);
    assert.equal(e.sections.anatomy.readiness, 'identity-only');
    const lesson = api.bodyLesson(s, 'anatomy');
    assert.equal(lesson.readiness, 'draft');
    assert.equal(
      hash(lesson),
      after.entries[i].sections.anatomy,
      'Unrecorded organ Anatomy edit: ' + s.id,
    );
    const { readiness: _r, ...shown } = lesson;
    assert.deepEqual(shown, api.bodyContent(s, 'anatomy'));
    originals.set(s.id, e.sections.anatomy);
  }
  assert.equal(originals.size, 21);
  const bodyLesson = (s, t) =>
    t === 'anatomy' && originals.has(s.id)
      ? structuredClone(originals.get(s.id))
      : api.bodyLesson(s, t);
  const bodyContent = (s, t) => {
    if (t !== 'anatomy' || !originals.has(s.id)) return api.bodyContent(s, t);
    const { readiness: _r, ...shown } = bodyLesson(s, t);
    return shown;
  };
  return { ...api, bodyLesson, bodyContent };
}
