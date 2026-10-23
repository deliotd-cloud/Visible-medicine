import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync,spawnSync} from 'node:child_process';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {join} from 'node:path';
import {restoreKeyboardTeachingRole} from './keyboard-teaching-source-role.mjs';
import {restorePlaybackPreservationConsumer} from './tour-playback-role-inverse.mjs';
import {currentAtlasDeliveryRoot,CURRENT_ATLAS_REVISION,validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';

const root=fileURLToPath(new URL('../',import.meta.url)),read=p=>fs.readFileSync(join(root,p));
const sha=b=>createHash('sha256').update(b).digest('hex');
const original='tests/fixtures/keyboard-teaching-role-before/';
const target='tests/atlas-label-keyboard.test.ts';
const helperImport="import {restoreKeyboardTeachingRole} from './keyboard-teaching-source-role.mjs';\n";
const contracts={
 'tests/atlas-label-keyboard-epoch.test.mjs':{
  sha:'b49e4ec3eceee4d88d577055d70b406474cbf2f2d76b725e2c3c81c05a60427a',
  from:' let inverse=restoreKeyboardTeachingRole(read(target)).toString();',
  to:' let inverse=read(target).toString();'},
 'tests/release-epoch-composition-preservation.test.mjs':{
  sha:'c83a412e19c1fc20be054320af5cb166dbbcc828c2af47d4d8f490a383d023fe',
  from:"function inverse(row,bytes){if(row.path==='tests/atlas-label-keyboard.test.ts')bytes=restoreKeyboardTeachingRole(bytes);",
  to:'function inverse(row,bytes){'},
};
function restoreConsumer(path,bytes){
 if(path==='tests/release-epoch-composition-preservation.test.mjs')bytes=restorePlaybackPreservationConsumer(bytes);
 const row=contracts[path];assert(row,'Explicit consumer only');let text=bytes.toString();
 for(const [from,to] of [[helperImport,''],[row.from,row.to]]){
  assert.equal(text.split(from).length,2,'Unique declared seam: '+path);text=text.replace(from,to);
 }
 const restored=Buffer.from(text);assert.equal(sha(restored),row.sha,'Complete consumer inverse: '+path);return restored;
}

test('all three complete previous test sources survive only their declared source-role seams',()=>{
 const previous=read(original+'atlas-label-keyboard.test.ts.raw');
 assert.equal(sha(previous),'928e48406373c864c961cd87b1146b749a6ef403ac8de509dedc883c5b320515');
 assert.deepEqual(restoreKeyboardTeachingRole(read(target)),previous);
 for(const [path,row] of Object.entries(contracts)){
  const before=read(original+path.slice('tests/'.length)+'.raw');assert.equal(sha(before),row.sha);
  assert.deepEqual(restoreConsumer(path,read(path)),before);
 }
});

test('missing, duplicate, altered, foreign or removed source assertions cannot be admitted',()=>{
 const bytes=read(target),text=bytes.toString(),name='ae84KeyboardSource.revisions[id].teaching';
 const changed=[text.replace(name,'foreignSource.revisions[id].teaching'),text+text,
  text+'\n// unknown edit\n',text.replace('assert.equal(source.sourceRevisions[id].teaching,committed.revisions[id].teaching);',''),
  text.replace('b0fea14f4dcc531cb8f39f98c1eb9b426831cc778c443f1fc3df63d68039afe2','0'.repeat(64))];
 for(const bad of changed)assert.throws(()=>restoreKeyboardTeachingRole(Buffer.from(bad)));
 const malformed=Buffer.from(bytes);malformed[0]=255;assert.throws(()=>restoreKeyboardTeachingRole(malformed));
 for(const path of Object.keys(contracts)){
  const current=read(path);assert.throws(()=>restoreConsumer(path,Buffer.concat([current,Buffer.from('// foreign')])));
  assert.throws(()=>restoreConsumer(path,Buffer.from(current.toString().replace(helperImport,''))));
 }
 assert.throws(()=>restoreConsumer('tests/foreign.mjs',bytes));
});

test('old teaching literal is authentic ae84 history and current teaching remains bound to its exact source',()=>{
 const atlas=currentAtlasDeliveryRoot(),id='vm:anatomy:upper-limb:shoulder:right:bone:scapula';
 const git=c=>JSON.parse(execFileSync('git',['show',c+':content/review-revisions.json'],{cwd:atlas,windowsHide:true,maxBuffer:4e6}));
 const before=git('6d7a356ae949e13f2ff4bf1fec610ee6ae7762c1'),current=git(CURRENT_ATLAS_REVISION);
 const packet=JSON.parse(read('atlas-review/content/review-revisions.json')),pin=validateCurrentAtlasDelivery();
 assert.equal(before.revisions[id].teaching,'b0fea14f4dcc531cb8f39f98c1eb9b426831cc778c443f1fc3df63d68039afe2');
 assert.notEqual(current.revisions[id].teaching,before.revisions[id].teaching,'Later teaching is not misrepresented as unchanged');
 assert.equal(packet.sourceRevisions[id].teaching,current.revisions[id].teaching);
 assert.equal(packet.revisions[id].teaching,sha(JSON.stringify({source:current.revisions[id].teaching,website:pin.reviewIntegration})));
});

test('the actual native protected Review keyboard case rejects forged current teaching',()=>{
 const local=join(root,'.local');fs.mkdirSync(local,{recursive:true});const evidence=fs.mkdtempSync(join(local,'keyboard-teaching-role-refusal-'));
 const preload=join(evidence,'forge-review-teaching.mjs'),id='vm:anatomy:upper-limb:shoulder:right:bone:scapula';
 fs.writeFileSync(preload,`import fs from 'node:fs';import {syncBuiltinESMExports} from 'node:module';import {resolve} from 'node:path';import {fileURLToPath} from 'node:url';
const original=fs.readFileSync,target=resolve('atlas-review/content/review-revisions.json');
fs.readFileSync=function(p,options){const bytes=original.apply(this,arguments);const key=p instanceof URL?fileURLToPath(p):typeof p==='string'?p:null;
if(!key||resolve(key)!==target)return bytes;const value=JSON.parse(bytes.toString());value.sourceRevisions[${JSON.stringify(id)}].teaching='0'.repeat(64);
const output=Buffer.from(JSON.stringify(value)),encoding=typeof options==='string'?options:options?.encoding;return encoding?output.toString(encoding):output;};syncBuiltinESMExports();\n`,{flag:'wx'});
 const args=['--max-old-space-size=256','--import',pathToFileURL(preload).href,'--experimental-strip-types','--test','--test-reporter=tap','--test-name-pattern=^protected Review uses the same keyboard source',target];
 const environment={...process.env};delete environment.NODE_TEST_CONTEXT;
 const result=spawnSync(process.execPath,args,{cwd:root,env:environment,encoding:'utf8',windowsHide:true,maxBuffer:4e6});
 const log=(result.stdout??'')+(result.stderr??'');fs.writeFileSync(join(evidence,'child.tap'),log,{flag:'wx'});
 assert.equal(result.error,undefined);assert.equal(result.status,1,log);
 assert.match(log,/not ok \d+ - protected Review uses the same keyboard source/);assert(log.includes('0'.repeat(64)));
 assert.match(log,/^# fail 1$/m);assert.match(log,/^# pass 0$/m);assert.match(log,/^# cancelled 0$/m);
 fs.writeFileSync(join(evidence,'RESULT.json'),JSON.stringify({args,exitCode:result.status,expectedRefusal:true,logSha256:sha(Buffer.from(log)),productFilesEdited:false},null,2)+'\n',{flag:'wx'});
 assert.notEqual(JSON.parse(read('atlas-review/content/review-revisions.json')).sourceRevisions[id].teaching,'0'.repeat(64));
});
