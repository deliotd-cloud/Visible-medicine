import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { build } from './workspace-test-build.mjs';

// A small real-module graph only. Resolver/cohort/build acceptance is separate.
const pins = JSON.parse(readFileSync('content/abdominal-branch-imaging-pins.json', 'utf8'));
const source = pins.entries.find(row => row.identity.fmaId === 'FMA15398').identity;
const compiled = await build({
  stdin: { contents: "export {bodyPancreaticVenousUsLesson as lesson} from './lib/body-pancreatic-venous-us';", resolveDir: process.cwd(), loader: 'ts' },
  bundle: true, write: false, platform: 'node', format: 'esm',
});
const { lesson } = await import('data:text/javascript;base64,' + Buffer.from(compiled.outputFiles[0].text).toString('base64'));

test('only the complete retained pancreaticoduodenal venous selection receives the draft', () => {
  assert.equal(source.id, 'vm:anatomy:body:abdomen:unspecified:vessel:pancreaticoduodenal-vein');
  assert.equal(source.sources.length, 3);
  assert.deepEqual(source.validation, { status: 'unvalidated', anatomicalReview: false });
  const output = lesson(source, 'ultrasound');
  assert.equal(output.readiness, 'draft');
  for (const tab of ['anatomy', 'function', 'ct', 'mri', 'xray', 'pathology', 'clinical', 'quiz'])
    assert.equal(lesson(source, tab), undefined, tab);
  for (const row of pins.entries.filter(row => row.identity.id !== source.id))
    assert.equal(lesson(row.identity, 'ultrasound'), undefined, row.identity.id);
});

test('each component identity, membership and order is revision-bound without invented branch names', () => {
  for (let i = 0; i < 3; i++) {
    for (const key of ['file', 'sha256']) {
      const value = structuredClone(source);
      value.sources[i][key] += '-changed';
      assert.equal(lesson(value, 'ultrasound'), undefined, i + ':' + key);
    }
  }
  for (const mutate of [s => s.sources.reverse(), s => s.sources.pop(), s => s.sources.push({ ...s.sources[0] })]) {
    const value = structuredClone(source); mutate(value);
    assert.equal(lesson(value, 'ultrasound'), undefined);
  }
  const child = { ...structuredClone(source), id: source.id + ':posterior-superior' };
  assert.equal(lesson(child, 'ultrasound'), undefined);
});

test('all source, geometry, provenance, validation and unknown fields participate in exact admission', () => {
  const changes = [
    s => s.id += '-other', s => s.fmaId = 'FMA15400', s => s.name += ' other', s => s.sourceName += ' other',
    s => s.region = 'thorax', s => s.regions.push('thorax'), s => s.system = 'muscles', s => s.category = 'organ',
    s => s.laterality = 'right', s => s.bundle += '-other', s => s.nodeName += '-other', s => s.sourceTree = 'partof',
    s => s.bounds.min[0]--, s => s.bounds.max[1]++, s => s.center[2]++, s => s.anchor[0]++,
    s => s.provenance.license = 'other', s => s.provenance.sourceVersion += '-other', s => s.provenance.recovered = false,
    s => s.validation.status = 'approved', s => s.validation.anatomicalReview = true,
    s => s.coverageNote += ' other', s => s.unknownApproval = true,
  ];
  for (const change of changes) {
    const value = structuredClone(source); change(value);
    assert.equal(lesson(value, 'ultrasound'), undefined);
  }
  assert.deepEqual(lesson(Object.fromEntries(Object.entries(source).reverse()), 'ultrasound'), lesson(source, 'ultrasound'));
});

test('study-conditioned visibility is distinct from Doppler flow and unsupported mesh branch identity', () => {
  const output = lesson(source, 'ultrasound');
  assert.match(output.body, /50 consecutive subjects selected because the pancreatic head was well seen/);
  assert.match(output.body, /does not give an unselected population detection rate/);
  assert.match(output.body, /or identify any of the three source components/);
  const bullets = output.bullets.join(' ');
  assert.match(bullets, /portal vein/); assert.match(bullets, /porta hepatis/);
  assert.match(bullets, /40% overall, despite visualization/);
  assert.match(bullets, /Lack of a Doppler signal alone did not establish absence/);
  assert.match(bullets, /unvalidated source components remain one broad/);
  assert.match(bullets, /correspondence to any acquired image are unconfirmed/);
  assert([output.body, ...output.bullets].join(' ').trim().split(/\s+/).length < 180);
});

test('only the primary reference is supplied, with no approval, procedural or registration grant', () => {
  const output = lesson(source, 'ultrasound');
  assert.deepEqual(output.citations, ['https://pubmed.ncbi.nlm.nih.gov/8470571/']);
  assert.match(output.note, /revision-bound radiologist review pending/);
  assert.match(output.note, /No publisher image or text, patient scan/);
  assert.match(output.note, /patient-space registration or clinical approval/);
  assert.match(output.note, /Atlas, imaging-case and paid-lecture access remain independent/);
});

test('callers cannot mutate the retained lesson through returned arrays', () => {
  const first = lesson(source, 'ultrasound'), second = lesson(source, 'ultrasound');
  first.bullets.push('foreign'); first.citations.push('https://foreign.example');
  assert.equal(second.bullets.length, 3); assert.equal(second.citations.length, 1);
  assert.deepEqual(lesson(source, 'ultrasound'), second);
});
