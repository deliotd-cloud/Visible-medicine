import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {read,json,sha} from './source-only-backup-20261019.mjs';
const previous='F:/VisibleMedicine/staging/20261021-current-source-matrix';
const original=json(previous+'/PREPARATION.json'),result=json(previous+'/MATRIX_RESULT.json');
assert.deepEqual(result.counts,{tests:33,pass:28,fail:5,cancelled:0,skipped:0,todo:0});
assert(result.sourceInputsUnchanged);assert.equal(sha(read(result.log)),result.logSha256);
const stage='F:/VisibleMedicine/staging/20261021-head-specimen-actual-native',site=stage+'/native-check';
assert(!fs.existsSync(stage));
const effective=json(original.effectiveSnapshot),frozen=json(original.frozenSnapshot);
for(const row of frozen)assert.equal(sha(read(original.sourceSite+'/'+row.path)),row.sha256,row.path);
for(const row of effective)assert.equal(sha(read(original.site+'/'+row.path)),row.sha256,row.path);
const proposals=[
 ['F:/VisibleMedicine/staging/20261021-head-neck-pilot-history-native-proof','HEAD_NECK_WHOLE_SOURCE',4],
 ['F:/VisibleMedicine/staging/20261021-specimen-playback-history-native-proof','SPECIMEN_WHOLE_SOURCE',1],
];
const overlays=[];
for(const [root,label,count]of proposals){
 const prep=json(root+'/PREPARATION.json'),proof=json(root+'/'+label+'.json');
 assert.equal(proof.code,0);assert.equal(sha(read(proof.log)),proof.logSha256);
 assert(proof.footer.includes('ℹ pass '+count));assert(proof.footer.includes('ℹ fail 0'));
 for(const row of prep.proposed){
  assert.equal(sha(read(row.from)),row.sha256);assert(row.path.startsWith('tests/'));
  assert.equal(row.beforeSha256?sha(read(original.sourceSite+'/'+row.path)):fs.existsSync(original.sourceSite+'/'+row.path),row.beforeSha256??false);
  overlays.push(row);
 }
}
assert.equal(overlays.length,11);assert.equal(new Set(overlays.map(row=>row.path)).size,11);
fs.mkdirSync(stage);fs.mkdirSync(site);
for(const folder of original.readOnlyJunctions)fs.symlinkSync(original.sourceSite+'/'+folder,site+'/'+folder,'junction');
let copiedFiles=0;
for(const row of effective){
 if(original.readOnlyJunctions.includes(row.path.split('/')[0]))continue;
 const dest=site+'/'+row.path;fs.mkdirSync(path.dirname(dest),{recursive:true});
 fs.copyFileSync(original.site+'/'+row.path,dest,fs.constants.COPYFILE_EXCL);assert.equal(sha(read(dest)),row.sha256);copiedFiles++;
}
const next=new Map(effective.map(row=>[row.path,row.sha256]));
for(const row of overlays){
 const dest=site+'/'+row.path;assert.equal(row.beforeSha256?sha(read(dest)):fs.existsSync(dest),row.beforeSha256??false,row.path);
 fs.mkdirSync(path.dirname(dest),{recursive:true});fs.copyFileSync(row.from,dest);next.set(row.path,row.sha256);
}
const inputs=[...next].map(([path,sha256])=>({path,sha256})).sort((a,b)=>a.path.localeCompare(b.path));
assert.equal(inputs.length,5154);
for(const row of inputs)assert.equal(sha(read(site+'/'+row.path)),row.sha256,row.path);
fs.writeFileSync(stage+'/EFFECTIVE_INPUTS.json',JSON.stringify(inputs,null,2)+'\n',{flag:'wx'});
const prep={...original,stage,site,copiedFiles,effectiveSnapshot:stage+'/EFFECTIVE_INPUTS.json',
 effectiveSnapshotSha256:sha(read(stage+'/EFFECTIVE_INPUTS.json')),priorResult:previous+'/MATRIX_RESULT.json',
 priorResultSha256:sha(read(previous+'/MATRIX_RESULT.json')),overlays,
 actualCurrentModules:['tests/head-neck-pilot.test.ts','tests/clinical-review-specimen-continuous-playback.test.ts'],
 scope:'Two actual historical/current test modules only. One heavy job; no source/canonical install, private data, clinical/spatial approval or whole-suite green. Junction harness must not be recursively deleted or uploaded.'};
fs.writeFileSync(stage+'/PREPARATION.json',JSON.stringify(prep,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({stage,modules:2,effectiveInputs:inputs.length,sourceInstalled:false}));
