import assert from 'node:assert/strict';
import test from 'node:test';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import {checkedAtlasHistoryRepo} from './atlas-source-repo.mjs';
import {validateCurrentAtlasDelivery as validateDelivery} from './current-atlas-delivery.mjs';
import {assertHistoricalShoulderSourceRole} from './historical-shoulder-source-role.mjs';
import {restoreShoulderCurrentRole} from './shoulder-current-role-inverse.mjs';

const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const historical='190a63238eadcf906abe89dcbb6a67c88afe70b9';
const historicalTree='c314f1cbfa394caed4c6874864fda7dea0a3286c';
const fixture=new URL('./fixtures/renal-epoch-preimage/shoulder-190a-source-inputs.json.raw',import.meta.url);
const git=(root,args)=>execFileSync('git',args,{cwd:root,windowsHide:true,maxBuffer:64e6,
 env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}});

const b79Stage='F:/VisibleMedicine/staging/20261024-cervical-vascular-website';
const b79Site=b79Stage+'/website',b79Root=b79Stage+'/atlas';
function validateCurrentAtlasDelivery(){
 const receiptBytes=readFileSync(b79Stage+'/SOURCE_BOUND.json');
 assert.equal(sha(receiptBytes),'d2c288a5be7b54dda220a0f539e72c15988f63543124323c5b08c60533950df2');
 const receipt=JSON.parse(receiptBytes);
 assert.equal(receipt.atlasHead,'b79e110d2d28f18993263926ba35aa7a3f478b20');
 assert.equal(receipt.atlasTree,'0dd97cc55ef9aff3493b91752309d1d661c0b0c8');
 const pinPath='tests/fixtures/current-atlas-delivery.json';
 const pinBytes=readFileSync(b79Site+'/'+pinPath);
 assert.equal(sha(pinBytes),receipt.sourceRows.find(row=>row.path===pinPath)?.sha256);
 return validateDelivery({pin:JSON.parse(pinBytes),root:b79Site,
  read:path=>readFileSync(b79Site+'/'+path)});
}
function checkedB79HistoryRepo(revision){
 checkedAtlasHistoryRepo(revision);
 assert.equal(git(b79Root,['rev-parse','HEAD']).toString().trim(),'b79e110d2d28f18993263926ba35aa7a3f478b20');
 assert.equal(git(b79Root,['rev-parse','HEAD^{tree}']).toString().trim(),'0dd97cc55ef9aff3493b91752309d1d661c0b0c8');
 assert.equal(git(b79Root,['status','--porcelain']).toString().trim(),'');
 return b79Root;
}

test('authenticated 190a shoulder role remains separate from exact b79 delivery',()=>{
 const current=validateCurrentAtlasDelivery();
 assert.equal(assertHistoricalShoulderSourceRole(current),historical);
 const root=checkedB79HistoryRepo(historical);
 assert.equal(git(root,['rev-parse',`${historical}^{tree}`]).toString().trim(),historicalTree);
 assert.equal(git(root,['merge-base',historical,current.source]).toString().trim(),historical);
 assert.equal(git(root,['rev-parse','HEAD']).toString().trim(),current.source);
 const changed=structuredClone(current);changed.runtimeSources.shoulder=historical;
 assert.throws(()=>assertHistoricalShoulderSourceRole(changed),/Current shoulder runtime/);
 const bytes=readFileSync(fixture),altered=Buffer.from(bytes);
 altered[0]^=1;
 assert.throws(()=>assertHistoricalShoulderSourceRole(current,{inputsBytes:altered}),/Historical source inventory fixture/);
});

test('every historical shoulder input matches the independent 190a Git source',()=>{
 const root=checkedB79HistoryRepo(historical);
 const rows=JSON.parse(readFileSync(fixture));
 assert.equal(rows.length,1120);
 const paths=new Set();
 for(const row of rows){
  assert.match(row.path,/^[^\\]+$/);
  assert(!row.path.startsWith('/')&&!row.path.split('/').some(part=>!part||part==='.'||part==='..'));
  assert(!paths.has(row.path),`Duplicate historical source: ${row.path}`);paths.add(row.path);
  assert.match(row.sha256,/^[a-f0-9]{64}$/);
  assert.equal(sha(git(root,['show',`${historical}:${row.path}`])),row.sha256,row.path);
 }
 assert.equal(paths.has('lib/regional-tours.ts'),false);
});

test('both current shoulder seams restore exact parent consumers and reject mutations',()=>{
 for(const [name,prior] of [
  ['clinical-review-elbow-us-followup.test.ts','8c52a386cff7675adf9862592386e28e4167d6e389f7b8a9c1780190e47fbe40'],
  ['clinical-review-forearm-vascular-xray.test.ts','03a72a733f624b619737793d7bac519a5e9c2fef47f849be2481ac01f33a88d4'],
 ]){
  const current=readFileSync(new URL(name,import.meta.url));
  const restored=restoreShoulderCurrentRole(name,current);
  const original=readFileSync(new URL(`./fixtures/adjacent-b79-preimage/${name}.raw`,import.meta.url));
  assert.equal(sha(restored),prior);
  assert.deepEqual(restored,original,`${name}: entire parent body and refusal checks survive`);
  const altered=Buffer.from(current);altered[altered.length-1]^=1;
  assert.throws(()=>restoreShoulderCurrentRole(name,altered),/Exact current shoulder consumer/);
 }
 assert.throws(()=>restoreShoulderCurrentRole('undeclared.test.ts',Buffer.alloc(0)),/Declared shoulder consumer/);
});

test('source-role helpers are fixed before their assertions are used',()=>{
 for(const [name,expected] of [
  ['historical-shoulder-source-role.mjs','71707b4e799ea253937a7fde72ad5b4e1469f307fae39a8e620c191c00e44e23'],
  ['shoulder-current-role-inverse.mjs','6ba5d4d4ad83768c2316de7c164da9c03b55498409d5141d2d5e09f3f0091633'],
 ]){
  const bytes=readFileSync(new URL(name,import.meta.url));
  assert.equal(sha(bytes),expected,`${name}: reviewed helper bytes`);
  const altered=Buffer.from(bytes);altered[0]^=1;
  assert.notEqual(sha(altered),expected,`${name}: altered helper refused`);
 }
});
