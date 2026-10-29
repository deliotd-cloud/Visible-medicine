import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {hash,json} from 'file:///C:/Users/delio/Documents/Codex/2026-09-05/referenced-chatgpt-conversation-this-is-an-2/bounded-source-hash-20261026.mjs';
const root='G:/VisibleMedicine-temp/staging/20261029-partition1-completed',site=root+'/website';
const parentFile='G:/VisibleMedicine-temp/staging/20261029-partition1-repair/SOURCE_CANDIDATE.json';
assert.equal(hash(parentFile),'3ac84bc3985c43604158853d519dddef547b877187ac0146a30d6376d798bd9b');
const parent=json(parentFile),write=(p,b)=>{fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,typeof b==='string'||Buffer.isBuffer(b)?b:JSON.stringify(b,null,2)+'\n',{flag:'wx'});};
assert(!fs.existsSync(site));fs.mkdirSync(site);
for(const row of parent.sourceRows){assert.equal(hash(parent.website+'/'+row.path),row.sha256,row.path);fs.mkdirSync(path.dirname(site+'/'+row.path),{recursive:true});fs.copyFileSync(parent.website+'/'+row.path,site+'/'+row.path,fs.constants.COPYFILE_EXCL);}
fs.symlinkSync(fs.realpathSync(parent.website+'/node_modules'),site+'/node_modules','junction');
const git=(...a)=>execFileSync('git',['-C',site,...a],{encoding:'utf8',windowsHide:true}).trim();git('init','--quiet');
write(site+'/.git/objects/info/alternates',execFileSync('git',['-C',parent.website,'rev-parse','--path-format=absolute','--git-path','objects'],{encoding:'utf8',windowsHide:true}).trim().replaceAll('\\','/')+'\n');git('update-ref','HEAD',parent.websiteHead);git('read-tree','HEAD');
const authored=[];
for(const p of ['tests/review-filter-scroll-source-role.mjs','tests/clinical-review-short-ciliary-quiz.test.ts']){
  const previous=parent.sourceRows.find(r=>r.path===p);assert(previous);write(root+'/before/'+p,fs.readFileSync(site+'/'+p));
  fs.copyFileSync('G:/VisibleMedicine-temp/staging/20261029-partition1-followup/'+p,site+'/'+p);
  authored.push({path:p,bytes:fs.statSync(site+'/'+p).size,sha256:hash(site+'/'+p),beforeSha256:previous.sha256});
}
for(const row of parent.sourceRows){assert.equal(hash(parent.website+'/'+row.path),row.sha256,'Parent preserved: '+row.path);if(!authored.some(r=>r.path===row.path))assert.equal(hash(site+'/'+row.path),row.sha256,'Undeclared edit: '+row.path);}
write(root+'/PREPARED.json',{at:new Date().toISOString(),parent:{path:parentFile,sha256:hash(parentFile)},site,authored,productCodeUnchanged:true,ownerPreviewChanged:false});
const previousVerify=fs.readFileSync('G:/VisibleMedicine-temp/staging/20261029-partition1-repair/verify.mjs','utf8');
assert.equal(previousVerify.split("const root='G:/VisibleMedicine-temp/staging/20261029-partition1-repair'").length,2);
write(root+'/verify.mjs',previousVerify.replace("const root='G:/VisibleMedicine-temp/staging/20261029-partition1-repair'","const root='G:/VisibleMedicine-temp/staging/20261029-partition1-completed'"));
console.log(JSON.stringify({site,authored:authored.length,sourceFiles:parent.sourceRows.length}));
