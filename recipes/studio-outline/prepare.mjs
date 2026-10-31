import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {hash,json} from 'file:///C:/Users/delio/Documents/Codex/2026-09-05/referenced-chatgpt-conversation-this-is-an-2/bounded-source-hash-20261026.mjs';
const root='G:/VisibleMedicine-temp/staging/20261031-studio-outline-roundtrip',site=root+'/website';
const pin='G:/VisibleMedicine-temp/staging/20261031-release-partition6-final/SOURCE.json',proposal='G:/VisibleMedicine-temp/proposals/20261031-studio-outline-roundtrip';
assert.equal(hash(pin),'ecdf590078ef0d9561f833564f048b907ca4d363f9632f8f051a5213389ec974');
const parent=json(pin),manifest=json(proposal+'/MANIFEST.json'),base=new Map(parent.sourceRows.map(r=>[r.path,r]));
assert.equal(manifest.baseline.path,pin);assert.equal(manifest.baseline.sha256,hash(pin));assert(!fs.existsSync(site));
const product=new Set(['components/StudioCourseEditor.tsx','app/studio/workbooks/[workbookId]/builder/page.tsx','lib/studio-outline-navigation.ts']);
const seen=new Set();
for(const row of manifest.rows){
 assert(!seen.has(row.path));seen.add(row.path);
 assert(product.has(row.path)||/^tests\/studio-[a-z0-9-]+\.(?:test\.)?(?:mjs|ts)$/.test(row.path),row.path);
 assert.equal(row.baseSha256,base.get(row.path)?.sha256??null,row.path);
 assert.equal(hash(proposal+'/website/'+row.path),row.sha256,row.path);
 assert.equal(fs.statSync(proposal+'/website/'+row.path).size,row.bytes,row.path);
 assert.notEqual(row.sha256,row.baseSha256,row.path);
}
for(const row of parent.sourceRows){
 assert.equal(hash(parent.website+'/'+row.path),row.sha256,row.path);
 fs.mkdirSync(path.dirname(site+'/'+row.path),{recursive:true});
 fs.copyFileSync(parent.website+'/'+row.path,site+'/'+row.path,fs.constants.COPYFILE_EXCL);
}
fs.symlinkSync(fs.realpathSync(parent.website+'/node_modules'),site+'/node_modules','junction');
fs.symlinkSync(parent.atlas,root+'/atlas','junction');fs.mkdirSync(root+'/tmp',{recursive:true});
const git=(...args)=>execFileSync('git',['-C',site,...args],{encoding:'utf8',windowsHide:true}).trim();
git('init','--quiet');fs.writeFileSync(site+'/.git/objects/info/alternates',execFileSync('git',['-C','F:/VisibleMedicine/website','rev-parse','--path-format=absolute','--git-path','objects'],{encoding:'utf8',windowsHide:true}).trim().replaceAll('\\','/')+'\n',{flag:'wx'});git('update-ref','HEAD',parent.websiteHead);git('read-tree','HEAD');
for(const row of manifest.rows){fs.mkdirSync(path.dirname(site+'/'+row.path),{recursive:true});fs.copyFileSync(proposal+'/website/'+row.path,site+'/'+row.path);}
const paths=[...new Set([...base.keys(),...seen])].sort(),rows=paths.map(p=>({path:p,sha256:hash(site+'/'+p),bytes:fs.statSync(site+'/'+p).size}));
assert.deepEqual(rows.filter(r=>r.sha256!==base.get(r.path)?.sha256).map(r=>r.path),[...seen].sort());
const binding=json(site+'/atlas-review/integration-inputs.json');
for(const row of binding.inputs)assert.equal(hash(site+'/'+row.path),row.sha256,row.path);
const source={...parent,schema:'vm-studio-outline-return-candidate/1',at:new Date().toISOString(),website:site,parent:{path:pin,sha256:hash(pin)},proposal:{path:proposal+'/MANIFEST.json',sha256:hash(proposal+'/MANIFEST.json')},sourceRows:rows,sourcePaths:paths,changedPaths:manifest.rows.filter(r=>r.baseSha256).map(r=>r.path),addedPaths:manifest.rows.filter(r=>!r.baseSha256).map(r=>r.path),removedPaths:[],allProductInputsUnchanged:false,reviewBindingUnchanged:true,protectedInputsUnchanged:true,installed:false,fullBuildPassed:false,fullTypesPassed:false,wholeSuitePassing:false};
delete source.parentBuild;
fs.writeFileSync(root+'/SOURCE.json',JSON.stringify(source,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({sourceSha256:hash(root+'/SOURCE.json'),files:rows.length,changed:seen.size,reviewBinding:binding.sha256,installed:false}));
