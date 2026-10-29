import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import path from 'node:path';

const root='G:/VisibleMedicine-temp/staging/20261029-native-successor-generation';
const stage='G:/VisibleMedicine-temp/staging/20261029-combined-native-successor';
const cp='F:/VisibleMedicine/recovery/checkpoints/20261029-native-regional-generated';
const read=p=>fs.readFileSync(p), json=p=>JSON.parse(read(p));
const sha=b=>createHash('sha256').update(b).digest('hex');
const ref=p=>({path:p,sha256:sha(read(p))});
const buffer=Buffer.alloc(65536);
function fileHash(p){const h=createHash('sha256'),fd=fs.openSync(p,'r');try{let n;while((n=fs.readSync(fd,buffer,0,buffer.length,null)))h.update(buffer.subarray(0,n));}finally{fs.closeSync(fd);}return h.digest('hex');}
const write=(p,v)=>{fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,Buffer.isBuffer(v)?v:JSON.stringify(v,null,2)+'\n',{flag:'wx'});};
assert.equal(ref(root+'/launch-contained-v5.mjs').sha256,'9435d831a1b5b1386596651b02bb5447796045dfe3d3280e4f622c6807724b88');
const prep=json(stage+'/PREPARATION.json');
assert.equal(ref(stage+'/PREPARATION.json').sha256,'f1ae317be0b5b862225f47eb1907cdc0378f4a6891e4c779ff0b38b13e1f15ee');
const expected=new Map(prep.sourceRows.map(r=>[r.path,r.sha256]));
const pins=[];
for(const [attempt,command] of [['regional-write','scripts/regional-teaching-snapshots.mjs'],['regional-check','scripts/regional-teaching-snapshots.mjs --check']]){
 const r=json(root+'/'+attempt+'/RESULT.json'),t=json(root+'/'+attempt+'/PROCESS-TERMINAL.json');
 assert.equal(r.command,command);assert.equal(r.supervisor.code,0);assert.equal(t.exitCode,0);assert(t.terminalObserved&&!t.interrupted);assert.deepEqual(t,r.process);assert(r.passing);
 assert.equal(r.generated.length,attempt==='regional-write'?5:0);
 for(const row of r.generated){assert.match(row.path,/^content\/regional-teaching\/[a-z-]+\.json$/);assert.equal(row.beforeSha256,expected.get(row.path));expected.set(row.path,row.sha256);write(cp+'/generated/'+row.path,read(stage+'/atlas/'+row.path));}
 for(const name of ['RESULT.json','PROCESS-TERMINAL.json','runner.stdout.log','runner.stderr.log','PREPARATION.json','memory.jsonl'])write(cp+'/execution/'+attempt+'/'+name,read(root+'/'+attempt+'/'+name));
 pins.push({attempt,sha256:ref(root+'/'+attempt+'/RESULT.json').sha256});
}
const failed=json(root+'/display-write/RESULT.json');
assert(!failed.passing);assert.equal(failed.process.exitCode,3221226505);assert(failed.process.terminalObserved&&!failed.process.interrupted);assert.deepEqual(failed.generated,[]);
for(const name of ['RESULT.json','PROCESS-TERMINAL.json','runner.stdout.log','runner.stderr.log','PREPARATION.json','memory.jsonl','owned-processes.jsonl'])write(cp+'/execution/display-write/'+name,read(root+'/display-write/'+name));
assert.equal(expected.size,6484);
for(const [p,s] of expected)assert.equal(fileHash(stage+'/atlas/'+p),s,p);
const deltaPath='G:/VisibleMedicine-temp/staging/20261029-native-teaching-delta/RESULT-1793300729497.json',delta=json(deltaPath);
assert(delta.generatedLessonsMatch);assert.equal(delta.expectedChangedTopics.length,44);assert.equal(delta.expectedUnchangedLessons,9892);assert.equal(delta.pinDeltaMatches,false);
write(cp+'/TEACHING_DELTA.json',read(deltaPath));write(cp+'/CURRENT_INDEX_BEFORE.json',read('CURRENT_CHECKPOINT.json'));
write(cp+'/checkpoint.json',{schema:'vm-native-regional-generated/1',at:new Date().toISOString(),sourcePreparation:ref(stage+'/PREPARATION.json'),sourceFilesVerified:6484,steps:pins,failedDisplay:ref(root+'/display-write/RESULT.json'),teaching:ref(cp+'/TEACHING_DELTA.json'),changedTopics:44,unchangedLessons:9892,normalPreviewChanged:false,clinicalApproval:false,fullBuildPassed:false,completeGeneration:false,diagnosis:'Display generator exited 0xc0000409 under the512MiB job; exact cause is not established. No output changed. Resume with a larger bounded job and correspondingly higher admission, retaining the2GiB free reserve.'});
let code=read(root+'/launch-contained-v5.mjs').toString();
function replace(a,b){assert.equal(code.split(a).length,2,a);code=code.replace(a,b);}
replace('heap=192,aggregate=512,minimum=2816','heap=384,aggregate=1024,minimum=3072');
replace('assert.equal(aggregate,512)','assert.equal(aggregate,1024)');
replace('assert.equal(minimum,2816)','assert.equal(minimum,3072)');
replace('heap:192,aggregate:512,minimum:2816','heap:384,aggregate:1024,minimum:3072');
replace('nativeJobMiB:512,heapMiB:192,minimumMiB:2816','nativeJobMiB:1024,heapMiB:384,minimumMiB:3072');
replace("hash(root+'/launch-contained-v5.mjs')","hash(root+'/launch-contained-v6.mjs')");
replace('const pinnedResumeReceipts=Object.freeze([]);','const pinnedResumeReceipts=Object.freeze('+JSON.stringify(pins)+');\nassert.equal(hash('+JSON.stringify(cp+'/checkpoint.json')+'),'+JSON.stringify(ref(cp+'/checkpoint.json').sha256)+',"Main-verified completed generation checkpoint");\nassert.equal(hash(root+"/display-write/RESULT.json"),'+JSON.stringify(ref(root+'/display-write/RESULT.json').sha256)+',"Original failed attempt preserved");');
replace("['display-write','scripts/generate-body-review-display-pins.mjs'],","['display-write-v6','scripts/generate-body-review-display-pins.mjs'],\n ['display-check-v6','scripts/generate-body-review-display-pins.mjs --check'],");
replace("['reviews-write','scripts/review-revisions.mjs'],","['reviews-write','scripts/review-revisions.mjs'],\n ['reviews-check','scripts/review-revisions.mjs --check'],");
replace(" 'scripts/body-renderer-revisions.mjs',"," 'scripts/body-renderer-revisions.mjs',\n 'scripts/body-renderer-revisions.mjs --check',");
replace(" ['renderer-write','scripts/body-renderer-revisions.mjs'],"," ['renderer-write','scripts/body-renderer-revisions.mjs'],\n ['renderer-check','scripts/body-renderer-revisions.mjs --check'],");
fs.writeFileSync(root+'/launch-contained-v6.mjs',code,{flag:'wx'});
write(root+'/V6_PREPARATION.json',{at:new Date().toISOString(),sourceVerificationFiles:6484,checkpoint:ref(cp+'/checkpoint.json'),profile:ref(root+'/launch-contained-v6.mjs'),resume:pins,aggregateMiB:1024,minimumFreeMiB:3072,heapMiB:384,freeReserveMiB:2048,fullBuildGuardsUnchanged:true,generatedLessonsMatch:true,pinDeltaMatches:false,ownerPreviewChanged:false});
console.log(JSON.stringify({checkpoint:ref(cp+'/checkpoint.json'),profile:ref(root+'/launch-contained-v6.mjs'),resume:pins}));
