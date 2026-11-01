import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { runInNewContext } from 'node:vm';
import test from 'node:test';

const require = createRequire(import.meta.url);
const ts = require('F:/VisibleMedicine/website/node_modules/typescript');
const proposal = join(dirname(fileURLToPath(import.meta.url)), 'cricothyroid-teaching.ts');
const baseline = 'F:/VisibleMedicine/atlas/content/cricothyroid-teaching.ts';
const baselineHash = 'ad6404871498f39639a478eef5a17c6abe8395e7351d2a6c8595606d2533b68d';
const addedReferences = {
  cricothyroidUltrasoundEMG: 'https://pubmed.ncbi.nlm.nih.gov/26602419/',
  cricothyroidAirwaySonography: 'https://pubmed.ncbi.nlm.nih.gov/20040778/',
};

function loadModule(source) {
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  });
  const exports = {};
  runInNewContext(compiled.outputText, { exports }, { filename: 'cricothyroid-teaching.js' });
  return JSON.parse(JSON.stringify(exports));
}

test('staged ultrasound adds only two references and one draft section to the exact source baseline', () => {
  const baselineSource = readFileSync(baseline, 'utf8');
  assert.equal(createHash('sha256').update(readFileSync(baseline)).digest('hex'), baselineHash);
  const before = loadModule(baselineSource);
  const after = loadModule(readFileSync(proposal, 'utf8'));
  assert.deepEqual(Object.keys(after).sort(), Object.keys(before).sort());
  assert.equal(after.cricothyroidConcepts.length, 1);
  const concept = after.cricothyroidConcepts[0];
  assert.equal(concept.id, 'cricothyroid-source-parts');
  assert.deepEqual(concept.fmaIds, ['FMA46611', 'FMA46612', 'FMA46613', 'FMA46614']);
  assert.equal(concept.imaging.ultrasound.readiness, 'draft');
  assert.deepEqual(concept.imaging.ultrasound.references, Object.keys(addedReferences));
  const words = concept.imaging.ultrasound.body.trim().split(/\s+/).length;
  assert.ok(words >= 90 && words <= 130, `ultrasound body has ${words} words`);
  for (const [key, url] of Object.entries(addedReferences)) {
    assert.equal(after.cricothyroidTeachingReferences[key].url, url);
    assert.match(after.cricothyroidTeachingReferences[key].title, /research abstract/);
  }
  assert.deepEqual(
    Object.keys(after.cricothyroidTeachingReferences).filter((key) => !(key in before.cricothyroidTeachingReferences)).sort(),
    Object.keys(addedReferences).sort(),
  );
  for (const key of Object.keys(addedReferences)) delete after.cricothyroidTeachingReferences[key];
  delete concept.imaging.ultrasound;
  assert.deepEqual(after, before);

  const staged = loadModule(readFileSync(proposal, 'utf8'));
  const refs = staged.cricothyroidTeachingReferences;
  const collect = (value) => {
    if (!value || typeof value !== 'object') return;
    if (Array.isArray(value)) return value.forEach(collect);
    if (Array.isArray(value.references)) {
      for (const key of value.references) assert.ok(refs[key], `missing citation ${key}`);
    }
    for (const entry of Object.values(value)) collect(entry);
  };
  collect(staged.cricothyroidConcepts);
});
