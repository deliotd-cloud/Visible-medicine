// Offline exact authoring history only; not runtime content or approval migration.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import pins from '../content/upper-vessel-imaging-pins.json' with { type: 'json' };
import after from '../content/upper-vessel-imaging.transition.json' with { type: 'json' };
export const upperVesselContentHash = (v) =>
  createHash('sha256').update(JSON.stringify(v)).digest('hex');
export function authoringBeforeUpperVesselImaging({ api, catalog }) {
  assert.equal(
    upperVesselContentHash(pins),
    '1d51d77f54a2272fecda2ff32e107dfa0b48d324219d85c99ba383f87c33a003',
  );
  assert.equal(
    upperVesselContentHash(after),
    'b9eb9377a98f0b6f77b4bb0044e969b24421eb6cea34458a3352684642910923',
  );
  const prior = new Map();
  for (const [i, e] of pins.entries.entries()) {
    const current = catalog.structures.find((s) => s.id === e.identity.id);
    if (current) assert.deepEqual(current, e.identity); // Older raw catalogues omit the two supplemental veins.
    assert.equal(after.entries[i].id, e.identity.id);
    for (const tab of e.topics) {
      assert.equal(e.previous[tab].readiness, 'pending');
      assert.equal(
        upperVesselContentHash(api.bodyLesson(e.identity, tab)),
        after.entries[i].sections[tab],
        'Unrecorded vascular teaching change',
      );
      prior.set(e.identity.id + '|' + tab, {
        identity: e.identity,
        lesson: e.previous[tab],
      });
    }
  }
  assert.equal(prior.size, 34);
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
