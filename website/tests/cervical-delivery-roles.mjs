// Test-only authenticated delivery roles. No product modules or exports are replaced.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createHash, randomUUID} from 'node:crypto';
import {execFileSync, spawn} from 'node:child_process';
import {fileURLToPath, pathToFileURL} from 'node:url';
import {finished} from 'node:stream/promises';
import readline from 'node:readline';

const ORIGINAL='428fb397b7d5efff567754844a282223ee8ce8068fc0eb599413cbd7fe0621df';
const HISTORICAL='389bd0ca846a42c7f21055f55904bcf5df81a09f';
const CURRENT='727ed5b451ae940a01e56272c8fbc703ea3b0095';
const FIXTURE_SHA='b61aa774c2d31d60926c0b25ffc212e99bba9a886f15b0ba654cfb1a5d2fadd1';
const fixture=new URL('./fixtures/cervical-delivery-roles/',import.meta.url);
const website=fileURLToPath(new URL('../',import.meta.url));
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const counters=['tests','pass','fail','cancelled','skipped','todo'];
const originalUrl=new URL('original-one.mjs.raw',fixture);

function assertBytes(row,bytes){
 assert(Buffer.isBuffer(bytes),'Actual file bytes required');
 assert.equal(bytes.length,row.bytes,'Exact finite length: '+row.path);
 assert.equal(sha(bytes),row.sha256,'Exact finite digest: '+row.path);
}
function manifest(){
 const bytes=fs.readFileSync(new URL('manifest.json',fixture));
 assert.equal(sha(bytes),FIXTURE_SHA,'Exact cervical role manifest');
 const m=JSON.parse(bytes);
 assert.equal(m.schema,'vm-cervical-delivery-roles/1');
 assert.equal(m.original.sha256,ORIGINAL);
 assert.equal(m.identities.historical.source,HISTORICAL);
 assert.equal(m.identities.current.source,CURRENT);
 assert.equal(m.childCases,1);
 assertBytes({path:'original-one.mjs.raw',...m.original},fs.readFileSync(originalUrl));
 return m;
}
function readRoot(name,expected){
 const configured=process.env[name];
 assert(typeof configured==='string'&&path.isAbsolute(configured),name+' must be explicit absolute path');
 const actual=fs.realpathSync(configured);
 assert.equal(actual,fs.realpathSync(expected),name+' must point to exact archived root');
 return actual;
}
function relativeFile(name){
 assert(typeof name==='string'&&name&&!name.includes('\\')&&!name.includes(':')&&!name.startsWith('/'),'Relative finite file');
 assert(name.split('/').every(part=>part&&part!=='.'&&part!=='..'),'No path traversal');
 return name;
}
function exactClosure(m){
 const name=process.env.VM_CERVICAL_LOCAL_CLOSURE;
 assert(typeof name==='string'&&path.isAbsolute(name),'Explicit local-only closure file required');
 const bytes=fs.readFileSync(name);
 assert.equal(sha(bytes),m.closure.sha256,'Exact local-only closure index');
 const c=JSON.parse(bytes);assert.equal(c.schema,'vm-cervical-finite-closure/1');
 assert.deepEqual(Object.keys(c.scopes).sort(),['historicalAtlas','historicalDependencies','historicalWebsite'].sort());
 for(const scope of Object.keys(c.scopes)){
  const rows=c.scopes[scope];assert(Array.isArray(rows)&&rows.length===m.closure.counts[scope],'Exact finite row count: '+scope);
  const names=new Set();
  for(const row of rows){relativeFile(row.path);assert(!names.has(row.path),'Duplicate finite file: '+row.path);names.add(row.path);assert(Number.isSafeInteger(row.bytes)&&row.bytes>=0);assert.match(row.sha256,/^[a-f0-9]{64}$/)}
 }
 return c;
}
function checkFinite(root,rows){
 for(const row of rows){
  const name=path.join(root,relativeFile(row.path));
  const st=fs.lstatSync(name);assert(st.isFile()&&!st.isSymbolicLink(),'Regular finite file: '+row.path);
  assert(fs.realpathSync(name).startsWith(root+path.sep),'Finite path remains in root: '+row.path);
  assertBytes(row,fs.readFileSync(name));
 }
}
function gitIdentity(root,expected){
 const env={...process.env,GIT_NO_REPLACE_OBJECTS:'1',GIT_OPTIONAL_LOCKS:'0'};
 const git=(...args)=>execFileSync('git',['-C',root,...args],{encoding:'utf8',windowsHide:true,env,maxBuffer:16e6}).trim();
 assert.equal(fs.realpathSync(git('rev-parse','--show-toplevel')),root,'Native repository root');
 assert.equal(git('rev-parse','HEAD'),expected.source,'Native HEAD');
 assert.equal(git('rev-parse','HEAD^{tree}'),expected.sourceTree,'Native tree');
 assert.equal(git('status','--porcelain'),'','Native source is clean');
}
function checkDelivery(root,expected){
 const pin=JSON.parse(fs.readFileSync(path.join(root,'tests/fixtures/current-atlas-delivery.json'),'utf8'));
 assertCervicalRoleIdentity(pin,expected);
 const review=JSON.parse(fs.readFileSync(path.join(root,'atlas-review/manifest.json'),'utf8'));
 assert.equal(review.revision,expected.source);
 for(const [family,commit] of Object.entries(expected.runtimeSources)){
  const runtime=JSON.parse(fs.readFileSync(path.join(root,'public/atlas-runtime',family,'manifest.json'),'utf8'));
  assert.equal(runtime.sourceCommit,commit,'Runtime family: '+family);
  assert.equal(runtime.patientDataIncluded,false);
  for(const key of ['clinicalApproved','standaloneReviewConnection','imagingConnection'])
   assert(runtime[key]===false||runtime[key]===undefined,'No widened clearance: '+family+':'+key);
 }
}
export function assertCervicalRoleIdentity(pin,expected){
 for(const key of ['source','sourceTree','runtimeSources','reviewIntegration','reviewSourceFiles','viewerFiles','viewerPackages'])
  assert.deepEqual(pin[key],expected[key],'Exact cervical delivery identity: '+key);
}
export function assertCurrentCervicalSource(){
 const m=manifest();
 const source=fs.readFileSync(path.join(website,'tests/atlas-cervical-current-delivery.test.mjs'));
 assert.equal(sha(source),m.currentSha256,'Exact separately admitted current cervical source');
 const pin=JSON.parse(fs.readFileSync(path.join(website,'tests/fixtures/current-atlas-delivery.json'),'utf8'));
 assertCervicalRoleIdentity(pin,m.identities.current);
}
function prepared(m){
 const historicalWebsite=readRoot('VM_CERVICAL_HISTORICAL_WEBSITE',m.historicalPaths.website);
 const historicalAtlas=readRoot('VM_CERVICAL_HISTORICAL_ATLAS',m.historicalPaths.atlas);
 const historicalDependencies=fs.realpathSync(path.join(historicalWebsite,'node_modules'));
 assert.equal(historicalDependencies,fs.realpathSync(m.historicalPaths.dependencies),'Exact physical dependency root');
 assert.notEqual(historicalWebsite,fs.realpathSync(website),'Current and historical Websites differ');
 const c=exactClosure(m);
 checkFinite(historicalWebsite,c.scopes.historicalWebsite);
 checkFinite(historicalAtlas,c.scopes.historicalAtlas);
 checkFinite(historicalDependencies,c.scopes.historicalDependencies);
 checkDelivery(historicalWebsite,m.identities.historical);
 gitIdentity(historicalAtlas,m.identities.historical);
 assert(fs.readFileSync(path.join(historicalWebsite,'tests/atlas-cervical-projection-xray.test.mjs')).equals(fs.readFileSync(originalUrl)),
  'Historical child is whole original module at genuine URL');
 return {historicalWebsite,historicalAtlas,c};
}
export function authenticateCervicalCollector(bytes){
 assert(Buffer.isBuffer(bytes),'Whole source bytes required');
 if(sha(bytes)===ORIGINAL)return bytes;
 const m=manifest();
 assert.equal(sha(bytes),m.collectorSha256,'Only exact cervical collector may unwrap');
 const original=fs.readFileSync(originalUrl);
 assertBytes({path:'original-one.mjs.raw',...m.original},original);
 return original;
}
export function assertCompleteCervicalChild(result,tap){
 assert.equal(result.error,undefined,'No child start error');
 assert.equal(result.signal,null,'No child signal');
 assert.equal(result.code,0,'Unchanged original child must exit zero');
 assert.equal((tap.match(/^TAP version 13\r?$/gm)||[]).length,1,'One native TAP stream');
 assert(!/^Bail out!/im.test(tap),'No bailout');
 assert(!/^\s*not ok \d+/m.test(tap),'No contradictory failed point');
 assert(!/^\s*(?:ok|not ok) \d+.*#\s*(?:SKIP|TODO)\b/im.test(tap),'No skipped or todo point');
 const points=[...tap.matchAll(/^(not )?ok (\d+)(?:\s|$)/gm)];
 assert.equal(points.length,1,'Exactly one top-level original point');
 assert.equal(points[0][1],undefined,'Original point passes');
 assert.equal(Number(points[0][2]),1,'Contiguous original point 1');
 const plans=[...tap.matchAll(/^1\.\.(\d+)\r?$/gm)];
 assert.equal(plans.length,1,'One final plan');assert.equal(Number(plans[0][1]),1,'Original plan 1');
 assert(plans[0].index>points[0].index,'Plan follows point');
 const counts={};let last=plans[0].index;
 for(const key of counters){
  const matches=[...tap.matchAll(new RegExp('^# '+key+' (\\d+)\\r?$','gm'))];
  assert.equal(matches.length,1,'One terminal '+key);
  assert(matches[0].index>plans[0].index,'Terminal '+key+' after plan');
  assert(matches[0].index>last,'Ordered terminal counters');last=matches[0].index;
  counts[key]=Number(matches[0][1]);
 }
 assert.deepEqual(counts,{tests:1,pass:1,fail:0,cancelled:0,skipped:0,todo:0},'Exact unchanged child accounting');
 return counts;
}
function childEnvironment(atlas){
 const env={};
 for(const key of ['Path','SystemRoot','WINDIR','ComSpec','PATHEXT','TEMP','TMP','OS','PROCESSOR_ARCHITECTURE','NUMBER_OF_PROCESSORS'])
  if(process.env[key]!==undefined)env[key]=process.env[key];
 Object.assign(env,{VM_ATLAS_SOURCE_REPO:atlas,ATLAS_SOURCE_REPO:atlas,GIT_NO_REPLACE_OBJECTS:'1',
  NODE_OPTIONS:'--max-old-space-size=768',GOMEMLIMIT:'64MiB',GOMAXPROCS:'1',RAYON_NUM_THREADS:'1'});
 return env; // No inherited NODE_TEST_CONTEXT, loaders, credentials, or test-name filters.
}
export async function runOriginalCervicalRole(){
 const m=manifest(),r=prepared(m);
 const collector=fs.readFileSync(path.join(website,'tests/atlas-cervical-projection-xray.test.mjs'));
 assert.equal(sha(collector),m.collectorSha256,'Exact active collector');
 assert(fs.readFileSync(path.join(r.historicalWebsite,'tests/atlas-cervical-projection-xray.test.mjs')).equals(fs.readFileSync(originalUrl)),
  'Whole original child module remains at original URI');
 const evidenceRoot=process.env.VM_CERVICAL_LOCAL_EVIDENCE_ROOT;
 assert(typeof evidenceRoot==='string'&&path.isAbsolute(evidenceRoot),'Explicit local-only evidence root required');
 const evidence=path.join(fs.realpathSync(evidenceRoot),'cervical-'+new Date().toISOString().replace(/[:.]/g,'-')+'-'+randomUUID());
 fs.mkdirSync(evidence,{recursive:true});
 const args=['--max-old-space-size=768','--experimental-strip-types','--test','--test-concurrency=1','--test-reporter=tap','tests/atlas-cervical-projection-xray.test.mjs'];
 const stdout=fs.createWriteStream(path.join(evidence,'child.tap'),{flags:'wx'});
 const stderr=fs.createWriteStream(path.join(evidence,'child.stderr.log'),{flags:'wx'});
 const child=spawn(process.execPath,args,{cwd:r.historicalWebsite,windowsHide:true,shell:false,stdio:['ignore','pipe','pipe'],env:childEnvironment(r.historicalAtlas)});
 child.stdout.pipe(stdout);child.stderr.pipe(stderr);
 fs.writeFileSync(path.join(evidence,'started.json'),JSON.stringify({pid:child.pid,cwd:r.historicalWebsite,
  childModule:pathToFileURL(path.join(r.historicalWebsite,'tests/atlas-cervical-projection-xray.test.mjs')).href,
  expected:{tests:1,pass:1,fail:0,cancelled:0,skipped:0,todo:0},closureSha256:m.closure.sha256},null,2)+'\n',{flag:'wx'});
 const result=await new Promise(resolve=>{let error;child.once('error',e=>{error=String(e)});child.once('close',(code,signal)=>resolve({code,signal,...(error?{error}:{})}))});
 await Promise.all([finished(stdout),finished(stderr)]);
 let inputError;try{
  const again=prepared(manifest());assert.equal(sha(fs.readFileSync(path.join(website,'tests/atlas-cervical-projection-xray.test.mjs'))),m.collectorSha256);
  assert.equal(again.historicalWebsite,r.historicalWebsite);
 }catch(error){inputError=String(error)}
 let tap='';const lines=readline.createInterface({input:fs.createReadStream(path.join(evidence,'child.tap')),crlfDelay:Infinity});
 for await(const line of lines)if(/^(?:TAP version|\s*(?:not )?ok \d+|1\.\.|# (?:tests|pass|fail|cancelled|skipped|todo) |Bail out!)/.test(line))tap+=line+'\n';
 let counts,transportError;try{counts=assertCompleteCervicalChild(result,tap)}catch(error){transportError=String(error)}
 fs.writeFileSync(path.join(evidence,'terminal.json'),JSON.stringify({result,counts:counts??null,inputError:inputError??null,
  transportError:transportError??null,passing:!inputError&&!transportError,clinicalApproval:false,releaseApproval:false},null,2)+'\n',{flag:'wx'});
 assert(!inputError,'Finite input changed; local child evidence: '+evidence);
 assert(!transportError,'Historical child incomplete or failed; local child evidence: '+evidence);
 return {counts,evidence};
}
