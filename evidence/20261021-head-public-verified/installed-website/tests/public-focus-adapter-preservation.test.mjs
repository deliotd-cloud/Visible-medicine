import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {sha, historicalSource, currentSource, inverseSource, admitCurrent} from './public-focus-epoch-preservation.mjs';

const root = process.env.VM_PUBLIC_FOCUS_ROOT ? new URL(process.env.VM_PUBLIC_FOCUS_ROOT) : new URL('../', import.meta.url);
const witness = readFileSync(new URL('fixtures/public-focus-epochs-20261021.json', import.meta.url));
assert.equal(sha(witness), '4460693c1edc749c8afbdce2cdcc8f164ef2d60d111fea7483abd355d07b0f51', 'Exact authenticated lossless epoch recipes');
const recipes = JSON.parse(witness).rows;
const originalGuard = readFileSync(new URL('fixtures/public-focus-original-guard-20261021.mjs.raw', import.meta.url));
assert.equal(sha(originalGuard), '122396ce4bc9a81b7990aacf9db30ef1c5a82c372ae7d74545da02b0641b17c3', 'Every original registration and assertion body remains authentic');
const historical = new Map();
for (const [name, recipe] of Object.entries(recipes)) {
 const raw = readFileSync(new URL('tests/fixtures/public-focus-before-20261019/' + name + '.raw', root));
 historical.set(new URL('tests/' + name, root).href, Buffer.from(historicalSource(raw, recipe)));
}

// Replay the entire immutable guard in its actual historical authoring epoch.
// Only four ESM imports and the import.meta URL are adapted for a dependency-free
// native harness. readFileSync routes the five current-test paths to complete
// authenticated historical sources; original raw fixture reads remain real reads.
let replay = originalGuard.toString();
for (const declaration of [
 "import assert from 'node:assert/strict';",
 "import test from 'node:test';",
 "import {readFileSync} from 'node:fs';",
 "import {createHash} from 'node:crypto';",
]) {
 assert.equal(replay.split(declaration).length, 2, 'Unique original module import seam');
 replay = replay.replace(declaration, '');
}
assert.equal(replay.split('import.meta.url').length, 2, 'Unique original module URL seam');
replay = replay.replace('import.meta.url', 'guardUrl');
let registrations = 0;
const replayRead = (url, ...args) => historical.has(url.href) ? historical.get(url.href) : readFileSync(url, ...args);
const replayTest = (name, body) => { registrations++; return test(name, body); };
new Function('assert', 'test', 'readFileSync', 'createHash', 'guardUrl', 'process', replay)(
 assert, replayTest, replayRead, createHash, new URL('tests/public-focus-adapter-preservation.test.mjs', root).href,
 {env: {VM_PUBLIC_FOCUS_ROOT: root.href}},
);
assert.equal(registrations, 8, 'All eight original test registrations execute');

for (const [name, recipe] of Object.entries(recipes)) {
 const raw = readFileSync(new URL('tests/fixtures/public-focus-before-20261019/' + name + '.raw', root));
 const before = historicalSource(raw, recipe);
 const current = readFileSync(new URL('tests/' + name, root));
 test(name + ': independent complete current epoch and lossless historical inverse', () => {
  admitCurrent(current, before, recipe);
  assert.equal(inverseSource(current.toString(), recipe), before);
 });
 test(name + ': original assertions and public-focus/publishing seams reject mutations', () => {
  assert.throws(() => historicalSource(Buffer.concat([raw, Buffer.from('// unknown appendix\n')]), recipe));
  let assertionLines = 0;
  for (const line of raw.toString().split('\n').filter(line => line.includes('assert.'))) {
   assertionLines++;
   assert.throws(() => historicalSource(Buffer.from(raw.toString().replace(line, '')), recipe));
  }
  assert(assertionLines > 0);
  for (const [oldText, newText] of recipe.publicFocusSeams) {
   assert.throws(() => currentSource(before.replace(newText, oldText), recipe));
  }
  if (recipe.publishingDisclosure) {
   assert.throws(() => currentSource(before.replace(recipe.publishingDisclosure.after, recipe.publishingDisclosure.before), recipe));
  }
 });
 test(name + ': every current assertion and each exact Review seam rejects deletion reversal and duplication', () => {
  const text = current.toString();
  assert.throws(() => admitCurrent(Buffer.concat([current, Buffer.from('// unknown appendix\n')]), before, recipe));
  let assertionLines = 0;
  for (const line of text.split('\n').filter(line => line.includes('assert.'))) {
   assertionLines++;
   assert.throws(() => admitCurrent(Buffer.from(text.replace(line, '')), before, recipe));
  }
  assert(assertionLines > 0);
  let delta = 0;
  for (const seam of recipe.currentSeams) {
   const at = seam.at + delta, end = at + seam.after.length;
   assert.equal(text.slice(at, end), seam.after, 'Exact current seam before mutation');
   for (const replacement of ['', seam.before, seam.after + seam.after]) {
    assert.throws(() => admitCurrent(Buffer.from(text.slice(0, at) + replacement + text.slice(end)), before, recipe));
   }
   const forged = structuredClone(recipe);
   forged.currentSeams[seam.ordinal - 1].at++;
   assert.throws(() => currentSource(before, forged), 'A shifted or unlisted seam fails the full-source closure');
   delta += seam.after.length - seam.before.length;
  }
 });
}
