import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {read,json,sha} from './source-only-backup-20261019.mjs';
const second=process.argv[2]==='v2';assert(process.argv.length===2||second);
const previous='F:/VisibleMedicine/staging/20261021-'+(second?'current-source-matrix-followup':'current-source-matrix');
const original=json(previous+'/PREPARATION.json'),result=json(previous+'/MATRIX_RESULT.json');
assert.deepEqual(result.counts,second?{tests:10,pass:6,fail:4,cancelled:0,skipped:0,todo:0}:{tests:33,pass:28,fail:5,cancelled:0,skipped:0,todo:0});
assert(result.sourceInputsUnchanged);assert.equal(sha(read(result.log)),result.logSha256);
const stage='F:/VisibleMedicine/staging/20261021-current-source-matrix-followup'+(second?'-v2':''),site=stage+'/native-check';
assert(!fs.existsSync(stage));
const frozen=json(original.frozenSnapshot),effective=json(original.effectiveSnapshot);
for(const row of frozen)assert.equal(sha(read(original.sourceSite+'/'+row.path)),row.sha256,row.path);
for(const row of effective)assert.equal(sha(read(original.site+'/'+row.path)),row.sha256,row.path);
const roots=second?[
 ['F:/VisibleMedicine/staging/20261021-clinical-epoch-batch-c-v6-native-proof','BATCH_C_V6_WHOLE_SOURCE',1],
 ['F:/VisibleMedicine/staging/20261021-clinical-epoch-batch-e-v7-native-proof','BATCH_E_V7_WHOLE_SOURCE',10],
]:[
 ['F:/VisibleMedicine/staging/20261021-clinical-epoch-batch-c-v5-native-proof','BATCH_C_V5_WHOLE_SOURCE',1],
 ['F:/VisibleMedicine/staging/20261021-clinical-epoch-batch-e-v6-native-proof','BATCH_E_V6_WHOLE_SOURCE',10],
];
const overlays=[];
for(const [root,label,count]of roots){
 const prep=json(root+'/PREPARATION.json'),proof=json(root+'/'+label+'.json');
 assert.equal(prep.proposed.length,18);assert.equal(proof.code,0);assert.equal(sha(read(proof.log)),proof.logSha256);
 assert(proof.footer.includes('ℹ pass '+count));assert(proof.footer.includes('ℹ fail 0'));
 for(const row of prep.proposed){
  assert.equal(sha(read(row.from)),row.sha256);assert(row.path.startsWith('tests/'));
  assert.equal(row.beforeSha256?sha(read(original.sourceSite+'/'+row.path)):fs.existsSync(original.sourceSite+'/'+row.path),row.beforeSha256??false,row.path);
  overlays.push(row);
 }
}
assert.equal(overlays.length,36);assert.equal(new Set(overlays.map(row=>row.path)).size,36);
const changedSubjects=overlays.filter(row=>row.path.endsWith('.test.ts')&&sha(read(original.site+'/'+row.path))!==row.sha256);
const expectedSubjects=[
 'tests/clinical-review-limb-nerve-quiz.test.ts','tests/clinical-review-lower-venous-tour-v2.test.ts',
 'tests/clinical-review-neonatal-cranial-us.test.ts','tests/clinical-review-orbital-apex-ct.test.ts','tests/clinical-review-orbital-ring-ct.test.ts',
].filter(name=>!second||!name.endsWith('orbital-ring-ct.test.ts'));
assert.deepEqual(changedSubjects.map(row=>row.path).sort(),expectedSubjects.sort(),'Rerun every affected subject and do not silently change another successful module');
fs.mkdirSync(stage);fs.mkdirSync(site);
for(const folder of original.readOnlyJunctions)fs.symlinkSync(original.sourceSite+'/'+folder,site+'/'+folder,'junction');
let copiedFiles=0;
for(const row of effective){
 if(original.readOnlyJunctions.includes(row.path.split('/')[0]))continue;
 const dest=site+'/'+row.path;fs.mkdirSync(path.dirname(dest),{recursive:true});
 fs.copyFileSync(original.site+'/'+row.path,dest,fs.constants.COPYFILE_EXCL);assert.equal(sha(read(dest)),row.sha256);copiedFiles++;
}
const next=new Map(effective.map(row=>[row.path,row.sha256]));
for(const row of overlays){const dest=site+'/'+row.path;assert(fs.existsSync(dest));fs.copyFileSync(row.from,dest);next.set(row.path,row.sha256);}
const inputs=[...next].map(([path,sha256])=>({path,sha256})).sort((a,b)=>a.path.localeCompare(b.path));
assert.equal(inputs.length,5146);
for(const row of inputs)assert.equal(sha(read(site+'/'+row.path)),row.sha256,row.path);
fs.writeFileSync(stage+'/EFFECTIVE_INPUTS.json',JSON.stringify(inputs,null,2)+'\n',{flag:'wx'});
const prep={...original,stage,site,copiedFiles,effectiveSnapshot:stage+'/EFFECTIVE_INPUTS.json',effectiveSnapshotSha256:sha(read(stage+'/EFFECTIVE_INPUTS.json')),
 priorResult:previous+'/MATRIX_RESULT.json',priorResultSha256:sha(read(previous+'/MATRIX_RESULT.json')),overlays,
 actualCurrentModules:changedSubjects.map(row=>row.path),scope:'Five affected actual test modules only after exact epoch/hash corrections. Retain previous33/28pass/5fail receipt and source-bound unchanged successes. No whole-suite/clinical/spatial acceptance or source installation. Never recursively delete or upload junction harness.'};
fs.writeFileSync(stage+'/PREPARATION.json',JSON.stringify(prep,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({stage,modules:prep.actualCurrentModules,effectiveInputs:inputs.length,sourceInstalled:false}));
