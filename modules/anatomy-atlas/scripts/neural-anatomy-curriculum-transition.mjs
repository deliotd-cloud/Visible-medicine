import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readContentJson } from './content-contract-tools.mjs';
const hash = (v) =>
  createHash('sha256').update(JSON.stringify(v)).digest('hex');
/** Offline preservation only; never use these superseded descriptions at runtime. */
export async function authoringBeforeNeuralAnatomy(context) {
  const { api, catalog } = context;
  const before = await readContentJson(
    'content/neural-anatomy-curriculum.before.json',
  );
  const after = await readContentJson(
    'content/neural-anatomy-curriculum.transition.json',
  );
  assert.equal(
    hash(before),
    '1098aa6b7e7c737415388ab17f1502c775389a0d6fb3c215d4e559d2fffcb389',
  );
  assert.equal(
    hash(after),
    'e6b9f0132e10906787da707c02f0aa7f79c36ce2a3a2d24b0b647e2050864c0f',
  );
  assert.equal(before.sourceCommit, '863687da05775f36f4abbb4d57d7ce19c07f3496');
  assert.equal(after.sourceCommit, before.sourceCommit);
  assert.equal(before.scope, 'body');
  assert.deepEqual(before.regions, ['head-neck']);
  assert.equal(before.entries.length, 11);
  assert.deepEqual(
    after.entries.map((e) => [e.id, e.fmaId]),
    before.entries.map((e) => [e.id, e.fmaId]),
  );
  const originals = new Map();
  let topics = 0;
  for (const [i, e] of before.entries.entries()) {
    const s = catalog.structures.find((s) => s.id === e.id);
    assert(s && s.system === 'nerves' && s.region === 'head-neck');
    assert.deepEqual(s.regions, ['head-neck']);
    assert.equal(s.fmaId, e.fmaId);
    assert.equal(s.name, e.name);
    assert.equal(s.category, e.category);
    assert.equal(s.laterality, e.side);
    assert.equal(s.sourceTree, e.tree);
    assert.deepEqual(
      s.sources.map((p) => p.file),
      e.files,
    );
    assert.deepEqual(
      Object.keys(after.entries[i].sections),
      Object.keys(e.sections),
    );
    for (const t of Object.keys(e.sections)) {
      assert(['anatomy', 'function'].includes(t));
      assert.equal(
        e.sections[t].readiness,
        t === 'anatomy' ? 'identity-only' : 'draft',
      );
      const lesson = api.bodyLesson(s, t);
      assert.equal(lesson.readiness, 'draft');
      assert.equal(
        hash(lesson),
        after.entries[i].sections[t],
        'Unrecorded neural Anatomy/Function edit: ' + s.id + ' ' + t,
      );
      const { readiness: _r, ...shown } = lesson;
      assert.deepEqual(shown, api.bodyContent(s, t));
      topics++;
    }
    originals.set(s.id, e.sections);
  }
  assert.equal(originals.size, 11);
  assert.equal(topics, 17);
  const bodyLesson = (s, t) =>
    originals.get(s.id)?.[t]
      ? structuredClone(originals.get(s.id)[t])
      : api.bodyLesson(s, t);
  const bodyContent = (s, t) => {
    if (!originals.get(s.id)?.[t]) return api.bodyContent(s, t);
    const { readiness: _r, ...shown } = bodyLesson(s, t);
    return shown;
  };
  return { ...api, bodyLesson, bodyContent };
}
