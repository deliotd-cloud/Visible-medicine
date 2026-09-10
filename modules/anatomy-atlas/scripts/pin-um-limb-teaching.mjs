import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { build } from './workspace-test-build.mjs';
const built = await build({ stdin: { contents: "export { limbDefinitions } from './lib/um-limb-studies.ts'; export { specimenLessons } from './content/um-limb-teaching.ts';", resolveDir: process.cwd(), loader: 'ts' }, bundle: true, write: false, platform: 'node', format: 'esm' });
const { limbDefinitions, specimenLessons } = await import('data:text/javascript;base64,' + Buffer.from(built.outputFiles[0].text).toString('base64'));
const scope = limbDefinitions.whole;
assert.equal(scope.surfaces.length, 67);
assert.deepEqual(Object.keys(specimenLessons).sort(), scope.surfaces.map(s => s.slug).sort());
const pins = { version: 1, status: 'draft-teaching-not-clinical-validation', bindings: scope.surfaces.map(surface => ({
  surface, bundleSha256: scope.catalog.bundles.find(b => b.id === surface.bundle).sha256,
  lesson: specimenLessons[surface.slug],
})) };
const path = 'content/um-limb-teaching-bindings.v1.json', text = JSON.stringify(pins, null, 2) + '\n';
if (process.argv.includes('--check')) assert.equal(await readFile(path, 'utf8'), text, 'Source or teaching changed; inspect before explicitly repinning');
else await writeFile(path, text);
console.log('67 exact source/lesson/bundle bindings ' + (process.argv.includes('--check') ? 'verified' : 'pinned'));
