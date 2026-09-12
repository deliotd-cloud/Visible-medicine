// Offline authoring reconstruction only; never a runtime or approval migration.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import pins from '../content/pelvic-organ-imaging-pins.json' with { type: 'json' };
import after from '../content/pelvic-organ-imaging.transition.json' with { type: 'json' };

export const pelvicOrganContentHash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');

export function authoringBeforePelvicOrganImaging({ api, catalog }) {
  assert.equal(pelvicOrganContentHash(pins), '648dfc588e6cccd45b114ac74d867b9dcf8514ab5f48f4daea0869e3ef292341');
  assert.equal(pelvicOrganContentHash(after), '6b818fad3e3cf6693463b0efc25f23c2f310f6da3f18eef16d4164ac9a67533b');
  const display = api.bodyDisplayCatalog(catalog), prior = new Map();
  assert.equal(display.sourceVersion, pins.sourceVersion);
  assert.equal(display.license, pins.license);
  assert.deepEqual(display.coordinateSystem, pins.coordinateSystem);
  for (const bundle of pins.bundles)
    assert.deepEqual(display.bundles.find(b => b.id === bundle.id), bundle);
  assert.equal(after.entries.length, pins.entries.length);
  for (const [i, entry] of pins.entries.entries()) {
    assert.equal(display.structures.filter(s => s.id === entry.identity.id).length, 1);
    assert.deepEqual(display.structures.find(s => s.id === entry.identity.id), entry.identity);
    assert.equal(after.entries[i].id, entry.identity.id);
    assert.deepEqual(entry.topics, ['ct', 'mri', 'ultrasound', 'xray']);
    assert.deepEqual(Object.keys(after.entries[i].sections), entry.topics);
    for (const tab of entry.topics) {
      assert.equal(entry.previous[tab].readiness, 'pending');
      assert.equal(pelvicOrganContentHash(api.bodyLesson(entry.identity, tab)), after.entries[i].sections[tab], 'Unrecorded pelvic-organ imaging change');
      prior.set(entry.identity.id + '|' + tab, { identity: entry.identity, lesson: entry.previous[tab] });
    }
  }
  assert.equal(prior.size, 44);
  const bodyLesson = (structure, tab) => {
    const entry = prior.get(structure.id + '|' + tab);
    if (!entry) return api.bodyLesson(structure, tab);
    assert.deepEqual(structure, entry.identity, 'Cannot reconstruct a different pelvic source');
    return structuredClone(entry.lesson);
  };
  return { ...api, bodyLesson, bodyContent(structure, tab) { const { readiness: _r, ...content } = bodyLesson(structure, tab); return content; } };
}
