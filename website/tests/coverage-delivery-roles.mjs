import assert from 'node:assert/strict';import fs from 'node:fs';import path from 'node:path';import {fileURLToPath,pathToFileURL} from 'node:url';import {createHash} from 'node:crypto';import {spawnSync} from 'node:child_process';
const hash=b=>createHash('sha256').update(b).digest('hex');
const receiptSha='1b38f47acd68bd9765d442f356a3390bda69f305007887739e03b362b480a9a3',originalSha='83f74758a50eff36e3cfa320067e040ef4fc33bf70cb8f78f1a12e3ba186a9b4';
const entry='tests/current-190-coverage.test.mjs';
function required(name){const value=process.env[name];assert(typeof value==='string'&&value.trim(),name+' requires an exact local historical artifact; no fallback');return fs.realpathSync(value);}
function safe(name){assert(typeof name==='string'&&!path.isAbsolute(name)&&!/[\\:]/.test(name)&&name.split('/').every(p=>p&&p!=='.'&&p!=='..'),'Safe relative historical path');return name;}
export function assertCoverageCodeBytes(row,bytes){assert.equal(bytes.length,row.bytes);assert.equal(hash(bytes),row.sha256,'Exact complete historical code');return bytes;}
export function loadCoverageCodeFixture(){const base=new URL('./fixtures/coverage-6d-code/',import.meta.url),raw=fs.readFileSync(new URL('manifest.json',base));assert.equal(hash(raw),'8301605b140dc78035f985a4dc86bde5606cac5b29ad8fd6babf54549d600a8f');const manifest=JSON.parse(raw);assert.equal(manifest.schema,'vm-coverage-historical-code/2');assert.equal(manifest.sourceRows.length,6);assert.equal(new Set(manifest.sourceRows.map(r=>r.path)).size,6);const code=new Map();for(const row of manifest.sourceRows){safe(row.path);code.set(row.path,Buffer.from(assertCoverageCodeBytes(row,fs.readFileSync(path.join(required('VM_COVERAGE_HISTORICAL_SITE'),row.path)))));}assert.equal(hash(code.get(entry)),originalSha);return {manifest,code};}
export function historicalCoverageContext(){const fixture=loadCoverageCodeFixture(),site=required('VM_COVERAGE_HISTORICAL_SITE'),receiptFile=required('VM_COVERAGE_HISTORICAL_RECEIPT'),priorIndex=required('VM_COVERAGE_485_INDEX');const raw=fs.readFileSync(receiptFile);assert.equal(hash(raw),receiptSha);const receipt=JSON.parse(raw);assert.equal(receipt.source,'6d7a356ae949e13f2ff4bf1fec610ee6ae7762c1');
 function verify(){assert.equal(hash(fs.readFileSync(receiptFile)),receiptSha);const pin=JSON.parse(fs.readFileSync(site+'/tests/fixtures/current-atlas-delivery.json')),index=JSON.parse(fs.readFileSync(site+'/docs/anatomy-coverage/index.json'));assert.equal(pin.source,receipt.source);assert.equal(index.sourceRevision,receipt.source);assert.equal(Object.keys(pin.documents).length,12);assert.equal(index.sourceArtifacts.length,4);
 const names=[...fixture.code.keys(),'tests/fixtures/current-atlas-delivery.json','docs/anatomy-coverage/index.json','tests/fixtures/drawable-epoch-preimage/coverage-index-0df.json.raw','tests/fixtures/body-learning-epoch-history/coverage-index-190.json.raw',...Object.keys(pin.documents),...index.sourceArtifacts.map(r=>r.path)];assert.equal(new Set(names).size,26);
 for(const name of names){safe(name);const rows=receipt.sourceRows.filter(r=>r.path===name);assert.equal(rows.length,1,'One authentic historical read row');const bytes=fs.readFileSync(path.join(site,name));assertCoverageCodeBytes(rows[0],bytes);if(fixture.code.has(name))assert(bytes.equals(fixture.code.get(name)));}
 assert.equal(hash(fs.readFileSync(priorIndex)),'9020eac8ed2fee77ef04b63357eabd23471f99e3e966d5b2c427010ee3478579');return {index,pin};
 }const bound=verify();return {site,priorIndex,fixture,verify,...bound};}
