import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { build } from './workspace-test-build.mjs';

assert.equal(process.argv.length, 2, 'No test-mode arguments are accepted');
const pins = JSON.parse(readFileSync('content/abdominal-branch-imaging-pins.json', 'utf8'));
const expected = new Map([
  ['FMA15390', ['left', 'FJ3502']],
  ['FMA15397', ['right', 'FJ3597']],
  ['FMA15407', ['right', 'FJ3591']],
  ['FMA15406', ['midline', 'FJ3543']],
]);
const selected = pins.entries.filter(entry => expected.has(entry.identity.fmaId));
assert.equal(selected.length, 4);
const compiled = await build({
  stdin: {
    contents: "export {abdominalRadialEusLesson} from './lib/abdominal-radial-eus';" +
      "export {abdominalRadialEusTopics,abdominalRadialEusReference} from './content/abdominal-radial-eus';",
    resolveDir: process.cwd(), loader: 'ts',
  },
  bundle: true, write: false, platform: 'node', format: 'esm',
});
const api = await import('data:text/javascript;base64,' + Buffer.from(compiled.outputFiles[0].text).toString('base64'));
assert.deepEqual(Object.keys(api.abdominalRadialEusTopics).sort(), [...expected.keys()].sort());
assert.equal(api.abdominalRadialEusReference, 'https://pubmed.ncbi.nlm.nih.gov/24949345/');
const clone = value => structuredClone(value);
let sourceWords = 0;
for (const entry of selected) {
  const source = entry.identity;
  const [side, file] = expected.get(source.fmaId);
  assert.equal(source.laterality, side);
  assert.equal(source.sources.length, 1);
  assert.equal(source.sources[0].file, file);
  assert.equal(source.nodeName, source.fmaId);
  assert.equal(source.validation.anatomicalReview, false);
  const topic = api.abdominalRadialEusTopics[source.fmaId];
  sourceWords += `${topic.body} ${topic.bullet}`.trim().split(/\s+/).length;
  const first = api.abdominalRadialEusLesson(source, 'ultrasound');
  const second = api.abdominalRadialEusLesson(source, 'ultrasound');
  assert.equal(first.readiness, 'draft');
  assert.equal(first.body, topic.body);
  assert.equal(first.bullets[0], topic.bullet);
  assert.deepEqual(first.citations, [api.abdominalRadialEusReference]);
  assert.match(first.title, /radial endoscopic ultrasound/i);
  assert.match(first.note, /revision-bound radiologist review pending/i);
  assert.match(first.bullets.join(' '), /do not establish routine transabdominal visibility/i);
  assert.notStrictEqual(first.bullets, second.bullets);
  assert.notStrictEqual(first.citations, second.citations);
  first.bullets.push('changed'); first.citations.push('changed');
  assert.equal(second.bullets.length, 3);
  assert.equal(second.citations.length, 1);
  for (const tab of ['anatomy', 'function', 'ct', 'mri', 'xray', 'pathology', 'clinical', 'quiz'])
    assert.equal(api.abdominalRadialEusLesson(source, tab), undefined);
  for (const mutate of [
    value => { value.id += '-foreign'; },
    value => { value.fmaId += '-foreign'; },
    value => { value.laterality = value.laterality === 'left' ? 'right' : 'left'; },
    value => { value.region = 'pelvis'; },
    value => { value.regions = ['pelvis']; },
    value => { value.nodeName += '-foreign'; },
    value => { value.sources[0].file += '-foreign'; },
    value => { value.sources[0].sha256 = '0'.repeat(64); },
    value => { value.bounds.min[0] += 0.01; },
    value => { value.validation.anatomicalReview = true; },
  ]) {
    const changed = clone(source);
    mutate(changed);
    assert.equal(api.abdominalRadialEusLesson(changed, 'ultrasound'), undefined, source.id);
  }
}
assert(sourceWords <= 150, `Source-derived body/bullet copy exceeds 150 words: ${sourceWords}`);
console.log(JSON.stringify({ passed: true, exactSelections: selected.length, sourceWords, mutationClasses: 10 }));
