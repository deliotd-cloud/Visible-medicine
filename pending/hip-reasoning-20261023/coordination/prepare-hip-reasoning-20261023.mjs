// Isolated source-only authoring; never installs or restarts the owner's preview.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';
import {hash,json} from './seal-simple-website-successor.mjs';
const parent='F:/VisibleMedicine/staging/20261023-regional-tour-entry/atlas';
const stage='F:/VisibleMedicine/staging/20261023-hip-reasoning',atlas=stage+'/atlas';
const head='39dbb747a44feb0f4bc83e757310c5e3d1b49580';
const git=(root,...args)=>execFileSync('git',['-C',root,...args],{encoding:'utf8',windowsHide:true,maxBuffer:32e6,stdio:['pipe','pipe','pipe']}).trim();
assert.equal(git(parent,'rev-parse','HEAD'),head);assert.equal(git(parent,'status','--porcelain'),'');
assert.equal(json('CURRENT_CHECKPOINT.json').activeWork.current.ownerPreviewPolicy.restartPermitted,false);
assert(!fs.existsSync(stage));fs.mkdirSync(stage);
// --local reuses the parent's existing object arrangement without adding a new
// alternate nesting level. All working files are independently hash-checked.
execFileSync('git',['clone','--local','-c','core.autocrlf=false',parent,atlas],{stdio:'pipe',windowsHide:true});
git(atlas,'checkout','--detach',head);
const files=git(parent,'ls-files','-z').split('\0').filter(Boolean).map(path=>({path,sha256:hash(parent+'/'+path)}));
for(const r of files)assert.equal(hash(atlas+'/'+r.path),r.sha256);
assert.equal(git(atlas,'status','--porcelain'),'');fs.symlinkSync(parent+'/node_modules',atlas+'/node_modules','junction');
fs.mkdirSync(stage+'/preimages');
for(const p of ['lib/reasoning-questions.ts','package.json','scripts/validate-reasoning-practice.mjs'])
 fs.copyFileSync(atlas+'/'+p,stage+'/preimages/'+p.replaceAll('/','_')+'.raw',fs.constants.COPYFILE_EXCL);
fs.writeFileSync(stage+'/PREPARED.json',JSON.stringify({at:new Date().toISOString(),parent,atlas,head,tree:git(parent,'rev-parse','HEAD^{tree}'),files,installed:false,previewChanged:false},null,2)+'\n',{flag:'wx'});
process.chdir(atlas);const {build}=await import(pathToFileURL(atlas+'/scripts/workspace-test-build.mjs'));
const result=await build({stdin:{contents:"export {bodyDisplayCatalog} from './lib/body-display-catalog';",resolveDir:atlas,loader:'ts'},bundle:true,write:false,platform:'node',format:'esm'});
const api=await import('data:text/javascript;base64,'+Buffer.from(result.outputFiles[0].text).toString('base64'));
const catalog=api.bodyDisplayCatalog(JSON.parse(fs.readFileSync('public/models/bodyparts3d/full-body/catalog.json')));
const groups=[
 ['obturator-externus',['FMA22326','FMA22327'],['FJ1425','FJ1425M']],
 ['gluteus-minimus',['FMA22332','FMA22333'],['FJ1420','FJ1420M']],
 ['tensor-fasciae-latae',['FMA22425','FMA22426'],['FJ1438','FJ1438M']],
];
const entries=groups.flatMap(([slug,fmas,sourceFiles])=>fmas.map((fma,i)=>{
 const matches=catalog.structures.filter(s=>s.fmaId===fma);assert.equal(matches.length,1);const identity=matches[0];
 assert.equal(identity.sourceTree,'isa');assert.equal(identity.region,'thigh');assert.deepEqual(identity.regions,slug==='tensor-fasciae-latae'?['thigh']:['thigh','pelvis']);
 assert.equal(identity.laterality,i===0?'right':'left');assert.equal(identity.sources.length,1);assert.equal(identity.sources[0].file,sourceFiles[i]);
 return{key:'hip-relationships-'+slug,identity};
}));
fs.writeFileSync(atlas+'/content/hip-relationships-reasoning-pins.json',JSON.stringify({schemaVersion:1,parentSource:head,entries},null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({stage,atlas,sourcePaths:files.length,pinnedRoots:entries.length,previewChanged:false}));
