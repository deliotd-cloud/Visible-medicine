import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { exactSourceHistoryApi } from './exact-source-history-api.mjs';

export const handCtBaseline = '946700cc8c5162076cd5e5d9f79a00ba72c6fda1';
export const handCtSelections = {
  deepArch: ['FMA22839', 'FMA22840'],
  metacarpal: ['FMA22864', 'FMA22865'],
  princeps: ['FMA22905', 'FMA22907'],
  radialis: ['FMA22777', 'FMA22778'],
  commonDigital: ['FMA22856', 'FMA85118', 'FMA85119', 'FMA85120', 'FMA85121', 'FMA85122', 'FMA85123', 'FMA85124'],
  properDigital: ['FMA22858', 'FMA22860', 'FMA23050', 'FMA23051', 'FMA23052', 'FMA23054', 'FMA23055', 'FMA85112', 'FMA85115', 'FMA85116'],
};
export const handCtHash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');

export async function handCtPins() {
  // Reconstruct the complete immutable baseline, not current code or a name lookup.
  const api = await exactSourceHistoryApi(handCtBaseline, 'display-review');
  const raw = JSON.parse(await readFile('public/models/bodyparts3d/full-body/catalog.json'));
  const catalog = api.bodyDisplayCatalog(raw);
  const entries = Object.entries(handCtSelections).flatMap(([group, fmas]) => fmas.map(fmaId => {
    const matches = catalog.structures.filter(s => s.fmaId === fmaId);
    assert.equal(matches.length, 1, fmaId);
    const identity = matches[0];
    assert.equal(identity.region, 'hand');
    assert.equal(identity.system, 'vessels');
    assert(['right', 'left'].includes(identity.laterality));
    const ct = api.bodyLesson(identity, 'ct');
    assert.equal(ct.readiness, 'pending', identity.id);
    return { identity, group, topics: ['ct'], previous: { ct } };
  }));
  assert.equal(entries.length, 26);
  assert.equal(new Set(entries.map(e => e.identity.id)).size, 26);
  const bundles = catalog.bundles.filter(b => entries.some(e => e.identity.bundle === b.id));
  for (const b of bundles) {
    const bytes = await readFile('public' + b.url.split('?')[0]);
    assert.equal(bytes.length, b.bytes);
    assert.equal(createHash('sha256').update(bytes).digest('hex'), b.sha256);
  }
  const allTopics = catalog.structures.map(s => ({ id: s.id,
    topics: api.contentTabs.map(tab => ({ tab, ...api.bodyLesson(s, tab) })) }));
  return { schemaVersion: 1, parentCommit: handCtBaseline, sourceVersion: catalog.sourceVersion,
    coordinateSystem: catalog.coordinateSystem, bundles, entries,
    previousCatalogHash: handCtHash(catalog), previousAllTopicsHash: handCtHash(allTopics),
    previousToursHash: handCtHash(api.regionalTours), previousDissectionHash: handCtHash(api.dissectionProfiles) };
}

// Importing this helper does not write evidence.
if (process.argv[1]?.replaceAll('\\', '/').endsWith('/pin-hand-arterial-ct.mjs')) {
  const pins = await handCtPins(), path = 'content/hand-arterial-ct-pins.json';
  const text = JSON.stringify(pins, null, 2) + '\n';
  if (process.argv.includes('--check'))
    assert.equal((await readFile(path, 'utf8')).replaceAll('\r\n', '\n'), text);
  else await writeFile(path, text, { flag: 'wx' });
  console.log(JSON.stringify({ baseline: handCtBaseline, selections: pins.entries.length,
    bundles: pins.bundles.length, pinsHash: handCtHash(pins) }));
}
