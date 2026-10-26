#!/usr/bin/env node
// PROPOSAL ONLY. Do not invoke on the live stock campaign. A main-owned supervisor
// must supply the existing 30-minute / 2048-MiB job and 4096-MiB admission guards.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {existsSync,lstatSync,mkdirSync,readFileSync,realpathSync,readdirSync,writeFileSync} from 'node:fs';
import {dirname,isAbsolute,join,relative,resolve} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
const source=resolve('F:/VisibleMedicine/staging/20261026-saved-plan-commit/website');
const sourceReceipt=resolve('F:/VisibleMedicine/staging/20261026-saved-plan-commit/SOURCE_CANDIDATE.json');
const sourceReceiptSha='c48b507b9c870e0ee8ccb11760c1c1f0127d4550284388b3211a8e5b04262101';
const campaignDriverPath=fileURLToPath(import.meta.url);
const reporterPath=join(dirname(campaignDriverPath),'structured-test-reporter.mjs');
const runnerPath=join(source,'scripts/run-website-tests.mjs');
const previewPath=join(source,'scripts/public-preview-preflight.mjs');
const historyPath=join(source,'scripts/website-test-history-preflight.mjs');
const maxRoots=75;
const sha=b=>createHash('sha256').update(b).digest('hex');
const json=x=>JSON.stringify(x);
const readJSON=p=>JSON.parse(readFileSync(p,'utf8'));
function regular(p){const s=lstatSync(p);assert(s.isFile()&&!s.isSymbolicLink(),`Nonregular file: ${p}`);return s;}
function saveNew(p,x){writeFileSync(p,JSON.stringify(x,null,2)+'\n',{flag:'wx'});}
function same(a,b,label){assert.equal(json(a),json(b),label);}
function sourceBinding(){
 regular(sourceReceipt);assert.equal(sha(readFileSync(sourceReceipt)),sourceReceiptSha,'Source receipt drift');
 const receipt=readJSON(sourceReceipt);assert.equal(resolve(receipt.website),source,'Wrong website source');
 return {path:sourceReceipt,sha256:sourceReceiptSha,atlasHead:receipt.atlasHead,atlasTree:receipt.atlasTree};
}
function driverBinding(){return [runnerPath,previewPath,historyPath,reporterPath,campaignDriverPath].map(path=>{regular(path);return{path,sha256:sha(readFileSync(path))};});}
function dependencyBinding(){
 // The candidate records installed package manifests and actual entry bytes.
 // This is a named dependency binding; it does not certify every node_modules byte.
 const receipt=readJSON(sourceReceipt),items=[];
 for(const d of receipt.dependencies){
  for(const [role,path,expected] of [['package',d.file,d.sha256],['entry',d.entry,d.entrySha256]]){
   regular(path);const actual=sha(readFileSync(path));assert.equal(actual,expected,`${d.name} ${role} drift`);
   items.push({name:d.name,role,path:realpathSync(path),sha256:actual});
  }
 }
 for(const name of ['package.json','package-lock.json']){const path=join(source,name);regular(path);items.push({name,role:'lock',path,sha256:sha(readFileSync(path))});}
 const nodeModules=join(source,'node_modules');assert(existsSync(nodeModules),'Missing installed dependencies');
 items.sort((a,b)=>(a.name+a.role+a.path).localeCompare(b.name+b.role+b.path));
 return {junctionTarget:realpathSync(nodeModules),items,sha256:sha(json(items))};
}
async function modules(){
 const runner=await import(pathToFileURL(runnerPath));
 const [{verifyPublicPreviewAssets},{assertWebsiteTestHistory}]=await Promise.all([
  import(pathToFileURL(previewPath)),import(pathToFileURL(historyPath))]);
 return {runner,verifyPublicPreviewAssets,assertWebsiteTestHistory};
}
async function inventoryViaOriginalList(runner){
 // Original --list creates its immutable manifest under source/.local. It never
 // launches test cases. Capture its announced path; reject any malformed output.
 const old=console.log,lines=[];let code;
 try{console.log=(...parts)=>lines.push(parts.join(' '));code=await runner.main(['--list','--root',source]);}
 finally{console.log=old;}
 assert.equal(code,0,'Original list failed');assert.equal(lines.length,1,'Unexpected list output');
 const announcement=JSON.parse(lines[0]);assert.equal(announcement.launched,false);
 const manifestPath=join(resolve(announcement.output),'manifest.json');
 const m=readJSON(manifestPath);assert.equal(m.mode,'list');assert.equal(resolve(m.root),source);
 assert.equal(m.entries.length,m.entryCount);assert.equal(m.entrySha256,sha(json(m.entries)));
 assert.equal(m.sourceSha256,sha(json(m.files)));
 assert.deepEqual(m.entries,[...m.entries].sort(),'Discovery order drift');
 assert.equal(new Set(m.entries).size,m.entries.length,'Duplicate physical roots');
 for(const root of m.entries)assert(/^tests\/[^/]+\.test\.(?:ts|mjs)$/.test(root),'Invalid stock root');
 return {manifest:m,manifestPath,manifestSha256:sha(readFileSync(manifestPath))};
}
async function snapshot(m,expected){
 const sourceProof=sourceBinding(),drivers=driverBinding(),dependencies=dependencyBinding();
 m.assertWebsiteTestHistory(source); // Exact original Git-history preflight.
 const preview=m.verifyPublicPreviewAssets(source); // Exact original public tile preflight.
 const inv=await inventoryViaOriginalList(m.runner);
 const result={sourceProof,drivers,dependencies,preview,entrySha256:inv.manifest.entrySha256,
  sourceSha256:inv.manifest.sourceSha256,entries:inv.manifest.entries,files:inv.manifest.files,
  manifestPath:inv.manifestPath,manifestSha256:inv.manifestSha256};
 if(expected){
  for(const field of ['sourceProof','drivers','dependencies','preview','entrySha256','sourceSha256','entries','files'])
   same(result[field],expected[field],`${field} drift`);
 }
 return result;
}
const knownMirror=Object.freeze({wrapper:'tests/atlas-glottic-muscle-imaging.test.ts',
 target:'tests/atlas-glottic-muscle-imaging.test.mjs',
 wrapperSha256:'a3d30dd530ad31ccc4e55b60c16cd68bddf421ad77a661340d1bbc414e880e0b'});
