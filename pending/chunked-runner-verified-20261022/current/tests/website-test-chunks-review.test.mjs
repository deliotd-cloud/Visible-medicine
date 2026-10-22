import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {mkdtempSync,mkdirSync,readFileSync,readdirSync,writeFileSync} from 'node:fs';
import {join,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {digest,nativeCounts,reusableCounts} from '../scripts/website-test-chunks.mjs';
import {main} from '../scripts/run-website-tests-chunked.mjs';

const stage=join(dirname(fileURLToPath(import.meta.url)),'..');
const fixtures=join(stage,'.local','review-fixtures');
mkdirSync(fixtures,{recursive:true});
let epoch=0;
const identity=pid=>{
  if(pid===process.pid)return {state:'alive',pid,startedUtc:`review-${epoch}`,executable:process.execPath,commandSha256:digest(`review-${epoch}`)};
  try{process.kill(pid,0);return {state:'alive',pid,startedUtc:'review-child',executable:process.execPath,commandSha256:digest('review-child')};}
  catch{return {state:'gone'};}
};
function root(files){
  const path=mkdtempSync(join(fixtures,'case-'));mkdirSync(join(path,'tests'));
  writeFileSync(join(path,'package.json'),'{"type":"module"}\n');
  for(const [name,source] of Object.entries(files))writeFileSync(join(path,'tests',name),source);
  return path;
}
function native(source){
  const path=root({'nested.test.mjs':source});
  const tap=join(path,'native.tap');
  const env={...process.env,NODE_OPTIONS:'--max-old-space-size=256'};
  delete env.NODE_TEST_CONTEXT;
  const run=spawnSync(process.execPath,['--test','--test-reporter=spec','--test-reporter-destination=stdout',
    '--test-reporter=tap',`--test-reporter-destination=${tap}`,'tests/nested.test.mjs'],
    {cwd:path,encoding:'utf8',env});
  assert.equal(run.status,0,run.stderr||run.stdout);
  return {tap:readFileSync(tap,'utf8'),spec:run.stdout};
}
function attempts(batch){
  return readdirSync(join(batch,'attempts','chunk-0000')).filter(name=>name.startsWith('attempt-'));
}
async function captured(args,preflight){
  const prior=console.log;let output;
  console.log=value=>{output=JSON.parse(value);};
  try{const code=await main(args,{preflight,inspector:identity});return {code,...output};}
  finally{console.log=prior;}
}
const synthetic=()=>({history:{synthetic:true},preview:{synthetic:true},synthetic:true});

test('real nested test() TAP accepts top-level plan and native totals',()=>{
  const evidence=native("import test from 'node:test';test('parent',async t=>{await t.test('one',()=>{});await t.test('two',()=>{});});\n");
  assert.match(evidence.tap,/^1\.\.1$/m);
  const counts=nativeCounts(evidence.tap,evidence.spec);
  assert.equal(counts.tests,3);assert.equal(counts.pass,3);
  assert.equal(reusableCounts(counts,0,null),true);
  assert.throws(()=>nativeCounts(evidence.tap.replace(/^1\.\.1$/m,'1..2'),evidence.spec),/plan/i);
  assert.throws(()=>nativeCounts(evidence.tap.replace(/^ok 1 - parent/m,'ok 2 - parent'),evidence.spec),/sequence/i);
});

test('real describe() suite TAP accepts top-level plan and native totals',()=>{
  const evidence=native("import {describe,it} from 'node:test';describe('group',()=>{it('one',()=>{});it('two',()=>{});});\n");
  const counts=nativeCounts(evidence.tap,evidence.spec);
  assert.equal(counts.tests,2);assert.equal(counts.pass,2);
  assert.equal(reusableCounts(counts,0,null),true);
});

test('observed source drift permanently invalidates a paused batch',async()=>{
  const path=root({'a.test.mjs':"import test from 'node:test';test('one',()=>{});\n"});
  epoch++;const first=await captured(['--run','--root',path,'--chunk-size','1','--stop-after','1'],synthetic);
  assert.equal(first.code,2);
  const original=readFileSync(join(path,'tests','a.test.mjs'));
  const priorAttempts=attempts(first.batch).length;
  writeFileSync(join(path,'tests','a.test.mjs'),Buffer.concat([original,Buffer.from('// drift\n')]));
  epoch++;await assert.rejects(captured(['--resume',first.batch,'--root',path],synthetic),/inventory|source/i);
  const marker=JSON.parse(readFileSync(join(first.batch,'invalidated.json')));
  assert.equal(marker.schema,'vm-chunked-batch-invalidation/1');assert.equal(marker.batchId,first.batch.split(/[\\/]/).at(-1));
  writeFileSync(join(path,'tests','a.test.mjs'),original);
  epoch++;await assert.rejects(captured(['--resume',first.batch,'--root',path],synthetic),/invalidated/i);
  assert.equal(attempts(first.batch).length,priorAttempts);
});

test('observed preview drift and failed preflight permanently invalidate separate batches',async()=>{
  for(const failure of ['changed-preview','preflight-refusal']){
    const path=root({'a.test.mjs':"import test from 'node:test';test('one',()=>{});\n"});
    let state='original';
    const preflight=()=>{
      if(state==='refused')throw Error('Synthetic preview preflight refused');
      return {history:{synthetic:true},preview:{synthetic:true,version:state},synthetic:true};
    };
    epoch++;const first=await captured(['--run','--root',path,'--chunk-size','1','--stop-after','1'],preflight);
    assert.equal(first.code,2);
    const priorAttempts=attempts(first.batch).length;
    state=failure==='changed-preview'?'changed':'refused';
    epoch++;await assert.rejects(captured(['--resume',first.batch,'--root',path],preflight));
    assert.equal(JSON.parse(readFileSync(join(first.batch,'invalidated.json'))).schema,'vm-chunked-batch-invalidation/1');
    state='original';
    epoch++;await assert.rejects(captured(['--resume',first.batch,'--root',path],preflight),/invalidated/i);
    assert.equal(attempts(first.batch).length,priorAttempts);
  }
});
