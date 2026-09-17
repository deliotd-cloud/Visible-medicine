import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {pulmonaryImagingApi,pulmonaryImagingBase,hash} from './pulmonary-imaging-tools.mjs';
import baseline from '../content/pulmonary-imaging-baseline.json' with {type:'json'};
const api=await pulmonaryImagingApi();
const keys=['pulmonaryMRIPhysics','pulmonaryUltrasoundLimits'];
const record={sourceCommit:pulmonaryImagingBase,baselineHash:hash(baseline),pulmonary:api.nestedConcepts.filter(c=>c.study==='pulmonary'),references:Object.fromEntries(keys.map(k=>[k,api.nestedTeachingReferences[k]]))};
const priorConcepts=api.nestedConcepts.map(c=>{
 if(c.study!=='pulmonary')return c;
 const prior=structuredClone(c);delete prior.imaging.mri;delete prior.imaging.ultrasound;return prior;
});
assert.equal(hash(priorConcepts),baseline.conceptsHash,'Unrelated nested topics/identities changed');
assert.equal(hash(Object.fromEntries(Object.entries(api.nestedTeachingReferences).filter(([k])=>!keys.includes(k)))),baseline.referencesHash);
const path='content/pulmonary-imaging.transition.json',text=JSON.stringify(record,null,2)+'\n';
if(process.argv.includes('--check'))assert.equal((await readFile(path,'utf8')).replace(/\r\n/g,'\n'),text);
else await writeFile(path,text,{flag:'wx'});
console.log(JSON.stringify({transitionHash:hash(record),newTopics:6,representations:5}));
