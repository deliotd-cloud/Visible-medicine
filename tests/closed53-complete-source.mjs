// Source-text closure for the immutable website53 delivery. No current-file reads here.
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';

export const REVISION53_SOURCE='6ba0dd43c0512ce8d5b0dae7150ae605f176c2fb';
export const REVISION53_REVIEW='533ddf192b09b191aef129223f0d10d87c9c18ba669d963b43d09f76ff6a2fc4';
export const REVISION53_EPOCH_SHA='963b7b46ee4215f91a47cf133a77a0d597613dea416b124c76f4d530dedfc11f';
export const REVISION53_BACKUP_COMMIT='86e64291f07677e9d2e2c4612a5070f2cc98e9ec';
export const REVISION53_BACKUP_TREE='bb23397b4f4200cb222ab24c111e163b9612b431';
export const REVISION53_ATLAS_TREE='4ce7882a2748d2f190e4b4f8783af6416c7cf44b';
export const REVISION53_BACKUP_FIXTURE_SHA='1d9367cb329f3c6c550aee20cae0bf0eac5a19c0a4d678c6c57e7cfdda75f5f5';
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const textSuffix=/\.(?:ts|tsx|css|json|mjs|md|txt|html)$/;
const gitOptions={windowsHide:true,maxBuffer:64*1024*1024,
 env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}};

