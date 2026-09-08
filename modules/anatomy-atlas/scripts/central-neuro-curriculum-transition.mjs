import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readContentJson } from './content-contract-tools.mjs';
const hash = (value) =>
  createHash('sha256').update(JSON.stringify(value)).digest('hex');

/** Offline preservation only; current runtime/exported lessons remain intact. */
export async function authoringBeforeCentralNeuro(context) {
  const { api, catalog } = context;
  const before = await readContentJson(
    'content/central-neuro-curriculum.before.json',
  );
  const after = await readContentJson(
    'content/central-neuro-curriculum.transition.json',
  );
  assert.equal(
    hash(before),
    '889f736d5243c87554c06b89ae72af830567a2116a4e2f4e5fa83453583aca96',
  );
  assert.equal(
    hash(after),
    '496569dfa34c3dadcbc51958dd6231c9db1cd59e3ee9ffcba7b49f0565366c3d',
  );
  assert.equal(before.sourceCommit, '840d611a6aa548db3a5c1a93ca8ba46a983ba40d');
  assert.equal(after.sourceCommit, before.sourceCommit);
  assert.equal(before.scope, 'body');
  assert.deepEqual(before.regions, ['head-neck', 'spine']);
  assert.deepEqual(before.tabs, ['anatomy', 'function']);
  assert.equal(before.entries.length, 3);
  assert.deepEqual(
    after.entries.map((e) => [e.id, e.fmaId]),
    before.entries.map((e) => [e.id, e.fmaId]),
  );
  const originals = new Map();
  for (const [i, entry] of before.entries.entries()) {
    const s = catalog.structures.find((s) => s.id === entry.id);
    assert(
      s &&
        s.system === 'nerves' &&
        before.regions.some((region) => s.regions.includes(region)),
    );
    assert.equal(s.fmaId, entry.fmaId);
    assert.equal(s.name, entry.name);
    for (const t of before.tabs) {
      assert.equal(
        entry.sections[t].readiness,
        t === 'anatomy'
          ? s.fmaId === 'FMA78497'
            ? 'identity-only'
            : 'draft'
          : 'pending',
      );
      const lesson = api.bodyLesson(s, t);
      assert.equal(
        lesson.readiness,
        s.fmaId === 'FMA61970' && t === 'function' ? 'pending' : 'draft',
      );
      assert.equal(
        hash(lesson),
        after.entries[i].sections[t],
        'Unrecorded central neuro change: ' + s.id + ' ' + t,
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
