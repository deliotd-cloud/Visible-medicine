import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { build } from './workspace-test-build.mjs';

assert.equal(process.argv.length, 2, 'No test-mode arguments accepted');
const pins = JSON.parse(readFileSync('content/abdominal-branch-imaging-pins.json', 'utf8'));
const selected = pins.entries.filter(entry => entry.identity.fmaId === 'FMA15398');
const sibling = pins.entries.filter(entry => entry.identity.fmaId === 'FMA15400');
assert.equal(selected.length, 1);
assert.equal(sibling.length, 1);
const source = selected[0].identity;
assert.equal(source.id, 'vm:anatomy:body:abdomen:unspecified:vessel:pancreaticoduodenal-vein');
assert.deepEqual(source.sources, [
  { file: 'FJ3545', sha256: '87919e391f53ec7e464f7379c422bc6e6bdcf022db8ea7007176e38a00cc1a3c' },
  { file: 'FJ3646', sha256: '2c059c7ad26689513bbc41e13b913ed07c5bbd0696e59f85afb2a577b88f240f' },
  { file: 'FJ3655', sha256: 'c1d02f38a45db4b4504fcc453837fab56fb18a81178a62f5b7da9a4f6758c72f' },
]);
assert.deepEqual(source.validation, { status: 'unvalidated', anatomicalReview: false });

const compiled = await build({
  stdin: {
    contents: "export {bodyPancreaticVenousUsLesson} from './lib/body-pancreatic-venous-us';" +
      "export {bodyLesson} from './app/body-content';",
    resolveDir: process.cwd(), loader: 'ts',
  },
  bundle: true, write: false, platform: 'node', format: 'esm',
});
const api = await import('data:text/javascript;base64,' + Buffer.from(compiled.outputFiles[0].text).toString('base64'));
const first = api.bodyPancreaticVenousUsLesson(source, 'ultrasound');
const second = api.bodyPancreaticVenousUsLesson(source, 'ultrasound');
assert.equal(first.readiness, 'draft');
assert.deepEqual(api.bodyLesson(source, 'ultrasound'), first, 'Wire the exact lesson into the resolver before running this test');
assert.match(first.title, /transabdominal ultrasound/i);
assert.match(first.body, /50 consecutive subjects selected because the pancreatic head was well seen/i);
assert.match(first.body, /not give an unselected population detection rate/i);
assert.match(first.body, /does not.*identify any of the three source components/i);
assert.match(first.bullets.join(' '), /portal vein/i);
assert.match(first.bullets.join(' '), /porta hepatis/i);
assert.match(first.bullets.join(' '), /40% overall/i);
assert.match(first.bullets.join(' '), /Lack of a Doppler signal alone did not establish absence/i);
assert.match(first.bullets.join(' '), /unvalidated source components remain one broad/i);
assert.deepEqual(first.citations, ['https://pubmed.ncbi.nlm.nih.gov/8470571/']);
assert.match(first.note, /revision-bound radiologist review pending/i);
assert.match(first.note, /patient-space registration or clinical approval/i);
assert.match(first.note, /Atlas, imaging-case and paid-lecture access remain independent/i);
assert.notStrictEqual(first.bullets, second.bullets);
assert.notStrictEqual(first.citations, second.citations);
first.bullets.push('foreign'); first.citations.push('https://foreign.example');
assert.equal(second.bullets.length, 3);
assert.equal(second.citations.length, 1);
const teachingWords = [second.body, ...second.bullets].join(' ').trim().split(/\s+/).length;
assert(teachingWords < 180, `Study-derived teaching exceeds scope: ${teachingWords} words`);

for (const tab of ['anatomy', 'function', 'ct', 'mri', 'xray', 'pathology', 'clinical', 'quiz'])
  assert.equal(api.bodyPancreaticVenousUsLesson(source, tab), undefined, tab);
assert.equal(api.bodyPancreaticVenousUsLesson(sibling[0].identity, 'ultrasound'), undefined);
assert.equal(api.bodyLesson(sibling[0].identity, 'ultrasound').readiness, 'pending');
for (const entry of pins.entries.filter(row => row.identity.id !== source.id))
  assert.equal(api.bodyPancreaticVenousUsLesson(entry.identity, 'ultrasound'), undefined, entry.identity.id);

const mutations = [
  value => { value.id += '-foreign'; },
  value => { value.fmaId = 'FMA15400'; },
  value => { value.name = 'Posterior superior pancreaticoduodenal vein'; },
  value => { value.laterality = 'right'; },
  value => { value.region = 'pelvis'; },
  value => { value.regions[0] = 'pelvis'; },
  value => { value.bundle = 'portal-veins'; },
  value => { value.nodeName = 'FMA15400'; },
  value => { value.sourceTree = 'partof'; },
  value => { value.bounds.min[0] += 0.01; },
  value => { value.coverageNote += ' altered'; },
  value => { value.provenance.recovered = false; },
  value => { value.validation.status = 'validated'; },
  value => { value.validation.anatomicalReview = true; },
  value => { value.sources.reverse(); },
  value => { value.sources.pop(); },
  ...[0, 1, 2].flatMap(index => [
    value => { value.sources[index].file += '-foreign'; },
    value => { value.sources[index].sha256 = '0'.repeat(64); },
  ]),
];
for (const mutate of mutations) {
  const altered = structuredClone(source);
  mutate(altered);
  assert.equal(api.bodyPancreaticVenousUsLesson(altered, 'ultrasound'), undefined);
}
console.log(JSON.stringify({ passed: true, exactSources: 1, excludedSibling: 'FMA15400', teachingWords, mutationClasses: mutations.length }));
