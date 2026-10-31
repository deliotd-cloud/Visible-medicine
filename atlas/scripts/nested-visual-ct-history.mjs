// Exact test-only inverse of the two visual CT revisions; clinical decisions are not migrated.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';

const sha=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
export const visualCTIds=['visual-optic-chiasm','visual-optic-tracts'];
export const visualCTReferenceKeys=['nestedCTACRVision2025','nestedCTChen2009'];
const oldLessons={
  'visual-optic-chiasm':{
    body:'Use the suprasellar region to orient on CT and compare the expected junction between optic nerves and tracts with the supplied chiasmal surface. Actual visibility and contours depend on the acquisition and individual anatomy; the mesh is not a traced CT boundary. Correlate detailed pathway assessment with dedicated MRI. Diffusion-MRI research does not validate this CT representation or show individual crossing fibres in it; no compression or visual-field deficit is modelled.',
    references:['nestedCTVisual','nestedCTReuseLicense'],readiness:'draft',
  },
  'visual-optic-tracts':{
    body:'For CT orientation, follow the expected postchiasmal route backwards from the chiasm toward the geniculate region, checking adjacent planes and side. A source surface is not proof that the complete tract can be delineated on routine CT. Dedicated MRI and research tractography provide different information; neither is supplied by this mesh. It contains no axons, patient correspondence, validated terminal connections or scan-based visual-field map.',
    references:['nestedCTVisual','nestedCTReuseLicense'],readiness:'draft',
  },
};
const originalHash='d07201933dbdf287ae7b9d56920f91298090782ce9fb47f2c13c8e2a5ac96eb1';
const currentHash='dac18a4ea6a340dca5d2e97065adb936f6462650423efc04ae7bb0a61ed7243a';
const currentReferencesHash='a3884ef4795ba6067bc3b2b0698d0f5a9baa21c7453bd37fcd6032b2e08a1f1c';
assert.equal(sha(oldLessons),originalHash,'Frozen two-topic CT predecessor changed');

export function nestedBeforeVisualCTGuidance(api){
  const lessons=Object.fromEntries(visualCTIds.map(id=>{
    const concept=api.nestedConcepts.find(value=>value.id===id);
    assert(concept,`Missing visual CT concept ${id}`);
    return[id,concept.imaging?.ct];
  }));
  const references=Object.fromEntries(visualCTReferenceKeys.map(key=>[key,api.nestedTeachingReferences[key]]));
  const present=Object.values(references).map(value=>value!==undefined);
  const lessonPresent=Object.values(lessons).map(value=>value!==undefined);
  assert(present.every(Boolean)||present.every(value=>!value),'Incomplete visual CT reference addition');
  assert(lessonPresent.every(Boolean)||lessonPresent.every(value=>!value),'Incomplete visual CT lesson addition');
  if(lessonPresent.every(value=>!value)){
    assert(present.every(value=>!value),'Visual CT references without lessons');
    return api;
  }
  if(present.every(value=>!value)){
    assert.equal(sha(lessons),originalHash,'Unrecorded old visual CT teaching change');
    return api;
  }
  assert.equal(sha(lessons),currentHash,'Unrecorded current visual CT teaching change');
  assert.equal(sha(references),currentReferencesHash,'Unrecorded current visual CT references');
  const ids=new Set(visualCTIds),keys=new Set(visualCTReferenceKeys);
  return{
    ...api,
    nestedConcepts:api.nestedConcepts.map(concept=>ids.has(concept.id)
      ?{...concept,imaging:{...concept.imaging,ct:structuredClone(oldLessons[concept.id])}}:concept),
    nestedTeachingReferences:Object.fromEntries(Object.entries(api.nestedTeachingReferences)
      .filter(([key])=>!keys.has(key))),
  };
}
