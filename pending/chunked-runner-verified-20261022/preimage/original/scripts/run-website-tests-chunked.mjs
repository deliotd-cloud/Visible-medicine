#!/usr/bin/env node
// Explicit opt-in composite evidence. The stock Website runner remains the release gate.
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {spawn} from 'node:child_process';
import {createWriteStream,existsSync,lstatSync,mkdirSync,readFileSync,readdirSync,renameSync,rmSync,writeFileSync} from 'node:fs';
import {dirname,join,relative,resolve,isAbsolute,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import {inventory,executionPlan} from './stock-website-test-inventory.mjs';
import {verifyPublicPreviewAssets} from './public-preview-preflight.mjs';
import {assertWebsiteTestHistory} from './website-test-history-preflight.mjs';
import {assertRootCoverage,assertSeal,digest,nativeCounts,partitionRoots,reusableCounts,seal,windowsCommandLength,WINDOWS_COMMAND_BUDGET} from './website-test-chunks.mjs';
import {assertInactive,inspectProcess,requireOwnIdentity} from './website-test-process.mjs';

const here=dirname(fileURLToPath(import.meta.url));
const batchName='website-test-chunks';
const sourceScripts=['run-website-tests-chunked.mjs','stock-website-test-inventory.mjs','website-test-chunks.mjs','website-test-process.mjs','public-preview-preflight.mjs','website-test-history-preflight.mjs'];
const stockRunnerSha256='9dc062a40d1a92c45c4d0d45ab02957b4f54a32af9d96f9e84ce06601d828a7a';
const shaFile=path=>digest(readFileSync(path));
const strictFile=path=>{const stat=lstatSync(path);assert(stat.isFile()&&!stat.isSymbolicLink(),`Nonregular evidence file: ${path}`);return readFileSync(path);};
function saveNew(path,value){writeFileSync(path,JSON.stringify(value,null,2)+'\n',{flag:'wx'});}
function sealed(value){return {...value,seal:seal(value)};}
function readSealed(path,label){const value=JSON.parse(strictFile(path));assertSeal(value,label);return value;}
function atomicNew(path,value){
  assert(!existsSync(path),`Evidence already exists: ${path}`);
  const temp=path+'.tmp-'+randomUUID();
  try{saveNew(temp,value);renameSync(temp,path);}finally{if(existsSync(temp))rmSync(temp);}
}
function directory(path){const stat=lstatSync(path);assert(stat.isDirectory()&&!stat.isSymbolicLink(),`Nonregular directory: ${path}`);}
function ensureDir(path){if(!existsSync(path))mkdirSync(path);directory(path);}
function inside(base,path){const rel=relative(base,path);assert(rel&&rel!=='..'&&!rel.startsWith('..'+sep)&&!isAbsolute(rel),`Path escaped batch: ${path}`);return rel;}
function envIdentity(){const env={...process.env};delete env.NODE_TEST_CONTEXT;return digest(Object.entries(env).sort(([a],[b])=>a.localeCompare(b)));}
function toolIdentity(){return Object.fromEntries(sourceScripts.map(name=>[name,shaFile(join(here,name))]));}
function sourceIdentity(snapshot,preview){return digest({entries:snapshot.entries,files:snapshot.files,sourceScope:snapshot.sourceScope,preview});}
function parse(argv){
  const result={mode:null,root:null,resume:null,chunkSize:null,stopAfter:null};
  for(let i=0;i<argv.length;i++){
    const key=argv[i];
    if(key==='--run'||key==='--resume'){
      assert(result.mode===null,'One mode required');result.mode=key.slice(2);
      if(key==='--resume'){assert(argv[i+1]&&!argv[i+1].startsWith('--'),'Resume batch directory required');result.resume=resolve(argv[++i]);}
    }else if(key==='--root'){
      assert(result.root===null&&argv[i+1]&&!argv[i+1].startsWith('--'),'One root required');result.root=resolve(argv[++i]);
    }else if(key==='--chunk-size'||key==='--stop-after'){
      assert(argv[i+1]&&/^\d+$/.test(argv[i+1]),`Positive ${key} required`);const value=Number(argv[++i]);
      assert(Number.isSafeInteger(value)&&value>0,`Positive ${key} required`);
      const field=key==='--chunk-size'?'chunkSize':'stopAfter';assert(result[field]===null,`Duplicate ${key}`);result[field]=value;
    }else throw Error(`Unknown argument ${key}`);
  }
  assert(result.mode&&result.root,'Explicit --run/--resume and --root required');
  assert(result.mode==='resume'||result.chunkSize!==null,'--run requires --chunk-size');
  assert(result.mode==='run'||result.chunkSize===null,'Resume uses the frozen chunk size');
  return result;
}
function batchRoot(root){return join(root,'.local',batchName);}
function argsFor(batch,index,roots,attempt='attempt-00000000-0000-4000-8000-000000000000'){
  const tap=join(batch,'attempts',`chunk-${String(index).padStart(4,'0')}`,attempt,'child.tap');
  return ['--test','--test-reporter=spec','--test-reporter-destination=stdout',
    '--test-reporter=tap',`--test-reporter-destination=${tap}`,'--experimental-strip-types','--test-concurrency=1',...roots];
}
function freeze(root,{preflight}={}){
  directory(root);
  const snapshot=inventory(root);
  const guard=preflight||(()=>({history:assertWebsiteTestHistory(root),preview:verifyPublicPreviewAssets(root),synthetic:false}));
  const result=guard(root,snapshot);
  assert(result&&Object.hasOwn(result,'preview')&&Object.hasOwn(result,'history'),'Preflight result required');
  if(result.synthetic!==true)assert.equal(shaFile(join(root,'scripts','run-website-tests.mjs')),stockRunnerSha256,'Default stock runner source changed');
  return {snapshot,preview:result.preview,history:result.history,synthetic:result.synthetic===true,
    identity:sourceIdentity(snapshot,result.preview)};
}
function assertFrozen(plan,root,{preflight}={}){
  assert.equal(resolve(root),plan.root,'Website root changed');
  assert.equal(process.execPath,plan.node.executable,'Node executable changed');
  assert.equal(process.version,plan.node.version,'Node version changed');
  assert.equal(process.platform,plan.node.platform,'Platform changed');
  assert.equal(process.arch,plan.node.arch,'Architecture changed');
  assert.equal(envIdentity(),plan.environmentSha256,'Process environment changed');
  assert.deepEqual(toolIdentity(),plan.toolHashes,'Chunked runner/helper bytes changed');
  const current=freeze(root,{preflight});
  assert.deepEqual(current.snapshot,plan.snapshot,'Named source inventory changed');
  assert.deepEqual(current.preview,plan.preview,'Public preview proof changed');
  assert.deepEqual(current.history,plan.history,'Website history proof changed');
  assert.equal(current.synthetic,plan.synthetic,'Preflight mode changed');
  assert.equal(current.identity,plan.inputIdentity,'Source or preview identity changed');
  return current;
}
function makePlan(root,batch,before,execution,chunkSize){
  const effective=assertRootCoverage(before.snapshot.entries,execution);
  const chunks=partitionRoots(effective,{chunkSize,executable:process.execPath,
    makeArgs:(roots,index)=>argsFor(batch,index,roots)});
  return sealed({schema:'vm-chunked-test-plan/1',batchId:batch.split(sep).at(-1),batch,root,
    createdAt:new Date().toISOString(),snapshot:before.snapshot,preview:before.preview,history:before.history,
    synthetic:before.synthetic,inputIdentity:before.identity,entryCount:before.snapshot.entries.length,
    execution:{executedRoots:execution.executedRoots,coveredByImport:execution.coveredByImport,mirror:execution.mirror},
    chunks:chunks.map((roots,index)=>({index,roots})),chunkSize,commandBudget:WINDOWS_COMMAND_BUDGET,
    node:{executable:process.execPath,version:process.version,platform:process.platform,arch:process.arch},
    environmentSha256:envIdentity(),toolHashes:toolIdentity(),
    claimLimit:'Sequential chunked composite evidence only; not an uninterrupted stock run, clinical/privacy approval or release acceptance.'});
}
function validatePlan(plan,batch,root){
  assertSeal(plan,'Batch plan');assert.equal(plan.schema,'vm-chunked-test-plan/1');
  assert.equal(plan.batch,batch);assert.equal(plan.root,root);assert.equal(plan.batchId,batch.split(sep).at(-1));
  assert.equal(plan.commandBudget,WINDOWS_COMMAND_BUDGET);
  assertRootCoverage(plan.snapshot.entries,plan.execution);
  const expected=partitionRoots(plan.execution.executedRoots,{chunkSize:plan.chunkSize,executable:plan.node.executable,
    makeArgs:(roots,index)=>argsFor(batch,index,roots)});
  assert.deepEqual(plan.chunks,expected.map((roots,index)=>({index,roots})),'Chunk plan changed');
  assert.equal(plan.inputIdentity,sourceIdentity(plan.snapshot,plan.preview));
}
function validateBatchPath(root,batch){
  const parent=batchRoot(root);directory(parent);inside(parent,batch);directory(batch);
  assert.equal(dirname(batch),parent,'Batch must be a direct local child');
}
function acquire(batch,inspector){
  const lock=join(batch,'active.json');
  if(existsSync(lock)){
    const stale=readSealed(lock,'Active runner lock');
    assertInactive(stale.runner,inspector,'Previous batch runner');
    renameSync(lock,join(batch,`inactive-${randomUUID()}.json`));
  }
  const runner=requireOwnIdentity(inspector);
  saveNew(lock,sealed({schema:'vm-chunked-runner-active/1',runner,createdAt:new Date().toISOString()}));
  return ()=>{if(existsSync(lock)){const current=readSealed(lock,'Active runner lock');assert.deepEqual(current.runner,runner);rmSync(lock);}};
}
function attemptPath(batch,index,id){return join(batch,'attempts',`chunk-${String(index).padStart(4,'0')}`,`attempt-${id}`);}
function inspectAttempts(plan,batch,inspector){
  const selected=new Map(),history=[];
  const attemptsRoot=join(batch,'attempts');ensureDir(attemptsRoot);
  const expectedDirs=plan.chunks.map(chunk=>`chunk-${String(chunk.index).padStart(4,'0')}`);
  for(const entry of readdirSync(attemptsRoot))assert(expectedDirs.includes(entry),`Foreign chunk directory: ${entry}`);
  for(const chunk of plan.chunks){
    const chunkDir=join(attemptsRoot,`chunk-${String(chunk.index).padStart(4,'0')}`);ensureDir(chunkDir);
    const attempts=readdirSync(chunkDir).sort();
    for(const name of attempts){
      assert(/^attempt-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(name),`Foreign attempt path: ${name}`);
      const path=join(chunkDir,name);inside(batch,path);directory(path);
      const allowed=new Set(['child.spec.log','child.tap','started.json','started.anchor.json','receipt.json','receipt.anchor.json']);
      for(const entry of readdirSync(path))
        assert(allowed.has(entry)||/^receipt\.json\.tmp-[0-9a-f-]{36}$/.test(entry),`Foreign attempt evidence: ${entry}`);
      const startedPath=join(path,'started.json'),receiptPath=join(path,'receipt.json');
      assert(!existsSync(join(path,'started.anchor.json'))||existsSync(startedPath),'Missing anchored start evidence');
      if(existsSync(startedPath)){
        const startAnchor=readSealed(join(path,'started.anchor.json'),'Attempt start anchor');
        assert.equal(startAnchor.startedSha256,shaFile(startedPath),'Attempt start bytes changed');
        const started=readSealed(startedPath,'Attempt start');
        assert.equal(started.schema,'vm-chunked-attempt-start/1');
        assert.equal(started.batchId,plan.batchId);assert.equal(started.chunkIndex,chunk.index);
        assert.equal(started.attemptId,name.slice(8));assert.deepEqual(started.roots,chunk.roots);
        assert.equal(started.cwd,plan.root);
        assert.deepEqual(started.args,argsFor(batch,chunk.index,chunk.roots,name));
        assertInactive(started.runner,inspector,'Prior attempt runner');
        assertInactive(started.child,inspector,'Prior test child');
      }
      if(!existsSync(receiptPath)){
        assert(!existsSync(join(path,'receipt.anchor.json')),'Missing anchored terminal receipt');
        assert(existsSync(startedPath),'Incomplete attempt has no recorded child identity; manual inspection required');
        history.push({chunkIndex:chunk.index,attemptId:name.slice(8),status:'incomplete'});continue;
      }
      const receiptAnchor=readSealed(join(path,'receipt.anchor.json'),'Attempt receipt anchor');
      assert.equal(receiptAnchor.receiptSha256,shaFile(receiptPath),'Attempt receipt bytes changed');
      const receipt=readSealed(receiptPath,'Attempt receipt');
      assert.equal(receipt.schema,'vm-chunked-attempt-receipt/1');
      assert.equal(receipt.batchId,plan.batchId);assert.equal(receipt.chunkIndex,chunk.index);
      assert.equal(receipt.attemptId,name.slice(8));assert.deepEqual(receipt.roots,chunk.roots);
      assert.equal(receipt.cwd,plan.root);assert.deepEqual(receipt.args,argsFor(batch,chunk.index,chunk.roots,name));
      assert.equal(receipt.inputBefore,plan.inputIdentity);assert.equal(receipt.inputAfter,plan.inputIdentity);
      assert.equal(receipt.previewBefore,digest(plan.preview));assert.equal(receipt.previewAfter,digest(plan.preview));
      assert(existsSync(startedPath)||receipt.spawnError,'Completed attempt lacks start evidence');
      for(const [field,file] of [['specSha256','child.spec.log'],['tapSha256','child.tap']]){
        assert.equal(receipt[field],digest(strictFile(join(path,file))),`Attempt ${field} or log changed`);
      }
      let counts=null,parseError=null;
      try{counts=nativeCounts(strictFile(join(path,'child.tap')).toString(),strictFile(join(path,'child.spec.log')).toString());}
      catch(error){parseError=String(error);}
      assert.deepEqual(receipt.counts,counts,'Native counts or receipt changed');
      assert.equal(receipt.parseError===null,parseError===null,'Native parse status changed');
      const reusable=counts!==null&&reusableCounts(counts,receipt.exitCode,receipt.signal)&&receipt.spawnError===null&&receipt.drift===false&&receipt.interrupted===false;
      assert.equal(receipt.reusable,reusable,'Reusable status changed');
      history.push({chunkIndex:chunk.index,attemptId:receipt.attemptId,status:reusable?'pass':'nonpass',exitCode:receipt.exitCode,signal:receipt.signal,counts});
      if(reusable){assert(!selected.has(chunk.index),'Ambiguous multiple passing attempts');selected.set(chunk.index,receipt);}
    }
  }
  return {selected,history};
}
async function launchChunk(plan,batch,chunk,inspector){
  const id=randomUUID(),path=attemptPath(batch,chunk.index,id),chunkDir=dirname(path);
  ensureDir(chunkDir);mkdirSync(path);
  const args=argsFor(batch,chunk.index,chunk.roots,`attempt-${id}`);
  assert(windowsCommandLength(process.execPath,args)<=WINDOWS_COMMAND_BUDGET,'Actual Windows command budget exceeded');
  const before=sourceIdentity(inventory(plan.root),plan.preview);
  assert.equal(before,plan.inputIdentity,'Input drift before child');
  const spec=createWriteStream(join(path,'child.spec.log'),{flags:'wx'});
  let child=null,childIdentity=null,spawnError=null,exitCode=null,signal=null,interrupted=false;
  const env={...process.env};delete env.NODE_TEST_CONTEXT;
  const runner=requireOwnIdentity(inspector);
  try{
    child=spawn(process.execPath,args,{cwd:plan.root,env,windowsHide:true,shell:false,stdio:['ignore','pipe','pipe']});
    child.stdout.pipe(spec,{end:false});child.stderr.pipe(spec,{end:false});
    const tapFile=args.find(arg=>arg.startsWith('--test-reporter-destination=')&&arg.endsWith('child.tap'));
    assert(tapFile,'Native TAP destination absent');
    childIdentity=inspector(child.pid);
    assert(childIdentity?.state==='alive','Cannot establish test-child process identity');
    const startedPath=join(path,'started.json');
    saveNew(startedPath,sealed({schema:'vm-chunked-attempt-start/1',batchId:plan.batchId,
      chunkIndex:chunk.index,attemptId:id,roots:chunk.roots,args,cwd:plan.root,runner,child:childIdentity,
      startedAt:new Date().toISOString()}));
    saveNew(join(path,'started.anchor.json'),sealed({schema:'vm-chunked-start-anchor/1',startedSha256:shaFile(startedPath)}));
    const forward=s=>{if(child&&!child.killed)child.kill(s);};
    const onInt=()=>{interrupted=true;forward('SIGINT');},onTerm=()=>{interrupted=true;forward('SIGTERM');};
    process.on('SIGINT',onInt);process.on('SIGTERM',onTerm);
    try{const result=await new Promise(resolve=>{child.once('error',error=>resolve({exitCode:1,signal:null,error:String(error)}));child.once('close',(code,sig)=>resolve({exitCode:code??1,signal:sig??null,error:null}));});
      exitCode=result.exitCode;signal=result.signal;spawnError=result.error;
    }finally{process.off('SIGINT',onInt);process.off('SIGTERM',onTerm);}
  }catch(error){
    spawnError=String(error);exitCode=1;
    if(child&&!child.killed)child.kill('SIGTERM');
    if(child&&child.exitCode===null&&child.signalCode===null)
      await new Promise(resolve=>child.once('close',resolve));
  }
  await new Promise(resolve=>spec.end(resolve));
  // Failed spawn can leave an empty TAP placeholder, which is still immutable evidence.
  const tapPath=join(path,'child.tap');if(!existsSync(tapPath))writeFileSync(tapPath,'',{flag:'wx'});
  const specBytes=strictFile(join(path,'child.spec.log')),tapBytes=strictFile(tapPath);
  let counts=null,parseError=null;
  try{counts=nativeCounts(tapBytes.toString(),specBytes.toString());}catch(error){parseError=String(error);}
  let after=null,drift=false;
  try{after=freeze(plan.root,{preflight:plan._preflight});drift=after.identity!==plan.inputIdentity;}
  catch(error){drift=true;parseError=(parseError?parseError+'; ':'')+'post-attempt '+String(error);}
  const receipt=sealed({schema:'vm-chunked-attempt-receipt/1',batchId:plan.batchId,chunkIndex:chunk.index,attemptId:id,
    roots:chunk.roots,args,cwd:plan.root,runner,child:childIdentity,exitCode,signal,spawnError,
    counts,parseError,inputBefore:before,inputAfter:after?.identity??null,
    previewBefore:digest(plan.preview),previewAfter:after?digest(after.preview):null,
    specSha256:digest(specBytes),tapSha256:digest(tapBytes),drift,interrupted,
    reusable:!drift&&!interrupted&&counts!==null&&reusableCounts(counts,exitCode,signal)&&spawnError===null,
    finishedAt:new Date().toISOString()});
  const receiptPath=join(path,'receipt.json');
  atomicNew(receiptPath,receipt);
  saveNew(join(path,'receipt.anchor.json'),sealed({schema:'vm-chunked-receipt-anchor/1',receiptSha256:shaFile(receiptPath)}));
  return receipt;
}
function finalResult(plan,batch,selected,history,complete){
  const counts={tests:0,pass:0,fail:0,cancelled:0,skipped:0,todo:0};
  for(const receipt of selected.values())for(const key of Object.keys(counts))counts[key]+=receipt.counts[key];
  const result=sealed({schema:'vm-chunked-composite-result/1',batchId:plan.batchId,batch,root:plan.root,
    status:complete?'composite-pass':'incomplete-or-failed',compositePassingClaim:complete,
    stockUninterruptedPassingClaim:false,sourceIdentity:plan.inputIdentity,plannedRoots:plan.snapshot.entries.length,
    effectiveRoots:plan.execution.executedRoots.length,importCoveredRoots:plan.execution.coveredByImport,
    selected:[...selected.entries()].sort(([a],[b])=>a-b).map(([chunkIndex,receipt])=>({chunkIndex,attemptId:receipt.attemptId,counts:receipt.counts})),
    attemptHistory:history,counts,clinicalApproval:false,privacyApproval:false,releaseAcceptance:false,
    scope:'Sequential native child receipts under one frozen source/preview/tool identity. Different process isolation from stock uninterrupted release run.',
    createdAt:new Date().toISOString()});
  saveNew(join(batch,`composite-${randomUUID()}.json`),result);
  return result;
}
export async function main(argv=process.argv.slice(2),{preflight,inspector=inspectProcess}={}){
  const cli=parse(argv),root=cli.root;
  const before=freeze(root,{preflight});
  let batch,plan;
  if(cli.mode==='run'){
    const parent=batchRoot(root);ensureDir(join(root,'.local'));ensureDir(parent);
    batch=join(parent,`batch-${new Date().toISOString().replace(/[:.]/g,'-')}-${randomUUID()}`);mkdirSync(batch);mkdirSync(join(batch,'attempts'));
    const execution=await executionPlan(before.snapshot,batch);
    assert.equal(sourceIdentity(inventory(root),before.preview),before.identity,'Input changed during mirror probe');
    plan=makePlan(root,batch,before,execution,cli.chunkSize);
    saveNew(join(batch,'plan.json'),plan);
    saveNew(join(batch,'anchor.json'),sealed({schema:'vm-chunked-plan-anchor/1',batchId:plan.batchId,planSha256:shaFile(join(batch,'plan.json'))}));
  }else{
    batch=cli.resume;validateBatchPath(root,batch);
    plan=readSealed(join(batch,'plan.json'),'Batch plan');
    const anchor=readSealed(join(batch,'anchor.json'),'Plan anchor');
    assert.equal(anchor.schema,'vm-chunked-plan-anchor/1');assert.equal(anchor.batchId,plan.batchId);
    assert.equal(anchor.planSha256,shaFile(join(batch,'plan.json')),'Plan or anchor changed');
    validatePlan(plan,batch,root);
    assertFrozen(plan,root,{preflight});
  }
  const release=acquire(batch,inspector);
  try{
    const state=inspectAttempts(plan,batch,inspector);
    let launched=0,paused=false,failed=false;
    for(const chunk of plan.chunks){
      if(state.selected.has(chunk.index))continue;
      assertFrozen(plan,root,{preflight});
      const receipt=await launchChunk({...plan,_preflight:preflight},batch,chunk,inspector);
      state.history.push({chunkIndex:chunk.index,attemptId:receipt.attemptId,status:receipt.reusable?'pass':'nonpass',exitCode:receipt.exitCode,signal:receipt.signal,counts:receipt.counts});
      if(receipt.reusable)state.selected.set(chunk.index,receipt);else{failed=true;break;}
      launched++;
      if(cli.stopAfter!==null&&launched>=cli.stopAfter){paused=true;break;}
    }
    assertFrozen(plan,root,{preflight});
    const complete=!failed&&!paused&&state.selected.size===plan.chunks.length;
    const composite=finalResult(plan,batch,state.selected,state.history,complete);
    console.log(JSON.stringify({batch,status:composite.status,compositePassingClaim:complete,counts:composite.counts,selectedChunks:state.selected.size,plannedChunks:plan.chunks.length}));
    return complete?0:paused?2:1;
  }finally{release();}
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))
  main().then(code=>{process.exitCode=code;},error=>{console.error(String(error));process.exitCode=1;});
