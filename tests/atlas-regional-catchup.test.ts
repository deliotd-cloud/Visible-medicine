import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import {execFileSync} from 'node:child_process';
import {CURRENT_ATLAS_REVISION,currentAtlasDeliveryRoot,validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';

const featureWebsite='f2f7adbb34af7d7a3bb9affa3ada082fe423ecf6';
const feature=(path:string)=>Buffer.from(execFileSync('git',['show',`${featureWebsite}:${path}`],{encoding:null,maxBuffer:32e6,windowsHide:true,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}}));
const sourceRepo=currentAtlasDeliveryRoot();
test('regional catch-up carries exact saved focus and search inputs without private imaging',()=>{
  const base='public/atlas-runtime/head-neck/';
  const sha=(bytes:Buffer)=>createHash('sha256').update(bytes).digest('hex');
  const bytes=feature(base+'manifest.json');
  assert.equal(sha(bytes),'eaaf8eb1d53dc3728e07a5f3497a4a7c8018afdf0838f5b90a313282d77a2381');
  const manifest=JSON.parse(bytes.toString());
  assert.equal(manifest.sourceCommit,'88cea927d48729769b96ad8fe680b0872b7e6687');
  const inputs=JSON.parse(feature(base+'source-inputs.json').toString('utf8')) as {path:string;sha256:string}[];
  for(const [path,hash] of Object.entries({
    'content/ophthalmic-nerve-studies.ts':'4dad953a18972048d20d756a4358a52fb3742f4fefe6502e747df7900822581a',
    'content/infrahyoid-layer-study.ts':'fc769248ed0ebe18572288b09793ebc37810d959ab333cde18a58e1f38d10e02',
    'content/mediastinal-organ-study.ts':'4307af9d54321db061a743e24faab1838487c220b3cc110528bf860002200767',
    'lib/anatomy-search.ts':'a761621615a6ba52e8c9742b2d9771f4b3e71447b52229ad78f4883185fedca2',
    'lib/atlas-navigation.ts':'a8d79020c9d9283dfc50f7055b7c8015746a8f13962267c41f63accb200cdb39',
    'lib/study-library.ts':'88b6f0937a24eca205f2f65b878dc2b33958ecbc241949579af62ab563f2cfc1',
  }))assert.deepEqual(inputs.filter(input=>input.path===path),[{path,sha256:hash}]);
  assert.ok(!inputs.some(input=>/native-mr|local-mr-study|\.vmmr|patient[-_/]?data/i.test(input.path)));
  for(const flag of ['clinicalApproved','patientDataIncluded','standaloneReviewConnection','imagingConnection'])assert.equal(manifest[flag],false);
  const runtime=(manifest.files as {path:string;sha256:string}[]).filter(file=>file.path.endsWith('.js')).map(file=>{
    const data=feature(base+file.path);assert.equal(sha(data),file.sha256);return data.toString();
  }).join('\n');
  for(const id of ['v1-frontal-lacrimal-subset','v1-nasociliary-subset','infrahyoid-superficial-pair','infrahyoid-deep-pair','mediastinal-conduits-thymus','FMA52656','FMA52657'])assert.ok(runtime.includes(id),id);
});

test('closed current atlas-regional-catchup delivery retains exact source, Review import and learner evidence',()=>{
 const pin=validateCurrentAtlasDelivery();
 assert.equal(pin.source,CURRENT_ATLAS_REVISION);
 const base='public/atlas-runtime/head-neck/';
 const manifest=JSON.parse(readFileSync(base+'manifest.json','utf8'));
 const inputs=JSON.parse(readFileSync(base+'source-inputs.json','utf8'));
 const review=JSON.parse(readFileSync('atlas-review/manifest.json','utf8'));
 const sha=(bytes:Buffer)=>createHash('sha256').update(bytes).digest('hex');
 assert.equal(manifest.sourceCommit,pin.source);
 assert.equal(review.revision,pin.source);
 for(const flag of ['patientDataIncluded','clinicalApproved','standaloneReviewConnection','imagingConnection'])assert.equal(manifest[flag],false,flag);
 for(const path of ['content/ophthalmic-nerve-studies.ts','content/infrahyoid-layer-study.ts','content/mediastinal-organ-study.ts','lib/anatomy-search.ts','lib/atlas-navigation.ts','lib/study-library.ts']){
   const source=execFileSync('git',['show',`${pin.source}:${path}`],{encoding:null,cwd:sourceRepo,maxBuffer:32e6,windowsHide:true,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}});
   assert.deepEqual(inputs.filter((row:{path:string})=>row.path===path),[{path,sha256:sha(source)}]);
   const entry=review.files.find((file:{path:string})=>file.path===path);
   assert(entry,`Review missing ${path}`);
   assert.equal(entry.sourceSha256,sha(source),path);
   assert.equal(entry.importedSha256,sha(readFileSync('atlas-review/'+path)),path);
 }
 const runtime=(manifest.files as {path:string;sha256:string}[]).filter(file=>file.path.endsWith('.js')).map(file=>{
   const bytes=readFileSync(base+file.path);assert.equal(sha(bytes),file.sha256,file.path);return bytes.toString();
 }).join('\n');
 for(const marker of ['v1-frontal-lacrimal-subset','v1-nasociliary-subset','infrahyoid-superficial-pair','infrahyoid-deep-pair','mediastinal-conduits-thymus','FMA52656','FMA52657'])assert(runtime.includes(marker),marker);
 const altered=structuredClone(manifest);altered.sourceCommit='0'.repeat(40);
 assert.throws(()=>validateCurrentAtlasDelivery({pin,read:path=>path==='public/atlas-runtime/head-neck/manifest.json'?Buffer.from(JSON.stringify(altered)):readFileSync(path)}),/Current delivery changed: public\/atlas-runtime\/head-neck\/manifest.json/);
});
