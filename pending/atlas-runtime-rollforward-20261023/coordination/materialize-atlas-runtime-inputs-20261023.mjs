// Main-owned, create-only local materialization of already-committed build inputs.
// No build/export/import, new assets, canonical edit or normal-preview operation.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {json,read,sha,runGit} from './source-only-backup-20261019.mjs';
import {containedTarget} from './prepare-reviewed-regression-candidate-20261022.mjs';

const source='F:/VisibleMedicine/staging/20261023-atlas-playback-bound-candidate/atlas';
const root='F:/VisibleMedicine/staging/20261023-atlas-runtime-materialized',atlas=root+'/atlas';
const head='9e1407629bd6f85061537c9f013fd72e4543e0da',tree='9404fb39a8b08aff7ef5300d2ef963abd5639045';
const baseline='7978478992f54ea68e0f53c3d195c459c7b80068';
const prior='F:/VisibleMedicine/recovery/checkpoints/20261023-atlas-playback-bound-candidate/checkpoint.json';
assert.equal(sha(read(prior)),'6abce770966d151bc3dcf3381994cf85f7c09047bf97e5b17cf19bc6e288cdb7');
const saved=json(prior);assert.equal(saved.head,head);assert.equal(saved.tree,tree);
assert.equal(sha(read(saved.verification)),saved.verificationSha256);
assert.equal(json('CURRENT_CHECKPOINT.json').activeWork.current.ownerPreviewPolicy.restartPermitted,false);
assert.equal(runGit(['-C',source,'rev-parse','HEAD']).toString().trim(),head);
assert.equal(runGit(['-C',source,'rev-parse','HEAD^{tree}']).toString().trim(),tree);
assert.equal(runGit(['-C',source,'status','--porcelain']).toString().trim(),'');
const diff=runGit(['-C',source,'diff','--name-only',baseline,head]).toString().trim().split('\n').sort();
assert.deepEqual(diff,saved.sourceRows.map(r=>r.path).sort());assert.equal(diff.length,7);
const entries=runGit(['-C',source,'ls-tree','-r','-l','-z',head]).toString().split('\0').filter(Boolean).map(line=>{
 const tab=line.indexOf('\t');assert(tab>0);const [mode,type,blob,bytes]=line.slice(0,tab).trim().split(/\s+/),name=line.slice(tab+1);
 assert.equal(type,'blob');assert(['100644','100755'].includes(mode),'No special file or symlink materialization');
 containedTarget(atlas,name);assert(!/(^|\/)(?:\.env(?:\.[^/]*)?|\.local|node_modules|\.git)(?:\/|$)|\.(?:dcm|dicom|nii(?:\.gz)?|nrrd|sqlite3?|db)$/i.test(name),'Do not materialize patient, secret or runtime-storage files');
 assert(Number.isSafeInteger(+bytes)&&+bytes>=0);return {path:name,mode,gitBlob:blob,bytes:+bytes};
});
assert.equal(new Set(entries.map(r=>r.path)).size,entries.length);
const totalBytes=entries.reduce((n,r)=>n+r.bytes,0),models=entries.filter(r=>/\.glb$/i.test(r.path));
const pwsh='C:/Users/delio/.cache/codex-runtimes/codex-primary-runtime/dependencies/native/powershell/pwsh.exe';
const preflight=JSON.parse(execFileSync(pwsh,['-NoProfile','-NonInteractive','-Command',"$vmOs=Get-CimInstance Win32_OperatingSystem; [pscustomobject]@{at=[DateTime]::UtcNow.ToString('o');freePhysicalKiB=$vmOs.FreePhysicalMemory;freeCommitKiB=$vmOs.FreeVirtualMemory;fFreeBytes=(Get-PSDrive F).Free}|ConvertTo-Json -Compress"],{encoding:'utf8',windowsHide:true}));
assert(preflight.freeCommitKiB>4*1024*1024,'Insufficient bounded-copy commit headroom');
assert(preflight.fFreeBytes>2*totalBytes+4*1024**3,'Insufficient staged-copy disk headroom');
assert(!fs.existsSync(root),'Create-only isolated target');fs.mkdirSync(root);
const plan={at:new Date().toISOString(),source,head,tree,baseline,priorCheckpoint:prior,priorCheckpointSha256:sha(read(prior)),changedCommittedPaths:diff,files:entries.length,bytes:totalBytes,models:models.length,modelBytes:models.reduce((n,r)=>n+r.bytes,0),preflight,scope:'Restore all tracked bytes of the exact previously-reviewed local9e14tree into a fresh isolated clone. No new external or medical source; no export/build, decision migration or runtime/clinical acceptance. Full manifest/binaries remain F-only.',previewChanged:false,installed:false};
fs.writeFileSync(root+'/PLAN.json',JSON.stringify(plan,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({phase:'planned',files:entries.length,bytes:totalBytes,models:models.length,previewChanged:false}));
runGit(['clone','--shared','--no-checkout',source,atlas]);
const alternates=[source+'/.git/objects',...read(source+'/.git/objects/info/alternates').toString().trim().split(/\r?\n/)];
const stores=[...new Set(alternates.map(p=>p.replaceAll('\\','/')))];
for(const p of stores){assert(path.isAbsolute(p));assert(p.startsWith('F:/VisibleMedicine/')&&!p.includes('..'));assert(fs.statSync(p).isDirectory());}
fs.writeFileSync(atlas+'/.git/objects/info/alternates',stores.join('\n')+'\n');
for(const [key,value]of [['core.autocrlf','false'],['core.eol','lf'],['checkout.workers','1']])runGit(['-C',atlas,'config',key,value]);
runGit(['-C',atlas,'checkout','--detach',head]);
assert.equal(runGit(['-C',atlas,'rev-parse','HEAD']).toString().trim(),head);
assert.equal(runGit(['-C',atlas,'rev-parse','HEAD^{tree}']).toString().trim(),tree);
// Hash every working byte directly against its committed Git blob ID as well
// as recording SHA256; do not infer materialization from a cached stat/index.
const slab=Buffer.alloc(65536),rows=[];
for(const entry of entries){
 const file=containedTarget(atlas,entry.path),stat=fs.lstatSync(file);assert(stat.isFile()&&!stat.isSymbolicLink());assert.equal(stat.size,entry.bytes,entry.path);
 const git=createHash('sha1').update(Buffer.from('blob '+entry.bytes+'\0')),digest=createHash('sha256'),fd=fs.openSync(file,'r');
 try{let n;while((n=fs.readSync(fd,slab,0,slab.length,null))){const b=slab.subarray(0,n);git.update(b);digest.update(b);}}finally{fs.closeSync(fd);}
 assert.equal(git.digest('hex'),entry.gitBlob,entry.path);rows.push({...entry,sha256:digest.digest('hex')});
}
assert.equal(runGit(['-C',atlas,'status','--porcelain']).toString().trim(),'');
assert.equal(runGit(['-C',source,'status','--porcelain']).toString().trim(),'');
assert.equal(runGit(['-C','F:/VisibleMedicine/atlas','rev-parse','HEAD']).toString().trim(),'6d7a356ae949e13f2ff4bf1fec610ee6ae7762c1');
assert.equal(runGit(['-C','F:/VisibleMedicine/website','rev-parse','HEAD']).toString().trim(),'b953ff3f5f1891599cb6e91cb91311d9d6006270');
const lock=read(atlas+'/package-lock.json');assert.deepEqual(lock,read('F:/VisibleMedicine/atlas/package-lock.json'),'Reuse only the exact installed dependency lockfile');
fs.symlinkSync('F:/VisibleMedicine/atlas/node_modules',atlas+'/node_modules','junction');
const manifest={at:new Date().toISOString(),schema:'vm.exact-atlas-materialization/1',atlas,head,tree,source,sourceUnchanged:true,plan:root+'/PLAN.json',planSha256:sha(read(root+'/PLAN.json')),rows,files:rows.length,bytes:totalBytes,models:models.length,modelBytes:plan.modelBytes,allWorkingBytesMatchCommittedBlobs:true,dependencyLockSha256:sha(lock),dependencyInstallation:false,sharedLocalObjectStores:stores,buildRun:false,exportRun:false,reviewImportRun:false,renderer: saved.renderer.sha256,reviewRuntimeRebindingPending:true,fullTypesBuildBrowserPending:true,clinicalApproval:false,spatialRegistration:false,previewChanged:false,installed:false,publicDeployment:false};
fs.writeFileSync(root+'/MATERIALIZED.json',JSON.stringify(manifest,null,2)+'\n',{flag:'wx'});
fs.copyFileSync(new URL(import.meta.url),root+'/materialize-atlas-runtime-inputs-20261023.mjs',fs.constants.COPYFILE_EXCL);
console.log(JSON.stringify({receipt:root+'/MATERIALIZED.json',sha256:sha(read(root+'/MATERIALIZED.json')),head,tree,files:rows.length,models:models.length,allWorkingBytesMatchCommittedBlobs:true,previewChanged:false,buildOrExportAcceptance:false}));
