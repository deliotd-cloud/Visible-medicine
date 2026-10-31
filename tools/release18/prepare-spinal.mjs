import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const root='G:/VisibleMedicine-temp/proposals/20261031-release18-main';
const stage='G:/VisibleMedicine-temp/staging/20261031-release16-final';
const sha=b=>createHash('sha256').update(b).digest('hex');
const source=fs.readFileSync(stage+'/SOURCE.json');
assert.equal(sha(source),'ec5e332400ad3744044342deb9f7c6d80de0d1ab432107f96c0a5d221faecc8b');
const name='tests/clinical-review-spinal-disc-ultrasound.test.ts';
const before=fs.readFileSync(stage+'/website/'+name);
const row=JSON.parse(source).sourceRows.find(r=>r.path===name);
assert.equal(sha(before),row.sha256);
const edits=[
 ["import {currentAtlasDeliveryRoot,validateCurrentAtlasDelivery}","import {CURRENT_ATLAS_REVISION,currentAtlasDeliveryRoot,validateCurrentAtlasDelivery}"],
 [" assert.equal(pin.runtimeSources.shoulder,revision);",` assert.equal(pin.source,CURRENT_ATLAS_REVISION);
 assert.equal(pin.runtimeSources.shoulder,pin.source,'Shoulder is rebuilt from the current admitted source');
 assert.equal(execFileSync('git',['merge-base',revision,pin.source],{
  cwd:currentAtlasDeliveryRoot(),windowsHide:true,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'},
 }).toString().trim(),revision,'Current delivery retains the original 190a source ancestor');`],
];
let after=before.toString();
for(const [a,b]of edits){assert.equal(after.split(a).length,2);after=after.replace(a,b);}
// Verify every original historical blob check, all 19 lessons and every refusal
// still execute: only delivery identity and its explicit ancestry are adapted.
let inverse=after;
for(const [a,b]of [...edits].reverse()){assert.equal(inverse.split(b).length,2);inverse=inverse.replace(b,a);}
assert.equal(inverse,before.toString());
const dest=root+'/spinal/'+name;
fs.mkdirSync(path.dirname(dest),{recursive:true});fs.writeFileSync(dest,after,{flag:'wx'});
fs.writeFileSync(root+'/SPINAL_ADMITTED.json',JSON.stringify({
 schema:'vm-spinal-current-delivery-admission/1',source:{path:stage+'/SOURCE.json',sha256:sha(source)},
 rows:[{path:name,before:sha(before),after:sha(after),from:dest}],edits,
 completeOriginalRecoverable:true,allLessonAndRejectionChecksRetained:true,productChanged:false,
 nativeTestPassed:false,
},null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({files:1,originalRestoredExactly:true,nativeTestPassed:false}));
