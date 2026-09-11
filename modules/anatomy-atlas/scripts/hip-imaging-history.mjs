// Offline, exact teaching-history reconstruction; never runtime content or approvals.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import before from '../content/hip-imaging.before.json' with { type: 'json' };
import after from '../content/hip-imaging.transition.json' with { type: 'json' };
import pins from '../content/hip-imaging-pins.json' with { type: 'json' };
const hash = (v) =>
  createHash('sha256').update(JSON.stringify(v)).digest('hex');
export function authoringBeforeHipImaging({ api, catalog }) {
  assert.equal(
    hash(before),
    '04c7a4562f6bba8435d426b78263039904aed34909c7764ba8cef582aa8af266',
  );
  assert.equal(
    hash(after),
    '60eba766ac54140f572b34cae482f17c1e01e94b24f03e9c21ec70bb29e4d330',
  );
  assert.equal(
    hash(pins),
    '923a0e35e632ee658a05803f7c1840b89ee65afecd92da4d7ea51d94209c628e',
  );
  assert.equal(before.sourceCommit, 'fa1ce62ee804e439ca55e987b79a16ce64a41cac');
  assert.equal(after.sourceCommit, before.sourceCommit);
  assert.equal(pins.sourceCommit, before.sourceCommit);
  assert.deepEqual(before.tabs, ['ct', 'mri', 'ultrasound']);
  assert.deepEqual(
    before.entries.map(({ identity, group }) => ({ identity, group })),
    pins.entries,
  );
  assert.deepEqual(
    after.entries.map((e) => e.id),
    pins.entries.map((e) => e.identity.id),
  );
  const original = new Map();
  for (const [i, e] of before.entries.entries()) {
    assert.deepEqual(
      catalog.structures.find((s) => s.id === e.identity.id),
      e.identity,
    );
    assert.deepEqual(Object.keys(e.sections), before.tabs);
    assert.deepEqual(Object.keys(after.entries[i].sections), before.tabs);
    for (const tab of before.tabs) {
      assert.equal(e.sections[tab].readiness, 'pending');
      assert.equal(
        hash(api.bodyLesson(e.identity, tab)),
        after.entries[i].sections[tab],
        'Unrecorded hip teaching change',
      );
      original.set(e.identity.id + '|' + tab, {
        identity: e.identity,
        lesson: e.sections[tab],
      });
    }
  }
  assert.equal(original.size, 78);
  const bodyLesson = (s, tab) => {
    const e = original.get(s.id + '|' + tab);
    if (!e) return api.bodyLesson(s, tab);
    assert.deepEqual(s, e.identity);
    return structuredClone(e.lesson);
  };
  const bodyContent = (s, tab) => {
    const { readiness: _r, ...shown } = bodyLesson(s, tab);
    return shown;
  };
  return { ...api, bodyLesson, bodyContent };
}
