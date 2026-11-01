// Execute once only, under the main chat's 1024 MiB heap / 2048 MiB job / 4096 MiB free guard.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {root,site,overlay,overlayPaths,child,sha,json,source,cleanNative,write,baseline,baselineSha,head,tree} from './plan.mjs';

const s=source();cleanNative();
const packagingRoot=path.dirname(overlay);
const packaging=json(child(packagingRoot,'PACKAGING_VERIFICATION.json'));
assert.equal(packaging.passed,14);assert.equal(packaging.fail,0);assert.equal(packaging.integrated,false);
const packagingBaseline=json(child(packagingRoot,'PACKAGING_BASELINE.json'));
for(const row of packagingBaseline.inputs)assert.equal(sha(child(s.website,row.path)),row.sha256,'Packaging base drift: '+row.path);
const packagingCheckpoint='F:/VisibleMedicine/recovery/checkpoints/20261101-atlas-runtime-packaging/checkpoint.json';
assert.equal(sha(packagingCheckpoint),'c61854d30d5de53af9d24e2d967e89cd563686df3391af2943e886f1f0b1ab84');
for(const rel of overlayPaths){const row=json(packagingCheckpoint).files.find(r=>r.path==='website/'+rel);assert(row,'Unverified packaging source');assert.equal(sha(child(overlay,rel)),row.sha256,rel);}
const nativeCheckpoint='F:/VisibleMedicine/recovery/checkpoints/20261101-prostate-orientation-native-verified/checkpoint.json';
assert.equal(sha(nativeCheckpoint),'a543fa62f58de8dbf9afd4df7b314855612fa539e0f69bf14013cb76bcb3d953');
const verified=json(nativeCheckpoint);assert.equal(verified.native.head,head);assert(verified.fullNativeTypes&&verified.nativeBuild);
assert.equal(sha(verified.nativeExport.path+'/manifest.json'),verified.nativeExport.manifestSha256);
assert(!fs.existsSync(root),'Fresh successor only; never overwrite an attempt');
for(const row of s.sourceRows){const from=child(s.website,row.path);assert.equal(fs.statSync(from).size,row.bytes,row.path);assert.equal(sha(from),row.sha256,row.path);}
fs.mkdirSync(site,{recursive:true});
for(const row of s.sourceRows){const to=child(site,row.path);fs.mkdirSync(path.dirname(to),{recursive:true});fs.copyFileSync(child(s.website,row.path),to,fs.constants.COPYFILE_EXCL);assert.equal(sha(to),row.sha256,row.path);}
const deps=fs.realpathSync(child(s.website,'node_modules'));
assert(fs.statSync(deps).isDirectory());fs.symlinkSync(deps,child(site,'node_modules'),'junction');
for(const dir of ['logs','coverage-candidate','evidence'])if(dir!=='coverage-candidate')fs.mkdirSync(child(root,dir));
const replaced=[];
for(const rel of overlayPaths){const from=child(overlay,rel),to=child(site,rel),before=fs.existsSync(to)?sha(to):null;fs.mkdirSync(path.dirname(to),{recursive:true});fs.copyFileSync(from,to);replaced.push({path:rel,before,sha256:sha(to)});}
// One exact handoff seam. The importer reads only the committed native revision.
const importer=child(site,'scripts/import-clinical-review.mjs');
const old="const revision = '7d3ab00f500a738d4f2d261ca6cd768e7f6ce1bc';";
const next=`const revision = '${head}';`;
const text=fs.readFileSync(importer,'utf8');assert.equal(text.split(old).length,2,'Importer revision seam drift');
fs.writeFileSync(importer,text.replace(old,next));assert.equal(fs.readFileSync(importer,'utf8').replace(next,old),text);
write(child(root,'PREPARATION.json'),{schema:'vm-orientation-website-preparation/1',baseline:{path:baseline,sha256:baselineSha,rows:s.sourceRows.length},website:site,nativeHead:head,nativeTree:tree,overlay:replaced,importer:{before:sha(child(s.website,'scripts/import-clinical-review.mjs')),after:sha(importer)},installed:false,clinicalApproval:false});
console.log(JSON.stringify({prepared:site,baselineRows:s.sourceRows.length,overlayFiles:replaced.length}));
