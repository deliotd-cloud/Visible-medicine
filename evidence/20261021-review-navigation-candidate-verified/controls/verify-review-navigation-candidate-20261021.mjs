import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {read,json,sha} from './source-only-backup-20261019.mjs';
const stage='F:/VisibleMedicine/staging/20261021-review-navigation-ui-candidate';
const prep=json(stage+'/PREPARATION.json'),site=prep.site,source=prep.source;
const proposal=json(prep.proposal+'/PROPOSAL.json');
assert.equal(sha(read(prep.proposal+'/PROPOSAL.json')),prep.proposalSha256);
const finalAttempt=process.argv[2]==='--complete-form-checks';
const retryLocal=process.argv[2]==='--retry-local-copy',retryCount=process.argv[2]==='--retry-binding-count'||finalAttempt,retryPlexus=process.argv[2]==='--retry-plexus-binding'||retryCount;
const retry=retryLocal||retryPlexus;assert.equal(process.argv.length,retry?3:2);
const suffix=finalAttempt?'-v5':retryCount?'-v4':retryPlexus?'-v3':retryLocal?'-v2':'';
assert(!fs.existsSync(stage+'/VERIFY_STARTED'+suffix+'.json'));process.kill(266712,0);
if(retryLocal){
 const failure=json(stage+'/VERIFY_FAILURE.json');assert.equal(failure.commands.length,1);assert.equal(failure.commands[0].code,1);
 assert(read(stage+'/VERIFY.log').toString().includes("public\\licenses\\head-atlas-noble-hashes-LICENSE.txt"));
 const prior=json('F:/VisibleMedicine/staging/20261021-source190-website/PREPARATION.json');
 const allowed=['next-env.d.ts','public/fonts/geist-mono-latin.woff2','public/licenses/geist-mono-OFL.txt','public/licenses/head-atlas-noble-hashes-LICENSE.txt','scripts/lecture-pptx-intake.py','scripts/lecture-pptx-raster-preflight.py','tests/lecture-pptx-intake.test.py'];
 const missing=prior.rows.filter(r=>!fs.existsSync(site+'/'+r.path));assert.deepEqual(missing.map(r=>r.path).sort(),allowed.sort());
 for(const r of missing){assert.equal(r.kind,'verified-selected-source');assert.equal(sha(read(source+'/'+r.path)),r.sha256);fs.mkdirSync(path.dirname(site+'/'+r.path),{recursive:true});fs.copyFileSync(source+'/'+r.path,site+'/'+r.path,fs.constants.COPYFILE_EXCL);assert.equal(sha(read(site+'/'+r.path)),r.sha256);}
 fs.writeFileSync(stage+'/SUPPLEMENTAL_LOCAL_COPY.json',JSON.stringify({rows:missing,reason:'Initial isolated clone omitted seven previously declared supporting files, including required public license; binder refused before writing. Original refusal retained. Copies are exact existing local dependencies, no new licensing or source changes.',canonicalInstalled:false},null,2)+'\n',{flag:'wx'});
}
const oldBinding=json(source+'/atlas-review/integration-inputs.json');
assert.equal(oldBinding.inputs.length,1710);
for(const r of proposal.proposedPaths){
 const from=prep.proposal+'/'+r.path,to=site+'/'+r.path;
 assert.equal(sha(read(from)),r.candidateSha256);
 if(r.path.startsWith('tests/fixtures/')){
  assert(!fs.existsSync(to)||retry);assert(r.preimageSha256===null&&r.path.endsWith('.tsx.raw'));
  const original=r.path.slice('tests/fixtures/'.length,-4);assert.equal(sha(read(source+'/components/'+original)),r.candidateSha256);
  if(!fs.existsSync(to)){fs.mkdirSync(path.dirname(to),{recursive:true});fs.copyFileSync(from,to,fs.constants.COPYFILE_EXCL);}
 }
 assert.equal(sha(read(to)),r.candidateSha256,r.path);
}
fs.writeFileSync(stage+'/VERIFY_STARTED'+suffix+'.json',JSON.stringify({at:new Date().toISOString(),pid:process.pid,ownerPreviewUnchanged:true,canonicalInstalled:false},null,2)+'\n',{flag:'wx'});
if(!retry)fs.writeFileSync(stage+'/BINDING_BEFORE.json',JSON.stringify(oldBinding,null,2)+'\n',{flag:'wx'});
const log=stage+'/VERIFY'+suffix+'.log',fd=fs.openSync(log,'wx'),commands=[];
function run(args){
 const at=new Date().toISOString(),begin=Date.now();
 const r=spawnSync(process.execPath,args,{cwd:site,windowsHide:true,stdio:['ignore',fd,fd],env:{...process.env,VM_ATLAS_SOURCE_REPO:'F:/VisibleMedicine/atlas',GOMAXPROCS:'2',RAYON_NUM_THREADS:'1',NODE_OPTIONS:'--max-old-space-size=4096'}});
 commands.push({args,at,code:r.status,signal:r.signal,durationMs:Date.now()-begin});
 console.log(JSON.stringify(commands.at(-1)));assert.equal(r.status,0,args.join(' '));
}
try{
 if(retryPlexus){
  const previous=json(stage+'/VERIFY_FAILURE-v2.json');assert.equal(previous.commands.length,3);assert.deepEqual(previous.commands.map(r=>r.code),[0,0,1]);
  assert(read(stage+'/VERIFY-v2.log').toString().includes('Schematic input changed; regenerate: components/PlexusReviewWorksheet.tsx'));
  const closure=json(site+'/atlas-review/integration-inputs.json');for(const r of closure.inputs)assert.equal(sha(read(site+'/'+r.path)),r.sha256);
  assert.equal(closure.sha256,'15a0c1e0c4d30535fd212b06bd0b815d97ea7cd26933a6354bdcc24a35c6802e');
  const retainedViewer=json(site+'/public/atlas-review-viewer/manifest.json');assert.equal(retainedViewer.websiteIntegrationSha256,closure.sha256);for(const r of retainedViewer.files)assert.equal(sha(read(site+'/public/atlas-review-viewer/'+r.path)),r.sha256);
 }else{run(['scripts/bind-clinical-review.mjs']);run(['scripts/build-clinical-review-viewer.mjs']);}
 run(['scripts/verify-clinical-review.mjs']);
 const binding=json(site+'/atlas-review/integration-inputs.json'),before=new Map(oldBinding.inputs.map(r=>[r.path,r.sha256]));
 const added=binding.inputs.filter(r=>!before.has(r.path));assert.equal(binding.inputs.length,1711);assert.deepEqual(added.map(r=>r.path),['lib/clinical-review-navigation-guard.ts']);
 const changed=binding.inputs.filter(r=>before.has(r.path)&&before.get(r.path)!==r.sha256).map(r=>r.path).sort();
 assert.deepEqual(changed,[...proposal.proposedPaths.filter(r=>r.path.startsWith('components/')).map(r=>r.path),'scripts/bind-clinical-review.mjs'].sort());
 for(const r of oldBinding.inputs)assert(binding.inputs.some(n=>n.path===r.path));
 const viewer=json(site+'/public/atlas-review-viewer/manifest.json'),oldViewer=json(source+'/public/atlas-review-viewer/manifest.json');
 assert.deepEqual(viewer.packages,oldViewer.packages);assert.equal(viewer.files.length,46);assert.equal(viewer.personalRecordsIncluded,false);
 const pinPath='tests/fixtures/current-atlas-delivery.json',oldPin=json(source+'/'+pinPath),pin=structuredClone(oldPin);
 assert.equal(pin.reviewIntegration,oldBinding.sha256);assert.equal(pin.source,'190a63238eadcf906abe89dcbb6a67c88afe70b9');
 pin.reviewIntegration=binding.sha256;
 const changedDocuments=[];for(const p of Object.keys(pin.documents)){const hash=sha(read(site+'/'+p));if(hash!==pin.documents[p])changedDocuments.push(p);pin.documents[p]=hash;}
 assert.deepEqual(changedDocuments.sort(),['atlas-review/integration-inputs.json','atlas-review/manifest.json','public/atlas-review-viewer/manifest.json']);
 if(!retryCount)fs.writeFileSync(stage+'/CURRENT_PIN_BEFORE.json',JSON.stringify(oldPin,null,2)+'\n',{flag:'wx'});else assert.deepEqual(json(stage+'/CURRENT_PIN_BEFORE.json'),oldPin);
 // Generated test receipt: only the exact proven renderer input closure changes.
 fs.writeFileSync(site+'/'+pinPath,JSON.stringify(pin,null,2)+'\n');
 run(['--test','--experimental-strip-types','--test-concurrency=1','tests/clinical-review-navigation-guard.test.ts','tests/clinical-review-navigation-preservation.test.mjs','tests/review-draft-autosave.test.mjs','tests/head-teaching-review-notes.test.ts','tests/head-mri-review-notes.test.ts','tests/head-review-working-copy.test.ts','tests/current-atlas-delivery.test.mjs','tests/plexus-review-navigation-binding.test.mjs','tests/review-navigation-harness-preservation.test.mjs','tests/review-navigation-delivery-preservation.test.mjs',...(finalAttempt?['tests/head-ct-bone-decision-form.test.ts','tests/head-ct-bone-teaching-decision-form.test.ts','tests/head-ct-facial-decision-form.test.ts','tests/head-paired-decision-form.test.ts','tests/regional-guide-review-ui.test.ts','tests/regional-reference-draft-ui.test.ts','tests/review-navigation-six-harness-preservation.test.mjs','tests/head-ct-facial-ui.test.mjs','tests/plexus-review-ui.test.ts']:[])]);
 run(['node_modules/typescript/bin/tsc','--noEmit','--incremental','false']);
 run(['scripts/atlas-model-inventory.mjs','--check']);run(['--experimental-strip-types','scripts/verify-atlas-delivery-policy.mjs']);
 run(['node_modules/vinext/dist/cli.js','build']);
 for(const r of prep.rows){assert.equal(sha(read(source+'/'+r.path)),r.sha256,'Original owner source unchanged:'+r.path);}
 process.kill(266712,0);fs.closeSync(fd);
 const result={at:new Date().toISOString(),commands,beforeReview:oldBinding.sha256,review:binding.sha256,beforeInputs:1710,inputs:1711,addedInputs:added,changedInputs:changed,source:pin.source,sourceTree:pin.sourceTree,sourceFiles:1553,viewerFiles:46,viewerPackages:22,allOriginalSourceUnchanged:true,allPackagesUnchanged:true,log,logSha256:sha(read(log)),canonicalInstalled:false,browserAcceptancePending:true,ownerPreviewUnchanged:true,clinicalApproval:false,publicDeployment:false};
 fs.writeFileSync(stage+'/VERIFIED.json',JSON.stringify(result,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(result));
}catch(e){fs.closeSync(fd);fs.writeFileSync(stage+'/VERIFY_FAILURE'+suffix+'.json',JSON.stringify({commands,error:String(e),log,logSha256:sha(read(log)),canonicalInstalled:false,ownerPreviewUnchanged:true},null,2)+'\n',{flag:'wx'});throw e;}
