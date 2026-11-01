import {pathToFileURL} from 'node:url';
import fs from 'node:fs';import assert from 'node:assert/strict';import {spawnSync} from 'node:child_process';
import {hash,json} from 'file:///C:/Users/delio/Documents/Codex/2026-09-05/referenced-chatgpt-conversation-this-is-an-2/bounded-source-hash-20261026.mjs';
const root='G:/VisibleMedicine-temp/staging/20261101-hepatic-website',site=root+'/website',p=json(root+'/PREPARATION.json');
assert.equal(process.cwd().replaceAll('\\','/'),site);
const before=json(p.parent.website+'/atlas-review/manifest.json'),checks=[];
const save=(name,value)=>fs.writeFileSync(root+'/'+name,JSON.stringify(value,null,2)+'\n',{flag:'wx'});
function run(name,args){
 const result=spawnSync(process.execPath,['--max-old-space-size=512',...args],{cwd:site,encoding:'utf8',windowsHide:true,maxBuffer:4e6});
 fs.writeFileSync(root+'/logs/'+name+'.log',(result.stdout??'')+'\n'+(result.stderr??''),{flag:'wx'});
 assert.equal(result.status,0,name+' failed; preserve the evidence');assert(!result.error&&!result.signal);
 checks.push({name,logSha256:hash(root+'/logs/'+name+'.log')});console.log(name+' passed');
}
assert(fs.readFileSync(root+'/checks/source/runner.stdout.log','utf8').includes('import passed'),'Original import must have completed');
const imported=json(site+'/atlas-review/manifest.json');assert.equal(imported.revision,p.nativeHead);
assert.deepEqual(imported.packages,before.packages);
const old=new Map(before.files.map(f=>[f.path,f])),fresh=new Map(imported.files.map(f=>[f.path,f]));
assert.equal(fresh.size,imported.files.length);
const added=imported.files.filter(f=>!old.has(f.path)).map(f=>f.path).sort();
const removed=before.files.filter(f=>!fresh.has(f.path)).map(f=>f.path);
const changed=imported.files.filter(f=>old.has(f.path)&&old.get(f.path).sourceSha256!==f.sourceSha256).map(f=>f.path).sort();
assert.deepEqual(added,['content/hepatic-vascular-xray.ts']);assert.deepEqual(removed,[]);
assert.deepEqual(changed,['content/body-renderer-revision.json','content/hepatic-teaching.ts','content/nested-teaching.ts']);
const prior=fs.readFileSync(root+'/checks/source-finish/runner.stdout.log','utf8');
for(const name of ['coverage-finish','catalog-declarations','review-binding','atlas-catalog-types','regional-teaching-declarations','prostate-review-binding','prostate-review-inspection']){
 assert(prior.includes(name+' passed'));checks.push({name,logSha256:hash(root+'/logs/'+name+'.log')});
}
const tap=fs.readFileSync(root+'/logs/hepatic-coverage-binding-fixed.log','utf8');
const totals=Object.fromEntries([...tap.matchAll(/^# (tests|pass|fail|cancelled|skipped|todo) (\d+)\r?$/gm)].map(([,name,value])=>[name,Number(value)]));
assert.deepEqual(totals,{tests:2,pass:2,fail:0,cancelled:0,skipped:0,todo:0});
checks.push({name:'hepatic-coverage-binding-fixed',logSha256:hash(root+'/logs/hepatic-coverage-binding-fixed.log')});
const manifest=json(site+'/atlas-review/manifest.json'),binding=json(site+'/atlas-review/integration-inputs.json');
assert.equal(manifest.revision,p.nativeHead);assert.equal(binding.sourceCommit,p.nativeHead);assert.equal(manifest.websiteIntegrationSha256,binding.sha256);
for(const f of manifest.files){assert.equal(hash(site+'/atlas-review/'+f.path),f.importedSha256,f.path);assert.equal(hash(p.native+'/'+f.path),f.sourceSha256,f.path);}
for(const f of binding.inputs)assert.equal(hash(site+'/'+f.path),f.sha256,f.path);
const {verifyProstateReviewPresentation}=await import(pathToFileURL(site+'/scripts/verify-prostate-review-presentation.mjs').href);
const prostate=verifyProstateReviewPresentation({source:manifest,receipt:binding});
const beforeBound=hash(site+'/atlas-review/integration-inputs.json');run('binding-deterministic',['scripts/bind-clinical-review.mjs']);assert.equal(hash(site+'/atlas-review/integration-inputs.json'),beforeBound);
save('SOURCE_CHECKS.json',{at:new Date().toISOString(),sourceRevision:p.nativeHead,sourceTree:p.nativeTree,added,removed,changed,imported:manifest.files.length,bound:binding.inputs.length,reviewBinding:binding.sha256,prostate,checks,fullTypes:false,runtimeBuild:false,reviewBuild:false,websiteBuild:false,installed:false,clinicalApproval:false,patientRegistration:false});
console.log(JSON.stringify({sourceChecksPassed:true,imported:manifest.files.length,bound:binding.inputs.length,reviewBinding:binding.sha256,installed:false}));
