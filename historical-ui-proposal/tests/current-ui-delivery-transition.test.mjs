// Historical 2381→9e transition. Execute its complete original three-case source
// against the exact 9e website and clean native Atlas epoch, never today's pin.
import assert from 'node:assert/strict';
import test from 'node:test';
import {createHash} from 'node:crypto';
import {createReadStream,readFileSync,lstatSync,realpathSync} from 'node:fs';
import {spawnSync,execFileSync} from 'node:child_process';
import {resolve,sep} from 'node:path';

const oldWebsite='F:/VisibleMedicine/staging/20261023-head-pan-bound/website';
const oldAtlas='F:/VisibleMedicine/staging/20261023-atlas-runtime-materialized/atlas';
const gitBinary='C:/Program Files/Git/cmd/git.exe';
const gitBinarySha='22fead8244ef3a7225fb800099a4e43eca8bcec0466774917669599c2f19a05a';
const receiptPath='F:/VisibleMedicine/staging/20261023-head-pan-bound/SOURCE_BOUND.json';
const receiptSha='d41eecb7d72f96eaa52b4ac494646e58cbd075f32ad337b26d309ff277fa1d2a';
const oldTestSha='d7d18ae9b36cd593475998420137b7611695aba5a12053abe12fb0c18c27b696';
const oldSource='9e1407629bd6f85061537c9f013fd72e4543e0da';
const oldTree='9404fb39a8b08aff7ef5300d2ef963abd5639045';
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const frozen=new URL('./fixtures/historical-current-ui-9e14/current-ui-delivery-transition.test.mjs.raw',import.meta.url);
const git=(...args)=>execFileSync(gitBinary,args,{cwd:oldAtlas,encoding:'utf8',windowsHide:true,
 env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1',GIT_OPTIONAL_LOCKS:'0'}}).trim();

async function checkedSourceClosure(receipt){
 assert.equal(receipt.website,oldWebsite);
 assert.equal(receipt.atlas,oldAtlas);
 assert.equal(receipt.atlasHead,oldSource);assert.equal(receipt.atlasTree,oldTree);
 assert.equal(receipt.sourcePaths,6162);assert.equal(receipt.sourceRows.length,6162);
 assert.equal(sha(readFileSync(receipt.parentReceipt)),receipt.parentReceiptSha256,'Exact parent source receipt');
 const root=realpathSync(oldWebsite),prefix=root.toLowerCase()+sep,seen=new Set();
 for(const row of receipt.sourceRows){
  assert.deepEqual(Object.keys(row).sort(),['bytes','path','sha256']);
  assert.match(row.path,/^[A-Za-z0-9_.\/[\]-]+$/);
  assert(!row.path.split('/').some(part=>!part||part==='.'||part==='..'),'Safe source path');
  assert(!seen.has(row.path),'Unique source row: '+row.path);seen.add(row.path);
  assert(Number.isSafeInteger(row.bytes)&&row.bytes>=0);
  assert.match(row.sha256,/^[a-f0-9]{64}$/);
  const file=resolve(root,...row.path.split('/'));
  assert(file.toLowerCase().startsWith(prefix),'Source path inside historical website');
  const stat=lstatSync(file);
  assert(stat.isFile()&&!stat.isSymbolicLink(),'Regular source file: '+row.path);
  assert(realpathSync(file).toLowerCase().startsWith(prefix),'No parent-link escape: '+row.path);
  assert.equal(stat.size,row.bytes,'Source byte length: '+row.path);
  const digest=createHash('sha256');
  for await(const chunk of createReadStream(file,{highWaterMark:65536}))digest.update(chunk);
  assert.equal(digest.digest('hex'),row.sha256,'Exact source bytes: '+row.path);
 }
 for(const row of receipt.overlayRows){
  assert(seen.has(row.path),'Overlay included in complete source closure: '+row.path);
  const source=receipt.sourceRows.find(entry=>entry.path===row.path);
  assert.equal(source.sha256,row.sha256,'Overlay SHA agrees with source closure: '+row.path);
  assert.equal(source.bytes,row.bytes,'Overlay length agrees with source closure: '+row.path);
 }
}

function tapCount(output,name){
 const matches=[...output.matchAll(new RegExp(`^# ${name} (\\d+)$`,'gm'))];
 assert.equal(matches.length,1,`One TAP ${name} summary`);
 return Number(matches[0][1]);
}

async function checkedHistoricalContext(){
 assert.equal(sha(readFileSync(gitBinary)),gitBinarySha,'Exact Git command dependency');
 const firstGit=execFileSync('where.exe',['git'],{encoding:'utf8',windowsHide:true}).trim().split(/\r?\n/)[0];
 assert.equal(realpathSync(firstGit).toLowerCase(),realpathSync(gitBinary).toLowerCase(),'Original helper resolves pinned Git first');
 assert.equal(execFileSync(gitBinary,['--version'],{encoding:'utf8',windowsHide:true}).trim(),
  'git version 2.55.0.windows.2','Git command version');
 const original=readFileSync(frozen),historical=readFileSync(resolve(oldWebsite,'tests/current-ui-delivery-transition.test.mjs'));
 assert.equal(sha(original),oldTestSha,'Complete original three-case source');
 assert.deepEqual(historical,original,'Historical checkout still has the exact original source');
 const receiptBytes=readFileSync(receiptPath);assert.equal(sha(receiptBytes),receiptSha,'Exact source-bound receipt');
 const receipt=JSON.parse(receiptBytes);
 assert.equal(git('rev-parse','--show-toplevel').toLowerCase().replaceAll('\\','/'),
  realpathSync(oldAtlas).toLowerCase().replaceAll('\\','/'),'Exact native repository root');
 assert.equal(git('rev-parse','HEAD'),oldSource);assert.equal(git('rev-parse','HEAD^{tree}'),oldTree);
 assert.equal(git('status','--porcelain'),'','Clean native 9e source');
 await checkedSourceClosure(receipt);
 for(const [path,digest]of [
  ['tests/current-atlas-delivery.mjs','52551fd5ec16154a78b94f78e0cdfbfee6a1bea629f70714f3dd5f93ccb81bb5'],
  ['tests/fixtures/current-atlas-delivery.json','e94dcf1c490f37b9cba6723fb9ef3a0ab0b872a2e3a18d29a6b1d37b8f24a9cf'],
  ['tests/fixtures/current-ui-delivery-before-9e14/contract.test.mjs.raw','7f745b24ac233d3d9fca6b80a54e5387f2dc50eafa45a372cdb615520473b8b8'],
  ['tests/fixtures/current-ui-delivery-before-9e14/validator.mjs.raw','52551fd5ec16154a78b94f78e0cdfbfee6a1bea629f70714f3dd5f93ccb81bb5'],
  ['tests/fixtures/current-ui-delivery-before-9e14/pin.json.raw','9313b2135cb50648751e50e49643479ec8bf83f2fe4f787bc2c25d4a632302a1'],
 ])assert.equal(sha(readFileSync(resolve(oldWebsite,path))),digest,path);
 return original;
}

test('complete original 2381-to-9e current UI transition runs in its exact historical context',async()=>{
 const original=await checkedHistoricalContext();
 const names=[...original.toString().matchAll(/^test\(['"]([^'"]+)['"]/gm)].map(match=>match[1]);
 assert.deepEqual(names,[
  'exact captured delivery identifies the coherent source without an approval field',
  'all original tests and validator survive only five observed source/tree/runtime/count seams',
  'the exact complete predecessor is retained as history and cannot admit this candidate',
 ]);
 const result=spawnSync(process.execPath,['--test','--test-reporter=tap','tests/current-ui-delivery-transition.test.mjs'],{
  cwd:oldWebsite,windowsHide:true,maxBuffer:16*1024*1024,timeout:300000,
  env:{...process.env,VM_ATLAS_SOURCE_REPO:oldAtlas,ATLAS_SOURCE_REPO:oldAtlas,GIT_NO_REPLACE_OBJECTS:'1',GIT_OPTIONAL_LOCKS:'0'},
 });
 let postContextError=null;
 try{assert.deepEqual(await checkedHistoricalContext(),original,'Same whole original source after historical execution');}
 catch(error){postContextError=error;}
 const stdout=result.stdout??Buffer.alloc(0),stderr=result.stderr??Buffer.alloc(0);
 const tap=stdout.toString('utf8');
 const diagnostics=`${tap.slice(-8000)}\n${stderr.toString('utf8').slice(-2000)}`;
 const reported=name=>{const rows=[...tap.matchAll(new RegExp(`^# ${name} (\\d+)$`,'gm'))];return rows.length===1?Number(rows[0][1]):null;};
 process.stdout.write('# historical-ui-replay '+JSON.stringify({
  schema:'vm-historical-ui-replay/1',outerCases:1,originalRegisteredCases:3,
  childTapSha256:sha(stdout),childTapBytes:stdout.length,childStatus:result.status,childSignal:result.signal,
  childError:result.error?.code??null,childReportedTests:reported('tests'),childReportedPass:reported('pass'),
  postContextVerified:postContextError===null,
 })+'\n');
 if(postContextError)throw postContextError;
 assert.ifError(result.error);
 assert.equal(result.signal,null,diagnostics);
 assert.equal(result.status,0,diagnostics);
 assert.equal(tapCount(tap,'tests'),3,diagnostics);
 assert.equal(tapCount(tap,'pass'),3,diagnostics);
 for(const name of ['fail','cancelled','skipped','todo'])assert.equal(tapCount(tap,name),0,diagnostics);
});
