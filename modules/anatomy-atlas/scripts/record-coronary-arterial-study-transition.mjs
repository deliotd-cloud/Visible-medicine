// Mechanical offline snapshot comparison. Only the baseline dissection-data source is substituted.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { dirname } from 'node:path';
import { runInNewContext } from 'node:vm';
import { dissectionProfiles as currentProfiles } from '../app/dissection-data.ts';
import { build } from './workspace-component-test-build.mjs';

const sourceCommit = '12570b5245dc6a253cbdd73ec4e044c58b81a927';
const id = 'coronary-arterial-surfaces';
const regions = ['thorax', 'whole-body'];
const hash = (value) => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const baselineSource = execFileSync('git', ['show', `${sourceCommit}:app/dissection-data.ts`], {
  encoding: 'utf8', maxBuffer: 16_000_000,
});
const result = await build({
  stdin: {
    contents: "export { dissectionProfiles } from './app/dissection-data.ts';",
    resolveDir: process.cwd(), loader: 'ts',
  },
  bundle: true, platform: 'node', format: 'cjs', write: false,
  plugins: [{
    name: 'exact-baseline-dissection-source',
    setup(api) {
      api.onLoad({ filter: /[\\/]app[\\/]dissection-data\.ts$/, namespace: 'component-test' },
        (args) => ({ contents: baselineSource, loader: 'ts', resolveDir: dirname(args.path) }));
    },
  }],
});
const module = { exports: {} };
runInNewContext(result.outputFiles[0].text, {
  module, exports: module.exports, require: createRequire(import.meta.url), structuredClone,
});
const before = JSON.parse(JSON.stringify(module.exports.dissectionProfiles));
const after = JSON.parse(JSON.stringify(currentProfiles));
assert.deepEqual(Object.keys(after), Object.keys(before), 'Profile scope and order are unchanged');
for (const region of Object.keys(before).filter((key) => !regions.includes(key)))
  assert.deepEqual(after[region], before[region], `${region} was not changed`);
const patches = [];
for (const region of regions) {
  const oldProfile = before[region], newProfile = after[region];
  assert.deepEqual(Object.keys(newProfile), Object.keys(oldProfile), `${region} profile shape`);
  const otherKeys = Object.keys(oldProfile).filter((key) => !['focuses', 'references'].includes(key));
  for (const key of otherKeys)
    assert.deepEqual(newProfile[key], oldProfile[key], `${region}.${key} was not changed`);
  assert.equal(oldProfile.focuses.filter((focus) => focus.id === id).length, 0);
  const matches = newProfile.focuses.map((focus, index) => ({ focus, index }))
    .filter(({ focus }) => focus.id === id);
  assert.equal(matches.length, 1, `Exactly one new ${region} focus`);
  const { focus, index } = matches[0];
  assert.deepEqual(newProfile.focuses.filter((item) => item.id !== id), oldProfile.focuses,
    `${region} prior focus order and contents`);
  assert.deepEqual(newProfile.references.slice(0, oldProfile.references.length), oldProfile.references,
    `${region} prior reference order and contents`);
  patches.push({
    region,
    index,
    added: focus,
    referenceIndex: oldProfile.references.length,
    referencesAdded: newProfile.references.slice(oldProfile.references.length),
  });
}
assert.deepEqual(patches.map((patch) => patch.region), regions);
const record = {
  sourceCommit,
  beforeHash: hash(before),
  afterHash: hash(after),
  patches,
};
const path = 'content/coronary-arterial-study.transition.json';
const output = `${JSON.stringify(record, null, 2)}\n`;
if (process.argv.includes('--check')) {
  assert.equal((await readFile(path, 'utf8')).replace(/\r\n/g, '\n'), output);
} else {
  await writeFile(path, output, { flag: 'wx' });
}
console.log(JSON.stringify({ beforeHash: record.beforeHash, afterHash: record.afterHash,
  recordHash: hash(record), referencesAdded: patches.map((patch) => patch.referencesAdded.length) }));
