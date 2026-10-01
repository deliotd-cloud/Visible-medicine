import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import { renderRequirementSummary } from './requirement-summary.mjs';

const report = JSON.parse(await readFile(new URL('../docs/requirement-audit.json', import.meta.url), 'utf8'));
const names = { anatomy: 'Anatomy', function: 'Function', ct: 'CT', mri: 'MRI', xray: 'X-ray', ultrasound: 'Ultrasound', pathology: 'Pathology', clinical: 'Clinical', quiz: 'Quiz notes' };
const categories = ['specificDraft', 'identityOnly', 'pending', 'generatedIdentification'];

test('all readiness scopes render actual counts and conserve their representation totals', () => {
  const output = renderRequirementSummary(report);
  for (const [scope, counts, total] of [
    ['Root-body', report.teaching.body, report.anatomy.bodyRepresentations],
    ['Nested', report.teaching.nested.topics, report.teaching.nested.representations],
    ['Dedicated shoulder', report.teaching.shoulder, report.anatomy.shoulderRepresentations],
  ]) {
    const section = output.split(`## ${scope} teaching readiness\n`)[1].split('\n## ')[0];
    for (const [topic, name] of Object.entries(names)) {
      const values = categories.map(category => counts[topic][category]);
      assert.equal(values.reduce((sum, value) => sum + value, 0), total);
      assert(section.includes(`| ${name} | ${values.join(' | ')} |`));
    }
  }
  assert(output.includes(`${report.anatomy.bodyRepresentations * 9} topic placements`));
});

test('readiness changes affect the correct scope and invalid totals are rejected', () => {
  const changed = structuredClone(report);
  changed.teaching.body.ct.specificDraft++;
  changed.teaching.body.ct.pending--;
  const before = renderRequirementSummary(report), after = renderRequirementSummary(changed);
  assert.notEqual(before.split('## Nested teaching readiness')[0], after.split('## Nested teaching readiness')[0]);
  assert.equal(before.split('## Nested teaching readiness')[1], after.split('## Nested teaching readiness')[1]);
  changed.teaching.body.ct.pending++;
  assert.throws(() => renderRequirementSummary(changed), /ct readiness must cover its scope/);
  changed.teaching.body.ct.pending = -1;
  assert.throws(() => renderRequirementSummary(changed), /Invalid ct readiness count/);
});

test('empty Atlas registry is explicitly distinct from implemented viewers and website evidence', () => {
  const empty = structuredClone(report);
  empty.learningIntegration.configuredResources = 0;
  empty.learningIntegration.configuredCorrespondences = 0;
  assert(!Object.hasOwn(report.learningIntegration, 'liveViewerIntegration'));
  for (const path of Object.values(report.learningIntegration.implementedCapabilities))
    assert(report.sourceHashes[path], `Capability source is fingerprinted: ${path}`);
  const output = renderRequirementSummary(empty);
  assert(output.includes('0 configured resources / 0 correspondences'));
  assert(output.includes('optional decoded CT/MRI viewer'));
  assert(output.includes('completed native MRI synthetic QA'));
  assert(output.includes('not the separate website host configuration'));
  assert(output.includes('does not inspect that website'));
  assert(output.includes('privacy/rights clearance, server entitlements and validated correspondence'));
  assert(!output.includes('No CT/MRI/X-ray/US viewer'));
  const configured = structuredClone(report);
  configured.learningIntegration.configuredResources = 2;
  configured.learningIntegration.configuredCorrespondences = 3;
  assert(renderRequirementSummary(configured).includes('2 configured resources / 3 correspondences'));
});

test('guided learning uses resolved inventory counts and keeps shoulder scope separate', () => {
  const output = renderRequirementSummary(report), tours = report.study.guidedLearning;
  assert(report.sourceHashes.guidedLearningData);
  assert(report.sourceHashes['lib/eye-layer-guide.ts']);
  assert(report.sourceHashes.nestedEyeGuidedLearningData);
  assert(output.includes(`${tours.regionalTours} regional tours / ${tours.regionalStops} stops; dedicated shoulder ${tours.shoulderTours} tour / ${tours.shoulderStops} stops`));
  assert.equal(tours.regionalTours, 24);
  assert.equal(tours.nestedStudies.length, 2);
  assert.deepEqual(tours.nestedStudies.map(guide => guide.parentId).sort(), [
    'vm:anatomy:body:head-neck:left:organ:left-eyeball',
    'vm:anatomy:body:head-neck:right:organ:right-eyeball',
  ]);
  assert.equal(tours.nestedStudies.reduce((n, guide) => n + guide.steps, 0), 8);
  assert.equal(tours.nestedStudies.reduce((n, guide) => n + guide.representations, 0), 15);
  assert.equal(new Set(tours.nestedStudies.flatMap(guide => guide.children.map(child => child.id))).size, 15);
  for (const guide of tours.nestedStudies) {
    assert.equal(guide.study, 'eye');
    assert.equal(guide.readiness, 'draft');
    assert.equal(guide.geometryChanged, false);
    assert.equal(guide.representations, guide.children.length);
    assert.match(guide.parentSourceHash, /^[a-f0-9]{64}$/);
    assert(guide.children.every(child => child.sourceHash && child.sourceFiles.length));
  }
  assert(output.includes('2 source-bound draft guides / 8 stops across 15 existing distinct eye children'));
  assert(output.includes('overlaps the nested anatomy above'));
  const changed = structuredClone(report);
  changed.study.guidedLearning.regionalStops++;
  assert.notEqual(renderRequirementSummary(changed), output);
  const nestedChanged = structuredClone(report);
  nestedChanged.study.guidedLearning.nestedStudies[0].steps++;
  assert.notEqual(renderRequirementSummary(nestedChanged), output);
  nestedChanged.study.guidedLearning.nestedStudies[0].steps=-1;
  assert.throws(()=>renderRequirementSummary(nestedChanged),/Invalid nested guide stop count/);
  const badCount=structuredClone(report);badCount.study.guidedLearning.nestedStudies[0].representations++;
  assert.throws(()=>renderRequirementSummary(badCount),/representation count must match/);
  const duplicate=structuredClone(report),guide=duplicate.study.guidedLearning.nestedStudies[0];
  guide.children[1]=structuredClone(guide.children[0]);
  assert.throws(()=>renderRequirementSummary(duplicate),/children must be distinct/);
});
