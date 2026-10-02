import assert from 'node:assert/strict';
import {withoutEyeCrossSectionalNotice} from './atlas-eye-notice-history.ts';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const revision='e4a2eb560e8e586164a5eca9a2a8dfa658d24a8d';
const json=(path:string)=>JSON.parse(readFileSync(path,'utf8'));
const oldBytes=(path:string)=>execFileSync('git',['show','a5ed52c:'+path],{maxBuffer:16e6});
const prior=(path:string)=>JSON.parse(Buffer.from(oldBytes(path)).toString('utf8'));
const sha=(path:string)=>createHash('sha256').update(readFileSync(path)).digest('hex');

test('lumbar tour source import has the exact declared teaching and review dependency changes',()=>{
 const before=prior('atlas-review/manifest.json'),after=JSON.parse(execFileSync('git',['show','0292830:atlas-review/manifest.json'],{encoding:'utf8'}));
 assert.equal(after.revision,revision);
 const changed=after.files.filter((f:any)=>before.files.find((p:any)=>p.path===f.path)?.sourceSha256!==f.sourceSha256);
 assert.deepEqual(changed.map((f:any)=>f.path).sort(),[
  'LICENSES/THIRD_PARTY_NOTICES.md','content/body-renderer-revision.json','lib/lumbar-tour.ts','lib/regional-tours.ts',
 ]);
 assert.equal(after.files.length,before.files.length+1);
 for(const f of changed)assert.equal(createHash('sha256').update(execFileSync('git',['show','0292830:atlas-review/'+f.path],{maxBuffer:32e6})).digest('hex'),f.importedSha256);
 const regional=JSON.parse(execFileSync('git',['show','0292830:public/atlas-runtime/head-neck/source-inputs.json'],{encoding:'utf8'}));
 for(const path of ['lib/lumbar-tour.ts','lib/regional-tours.ts'])
  assert.equal(regional.find((f:any)=>f.path===path)?.sha256,after.files.find((f:any)=>f.path===path)?.sourceSha256);
 assert.equal(after.files.some((f:any)=>f.path==='content/learning-resources.v1.json'),false);
});

test('lumbar tour keeps every model and existing licence notice without patient data or approval',()=>{
 for(const module of ['head-neck','shoulder']){
  const prefix='public/atlas-runtime/'+module+'/',before=prior(prefix+'manifest.json'),after=json(prefix+'manifest.json');
  assert.equal(after.sourceCommit,'fa7dcf45efbad1dc908b02e6c699dcb02e6b3c06');
  const retained=(f:any)=>f.path.endsWith('.glb')||f.path==='BUNDLED_NOTICES.txt'||f.path==='bundled-dependencies.json'||f.path.includes('credits');
  assert.deepEqual(after.files.filter(retained),before.files.filter(retained));
  for(const f of after.files.filter(retained))assert.equal(sha(prefix+f.path),f.sha256);
  assert.deepEqual(after.modelBundles,before.modelBundles);assert.deepEqual(after.regionalScopes,before.regionalScopes);
  for(const flag of ['patientDataIncluded','clinicalApproved','standaloneReviewConnection'])assert.equal(after[flag],false);
  const path=prefix+'LICENSES/THIRD_PARTY_NOTICES.md';
  const old=Buffer.from(oldBytes(path)).toString('utf8').replace(/\r/g,''),currentRaw=readFileSync(path,'utf8').replace(/\r/g,'');
  const current=withoutEyeCrossSectionalNotice(currentRaw);
  // Keep each delivered notice milestone intact as later source credits append.
  const retainedNotice=execFileSync('git',['show','c0da7e2bf6a9f6f3e262b8c5326c369e5e6cafd2:'+path],{encoding:'utf8'}).replaceAll('\r','');
  const renalNotice=execFileSync('git',['show','abfd5cf175f2b28417f43a34d34c3c730b453a4e:'+path],{encoding:'utf8'}).replaceAll('\r','');
  const backNotice=execFileSync('git',['show','1377cba878403777924a82515a12faedb679363d:'+path],{encoding:'utf8'}).replaceAll('\r','');
  assert(renalNotice.startsWith(retainedNotice),'Entire wall/back notice retained byte-for-byte');
  assert.match(renalNotice.slice(retainedNotice.length),/^\n## Renal source-guided learning and abdominal skeletal drafts \(1 October 2026\)\n/);
  assert(backNotice.startsWith(renalNotice),'Entire preceding renal notice retained byte-for-byte');
  assert.match(backNotice.slice(renalNotice.length),/^\n## Back-specimen teaching completion \(1 October 2026\)\n/);
  assert(current.startsWith(backNotice),'Entire preceding back notice retained byte-for-byte');
  assert.match(current.slice(backNotice.length),/^\n## HRA renal modality-topic completion \(1 October 2026\)\n/);
  const completedRenalNotice=execFileSync('git',['show','afca2757914d0fc35af577fe1d736caf8549a99f:'+path],{encoding:'utf8'}).replaceAll('\r','');
  assert(completedRenalNotice.startsWith(backNotice),'Entire preceding back and renal notices retained byte-for-byte');
  assert(current.startsWith(completedRenalNotice),'Entire preceding renal notice retained byte-for-byte');
  assert.match(current.slice(completedRenalNotice.length),/^\n## HRA pelvic modality-topic completion \(1 October 2026\)\n/);
  const beforeWallBack=retainedNotice.replace(/^# Third-party notices\n\n## Abdominal wall and back source-guided dissection \(1 October 2026\)\n[\s\S]+?\n(?=## )/,'# Third-party notices\n\n');
  assert.equal(beforeWallBack,execFileSync('git',['show','c5448a86:'+path],{encoding:'utf8'}).replaceAll('\r',''),'Historical wall/back notice was the only earlier addition');
  assert(beforeWallBack.startsWith(old.trimEnd()),'Every previous notice is retained');
  assert.match(beforeWallBack.slice(old.trimEnd().length),/Lower lumbar guided learning references/);
  assert.equal(currentRaw,readFileSync('atlas-review/LICENSES/THIRD_PARTY_NOTICES.md','utf8').replace(/\r/g,''));
 }
 assert.deepEqual(json('lib/atlas-model-inventory.json').models,prior('lib/atlas-model-inventory.json').models);
});
