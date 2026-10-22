import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {mkdtempSync,mkdirSync,readFileSync,readdirSync,writeFileSync,existsSync} from 'node:fs';
import {join,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {digest,nativeCounts} from '../scripts/website-test-chunks.mjs';
import {main} from '../scripts/run-website-tests-chunked.mjs';
const stage=join(dirname(fileURLToPath(import.meta.url)),'..');
const fixtures=join(stage,'.local','main-fixtures');mkdirSync(fixtures,{recursive:true});
function root(source){const path=mkdtempSync(join(fixtures,'case-'));mkdirSync(join(path,'tests'));writeFileSync(join(path,'package.json'),'{"type":"module"}\n');writeFileSync(join(path,'tests','a.test.mjs'),source);return path;}
function native(source){const path=root(source),tap=join(path,'native.tap'),env={...process.env};delete env.NODE_TEST_CONTEXT;const run=spawnSync(process.execPath,['--test','--test-reporter=spec','--test-reporter-destination=stdout','--test-reporter=tap','--test-reporter-destination='+tap,'tests/a.test.mjs'],{cwd:path,env,encoding:'utf8',windowsHide:true});assert.equal(run.status,0,run.stderr);return{tap:readFileSync(tap,'utf8'),spec:run.stdout};}
let epoch=0;
const inspector=pid=>{if(pid===process.pid)return{state:'alive',pid,startedUtc:'main-'+epoch,executable:process.execPath,commandSha256:digest('main-'+epoch)};try{process.kill(pid,0);return{state:'alive',pid,startedUtc:'child',executable:process.execPath,commandSha256:digest('child')};}catch{return{state:'gone'};}};
test('production counter refuses summary-only or truncated native reporter evidence',()=>{
 const fakeTap='TAP version 13\n1..1\n# tests 1\n# suites 0\n# pass 1\n# fail 0\n# cancelled 0\n# skipped 0\n# todo 0\n';
 const fakeSpec='ℹ tests 1\nℹ suites 0\nℹ pass 1\nℹ fail 0\nℹ cancelled 0\nℹ skipped 0\nℹ todo 0\n';
 assert.throws(()=>nativeCounts(fakeTap,fakeSpec,{requireResults:true}),/result/i);
 const real=native("import test from 'node:test';test('complete',()=>{});\n");
 assert.equal(nativeCounts(real.tap,real.spec,{requireResults:true}).tests,1);
 assert.throws(()=>nativeCounts(real.tap.replace(/^ok 1 .*\r?\n/m,''),real.spec,{requireResults:true}),/result/i);
});
test('production counter supports multiple empty native suites alongside a passing test',()=>{
 const real=native("import{describe,it}from'node:test';describe('empty one',()=>{});describe('empty two',()=>{});it('actual case',()=>{});\n");
 assert.match(real.tap,/^1\.\.3\r?$/m);assert.match(real.tap,/^# suites 2\r?$/m);
 assert.equal(nativeCounts(real.tap,real.spec,{requireResults:true}).tests,1);
});
test('post-attempt observed preview drift is permanently recorded before a later clean guard',async()=>{
 const path=root("import test from 'node:test';test('one',()=>{});\n");
 let calls=0;const preflight=()=>({history:{synthetic:true},preview:{synthetic:true,version:++calls===3?'changed':'original'},synthetic:true});
 const prior=console.log;console.log=()=>{};let outcome;
 try{epoch++;try{outcome=await main(['--run','--root',path,'--chunk-size','1'],{preflight,inspector});}catch(error){outcome=error;}}finally{console.log=prior;}
 assert(outcome instanceof Error||outcome===1);
 const parent=join(path,'.local','website-test-chunks'),batch=join(parent,readdirSync(parent).find(name=>name.startsWith('batch-')));
 assert(existsSync(join(batch,'invalidated.json')),'observed post-attempt drift needs a permanent batch marker');
 const attemptDir=join(batch,'attempts','chunk-0000'),count=readdirSync(attemptDir).length;
 epoch++;await assert.rejects(main(['--resume',batch,'--root',path],{preflight,inspector}),/invalidated/i);
 assert.equal(readdirSync(attemptDir).length,count,'no new child after restoration');
});
