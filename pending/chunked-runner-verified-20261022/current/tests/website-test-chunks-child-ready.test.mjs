import test from 'node:test';
import assert from 'node:assert/strict';
import {spawn,spawnSync} from 'node:child_process';
import {randomUUID} from 'node:crypto';
import {existsSync,mkdtempSync,mkdirSync,readFileSync,readdirSync,writeFileSync} from 'node:fs';
import {join,dirname} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {main} from '../scripts/run-website-tests-chunked.mjs';
import {digest} from '../scripts/website-test-chunks.mjs';

const stage=join(dirname(fileURLToPath(import.meta.url)),'..');
const fixtures=join(stage,'.local','child-ready-fixtures');
const helper=join(stage,'scripts','website-test-child-ready.mjs');
const runner=pathToFileURL(join(stage,'scripts','run-website-tests-chunked.mjs')).href;
mkdirSync(fixtures,{recursive:true});
function root(){
  const path=mkdtempSync(join(fixtures,'case-'));mkdirSync(join(path,'tests'));mkdirSync(join(path,'.local'));
  writeFileSync(join(path,'package.json'),'{"type":"module"}\n');
  writeFileSync(join(path,'tests','a.test.mjs'),
    "import test from 'node:test';import{writeFileSync}from'node:fs';writeFileSync('.local/payload-ran','yes');test('short',()=>{});\n");
  return path;
}
function env(){const result={...process.env,NODE_OPTIONS:'--max-old-space-size=256'};delete result.NODE_TEST_CONTEXT;return result;}
function coordinator(args,environment){
  const code=`import {main} from ${JSON.stringify(runner)};process.exitCode=await main(${JSON.stringify(args)},{preflight:()=>({history:{synthetic:true},preview:{synthetic:true},synthetic:true})});`;
  return spawnSync(process.execPath,['--input-type=module','--eval',code],
    {cwd:stage,encoding:'utf8',env:environment,timeout:30000});
}

test('owned child with real Windows identity passes and its receipt survives a new coordinator',()=>{
  if(process.platform!=='win32')return;
  const path=root(),environment=env();
  const first=coordinator(['--run','--root',path,'--chunk-size','1','--stop-after','1'],environment);
  assert.equal(first.status,2,first.stderr||first.stdout);
  const paused=JSON.parse(first.stdout.trim().split(/\r?\n/).at(-1));
  assert.equal(paused.selectedChunks,1);assert.equal(paused.compositePassingClaim,false);
  const attempts=join(paused.batch,'attempts','chunk-0000');
  const names=readdirSync(attempts).filter(name=>name.startsWith('attempt-'));
  assert.equal(names.length,1);
  const started=JSON.parse(readFileSync(join(attempts,names[0],'started.json')));
  assert.equal(started.child.state,'alive');assert.equal(started.child.pid>0,true);
  assert.equal(existsSync(join(path,'.local','payload-ran')),true);
  const next=coordinator(['--resume',paused.batch,'--root',path],environment);
  assert.equal(next.status,0,next.stderr||next.stdout);
  const resumed=JSON.parse(next.stdout.trim().split(/\r?\n/).at(-1));
  assert.equal(resumed.compositePassingClaim,true);
  assert.equal(resumed.counts.tests,1);assert.equal(readdirSync(attempts).filter(name=>name.startsWith('attempt-')).length,1);
});

test('handshake prevents payload before release and parent disconnect stops owned child',async()=>{
  const path=root(),token=randomUUID(),tap=join(path,'.local','unreleased.tap');
  const environment={...env(),VM_CHUNK_PARENT_PID:String(process.pid),VM_CHUNK_HANDSHAKE_TOKEN:token};
  const child=spawn(process.execPath,['--experimental-strip-types',helper,`--tap=${tap}`,'tests/a.test.mjs'],
    {cwd:path,env:environment,windowsHide:true,stdio:['ignore','pipe','pipe','ipc']});
  const closed=new Promise(resolve=>child.once('exit',(code,signal)=>resolve({code,signal})));
  let readyTimer;
  const ready=await Promise.race([
    new Promise((resolve,reject)=>{child.on('message',message=>{
      if(message?.type==='vm-child-ready'&&message.token===token)resolve(message);
    });child.once('error',reject);}),
    new Promise((_,reject)=>{readyTimer=setTimeout(()=>reject(Error('Owned child did not become ready')),5000);}),
  ]);
  clearTimeout(readyTimer);
  assert.equal(ready.pid,child.pid);
  assert.equal(existsSync(join(path,'.local','payload-ran')),false);
  assert.equal(existsSync(tap),false);
  child.disconnect();
  const exit=await closed;
  assert.equal(exit.code,77);
  assert.equal(existsSync(join(path,'.local','payload-ran')),false);
  assert.equal(existsSync(tap),false);
});

test('unknown startup identity terminates only the owned child before payload',async()=>{
  const path=root();
  const inspector=pid=>pid===process.pid?
    {state:'alive',pid,startedUtc:'test-runner',executable:process.execPath,commandSha256:digest('test-runner')}:
    {state:'unknown',reason:'synthetic inspection failure'};
  const prior=console.log;let output;
  console.log=value=>{output=JSON.parse(value);};
  let code;
  try{code=await main(['--run','--root',path,'--chunk-size','1'],
    {preflight:()=>({history:{synthetic:true},preview:{synthetic:true},synthetic:true}),inspector});}
  finally{console.log=prior;}
  assert.equal(code,1);
  assert.equal(output.compositePassingClaim,false);
  assert.equal(existsSync(join(path,'.local','payload-ran')),false);
  const names=readdirSync(join(output.batch,'attempts','chunk-0000')).filter(name=>name.startsWith('attempt-'));
  assert.equal(names.length,1);
  const receipt=JSON.parse(readFileSync(join(output.batch,'attempts','chunk-0000',names[0],'receipt.json')));
  assert.match(receipt.spawnError,/Cannot establish test-child process identity/);
  assert.equal(receipt.child.state,'unknown');
  assert.equal(existsSync(join(output.batch,'attempts','chunk-0000',names[0],'started.json')),false);
});

test('owned native runner retains TypeScript stripping for explicit roots',async()=>{
  const path=root();
  writeFileSync(join(path,'tests','b.test.ts'),
    "import test from 'node:test';const value:number=2;test('typed',()=>{if(value!==2)throw Error('wrong value')});\n");
  const inspector=pid=>({state:'alive',pid,startedUtc:`owned-${pid}`,executable:process.execPath,commandSha256:digest(`owned-${pid}`)});
  const prior=console.log;let output;
  console.log=value=>{output=JSON.parse(value);};
  let code;
  try{code=await main(['--run','--root',path,'--chunk-size','2'],
    {preflight:()=>({history:{synthetic:true},preview:{synthetic:true},synthetic:true}),inspector});}
  finally{console.log=prior;}
  assert.equal(code,0);
  assert.equal(output.compositePassingClaim,true);
  assert.equal(output.counts.tests,2);
});
