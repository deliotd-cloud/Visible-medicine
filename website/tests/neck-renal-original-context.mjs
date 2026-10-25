// Historical Website roots are authenticated source snapshots; their Atlas inputs are separate Git commits.
import assert from 'node:assert/strict';
import {spawn,execFileSync} from 'node:child_process';
import {createHash,randomUUID} from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';
import {finished} from 'node:stream/promises';
import {CURRENT_ATLAS_REVISION,currentAtlasDeliveryRoot,validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';
import {assertCompleteOriginal} from './deepbrain-foot-roles.mjs';

const configSha='2943f9125f675bcb62980ae5fcfa40358e95adc6ee23aac3d17d2bef4b2ae579';
const current='727ed5b451ae940a01e56272c8fbc703ea3b0095';
const roles={
  'neck-landmark':{group:'neck',file:'atlas-neck-landmark-xray.test.mjs',cases:1,
    sha:'7005d5e150cd06a1068e2d8124a4cb47ade962703eee7865b77f0edcccd2d500'},
  'neck-transition':{group:'neck',file:'atlas-neck-xray-delivery-transition.test.mjs',cases:2,
    sha:'edfe931326e44419d70725c0f84b2b45fe84518c16f7f809135ce59188b17e5f'},
  'renal-transition':{group:'renal',file:'atlas-renal-delivery-transition.test.mjs',cases:1,
    sha:'a58ec64c76b712b100b861e93a8a95ffd717fdfb798a31cec7fd8eed3dc392ba'},
  'renal-tour':{group:'renal',file:'atlas-renal-source-tour.test.mjs',cases:1,
    sha:'e0975da4f3c8673f01bdc42ece2e127f9676fd791302ee5aee570d1e79a9db01'},
};
const fixed={
  neck:[
    ['tests/current-atlas-delivery.test.mjs','172e1153b7213b1e32ec1fff745ebb3594cef5fdce49168734670325e8ac827e'],
    ['tests/fixtures/current-atlas-delivery-before-neck-xray-20261022.mjs.raw','303a1ba566b8dbbac99e06206f92ad5df3634579fb29bb696a64f4c5a4529cea'],
    ['tests/fixtures/current-atlas-delivery-before-neck-xray-20261022.json','a023587c2bfd645d92e809265b80c6fc24e4b17b6d973623eef110b7c25a340d'],
  ],
  renal:[
    ['tests/current-atlas-delivery.test.mjs','2c22ebddc061915b2fd44c3a283d2eff9d363032efc516026c734291511aeefe'],
    ['tests/fixtures/current-atlas-delivery-before-renal-source-20261022.mjs.raw','6a4d43e4a5ca4a6c88b77c63cbb7269eac95d1a4eb678c3622e4b40b1fb911eb'],
    ['tests/fixtures/current-atlas-delivery-before-renal-source-20261022.json','e21465496188fb9c0bd743dd98cfcf0251bd0125a84ec457392b893be0a57237'],
  ],
};
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
async function fileSha(file){const hash=createHash('sha256');for await(const chunk of fs.createReadStream(file))hash.update(chunk);return hash.digest('hex');}
function childEnv(website,atlas){
  const allowed=new Set(['path','pathext','systemroot','windir','comspec','temp','tmp','os',
    'processor_architecture','number_of_processors']);
  const env={};for(const [key,value] of Object.entries(process.env))if(allowed.has(key.toLowerCase()))env[key]=value;
  return {...env,NODE_OPTIONS:'--max-old-space-size=256',GOMEMLIMIT:'64MiB',GOMAXPROCS:'1',
    RAYON_NUM_THREADS:'1',GIT_NO_REPLACE_OBJECTS:'1',GIT_OPTIONAL_LOCKS:'0',
    VM_WEBSITE_ROOT:website,VM_ATLAS_SOURCE_REPO:atlas,ATLAS_SOURCE_REPO:atlas};
}
function git(root,...args){return execFileSync('git',['--no-replace-objects','-C',root,...args],{
  encoding:'utf8',windowsHide:true,maxBuffer:32*1024*1024,env:childEnv(root,root),
}).trim();}
function absoluteEnv(name){
  const value=process.env[name];assert(typeof value==='string'&&path.isAbsolute(value),name+' must be absolute');
  return fs.realpathSync(value);
}
function config(){
  const bytes=fs.readFileSync(absoluteEnv('VM_NECK_RENAL_CONTEXT_CONFIG'));
  assert.equal(sha(bytes),configSha,'Exact external context configuration');
  const data=JSON.parse(bytes);
  assert.equal(data.schema,'visible-medicine-neck-renal-historical-contexts/v1');
  assert(path.isAbsolute(data.terminalRoot));
  assert.deepEqual(Object.keys(data.contexts).sort(),['neck','renal']);
  return data;
}
function safeSource(site,relative){
  assert(typeof relative==='string'&&relative&&!path.isAbsolute(relative)&&!relative.includes('\\')&&
    !relative.includes(':')&&!relative.includes('\0')&&relative.split('/').every(part=>part&&part!=='.'&&part!=='..'),
    'Relative receipt path');
  const full=path.join(site,relative),stat=fs.lstatSync(full);
  assert(stat.isFile()&&!stat.isSymbolicLink(),relative+' must be a regular source file');
  assert(fs.realpathSync(full).startsWith(fs.realpathSync(site)+path.sep),relative+' stays in archived Website');
  return full;
}
async function verify(role,data){
  const spec=roles[role];assert(spec,'Known historical role');
  const c=data.contexts[spec.group],website=fs.realpathSync(c.website),atlas=fs.realpathSync(c.atlas);
  assert.equal(fs.realpathSync(git(atlas,'rev-parse','--show-toplevel')),atlas);
  assert.equal(git(atlas,'rev-parse','HEAD'),c.head);
  assert.equal(git(atlas,'rev-parse','HEAD^{tree}'),c.tree);
  assert.equal(git(atlas,'status','--porcelain'),'','Historical Atlas clean');
  assert.equal(await fileSha(c.receipt),c.receiptSha256,'Final historical source receipt');
  const receipt=JSON.parse(fs.readFileSync(c.receipt));
  assert.equal(receipt.atlasHead,c.head);assert.equal(receipt.atlasTree,c.tree);
  const rows=new Map();
  for(const row of receipt.sourceRows){
    assert(!rows.has(row.path),'Unique source receipt path: '+row.path);
    rows.set(row.path,row);
    const file=safeSource(website,row.path),stat=fs.statSync(file);
    assert.equal(stat.size,row.bytes,row.path+' source bytes');
    assert.equal(await fileSha(file),row.sha256,row.path+' source hash');
  }
  for(const [file,expected] of [[`tests/${spec.file}`,spec.sha],...fixed[spec.group]]){
    assert.equal(rows.get(file)?.sha256,expected,file+' receipt');
    assert.equal(await fileSha(safeSource(website,file)),expected,file+' immutable bytes');
  }
  const dependencies={};
  for(const [relative,expected] of Object.entries(data.dependencies)){
    const file=path.join(website,relative);
    const physical=fs.realpathSync(file); // node_modules may be a deliberate external junction.
    assert(fs.statSync(physical).isFile(),relative+' physical dependency');
    assert.equal(await fileSha(physical),expected,relative+' pinned dependency');
    dependencies[relative]={physical,sha256:expected};
  }
  const esbuild=JSON.parse(fs.readFileSync(path.join(website,'node_modules/esbuild/package.json')));
  const native=JSON.parse(fs.readFileSync(path.join(website,'node_modules/@esbuild/win32-x64/package.json')));
  assert.equal(esbuild.version,'0.28.2');assert.equal(native.version,'0.28.2');
  return {website,atlas,head:c.head,tree:c.tree,receiptSha256:c.receiptSha256,rows:rows.size,dependencies};
}
export function guardCurrentDelivery(){
  const pin=validateCurrentAtlasDelivery();assert.equal(CURRENT_ATLAS_REVISION,current);
  assert.equal(pin.source,current);currentAtlasDeliveryRoot();return pin;
}
export async function runOriginalRole(role){
  const data=config(),spec=roles[role];assert(spec,'Known historical role');
  const before=await verify(role,data);
  const dir=path.join(data.terminalRoot,new Date().toISOString().replace(/[:.]/g,'-')+'-'+role+'-'+randomUUID());
  fs.mkdirSync(dir,{recursive:true});
  const out=fs.createWriteStream(path.join(dir,'child.tap'),{flags:'wx'});
  const err=fs.createWriteStream(path.join(dir,'child.stderr.log'),{flags:'wx'});
  const ioEvents=[];for(const stream of [out,err])stream.on('error',e=>ioEvents.push(String(e)));
  const args=['--experimental-strip-types','--test','--test-concurrency=1','--test-reporter=tap',
    path.join(before.website,'tests',spec.file)];
  const child=spawn(process.execPath,args,{cwd:before.website,windowsHide:true,shell:false,
    stdio:['ignore','pipe','pipe'],env:childEnv(before.website,before.atlas)});
  child.stdout.pipe(out);child.stderr.pipe(err);
  for(const stream of [child.stdout,child.stderr])stream.on('error',e=>ioEvents.push(String(e)));
  fs.writeFileSync(path.join(dir,'started.json'),JSON.stringify({role,pid:child.pid,args,cwd:before.website,
    sourceReceipt:before.receiptSha256,rootSha256:spec.sha,cases:spec.cases},null,2)+'\n',{flag:'wx'});
  const result=await new Promise(resolve=>{let error;child.once('error',e=>{error=String(e)});
    child.once('close',(code,signal)=>resolve({code,signal,...(error?{error}:{})}));});
  let ioError;try{await Promise.all([finished(out),finished(err)])}catch(e){ioError=String(e)}
  if(ioEvents.length)ioError=[ioError,...ioEvents].filter(Boolean).join('; ');
  let after,stabilityError;try{after=await verify(role,data);assert.deepEqual(after,before,'Source/dependency identity after child');}
  catch(e){stabilityError=String(e)}
  let tap='';if(!ioError){const lines=readline.createInterface({input:fs.createReadStream(path.join(dir,'child.tap')),crlfDelay:Infinity});
    for await(const line of lines)if(/^(?:TAP version|\s*(?:not )?ok\b|1\.\.|# (?:tests|pass|fail|cancelled|skipped|todo) |\s*Bail out!)/i.test(line))tap+=line+'\n';}
  let counts,transportError;try{counts=assertCompleteOriginal(result,tap,spec.cases)}catch(e){transportError=String(e)}
  const passing=!ioError&&!stabilityError&&!transportError;
  fs.writeFileSync(path.join(dir,'terminal.json'),JSON.stringify({role,...result,counts:counts??null,
    sourceBefore:before,sourceAfter:after??null,
    ioError:ioError??null,stabilityError:stabilityError??null,transportError:transportError??null,passing},null,2)+'\n',{flag:'wx'});
  assert(passing,'Complete original child failed; terminal evidence: '+dir);
  return {role,counts,evidence:dir};
}
