import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {hash,json} from './seal-simple-website-successor.mjs';
import {memoryGate} from './native-website-integration-stage-20261025.mjs';
const memory=memoryGate(2048),parent='F:/VisibleMedicine/staging/20261025-ultrasound-local-website',sourceFile=parent+'/SOURCE_CANDIDATE.json';assert.equal(hash(sourceFile),'db06a6b990a137958ca4d856b3dad1ce2d6b8439b4116f8b39b753a26dfea34f');const source=json(sourceFile),oldPrep=json(parent+'/PREPARATION.json');
assert.equal(json(parent+'/checks/browser-attempt-1/SERVER_STOPPED.json').ownedServerClosed,true);for(const p of ['focused','types','build'])assert.equal(json(parent+'/checks/'+p+'-attempt-1/TERMINAL.json').passing,true);
const failed='F:/VisibleMedicine/staging/20261025-ultrasound-polished-website';
assert(fs.existsSync(failed+'/RECIPE_BEFORE.mjs'));fs.writeFileSync(failed+'/FAILURE.json',JSON.stringify({at:new Date().toISOString(),exitCode:128,phase:'git-clone-before-source-copy',reason:'Parent shared-clone alternate nesting exceeded Git limit; no source files copied or changed. Failed partial Git checkout retained.',canonicalBaseUsedForNextAttempt:true},null,2)+'\n',{flag:'wx'});
const root='F:/VisibleMedicine/staging/20261025-ultrasound-polished-website-v2',site=root+'/website';assert(!fs.existsSync(root));for(const r of source.sourceRows)assert.equal(hash(source.website+'/'+r.path),r.sha256,r.path);fs.mkdirSync(root);
assert.equal(execFileSync('git',['-C','F:/VisibleMedicine/website','rev-parse','HEAD'],{encoding:'utf8',windowsHide:true}).trim(),'b953ff3f5f1891599cb6e91cb91311d9d6006270');
execFileSync('git',['clone','--shared','--no-checkout','F:/VisibleMedicine/website',site],{windowsHide:true,stdio:'pipe'});execFileSync('git',['-C',site,'read-tree','HEAD'],{windowsHide:true});
for(const r of source.sourceRows){const to=path.join(site,r.path);fs.mkdirSync(path.dirname(to),{recursive:true});fs.copyFileSync(source.website+'/'+r.path,to,fs.constants.COPYFILE_EXCL);assert.equal(hash(to),r.sha256);}
fs.symlinkSync(source.website+'/node_modules',site+'/node_modules','junction');fs.symlinkSync(source.atlas,root+'/atlas','junction');fs.mkdirSync(site+'/.next/types',{recursive:true});fs.copyFileSync(source.website+'/.next/types/routes.d.ts',site+'/.next/types/routes.d.ts',fs.constants.COPYFILE_EXCL);
const nativePrep=json('F:/VisibleMedicine/staging/20261025-native-integrated-website/PREPARATION.json');for(const row of nativePrep.historicalFixtures){const to=root+'/before/'+row.path;fs.mkdirSync(path.dirname(to),{recursive:true});fs.copyFileSync(parent+'/before/'+row.path,to,fs.constants.COPYFILE_EXCL);assert.equal(hash(to),row.sha256);}
fs.writeFileSync(root+'/PREPARATION.json',JSON.stringify({at:new Date().toISOString(),memory,website:site,atlas:source.atlas,atlasHead:source.atlasHead,atlasTree:oldPrep.atlasTree,parent:sourceFile,parentSha256:hash(sourceFile),sourceRows:source.sourceRows,sourcePaths:6679,dependencies:source.dependencies,reviewBinding:source.reviewBindingSha256,privateStateCopied:false,ownerPreviewChanged:false,installed:false},null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({root,sourcePaths:6679,preparationSha256:hash(root+'/PREPARATION.json')}));
