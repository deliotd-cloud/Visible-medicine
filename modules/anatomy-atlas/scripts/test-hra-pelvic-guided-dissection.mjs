import assert from 'node:assert/strict';
import test from 'node:test';
import raw from '../public/models/hra-pelvis/catalog.json' with { type: 'json' };
import { hraPelvisDefinition, hraPelvisStudies, hraPelvisSurfaces } from '../lib/hra-pelvis.ts';
import { hraPelvicGuidedDissection } from '../lib/hra-pelvic-guided-dissection.ts';

const pelvic = slug => `vm:reference:hra-united-female-v1-10:pelvis:${slug}`;
const ureter = side => `vm:reference:hra-united-female-v1-10:kidneys:${side}-ureter`;
const expected = [
  ['support-context', ['cervix', 'broad-ligament', 'right-cardinal-ligament-of-uterus', 'left-cardinal-ligament-of-uterus', 'right-uterosacral-ligament', 'left-uterosacral-ligament'].map(pelvic), pelvic('broad-ligament')],
  ['cardinal-context', ['cervix', 'right-cardinal-ligament-of-uterus', 'left-cardinal-ligament-of-uterus', 'right-uterosacral-ligament', 'left-uterosacral-ligament'].map(pelvic), pelvic('right-cardinal-ligament-of-uterus')],
  ['posterior-uterosacral', ['cervix', 'sacrum', 'right-uterosacral-ligament', 'left-uterosacral-ligament'].map(pelvic), pelvic('right-uterosacral-ligament')],
  ['right-urinary-vessels', [ureter('right'), pelvic('right-uterine-artery'), pelvic('right-uterine-vein'), pelvic('cervix'), pelvic('fundus-of-urinary-bladder-base')], ureter('right')],
  ['left-urinary-vessels', [ureter('left'), pelvic('left-uterine-artery'), pelvic('left-uterine-vein'), pelvic('cervix'), pelvic('fundus-of-urinary-bladder-base')], ureter('left')],
  ['bilateral-urinary', [ureter('left'), ureter('right'), pelvic('left-uterine-artery'), pelvic('right-uterine-artery'), pelvic('left-uterine-vein'), pelvic('right-uterine-vein'), pelvic('cervix'), pelvic('fundus-of-urinary-bladder-dome'), pelvic('fundus-of-urinary-bladder-base'), pelvic('urinary-bladder-neck-smooth-muscle')], ureter('left')],
];

test('six ordered steps contain exact admitted source IDs and visible selections', () => {
  const guide = hraPelvicGuidedDissection(hraPelvisDefinition);
  assert.ok(guide);
  assert.equal(guide.status, 'draft');
  assert.equal(guide.specimenKey, raw.specimenId);
  assert.equal(guide.sourceFrame, raw.sourceFrame);
  assert.deepEqual(guide.steps.map(step => [step.id, step.ids, step.selectedId]), expected);
  assert.equal(new Set(guide.steps.map(step => step.id)).size, 6);
  const admitted = new Set(hraPelvisDefinition.surfaces.map(surface => surface.id));
  for (const step of guide.steps) {
    assert.ok(step.ids.length);
    assert.equal(new Set(step.ids).size, step.ids.length);
    assert.ok(step.ids.includes(step.selectedId));
    assert.ok(step.ids.every(id => admitted.has(id)));
    assert.ok(['anterior', 'posterior', 'left', 'right'].includes(step.view));
  }
  for (const [index, side] of [[3, 'left'], [4, 'right']]) {
    assert.ok(guide.steps[index].ids.every(id => !id.includes(`${side}-ureter`) && !id.includes(`${side}-uterine-`)));
  }
});

test('unchanged 43 surfaces, original studies, and independent returned copies', () => {
  assert.equal(raw.structures.length, 41);
  assert.equal(hraPelvisSurfaces.length, 43);
  assert.equal(hraPelvisStudies.length, 11);
  assert.deepEqual(hraPelvisStudies.map(study => study.id), [
    'overview', 'all', 'uterus', 'adnexa-left', 'adnexa-right',
    'supports', 'vessels', 'neighbours', 'urinary', 'urinary-left', 'urinary-right',
  ]);
  const originalStudies = structuredClone(hraPelvisStudies);
  const originalSurfaces = structuredClone(hraPelvisSurfaces);
  const first = hraPelvicGuidedDissection(hraPelvisDefinition);
  first.steps[0].ids.pop();
  first.steps[0].caption = 'changed';
  const second = hraPelvicGuidedDissection(hraPelvisDefinition);
  assert.deepEqual(second.steps.map(step => [step.id, step.ids, step.selectedId]), expected);
  assert.deepEqual(hraPelvisStudies, originalStudies);
  assert.deepEqual(hraPelvisSurfaces, originalSurfaces);
});

test('changed source, frame, study, or model definition rejects guide', () => {
  const changes = [
    definition => { definition.key = 'foreign'; },
    definition => { definition.source.version = 'v2'; },
    definition => { definition.catalog.coordinateSystem.unitsPerMillimetre = 1; },
    definition => { definition.catalog.coordinateSystem.sourceToSceneColumnMajor[0] = 1; },
    definition => { definition.surfaces[0].id = 'foreign'; },
    definition => { definition.catalog.structures[0].id = 'foreign'; },
    definition => { definition.studies[0].ids.pop(); },
  ];
  for (const change of changes) {
    const altered = structuredClone(hraPelvisDefinition);
    change(altered);
    assert.equal(hraPelvicGuidedDissection(altered), null);
  }
});
