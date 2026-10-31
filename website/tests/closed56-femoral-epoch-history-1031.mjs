// Authenticate and execute the complete retained 2381 femoral test at its own epoch.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {execFileSync,spawnSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import {isAbsolute,join,resolve} from 'node:path';

const stage='F:/VisibleMedicine/staging/20261022-current-source-closure-assurance';
const site=join(stage,'website');
const atlas='F:/VisibleMedicine/staging/20261022-review-traversal-candidate/atlas';
const receiptPath=join(stage,'SOURCE_V2.json');
const source='2381efe43b75f8a7fb768a069eecd7268c508dac';
const tree='db21ed3dee259c390878450b3495468996a3af85';
const rootName='closed56-femoral-epoch.test.mjs';
const rootSha='d15ee270c69672f141592ab25b9ce48e1cd4fa969b31177e3d8c047a2ced92f7';
const receiptSha='92403824dc9ebcce2f8efe6bb02ed10db642ab646fbdc9cff983d48cfe9a0a07';
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const git=(...args)=>execFileSync('git',['-C',atlas,...args],{encoding:'utf8',windowsHide:true,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1',GIT_OPTIONAL_LOCKS:'0'}}).trim();

function authenticate(){
 const bytes=readFileSync(receiptPath);
 assert.equal(sha(bytes),receiptSha,'Retained source receipt');
 const receipt=JSON.parse(bytes);
 assert.equal(resolve(receipt.website),resolve(site));
 assert.equal(resolve(receipt.atlas),resolve(atlas));
 assert.equal(receipt.atlasHead,source);assert.equal(receipt.atlasTree,tree);
 assert.equal(receipt.review,'1a48d6bc674a007b4e6be7ebdb777810ca0f2ee3e373d58b53d22a43ba9babfc');
 assert.equal(receipt.boundInputs,1729);assert.equal(receipt.importedSources,1562);
 const seen=new Set();
 for(const row of receipt.sourceRows){
  assert(!seen.has(row.path),'Duplicate historical path');seen.add(row.path);
  assert(!isAbsolute(row.path)&&!row.path.includes(':')&&row.path.split(/[\\/]/).every(part=>part&&part!=='.'&&part!=='..'),'Unsafe historical path');
  const file=readFileSync(join(site,row.path));
  assert.equal(file.length,row.bytes,row.path);assert.equal(sha(file),row.sha256,row.path);
 }
 assert.equal(sha(readFileSync(join(site,'tests',rootName))),rootSha,'Complete original 2381 root');
 assert.equal(git('rev-parse','HEAD'),source);assert.equal(git('rev-parse','HEAD^{tree}'),tree);
 assert.equal(git('status','--porcelain=v1'),'','Retained Atlas changed');
 const pin=JSON.parse(readFileSync(join(site,'tests/fixtures/current-atlas-delivery.json')));
 assert.equal(pin.source,source);assert.equal(pin.sourceTree,tree);
 assert.equal(pin.reviewIntegration,receipt.review);assert.equal(pin.reviewSourceFiles,1562);
}

export function replayFemoral2381(){
 authenticate();
 const env={...process.env,VM_ATLAS_SOURCE_REPO:atlas,ATLAS_SOURCE_REPO:atlas,VM_WEBSITE_ROOT:site,GIT_NO_REPLACE_OBJECTS:'1'};
 delete env.VM_CURRENT_SOURCE_RECEIPT;delete env.VM_CURRENT_SOURCE_SHA256;delete env.NODE_TEST_CONTEXT;
 const run=spawnSync(process.execPath,['--test','--test-concurrency=1','--test-reporter=tap',join(site,'tests',rootName)],
  {cwd:site,env,encoding:'utf8',windowsHide:true,shell:false,maxBuffer:64e6});
 assert.equal(run.error,undefined,String(run.error));assert.equal(run.signal,null);
 assert.equal(run.status,0,run.stderr+'\n'+run.stdout);
 for(const [field,count] of Object.entries({tests:4,pass:4,fail:0,cancelled:0,skipped:0,todo:0})){
  const matches=[...run.stdout.matchAll(new RegExp('^# '+field+' (\\d+)\\r?$','gm'))];
  assert.equal(matches.length,1,'One terminal '+field);assert.equal(Number(matches[0][1]),count,field);
 }
 assert.deepEqual([...run.stdout.matchAll(/^(?:not )?ok (\d+)(?:\s|$)/gm)].map(m=>Number(m[1])),[1,2,3,4]);
 assert(!/^not ok \d+/m.test(run.stdout));
 authenticate();
}
