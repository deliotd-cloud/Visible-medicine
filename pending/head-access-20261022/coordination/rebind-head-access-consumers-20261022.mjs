// Preserve the failed type gate and extend every real protocol consumer coherently.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {json,read,sha} from './source-only-backup-20261019.mjs';
const root='F:/VisibleMedicine/staging/20261022-head-model-access-candidate',site=root+'/website',previous=json(root+'/SOURCE_WEBSITE.json'),out=root+'/consumer-rebind';
assert(!fs.existsSync(out));assert.equal(json(root+'/website-verification/TERMINAL.json').commands[0].counts.pass,109);assert.equal(json(root+'/website-verification/TERMINAL.json').commands[1].code,2);
const paths=['components/HeadAtlasGuidedModel.tsx','components/HeadAtlasLinkedModel.tsx','components/HeadAtlasComparisonNavigation.tsx','tests/head-live-model.test.ts','tests/head-guided-model.test.ts'].sort();
assert.deepEqual(previous.sourceRows.filter(r=>sha(read(site+'/'+r.path))!==r.sha256).map(r=>r.path).sort(),paths);
fs.mkdirSync(out);const changes=[];
for(const p of paths){const before=read(root+'/consumer-correction-preimages/'+path.basename(p)),after=read(site+'/'+p);assert.equal(sha(before),previous.sourceRows.find(r=>r.path===p).sha256);
 let insertionOnly=null;if(p.startsWith('tests/')){let start=0,end=0;while(before[start]===after[start]&&start<before.length)start++;while(before[before.length-1-end]===after[after.length-1-end]&&end<before.length-start)end++;
  assert.equal(start+end,before.length,'All original test bytes are retained');assert.deepEqual(Buffer.concat([after.subarray(0,start),after.subarray(after.length-end)]),before);insertionOnly={start,insertedBytes:after.length-before.length};}
 changes.push({path:p,beforeSha256:sha(before),afterSha256:sha(after),insertionOnly});
}
fs.copyFileSync(site+'/tests/head-model-access-integration.test.mjs',out+'/integration-before-review-rebind.mjs');
fs.copyFileSync(site+'/tests/fixtures/current-atlas-delivery.json',out+'/delivery-before-rebind.json');
const viewerRows=previous.sourceRows.filter(r=>r.path.startsWith('public/atlas-review-viewer/'));
for(const row of viewerRows){const to=out+'/before/'+row.path;fs.mkdirSync(path.dirname(to),{recursive:true});fs.copyFileSync(site+'/'+row.path,to,fs.constants.COPYFILE_EXCL);}
const commands=[];let failure=null;
try{for(const[label,args]of [['bind',['scripts/bind-clinical-review.mjs']],['viewer',['scripts/build-clinical-review-viewer.mjs']],['review',['scripts/verify-clinical-review.mjs']],['models',['scripts/atlas-model-inventory.mjs','--check']],['policy',['--experimental-strip-types','scripts/verify-atlas-delivery-policy.mjs']]]){
 const stdout=fs.createWriteStream(out+'/'+label+'.stdout.log',{flags:'wx'}),stderr=fs.createWriteStream(out+'/'+label+'.stderr.log',{flags:'wx'}),child=spawn(process.execPath,args,{cwd:site,env:{...process.env,GOMAXPROCS:'2',RAYON_NUM_THREADS:'1'},windowsHide:true,stdio:['ignore','pipe','pipe']});child.stdout.pipe(stdout);child.stderr.pipe(stderr);console.log(JSON.stringify({label,pid:child.pid}));
 const outcome=await new Promise(resolve=>{child.once('error',error=>resolve({code:null,error:String(error)}));child.once('close',(code,signal)=>resolve({code,signal}));});await Promise.all([stdout,stderr].map(s=>new Promise(resolve=>s.closed?resolve():s.once('close',resolve))));
 commands.push({label,args,...outcome,stdoutSha256:sha(read(stdout.path)),stderrSha256:sha(read(stderr.path))});assert.equal(outcome.code,0,label);
}
const binding=json(site+'/atlas-review/integration-inputs.json'),old=json(out+'/delivery-before-rebind.json'),oldInputs=json(root+'/consumer-rebind/before/public/atlas-review-viewer/manifest.json');
assert.equal(binding.inputs.length,1728);assert.equal(binding.sourceCommit,old.source);assert.notEqual(binding.sha256,old.reviewIntegration);
const viewer=json(site+'/public/atlas-review-viewer/manifest.json');assert.equal(viewer.files.length,46);assert.deepEqual(viewer.packages,oldInputs.packages);
const pin=structuredClone(old);pin.reviewIntegration=binding.sha256;for(const p of Object.keys(pin.documents))pin.documents[p]=sha(read(site+'/'+p));fs.writeFileSync(site+'/tests/fixtures/current-atlas-delivery.json',JSON.stringify(pin,null,2)+'\n');
const integration=read(out+'/integration-before-review-rebind.mjs').toString();assert.equal(integration.split(old.reviewIntegration).length,2);fs.writeFileSync(site+'/tests/head-model-access-integration.test.mjs',integration.replace(old.reviewIntegration,binding.sha256));
for(const row of viewerRows)if(!fs.existsSync(site+'/'+row.path)){assert(/^public\/atlas-review-viewer\/assets\/[A-Za-z0-9_-]+\.(?:js|css)$/.test(row.path));fs.copyFileSync(out+'/before/'+row.path,site+'/'+row.path,fs.constants.COPYFILE_EXCL);assert.equal(sha(read(site+'/'+row.path)),row.sha256);}
const original=json(root+'/SOURCE_IMPORT.json');fs.writeFileSync(root+'/SOURCE_IMPORT_V2.json',JSON.stringify({...original,at:new Date().toISOString(),review:binding.sha256,consumerCorrectionCommands:commands,previousImportSha256:sha(read(root+'/SOURCE_IMPORT.json')),originalTypeFailureRetained:true},null,2)+'\n',{flag:'wx'});
}catch(error){failure=String(error);}
const result={at:new Date().toISOString(),code:failure?1:0,failure,changes,commands,previousSourceReceiptSha256:sha(read(root+'/SOURCE_WEBSITE.json')),originalFailureRetained:true,allOriginalConsumerTestAssertionsRetained:true,ownerPreviewChanged:false,canonicalInstalled:false,clinicalApproval:false,spatialRegistration:false,publicDeployment:false};
fs.writeFileSync(out+'/TERMINAL.json',JSON.stringify(result,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({receipt:out+'/TERMINAL.json',code:result.code,failure}));if(failure)process.exitCode=1;