const stockArgs=Object.freeze(['--test','--experimental-strip-types','--test-concurrency=1',
 'tests/*.test.ts','tests/*.test.mjs']);
const mirrorArgs=Object.freeze([...stockArgs.slice(0,-1),'tests/!(atlas-glottic-muscle-imaging).test.mjs']);
function assertPinnedPlanBytes(bytes,expected){
 assert.match(expected??'',/^[a-f0-9]{64}$/,'Externally pinned PLAN SHA required');
 assert.equal(sha(bytes),expected,'Externally pinned PLAN SHA mismatch');
}
function assertReporterPin(reporter,path,hash){
 assert.equal(reporter?.path,path,'Reporter path mismatch');
 assert.equal(reporter?.sha256,hash,'Reporter hash mismatch');
}
function shardDir(state,index){return join(state,`shard-${String(index).padStart(3,'0')}`);}
function shardArgs(state,index,roots){const dir=shardDir(state,index);return [
 '--test','--experimental-strip-types','--test-concurrency=1',
 '--test-reporter=spec','--test-reporter-destination=stdout',
 '--test-reporter=tap',`--test-reporter-destination=${join(dir,'child.tap')}`,
 `--test-reporter=${reporterPath}`,`--test-reporter-destination=${join(dir,'events.jsonl')}`,...roots];}
