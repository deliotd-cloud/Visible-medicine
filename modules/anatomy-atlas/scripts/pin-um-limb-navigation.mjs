import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { build } from './workspace-test-build.mjs';
const result = await build({ stdin: { contents: "export { limbDefinitions } from './lib/um-limb-studies.ts'; export { canonicalSpecimenValue, specimenNavigationPayload } from './lib/specimen-links.ts';", resolveDir: process.cwd(), loader: 'ts' }, bundle: true, write: false, format: 'esm', platform: 'node' });
const { limbDefinitions, canonicalSpecimenValue, specimenNavigationPayload } = await import('data:text/javascript;base64,' + Buffer.from(result.outputFiles[0].text).toString('base64'));
const scopes = Object.entries(limbDefinitions).map(([scope, definition]) => {
  const payload = specimenNavigationPayload(definition);
  return { scope, revision: createHash('sha256').update(canonicalSpecimenValue(payload)).digest('hex'), payload };
});
const text = JSON.stringify({ version: 1, scopes }, null, 2) + '\n', path = 'content/um-limb-navigation.v1.json';
if (process.argv.includes('--check')) assert.equal(await readFile(path, 'utf8'), text, 'Source/recipes changed; inspect before explicitly repinning navigation');
else await writeFile(path, text);
console.log('Five exact specimen source/recipe revisions ' + (process.argv.includes('--check') ? 'verified' : 'pinned'));
