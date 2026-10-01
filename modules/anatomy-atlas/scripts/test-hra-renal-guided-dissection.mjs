import assert from 'node:assert/strict';
import test from 'node:test';
import raw from '../public/models/hra-renal/catalog.json' with { type: 'json' };
import { hraRenalDefinition, hraRenalStudies, hraRenalSurfaces } from '../lib/hra-renal.ts';
import { hraRenalGuidedDissection } from '../lib/hra-renal-guided-dissection.ts';
import { guidedDissectionAction } from '../lib/specimen-guided-dissection.ts';
import { initialSpecimen, reduceSpecimen } from '../lib/independent-specimen.ts';

const order = [
  ['right-supplied-layers', 'layers-right', 37],
  ['right-interior', 'internal-right', 34],
  ['right-collecting', 'collecting-right', 14],
  ['left-supplied-layers', 'layers-left', 40],
  ['left-interior', 'internal-left', 37],
  ['left-collecting', 'collecting-left', 15],
  ['bilateral-hila', 'hila', 7],
  ['bilateral-pelves-ureters', 'ureters', 4],
];
const renalId = slug => `vm:reference:hra-united-female-v1-10:kidneys:${slug}`;
const heldSourceNames = [
  'VH_F_outer_cortex_of_kidney_L',
  'VH_F_renal_column_R',
  'VH_F_left_renal_vein',
];

test('eight ordered draft steps use the exact existing renal studies and source frame', () => {
  const guide = hraRenalGuidedDissection(hraRenalDefinition);
  assert.ok(guide);
  assert.equal(guide.status, 'draft');
  assert.equal(guide.specimenKey, raw.specimenId);
  assert.equal(guide.sourceFrame, raw.sourceFrame);
  assert.equal(guide.sourceFrame, 'hra-united-female-v1.10:lps-mm');
  assert.deepEqual(guide.steps.map(step => step.id), order.map(([id]) => id));
  assert.equal(new Set(guide.steps.map(step => step.id)).size, order.length);
  const admitted = new Set(hraRenalSurfaces.map(surface => surface.id));
  for (const [index, [, studyId, count]] of order.entries()) {
    const step = guide.steps[index];
    const study = hraRenalStudies.find(item => item.id === studyId);
    assert.ok(study);
    assert.deepEqual(step.ids, study.ids);
    assert.equal(step.ids.length, count);
    assert.equal(step.selectedId, study.selectedId);
    assert.equal(step.view, study.view);
    assert.ok(step.title && step.caption);
    assert.equal(new Set(step.ids).size, step.ids.length);
    assert.ok(step.ids.includes(step.selectedId));
    assert.ok(step.ids.every(id => admitted.has(id)));
  }
  assert.equal(guide.steps[0].selectedId, renalId('kidney-capsule-r'));
  assert.equal(guide.steps[3].selectedId, renalId('kidney-capsule-l'));
  assert.equal(guide.steps[7].ids.filter(id => id.endsWith('-ureter')).length, 2);
  assert.match(guide.limitation, /radiologist review/i);
});

test('held surfaces and side-specific boundaries remain excluded', () => {
  const guide = hraRenalGuidedDissection(hraRenalDefinition);
  assert.equal(hraRenalSurfaces.length, 82);
  assert.equal(hraRenalStudies.length, 9);
  assert.deepEqual(hraRenalStudies.map(study => study.id), [
    'internal-right', 'collecting-right', 'layers-right',
    'internal-left', 'collecting-left', 'layers-left', 'hila', 'ureters', 'all',
  ]);
  assert.ok(heldSourceNames.every(name => !hraRenalSurfaces.some(surface => surface.sourceName === name)));
  for (const step of guide.steps) {
    const names = step.ids.map(id => hraRenalSurfaces.find(surface => surface.id === id)?.sourceName);
    assert.ok(heldSourceNames.every(name => !names.includes(name)));
  }
  for (const index of [0, 1, 2, 3, 4, 5]) {
    const side = index < 3 ? 'right' : 'left';
    assert.ok(guide.steps[index].ids.every(id => hraRenalSurfaces.find(surface => surface.id === id)?.laterality === side));
  }
  for (const index of [2, 5]) {
    assert.ok(guide.steps[index].ids.every(id => !id.endsWith('-ureter')));
    assert.ok(guide.steps[index].ids.every(id => hraRenalSurfaces.find(surface => surface.id === id)?.concept !== 'papilla'));
  }
  assert.ok(guide.steps[6].ids.every(id => !id.endsWith('-ureter')));
  assert.ok(guide.steps[7].ids.every(id => ['pelvis', 'ureter'].includes(hraRenalSurfaces.find(surface => surface.id === id)?.concept)));
});

test('guide steps drive exact visibility, then restore the original state', () => {
  const guide = hraRenalGuidedDissection(hraRenalDefinition);
  const initial = initialSpecimen(hraRenalDefinition);
  let state = initial;
  for (let index = 0; index < guide.steps.length; index++) {
    const action = guidedDissectionAction(hraRenalDefinition, guide, index);
    assert.ok(action);
    state = reduceSpecimen(hraRenalDefinition, state, action);
    assert.equal(state.selectedId, guide.steps[index].selectedId);
    assert.deepEqual(new Set(state.hidden), new Set(hraRenalSurfaces.filter(surface => !guide.steps[index].ids.includes(surface.id)).map(surface => surface.id)));
  }
  assert.deepEqual(reduceSpecimen(hraRenalDefinition, state, { type: 'restore-state', state: initial }), initial);
  assert.equal(guidedDissectionAction(hraRenalDefinition, guide, guide.steps.length), null);
});

test('returned guide is detached and altered definitions reject', () => {
  const surfaces = structuredClone(hraRenalSurfaces);
  const studies = structuredClone(hraRenalStudies);
  const first = hraRenalGuidedDissection(hraRenalDefinition);
  first.steps[0].ids.pop();
  first.steps[0].caption = 'changed';
  first.limitation = 'changed';
  const second = hraRenalGuidedDissection(hraRenalDefinition);
  assert.equal(second.steps[0].ids.length, 37);
  assert.notEqual(second.steps[0].caption, 'changed');
  assert.notEqual(second.limitation, 'changed');
  assert.deepEqual(hraRenalSurfaces, surfaces);
  assert.deepEqual(hraRenalStudies, studies);

  const changes = [
    definition => { definition.key = 'foreign'; },
    definition => { definition.source.version = 'v2'; },
    definition => { definition.source.license = 'foreign'; },
    definition => { definition.source.sha256 = 'foreign'; },
    definition => { definition.catalog.coordinateSystem.unitsPerMillimetre = 1; },
    definition => { definition.catalog.coordinateSystem.sourceToSceneColumnMajor[0] = 1; },
    definition => { definition.catalog.bundles[0].sha256 = 'foreign'; },
    definition => { definition.surfaces[0].bundle = 'foreign'; },
    definition => { definition.surfaces[0].sources[0].sha256 = 'foreign'; },
    definition => { definition.surfaces[0].id = 'foreign'; },
    definition => { definition.catalog.structures[0].id = 'foreign'; },
    definition => { definition.studies[0].ids.pop(); },
    definition => { definition.studies[0].selectedId = 'foreign'; },
    definition => { definition.studies[0].view = 'posterior'; },
  ];
  for (const change of changes) {
    const altered = structuredClone(hraRenalDefinition);
    change(altered);
    assert.equal(hraRenalGuidedDissection(altered), null);
  }
});
