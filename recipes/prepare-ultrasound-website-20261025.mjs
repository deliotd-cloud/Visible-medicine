import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {hash,json} from './seal-simple-website-successor.mjs';
import {memoryGate,verify} from './native-website-integration-stage-20261025.mjs';
const memory=memoryGate(2048);verify();
const prior='F:/VisibleMedicine/staging/20261025-native-integrated-website/SOURCE_READY.json';assert.equal(hash(prior),'741abbca0d70331ea068e66e9a1c2607d6c7119494da4f53bb8ad1db3e7c55cc');const base=json(prior);
const root='F:/VisibleMedicine/staging/20261025-ultrasound-local-website',site=root+'/website';assert(!fs.existsSync(root));fs.mkdirSync(root);
for(const r of base.sourceRows)assert.equal(hash(base.website+'/'+r.path),r.sha256,r.path);
execFileSync('git',['clone','--shared','--no-checkout',base.website,site],{windowsHide:true,stdio:'pipe'});execFileSync('git',['-C',site,'read-tree','HEAD'],{windowsHide:true});
for(const r of base.sourceRows){const to=path.join(site,r.path);fs.mkdirSync(path.dirname(to),{recursive:true});fs.copyFileSync(base.website+'/'+r.path,to,fs.constants.COPYFILE_EXCL);assert.equal(hash(to),r.sha256);}
fs.symlinkSync(base.website+'/node_modules',site+'/node_modules','junction');fs.symlinkSync(base.atlas,root+'/atlas','junction');fs.mkdirSync(site+'/.next/types',{recursive:true});fs.copyFileSync(base.website+'/.next/types/routes.d.ts',site+'/.next/types/routes.d.ts',fs.constants.COPYFILE_EXCL);
const priorPrep=json('F:/VisibleMedicine/staging/20261025-native-integrated-website/PREPARATION.json');for(const row of priorPrep.historicalFixtures){const to=root+'/before/'+row.path;fs.mkdirSync(path.dirname(to),{recursive:true});fs.copyFileSync('F:/VisibleMedicine/staging/20261025-native-integrated-website/before/'+row.path,to,fs.constants.COPYFILE_EXCL);assert.equal(hash(to),row.sha256);}
fs.writeFileSync(root+'/PREPARATION.json',JSON.stringify({at:new Date().toISOString(),memory,website:site,atlas:base.atlas,atlasHead:base.atlasHead,atlasTree:base.atlasTree,parent:prior,parentSha256:hash(prior),sourceRows:base.sourceRows,sourcePaths:base.sourceRows.length,reviewBinding:base.reviewBindingSha256,sourceOrScanAssetsChanged:false,privateDecisionsCopied:false,ownerPreviewChanged:false,installed:false},null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({root,sourcePaths:base.sourceRows.length,preparationSha256:hash(root+'/PREPARATION.json')}));
