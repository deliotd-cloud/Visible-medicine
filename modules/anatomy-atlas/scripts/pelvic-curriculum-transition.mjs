import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readContentJson } from './content-contract-tools.mjs';
const hash = (value) =>
  createHash('sha256').update(JSON.stringify(value)).digest('hex');

/** Offline preservation only; never substitutes old content in the app/export. */
export async function authoringBeforePelvic(context) {
  const { api, catalog } = context;
  const before = await readContentJson('content/pelvic-curriculum.before.json');
  const after = await readContentJson(
    'content/pelvic-curriculum.transition.json',
  );
  assert.equal(
    hash(before),
    '197d3883e3e92643be49f86042d1cc60ae6f4052a98ff07a433c17e735bbec29',
  );
  assert.equal(
    hash(after),
    '98263d33499956f5ecf4ca52549276776452f87e36ecdf60d24c5d4458c20d05',
  );
  assert.equal(before.sourceCommit, 'f3af0510f21588c54c847f2b28a4fb38086f4a27');
  assert.equal(after.sourceCommit, before.sourceCommit);
  assert.equal(before.scope, 'body');
  assert.equal(before.region, 'pelvis');
  assert.deepEqual(before.tabs, ['anatomy', 'function']);
  assert.equal(before.entries.length, 3);
  assert.deepEqual(
    after.entries.map((e) => [e.id, e.fmaId]),
    before.entries.map((e) => [e.id, e.fmaId]),
  );
  const originals = new Map();
  for (const [i, entry] of before.entries.entries()) {
    const s = catalog.structures.find((s) => s.id === entry.id);
    assert(s && s.system === 'muscles' && s.regions.includes('pelvis'));
    assert.equal(s.fmaId, entry.fmaId);
    assert.equal(s.name, entry.name);
    for (const t of before.tabs) {
      assert.equal(
        entry.sections[t].readiness,
        t === 'anatomy' ? 'identity-only' : 'pending',
      );
      const lesson = api.bodyLesson(s, t);
      assert.equal(
        lesson.readiness,
        s.fmaId === 'FMA19728' && t === 'function' ? 'pending' : 'draft',
      );
      assert.equal(
        hash(lesson),
        after.entries[i].sections[t],
        'Unrecorded pelvic change: ' + s.id + ' ' + t,
      );
      const { readiness: _readiness, ...displayed } = lesson;
      assert.deepEqual(displayed, api.bodyContent(s, t));
    }
    originals.set(s.id, entry.sections);
  }
  assert.equal(originals.size, 3);
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
