import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readContentJson } from './content-contract-tools.mjs';
const hash = (value) =>
  createHash('sha256').update(JSON.stringify(value)).digest('hex');

/** Offline preservation only; current runtime/exported lessons remain intact. */
export async function authoringBeforeTrunk(context) {
  const { api, catalog } = context;
  const before = await readContentJson('content/trunk-curriculum.before.json');
  const after = await readContentJson(
    'content/trunk-curriculum.transition.json',
  );
  assert.equal(
    hash(before),
    '2762bf355fca808f429eca14dd29b901c8a8410fe602946035e129495adb0485',
  );
  assert.equal(
    hash(after),
    'bb29d94ee2a7b57c2ded884b593afef79d7b751cd8efd351999ae6feeaa1b3eb',
  );
  assert.equal(before.sourceCommit, '35e7fe5b685eeeacd0b0e394e88d716bdf86efa4');
  assert.equal(after.sourceCommit, before.sourceCommit);
  assert.equal(before.scope, 'body');
  assert.deepEqual(before.regions, ['spine', 'thorax', 'abdomen']);
  assert.deepEqual(before.tabs, ['anatomy', 'function']);
  assert.equal(before.entries.length, 38);
  assert.deepEqual(
    after.entries.map((e) => [e.id, e.fmaId]),
    before.entries.map((e) => [e.id, e.fmaId]),
  );
  const originals = new Map();
  for (const [i, entry] of before.entries.entries()) {
    const s = catalog.structures.find((s) => s.id === entry.id);
    assert(
      s &&
        s.system === 'muscles' &&
        before.regions.some((region) => s.regions.includes(region)),
    );
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
        'Unrecorded trunk change: ' + s.id + ' ' + t,
      );
      const { readiness: _readiness, ...displayed } = lesson;
      assert.deepEqual(displayed, api.bodyContent(s, t));
    }
    originals.set(s.id, entry.sections);
  }
  assert.equal(originals.size, 38);
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
