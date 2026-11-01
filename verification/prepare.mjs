import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {hash,json} from 'file:///C:/Users/delio/Documents/Codex/2026-09-05/referenced-chatgpt-conversation-this-is-an-2/bounded-source-hash-20261026.mjs';
const own='G:/VisibleMedicine-temp/proposals/20261101-renal-native-integration';
const source='G:/VisibleMedicine-temp/staging/20261101-hepatic-native-integration/atlas';
const root='G:/VisibleMedicine-temp/staging/20261101-renal-native-integration',atlas=root+'/atlas';
const parent='b688ddd0c1fb6392ba8e8d7890142d750c8100f1';
const git=(where,...a)=>execFileSync('git',['-C',where,...a],{encoding:'utf8',windowsHide:true,maxBuffer:4e6}).trim();
assert.equal(git(source,'rev-parse','HEAD'),parent);assert.equal(git(source,'status','--porcelain'),'');assert(!fs.existsSync(root));
const checkpoint='F:/VisibleMedicine/recovery/checkpoints/20261101-renal-venous-xray/checkpoint.json';
assert.equal(hash(checkpoint),'323fa61b358a5604a1d9dcc7f9a528459fdd52e390b455b4a48b9fb96be7c050');
const teaching=json(checkpoint);
for(const row of teaching.originalHashes)assert.equal(hash(source+'/'+row.path),row.sha256,row.path);
const changes=teaching.files.filter(r=>!r.path.startsWith('verification/')).map(r=>({...r,overlay:teaching.overlay}));
assert.equal(changes.length,3);for(const row of changes)assert.equal(hash(row.overlay+'/'+row.path),row.sha256,row.path);
fs.mkdirSync(root,{recursive:true});
execFileSync('git',['clone','--shared','--no-checkout','-c','core.autocrlf=false',source,atlas],{encoding:'utf8',windowsHide:true});
git(atlas,'checkout','--detach',parent);assert.equal(git(atlas,'status','--porcelain'),'');
fs.symlinkSync(fs.realpathSync(source+'/node_modules'),atlas+'/node_modules','junction');
for(const row of changes){const target=path.resolve(atlas,row.path);assert(target.startsWith(path.resolve(atlas)+path.sep));fs.mkdirSync(path.dirname(target),{recursive:true});fs.copyFileSync(row.overlay+'/'+row.path,target);assert.equal(hash(target),row.sha256);}
for(const dir of ['logs','checks','tmp'])fs.mkdirSync(root+'/'+dir);
const prepared={schema:'vm.renal-native-integration-source/1',at:new Date().toISOString(),source,sourceTree:git(source,'rev-parse','HEAD^{tree}'),parent,atlas,changes,
 unchangedTeachingPins:hash(source+'/content/nested-teaching-bindings.v1.json'),unchangedNestedLinkPins:hash(source+'/content/nested-review-bindings.json'),
 baselineRenderer:json(source+'/content/body-renderer-revision.json').sha256,installed:false,clinicalApproval:false};
fs.writeFileSync(root+'/PREPARED.json',JSON.stringify(prepared,null,2)+'\n',{flag:'wx'});
const old='G:/VisibleMedicine-temp/proposals/20261101-hepatic-native-integration';
const materials=fs.readFileSync(old+'/review-materials.mjs','utf8')
 .replace("const resultRoot='G:/VisibleMedicine-temp/staging/20261101-hepatic-native-integration'","const resultRoot='"+root+"'")
 .replaceAll('20261101-regional-teaching-types/atlas','20261101-hepatic-native-integration/atlas');
fs.writeFileSync(own+'/review-materials.mjs',materials,{flag:'wx'});
const compare=fs.readFileSync(old+'/review-compare.mjs','utf8')
 .replaceAll('20261101-hepatic-native-integration','20261101-renal-native-integration')
 .replaceAll("['hepatic-arterial','hepatic-portal']","['renal-veins','renal-suprarenal-veins']")
 .replaceAll('left-hepatic-arterial-branches','left-renal-vein').replaceAll('left-portal-vein-branches','left-suprarenal-vein')
 .replaceAll('right-hepatic-arterial-branches','right-renal-vein').replaceAll('right-portal-vein-branches','right-suprarenal-vein');
fs.writeFileSync(own+'/review-compare.mjs',compare,{flag:'wx'});
console.log(JSON.stringify({atlas,parent,sourceFiles:changes.length,installed:false}));
