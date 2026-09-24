import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { build } from './workspace-test-build.mjs';
const compiled = await build({ stdin: { contents: "export {bodyDisplayCatalog} from './lib/body-display-catalog'; export {bodyLesson} from './app/body-content'; export {structures} from './app/anatomy-data'; export {contentTabs} from './lib/content-types'; export {dissectionProfiles} from './app/dissection-data'; export {lacrimalDrainageGroups} from './content/lacrimal-drainage-imaging';", resolveDir: process.cwd(), loader: 'ts' }, bundle: true, write: false, format: 'esm', platform: 'node' });
const api = await import('data:text/javascript;base64,' + Buffer.from(compiled.outputFiles[0].text).toString('base64'));
const raw = JSON.parse(await readFile('public/models/bodyparts3d/full-body/catalog.json'));
const catalog = api.bodyDisplayCatalog(raw);
const sha = v => createHash('sha256').update(JSON.stringify(v)).digest('hex');
const entries = catalog.structures.flatMap(identity => {
  const group = Object.keys(api.lacrimalDrainageGroups).find(k => api.lacrimalDrainageGroups[k].fmas.includes(identity.fmaId));
  return group ? [{ identity, group, anatomy: api.bodyLesson(identity, 'anatomy'), previous: Object.fromEntries(['ct', 'mri'].map(t => [t, api.bodyLesson(identity, t)])) }] : [];
});
assert.equal(entries.length, 6);
for (const e of entries) {
  assert.equal(e.identity.system, 'organs'); assert.deepEqual(e.identity.regions, ['head-neck']);
  if (!process.argv.includes('--check')) { assert.equal(e.previous.ct.readiness, 'pending'); assert.equal(e.previous.mri.readiness, 'pending'); }
}
const bundles = catalog.bundles.filter(b => entries.some(e => e.identity.bundle === b.id));
for (const b of bundles) assert.equal(createHash('sha256').update(await readFile('public' + b.url.split('?')[0])).digest('hex'), b.sha256);
const base = { sourceCommit: '37428be036515935e182682b3004d64ed2d02c18', sourceVersion: catalog.sourceVersion, license: catalog.license, coordinateSystem: catalog.coordinateSystem, bundles };
const path = 'content/lacrimal-drainage-imaging-pins.json';
if (process.argv.includes('--check')) {
  const saved = JSON.parse(await readFile(path));
  for (const k of Object.keys(base)) assert.deepEqual(saved[k], base[k]);
  assert.deepEqual(saved.entries.map(({previous, ...e}) => e), entries.map(({previous, ...e}) => e));
} else {
  const previousAllLessonsAndRecipesHash = sha({ body: catalog.structures.map(s => ({ id: s.id, sections: Object.fromEntries(api.contentTabs.map(t => [t, api.bodyLesson(s, t)])) })), shoulder: api.structures, recipes: api.dissectionProfiles });
  await writeFile(path, JSON.stringify({ ...base, previousAllLessonsAndRecipesHash, entries }, null, 2) + '\n', { flag: 'wx' });
}
console.log(JSON.stringify({ selections: entries.length, placements: 12, bundles: bundles.length }));
