import assert from 'node:assert/strict';
import {build} from './workspace-component-test-build.mjs';
import {nestedBeforeLobarImaging, nestedBeforeNeonatalLobarUltrasound, nestedBeforePosteriorLobarUltrasound,
  lobarIds, neonatalLobarReferenceKeys} from './cerebral-lobar-imaging-history.mjs';
import {lobarBeforeCerebralDetailConcise} from './cerebral-detail-ultrasound-history.mjs';

const result = await build({
  entryPoints: ['content/cerebral-lobar-imaging.ts'],
  bundle: true, platform: 'node', format: 'cjs', write: false,
});
const module = {exports: {}};
new Function('module', 'exports', result.outputFiles[0].text)(module, module.exports);
const {cerebralLobarImaging, cerebralLobarReferences} = module.exports;
const clone = value => JSON.parse(JSON.stringify(value));
const current = {
  nestedConcepts: lobarIds.map(id => ({id: 'cerebral-' + id, imaging: clone(cerebralLobarImaging[id])})),
  nestedTeachingReferences: clone(cerebralLobarReferences),
};
const historical = lobarBeforeCerebralDetailConcise(current);
const beforePosterior = nestedBeforePosteriorLobarUltrasound(historical);
assert.deepEqual(beforePosterior.nestedConcepts.slice(2).map(c => Object.keys(c.imaging)),
  lobarIds.slice(2).map(id => Object.keys(historical.nestedConcepts.find(c => c.id === 'cerebral-' + id).imaging).filter(topic => topic !== 'ultrasound')));
const beforeNeonatal = nestedBeforeNeonatalLobarUltrasound(beforePosterior);
assert.deepEqual(beforeNeonatal.nestedConcepts, lobarIds.map(id => ({
  id: 'cerebral-' + id,
  imaging: Object.fromEntries(Object.entries(historical.nestedConcepts.find(c => c.id === 'cerebral-' + id).imaging).filter(([topic]) => topic !== 'ultrasound')),
})));
assert.deepEqual(beforeNeonatal.nestedTeachingReferences,
  Object.fromEntries(Object.entries(cerebralLobarReferences).filter(([key]) => !neonatalLobarReferenceKeys.includes(key))));
assert.deepEqual(nestedBeforeLobarImaging(beforeNeonatal).nestedConcepts,
  lobarIds.map(id => ({id: 'cerebral-' + id})));
assert.deepEqual(nestedBeforeLobarImaging(beforeNeonatal).nestedTeachingReferences, {});
assert.throws(() => nestedBeforeLobarImaging(current), /Unrecorded lobar imaging change/);

let rejected = 0;
function reject(change) {
  const altered = clone(current);
  change(altered);
  assert.throws(() => nestedBeforeNeonatalLobarUltrasound(nestedBeforePosteriorLobarUltrasound(lobarBeforeCerebralDetailConcise(altered))));
  rejected++;
}
reject(a => { a.nestedConcepts[0].imaging.ultrasound.body += ' altered'; });
reject(a => { delete a.nestedConcepts[0].imaging.ultrasound; });
reject(a => { a.nestedConcepts[0].imaging.ultrasound.extra = true; });
reject(a => { a.nestedConcepts[1].imaging.ultrasound.references.push('cerebralLobarCT'); });
reject(a => { a.nestedTeachingReferences.cerebralNeonatalUS.url += 'changed'; });
reject(a => { delete a.nestedTeachingReferences.cerebralNeonatalUSWindow; });
reject(a => { a.nestedTeachingReferences.cerebralNeonatalUS.extra = true; });
reject(a => { a.nestedConcepts[2].imaging.ultrasound = clone(a.nestedConcepts[0].imaging.ultrasound); });
reject(a => { delete a.nestedConcepts[2].imaging.ultrasound; });
reject(a => { a.nestedConcepts[3].imaging.ultrasound.body += ' altered'; });
reject(a => { a.nestedConcepts[2].imaging.ultrasound.extra = true; });
reject(a => { a.nestedConcepts[3].imaging.ultrasound.references[0] = 'cerebralLobarCT'; });
reject(a => { a.nestedConcepts[2].imaging.ultrasound.references.push('cerebralLobarMRI'); });
reject(a => { a.nestedConcepts[3].imaging.ultrasound = clone(a.nestedConcepts[2].imaging.ultrasound); });
reject(a => { a.nestedTeachingReferences.cerebralNeonatalUSWindow.title += ' altered'; });
reject(a => { a.nestedTeachingReferences.cerebralNeonatalUS.url = a.nestedTeachingReferences.cerebralLobarCT.url; });
reject(a => { a.nestedConcepts[3].imaging.ultrasound.laterality = 'left'; });
reject(a => { a.nestedConcepts[2].imaging.ultrasound.source = 'unverified'; });
console.log(JSON.stringify({passed: true, exactRestoration: true, rejectedMutations: rejected,
  oldInverseUnchanged: true, clinicalApproval: false}));
