import fs from 'node:fs';
import path from 'node:path';
import net from 'node:net';
import assert from 'node:assert/strict';
import {execFileSync,spawnSync} from 'node:child_process';
import {hash,json} from 'file:///C:/Users/delio/Documents/Codex/2026-09-05/referenced-chatgpt-conversation-this-is-an-2/bounded-source-hash-20261026.mjs';
const cp='F:/VisibleMedicine/recovery/checkpoints/20261031-prostate-compact-delivery',dir=cp+'/installation';
const site='F:/VisibleMedicine/website',atlas='F:/VisibleMedicine/atlas',window=cp+'/window5/PLAN.json';
const oldAtlas='4bb8f236a4cd57448342cbe4aa7b1641aff9743a',newAtlas='4e67ef78f57269747e40a864d70c3c5ac2390860';
const newTree='f23424f012ca1a81f53104ab3f7fd3edd9c239d3';
const git=(...args)=>execFileSync('git',['-C',atlas,...args],{encoding:'utf8',windowsHide:true,maxBuffer:16e6}).trim();
const portFree=()=>new Promise(resolve=>{const server=net.createServer();server.once('error',()=>resolve(false));server.listen(3000,'127.0.0.1',()=>server.close(()=>resolve(true)));});
function target(relative){
 assert(typeof relative==='string'&&relative.length>0&&!relative.includes('\\')&&!path.posix.isAbsolute(relative)&&!relative.split('/').some(x=>!x||x==='.'||x==='..'));
 const base=path.resolve(site),p=path.resolve(base,relative);assert(p.startsWith(base+path.sep),'Path escaped website');
 let current=base;assert(fs.lstatSync(current).isDirectory()&&!fs.lstatSync(current).isSymbolicLink());
 for(const part of relative.split('/').slice(0,-1)){current=path.join(current,part);if(fs.existsSync(current))assert(fs.lstatSync(current).isDirectory()&&!fs.lstatSync(current).isSymbolicLink(),'Linked ancestor');}
 if(fs.existsSync(p))assert(fs.lstatSync(p).isFile()&&!fs.lstatSync(p).isSymbolicLink(),'Linked target');return p;
}
function privateState(){const root=site+'/.wrangler/state/v3/d1',out=[];if(!fs.existsSync(root))return out;
 const visit=dir=>{for(const d of fs.readdirSync(dir,{withFileTypes:true})){const p=path.join(dir,d.name);assert(!d.isSymbolicLink(),'Linked private-state path');if(d.isDirectory())visit(p);else{assert(d.isFile(),'Nonregular private state');out.push({path:p.replaceAll('\\','/'),sha256:hash(p)});}}};visit(root);return out.sort((a,b)=>a.path.localeCompare(b.path));}
