import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import {execFileSync} from 'node:child_process';
import {hash,json} from 'file:///C:/Users/delio/Documents/Codex/2026-09-05/referenced-chatgpt-conversation-this-is-an-2/bounded-source-hash-20261026.mjs';
const recipe='G:/VisibleMedicine-temp/proposals/20261031-release18-main',parentPath='G:/VisibleMedicine-temp/staging/20261031-release18-final/SOURCE.json',root='G:/VisibleMedicine-temp/staging/20261031-release19-initial',site=root+'/website';
const ref=p=>({path:p,sha256:hash(p)}),write=(p,v)=>fs.writeFileSync(p,JSON.stringify(v,null,2)+'\n',{flag:'wx'});
assert.equal(hash(parentPath),'bbebe31d1d2b296937a02d773fd3a09164d2c4ede68f46e52eb5c254321cde02');assert(!fs.existsSync(root));const parent=json(parentPath);
const inputs=[["G:/VisibleMedicine-temp/proposals/20261031-release19-orbital","ee6cd97d06d5453834091c5e454325b9b63070227234ae030f1742f75db74880"],["G:/VisibleMedicine-temp/proposals/20261031-thoracoabdominal-reader","cb6832e3af23914b7fe086cfb82ecfd95b2147a0a7863a557c39bddb451b687c"]];
const proposals=inputs.map(([p])=>p+'/MANIFEST.json'),rows=[];
for(const [p,digest]of inputs){
 assert.equal(hash(p+'/MANIFEST.json'),digest);const m=json(p+'/MANIFEST.json');
 for(const [name,digest]of Object.entries(m.unchangedDependencies??{}))assert.equal(hash(parent.website+'/'+name),digest,name);
 const files=m.files??[{path:m.file??m.copyPath,before:m.beforeSha256,after:m.afterSha256}];
 for(const r of files){rows.push({path:r.path,before:r.before??null,after:r.after??r.sha256,from:p+'/'+r.path});}
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
const gitAtlas=(...args)=>execFileSync('git',['--no-replace-objects','-C',parent.atlas,...args],{encoding:'utf8',windowsHide:true}).trim();
const atlasHead=gitAtlas('rev-parse','HEAD'),atlasTree=gitAtlas('rev-parse','HEAD^{tree}'),pin=json(site+'/tests/fixtures/current-atlas-delivery.json');
assert.equal(pin.source,atlasHead);assert.equal(pin.sourceTree,atlasTree);
assert.equal(atlasHead,'c32bc81cf0fd7ec22fa83e8b1365019297f9a0b3');assert.equal(atlasTree,'d7ead7f3673ddf5c4b68db755b559b08b921eec6');
write(root+'/ATLAS_IDENTITY.json',{at:new Date().toISOString(),atlas:parent.atlas,atlasHead,atlasTree,independentlyReadFromGit:true,fixture:{path:'tests/fixtures/current-atlas-delivery.json',sha256:hash(site+'/tests/fixtures/current-atlas-delivery.json')},parent:ref(parentPath),reason:'Supply missing authenticated source identity fields required by current role tests; original receipt remains immutable.'});
write(root+'/SOURCE.json',{...parent,atlasHead,atlasTree,atlasIdentity:ref(root+'/ATLAS_IDENTITY.json'),schema:'vm-release-nineteen-initial-successor/1',at:new Date().toISOString(),parent:ref(parentPath),website:site,sourceRows,currentChanges:rows.map(r=>r.path),runtimeUnchangedFromParent:true,installed:false});
write(root+'/COMPOSITION.json',{source:ref(root+'/SOURCE.json'),proposals:proposals.map(ref),benchmark:ref(benchmark),patches:rows,protectedInputs:binding.inputs.length,productUnchanged:true,clinicalDecisionsChanged:false});console.log(JSON.stringify({source:ref(root+'/SOURCE.json'),files:sourceRows.length,patches:rows.length,protectedInputs:binding.inputs.length}));