export function runOriginalCoverage(){const context=historicalCoverageContext(),env={...process.env,NODE_OPTIONS:'--max-old-space-size=256'};delete env.NODE_TEST_CONTEXT;const preload=fileURLToPath(new URL('./coverage-historical-read.mjs',import.meta.url));const result=spawnSync(process.execPath,['--max-old-space-size=256','--import',pathToFileURL(preload).href,'--test','--test-concurrency=1','--test-reporter=tap',entry],{cwd:context.site,env,encoding:'utf8',windowsHide:true,timeout:120000,maxBuffer:4*1024*1024});context.verify();assert.equal(result.error,undefined);assert.equal(result.signal,null);assert.equal(result.status,0,result.stdout+'\n'+result.stderr);const counts={};for(const n of ['tests','pass','fail','cancelled','skipped','todo'])counts[n]=Number(result.stdout.match(new RegExp('^# '+n+' (\\d+)\\r?$','m'))?.[1]);assert.deepEqual(counts,{tests:4,pass:4,fail:0,cancelled:0,skipped:0,todo:0});return counts;}
const historical727Site='F:/VisibleMedicine/staging/20261025-effective-entitlement-website/website';
const historical727Receipt='F:/VisibleMedicine/staging/20261025-effective-entitlement-website/SOURCE_CANDIDATE_V5.json';
const historical727ReceiptSha='24cdf7e2f5bb47142fb0c27a6730269d03539d425f75b1a1ba3536282d5ab482';
const coveragePaths=['scripts/check-anatomy-coverage.mjs','scripts/build-anatomy-coverage-index.mjs',
 'lib/anatomy-coverage-view.ts','tests/current-atlas-delivery.mjs','tests/atlas-source-repo.mjs',
 'tests/fixtures/current-atlas-delivery.json','docs/anatomy-coverage/index.json','atlas-review/manifest.json'];
const historical727Pins={
 'scripts/check-anatomy-coverage.mjs':'28f9dd4022f321c9ed88216e824cdee12dd963200f70a8c7f2243fe88a4fee80',
 'scripts/build-anatomy-coverage-index.mjs':'d9166d2b6924cbfb6dfe2f688e1d53fc47ba3aa790be80604a18d4ff550d259a',
 'lib/anatomy-coverage-view.ts':'eefd4f6369cf28f0872603480bcda6c57823dd37b56a6600371ee86c83d8afec',
 'tests/current-atlas-delivery.mjs':'02dd815603c922dedbdc5a5fce270fbda736b81220e335d750dcbec1124c833e',
 'tests/atlas-source-repo.mjs':'45be52da6f2a93fdff2276235b357d6e491385af8a84ab8e0193905f6d49f356',
 'tests/fixtures/current-atlas-delivery.json':'2617b9b7a407a91309963ad61b13e0c5620cccfe4442075a624b8b83a3e0827a',
 'docs/anatomy-coverage/index.json':'c4db62f69db4e8493c06d485c0226071c9dde0243cc60ed145124a5f74014c25',
 'atlas-review/manifest.json':'8884c326157efb575fe5563b9bfcfa73dcd784c0f44fe3f147cab1d6d3b4f716'};
