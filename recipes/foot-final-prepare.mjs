import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import {execFileSync} from 'node:child_process';
import {hash,json} from 'file:///C:/Users/delio/Documents/Codex/2026-09-05/referenced-chatgpt-conversation-this-is-an-2/bounded-source-hash-20261026.mjs';
const root='G:/VisibleMedicine-temp/staging/20261029-foot-review-verified',site=root+'/website',prior='G:/VisibleMedicine-temp/staging/20261029-foot-review-integration';
const parentFile=prior+'/SOURCE_CANDIDATE.json';assert.equal(hash(parentFile),'584099fdc25b715167199c6ffb6494d7ac84bd4395ebf35b3e874a042f156e02');
const parent=json(parentFile),write=(p,b)=>{fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,typeof b==='string'||Buffer.isBuffer(b)?b:JSON.stringify(b,null,2)+'\n',{flag:'wx'});};
assert(!fs.existsSync(site));fs.mkdirSync(site);
for(const r of parent.sourceRows){assert.equal(hash(parent.website+'/'+r.path),r.sha256,r.path);fs.mkdirSync(path.dirname(site+'/'+r.path),{recursive:true});fs.copyFileSync(parent.website+'/'+r.path,site+'/'+r.path,fs.constants.COPYFILE_EXCL);}
fs.symlinkSync(fs.realpathSync(parent.website+'/node_modules'),site+'/node_modules','junction');
const git=(...a)=>execFileSync('git',['-C',site,...a],{encoding:'utf8',windowsHide:true}).trim();git('init','--quiet');
write(site+'/.git/objects/info/alternates',execFileSync('git',['-C','F:/VisibleMedicine/website','rev-parse','--path-format=absolute','--git-path','objects'],{encoding:'utf8',windowsHide:true}).trim().replaceAll('\\','/')+'\n');git('update-ref','HEAD',parent.websiteHead);git('read-tree','HEAD');
const authored=[];function edit(p,pairs){let text=fs.readFileSync(site+'/'+p,'utf8');write(root+'/before/'+p,text);for(const [before,after] of pairs){assert.equal(text.split(before).length,2,before);text=text.replace(before,after);}fs.writeFileSync(site+'/'+p,text);authored.push({path:p,bytes:Buffer.byteLength(text),sha256:hash(site+'/'+p),beforeSha256:parent.sourceRows.find(r=>r.path===p).sha256});}
edit('tests/clinical-review-extra-inbox.test.ts',[[String.raw`(plexus|optic|disc)$`,String.raw`(plexus|optic|disc|foot)$`]]);
edit('tests/clinical-review-inbox.test.ts',[
 ["row.area!=='regional-learning').length,57","row.area!=='regional-learning').length,58"],
 ['assert.equal(start.items.length,62)','assert.equal(start.items.length,63)'],
 ["const added=['head:ct-facial-comparison'","const added=['source:foot','head:ct-facial-comparison'"],
 ["row.area==='source-comparisons').length,4","row.area==='source-comparisons').length,5"],
 ["assert.equal(start.items.find(row=>row.key==='head:ct-facial-learning')?.capability,'inspection-only');","assert.equal(start.items.find(row=>row.key==='head:ct-facial-learning')?.capability,'inspection-only');\n assert.equal(start.items.find(row=>row.key==='source:foot')?.capability,'inspection-only');\n assert.equal(start.items.find(row=>row.key==='source:foot')?.status,'inspection-required');"]
]);
for(const r of parent.sourceRows){assert.equal(hash(parent.website+'/'+r.path),r.sha256,'Parent preserved: '+r.path);if(!authored.some(a=>a.path===r.path))assert.equal(hash(site+'/'+r.path),r.sha256,'Undeclared edit: '+r.path);}
write(root+'/PREPARED.json',{at:new Date().toISOString(),parent:{path:parentFile,sha256:hash(parentFile)},site,authored,privateAssetRoot:json(prior+'/PREPARED.json').privateAssetRoot,privateAssetModuleIncludedLocallyOnly:true,ownerPreviewChanged:false});
let verify=fs.readFileSync(prior+'/verify.mjs','utf8').replace("const root='G:/VisibleMedicine-temp/staging/20261029-foot-review-integration'",`const root='${root}'`);
verify=verify.replace("assert.equal(json('G:/VisibleMedicine-temp/staging/20261029-partition1-completed/batch/PROCESS-TERMINAL.json').terminalObserved,true",`assert.equal(json('${prior}/focused/PROCESS-TERMINAL.json').terminalObserved,true`);
write(root+'/verify.mjs',verify);console.log(JSON.stringify({site,authored:2}));
