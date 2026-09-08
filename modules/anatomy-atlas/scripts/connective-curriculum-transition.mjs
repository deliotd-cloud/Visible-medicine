import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readContentJson } from './content-contract-tools.mjs';
const hash = (value) =>
  createHash('sha256').update(JSON.stringify(value)).digest('hex');

/** Offline preservation only; runtime and exports always use current lessons. */
export async function authoringBeforeConnective(context) {
  const { api, catalog } = context;
  const before = await readContentJson(
    'content/connective-curriculum.before.json',
  );
  const after = await readContentJson(
    'content/connective-curriculum.transition.json',
  );
  assert.equal(
    hash(before),
    'd25c6f3629c59fa002526ca9c07369a18e89d733178da5a977f5af6720663125',
  );
  assert.equal(
    hash(after),
    'a54f791d5e09f83636aa7e379300461ce8dbf6e6b26ce8e3d6dec7fb5fcb6ec2',
  );
  assert.equal(before.sourceCommit, 'b02a85b54be30bbabd996a95906804421e148f11');
  assert.equal(after.sourceCommit, before.sourceCommit);
  assert.equal(before.scope, 'body');
  assert.deepEqual(before.regions, ['head-neck', 'thorax', 'forearm', 'leg']);
  assert.deepEqual(before.tabs, ['anatomy', 'function']);
  assert.equal(before.entries.length, 43);
  assert.deepEqual(
    after.entries.map((e) => [e.id, e.fmaId]),
    before.entries.map((e) => [e.id, e.fmaId]),
  );
  const originals = new Map();
  for (const [i, e] of before.entries.entries()) {
    const s = catalog.structures.find((s) => s.id === e.id);
    assert(
      s &&
        s.system === 'connective' &&
        ['cartilage', 'ligament'].includes(s.category) &&
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
        'Unrecorded connective edit: ' + s.id + ' ' + t,
      );
      const { readiness: _readiness, ...displayed } = lesson;
      assert.deepEqual(displayed, api.bodyContent(s, t));
    }
    originals.set(s.id, e.sections);
  }
  assert.equal(originals.size, 43);
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
