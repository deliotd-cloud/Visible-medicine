import assert from 'node:assert/strict';
import { readContentJson } from './content-contract-tools.mjs';
import { createHash } from 'node:crypto';
import { authoringBeforeShoulderClinical } from './shoulder-clinical-curriculum-transition.mjs';
const hash = (v) =>
  createHash('sha256').update(JSON.stringify(v)).digest('hex');
/** Offline historical comparison only. Runtime/export always use current teaching. */
export async function authoringBeforeConnectiveAnatomy(context) {
  const { catalog } = context;
  const api = await authoringBeforeShoulderClinical(context);
  const before = await readContentJson(
    'content/connective-anatomy-curriculum.before.json',
  );
  const after = await readContentJson(
    'content/connective-anatomy-curriculum.transition.json',
  );
  assert.equal(
    hash(before),
    'ed615e0240df7fa15067dc67620551e8ab7a651bffa6ed74ccde87ad138c1cd5',
  );
  assert.equal(
    hash(after),
    '34725d5a87e2a28c2e0fd7988330c8fb789683fbe1e2b7252204ca78b3798faf',
  );
  assert.equal(before.sourceCommit, '0c8f268910b329fffd86182c2858ab90d2917cb6');
  assert.equal(after.sourceCommit, before.sourceCommit);
  assert.equal(before.scope, 'body');
  assert.deepEqual(before.regions, ['foot', 'leg', 'spine']);
  assert.equal(before.entries.length, 26);
  assert.deepEqual(
    after.entries.map((e) => [e.id, e.fmaId]),
    before.entries.map((e) => [e.id, e.fmaId]),
  );
  const originals = new Map();
  for (const [i, e] of before.entries.entries()) {
    const s = catalog.structures.find((s) => s.id === e.id);
    assert(s && s.system === 'connective');
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
      'Unrecorded connective Anatomy edit: ' + s.id,
    );
    const { readiness: _r, ...shown } = lesson;
    assert.deepEqual(shown, api.bodyContent(s, 'anatomy'));
    originals.set(s.id, e.sections.anatomy);
  }
  assert.equal(originals.size, 26);
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
