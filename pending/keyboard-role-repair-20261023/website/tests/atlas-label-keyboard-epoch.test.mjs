import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync,spawnSync} from 'node:child_process';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {join} from 'node:path';
import {CURRENT_ATLAS_REVISION,currentAtlasDeliveryRoot} from './current-atlas-delivery.mjs';
import {restoreKeyboardTeachingRole} from './keyboard-teaching-source-role.mjs';

const root=fileURLToPath(new URL('../',import.meta.url)),read=p=>fs.readFileSync(join(root,p)),sha=b=>createHash('sha256').update(b).digest('hex');
const target='tests/atlas-label-keyboard.test.ts',scapula='vm:anatomy:upper-limb:shoulder:right:bone:scapula';
const historical='6d7a356ae949e13f2ff4bf1fec610ee6ae7762c1';

test('complete original keyboard test survives only the declared old-source role correction',()=>{
 let inverse=restoreKeyboardTeachingRole(read(target)).toString();
 const once=(from,to)=>{assert.equal(inverse.split(from).length,2);inverse=inverse.replace(from,to);};
 once(" const ae84KeyboardSource=JSON.parse(sourceBytes('6d7a356ae949e13f2ff4bf1fec610ee6ae7762c1','content/review-revisions.json').toString());\n",'');
 once('assert.equal(ae84KeyboardSource.revisions[id].geometry,','assert.equal(source.sourceRevisions[id].geometry,');
 once('Original ae84 shoulder display geometry remains pinned at its immutable source','Current shoulder display geometry follows committed Atlas source');
 assert.equal(sha(inverse),'34e80eada4c9163021072db22f2a3978c231e0ffbe61e408cc1540835143e4c9',
  'Every original runtime, source, prior epoch, model-manifest and Review-binding assertion stays exact');
});

test('old literal is authentic history and current Review geometry matches the exact committed source',()=>{
 const atlas=currentAtlasDeliveryRoot();
 const git=commit=>JSON.parse(execFileSync('git',['show',commit+':content/review-revisions.json'],{cwd:atlas,windowsHide:true,maxBuffer:4*1024*1024}));
 const old=git(historical),current=git(CURRENT_ATLAS_REVISION),packet=JSON.parse(read('atlas-review/content/review-revisions.json'));
 assert.equal(old.revisions[scapula].geometry,'00067d00809923231bb91f559c1f8e737c6e6a36d1259c9584ee7880e79eae54');
 assert.equal(packet.sourceRevisions[scapula].geometry,current.revisions[scapula].geometry);
});

test('actual protected Review keyboard test refuses forged current geometry',()=>{
 const local=join(root,'.local');fs.mkdirSync(local,{recursive:true});const evidence=fs.mkdtempSync(join(local,'keyboard-epoch-refusal-'));
 const preload=join(evidence,'forge-review-geometry.mjs');
 fs.writeFileSync(preload,`import fs from 'node:fs';import {syncBuiltinESMExports} from 'node:module';import {resolve} from 'node:path';import {fileURLToPath} from 'node:url';
const original=fs.readFileSync,target=resolve('atlas-review/content/review-revisions.json');
fs.readFileSync=function(p,options){const bytes=original.apply(this,arguments);const key=p instanceof URL?fileURLToPath(p):typeof p==='string'?p:null;
if(!key||resolve(key)!==target)return bytes;const value=JSON.parse(bytes.toString());value.sourceRevisions[${JSON.stringify(scapula)}].geometry='0'.repeat(64);
const result=Buffer.from(JSON.stringify(value)),encoding=typeof options==='string'?options:options?.encoding;return encoding?result.toString(encoding):result;};syncBuiltinESMExports();\n`,{flag:'wx'});
 const args=['--import',pathToFileURL(preload).href,'--test','--test-reporter=tap','--test-name-pattern=^protected Review uses the same keyboard source','tests/atlas-label-keyboard.test.ts'];
 // Node's internal worker marker must not turn an independent native child
 // into a recursive run() call; retain the actual source and resource bounds.
 const environment={...process.env};delete environment.NODE_TEST_CONTEXT;
 const result=spawnSync(process.execPath,args,{cwd:root,env:environment,encoding:'utf8',windowsHide:true,maxBuffer:4*1024*1024});
 const log=(result.stdout??'')+(result.stderr??'');fs.writeFileSync(join(evidence,'child.tap'),log,{flag:'wx'});
 assert.equal(result.error,undefined);assert.equal(result.status,1,log);assert.match(log,/not ok \d+ - protected Review uses the same keyboard source/);
 assert(log.includes('0'.repeat(64)));assert.match(log,/^# fail 1$/m);assert.match(log,/^# pass 0$/m);assert.match(log,/^# cancelled 0$/m);
 const reportedSkipped=Number(log.match(/^# skipped (\d+)$/m)?.[1]),reportedTests=Number(log.match(/^# tests (\d+)$/m)?.[1]);
 // Native Node versions may omit unmatched names or report them skipped.
 assert([0,1].includes(reportedSkipped));assert.equal(reportedTests,1+reportedSkipped);
 fs.writeFileSync(join(evidence,'RESULT.json'),JSON.stringify({args,exitCode:result.status,expectedRefusal:true,unrelatedRuntimeCaseDeliberatelyUnexecuted:1,reportedSkipped,reportedTests,productFilesEdited:false,logSha256:sha(Buffer.from(log))},null,2)+'\n',{flag:'wx'});
 assert(!JSON.parse(read('atlas-review/content/review-revisions.json')).sourceRevisions[scapula].geometry.startsWith('00000000'));
 console.log('Forged current geometry refusal evidence: '+evidence);
});
