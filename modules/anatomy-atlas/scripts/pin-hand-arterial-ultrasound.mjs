import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { exactSourceHistoryApi } from './exact-source-history-api.mjs';

export const handUsBaseline = '6e134825dd189873d60846cacdc98a11983d6d16';
export const handUsSelections = {
  superficialArch: ['FMA22835', 'FMA22837'],
  deepArch: ['FMA22839', 'FMA22840'],
  metacarpal: ['FMA22864', 'FMA22865'],
  princeps: ['FMA22905', 'FMA22907'],
  radialis: ['FMA22777', 'FMA22778'],
  commonDigital: ['FMA22856', 'FMA85118', 'FMA85119', 'FMA85120', 'FMA85121', 'FMA85122', 'FMA85123', 'FMA85124'],
  properDigital: ['FMA22858', 'FMA22860', 'FMA23050', 'FMA23051', 'FMA23052', 'FMA23054', 'FMA23055', 'FMA85112', 'FMA85115', 'FMA85116'],
};
export const handUsHash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');

export async function handUsPins() {
  // Reconstruct the complete immutable baseline, not current code or a name lookup.
  const api = await exactSourceHistoryApi(handUsBaseline, 'display-review');
  const raw = JSON.parse(await readFile('public/models/bodyparts3d/full-body/catalog.json'));
  const catalog = api.bodyDisplayCatalog(raw);
  const entries = Object.entries(handUsSelections).flatMap(([group, fmas]) => fmas.map(fmaId => {
    const matches = catalog.structures.filter(s => s.fmaId === fmaId);
    assert.equal(matches.length, 1, fmaId);
    const identity = matches[0];
    assert.equal(identity.region, 'hand');
    assert.equal(identity.system, 'vessels');
    assert(['right', 'left'].includes(identity.laterality));
    const ultrasound = api.bodyLesson(identity, 'ultrasound');
    assert.equal(ultrasound.readiness, 'pending', identity.id);
    return { identity, group, topics: ['ultrasound'], previous: { ultrasound } };
  }));
  assert.equal(entries.length, 28);
  assert.equal(new Set(entries.map(e => e.identity.id)).size, 28);
  const bundles = catalog.bundles.filter(b => entries.some(e => e.identity.bundle === b.id));
  for (const b of bundles) {
    const bytes = await readFile('public' + b.url.split('?')[0]);
    assert.equal(bytes.length, b.bytes);
    assert.equal(createHash('sha256').update(bytes).digest('hex'), b.sha256);
  }
  const allTopics = catalog.structures.map(s => ({ id: s.id,
    topics: api.contentTabs.map(tab => ({ tab, ...api.bodyLesson(s, tab) })) }));
  return { schemaVersion: 1, parentCommit: handUsBaseline, sourceVersion: catalog.sourceVersion,
    coordinateSystem: catalog.coordinateSystem, bundles, entries,
    previousCatalogHash: handUsHash(catalog), previousAllTopicsHash: handUsHash(allTopics),
    previousToursHash: handUsHash(api.regionalTours), previousDissectionHash: handUsHash(api.dissectionProfiles) };
}

// Importing this helper does not write evidence.
if (process.argv[1]?.replaceAll('\\', '/').endsWith('/pin-hand-arterial-ultrasound.mjs')) {
  const pins = await handUsPins(), path = 'content/hand-arterial-ultrasound-pins.json';
  const text = JSON.stringify(pins, null, 2) + '\n';
  if (process.argv.includes('--check'))
    assert.equal((await readFile(path, 'utf8')).replaceAll('\r\n', '\n'), text);
  else await writeFile(path, text, { flag: 'wx' });
  console.log(JSON.stringify({ baseline: handUsBaseline, selections: pins.entries.length,
    bundles: pins.bundles.length, pinsHash: handUsHash(pins) }));
}