const currentC32Pins={
 'scripts/check-anatomy-coverage.mjs':'82427b8f15a75d1be96e208a11a02923d6fa94c4b1b7c8b10775e04a38230624',
 'scripts/build-anatomy-coverage-index.mjs':'d9166d2b6924cbfb6dfe2f688e1d53fc47ba3aa790be80604a18d4ff550d259a',
 'lib/anatomy-coverage-view.ts':'fbbb9756a280e945f6c0425b463076cce7c076a635a1f63dc38862c96dd7d865',
 'tests/current-atlas-delivery.mjs':'62831a4e68cdcc3665768782d135c93c1dce77e4f9ad0a6498f9af7cbccfd09b',
 'tests/atlas-source-repo.mjs':'45be52da6f2a93fdff2276235b357d6e491385af8a84ab8e0193905f6d49f356',
 'tests/fixtures/current-atlas-delivery.json':'5210d4032f40a2924b49c247581bead32575996c37d785f018be5909a6fc032a',
 'docs/anatomy-coverage/index.json':'4456a9a3ba7e56d4b05cfa86471b930585251562115c19e7c000932fab01d4fe',
 'atlas-review/manifest.json':'2bccfb7d1f183b8f487105e35d2cbd062d03cca3aeb7bfbc843fadc4115c51a1'};
function verifyPins(root,pins){
 assert.deepEqual(Object.keys(pins),coveragePaths);
 for(const [p,sha]of Object.entries(pins))assert.equal(hash(fs.readFileSync(path.join(root,p))),sha,`${p}: exact coverage source`);
}
async function coverageApiAt(root){
 const view=await import(pathToFileURL(root+'/lib/anatomy-coverage-view.ts').href),check=await import(pathToFileURL(root+'/scripts/check-anatomy-coverage.mjs').href),delivery=await import(pathToFileURL(root+'/tests/current-atlas-delivery.mjs').href);
 const index=JSON.parse(fs.readFileSync(root+'/docs/anatomy-coverage/index.json'));
 const manifest=JSON.parse(fs.readFileSync(root+'/atlas-review/manifest.json'));
 return {root,index,manifest,...view,...check,...delivery};
}
export async function historical727CoverageApi(){
 const root=fs.realpathSync(historical727Site),raw=fs.readFileSync(historical727Receipt);
 assert.equal(hash(raw),historical727ReceiptSha,'Exact sealed 727 website receipt');
 const receipt=JSON.parse(raw);assert.equal(fs.realpathSync(receipt.website),root);
 assert.equal(receipt.atlasHead,'727ed5b451ae940a01e56272c8fbc703ea3b0095');
 const pin=JSON.parse(fs.readFileSync(path.join(root,'tests/fixtures/current-atlas-delivery.json')));
 const index=JSON.parse(fs.readFileSync(path.join(root,'docs/anatomy-coverage/index.json')));
 assert.equal(pin.source,receipt.atlasHead);assert.equal(index.sourceRevision,receipt.atlasHead);
 assert.equal(pin.documents&&Object.keys(pin.documents).length,12);
 assert.equal(index.sourceArtifacts.length,4);
 const closure=[...new Set([...coveragePaths,...Object.keys(pin.documents),...index.sourceArtifacts.map(row=>row.path)])];
 assert.equal(closure.length,23,'Finite historical 727 read closure');
 const rows=new Map(receipt.sourceRows.map(row=>[row.path,row]));
 assert.equal(rows.size,receipt.sourceRows.length,'No duplicate sealed source rows');
 for(const name of closure){
  safe(name);const row=rows.get(name);assert(row,`${name}: sealed 727 source row`);
  const file=path.join(root,name);assert.equal(fs.realpathSync(file),file,`${name}: no source symlink`);
  const bytes=fs.readFileSync(file);assert.equal(bytes.length,row.bytes,`${name}: sealed size`);
  assert.equal(hash(bytes),row.sha256,`${name}: sealed digest`);
 }
 verifyPins(root,historical727Pins);
 return coverageApiAt(root);
}
export async function currentCoverageApi(){
 const root=fs.realpathSync(process.env.VM_COVERAGE_CURRENT_SITE??fileURLToPath(new URL('../',import.meta.url)));
 verifyPins(root,currentC32Pins);
 return coverageApiAt(root);
}
