import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import {execFileSync} from 'node:child_process';
import {hash,json} from 'file:///C:/Users/delio/Documents/Codex/2026-09-05/referenced-chatgpt-conversation-this-is-an-2/bounded-source-hash-20261026.mjs';
const sourceFile='G:/VisibleMedicine-temp/staging/20261101-hepatic-website/WEBSITE_SOURCE.json';
assert.equal(hash(sourceFile),'9412dcb2aa53e4732138b622a74a8fe6f14fa0e9a90a03f05ab773cf41829bf7');
const source=json(sourceFile),native=json('G:/VisibleMedicine-temp/staging/20261101-renal-native-integration/NATIVE_SOURCE.json');
const root='G:/VisibleMedicine-temp/staging/20261101-renal-website',site=root+'/website';
const git=(where,...args)=>execFileSync('git',['-C',where,...args],{encoding:'utf8',windowsHide:true}).trim();
assert.equal(source.atlasHead,'b688ddd0c1fb6392ba8e8d7890142d750c8100f1');assert.equal(source.sourceRows.length,7479);
assert.equal(native.head,'1a00bd0825f74672299d032b21710eebf031aa80');assert.equal(git(native.atlas,'rev-parse','HEAD'),native.head);assert.equal(git(native.atlas,'status','--porcelain'),'');
assert(!fs.existsSync(root),'Do not overwrite a prior website candidate');fs.mkdirSync(site,{recursive:true});
const child=(base,relative)=>{assert(relative&&!relative.includes('\\')&&!relative.includes(':')&&!path.isAbsolute(relative)&&relative.split('/').every(p=>p&&p!=='.'&&p!=='..'));const p=path.resolve(base,relative);assert(p.startsWith(path.resolve(base)+path.sep));return p;};
for(const row of source.sourceRows){const from=child(source.website,row.path),to=child(site,row.path);assert.equal(hash(from),row.sha256,row.path);fs.mkdirSync(path.dirname(to),{recursive:true});fs.copyFileSync(from,to,fs.constants.COPYFILE_EXCL);assert.equal(hash(to),row.sha256,row.path);}
fs.symlinkSync(fs.realpathSync(source.website+'/node_modules'),site+'/node_modules','junction');
for(const dir of ['tmp','logs','checks'])fs.mkdirSync(root+'/'+dir);
const importer=site+'/scripts/import-clinical-review.mjs',old=fs.readFileSync(importer,'utf8'),needle="const revision = '"+source.atlasHead+"';";
assert.equal(old.split(needle).length,2);fs.copyFileSync(importer,root+'/IMPORTER_BEFORE.mjs',fs.constants.COPYFILE_EXCL);
fs.writeFileSync(importer,old.replace(needle,"const revision = '"+native.head+"';"));
const prepared={schema:'vm.renal-website-preparation/1',at:new Date().toISOString(),website:site,native:native.atlas,nativeHead:native.head,nativeTree:native.tree,
 parent:{path:sourceFile,sha256:hash(sourceFile),website:source.website,atlasHead:source.atlasHead,reviewBinding:source.reviewBinding},sourcePaths:source.sourceRows.length,
 initialMutation:{path:'scripts/import-clinical-review.mjs',sha256:hash(importer),scope:'Exact Atlas source revision only'},privateHeldPacketsRemainLocal:true,imported:false,runtimesBuilt:false,installed:false};
fs.writeFileSync(root+'/PREPARATION.json',JSON.stringify(prepared,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({website:site,copiedSourcePaths:prepared.sourcePaths,imported:false,installed:false}));
