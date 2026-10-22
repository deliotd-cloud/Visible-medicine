import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,readFileSync,readdirSync,writeFileSync,appendFileSync,rmSync} from 'node:fs';
import {join,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {partitionRoots,nativeCounts,reusableCounts,assertRootCoverage,WINDOWS_COMMAND_BUDGET,digest} from '../scripts/website-test-chunks.mjs';
import {assertInactive} from '../scripts/website-test-process.mjs';
import {main} from '../scripts/run-website-tests-chunked.mjs';

const stage=join(dirname(fileURLToPath(import.meta.url)),'..');
const fixtures=join(stage,'.local','chunked-synthetic');
mkdirSync(fixtures,{recursive:true});
const synthetic=()=>({history:{synthetic:true},preview:{synthetic:true},synthetic:true});
let epoch=0;
const identity=pid=>{
  if(pid===process.pid)return {state:'alive',pid,startedUtc:`synthetic-runner-${epoch}`,executable:process.execPath,commandSha256:digest(`runner-${epoch}`)};
  try{process.kill(pid,0);return {state:'alive',pid,startedUtc:'synthetic-child',executable:process.execPath,commandSha256:digest('synthetic-child')};}
  catch{return {state:'gone'};}
};
function root(files){
  const path=mkdtempSync(join(fixtures,'case-'));mkdirSync(join(path,'tests'));
  writeFileSync(join(path,'package.json'),'{"type":"module"}\n');
  for(const [name,source] of Object.entries(files))writeFileSync(join(path,'tests',name),source);
  return path;
}
async function captured(args,inspector=identity){
  const prior=console.log;let output;
  console.log=value=>{output=JSON.parse(value);};
  try{const code=await main(args,{preflight:synthetic,inspector});return {code,...output};}
  finally{console.log=prior;}
}
const attempts=(batch,index)=>readdirSync(join(batch,'attempts',`chunk-${String(index).padStart(4,'0')}`)).filter(x=>x.startsWith('attempt-')).sort();
const receipt=(batch,index,name)=>JSON.parse(readFileSync(join(batch,'attempts',`chunk-${String(index).padStart(4,'0')}`,name,'receipt.json')));

test('stock default source reconstructs exactly and full direct-root partition is disjoint',()=>{
  const original=readFileSync('F:/VisibleMedicine/staging/20261022-release-diagnostic-successor/website/scripts/run-website-tests.mjs','utf8');
  const defaultStaged=readFileSync(join(stage,'scripts','run-website-tests.mjs'),'utf8');
  const staged=readFileSync(join(stage,'scripts','stock-website-test-inventory.mjs'),'utf8');
  assert.equal(digest(original),'9dc062a40d1a92c45c4d0d45ab02957b4f54a32af9d96f9e84ce06601d828a7a');
  assert.equal(defaultStaged,original);
  assert.equal(staged.replace(/export \{ inventory \};\n?$/,''),original);
  const entries=['tests/a.test.ts','tests/b.test.mjs','tests/c.test.ts'];
  const execution={executedRoots:[...entries],coveredByImport:[],mirror:{active:false}};
  assert.deepEqual(assertRootCoverage(entries,execution),entries);
  const chunks=partitionRoots(entries,{chunkSize:2,executable:process.execPath,makeArgs:roots=>['--test',...roots]});
  assert.deepEqual(chunks,[entries.slice(0,2),entries.slice(2)]);
  assert.equal(new Set(chunks.flat()).size,entries.length);
  assert.throws(()=>partitionRoots(entries,{chunkSize:2,executable:process.execPath,budget:8,makeArgs:roots=>['--test',...roots]}));
  assert.equal(WINDOWS_COMMAND_BUDGET,24000);
  assert.throws(()=>assertRootCoverage(entries,{...execution,executedRoots:entries.slice(1)}));
});
test('native summaries refuse skip, todo, cancellation, missing terminal and inconsistent reporters',()=>{
  const tap='TAP version 13\n1..1\n# tests 1\n# pass 1\n# fail 0\n# cancelled 0\n# skipped 0\n# todo 0\n';
  const spec='ℹ tests 1\nℹ pass 1\nℹ fail 0\nℹ cancelled 0\nℹ skipped 0\nℹ todo 0\n';
  assert.equal(nativeCounts(tap,spec).pass,1);
  for(const changed of [tap.replace('# skipped 0','# skipped 1'),tap.replace('1..1',''),tap.replace('# tests 1','# tests 2')])
    assert.throws(()=>nativeCounts(changed,spec));
  assert.throws(()=>nativeCounts(tap,spec.replace('ℹ pass 1','ℹ pass 0')));
  assert.equal(reusableCounts({tests:0,pass:0,fail:0,cancelled:0,skipped:0,todo:0},0,null),false);
  assert.equal(reusableCounts({tests:1,pass:0,fail:0,cancelled:1,skipped:0,todo:0},0,null),false);
});
test('active and unknown process identities refuse resume; verified PID reuse is not the old process',()=>{
  const old={pid:123,startedUtc:'old',executable:'node',commandSha256:'x'};
  assert.throws(()=>assertInactive(old,()=>({state:'alive',...old})));
  assert.throws(()=>assertInactive(old,()=>({state:'unknown'})));
  assert.doesNotThrow(()=>assertInactive(old,()=>({state:'gone'})));
  assert.doesNotThrow(()=>assertInactive(old,()=>({state:'alive',...old,startedUtc:'new'})));
});
test('real native child pauses, interruption is retained, then resume selects only complete passes',async()=>{
  const path=root({
    'a.test.mjs':"import test from 'node:test';test('first',()=>{});\n",
    'b.test.mjs':"import test from 'node:test';import{existsSync,writeFileSync}from'node:fs';if(!existsSync('.local/interrupt-once')){writeFileSync('.local/interrupt-once','1');process.kill(process.pid,'SIGTERM');}test('second',()=>{});\n",
  });
  epoch++;const first=await captured(['--run','--root',path,'--chunk-size','1','--stop-after','1']);
  assert.equal(first.code,2);assert.equal(first.selectedChunks,1);assert.equal(first.compositePassingClaim,false);
  epoch++;const second=await captured(['--resume',first.batch,'--root',path]);
  assert.equal(second.code,1);assert.equal(second.selectedChunks,1);
  const failedName=attempts(first.batch,1)[0],failed=receipt(first.batch,1,failedName);
  assert.equal(failed.reusable,false);assert(failed.exitCode!==0||failed.signal!==null);
  epoch++;const final=await captured(['--resume',first.batch,'--root',path]);
  assert.equal(final.code,0);assert.equal(final.compositePassingClaim,true);
  assert.deepEqual(final.counts,{tests:2,pass:2,fail:0,cancelled:0,skipped:0,todo:0});
  assert.equal(attempts(first.batch,0).length,1);assert.equal(attempts(first.batch,1).length,2);
  assert.equal(receipt(first.batch,1,failedName).reusable,false,'Old failed receipt remains');
});
test('source, plan, receipt, raw log and foreign-path edits refuse reuse',async()=>{
  for(const kind of ['source','plan','receipt','missing-receipt','log','foreign']){
    const path=root({'a.test.mjs':"import test from 'node:test';test('one',()=>{});\n"});
    epoch++;const first=await captured(['--run','--root',path,'--chunk-size','1','--stop-after','1']);
    assert.equal(first.code,2);
    const name=attempts(first.batch,0)[0],dir=join(first.batch,'attempts','chunk-0000',name);
    if(kind==='source')appendFileSync(join(path,'tests','a.test.mjs'),'// changed\n');
    if(kind==='plan')appendFileSync(join(first.batch,'plan.json'),' ');
    if(kind==='receipt')appendFileSync(join(dir,'receipt.json'),' ');
    if(kind==='missing-receipt')rmSync(join(dir,'receipt.json'));
    if(kind==='log')appendFileSync(join(dir,'child.tap'),'# tampered\n');
    if(kind==='foreign')mkdirSync(join(first.batch,'attempts','chunk-0000','foreign'));
    epoch++;await assert.rejects(captured(['--resume',first.batch,'--root',path]),undefined,kind);
  }
});
test('preview and exact argv drift refuse cached passes',async()=>{
  const path=root({'a.test.mjs':"import test from 'node:test';test('one',()=>{});\n"});
  let version=1;
  const preflight=()=>({history:{synthetic:true},preview:{synthetic:true,version},synthetic:true});
  const prior=console.log;console.log=()=>{};
  epoch++;let first;try{first=await main(['--run','--root',path,'--chunk-size','1','--stop-after','1'],{preflight,inspector:identity});}finally{console.log=prior;}
  assert.equal(first,2);
  const batchDir=join(path,'.local','website-test-chunks');const batch=join(batchDir,readdirSync(batchDir).find(x=>x.startsWith('batch-')));
  version=2;epoch++;
  await assert.rejects(main(['--resume',batch,'--root',path],{preflight,inspector:identity}),/preview|inventory|identity/i);
  version=1;
  const name=attempts(batch,0)[0],dir=join(batch,'attempts','chunk-0000',name);
  const receiptPath=join(dir,'receipt.json'),anchorPath=join(dir,'receipt.anchor.json');
  const receiptValue=JSON.parse(readFileSync(receiptPath));receiptValue.args.push('tests/foreign.test.mjs');
  const {seal}=await import('../scripts/website-test-chunks.mjs');receiptValue.seal=seal(receiptValue);
  writeFileSync(receiptPath,JSON.stringify(receiptValue,null,2)+'\n');
  const anchor=JSON.parse(readFileSync(anchorPath));anchor.receiptSha256=digest(readFileSync(receiptPath));anchor.seal=seal(anchor);
  writeFileSync(anchorPath,JSON.stringify(anchor,null,2)+'\n');
  epoch++;await assert.rejects(main(['--resume',batch,'--root',path],{preflight,inspector:identity}));
});
test('nonzero, skipped and todo native attempts are never reused as passing',async()=>{
  for(const [label,source] of [
    ['fail',"import test from 'node:test';test('failure',()=>{throw Error('synthetic')});\n"],
    ['skip',"import test from 'node:test';test.skip('skipped',()=>{});\n"],
    ['todo',"import test from 'node:test';test.todo('todo',()=>{});\n"],
  ]){
    const path=root({'a.test.mjs':source});
    epoch++;const first=await captured(['--run','--root',path,'--chunk-size','1']);
    assert.equal(first.code,1,label);assert.equal(first.compositePassingClaim,false,label);
    const oldName=attempts(first.batch,0)[0];assert.equal(receipt(first.batch,0,oldName).reusable,false,label);
    epoch++;const second=await captured(['--resume',first.batch,'--root',path]);
    assert.equal(second.code,1,label);assert.equal(attempts(first.batch,0).length,2,label);
  }
});
test('missing terminal attempt is retried only after active and unknown PID refusals',async()=>{
  const path=root({'a.test.mjs':"import test from 'node:test';test('one',()=>{});\n"});
  epoch++;const first=await captured(['--run','--root',path,'--chunk-size','1','--stop-after','1']);
  assert.equal(first.code,2);
  const name=attempts(first.batch,0)[0],dir=join(first.batch,'attempts','chunk-0000',name);
  rmSync(join(dir,'receipt.json'));rmSync(join(dir,'receipt.anchor.json'));
  await assert.rejects(captured(['--resume',first.batch,'--root',path]),/active/i);
  epoch++;
  const uncertain=pid=>pid===process.pid?identity(pid):{state:'unknown'};
  await assert.rejects(captured(['--resume',first.batch,'--root',path],uncertain),/unknown/i);
  epoch++;const resumed=await captured(['--resume',first.batch,'--root',path]);
  assert.equal(resumed.code,0);assert.equal(attempts(first.batch,0).length,2);
  assert.equal(resumed.counts.tests,1,'Only the complete new receipt contributes counts');
});
