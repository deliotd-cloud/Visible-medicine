import fs from 'node:fs';
import path from 'node:path';
import net from 'node:net';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {hash,json} from 'file:///C:/Users/delio/Documents/Codex/2026-09-05/referenced-chatgpt-conversation-this-is-an-2/bounded-source-hash-20261026.mjs';
const stage='G:/VisibleMedicine-temp/staging/20261031-prostate-keyboard-delivery';
const cp='F:/VisibleMedicine/recovery/checkpoints/20261031-prostate-keyboard-install';
const site='F:/VisibleMedicine/website',atlas='F:/VisibleMedicine/atlas';
const newAtlas='4bb8f236a4cd57448342cbe4aa7b1641aff9743a',oldAtlas='df175264724a98ca4f70de19e1bfabd325084fdb';
const git=(dir,...args)=>execFileSync('git',['-C',dir,...args],{encoding:'utf8',windowsHide:true,maxBuffer:16e6}).trim();
const portFree=()=>new Promise(resolve=>{const server=net.createServer();server.once('error',()=>resolve(false));server.listen(3000,'127.0.0.1',()=>server.close(()=>resolve(true)));});
function confined(root,relative){
 assert(typeof relative==='string'&&relative.length>0&&!relative.includes('\\')&&!path.posix.isAbsolute(relative)&&!relative.split('/').some(x=>!x||x==='.'||x==='..'));
 const base=path.resolve(root),target=path.resolve(base,relative);assert(target.startsWith(base+path.sep),'Path escaped installation root');
 let current=base;assert(fs.lstatSync(current).isDirectory()&&!fs.lstatSync(current).isSymbolicLink());
 for(const part of relative.split('/').slice(0,-1)){current=path.join(current,part);if(fs.existsSync(current))assert(fs.lstatSync(current).isDirectory()&&!fs.lstatSync(current).isSymbolicLink(),'Linked ancestor');}
 if(fs.existsSync(target))assert(fs.lstatSync(target).isFile()&&!fs.lstatSync(target).isSymbolicLink(),'Linked destination');
 return target;
}
function privateState(){const root=site+'/.wrangler/state/v3/d1',out=[];if(!fs.existsSync(root))return out;
 const visit=dir=>{for(const d of fs.readdirSync(dir,{withFileTypes:true})){const p=path.join(dir,d.name);assert(!d.isSymbolicLink(),'Linked private-state path');if(d.isDirectory())visit(p);else{assert(d.isFile(),'Nonregular private state');out.push({path:p.replaceAll('\\','/'),sha256:hash(p)});}}};visit(root);return out.sort((a,b)=>a.path.localeCompare(b.path));}
assert(await portFree(),'Preview must be stopped by the main wrapper before preparation');
const planPath=stage+'/INSTALL_PLAN.json',plan=json(planPath);assert.equal(plan.conflicts.length,0);
assert.equal(hash(plan.source.path),plan.source.sha256);const source=json(plan.source.path);
assert.equal(source.website,stage+'/website');assert.equal(source.atlasHead,newAtlas);
assert.equal(git(atlas,'rev-parse','HEAD'),oldAtlas);assert.equal(git(atlas,'status','--porcelain','--untracked-files=all'),'');
assert.equal(git(source.atlas,'rev-parse','HEAD'),newAtlas);assert.equal(git(source.atlas,'status','--porcelain','--untracked-files=all'),'');
assert.equal(git(site,'rev-parse','HEAD'),plan.websiteHead);
for(const r of source.sourceRows)assert.equal(hash(source.website+'/'+r.path),r.sha256,r.path);
for(const op of plan.operations){const target=confined(site,op.path);assert.equal(fs.existsSync(target)?hash(target):null,op.before,op.path);}
for(const r of plan.preserved)assert.equal(fs.existsSync(site+'/'+r.path)?hash(site+'/'+r.path):null,r.sha256,'Preserved file changed: '+r.path);
const windowPath=cp+'/window/PLAN.json';assert(fs.existsSync(windowPath),'Existing preview window plan required');
const beforeBytes=fs.readFileSync(windowPath),before=json(windowPath);assert.equal(before.site,site);assert.equal(before.websiteHead,plan.websiteHead);
assert.equal(before.atlasHead,oldAtlas);assert.equal(before.restartSameVersion,true);
assert.equal(before.reviewBinding,plan.parent.sha256?json(plan.parent.path).review:before.reviewBinding);
const dir=cp+'/installation';assert(!fs.existsSync(dir),'Installation checkpoint already prepared');fs.mkdirSync(dir);
const files=privateState();fs.writeFileSync(dir+'/PRIVATE_STATE_BEFORE.json',JSON.stringify({at:new Date().toISOString(),files,databaseWrites:false},null,2)+'\n',{flag:'wx'});
for(const op of plan.operations){if(!op.before)continue;const target=confined(site,op.path),backup=path.resolve(dir,'source-before',op.path);assert(backup.startsWith(path.resolve(dir)+path.sep));fs.mkdirSync(path.dirname(backup),{recursive:true});fs.copyFileSync(target,backup,fs.constants.COPYFILE_EXCL);assert.equal(hash(backup),op.before);}
fs.copyFileSync(plan.source.path,dir+'/SOURCE.json',fs.constants.COPYFILE_EXCL);
fs.copyFileSync(planPath,dir+'/OPERATIONS.json',fs.constants.COPYFILE_EXCL);
fs.writeFileSync(dir+'/BEFORE_PLAN.json',beforeBytes,{flag:'wx'});
const after={...before,at:new Date().toISOString(),atlasHead:newAtlas,reviewBinding:source.review,source:plan.source,installCandidate:true,restartSameVersion:false,refreshOwnerTabs:false,privateDataUploaded:false,critical:before.critical.map(r=>{const rel=path.relative(site,r.path).replaceAll('\\','/');assert(!rel.startsWith('..'));return {...r,sha256:hash(source.website+'/'+rel)};})};
fs.writeFileSync(dir+'/AFTER_PLAN.json',JSON.stringify(after,null,2)+'\n',{flag:'wx'});
fs.writeFileSync(dir+'/PREPARED.json',JSON.stringify({at:new Date().toISOString(),source:plan.source,operations:{path:dir+'/OPERATIONS.json',sha256:hash(dir+'/OPERATIONS.json')},beforePlanSha256:hash(dir+'/BEFORE_PLAN.json'),afterPlanSha256:hash(dir+'/AFTER_PLAN.json'),privateBeforeSha256:hash(dir+'/PRIVATE_STATE_BEFORE.json'),backedUp:plan.operations.filter(x=>x.before).length,privateFiles:files.length,previewStopped:true,installed:false},null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({prepared:dir,operations:plan.operations.length,backedUp:plan.operations.filter(x=>x.before).length,privateFiles:files.length,previewStopped:true}));
