// Authenticate the retained review-sections epoch and execute its original test body.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {execFileSync,spawnSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import {isAbsolute,join,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const site='F:/VisibleMedicine/staging/20261030-release-repair-website/website';
const atlas='F:/VisibleMedicine/staging/20261030-spleen-native/atlas';
const receiptPath='F:/VisibleMedicine/staging/20261030-release-repair-website/SOURCE_CANDIDATE.json';
const source='9cef8900417bf592d3130f6ff92bf3e748cb55fc';
const tree='3d71e1e991e8a6cb69e6fac6f085c87ede58afd0';
const receiptSha='a8df01e3e7a03a0d6fae4eea50526385ca52cc865a6f6f6968f2ba5b023cbacd';
const testSha='1c92dfee7b017b7e8f54a9b58f94486b697cf01d3dc342bd9877c1766544de39';
const pinSha='7b14a7455de0b87e781192d5b1072c9c17c42ab5611c96247a0e7e677b416ac8';
const name='head-review-sections-preservation.test.mjs';
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const git=(...args)=>execFileSync('git',['-C',atlas,...args],{encoding:'utf8',windowsHide:true,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1',GIT_OPTIONAL_LOCKS:'0'}}).trim();
function authenticate(){
 const testBytes=readFileSync(join(site,'tests',name));
 assert.equal(sha(testBytes),testSha,'Exact historical test body');
 const pinBytes=readFileSync(join(site,'tests/fixtures/current-atlas-delivery.json'));
 assert.equal(sha(pinBytes),pinSha,'Exact historical delivery pin');
 const pin=JSON.parse(pinBytes);
 assert.equal(pin.source,source);assert.equal(pin.sourceTree,tree);
 const receiptBytes=readFileSync(receiptPath);
 assert.equal(sha(receiptBytes),receiptSha,'Exact historical source receipt');
 const receipt=JSON.parse(receiptBytes);
 assert.equal(resolve(receipt.website),resolve(site));assert.equal(resolve(receipt.atlas),resolve(atlas));
 assert.equal(receipt.atlasHead,source);assert.equal(receipt.atlasTree,tree);
 const seen=new Set();
 for(const row of receipt.sourceRows){
  assert(!seen.has(row.path),'Duplicate receipt path');seen.add(row.path);
  assert(!isAbsolute(row.path)&&!row.path.includes(':')&&row.path.split(/[\\/]/).every(part=>part&&part!=='.'&&part!=='..'),'Unsafe receipt path');
  const bytes=readFileSync(join(site,row.path));assert.equal(bytes.length,row.bytes,row.path);assert.equal(sha(bytes),row.sha256,row.path);
 }
 assert.equal(git('rev-parse','HEAD'),source);assert.equal(git('rev-parse','HEAD^{tree}'),tree);
 assert.equal(git('status','--porcelain=v1'),'','Historical Atlas checkout changed');
 return testBytes;
}
export function replayReviewSectionsEpoch(){
 const currentSite=fileURLToPath(new URL('../',import.meta.url));
 assert.equal(resolve(process.cwd()),resolve(currentSite),'Run from current website');
 const bytes=authenticate();
 const env={...process.env,VM_ATLAS_SOURCE_REPO:atlas,ATLAS_SOURCE_REPO:atlas,VM_WEBSITE_ROOT:site,GIT_NO_REPLACE_OBJECTS:'1'};
 delete env.VM_CURRENT_SOURCE_RECEIPT;delete env.VM_CURRENT_SOURCE_SHA256;delete env.NODE_TEST_CONTEXT;
 const run=spawnSync(process.execPath,['--experimental-strip-types','--test','--test-concurrency=1','--test-reporter=tap',join(site,'tests',name)],
  {cwd:site,env,encoding:'utf8',windowsHide:true,shell:false,maxBuffer:64e6});
 assert.equal(run.error,undefined,String(run.error));assert.equal(run.signal,null);assert.equal(run.status,0,run.stderr+'\n'+run.stdout);
 for(const [field,count] of Object.entries({tests:2,pass:2,fail:0,cancelled:0,skipped:0,todo:0})){
  const matches=[...run.stdout.matchAll(new RegExp('^# '+field+' (\\d+)\\r?$','gm'))];
  assert.equal(matches.length,1,'One terminal '+field);assert.equal(Number(matches[0][1]),count,field);
 }
 assert(!/^not ok \d+/m.test(run.stdout));assert.deepEqual(authenticate(),bytes,'Historical source changed during replay');
 return {source,originalCases:2};
}