import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {hash,json} from './seal-simple-website-successor.mjs';
import {memoryGate} from './native-website-integration-stage-20261025.mjs';
const memory=memoryGate(2048),parent='F:/VisibleMedicine/staging/20261025-learning-delivery-website',sourceFile=parent+'/SOURCE_CANDIDATE.json',expected='b78888cc95b293b85cbdee3a022bd4b115303e6ae887b93f9da1157b42244876';assert.equal(hash(sourceFile),expected);const source=json(sourceFile),prior=json(parent+'/PREPARATION.json');
assert.equal(json(parent+'/checks/browser-attempt-1/SERVER_STOPPED.json').ownedServerClosed,true);assert.deepEqual(json('CURRENT_CHECKPOINT.json').activeWork.current.activeExecutionSessions,[]);
for(const phase of ['focused','types','build'])assert.equal(json(parent+'/checks/'+phase+'-attempt-1/TERMINAL.json').passing,true);
const free=Number(execFileSync('powershell',['-NoProfile','-NonInteractive','-Command',"(Get-PSDrive -Name F).Free"],{encoding:'utf8',windowsHide:true}).trim());assert(free>4*1024**3,'F drive needs at least4GiB free for bounded successor staging');
const root='F:/VisibleMedicine/staging/20261025-pan-and-adjacent-website',site=root+'/website';assert(!fs.existsSync(root));for(const r of source.sourceRows)assert.equal(hash(source.website+'/'+r.path),r.sha256,r.path);fs.mkdirSync(root);
assert.equal(execFileSync('git',['-C','F:/VisibleMedicine/website','rev-parse','HEAD'],{encoding:'utf8',windowsHide:true}).trim(),'b953ff3f5f1891599cb6e91cb91311d9d6006270');
execFileSync('git',['clone','--shared','--no-checkout','F:/VisibleMedicine/website',site],{windowsHide:true,stdio:'pipe'});execFileSync('git',['-C',site,'read-tree','HEAD'],{windowsHide:true});
for(const r of source.sourceRows){const to=path.join(site,r.path);fs.mkdirSync(path.dirname(to),{recursive:true});fs.copyFileSync(source.website+'/'+r.path,to,fs.constants.COPYFILE_EXCL);assert.equal(hash(to),r.sha256);}
fs.symlinkSync(source.website+'/node_modules',site+'/node_modules','junction');fs.symlinkSync(source.atlas,root+'/atlas','junction');fs.mkdirSync(site+'/.next/types',{recursive:true});fs.copyFileSync(source.website+'/.next/types/routes.d.ts',site+'/.next/types/routes.d.ts',fs.constants.COPYFILE_EXCL);
for(const row of json('F:/VisibleMedicine/staging/20261025-native-integrated-website/PREPARATION.json').historicalFixtures){const to=root+'/before/'+row.path;fs.mkdirSync(path.dirname(to),{recursive:true});fs.copyFileSync(parent+'/before/'+row.path,to,fs.constants.COPYFILE_EXCL);assert.equal(hash(to),row.sha256);}
fs.writeFileSync(root+'/PREPARATION.json',JSON.stringify({at:new Date().toISOString(),memory,freeBytes:free,website:site,atlas:source.atlas,atlasHead:source.atlasHead,atlasTree:prior.atlasTree,parent:sourceFile,parentSha256:expected,sourceRows:source.sourceRows,sourcePaths:source.sourceRows.length,dependencies:source.dependencies,reviewBinding:source.reviewBindingSha256,privateStateCopied:false,ownerPreviewChanged:false,installed:false},null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({root,sourcePaths:source.sourceRows.length,preparationSha256:hash(root+'/PREPARATION.json')}));
