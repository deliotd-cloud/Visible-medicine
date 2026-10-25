// Complete original delivery role. No current Website/Atlas fallback is permitted.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {execFileSync,spawnSync} from 'node:child_process';
import {verifyHistoricalSourceCommitment,historicalScopeExclusions} from './eus-source-commitment.mjs';
const MANIFEST_SHA256='6642e1484b9b7d38d463441ce7ea433dbee7f10e59e9d1dbaece9f88fed649e9';
const ORIGINAL_SHA256='c2951cffd8922fd873c4a63ff347adf760b6b54df1c95cf0f8fb038042449366';
const HEAD='6e810b188dde401f6c19a970928f316a479696df';
const TREE='90afe5163dbd9386aa37c93d525fa4c70e8c1b9e';
const ENTRY='tests/clinical-review-abdominal-eus.test.ts';
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
function safePath(value){
 assert(typeof value==='string'&&/^[A-Za-z0-9_.\[\]@()+ /-]+$/.test(value),'Explicit first-party relative path');
 assert(value.split('/').every(part=>part&&part!=='.'&&part!=='..'),'No traversal or absolute source path');
 assert(!value.includes('\\')&&!value.includes(':'),'No platform or package escape');return value;
}
function checkRows(rows,count){
 assert(Array.isArray(rows)&&rows.length===count,'Exact source inventory count');
 const paths=new Set();for(const row of rows){safePath(row.path);assert(!paths.has(row.path),'Unique first-party source');paths.add(row.path);assert(Number.isSafeInteger(row.bytes)&&row.bytes>=0);assert.match(row.sha256,/^[a-f0-9]{64}$/);}
 return paths;
}
export function loadOriginalEusFixture(){
 const base=new URL('./fixtures/eus-original-delivery/',import.meta.url);
 const bytes=fs.readFileSync(new URL('manifest.json',base));assert.equal(sha(bytes),MANIFEST_SHA256,'Exact original EUS fixture manifest');
 const manifest=JSON.parse(bytes);assert.equal(manifest.schema,'vm-eus-original-fixture/2');assert.equal(manifest.entryPath,ENTRY);assert.equal(manifest.originalTestSha256,ORIGINAL_SHA256);assert.equal(manifest.historicalAtlasHead,HEAD);assert.equal(manifest.historicalAtlasTree,TREE);
 checkRows(manifest.sourceRows,7);const sources=new Map();
 for(const row of manifest.sourceRows){assert.equal(row.fixture,'source/'+row.path+'.raw');const raw=fs.readFileSync(new URL(row.fixture,base));assert.equal(raw.length,row.bytes,row.path);assert.equal(sha(raw),row.sha256,row.path);assert(!raw.includes(0),'Text-only fixture');new TextDecoder('utf8',{fatal:true}).decode(raw);sources.set(row.path,raw);}
 assert.equal(sha(sources.get(ENTRY)),ORIGINAL_SHA256);
 const commitment=manifest.sourceCommitment;assert.equal(commitment.schema,'vm-eus-historical-source-commitment/1');assert.equal(commitment.count,6672);assert.equal(commitment.sha256,'d45ebbc5a71bd46b6cb9d760bd80078e83ab34deeb086c6fe48428ccef01ac83');assert.deepEqual(commitment.excludedRootEntries,[...historicalScopeExclusions]);
 assert.deepEqual(manifest.packageVersions,{esbuild:'0.28.2',typescript:'5.9.3'});
 return {manifest,commitment,original:Buffer.from(sources.get(ENTRY))};
}
function explicitRoot(name){const configured=process.env[name];assert(typeof configured==='string'&&configured.trim(),name+' must name the matching complete historical delivery/source root; there is no default');return fs.realpathSync(configured);}
export function originalEusChildEnvironment(environment,atlas){
 const next={...environment,VM_ATLAS_SOURCE_REPO:atlas,GIT_NO_REPLACE_OBJECTS:'1',NODE_OPTIONS:'--max-old-space-size=768',GOMEMLIMIT:'64MiB',GOMAXPROCS:'1',RAYON_NUM_THREADS:'1'};
 // A standalone child test must emit its own TAP, not inherit the outer test
 // worker's private serialized transport. Application access settings stay exact.
 delete next.NODE_TEST_CONTEXT;return next;
}
export function runOriginalEusDelivery(){
 const fixture=loadOriginalEusFixture();
 const website=explicitRoot('VM_EUS_HISTORICAL_WEBSITE');
 const atlas=explicitRoot('VM_EUS_HISTORICAL_ATLAS');
 const current=fs.realpathSync(fileURLToPath(new URL('../',import.meta.url)));
 assert.notEqual(website,current,'Historical delivery must be separate from the current Website');
 const git=(...args)=>execFileSync('git',['-C',atlas,...args],{encoding:'utf8',windowsHide:true,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}}).trim();
 function verify(){
  assert.equal(fs.realpathSync(git('rev-parse','--show-toplevel')),atlas,'Historical Atlas repository root');
  assert.equal(git('rev-parse','HEAD'),HEAD,'Historical Atlas source epoch');assert.equal(git('rev-parse','HEAD^{tree}'),TREE,'Historical Atlas tree');assert.equal(git('status','--porcelain'),'','Historical Atlas must be clean');
  verifyHistoricalSourceCommitment(website,fixture.commitment);
  assert(fs.readFileSync(path.join(website,ENTRY)).equals(fixture.original),'The complete original test remains byte exact');
  for(const [name,version]of Object.entries(fixture.manifest.packageVersions))assert.equal(JSON.parse(fs.readFileSync(path.join(website,'node_modules',name,'package.json'))).version,version,'Historical dependency version: '+name);
 }
 verify();
 const args=['--max-old-space-size=768','--test','--test-concurrency=1','--test-reporter=tap',ENTRY];
 const result=spawnSync(process.execPath,args,{cwd:website,windowsHide:true,encoding:'utf8',maxBuffer:16*1024*1024,timeout:120000,env:originalEusChildEnvironment(process.env,atlas)});
 verify();
 const counts={};for(const name of ['tests','pass','fail','cancelled','skipped','todo']){const match=result.stdout?.match(new RegExp('^# '+name+' (\\d+)\\r?$','m'));counts[name]=match?Number(match[1]):null;}
 assert.equal(result.error,undefined,'Historical child did not complete: '+result.error?.message);
 assert.equal(result.signal,null,'Historical child signal');
 assert.equal(result.status,0,'Original EUS delivery failed:\n'+result.stdout+'\n'+result.stderr);
 assert.deepEqual(counts,{tests:1,pass:1,fail:0,cancelled:0,skipped:0,todo:0},'Complete original case; no skipped or filtered assertions');
 return {counts,atlasHead:HEAD,sourceFilesVerified:fixture.commitment.count};
}