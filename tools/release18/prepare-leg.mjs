import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import {createHash} from 'node:crypto';
const root='G:/VisibleMedicine-temp/proposals/20261031-release18-main',site='G:/VisibleMedicine-temp/staging/20261031-release16-final/website';
const sha=b=>createHash('sha256').update(b).digest('hex'),name='tests/clinical-review-leg-arterial-xray.test.ts';
const before=fs.readFileSync(site+'/'+name);let after=before.toString();const edits=[];
for(const field of ['structures','dissectionProfiles']){
 const a=`  assert.deepEqual(imported.${field},current.${field});`,b=`  assert.deepEqual(imported.${field},live.${field},'Current imported ${field} matches its exact current Atlas source');`;
 assert.equal(after.split(a).length,2);after=after.replace(a,b);edits.push([a,b]);
 assert(after.includes(`assert.deepEqual(current.${field},previous.${field});`),'Original feature-to-parent preservation remains executable');
}
let inverse=after;for(const[a,b]of [...edits].reverse())inverse=inverse.replace(b,a);assert.equal(inverse,before.toString());
const dest=root+'/leg/'+name;fs.mkdirSync(path.dirname(dest),{recursive:true});fs.writeFileSync(dest,after,{flag:'wx'});
fs.writeFileSync(root+'/LEG_COMPOSITION.json',JSON.stringify({schema:'vm-leg-current-historical-comparison-repair/1',rows:[{path:name,before:sha(before),after:sha(after),from:dest}],edits,completeOriginalRecoverable:true,historicalFeatureComparisonsRetained:true,productChanged:false},null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({files:1,originalRetained:true}));
