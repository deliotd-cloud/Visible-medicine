import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readContentJson } from './content-contract-tools.mjs';

const hash = (value) =>
  createHash('sha256').update(JSON.stringify(value)).digest('hex');

/** Offline preservation only. Validate all 84 current sections before projecting
 * their exact previous authoring API; never affect runtime content or exports. */
export async function authoringBeforeForearm(context) {
  const { api, catalog } = context;
  const before = await readContentJson(
    'content/forearm-curriculum.before.json',
  );
  const transition = await readContentJson(
    'content/forearm-curriculum.transition.json',
  );
  assert.equal(
    hash(before),
    '443f8440d4d8d1be167b8de621fb562f0e8315c7ca43031d2affc2cd1d34d2c6',
  );
  assert.equal(
    hash(transition),
    'ec16ddf412ef25209111e5d57f2036d3d778149c1bc94d4fa9dbaf8b33299dde',
  );
  assert.equal(before.sourceCommit, 'c8cd866894e0254c0a92cd5d0b5f7012ccd25714');
  assert.equal(transition.sourceCommit, before.sourceCommit);
  assert.equal(before.scope, 'body');
  assert.equal(before.region, 'forearm');
  assert.deepEqual(before.tabs, ['anatomy', 'function']);
  assert.equal(before.entries.length, 42);
  assert.deepEqual(
    transition.entries.map((s) => [s.id, s.fmaId]),
    before.entries.map((s) => [s.id, s.fmaId]),
  );
  const originals = new Map();
  for (const [i, entry] of before.entries.entries()) {
    const s = catalog.structures.find((s) => s.id === entry.id);
    assert(s, 'Missing forearm representation');
    assert.equal(s.fmaId, entry.fmaId);
    assert.equal(s.name, entry.name);
    assert.equal(s.system, 'muscles');
    assert(s.regions.includes('forearm'));
    for (const tab of before.tabs) {
      assert.equal(
        entry.sections[tab].readiness,
        tab === 'anatomy' ? 'identity-only' : 'pending',
      );
      assert.equal(api.bodyLesson(s, tab).readiness, 'draft');
      assert.equal(
        hash(api.bodyLesson(s, tab)),
        transition.entries[i].sections[tab],
        'Unrecorded forearm change: ' + s.id + ' ' + tab,
      );
      const { readiness: _readiness, ...current } = api.bodyLesson(s, tab);
      assert.deepEqual(
        api.bodyContent(s, tab),
        current,
        'Actual display agrees with authored lesson',
      );
    }
    originals.set(s.id, entry.sections);
  }
  assert.equal(originals.size, 42);
  const bodyLesson = (s, tab) =>
    originals.get(s.id)?.[tab]
      ? structuredClone(originals.get(s.id)[tab])
      : api.bodyLesson(s, tab);
  const bodyContent = (s, tab) => {
    if (!originals.get(s.id)?.[tab]) return api.bodyContent(s, tab);
    const { readiness: _readiness, ...section } = bodyLesson(s, tab);
    return section;
  };
  return { ...api, bodyLesson, bodyContent };
}
