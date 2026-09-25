import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {pulmonaryImagingBase,pulmonaryImagingTransition,pulmonaryImagingSource,hash} from './pulmonary-imaging-tools.mjs';
import {nestedBeforePulmonaryImaging} from './pulmonary-imaging-history.mjs';
import baseline from '../content/pulmonary-imaging-baseline.json' with {type:'json'};
import transition from '../content/pulmonary-imaging.transition.json' with {type:'json'};

export const stageSourcePaths=['content/nested-teaching-bindings.v1.json','content/femoral-component-teaching-bindings.v1.json','public/models/bodyparts3d/pulmonary/catalog.json'];

export function verifyPulmonaryImagingStages(before,after){
 assert.equal(execFileSync('git',['rev-parse',pulmonaryImagingTransition+'^'],{encoding:'utf8'}).trim(),pulmonaryImagingBase,'Transition is not the original child of the recorded baseline');
 assert.equal(baseline.sourceCommit,pulmonaryImagingBase);
 assert.equal(transition.sourceCommit,pulmonaryImagingBase);
 assert.equal(transition.baselineHash,hash(baseline));
 assert.equal(hash(before.nestedConcepts),baseline.conceptsHash,'Historical baseline concepts changed');
 assert.equal(hash(before.nestedTeachingReferences),baseline.referencesHash,'Historical baseline references changed');
 assert.deepEqual(after.nestedConcepts.filter(c=>c.study==='pulmonary'),transition.pulmonary,'Historical transition pulmonary concepts changed');
 assert.deepEqual(Object.fromEntries(Object.keys(transition.references).map(k=>[k,after.nestedTeachingReferences[k]])),transition.references,'Historical transition references changed');
 const prior=nestedBeforePulmonaryImaging(after);
 assert.deepEqual(prior.nestedConcepts,before.nestedConcepts,'Historical non-pulmonary concepts changed');
 assert.deepEqual(prior.nestedTeachingReferences,before.nestedTeachingReferences,'Historical non-pulmonary references changed');
 assert.equal(nestedBeforePulmonaryImaging(prior),prior);
 for(const path of stageSourcePaths)assert.deepEqual(pulmonaryImagingSource(pulmonaryImagingTransition,path),pulmonaryImagingSource(pulmonaryImagingBase,path),`Historical source pin changed: ${path}`);
 return prior;
}