function verifyPlanShape(entries,execution,shards,files,state){
 assert(Array.isArray(entries)&&entries.length>0,'No physical roots');
 assert(Array.isArray(files)&&Array.isArray(shards)&&shards.length>0,'Missing source or shards');
 assert.equal(new Set(entries).size,entries.length,'Duplicate physical roots');
 const cover=execution.coveredByImport;
 assert(Array.isArray(cover)&&cover.length<=1,'Only one known import mirror is allowed');
 const mirrorActive=cover.length===1;
 if(mirrorActive){
  same(cover[0],{path:knownMirror.target,via:knownMirror.wrapper,
   wrapperSha256:knownMirror.wrapperSha256},'Foreign import coverage');
  assert.equal(execution.mirror?.active,true,'Original executionPlan did not activate mirror');
  assert.equal(execution.mirror?.eligible,true,'Original mirror ineligible');
  assert.equal(execution.mirror?.capability?.supported,true,'Original glob probe not supported');
  assert.equal(files.find(f=>f.path===knownMirror.wrapper)?.sha256,
   knownMirror.wrapperSha256,'Known wrapper byte proof drift');
  same(execution.args,mirrorArgs,'Original mirror args drift');
 }else{
  assert.equal(execution.mirror?.active,false,'Active mirror without coverage');
  same(execution.args,stockArgs,'Original stock args drift');
 }
 const expectedExecuted=entries.filter(root=>!mirrorActive||root!==knownMirror.target);
 same(execution.executedRoots,expectedExecuted,'Original executionPlan roots drift');
 const flattened=[];
 for(let i=0;i<shards.length;i++){
  const shard=shards[i];assert.equal(shard.index,i,'Shard indexes must be sequential');
  assert(Array.isArray(shard.roots)&&shard.roots.length>0&&shard.roots.length<=maxRoots,
   'Shard must have 1..75 roots');
  assert.equal(shard.rootSha256,sha(json(shard.roots)),'Shard root hash drift');
  if(state)assert.equal(shard.argsSha256,sha(json(shardArgs(state,i,shard.roots))),
   'Shard argument binding drift');
  flattened.push(...shard.roots);
 }
 same(flattened,execution.executedRoots,'Flattened shard roots differ from executionPlan');
 assert.equal(new Set(flattened).size,flattened.length,'Duplicate executed root');
 const physical=new Set(entries),assigned=new Set(flattened);
 if(mirrorActive){
  assert(assigned.has(knownMirror.wrapper),'Known wrapper not executed');
  assert(!assigned.has(knownMirror.target),'Covered target also executed');
  assigned.add(knownMirror.target);
 }
 same([...assigned].sort(),[...physical].sort(),'Physical root coverage mismatch');
}function terminalCounts(tap){
 const counts={};for(const line of tap.replace(/\u001b\[[0-9;]*m/g,'').split(/\r?\n/)){
  const match=line.match(/^(?:#|ℹ) (tests|pass|fail|cancelled|skipped|todo) (\d+)$/);
  if(match)counts[match[1]]=Number(match[2]);
 }return counts;
}
function structuredEvidence(path,roots){
 const absent=()=>({present:false,summaryCount:0,fileSummaryCount:0,success:null,counts:{},
  roots:roots.map(root=>({root,attempted:false,eventCount:0,passEvents:0,failEvents:0,
   fileSummary:null,possibleFileLevelAbort:false,assertionCompletion:'not-established'}))});
 if(!existsSync(path))return absent();
 regular(path);const rows=[];
 for(const line of readFileSync(path,'utf8').split(/\r?\n/)){
  if(!line)continue;const event=JSON.parse(line);
  assert(['test:pass','test:fail','test:summary'].includes(event.event),'Unexpected reporter event');
  rows.push(event);
 }
 const rootOf=row=>{
  if(!row.file)return null;
  const file=isAbsolute(row.file)?row.file:join(source,row.file);
  return relative(source,resolve(file)).replace(/\\/g,'/');
 };
 const global=rows.filter(row=>row.event==='test:summary'&&row.file==null);
 const fileSummaries=rows.filter(row=>row.event==='test:summary'&&row.file!=null);
 const summary=global.length===1?global[0]:null;
 const byRoot=roots.map(root=>{
  const events=rows.filter(row=>row.event!=='test:summary'&&rootOf(row)===root);
  const perFile=fileSummaries.filter(row=>rootOf(row)===root);
  const failures=events.filter(row=>row.event==='test:fail');
  const fileSummary=perFile.length===1?{counts:perFile[0].counts,success:perFile[0].success}:null;
  const possibleFileLevelAbort=failures.some(row=>row.nesting===0||row.name===root||
   row.name===root.slice(6))||perFile.some(row=>row.success===false&&
    (row.counts?.tests===0||row.counts?.failed>0));
  return {root,attempted:events.length>0||perFile.length>0,eventCount:events.length,
   passEvents:events.filter(row=>row.event==='test:pass').length,failEvents:failures.length,
   fileSummary,possibleFileLevelAbort,
   assertionCompletion:fileSummary?.success===true&&fileSummary.counts?.tests>0&&
    fileSummary.counts?.failed===0&&fileSummary.counts?.cancelled===0?
    'native-file-summary-complete':'not-established'};
 });
 return {present:true,summaryCount:global.length,fileSummaryCount:fileSummaries.length,
  success:summary?.success??null,counts:summary?.counts??{},roots:byRoot,
  unattributedEventCount:rows.filter(row=>row.event!=='test:summary'&&rootOf(row)==null).length};
}async function createCampaign(state){
 assert(!existsSync(state),'Campaign directory already exists');mkdirSync(state,{recursive:false});
 const m=await modules(),before=await snapshot(m);
 const mirrorDir=join(state,'mirror-probe');mkdirSync(mirrorDir);
 const execution=await m.runner.executionPlan({entries:before.entries,files:before.files},mirrorDir);
 const executed=execution.executedRoots;
 assert.equal(new Set(executed).size,executed.length);
 const shards=[];for(let start=0;start<executed.length;start+=maxRoots){
  const roots=executed.slice(start,start+maxRoots);
  const index=shards.length;shards.push({index,roots,rootSha256:sha(json(roots)),
   argsSha256:sha(json(shardArgs(state,index,roots)))});
 }
 verifyPlanShape(before.entries,execution,shards,before.files,state);
 const plan={schema:'vm-bounded-stock-campaign-proposal/1',createdAt:new Date().toISOString(),source,
  sourceReceiptSha256:sourceReceiptSha,maxRoots,stockPhysicalRootCount:before.entries.length,
  originalStockDiagnostic:{failures:316,skips:3,adjusted:false,passingClaim:false},
  before,execution,shards,reporter:{path:reporterPath,sha256:sha(readFileSync(reporterPath))},
  limitations:'Shard results are diagnostic and cannot replace an unchanged single stock-suite result. Named dependency hashes do not certify every installed package byte. Clinical, release and deployment approval remain separate.'};
 saveNew(join(state,'PLAN.json'),plan);
 return {state,roots:plan.stockPhysicalRootCount,shards:shards.length,planSha256:sha(readFileSync(join(state,'PLAN.json')))};
}
function loadPlan(state,expectedPlanSha){
 const path=join(state,'PLAN.json');regular(path);const bytes=readFileSync(path);
 assertPinnedPlanBytes(bytes,expectedPlanSha);const p=JSON.parse(bytes);
 assert.equal(p.schema,'vm-bounded-stock-campaign-proposal/1');assert.equal(p.source,source);
 assert.equal(p.sourceReceiptSha256,sourceReceiptSha);assert.equal(p.maxRoots,maxRoots);
 regular(reporterPath);assertReporterPin(p.reporter,reporterPath,sha(readFileSync(reporterPath)));
 verifyPlanShape(p.before.entries,p.execution,p.shards,p.before.files,state);
 return p;
}async function runShard(state,index,expectedPlanSha){
 const plan=loadPlan(state,expectedPlanSha),shard=plan.shards[index];assert(shard,'Unknown shard');
 assert(shard.roots.length>0&&shard.roots.length<=maxRoots);
 assert.equal(shard.rootSha256,sha(json(shard.roots)),'Shard plan changed');
 const dir=shardDir(state,index);
 // An existing directory is an unknown or terminal prior attempt. Never replay
 // it automatically, including after a supervisor observation timeout.
 assert(!existsSync(dir),`Shard ${index} already reserved; inspect terminal/liveness first`);
 const m=await modules();await snapshot(m,plan.before);
 mkdirSync(dir);saveNew(join(dir,'RESERVED.json'),{at:new Date().toISOString(),driverPid:process.pid,index,
  planSha256:expectedPlanSha,roots:shard.roots});
 const args=shardArgs(state,index,shard.roots);
 assert.equal(sha(json(args)),shard.argsSha256,'Shard argument drift');
 let child;
 const result=await m.runner.launch(source,dir,{args,onSpawn(proc){
  child=proc;proc.once('spawn',()=>saveNew(join(dir,'STARTED.json'),{at:new Date().toISOString(),index,
   driverPid:process.pid,childPid:proc.pid,args,planSha256:expectedPlanSha}));
 }});
 let after=null,postError=null;try{after=await snapshot(m,plan.before);}catch(error){postError=String(error);}
 const tapPath=join(dir,'child.tap'),tap=existsSync(tapPath)?readFileSync(tapPath,'utf8'):'';
 const tapCounts=terminalCounts(tap),eventsPath=join(dir,'events.jsonl');
 const structured=structuredEvidence(eventsPath,shard.roots),counts=structured.counts,drift=!!postError;
 const nativeSummaryMatchesTap=structured.summaryCount===1&&
  [['tests','tests'],['passed','pass'],['failed','fail'],['cancelled','cancelled'],
   ['skipped','skipped'],['todo','todo']].every(([native,tap])=>counts[native]===tapCounts[tap]);
 const terminal={schema:'vm-bounded-stock-shard-terminal/1',at:new Date().toISOString(),index,
  planSha256:expectedPlanSha,reporterSha256:plan.reporter.sha256,
  roots:shard.roots,rootSha256:shard.rootSha256,args,result,childPid:child?.pid??null,
  sourceAndDependencyStable:!drift,postError,postSnapshot:after?{
   sourceSha256:after.sourceSha256,entrySha256:after.entrySha256,
   dependenciesSha256:after.dependencies.sha256,preview:after.preview}:null,
  tapSha256:tap?sha(tap):null,eventsSha256:existsSync(eventsPath)?sha(readFileSync(eventsPath)):null,
  nativeSummaryMatchesTap,tapCounts,counts,rootEventAccounting:structured.roots,
  structuredSummaryCount:structured.summaryCount,fileSummaryCount:structured.fileSummaryCount,
  nativeSummarySuccess:structured.success,unattributedEventCount:structured.unattributedEventCount??null,
  passingClaim:result.exitCode===0&&!result.signal&&!drift&&structured.present&&
   structured.success===true&&nativeSummaryMatchesTap&&
   structured.roots.every(root=>root.attempted&&root.fileSummary?.success===true&&
    root.assertionCompletion==='native-file-summary-complete'&&!root.possibleFileLevelAbort)&&
   counts.tests>0&&counts.tests===counts.passed&&
   ['failed','cancelled','skipped','todo'].every(key=>counts[key]===0),
  limitation:'Global native summary totals are authoritative; file summaries distinguish attempted roots and assertion completion from file-level aborts. TAP point numbers are never summed. A completed shard is not a full stock-suite pass.'};
 saveNew(join(dir,'TERMINAL.json'),terminal);
 return {index,exitCode:result.exitCode,counts,passingClaim:terminal.passingClaim,postError};
}
async function finalize(state,expectedPlanSha){
 const plan=loadPlan(state,expectedPlanSha),m=await modules();await snapshot(m,plan.before);
 const terminals=[];
 for(const shard of plan.shards){
  const dir=join(state,`shard-${String(shard.index).padStart(3,'0')}`),path=join(dir,'TERMINAL.json');
  assert(existsSync(path),`Shard ${shard.index} has no terminal evidence; do not restart on observation timeout`);
  const t=readJSON(path);assert.equal(t.index,shard.index);
  assert.equal(t.planSha256,expectedPlanSha,'Terminal plan drift');
  assert.equal(t.reporterSha256,plan.reporter.sha256,'Terminal reporter drift');
  const eventsPath=join(dir,'events.jsonl'),tapPath=join(dir,'child.tap');
  assert.equal(t.eventsSha256,existsSync(eventsPath)?sha(readFileSync(eventsPath)):null,'Event receipt drift');
  assert.equal(t.tapSha256,existsSync(tapPath)?sha(readFileSync(tapPath)):null,'TAP receipt drift');
  const reread=structuredEvidence(eventsPath,shard.roots);same(t.counts,reread.counts,'Native summary count drift');
  same(t.rootEventAccounting,reread.roots,'Root event accounting drift');
  same(t.roots,shard.roots,'Terminal root drift');
  const expectedArgs=shardArgs(state,shard.index,shard.roots);
  assert.equal(sha(json(expectedArgs)),shard.argsSha256,'Shard argument pin drift');
  same(t.args,expectedArgs,'Terminal args drift');
  const startedPath=join(dir,'STARTED.json');
  if(existsSync(startedPath)){const started=readJSON(startedPath);
   assert.equal(started.planSha256,expectedPlanSha,'Started plan drift');
   same(started.args,expectedArgs,'Started args drift');
  }else assert.equal(t.passingClaim,false,'No STARTED proof for passing shard');
  assert.equal(t.rootSha256,shard.rootSha256);terminals.push({index:t.index,path,sha256:sha(readFileSync(path)),
   counts:t.counts,passingClaim:t.passingClaim,sourceAndDependencyStable:t.sourceAndDependencyStable});
 }
 const counts={};for(const t of terminals)for(const [key,value] of Object.entries(t.counts))counts[key]=(counts[key]??0)+value;
 const complete=terminals.length===plan.shards.length;
 const unskippedPass=complete&&terminals.every(t=>t.passingClaim);
 const receipt={schema:'vm-bounded-stock-campaign-summary/1',at:new Date().toISOString(),state,
  planSha256:expectedPlanSha,physicalRoots:plan.stockPhysicalRootCount,
  shards:terminals,counts,complete,unskippedPass,
  stockSuitePassingClaim:false,originalStockFailures:316,originalStockSkips:3,
  limitation:'This is bounded shard evidence, not an unchanged stock-suite pass, application acceptance, or clinical/release approval.'};
 saveNew(join(state,'SUMMARY.json'),receipt);return {complete,unskippedPass,counts,summarySha256:sha(readFileSync(join(state,'SUMMARY.json')))};
}
function args(argv){
 const [mode,stateArg,third,fourth,...rest]=argv;assert(!rest.length,'Unexpected arguments');
 assert(['plan','run-shard','finalize'].includes(mode),'Mode: plan | run-shard | finalize');
 assert(stateArg&&resolve(stateArg)!==source,'Supply a separate campaign state directory');
 const state=resolve(stateArg),localStaging=resolve('F:/VisibleMedicine/staging').toLowerCase();
 assert(state.toLowerCase().startsWith(localStaging+'\\'),'State must remain in local F staging');
 assert(!state.startsWith(source+'\\')&&!state.startsWith(source+'/'),'State cannot be inside source');
 if(mode==='plan'){assert(third===undefined&&fourth===undefined,'Plan takes no pin');return{mode,state};}
 if(mode==='run-shard'){
  assert(/^\d+$/.test(third??''),'Integer shard index required');
  assert.match(fourth??'',/^[a-f0-9]{64}$/,'Externally pinned PLAN SHA required');
  return {mode,state,index:Number(third),expectedPlanSha:fourth};
 }
 assert.match(third??'',/^[a-f0-9]{64}$/,'Externally pinned PLAN SHA required');
 assert(fourth===undefined,'Finalize takes one pinned SHA');
 return {mode,state,expectedPlanSha:third};
}if(process.argv[1]&&resolve(process.argv[1])===resolve(fileURLToPath(import.meta.url))){
 const {mode,state,index,expectedPlanSha}=args(process.argv.slice(2));
 const result=await (mode==='plan'?createCampaign(state):mode==='run-shard'?runShard(state,index,expectedPlanSha):finalize(state,expectedPlanSha));
 console.log(JSON.stringify(result));
}
export {verifyPlanShape,assertPinnedPlanBytes,assertReporterPin,terminalCounts};