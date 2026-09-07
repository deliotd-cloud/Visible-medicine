import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readContentJson } from './content-contract-tools.mjs';
const hash = (value) =>
  createHash('sha256').update(JSON.stringify(value)).digest('hex');

/** Offline preservation only; current runtime/exported lessons remain intact. */
export async function authoringBeforeSwallowing(context) {
  const { api, catalog } = context;
  const before = await readContentJson(
    'content/swallowing-curriculum.before.json',
  );
  const after = await readContentJson(
    'content/swallowing-curriculum.transition.json',
  );
  assert.equal(
    hash(before),
    'ed349775ace918e3911086354e91d29df9d5be223c13bf2bf07e1fa111709011',
  );
  assert.equal(
    hash(after),
    '0387b09636ea2851562597bf63afa75d46a774dabdde5025727cc8d911a14298',
  );
  assert.equal(before.sourceCommit, 'e75a633f3361d3e50fdcf19df44108d46a3c21c4');
  assert.equal(after.sourceCommit, before.sourceCommit);
  assert.equal(before.scope, 'body');
  assert.equal(before.region, 'head-neck');
  assert.deepEqual(before.tabs, ['anatomy', 'function']);
  assert.equal(before.entries.length, 27);
  assert.deepEqual(
    after.entries.map((e) => [e.id, e.fmaId]),
    before.entries.map((e) => [e.id, e.fmaId]),
  );
  const originals = new Map();
  for (const [i, entry] of before.entries.entries()) {
    const s = catalog.structures.find((s) => s.id === entry.id);
    assert(s && s.system === 'muscles' && s.regions.includes('head-neck'));
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
        'Unrecorded swallowing change: ' + s.id + ' ' + t,
      );
      const { readiness: _readiness, ...displayed } = lesson;
      assert.deepEqual(displayed, api.bodyContent(s, t));
    }
    originals.set(s.id, entry.sections);
  }
  assert.equal(originals.size, 27);
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
