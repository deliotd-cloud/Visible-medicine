import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import {execFileSync} from 'node:child_process';
import {hash,json} from './seal-simple-website-successor.mjs';import {memoryGate} from './native-website-integration-stage-20261025.mjs';
const parentFile='F:/VisibleMedicine/staging/20261025-checklist-workflow-website/SOURCE_CANDIDATE.json',parentSha='72b19dddae878320a437ebadd3ec0ce54421922e3c6e39199ada3d9498f4a345',parent=json(parentFile);
const stage='F:/VisibleMedicine/staging/20261025-checklist-child-env-website',site=stage+'/website',p='tests/completion-checklist-local-import.test.mjs',memory=memoryGate(2048);
assert(!fs.existsSync(stage));assert.equal(hash(parentFile),parentSha);for(const r of parent.sourceRows)assert.equal(hash(parent.website+'/'+r.path),r.sha256,r.path);
assert.equal(hash(parent.website+'/'+p),'58721168ca3fcd9411c6c7f582820d94cda3477053c1ad0885eaec133d5b4532');
const original=fs.readFileSync(parent.website+'/'+p,'utf8');let revised=original;
const insertion=" const childEnvironment=Object.fromEntries(Object.entries(process.env).filter(([key])=>/^(path|systemroot|windir|comspec|pathext|temp|tmp|os|processor_architecture|number_of_processors)$/i.test(key)));\n";
const marker=' const run=spawnSync(process.execPath,';assert.equal(revised.split(marker).length,2);revised=revised.replace(marker,insertion+marker);
const option='windowsHide:true,shell:false,maxBuffer:4*1024*1024';assert.equal(revised.split(option).length,2);revised=revised.replace(option,'windowsHide:true,shell:false,env:childEnvironment,maxBuffer:4*1024*1024');
assert.equal(revised.replace(insertion,'').replace('windowsHide:true,shell:false,env:childEnvironment,maxBuffer:4*1024*1024',option),original,'Only the clean child environment changes');
const git=args=>execFileSync('git',args,{windowsHide:true,stdio:'pipe',env:{...process.env,GIT_OPTIONAL_LOCKS:'0',GIT_NO_REPLACE_OBJECTS:'1'}});
assert.equal(git(['-C','F:/VisibleMedicine/website','rev-parse','HEAD']).toString().trim(),'b953ff3f5f1891599cb6e91cb91311d9d6006270');fs.mkdirSync(stage);
git(['--no-replace-objects','clone','--shared','--no-checkout','--','F:/VisibleMedicine/website',site]);git(['-C',site,'config','--local','core.autocrlf','false']);git(['-C',site,'read-tree','HEAD']);
for(const r of parent.sourceRows){fs.mkdirSync(path.dirname(site+'/'+r.path),{recursive:true});fs.copyFileSync(parent.website+'/'+r.path,site+'/'+r.path,fs.constants.COPYFILE_EXCL);}
fs.symlinkSync(fs.realpathSync(parent.website+'/node_modules'),site+'/node_modules','junction');fs.symlinkSync(parent.atlas,stage+'/atlas','junction');
for(const r of ['next-env.d.ts','.next/types/routes.d.ts'])if(!fs.existsSync(site+'/'+r)&&fs.existsSync(parent.website+'/'+r)){fs.mkdirSync(path.dirname(site+'/'+r),{recursive:true});fs.copyFileSync(parent.website+'/'+r,site+'/'+r);}
fs.writeFileSync(stage+'/WRAPPER_BEFORE.mjs.raw',original,{flag:'wx'});fs.writeFileSync(site+'/'+p,revised);
execFileSync(process.execPath,['--check',site+'/'+p],{windowsHide:true});
const rows=parent.sourceRows.map(r=>r.path===p?{path:p,bytes:fs.statSync(site+'/'+p).size,sha256:hash(site+'/'+p)}:{...r});for(const r of rows)assert.equal(hash(site+'/'+r.path),r.sha256,r.path);
const result={...parent,schema:'vm-checklist-clean-child-source-candidate/1',at:new Date().toISOString(),website:site,parent:parentFile,parentSha256:parentSha,sourceRows:rows,changedPaths:[p],addedPaths:[],removedPaths:[],childEnvironmentCorrection:{beforeSha256:hash(stage+'/WRAPPER_BEFORE.mjs.raw'),afterSha256:hash(site+'/'+p),onlyAllowlistedSystemEnvironmentForwarded:true,recursiveNodeTestContextNotForwarded:true,originalAssertionsAndAll19ChildCasesUnchanged:true,validJsonTerminalNewline:true,completeInverseVerified:true,retainedFailure:'F:/VisibleMedicine/staging/20261025-checklist-workflow-website/checks/whole-roots-attempt-1/RESULT.json'},installed:false,ownerPreviewChanged:false};
fs.writeFileSync(stage+'/SOURCE_CANDIDATE.json',JSON.stringify(result,null,2)+'\n',{flag:'wx'});fs.copyFileSync('F:/VisibleMedicine/staging/20261025-checklist-workflow-website/ROOTS.json',stage+'/ROOTS.json');fs.writeFileSync(stage+'/PREPARATION.json',JSON.stringify({at:new Date().toISOString(),memory,parent:{path:parentFile,sha256:parentSha},onlyChangedPath:p,allOtherSourceBytesPreserved:true},null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({source:stage+'/SOURCE_CANDIDATE.json',sha256:hash(stage+'/SOURCE_CANDIDATE.json'),wrapperSha256:hash(site+'/'+p),paths:rows.length}));
