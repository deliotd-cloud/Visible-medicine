import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {validateReuseFacts,receiptPath} from './reuse-native.mjs';
import {requiredSourceChecks,deliveryPhases} from './plan.mjs';
const root='G:/VisibleMedicine-temp/proposals/20261101-focus-native-runtime';
const read=file=>JSON.parse(fs.readFileSync(file,'utf8'));
const plan=read(root+'/PLAN.json'),result=read(root+'/RESULT.json'),runtime=read(receiptPath),preflight=read(root+'/VALIDATION_PREFLIGHT.json');
const manifest=read(runtime.manifest.path),inputs=read(runtime.export+'/source-inputs.json');
const terminals=['native-build','native-export'].map(name=>read(root+'/'+name+'-TERMINAL.json'));
const expected=new Map([[runtime.manifest.path,runtime.manifest.sha256]]);
for(const row of manifest.files)expected.set(runtime.export+'/'+row.path,row.sha256);
for(const row of inputs)expected.set(plan.native.path+'/'+row.path,row.sha256);
for(const row of terminals)expected.set(root+'/'+row.name+'.log',row.logSha256);
for(const row of preflight.recipes)expected.set(row.path,row.sha256);
const lookup=file=>expected.get(file.replaceAll('\\','/'));
const fixture={plan,result,runtime,manifest,inputs,terminals,preflight,hashAt:lookup};
test('exact prior native runtime facts and command phases are reusable',()=>{
 assert.equal(validateReuseFacts(fixture).reused,true);
 assert.deepEqual(deliveryPhases,['native-types','native-build','assemble','review-build','focused-checks','full-types','full-build']);
 assert(requiredSourceChecks.includes('focus-import-binding'));
 assert(requiredSourceChecks.includes('renal-coverage-binding'));
 assert(requiredSourceChecks.includes('head-hippocampal-current-source'));
});
test('changed runtime artifact and changed source input refuse reuse',()=>{
 const artifact=runtime.export+'/'+manifest.files[0].path;
 assert.throws(()=>validateReuseFacts({...fixture,hashAt:file=>file.replaceAll('\\','/')===artifact?'0'.repeat(64):lookup(file)}));
 const source=plan.native.path+'/'+inputs[0].path;
 assert.throws(()=>validateReuseFacts({...fixture,hashAt:file=>file.replaceAll('\\','/')===source?'0'.repeat(64):lookup(file)}));
});
test('missing terminal, failed process, wrong revision and changed recipe refuse reuse',()=>{
 assert.throws(()=>validateReuseFacts({...fixture,terminals:terminals.slice(0,1)}));
 assert.throws(()=>validateReuseFacts({...fixture,result:{...result,passing:false}}));
 assert.throws(()=>validateReuseFacts({...fixture,manifest:{...manifest,sourceCommit:'0'.repeat(40)}}));
 assert.throws(()=>validateReuseFacts({...fixture,plan:{...plan,native:{...plan.native,head:'0'.repeat(40)}}}));
 const recipe=preflight.recipes[0].path;
 assert.throws(()=>validateReuseFacts({...fixture,hashAt:file=>file.replaceAll('\\','/')===recipe?'0'.repeat(64):lookup(file)}));
});
test('phase and source evidence omissions remain refused',()=>{
 const run=fs.readFileSync(new URL('./run.mjs',import.meta.url),'utf8');
 for(const phase of deliveryPhases)assert(run.includes("['"+phase+"'"));
 assert.match(run,/assert\.deepEqual\(jobs\.map\(row=>row\[0\]\),deliveryPhases/);
 assert.match(run,/if\(name==='native-build'&&reuse\)/);
 assert.match(run,/VM_CATALOG_NATIVE_REUSE/);
});
