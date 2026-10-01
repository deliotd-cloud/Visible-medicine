import assert from 'node:assert/strict';
import test from 'node:test';
import raw from '../public/models/bodyparts3d-v3/abdominal-wall/catalog.json' with { type: 'json' };
import { abdominalWallDefinition, abdominalWallStudies, abdominalWallSurfaces } from '../lib/abdominal-wall.ts';
import { abdominalGuidedDissection } from '../lib/abdominal-guided-dissection.ts';
import { independentStudyRoutes } from '../lib/independent-study-links.ts';
import { guidedDissectionAction } from '../lib/specimen-guided-dissection.ts';
import { initialSpecimen, reduceSpecimen } from '../lib/independent-specimen.ts';

const definition = abdominalWallDefinition;
const order = ['all', 'internal', 'transverse', 'rectus', 'right', 'left'];
const guide = abdominalGuidedDissection(definition);
const ids = surfaces => surfaces.map(surface => surface.id);
const muscles = abdominalWallSurfaces.filter(surface => surface.tissue === 'muscle');
const skeleton = abdominalWallSurfaces.filter(surface => surface.tissue === 'skeleton');

test('six ordered draft steps use exact source studies, visible selections and route frame', () => {
  assert.ok(guide);
  assert.equal(guide.status, 'draft');
  assert.equal(guide.specimenKey, raw.specimenId);
  assert.equal(guide.sourceFrame, independentStudyRoutes.find(route => route.key === raw.specimenId).frame);
  assert.equal(guide.sourceFrame, 'bodyparts3d-v3-20110915:source');
  assert.deepEqual(guide.steps.map(step => step.id), order.map(id => `abdominal-${id}`));
  assert.equal(new Set(guide.steps.map(step => step.id)).size, 6);
  assert.match(guide.limitation, /sheath.*inguinal.*neurovascular.*revision-bound/i);
  const admitted = new Set(ids(abdominalWallSurfaces));
  for (const [index, studyId] of order.entries()) {
    const step = guide.steps[index], study = abdominalWallStudies.find(item => item.id === studyId);
    assert.deepEqual(step.ids, study.ids);
    assert.equal(step.selectedId, study.selectedId);
    assert.equal(step.title, study.title);
    assert.equal(step.caption, study.note);
    assert.equal(step.view, study.view);
    assert.ok(step.ids.length);
    assert.equal(new Set(step.ids).size, step.ids.length);
    assert.ok(step.ids.every(id => admitted.has(id)));
    assert.ok(step.ids.includes(step.selectedId));
  }
  assert.deepEqual(guide.steps.map(step => step.ids.length), [29, 27, 25, 23, 25, 25]);
});

test('removals and laterality retain only the requested original source memberships', () => {
  const external = muscles.filter(surface => /external oblique/.test(surface.sourceName));
  const internal = muscles.filter(surface => /internal oblique/.test(surface.sourceName));
  const rectus = muscles.filter(surface => /rectus abdominis/.test(surface.sourceName));
  assert.equal(external.length, 2);
  assert.equal(internal.length, 2);
  assert.equal(rectus.length, 2);
  assert.deepEqual(guide.steps[0].ids, ids(abdominalWallSurfaces));
  assert.deepEqual(guide.steps[1].ids, ids(abdominalWallSurfaces.filter(surface => !external.includes(surface))));
  assert.deepEqual(guide.steps[2].ids, ids(abdominalWallSurfaces.filter(surface => !external.includes(surface) && !internal.includes(surface))));
  assert.deepEqual(guide.steps[3].ids, ids([...skeleton, ...rectus]));
  for (const [index, side] of [[4, 'right'], [5, 'left']]) {
    const expected = ids([...skeleton, ...muscles.filter(surface => surface.laterality === side)]);
    assert.deepEqual(guide.steps[index].ids, expected);
    assert.ok(muscles.filter(surface => surface.laterality !== side).every(surface => !guide.steps[index].ids.includes(surface.id)));
  }
  assert.notEqual(guide.steps[4].selectedId, guide.steps[5].selectedId);
});

test('actions change visibility and selection atomically, then restore full prior history', () => {
  let before = initialSpecimen(definition);
  before = reduceSpecimen(definition, before, { type: 'visibility', id: muscles[0].id, visible: false });
  before = reduceSpecimen(definition, before, { type: 'visibility', id: muscles[1].id, visible: false });
  before = reduceSpecimen(definition, before, { type: 'undo' });
  const saved = structuredClone(before);
  let state = before;
  for (const [index, step] of guide.steps.entries()) {
    const action = guidedDissectionAction(definition, guide, index);
    assert.deepEqual(action, { type: 'show-only', ids: step.ids, selectedId: step.selectedId });
    state = reduceSpecimen(definition, state, action);
    assert.deepEqual(new Set(state.hidden), new Set(ids(abdominalWallSurfaces).filter(id => !step.ids.includes(id))));
    assert.equal(state.selectedId, step.selectedId);
  }
  assert.deepEqual(before, saved);
  const restored = reduceSpecimen(definition, state, { type: 'restore-state', state: saved });
  assert.deepEqual(restored, saved);
  assert.notStrictEqual(restored, saved);
  assert.deepEqual(restored.history, saved.history);
  assert.deepEqual(restored.future, saved.future);
  for (const invalid of [-1, guide.steps.length, 0.5, NaN]) assert.equal(guidedDissectionAction(definition, guide, invalid), null);
});

test('source definitions stay unchanged and each guide is detached', () => {
  assert.equal(abdominalWallSurfaces.length, 29);
  assert.deepEqual(abdominalWallStudies.map(study => study.id), [...order, 'muscles']);
  const original = structuredClone(definition);
  const first = abdominalGuidedDissection(definition);
  first.steps[0].ids.pop();
  first.steps[0].caption = 'edited copy';
  first.steps[1].title = 'edited copy';
  const second = abdominalGuidedDissection(definition);
  assert.deepEqual(second.steps.map(step => step.ids), order.map(id => original.studies.find(study => study.id === id).ids));
  assert.equal(second.steps[0].caption, original.studies[0].note);
  assert.deepEqual(definition, original);
});

test('altered source, coordinate, study, bundle, name and laterality reject the guide', () => {
  const mutations = [
    d => { d.key = 'foreign'; },
    d => { d.source.version = 'foreign'; },
    d => { d.source.license = 'foreign'; },
    d => { d.catalog.coordinateSystem.unitsPerMillimetre = 1; },
    d => { d.catalog.coordinateSystem.sourceToSceneColumnMajor[0] = 1; },
    d => { d.studies[0].ids.pop(); },
    d => { d.catalog.bundles[0].id = 'foreign'; },
    d => { d.surfaces[0].bundle = 'foreign'; },
    d => { d.surfaces[0].name = 'foreign'; },
    d => { d.surfaces[0].sourceName = 'foreign'; },
    d => { d.surfaces[0].laterality = 'left'; },
    d => { d.surfaces[0].id = 'foreign'; },
    d => { d.surfaces[0].sources[0].sha256 = 'foreign'; },
  ];
  for (const mutate of mutations) {
    const foreign = structuredClone(definition);
    mutate(foreign);
    assert.equal(abdominalGuidedDissection(foreign), null);
  }
});
