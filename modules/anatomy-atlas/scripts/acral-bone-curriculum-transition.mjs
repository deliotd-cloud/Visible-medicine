import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readContentJson } from './content-contract-tools.mjs';
const hash = (value) =>
  createHash('sha256').update(JSON.stringify(value)).digest('hex');

/** Offline preservation only; runtime and exports always use current lessons. */
export async function authoringBeforeAcralBones(context) {
  const { api, catalog } = context;
  // These broad source groups are not assigned individual sesamoid identities.
  // Readiness is not displayed copy, so protect these holds explicitly too.
  for (const fma of ['FMA45097', 'FMA45098']) {
    const s = catalog.structures.find((s) => s.fmaId === fma);
    assert(s);
    assert.equal(api.bodyLesson(s, 'anatomy').readiness, 'identity-only');
    assert.equal(api.bodyLesson(s, 'function').readiness, 'pending');
  }
  const before = await readContentJson(
    'content/acral-bone-curriculum.before.json',
  );
  const after = await readContentJson(
    'content/acral-bone-curriculum.transition.json',
  );
  assert.equal(
    hash(before),
    'd916581c477e293e9e79af510083a6e309c4693b6a32e6027e5f818d62a3cff9',
  );
  assert.equal(
    hash(after),
    'dcde8781332527f4d950a79080c945a378ce839d6a58af5c0787e4a5965b20d8',
  );
  assert.equal(before.sourceCommit, '53e40a64a5d2bc34c007d2bb4da67828b174b51d');
  assert.equal(after.sourceCommit, before.sourceCommit);
  assert.equal(before.scope, 'body');
  assert.deepEqual(before.regions, ['hand', 'foot']);
  assert.deepEqual(before.tabs, ['anatomy', 'function']);
  assert.equal(before.entries.length, 106);
  assert.deepEqual(
    after.entries.map((e) => [e.id, e.fmaId]),
    before.entries.map((e) => [e.id, e.fmaId]),
  );
  const originals = new Map();
  for (const [i, e] of before.entries.entries()) {
    const s = catalog.structures.find((s) => s.id === e.id);
    assert(
      s &&
        s.system === 'skeleton' &&
        s.category === 'bone' &&
        before.regions.includes(s.region) &&
        ['left', 'right', 'midline'].includes(s.laterality) &&
        before.regions.some((r) => s.regions.includes(r)),
    );
    assert.equal(s.fmaId, e.fmaId);
    assert.equal(s.name, e.name);
    for (const t of before.tabs) {
      assert.equal(
        e.sections[t].readiness,
        t === 'anatomy' ? 'identity-only' : 'pending',
      );
      const lesson = api.bodyLesson(s, t);
      assert.equal(lesson.readiness, 'draft');
      assert.equal(
        hash(lesson),
        after.entries[i].sections[t],
        'Unrecorded acral-bone edit: ' + s.id + ' ' + t,
      );
      const { readiness: _readiness, ...displayed } = lesson;
      assert.deepEqual(displayed, api.bodyContent(s, t));
    }
    originals.set(s.id, e.sections);
  }
  assert.equal(originals.size, 106);
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
