// The historical pilot helper expects the Website object's store at its root.
// Supply the isolated harness with that read context, not another Git clone.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {read,json,sha} from './source-only-backup-20261019.mjs';
const stage='F:/VisibleMedicine/staging/20261021-head-specimen-actual-native';
const prep=json(stage+'/PREPARATION.json'),first=json(stage+'/MATRIX_RESULT.json');
assert.deepEqual(first.counts,{tests:3,pass:2,fail:1,cancelled:0,skipped:0,todo:0});
assert(first.sourceInputsUnchanged);assert.equal(sha(read(first.log)),first.logSha256);
assert(read(first.log).toString().includes('fatal: not a git repository'));
assert.equal(prep.sourceSite,'F:/VisibleMedicine/staging/20261021-source190-website/website');
const from=prep.sourceSite+'/.git',to=prep.site+'/.git';
assert(fs.lstatSync(from).isDirectory());assert(!fs.existsSync(to));
assert.equal(execFileSync('git',['rev-parse','HEAD'],{cwd:prep.sourceSite,windowsHide:true}).toString().trim(),'b953ff3f5f1891599cb6e91cb91311d9d6006270');
for(const row of json(prep.effectiveSnapshot))assert.equal(sha(read(prep.site+'/'+row.path)),row.sha256,row.path);
fs.symlinkSync(from,to,'junction');assert(fs.lstatSync(to).isSymbolicLink());
const object='e87f3e7fe1e50735ff9a9a9ba8c989be8bd8b26b';
const bytes=execFileSync('git',['cat-file','blob',object],{cwd:prep.site,windowsHide:true,maxBuffer:2000000,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}});
assert.equal(sha(bytes),'1d5cca6d39e99fc8aa1e8c40b7cd10c10cd2b49654314632b66f4990c17d5fea');
const receipt={at:new Date().toISOString(),from,to,firstResult:stage+'/MATRIX_RESULT.json',firstResultSha256:sha(read(stage+'/MATRIX_RESULT.json')),
 scope:'Test-harness-only object-store read context for exact cat-file and hash-object --stdin commands. No .git bytes copied, source files changed, Git write operation or application fix. Never package, upload or recursively delete this junction harness.',
 earlierSpecimenCasesPassed:2,headModuleNotExecutedInFirstRun:true,gitObject:object,assetSha256:sha(bytes)};
fs.writeFileSync(stage+'/HARNESS_GIT_CONTEXT.json',JSON.stringify(receipt,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({context:stage+'/HARNESS_GIT_CONTEXT.json',sha256:sha(read(stage+'/HARNESS_GIT_CONTEXT.json'))}));
