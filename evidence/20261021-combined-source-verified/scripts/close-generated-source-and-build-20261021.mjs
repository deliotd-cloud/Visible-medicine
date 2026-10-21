// Stock generated-source closure and a real follow-up commit; no generated hand edits.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {read,json,sha,runGit} from './source-only-backup-20261019.mjs';
const base='F:/VisibleMedicine/staging/20261021-',stage=base+'generated-source-closure';
const source=base+'atlas-combined-source',intro=json(base+'committed-source-admission/COMMITTED.json');
const final=json(base+'review-final-retry/RESULT.json');assert.equal(final.code,0);assert.equal(final.inputDrift,false);assert.equal(final.signal,null);
const oldBuild=json(base+'committed-source-admission/RESULT.json');assert.equal(oldBuild.passed,false);
assert.equal(oldBuild.steps[0].code,0);assert.equal(oldBuild.steps[1].code,1);
const git=(...args)=>runGit(['-C',source,...args]);
assert.equal(git('rev-parse','HEAD').toString().trim(),intro.commit);assert.equal(intro.commit,'30135cdd1849115a75c036dd6897d76e3d91e231');
assert.equal(git('status','--porcelain=v1','--untracked-files=all').toString().trim(),'');
const snapshotPath='content/regional-teaching/head-neck.json',rendererPath='content/body-renderer-revision.json';
const before=json(source+'/'+snapshotPath),pins=json(source+'/content/dental-mri-pins.json');
const allowed=new Set(pins.entries.map(row=>row.identity.id));assert.equal(allowed.size,28);
const out=path.resolve(source,'.sites-runtime/head-neck-module');assert(out.startsWith(path.resolve(source)+path.sep));
assert(!fs.existsSync(out)||fs.readdirSync(out).length===0,'Preserve any material pre-existing output');
assert(!fs.existsSync(stage));fs.mkdirSync(stage);
const save=(p,bytes)=>{const target=stage+'/'+p;fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,bytes,{flag:'wx'});};
const record=(p,value)=>save(p,Buffer.from(JSON.stringify(value,null,2)+'\n'));
record('PREPARATION.json',{stage,site:source,atlas:source,source:intro.commit,canonicalInstalled:false,scope:'Generate exact28MRI teaching snapshot cells, renderer binding, genuine successor commit and regional module build.'});
for(const p of [snapshotPath,rendererPath])save('originals/'+p,read(source+'/'+p));
const coordinator=path.dirname(fileURLToPath(import.meta.url)),steps=[];
const run=async(label,args)=>{
 const child=spawn(process.execPath,[coordinator+'/run-visible-medicine-check.mjs',stage,label,process.execPath,...args],{cwd:coordinator,windowsHide:true,stdio:'inherit'});
 record(label+'-STARTED.json',{at:new Date().toISOString(),driverPid:process.pid,wrapperPid:child.pid,label,args});
 const done=await new Promise((resolve,reject)=>{child.once('error',reject);child.once('close',(code,signal)=>resolve({code,signal}));});
 const receipt=json(stage+'/'+label+'.json');assert.equal(receipt.code,done.code);assert.equal(receipt.signal,done.signal);assert.equal(sha(read(receipt.log)),receipt.logSha256);
 steps.push({label,...done,receiptSha256:sha(read(stage+'/'+label+'.json'))});
 assert.equal(done.code,0,label+' must pass');assert.equal(done.signal,null);return receipt;
};
try{
 await run('GENERATE_REGIONAL_SNAPSHOTS',['scripts/regional-teaching-snapshots.mjs']);
 const after=json(source+'/'+snapshotPath);assert.equal(after.entries.length,before.entries.length);
 const inverse=structuredClone(after);let changed=0,preserved=0;const ids=[];
 for(let i=0;i<before.entries.length;i++){
  const old=before.entries[i],next=after.entries[i];assert.equal(next.identity,old.identity);
  const id=JSON.parse(old.identity).id;
  for(const tab of Object.keys(old.lessons)){
   if(allowed.has(id)&&tab==='mri'){
    assert.equal(old.lessons[tab].readiness,'pending');assert.equal(next.lessons[tab].readiness,'draft');assert.notDeepEqual(next.lessons[tab],old.lessons[tab]);
    inverse.entries[i].lessons[tab]=old.lessons[tab];changed++;ids.push(id);
   }else{assert.deepEqual(next.lessons[tab],old.lessons[tab],id+':'+tab);preserved++;}
  }
 }
 assert.equal(changed,28);assert.deepEqual(new Set(ids),allowed);assert.deepEqual(inverse,before,'Complete encoded snapshot restored by only28declared MRI cells');
 await run('CHECK_REGIONAL_SNAPSHOTS',['scripts/regional-teaching-snapshots.mjs','--check']);
 await run('GENERATE_RENDERER_BINDING',['scripts/body-renderer-revisions.mjs']);
 await run('CHECK_RENDERER_BINDING',['scripts/body-renderer-revisions.mjs','--check']);
 await run('CHECK_DISPLAY_PINS',['scripts/generate-body-review-display-pins.mjs','--check']);
 const changedPaths=git('diff','--name-only').toString().trim().split(/\r?\n/).filter(Boolean).sort();
 assert.deepEqual(changedPaths,[snapshotPath,rendererPath].sort(),'Only generated snapshot and exact renderer metadata changed');
 const files=changedPaths.map(p=>({path:p,bytes:read(source+'/'+p).length,sha256:sha(read(source+'/'+p))}));
 record('SNAPSHOT_INVERSE.json',{at:new Date().toISOString(),introduction:intro.commit,changedMriCells:changed,preservedCells:preserved,ids,wholeSnapshotInverse:true,files,clinicalApproval:false});
 git('add','--',...changedPaths);git('-c','user.name=Visible Medicine source coordination','-c','user.email=source-backup@users.noreply.github.com','commit','-m','Atlas: bind generated dental teaching snapshot to regional renderer');
 const commit=git('rev-parse','HEAD').toString().trim(),tree=git('rev-parse','HEAD^{tree}').toString().trim();assert.equal(git('rev-parse','HEAD^').toString().trim(),intro.commit);
 record('COMMITTED.json',{at:new Date().toISOString(),commit,tree,parent:intro.commit,introduction:intro.commit,files,canonicalInstalled:false});
 console.log(JSON.stringify({phase:'generated-closure-committed',commit,tree,changedMriCells:28}));
 await run('ACTUAL_GENERATED_COMMITTED_DENTAL',['scripts/verify-dental-mri-transition.mjs']);
 await run('ACTUAL_GENERATED_REGIONAL_BUILD',['node_modules/vite/bin/vite.js','build','--config','integration/head-neck/vite.config.mjs']);
 assert.equal(git('status','--porcelain=v1','--untracked-files=all').toString().trim(),'');assert.equal(git('rev-parse','HEAD').toString().trim(),commit);
 const result={at:new Date().toISOString(),commit,tree,introduction:intro.commit,files,steps,passed:true,canonicalInstalled:false,wholeWebsiteSuitePass:false,clinicalApproval:false,spatialRegistration:false,publicDeployment:false};
 record('RESULT.json',result);console.log(JSON.stringify(result));
}catch(error){record('FAILURE.json',{at:new Date().toISOString(),steps,error:String(error),canonicalInstalled:false,passed:false});throw error;}
