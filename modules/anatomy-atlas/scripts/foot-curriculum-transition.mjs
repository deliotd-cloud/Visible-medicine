import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readContentJson } from './content-contract-tools.mjs';
const hash = (value) =>
  createHash('sha256').update(JSON.stringify(value)).digest('hex');

/** Offline preservation only; current runtime/exported lessons remain intact. */
export async function authoringBeforeFoot(context) {
  const { api, catalog } = context;
  const before = await readContentJson('content/foot-curriculum.before.json');
  const after = await readContentJson(
    'content/foot-curriculum.transition.json',
  );
  assert.equal(
    hash(before),
    '039ede142a565dfab9017d0e92ea130f12678190c6bdb6bcbfa032e1a0ddeab7',
  );
  assert.equal(
    hash(after),
    '2b2eb845c9bae1481c319e128ea30afb12fe6ff3cc975dd63bb37bf003e6c5e8',
  );
  assert.equal(before.sourceCommit, 'e0031f2b27ebebb8c20994863f3faec669950354');
  assert.equal(after.sourceCommit, before.sourceCommit);
  assert.equal(before.scope, 'body');
  assert.equal(before.region, 'foot');
  assert.deepEqual(before.tabs, ['anatomy', 'function']);
  assert.equal(before.entries.length, 36);
  assert.deepEqual(
    after.entries.map((e) => [e.id, e.fmaId]),
    before.entries.map((e) => [e.id, e.fmaId]),
  );
  const originals = new Map();
  for (const [i, entry] of before.entries.entries()) {
    const s = catalog.structures.find((s) => s.id === entry.id);
    assert(s && s.system === 'muscles' && s.regions.includes('foot'));
    assert.equal(s.fmaId, entry.fmaId);
    assert.equal(s.name, entry.name);
    for (const t of before.tabs) {
      assert.equal(
        entry.sections[t].readiness,
        t === 'anatomy' ? 'identity-only' : 'pending',
      );
      const lesson = api.bodyLesson(s, t);
      assert.equal(lesson.readiness, 'draft');
      assert.equal(
        hash(lesson),
        after.entries[i].sections[t],
        'Unrecorded foot change: ' + s.id + ' ' + t,
      );
      const { readiness: _readiness, ...displayed } = lesson;
      assert.deepEqual(displayed, api.bodyContent(s, t));
    }
    originals.set(s.id, entry.sections);
  }
  assert.equal(originals.size, 36);
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
