import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import {execFileSync} from 'node:child_process';
import {hash,json} from 'file:///C:/Users/delio/Documents/Codex/2026-09-05/referenced-chatgpt-conversation-this-is-an-2/bounded-source-hash-20261026.mjs';
const root='G:/VisibleMedicine-temp/staging/20261031-small-cardiac-ready',site=root+'/atlas',base='G:/VisibleMedicine-temp/staging/20261031-visual-ct-guidance-ready/atlas',proposal='G:/VisibleMedicine-temp/proposals/20261031-cardiac-current-baseline';
const ref=p=>({path:p,sha256:hash(p)}),git=(where,...args)=>execFileSync('git',['-C',where,...args],{encoding:'utf8',windowsHide:true,maxBuffer:4e6}).trim(),write=(p,v)=>fs.writeFileSync(p,typeof v==='string'?v:JSON.stringify(v,null,2)+'\n',{flag:'wx'});
assert(!fs.existsSync(root),'Inspect partial candidate before retry');
const overlayPath='F:/VisibleMedicine/recovery/checkpoints/20261031-small-cardiac-imaging-prepared/OVERLAY.json',overlay=json(overlayPath),rebase=json(proposal+'/REBASE.json');assert.equal(hash(overlayPath),'fbd4ffa91abaa29999f439fc0410887544ea9a0b3a19c30788aaf1e6f50ccb9c');assert.equal(hash(proposal+'/REBASE.json'),'35c4f27161047c5f5966d42eb928f82735016ef99a4818ac213258aeffc107f3');
assert.equal(git(base,'rev-parse','HEAD'),rebase.baseline.commit);assert.equal(git(base,'status','--porcelain'),'');assert.equal(hash(rebase.baseline.sourcePath),rebase.baseline.sourceSha256);assert.equal(hash(rebase.baseline.statePath),rebase.baseline.stateSha256);
const baseline=json(rebase.baseline.sourcePath),passed=json(rebase.baseline.statePath);assert(passed.terminal&&passed.passed&&passed.completed.length===13);for(const r of passed.completed){assert.equal(r.status,0);assert.equal(hash(r.log.path),r.log.sha256);}
for(const r of baseline.sourceRows)assert.equal(hash(base+'/'+r.path),r.sha256,r.path);
const changes=[...overlay.files,rebase.additionalValidator];assert.equal(changes.length,8);for(const r of changes){assert.equal(fs.existsSync(base+'/'+r.path)?hash(base+'/'+r.path):null,r.before,r.path);assert.equal(hash(r.source),r.after,r.path);}
fs.mkdirSync(root,{recursive:true});fs.mkdirSync(root+'/tmp');
execFileSync('git',['clone','--shared','--no-checkout','--',base,site],{encoding:'utf8',windowsHide:true,maxBuffer:2e6});git(site,'checkout','--detach',rebase.baseline.commit);
for(const r of baseline.sourceRows){assert(!fs.lstatSync(base+'/'+r.path).isSymbolicLink(),r.path);fs.mkdirSync(path.dirname(site+'/'+r.path),{recursive:true});fs.copyFileSync(base+'/'+r.path,site+'/'+r.path);assert.equal(hash(site+'/'+r.path),r.sha256,r.path);}
assert(!fs.existsSync(site+'/node_modules'));fs.symlinkSync(fs.realpathSync.native(base+'/node_modules'),site+'/node_modules','junction');
// Refresh the fresh checkout's line-ending stat cache after exact-byte copying.
// This must leave both index and tree identical to the verified baseline.
git(site,'-c','core.safecrlf=false','add','--all','--','.');assert.equal(git(site,'diff','--cached','--name-only'),'');assert.equal(git(site,'status','--porcelain'),'');
for(const r of changes){fs.mkdirSync(path.dirname(site+'/'+r.path),{recursive:true});fs.copyFileSync(r.source,site+'/'+r.path);assert.equal(hash(site+'/'+r.path),r.after,r.path);}
assert.equal(hash(site+'/'+overlay.rejected.path),overlay.rejected.baselineSha256);
const rows=new Map(baseline.sourceRows.map(r=>[r.path,r]));for(const r of changes)rows.set(r.path,{path:r.path,sha256:r.after,bytes:fs.statSync(site+'/'+r.path).size});
write(root+'/BASELINE.json',{at:new Date().toISOString(),site:base,head:rebase.baseline.commit,source:ref(rebase.baseline.sourcePath),state:ref(rebase.baseline.statePath),sourceRows:baseline.sourceRows});
write(root+'/SOURCE_PREPARED.json',{schema:'vm-small-cardiac-prepared/1',at:new Date().toISOString(),site,base:{root:base,head:rebase.baseline.commit,source:ref(rebase.baseline.sourcePath)},sourceRows:[...rows.values()],authoredFiles:changes.map(r=>rows.get(r.path)),overlay:ref(overlayPath),rebase:ref(proposal+'/REBASE.json'),comparator:ref(proposal+'/compare.mjs'),verificationPending:true,installed:false,clinicalApproval:false});
console.log(JSON.stringify({root,source:ref(root+'/SOURCE_PREPARED.json'),files:rows.size,changedFiles:changes.length,installed:false}));
