import fs from 'node:fs';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {hash,json} from './bounded-source-hash-20261026.mjs';
const nativeFile='F:/VisibleMedicine/staging/20261027-find-keyboard-native/SOURCE_CANDIDATE.json';
const buildFile='F:/VisibleMedicine/staging/20261027-find-keyboard-native/BUILD_VERIFIED.json';
assert.equal(hash(nativeFile),'0b88d1a7dfd69c5c96d137e103fe95900c7c11c9d445a3b1e289eb842b7fec16');
assert.equal(hash(buildFile),'0ad8acb8bcb0f216b8a4331adea13fa5df525c814ed15b9aa5d6528e59a12b7c');
assert(json(buildFile).passing); assert.deepEqual(json('CURRENT_CHECKPOINT.json').activeWork.current.activeExecutionSessions,[]);
const pairs=[['20261027-tour-step-native','20261027-find-keyboard-native'],['20261027-tour-step-runtime-exports','20261027-find-keyboard-runtime-exports'],['20261027-scene-study-runtime-exports','20261027-tour-step-runtime-exports'],['10ddf4f58a23f6eea111c09fb5ed4c132c96a46af1a4d5b6bdc72ae0caf797a4',hash(nativeFile)],['66f07b081a7d448af7d155a532169e72f4be9b52e073505860f3149485c8baf4',hash(buildFile)],['pendingTourStepEntry','pendingFindKeyboard'],['tour-step-runtime-export','find-keyboard-runtime-export'],['export-tour-step-runtimes-20261027.mjs','export-find-keyboard-runtimes-20261027.mjs']];
const records=[];
for(const name of ['export-tour-step-runtimes','run-tour-step-runtime-exports']){
 const from=name+'-20261027.mjs',to=name.replace('tour-step','find-keyboard')+'-20261027.mjs';let s=fs.readFileSync(from,'utf8');
 for(let i=0;i<pairs.length;i++)s=s.replaceAll(pairs[i][0],'___KEYBOARD_'+i+'___');
 for(let i=0;i<pairs.length;i++)s=s.replaceAll('___KEYBOARD_'+i+'___',pairs[i][1]);
 fs.writeFileSync(to,s,{flag:'wx'});execFileSync(process.execPath,['--check',to],{windowsHide:true});records.push({from,fromSha256:hash(from),to,toSha256:hash(to)});
}
console.log(JSON.stringify({prepared:records,nativeHead:json(nativeFile).head}));
