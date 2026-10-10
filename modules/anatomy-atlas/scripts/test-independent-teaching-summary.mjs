import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { renderRequirementSummary } from './requirement-summary.mjs';
import { build } from './workspace-test-build.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const report = JSON.parse(await readFile(new URL('../docs/requirement-audit.json', import.meta.url), 'utf8'));
const topics = ['clinical', 'pathology', 'ct', 'mri', 'xray', 'ultrasound'];
const labels = ['Clinical', 'Pathology', 'CT', 'MRI', 'X-ray', 'Ultrasound'];
const specimens = [
  { name: 'Lower limb', link: 'UM_LIMB_DISSECTION.md', get: a => a.independentSpecimens[0], counts: s => s.detailedTeaching.extendedTopics },
  { name: 'Kidneys', link: 'HRA_KIDNEY_SPECIMEN.md', get: a => a.renalSpecimen, counts: s => s.extendedByTopic },
  { name: 'Female pelvis', link: 'HRA_FEMALE_PELVIS.md', get: a => a.femalePelvicSpecimen, counts: s => s.extendedByTopic },
  { name: 'Abdominal wall', link: 'ABDOMINAL_WALL_SPECIMEN.md', get: a => a.abdominalWallSpecimen, counts: s => s.detailedTeaching.extendedByTopic },
  { name: 'Back layers', link: 'BACK_LAYERS_SPECIMEN.md', get: a => a.backLayersSpecimen, counts: s => s.extendedTopicDrafts },
];
const compiled = await build({
  stdin: {
    contents: `export { limbDefinitions } from './lib/um-limb-studies.ts';
export { specimenTeachingFor } from './lib/um-limb-teaching.ts';
export { hraRenalDefinition } from './lib/hra-renal.ts';
export { hraRenalTeaching } from './lib/hra-renal-teaching.ts';
export { hraPelvisDefinition } from './lib/hra-pelvis.ts';
export { hraPelvicTeaching } from './lib/hra-pelvis-teaching.ts';
export { abdominalWallDefinition } from './lib/abdominal-wall.ts';
export { abdominalTeachingFor } from './lib/abdominal-wall-teaching.ts';
export { backLayersDefinition } from './lib/back-layers.ts';
export { backLayersTeachingFor } from './lib/back-layers-teaching.ts';`,
    resolveDir: root, loader: 'ts',
  },
  bundle: true, write: false, format: 'esm', platform: 'node',
});
const source = await import('data:text/javascript;base64,' + Buffer.from(compiled.outputFiles[0].text).toString('base64'));
const definitions = [
  [source.limbDefinitions.whole, source.specimenTeachingFor],
  [source.hraRenalDefinition, source.hraRenalTeaching],
  [source.hraPelvisDefinition, source.hraPelvicTeaching],
  [source.abdominalWallDefinition, source.abdominalTeachingFor],
  [source.backLayersDefinition, source.backLayersTeachingFor],
];
const table = output => output.split('## Independent specimen teaching readiness\n')[1]?.split('\n## ')[0];
const otherReadiness = output => output.split('## Root-body teaching readiness\n')[1]?.split('\n## Imaging implementation')[0];
const draftCount = (specimen, topic, index) => index === 0 ? specimen.detailedTeaching.extendedTopics[topic].draft : specimens[index].counts(specimen)[topic];
const pendingCount = (specimen, topic, index) => index === 0 ? specimen.detailedTeaching.extendedTopics[topic].pending : specimen.representations - draftCount(specimen, topic, index);

test('five independent source frames resolve six topics and conserve every displayed row', () => {
  const output = renderRequirementSummary(report);
  const section = table(output);
  assert(section);
  assert(section.includes(`| Independent specimen | ${labels.join(' | ')} |`));
  const actualRows = section.split('\n').filter(line => line.startsWith('| [')).map(line => line.split(']')[0].slice(3));
  assert.deepEqual(actualRows, specimens.map(s => s.name));
  for (const [index, { name, link, get, counts }] of specimens.entries()) {
    const specimen = get(report.anatomy);
    const [definition, resolve] = definitions[index];
    assert.equal(specimen.representations, definition.surfaces.length, `${name} source frame`);
    const cells = topics.map(topic => {
      const fromSource = definition.surfaces.filter(surface => {
        const entry = resolve(definition, surface)?.extended?.topics[topic];
        return entry?.readiness === 'draft';
      }).length;
      const draft = draftCount(specimen, topic, index);
      const pending = pendingCount(specimen, topic, index);
      assert.equal(draft, fromSource, `${name} ${topic} source resolver`);
      assert.equal(draft + pending, specimen.representations, `${name} ${topic} coverage`);
      return `${draft} / ${pending}`;
    });
    assert.deepEqual(Object.keys(counts(specimen)), topics, `${name} topic order`);
    assert(section.includes(`| [${name}](${link}) | ${cells.join(' | ')} |`));
  }
});

