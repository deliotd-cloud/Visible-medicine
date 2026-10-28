// Execute the complete old one-case cervical a01 root only in its authenticated epoch.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {execFileSync,spawnSync} from 'node:child_process';

const receiptPath='F:/VisibleMedicine/staging/20261026-body-contract-integration/SOURCE_CANDIDATE.json';
const receiptSha='9c3dee2e144e7f1778ea28ba0137b22ee083519026278fee247f2e16d05b8bd8';
const website='F:/VisibleMedicine/staging/20261026-body-contract-integration/website';
const atlas='F:/VisibleMedicine/staging/20261025-regional-title-native/atlas';
const atlasHead='a01ea4a00740dee0905204a33893761b8ae1ff1e';
const atlasTree='362941c8dd6348d985622c4a21686bbf14c135f7';
const root='tests/atlas-cervical-a01-current-delivery.test.mjs';
const rootSha='5fe782b276f564ff09d64fddadb564c24c831174362cade7ef62f7849c565bee';
const names=['six source-pinned cervical X-ray drafts reach learner, Review and four intact runtimes'];
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const git=(...args)=>execFileSync('git',['-C',atlas,...args],{encoding:'utf8',windowsHide:true,
 env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1',GIT_OPTIONAL_LOCKS:'0'}}).trim();

function checkedContext(){
 const receiptBytes=fs.readFileSync(receiptPath);
 assert.equal(sha(receiptBytes),receiptSha,'Exact a01 source receipt');
 const receipt=JSON.parse(receiptBytes);
 assert.equal(receipt.website,website);assert.equal(receipt.atlas,atlas);
 assert.equal(receipt.atlasHead,atlasHead);assert.equal(receipt.atlasTree,atlasTree);
 assert.equal(receipt.sourcePaths,6928);assert.equal(receipt.sourceRows.length,6928);
 const base=fs.realpathSync(website),prefix=base.toLowerCase()+path.sep,seen=new Set();
 for(const row of receipt.sourceRows){
  assert(typeof row.path==='string'&&!path.isAbsolute(row.path)&&!row.path.includes(':')&&
   !row.path.split(/[\\/]/).some(part=>!part||part==='.'||part==='..'),'Safe finite path');
  assert(!seen.has(row.path),'Unique source row');seen.add(row.path);
  const file=path.resolve(base,...row.path.split('/'));
  assert(file.toLowerCase().startsWith(prefix),'Historical path stays inside website');
  const stat=fs.lstatSync(file);
  assert(stat.isFile()&&!stat.isSymbolicLink(),'Regular historical source');
  assert(fs.realpathSync(file).toLowerCase().startsWith(prefix),'No linked source escape');
  const bytes=fs.readFileSync(file);
  assert.equal(bytes.length,row.bytes,'Exact historical source length: '+row.path);
  assert.equal(sha(bytes),row.sha256,'Exact historical source bytes: '+row.path);
 }
 assert.equal(receipt.dependencies.length,8);
 for(const dep of receipt.dependencies){
  assert.equal(sha(fs.readFileSync(dep.file)),dep.sha256,'Exact dependency package: '+dep.name);
  assert.equal(sha(fs.readFileSync(dep.entry)),dep.entrySha256,'Exact dependency entry: '+dep.name);
 }
 const row=receipt.sourceRows.find(item=>item.path===root);
 assert(row);assert.equal(row.sha256,rootSha);
 const original=fs.readFileSync(path.join(base,root));
 assert.equal(sha(original),rootSha);
 assert.deepEqual([...original.toString('utf8').matchAll(/^test\('([^']+)'/gm)].map(match=>match[1]),names,
  'Every original a01 case name and order');
 assert.equal(fs.realpathSync(git('rev-parse','--show-toplevel')).toLowerCase(),fs.realpathSync(atlas).toLowerCase());
 assert.equal(git('rev-parse','HEAD'),atlasHead);assert.equal(git('rev-parse','HEAD^{tree}'),atlasTree);
 assert.equal(git('status','--porcelain=v1'),'','Historical native source changed');
 return {base,original};
}

function completeTap(tap){
 assert.match(tap,/^TAP version 13\r?$/m);
 assert(!/^Bail out!/im.test(tap));
 const points=[...tap.matchAll(/^(not )?ok (\d+)(?:\s|$)/gm)];
 assert.equal(points.length,names.length,'All original top-level points');
 assert.deepEqual(points.map(point=>[point[1]??null,Number(point[2])]),names.map((_,i)=>[null,i+1]),
  'No failed, skipped or missing original points');
 const plans=[...tap.matchAll(/^1\.\.(\d+)\r?$/gm)];
 assert.equal(plans.length,1);assert.equal(Number(plans[0][1]),names.length);
 const counts={};
 for(const key of ['tests','pass','fail','cancelled','skipped','todo']){
  const matches=[...tap.matchAll(new RegExp('^# '+key+' (\\d+)\\r?$','gm'))];
  assert.equal(matches.length,1,'One terminal '+key);counts[key]=Number(matches[0][1]);
  assert(matches[0].index>plans[0].index,'Terminal counts follow plan');
 }
 assert.deepEqual(counts,{tests:1,pass:1,fail:0,cancelled:0,skipped:0,todo:0});
 assert(!/^(?:not )?ok \d+.*#\s*(?:skip|todo)\b/im.test(tap));
 return counts;
}

export function authenticatedCervicalA01Source(){return checkedContext().original;}

export function runCervicalA01Historical(){
 const before=checkedContext();
 const temp=process.env.TEMP;
 assert(temp&&path.isAbsolute(temp)&&path.parse(temp).root.toLowerCase().startsWith('f:')&&fs.statSync(temp).isDirectory(),
  'Historical child requires an existing F: temporary directory');
 const env={};
 for(const key of ['Path','SystemRoot','WINDIR','ComSpec','PATHEXT','OS','PROCESSOR_ARCHITECTURE','NUMBER_OF_PROCESSORS'])
  if(process.env[key]!==undefined)env[key]=process.env[key];
 Object.assign(env,{TEMP:temp,TMP:temp,TMPDIR:temp,VM_ATLAS_SOURCE_REPO:atlas,ATLAS_SOURCE_REPO:atlas,
  GIT_NO_REPLACE_OBJECTS:'1',GIT_OPTIONAL_LOCKS:'0',NODE_OPTIONS:'--max-old-space-size=768'});
 const args=['--experimental-strip-types','--test','--test-concurrency=1','--test-reporter=tap',root];
 const result=spawnSync(process.execPath,args,{cwd:before.base,env,encoding:'utf8',windowsHide:true,shell:false,maxBuffer:64*1024*1024});
 assert.equal(result.error,undefined,String(result.error));assert.equal(result.signal,null,'Historical child signalled');
 assert.equal(result.status,0,result.stderr+'\n'+result.stdout);
 const counts=completeTap(result.stdout);
 const after=checkedContext();assert(before.original.equals(after.original),'Original root changed during child');
 return {root,source:atlasHead,receiptSha256:receiptSha,counts,tapSha256:sha(Buffer.from(result.stdout)),
  clinicalApproval:false,releaseApproval:false};
}
