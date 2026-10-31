import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import {execFileSync} from 'node:child_process';
import {hash,json} from 'file:///C:/Users/delio/Documents/Codex/2026-09-05/referenced-chatgpt-conversation-this-is-an-2/bounded-source-hash-20261026.mjs';
const recipe='G:/VisibleMedicine-temp/proposals/20261031-release18-main',parentPath='G:/VisibleMedicine-temp/staging/20261031-release19-initial/SOURCE.json',root='G:/VisibleMedicine-temp/staging/20261031-release19-followup',site=root+'/website';
const ref=p=>({path:p,sha256:hash(p)}),write=(p,v)=>fs.writeFileSync(p,JSON.stringify(v,null,2)+'\n',{flag:'wx'});
assert.equal(hash(parentPath),'9f4a686e1611d66f3c2392bdcc6a6ad83100a55fcdcbb6e06c4a1581334e6f46');assert(!fs.existsSync(root));const parent=json(parentPath);
const inputs=[["G:/VisibleMedicine-temp/proposals/20261031-release19-expanded","72cf33ca69f3ac263eed09d084e849ba8fb2f365d873f79a379083a29fe49d69"],["G:/VisibleMedicine-temp/proposals/20261031-release19-closure","0fea1c6d184a846f2f2257613f64c7c2095fec3a672e031343447adbb739ef1b"]];
const proposals=inputs.map(([p])=>p+'/MANIFEST.json'),rows=[];
for(const [p,digest]of inputs){
 assert.equal(hash(p+'/MANIFEST.json'),digest);const m=json(p+'/MANIFEST.json');
 for(const r of m.files??m.copyPaths){const before=r.beforeSha256??r.before??(m.before?.path===r.path?m.before.sha256:m.before?.[r.path])??null;rows.push({path:r.path,before,after:r.afterSha256??r.after??r.sha256,from:p+'/'+r.path});}
 for(const [name,origin]of Object.entries(m.witnessOrigins??{}))assert.equal(hash(origin),hash(p+'/'+name),name+' authentic saved witness');
}
const benchmark='G:/VisibleMedicine-temp/proposals/20261031-hand-pilot-native/attempt-1jYbKo/RESULT.json';
assert.equal(new Set(rows.map(r=>r.path)).size,rows.length);
for(const r of rows){assert(r.path.startsWith('tests/')&&!r.path.split('/').includes('..'));assert.equal(parent.sourceRows.find(p=>p.path===r.path)?.sha256??null,r.before,r.path);assert.equal(hash(r.from),r.after,r.path);}
const map=new Map(rows.map(r=>[r.path,r])),sourceRows=[];
for(const row of parent.sourceRows){assert.equal(hash(parent.website+'/'+row.path),row.sha256,row.path);const dest=site+'/'+row.path,p=map.get(row.path);fs.mkdirSync(path.dirname(dest),{recursive:true});fs.copyFileSync(p?.from??parent.website+'/'+row.path,dest,fs.constants.COPYFILE_EXCL);assert.equal(hash(dest),p?.after??row.sha256,row.path);sourceRows.push({...row,sha256:hash(dest),bytes:fs.statSync(dest).size});}
for(const p of rows.filter(r=>r.before===null)){const dest=site+'/'+p.path;fs.mkdirSync(path.dirname(dest),{recursive:true});fs.copyFileSync(p.from,dest,fs.constants.COPYFILE_EXCL);sourceRows.push({path:p.path,sha256:hash(dest),bytes:fs.statSync(dest).size});}sourceRows.sort((a,b)=>a.path.localeCompare(b.path));
fs.symlinkSync(fs.realpathSync(parent.website+'/node_modules'),site+'/node_modules','junction');fs.symlinkSync(parent.atlas,root+'/atlas','junction');fs.mkdirSync(root+'/tmp');
const git=(...args)=>execFileSync('git',['-C',site,...args],{encoding:'utf8',windowsHide:true}).trim();git('init','--quiet');const objects=execFileSync('git',['-C','F:/VisibleMedicine/website','rev-parse','--path-format=absolute','--git-path','objects'],{encoding:'utf8',windowsHide:true}).trim().replaceAll('\\','/');fs.writeFileSync(site+'/.git/objects/info/alternates',objects+'\n',{flag:'wx'});git('update-ref','HEAD',parent.websiteHead);git('read-tree','HEAD');
const binding=json(site+'/atlas-review/integration-inputs.json');assert.equal(binding.sha256,parent.review);for(const r of binding.inputs)assert.equal(hash(site+'/'+r.path),r.sha256,r.path);assert.equal(hash(parent.historicalEnvironment.path),parent.historicalEnvironment.sha256);
write(root+'/SOURCE.json',{...parent,schema:'vm-release-nineteen-followup-successor/1',at:new Date().toISOString(),parent:ref(parentPath),website:site,sourceRows,currentChanges:rows.map(r=>r.path),runtimeUnchangedFromParent:true,installed:false});
write(root+'/COMPOSITION.json',{source:ref(root+'/SOURCE.json'),proposals:proposals.map(ref),benchmark:ref(benchmark),patches:rows,protectedInputs:binding.inputs.length,productUnchanged:true,clinicalDecisionsChanged:false});console.log(JSON.stringify({source:ref(root+'/SOURCE.json'),files:sourceRows.length,patches:rows.length,protectedInputs:binding.inputs.length}));
