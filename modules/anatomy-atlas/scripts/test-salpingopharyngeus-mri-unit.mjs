import assert from 'node:assert/strict';
import { build } from './workspace-test-build.mjs';
import pins from '../content/pharyngeal-muscle-teaching-pins.json' with { type: 'json' };

const compiled = await build({
  stdin: {
    contents: "export { salpingopharyngeusMriLesson as lesson } from './lib/salpingopharyngeus-mri';",
    resolveDir: process.cwd(),
    loader: 'ts',
  },
  bundle: true,
  write: false,
  format: 'esm',
  platform: 'node',
});
const { lesson } = await import('data:text/javascript;base64,' +
  Buffer.from(compiled.outputFiles[0].text).toString('base64'));
const entries = pins.entries.filter(entry => entry.family === 'salpingo');
assert.deepEqual(entries.map(entry => [entry.identity.fmaId, entry.identity.sources[0]?.file]), [
  ['FMA46670', 'FJ2745'],
  ['FMA46669', 'FJ2757'],
]);

let refusals = 0;
for (const { identity } of entries) {
  const original = lesson(identity, 'mri');
  assert.equal(original.readiness, 'draft');
  assert.equal(original.citations.length, 1);
  assert.equal(original.citations[0], 'https://pubs.asha.org/doi/abs/10.1044/2021_JSLHR-20-00483');
  assert.match(original.body, /15 healthy participants/);
  assert.match(original.bullets.join(' '), /routine MRI/);
  assert.match(original.note, /revision-bound radiologist review pending/);
  assert.match(original.note, /access remain independent/);

  const expected = structuredClone(original);
  original.bullets.push('foreign');
  original.citations.push('foreign');
  assert.deepEqual(lesson(identity, 'mri'), expected);

  for (const tab of ['ct', 'anatomy', 'function', 'clinical', 'quiz', 'xray', 'ultrasound', 'pathology']) {
    assert.equal(lesson(identity, tab), undefined);
    refusals++;
  }
  for (const mutate of [
    structure => { structure.id += '-foreign'; },
    structure => { structure.fmaId = 'foreign'; },
    structure => { structure.laterality = 'unknown'; },
    structure => { structure.laterality = identity.laterality === 'left' ? 'right' : 'left'; },
    structure => { structure.name = 'foreign'; },
    structure => { structure.bundle = 'foreign'; },
    structure => { structure.system = 'organs'; },
    structure => { structure.category = 'organ'; },
    structure => { structure.region = 'abdomen'; },
    structure => { structure.sources[0].file = 'foreign'; },
    structure => { structure.sources[0].sha256 = '0'.repeat(64); },
    structure => { structure.sources = []; },
    structure => { structure.bounds.max[0] += 1; },
    structure => { structure.center[0] += 1; },
    structure => { structure.anchor[0] += 1; },
    structure => { structure.validation.anatomicalReview = true; },
    structure => { structure.validation.status = 'reviewed'; },
    structure => { structure.unexpected = true; },
  ]) {
    const altered = structuredClone(identity);
    mutate(altered);
    assert.equal(lesson(altered, 'mri'), undefined);
    refusals++;
  }
}
for (const { identity } of pins.entries.filter(entry => entry.family !== 'salpingo')) {
  assert.equal(lesson(identity, 'mri'), undefined);
  refusals++;
}
console.log(JSON.stringify({ drafts: entries.length, refusals, sourceOnly: true, clinicalApproval: false }));
