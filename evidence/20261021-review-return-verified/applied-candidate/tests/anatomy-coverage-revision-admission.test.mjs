// PROPOSAL ONLY: install this wrapper at the SAME candidate test path after the live suite ends.
// Preserve the original four-test module as an exact .raw fixture and in the closed 485 tree.
import assert from 'node:assert/strict';
import test from 'node:test';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {resolve} from 'node:path';

const historicalRoot='F:/VisibleMedicine/staging/20261020-combined-website-ui/website';
const inputsPath='F:/VisibleMedicine/staging/20261021-source190-website/ORIGINAL_485_INPUTS.json';
const original='tests/anatomy-coverage-revision-admission.test.mjs';
const originalFixture='tests/fixtures/closed485-original/anatomy-coverage-revision-admission.test.mjs.raw';
const inputListSha='9d776a001f518fd6af9f8a715998aaaba55c390a46a03f3aa898990a42982294';
const originalSha='8ee56ade2e3b70c5e5b50ee6a629d411635da3c5ff5b89a5670181a47b80edb1';
const dependencies=[
 original,'tests/current-atlas-delivery.mjs','tests/atlas-source-repo.mjs',
 'tests/fixtures/current-atlas-delivery.json','tests/clinical-review-desktop-layout.test.mjs',
 'tests/fixtures/current-delivery-before-inbox485/clinical-review-desktop-layout.test.mjs.raw',
 'tests/fixtures/coverage-before-6036/index.json.raw',
 'tests/fixtures/coverage-before-6036/check-anatomy-coverage.mjs.raw',
 'tests/fixtures/coverage-before-6036/anatomy-coverage-view.ts.raw',
 'docs/anatomy-coverage/index.json','docs/anatomy-coverage/root.json',
 'docs/anatomy-coverage/nested.json','docs/anatomy-coverage/independent.json',
 'docs/anatomy-coverage/reference.json','scripts/check-anatomy-coverage.mjs',
 'scripts/build-anatomy-coverage-index.mjs','lib/anatomy-coverage-view.ts',
 'atlas-review/manifest.json','package.json',
];
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');

function verifyClosedInputs(){
 const bytes=readFileSync(inputsPath);
 assert.equal(sha(bytes),inputListSha,'exact frozen 485 input inventory');
 const rows=JSON.parse(bytes),byPath=new Map(rows.map(row=>[row.path,row]));
 assert.equal(byPath.get(original)?.sha256,originalSha,'complete immutable original test');
 assert.equal(sha(readFileSync(originalFixture)),originalSha,'exact original source retained in candidate fixture');
 // The imported current-delivery validator reads every pinned delivery document
 // at module load. Guard that complete declared set as well as direct imports
 // and assertion-read inputs before executing the untouched original module.
 const pin=JSON.parse(readFileSync(resolve(historicalRoot,'tests/fixtures/current-atlas-delivery.json')));
 const closure=[...new Set([...dependencies,...Object.keys(pin.documents)])];
 for(const path of closure){
  const row=byPath.get(path);
  assert(row&&/^[a-f0-9]{64}$/.test(row.sha256),'missing historical input '+path);
  assert.equal(sha(readFileSync(resolve(historicalRoot,path))),row.sha256,'closed 485 dependency '+path);
 }
 const index=JSON.parse(readFileSync(resolve(historicalRoot,'docs/anatomy-coverage/index.json')));
 const manifest=JSON.parse(readFileSync(resolve(historicalRoot,'atlas-review/manifest.json')));
 for(const revision of [index.sourceRevision,manifest.revision,pin.source])
  assert.equal(revision,'485df97c2530e8e81a8d39a5ee61073ce76d93db','closed coverage epoch');
}

test('the four complete original coverage admission tests run against the guarded closed 485 inputs',()=>{
 verifyClosedInputs();
 const childEnv={...process.env};
 delete childEnv.NODE_TEST_CONTEXT;
 const output=execFileSync(process.execPath,['--test','--test-reporter=tap',original],{
  cwd:historicalRoot,encoding:'utf8',windowsHide:true,maxBuffer:4e6,
  env:childEnv,
 });
 const footer=new Map([...output.matchAll(/^\s*(?:#|ℹ)\s+(tests|pass|fail|cancelled|skipped|todo)\s+(\d+)\s*$/gm)]
  .map(([,name,count])=>[name,Number(count)]));
 assert.deepEqual(Object.fromEntries(footer),{tests:4,pass:4,fail:0,cancelled:0,skipped:0,todo:0},
  'all four original tests and every failure/skip class must be accounted for');
 verifyClosedInputs();
});