function writeExclusive(p,v){fs.writeFileSync(p,JSON.stringify(v,null,2)+'\n',{flag:'wx'});}
const prepared=json(dir+'/PREPARED.json'),plan=json(dir+'/OPERATIONS.json'),source=json(dir+'/SOURCE.json');
assert.equal(hash(dir+'/OPERATIONS.json'),prepared.operations.sha256);
assert.equal(hash(dir+'/SOURCE.json'),plan.source.sha256);
assert.equal(hash(dir+'/BEFORE_PLAN.json'),prepared.beforePlanSha256);
assert.equal(hash(dir+'/AFTER_PLAN.json'),prepared.afterPlanSha256);
assert.equal(hash(dir+'/PRIVATE_STATE_BEFORE.json'),prepared.privateBeforeSha256);
assert.deepEqual(plan.source,prepared.source);assert.equal(plan.conflicts.length,0);
assert.equal(source.atlasHead,newAtlas);assert.equal(source.atlasTree,newTree);
assert.equal(fs.existsSync(dir+'/INSTALLED.json'),false,'Already installed');
assert(await portFree(),'Main wrapper must stop preview before installation');
assert.equal(git('rev-parse','HEAD'),oldAtlas);assert.equal(git('status','--porcelain','--untracked-files=all'),'');
assert.equal(execFileSync('git',['-C',site,'rev-parse','HEAD'],{encoding:'utf8',windowsHide:true}).trim(),plan.websiteHead);
assert.equal(hash(window),prepared.beforePlanSha256,'Window plan changed after preparation');
for(const r of source.sourceRows)assert.equal(hash(source.website+'/'+r.path),r.sha256,'Staged row '+r.path);
for(const op of plan.operations){assert(!op.path.startsWith('.env')&&!op.path.startsWith('.wrangler/')&&!op.path.startsWith('db/')&&!op.path.startsWith('private/')&&!op.path.startsWith('app/api/auth/')&&!op.path.startsWith('lib/auth/'));
 const p=target(op.path);assert.equal(fs.existsSync(p)?hash(p):null,op.before,op.path);
 if(op.before)assert.equal(hash(path.resolve(dir,'source-before',op.path)),op.before,'Backup '+op.path);
}
for(const r of plan.preserved)assert.equal(fs.existsSync(site+'/'+r.path)?hash(site+'/'+r.path):null,r.sha256,'Preserved file changed '+r.path);
const privateBefore=json(dir+'/PRIVATE_STATE_BEFORE.json').files;assert.deepEqual(privateState(),privateBefore,'Private D1 changed after snapshot');
const candidateAtlas=source.atlas;const candidateGit=(...a)=>execFileSync('git',['-C',candidateAtlas,...a],{encoding:'utf8',windowsHide:true,maxBuffer:16e6}).trim();
assert.equal(candidateGit('rev-parse','HEAD'),newAtlas);assert.equal(candidateGit('rev-parse','HEAD^{tree}'),newTree);
assert.equal(candidateGit('status','--porcelain','--untracked-files=all'),'');
let atlasChanged=false,planChanged=false,receiptWritten=false;const applied=[];
try{
 git('fetch','--quiet','--no-tags',candidateAtlas,newAtlas);
 assert.equal(git('rev-parse','HEAD'),oldAtlas);assert.equal(git('status','--porcelain','--untracked-files=all'),'');
 assert.equal(spawnSync('git',['-C',atlas,'merge-base','--is-ancestor',oldAtlas,newAtlas],{windowsHide:true}).status,0,'Atlas candidate must fast-forward');
 git('update-ref','refs/checkpoints/before-prostate-compact-20261031',oldAtlas);git('merge','--ff-only','--no-edit',newAtlas);atlasChanged=true;
 assert.equal(git('rev-parse','HEAD'),newAtlas);assert.equal(git('rev-parse','HEAD^{tree}'),newTree);
 for(const op of plan.operations){const p=target(op.path);assert.equal(fs.existsSync(p)?hash(p):null,op.before,'Live conflict '+op.path);applied.push(op);
  if(op.after){assert.equal(hash(source.website+'/'+op.path),op.after,'Staged operation '+op.path);fs.mkdirSync(path.dirname(p),{recursive:true});fs.copyFileSync(source.website+'/'+op.path,p);assert.equal(hash(p),op.after,'Installed operation '+op.path);}
  else{assert(op.before,'Deletion requires preimage');fs.unlinkSync(p);assert(!fs.existsSync(p));}
 }
 for(const r of source.sourceRows){if(plan.preserved.some(p=>p.path===r.path))continue;assert.equal(hash(target(r.path)),r.sha256,'Installed row '+r.path);}
 assert.deepEqual(privateState(),privateBefore,'Private D1 changed during installation');
 assert.equal(git('status','--porcelain','--untracked-files=all'),'','Installed Atlas must remain clean');
 const receipt={schema:'vm-prostate-compact-installed/1',at:new Date().toISOString(),source:plan.source,website:site,websiteHead:plan.websiteHead,atlasBefore:oldAtlas,atlasAfter:newAtlas,atlasTree:newTree,review:source.review,sourceRows:source.sourceRows.length,operations:plan.operations.length,privateDatabaseUnchanged:true,authChanged:false,publicDeployment:false,clinicalApproval:false,patientRegistration:false,ownerTabsReloaded:false};
 writeExclusive(dir+'/INSTALLED.json',receipt);receiptWritten=true;
 fs.writeFileSync(window,fs.readFileSync(dir+'/AFTER_PLAN.json'));
 planChanged=true;assert.equal(hash(window),prepared.afterPlanSha256);
 console.log(JSON.stringify({installed:true,receipt:dir+'/INSTALLED.json',operations:applied.length,atlasHead:newAtlas,previewRestarted:false}));
}catch(error){
 const problems=[];
 for(const op of [...applied].reverse()){try{const p=target(op.path),now=fs.existsSync(p)?hash(p):null;assert(now===op.before||now===op.after,'Concurrent bytes preserved during rollback');if(op.before){const backup=path.resolve(dir,'source-before',op.path);assert(backup.startsWith(path.resolve(dir)+path.sep));assert.equal(hash(backup),op.before);fs.mkdirSync(path.dirname(p),{recursive:true});fs.copyFileSync(backup,p);assert.equal(hash(p),op.before);}else if(fs.existsSync(p)){fs.unlinkSync(p);}}catch(e){problems.push({path:op.path,error:String(e)});}}
 try{if(atlasChanged){assert.equal(git('rev-parse','HEAD'),newAtlas);assert.equal(git('status','--porcelain','--untracked-files=all'),'');git('reset','--hard',oldAtlas);assert.equal(git('rev-parse','HEAD'),oldAtlas);}}catch(e){problems.push({path:'atlas',error:String(e)});}
 try{fs.writeFileSync(window,fs.readFileSync(dir+'/BEFORE_PLAN.json'));assert.equal(hash(window),prepared.beforePlanSha256);}catch(e){problems.push({path:'window/PLAN.json',error:String(e)});}
 try{if(receiptWritten)fs.unlinkSync(dir+'/INSTALLED.json');}catch(e){problems.push({path:'INSTALLED.json',error:String(e)});}
 try{assert.deepEqual(privateState(),privateBefore);}catch(e){problems.push({path:'private-D1',error:String(e)});}
 writeExclusive(dir+'/INSTALL_FAILED.json',{at:new Date().toISOString(),error:String(error),applied:applied.length,sourceRollbackProblems:problems,atlasHead:git('rev-parse','HEAD'),previewRestarted:false});
 console.error(JSON.stringify({installed:false,error:String(error),rollbackProblems:problems,previewRestarted:false}));
 process.exitCode=1;
}