export function assert53TextPath(path){
 assert(typeof path==='string'&&path.length>0&&path.length<=320&&/^[A-Za-z0-9_./-]+$/.test(path),
  'Closed53 path is not canonical source text');
 assert(!path.split('/').some(part=>!part||part==='.'||part==='..')&&textSuffix.test(path),
  'Closed53 path is not declared text');
 return path;
}
export function assert53Text(bytes,expectedSha,label){
 assert(Buffer.isBuffer(bytes)&&bytes.length>0&&bytes.length<=3_000_000,label+': text byte bound');
 assert.equal(sha(bytes),expectedSha,label+': exact declared SHA-256');
 assert(Buffer.from(bytes.toString('utf8'),'utf8').equals(bytes),label+': UTF-8 source text only');
 assert(!bytes.includes(0),label+': NUL is not source text');
 return bytes;
}
export function declaredRevision53Inputs(primaryBytes){
 assert.equal(sha(primaryBytes),REVISION53_EPOCH_SHA,'Frozen53 epoch identity');
 const primary=JSON.parse(primaryBytes);
 assert.equal(primary.schema,'vm-closed-delivery-json-text-epoch-1');
 assert.equal(primary.source,REVISION53_SOURCE);
 assert.equal(primary.review,REVISION53_REVIEW);
 assert.equal(primary.files.length,26);
 const inputRow=primary.files.find(row=>row.path==='atlas-review/integration-inputs.json');
 assert(inputRow,'Frozen53 integration inputs');
 const inputBytes=Buffer.from(inputRow.text,'utf8');
 assert.equal(inputBytes.length,inputRow.bytes);
 assert53Text(inputBytes,inputRow.sha256,inputRow.path);
 const inputs=JSON.parse(inputBytes).inputs;
 assert.equal(inputs.length,1658);
 assert.equal(sha(JSON.stringify(inputs)),REVISION53_REVIEW);
 const declared=new Map();
 for(const row of inputs){
  assert53TextPath(row.path);
  assert.match(row.sha256,/^[a-f0-9]{64}$/);
  assert(!declared.has(row.path),'Duplicate frozen53 input');
  declared.set(row.path,row);
 }
 assert.equal(declared.size,1658);
 return {primary,declared};
}
export function validateRevision53Completion(primaryBytes,existingRecords,backupFixtureBytes){
 const {declared}=declaredRevision53Inputs(primaryBytes);
 assert.equal(sha(backupFixtureBytes),REVISION53_BACKUP_FIXTURE_SHA,'Exact website53 backup text fixture');
 const fixture=JSON.parse(backupFixtureBytes);
 assert.equal(fixture.schema,'vm-closed53-website-text-closure-1');
 assert.equal(fixture.primaryEpochSha256,REVISION53_EPOCH_SHA);
 assert.equal(fixture.source,REVISION53_SOURCE);
 assert.equal(fixture.review,REVISION53_REVIEW);
 assert.deepEqual(fixture.provenance,{
  repository:'https://github.com/deliotd-cloud/Visible-medicine.git',
  commit:REVISION53_BACKUP_COMMIT,
  tree:REVISION53_BACKUP_TREE,
  scope:'Exact declared source-only website53 text; no clinical or current-delivery admission.',
 });
 assert(Array.isArray(fixture.files)&&fixture.files.length===226,'Exact backup53 record count');
 assert(existingRecords instanceof Map&&existingRecords.size===37,'Original26 plus supplement11 unchanged');
 const frozen=new Set();
 for(const [path,row]of existingRecords){
  assert53TextPath(path);
  assert.equal(path,row.path);
  const original=declared.get(path);
  if(!original)continue;
  assert53Text(Buffer.from(row.text,'utf8'),original.sha256,path+': earlier frozen record');
  frozen.add(path);
 }
 assert.equal(frozen.size,15,'Original declared frozen53 record count');
 const backup=new Map();
 let prior='';
 for(const row of fixture.files){
  const path=assert53TextPath(row.path);
  assert(path>prior,'Backup53 paths must be unique and sorted');
  prior=path;
  assert(!existingRecords.has(path),'Backup53 cannot replace earlier frozen evidence');
  const declaredRow=declared.get(path);
  assert(declaredRow,'Backup53 path is not an original input');
  assert.equal(row.sha256,declaredRow.sha256,path+': declared hash');
  const bytes=Buffer.from(row.text,'utf8');
  assert.equal(bytes.length,row.bytes,path+': archived byte count');
  assert53Text(bytes,row.sha256,path+': archived source');
  backup.set(path,bytes);
 }
 assert.equal(backup.size,226);
 const atlasRows=[];
 for(const [path,row]of declared){
  if(frozen.has(path)||backup.has(path))continue;
  assert(path.startsWith('atlas-review/'),'Unclosed website53 source: '+path);
  const atlasPath=assert53TextPath(path.slice('atlas-review/'.length));
  atlasRows.push({path,gitPath:atlasPath,sha256:row.sha256});
 }
 assert.equal(atlasRows.length,1417,'Exact Atlas6ba source-text count');
 assert.equal(frozen.size+backup.size+atlasRows.length,declared.size,'Disjoint original53 closure');
 return {declared,frozen,backup,atlasRows};
}
export function readExactGit53TextBatch(repoArgs,revision,rows){
 assert(Array.isArray(repoArgs)&&repoArgs.length===2);
 assert((repoArgs[0]==='-C'||repoArgs[0]==='--git-dir')&&typeof repoArgs[1]==='string');
 assert.match(revision,/^[a-f0-9]{40}$/);
 assert(Array.isArray(rows)&&rows.length>0&&rows.length<=1417);
 const specs=rows.map(row=>{
  assert53TextPath(row.path);
  assert53TextPath(row.gitPath);
  assert.match(row.sha256,/^[a-f0-9]{64}$/);
  return revision+':'+row.gitPath;
 });
 const output=execFileSync('git',[...repoArgs,'cat-file','--batch'],{
  ...gitOptions,input:Buffer.from(specs.join('\n')+'\n','utf8'),
 });
 const results=new Map();
 let offset=0,total=0;
 for(const row of rows){
  const end=output.indexOf(10,offset);
  assert(end>=0,'Incomplete Git blob header: '+row.path);
  const header=output.subarray(offset,end).toString('ascii');
  const match=/^([a-f0-9]{40}) blob ([0-9]+)$/.exec(header);
  assert(match,'Missing or non-blob Git source: '+row.path);
  const bytes=Number(match[2]);
  assert(Number.isSafeInteger(bytes)&&bytes>0&&bytes<=2_000_000,'Git text byte bound: '+row.path);
  const start=end+1,stop=start+bytes;
  assert(stop<output.length&&output[stop]===10,'Incomplete Git blob body: '+row.path);
  const body=output.subarray(start,stop);
  const gitOid=createHash('sha1').update('blob '+bytes+'\0').update(body).digest('hex');
  assert.equal(gitOid,match[1],row.path+': Git blob identity');
  assert53Text(body,row.sha256,row.path+': immutable Git text');
  assert(!results.has(row.path),'Duplicate Git text path');
  results.set(row.path,Buffer.from(body));
  total+=bytes;assert(total<=32_000_000,'Git batch exceeds closed53 text budget');
  offset=stop+1;
 }
 assert.equal(offset,output.length,'Unexpected Git batch output');
 assert.equal(results.size,rows.length);
 return results;
}
