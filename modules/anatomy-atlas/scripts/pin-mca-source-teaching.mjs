import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { build } from './workspace-test-build.mjs';

const result = await build({stdin: {contents: "export {bodyDisplayCatalog} from './lib/body-display-catalog'; export {nestedStudyTargets} from './lib/nested-anatomy'; export {mcaSourceConcepts} from './content/mca-source-teaching';", resolveDir: process.cwd(), loader: 'ts'}, bundle: true, write: false, platform: 'node', format: 'esm'});
const api = await import('data:text/javascript;base64,' + Buffer.from(result.outputFiles[0].text).toString('base64'));
const catalog = api.bodyDisplayCatalog(JSON.parse(await readFile('public/models/bodyparts3d/full-body/catalog.json', 'utf8')));
const targets = api.nestedStudyTargets(catalog).filter(t => t.study === 'cranial-artery-components' && t.structure.fmaId === 'FMA50082');
assert.equal(targets.length, 3);
assert.deepEqual(targets.map(t => t.structure.sources[0].file), ['FJ1662', 'FJ1663', 'FJ1692']);
assert.equal(api.mcaSourceConcepts.length, 3);
const bindings = targets.map(t => {
  assert.equal(t.structure.sources.length, 1);
  const conceptId = 'mca-source-' + t.structure.sources[0].file.toLowerCase();
  assert.equal(api.mcaSourceConcepts.filter(c => c.id === conceptId && c.study === t.study && c.fmaIds.includes(t.structure.fmaId)).length, 1);
  return {conceptId, study: t.study, sourceHash: t.sourceHash, parentId: t.parentId, parentHash: t.parentHash, structure: t.structure};
});
const parents = [...new Set(targets.map(t => t.parentId))].map(id => catalog.structures.find(s => s.id === id));
assert.equal(parents.length, 1);
const text = JSON.stringify({schemaVersion: 1, purpose: 'Source-file teaching drafts only; not branch identification, clinical approval or imaging registration', parents, bindings}, null, 2) + '\n';
const path = 'content/mca-source-teaching-bindings.v1.json';
const previous = await readFile(path, 'utf8').catch(e => {if (e.code !== 'ENOENT') throw e; return null;});
// Existing source pins are never silently migrated by a regeneration/build.
if (process.argv.includes('--check') || previous !== null) assert.equal(previous, text, 'MCA source teaching pins changed; explicit editorial review required');
else await writeFile(path, text);
console.log(JSON.stringify({bindings: bindings.length, parents: parents.length, checked: process.argv.includes('--check'), clinicalApproval: false}));
