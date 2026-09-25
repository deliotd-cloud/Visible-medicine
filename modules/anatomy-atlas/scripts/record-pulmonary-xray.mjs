import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {pulmonaryXrayApi,pulmonaryXrayBase,pulmonaryXrayKeys,withoutPulmonaryXray,hash} from './pulmonary-xray-tools.mjs';

const current=await pulmonaryXrayApi(),saved=await pulmonaryXrayApi({saved:true});
assert.deepEqual(withoutPulmonaryXray(current).nestedConcepts,saved.nestedConcepts,'Unrelated nested teaching changed');
assert.deepEqual(withoutPulmonaryXray(current).nestedTeachingReferences,saved.nestedTeachingReferences,'Unrelated references changed');
const pulmonary=current.nestedConcepts.filter(c=>c.study==='pulmonary');
assert.deepEqual(pulmonary.map(c=>c.id),['pulmonary-upper-branches','pulmonary-middle-branches','pulmonary-lower-branches']);
for(const concept of pulmonary){
 assert.equal(concept.imaging.xray?.readiness,'draft');
 assert(concept.imaging.xray.body.trim());
 assert(concept.imaging.xray.references.length>0);
 for(const key of concept.imaging.xray.references)assert(pulmonaryXrayKeys.includes(key));
}
for(const key of pulmonaryXrayKeys){
 assert.equal(saved.nestedTeachingReferences[key],undefined);
 assert(current.nestedTeachingReferences[key]?.title);
 assert.match(current.nestedTeachingReferences[key].url,/^https:\/\//);
}
const record={sourceCommit:pulmonaryXrayBase,beforePulmonary:saved.nestedConcepts.filter(c=>c.study==='pulmonary'),afterPulmonary:pulmonary,references:Object.fromEntries(pulmonaryXrayKeys.map(key=>[key,current.nestedTeachingReferences[key]]))};
const path='content/pulmonary-xray.transition.json',text=JSON.stringify(record,null,2)+'\n';
if(process.argv.includes('--check'))assert.equal((await readFile(path,'utf8')).replace(/\r\n/g,'\n'),text);
else await writeFile(path,text,{flag:'wx'});
console.log(JSON.stringify({sourceCommit:pulmonaryXrayBase,transitionHash:hash(record),newTopics:3,representations:5}));