test('a valid topic change updates only its independent row', () => {
  const original = renderRequirementSummary(report);
  for (const [index, { name, get, counts }] of specimens.entries()) {
    const changed = structuredClone(report);
    const specimen = get(changed.anatomy);
    const topic = topics[index];
    const current = draftCount(specimen, topic, index);
    const next = current > 0 ? current - 1 : current + 1;
    if (index === 0) {
      counts(specimen)[topic].draft = next;
      counts(specimen)[topic].pending = specimen.representations - next;
    } else counts(specimen)[topic] = next;
    const result = renderRequirementSummary(changed);
    assert.notEqual(table(result), table(original), `${name} row changed`);
    assert.equal(otherReadiness(result), otherReadiness(original), `${name} did not alter root, nested or shoulder readiness`);
    const otherNames = specimens.filter((_, i) => i !== index);
    for (const other of otherNames) {
      const row = value => table(value).split('\n').find(line => line.startsWith(`| [${other.name}](`));
      assert.equal(row(result), row(original), `${name} did not alter ${other.name}`);
    }
  }
});

test('invalid counts, missing counts and inconsistent lower-limb pending are rejected', () => {
  for (const [index, { name, get, counts }] of specimens.entries()) {
    for (const invalid of [-1, 0.5, NaN, undefined, 1e100, get(report.anatomy).representations + 1]) {
      const changed = structuredClone(report);
      const specimen = get(changed.anatomy);
      if (index === 0) counts(specimen).clinical.draft = invalid;
      else counts(specimen).clinical = invalid;
      assert.throws(() => renderRequirementSummary(changed), new RegExp(`Invalid ${name} clinical draft count`));
    }
  }
  const inconsistent = structuredClone(report);
  inconsistent.anatomy.independentSpecimens[0].detailedTeaching.extendedTopics.clinical.pending++;
  assert.throws(() => renderRequirementSummary(inconsistent), /Lower limb clinical readiness must cover its scope/);
  const missingPending = structuredClone(report);
  delete missingPending.anatomy.independentSpecimens[0].detailedTeaching.extendedTopics.clinical.pending;
  assert.throws(() => renderRequirementSummary(missingPending), /Invalid Lower limb clinical pending count/);
  const negativePending = structuredClone(report);
  negativePending.anatomy.independentSpecimens[0].detailedTeaching.extendedTopics.clinical.pending = -1;
  assert.throws(() => renderRequirementSummary(negativePending), /Invalid Lower limb clinical pending count/);
  const zero = structuredClone(report);
  zero.anatomy.femalePelvicSpecimen.extendedByTopic.ct = 0;
  assert(table(renderRequirementSummary(zero)).includes(`0 / ${zero.anatomy.femalePelvicSpecimen.representations}`));
});

test('saved current status equals the rendered source audit', async () => {
  const saved = await readFile(new URL('../docs/CURRENT_STATUS.md', import.meta.url), 'utf8');
  assert.equal(saved, renderRequirementSummary(report));
});

test('lower-limb document distinguishes current source counts from its historical 228 milestone', async () => {
  const document = await readFile(new URL('../docs/UM_LIMB_CLINICAL.md', import.meta.url), 'utf8');
  const [current, history] = document.split('## Historical additions');
  const counts = report.anatomy.independentSpecimens[0].detailedTeaching.extendedTopics;
  const total = topics.reduce((sum, topic) => sum + counts[topic].draft, 0);
  assert(current.includes(`${total} introductory extended-topic draft placements`));
  assert(topics.every(topic => counts[topic].draft === counts.clinical.draft), 'Update the narrative if per-topic coverage diverges');
  assert(current.includes(`${counts.clinical.draft} each for Clinical, Pathology, CT, MRI, X-ray and Ultrasound`));
  assert(current.includes('`pelvis-group` and `foot-bone-group`'));
  assert(!current.includes('228-topic'));
  assert(history.includes('The historical 228-topic milestone'));
});
