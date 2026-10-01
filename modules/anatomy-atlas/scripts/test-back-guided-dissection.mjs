import assert from 'node:assert/strict';
import test from 'node:test';
import { backLayersDefinition, backLayersStudies, backLayersSurfaces } from '../lib/back-layers.ts';
import { backGuidedDissection } from '../lib/back-guided-dissection.ts';
import { guidedDissectionAction } from '../lib/specimen-guided-dissection.ts';
import { initialSpecimen, reduceSpecimen } from '../lib/independent-specimen.ts';
import { independentStudyRoutes } from '../lib/independent-study-links.ts';

const order = [
  ['supplied-context', 'all'],
  ['trapezius-aside', 'below-trapezius'],
  ['rhomboid-comparison', 'rhomboids'],
  ['latissimus-comparison', 'latissimus'],
  ['multifidus-comparison', 'multifidus'],
  ['source-context-return', 'all'],
];

test('six ordered draft steps use exact source study memberships and frame', () => {
  const guide = backGuidedDissection(backLayersDefinition);
  assert.ok(guide);
  assert.equal(guide.status, 'draft');
  assert.equal(guide.specimenKey, 'bp3d3-back-layers');
  assert.equal(guide.sourceFrame, independentStudyRoutes.find(route => route.key === guide.specimenKey).frame);
  assert.deepEqual(guide.steps.map(step => step.id), order.map(([id]) => id));
  assert.equal(new Set(guide.steps.map(step => step.id)).size, 6);
  const admitted = new Set(backLayersSurfaces.map(surface => surface.id));
  for (const [index, [, studyId]] of order.entries()) {
    const step = guide.steps[index];
    const study = backLayersStudies.find(item => item.id === studyId);
    assert.deepEqual(step.ids, study.ids);
    assert.equal(step.selectedId, study.selectedId);
    assert.equal(step.view, study.view);
    assert.ok(step.title && step.caption);
    assert.equal(new Set(step.ids).size, step.ids.length);
    assert.ok(step.ids.every(id => admitted.has(id)));
    assert.ok(step.ids.includes(step.selectedId));
  }
  assert.deepEqual(guide.steps.map(step => step.ids.length), [48, 42, 38, 36, 36, 48]);
  const trapezius = backLayersSurfaces.filter(surface => surface.sourceName.includes('trapezius'));
  assert.equal(trapezius.length, 6);
  assert.ok(trapezius.every(surface => !guide.steps[1].ids.includes(surface.id)));
  for (const [index, token, count] of [[2, 'rhomboid', 4], [3, 'latissimus', 2], [4, 'multifidus', 2]]) {
    const visibleMuscles = backLayersSurfaces.filter(surface => surface.tissue === 'muscle' && guide.steps[index].ids.includes(surface.id));
    assert.equal(visibleMuscles.length, count);
    assert.ok(visibleMuscles.every(surface => surface.sourceName.includes(token)));
    assert.ok(visibleMuscles.some(surface => surface.laterality === 'left'));
    assert.ok(visibleMuscles.some(surface => surface.laterality === 'right'));
  }
  assert.match(guide.limitation, /fascia.*spinal cord.*discs.*nerve routes/i);
  assert.match(guide.limitation, /registration.*attachment footprint/i);
});

test('step actions change visibility atomically and the original state fully restores', () => {
  const guide = backGuidedDissection(backLayersDefinition);
  const initial = initialSpecimen(backLayersDefinition);
  let state = initial;
  for (let index = 0; index < guide.steps.length; index++) {
    const action = guidedDissectionAction(backLayersDefinition, guide, index);
    assert.ok(action);
    state = reduceSpecimen(backLayersDefinition, state, action);
    assert.equal(state.selectedId, guide.steps[index].selectedId);
    assert.deepEqual(new Set(state.hidden), new Set(backLayersSurfaces.filter(surface => !guide.steps[index].ids.includes(surface.id)).map(surface => surface.id)));
  }
  const restored = reduceSpecimen(backLayersDefinition, state, { type: 'restore-state', state: initial });
  assert.deepEqual(restored, initial);
  assert.equal(guidedDissectionAction(backLayersDefinition, guide, 6), null);
});

test('original 48 surfaces and eight studies stay unchanged; returns are independent', () => {
  assert.equal(backLayersSurfaces.length, 48);
  assert.equal(backLayersStudies.length, 8);
  assert.deepEqual(backLayersStudies.map(study => study.id), ['all', 'below-trapezius', 'latissimus', 'rhomboids', 'multifidus', 'right', 'left', 'muscles']);
  const surfaces = structuredClone(backLayersSurfaces);
  const studies = structuredClone(backLayersStudies);
  const first = backGuidedDissection(backLayersDefinition);
  first.steps[0].ids.pop();
  first.steps[0].caption = 'mutated';
  const second = backGuidedDissection(backLayersDefinition);
  assert.equal(second.steps[0].ids.length, 48);
  assert.notEqual(second.steps[0].caption, 'mutated');
  assert.deepEqual(backLayersSurfaces, surfaces);
  assert.deepEqual(backLayersStudies, studies);
});

test('foreign or changed source, study, bundle, frame, laterality and IDs reject guide', () => {
  const changes = [
    definition => { definition.key = 'foreign'; },
    definition => { definition.source.version = '4.0'; },
    definition => { definition.source.license = 'foreign'; },
    definition => { definition.studies[0].ids.pop(); },
    definition => { definition.studies[1].selectedId = 'foreign'; },
    definition => { definition.catalog.bundles[0].id = 'foreign'; },
    definition => { definition.catalog.coordinateSystem.sourceToSceneColumnMajor[0] = 1; },
    definition => { definition.catalog.coordinateSystem.unitsPerMillimetre = 1; },
    definition => { definition.surfaces[0].laterality = 'left'; },
    definition => { definition.surfaces[0].bundle = 'foreign'; },
    definition => { definition.surfaces[0].id = 'foreign'; },
    definition => { definition.catalog.structures[0].id = 'foreign'; },
  ];
  for (const change of changes) {
    const altered = structuredClone(backLayersDefinition);
    change(altered);
    assert.equal(backGuidedDissection(altered), null);
  }
});
