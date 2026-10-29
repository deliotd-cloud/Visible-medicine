// Preserve the complete original assertions in their authenticated source context.
// Separate *-current-source tests cover the current imported Atlas delivery.
import assert from 'node:assert/strict';
import {spawnSync,execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {closeSync,lstatSync,openSync,readFileSync,readSync,realpathSync} from 'node:fs';
import {resolve,relative,isAbsolute,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';

const site=fileURLToPath(new URL('../',import.meta.url));
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const json=file=>JSON.parse(readFileSync(file));
function verifiedFile(file,expected){
 const stat=lstatSync(file);assert(stat.isFile()&&!stat.isSymbolicLink(),file+': regular file');
 assert.equal(stat.size,expected.bytes,file+': size');
 const hash=createHash('sha256'),buffer=Buffer.allocUnsafe(65536),fd=openSync(file,'r');
 try{for(;;){const n=readSync(fd,buffer,0,buffer.length,null);if(!n)break;hash.update(buffer.subarray(0,n));}}
 finally{closeSync(fd);}
 assert.equal(hash.digest('hex'),expected.sha256,file+': bytes');
}
function confined(root,name){
 const file=resolve(root,name),rel=relative(resolve(root),file);
 assert(rel&&!rel.startsWith('..')&&!isAbsolute(rel),'Historical source row outside root: '+name);
 return file;
}

export function replayHistoricalReview(rootName){
 const context=json(resolve(site,'tests/fixtures/review-delivery-historical-contexts.json'));
 assert.equal(context.schema,'vm-review-delivery-historical-contexts/1');
 const spec=context.roots.find(row=>row.root===rootName);assert(spec,'Unknown historical root');
 const selected=context.receipts.find(row=>row.path===spec.receipt);assert(selected);
 assert.equal(selected.sha256,spec.receiptSha256);
 // Historical tests read these explicit ancestor sources as well as their own site.
 const receipts=rootName==='tests/review-history-delivery.test.mjs'
  ?[selected]:context.receipts.filter(row=>row.path!==context.roots[0].receipt);
 for(const row of receipts){
  const bytes=readFileSync(row.path);assert.equal(sha(bytes),row.sha256,row.path);
  const receipt=JSON.parse(bytes);assert.equal(receipt.sourceRows.length,row.rows,row.path);
  assert.equal(receipt.website??receipt.atlas,row.root,row.path);
  const paths=new Set();
  for(const input of receipt.sourceRows){assert(!paths.has(input.path));paths.add(input.path);verifiedFile(confined(row.root,input.path),input);}
 }
 const receipt=json(spec.receipt);assert.equal(receipt.website,spec.website);
 assert.equal(receipt.atlasHead,spec.atlasHead);assert.equal(receipt.atlasTree,spec.atlasTree);
 assert.equal(sha(readFileSync(confined(site,spec.fixture))),spec.sha256,'Original assertion fixture');
 assert.equal(sha(readFileSync(confined(spec.website,spec.root))),spec.sha256,'Unchanged executable original');
 assert.equal(realpathSync(resolve(spec.website,'node_modules')),realpathSync(resolve(site,'node_modules')),'Bound replay dependencies');
 for(const input of context.dependencies)verifiedFile(input.file,input);
 assert.equal(process.version,context.node.version,'Bound replay Node version');
 assert.equal(sha(readFileSync(process.execPath)),context.node.sha256,'Bound replay Node bytes');
 const git=(...args)=>execFileSync('git',['--no-replace-objects','-C',context.gitHistoryRepository,...args],{
  encoding:'utf8',windowsHide:true,env:{...process.env,GIT_OPTIONAL_LOCKS:'0'}}).trim();
 assert.equal(git('rev-parse',spec.atlasHead+'^{commit}'),spec.atlasHead);
 assert.equal(git('rev-parse',spec.atlasHead+'^{tree}'),spec.atlasTree);
 const env={...process.env,VM_ATLAS_SOURCE_REPO:spec.atlas,GIT_NO_REPLACE_OBJECTS:'1',GIT_OPTIONAL_LOCKS:'0',
  GOMEMLIMIT:'64MiB',GOMAXPROCS:'1',RAYON_NUM_THREADS:'1',NO_COLOR:'1'};
 delete env.NODE_TEST_CONTEXT;delete env.VM_CURRENT_SOURCE_RECEIPT;delete env.VM_CURRENT_SOURCE_SHA256;
 const run=spawnSync(process.execPath,['--max-old-space-size=1536','--test',spec.root],{
  cwd:spec.website,env,windowsHide:true,encoding:'utf8',maxBuffer:16e6,timeout:20*60*1000});
 assert.ifError(run.error);assert.equal(run.signal,null);
 assert.equal(run.status,0,`Historical ${spec.root} failed:\n${run.stdout}\n${run.stderr}`);
 for(const [key,count] of Object.entries({tests:spec.tests,pass:spec.tests,fail:0,cancelled:0,skipped:0,todo:0}))
  assert.match(run.stdout,new RegExp('(?:^|\\n)[#ℹ] '+key+' '+count+'\\r?(?:\\n|$)'),key);
 return {root:spec.root,tests:spec.tests,pass:spec.tests,source:spec.atlasHead};
}
