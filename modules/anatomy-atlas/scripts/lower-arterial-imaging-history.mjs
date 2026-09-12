// Offline exact authoring history only; not runtime content or approval migration.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import pins from '../content/lower-arterial-imaging-pins.json' with { type: 'json' };
import after from '../content/lower-arterial-imaging.transition.json' with { type: 'json' };
export const lowerArterialContentHash = (v) =>
  createHash('sha256').update(JSON.stringify(v)).digest('hex');
export function authoringBeforeLowerArterialImaging({ api, catalog }) {
  assert.equal(
    lowerArterialContentHash(pins),
    'c816e752384e9b1fe3a5d76c096f875badf94794d1c16710ce86e98075d2f9e0',
  );
  assert.equal(
    lowerArterialContentHash(after),
    'ac6927c48c954848ff0f86755fc11bfceca867567b0ebebc8a5cd1002443dcce',
  );
  const prior = new Map();
  for (const [i, e] of pins.entries.entries()) {
    const current = catalog.structures.find((s) => s.id === e.identity.id);
    if (current) assert.deepEqual(current, e.identity); // Older raw catalogues omit the two supplemental veins.
    assert.equal(after.entries[i].id, e.identity.id);
    for (const tab of e.topics) {
      assert.equal(e.previous[tab].readiness, 'pending');
      assert.equal(
        lowerArterialContentHash(api.bodyLesson(e.identity, tab)),
        after.entries[i].sections[tab],
        'Unrecorded vascular teaching change',
      );
      prior.set(e.identity.id + '|' + tab, {
        identity: e.identity,
        lesson: e.previous[tab],
      });
    }
  }
  assert.equal(prior.size, 36);
  const bodyLesson = (s, tab) => {
    const e = prior.get(s.id + '|' + tab);
    if (!e) return api.bodyLesson(s, tab);
    assert.deepEqual(s, e.identity);
    return structuredClone(e.lesson);
  };
  return {
    ...api,
    bodyLesson,
    bodyContent(s, tab) {
      const { readiness: _r, ...section } = bodyLesson(s, tab);
      return section;
    },
  };
}
