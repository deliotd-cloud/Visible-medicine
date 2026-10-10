import test from 'node:test';
import assert from 'node:assert/strict';
import {EventEmitter} from 'node:events';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {mkdir,mkdtemp,realpath,rm} from 'node:fs/promises';
import {basename,dirname,isAbsolute,join,relative,resolve} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {createGitObjectReader} from './git-object-reader.mjs';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const staging=process.env.VM_ATLAS_TEST_TMP||resolve(root,'.local');
await mkdir(staging,{recursive:true});
const oid=bytes=>createHash('sha1').update(`blob ${bytes.length}\0`).update(bytes).digest('hex');
const head=(id,size)=>Buffer.from(`${id} blob ${size}\n`,'ascii');
class FakeGit extends EventEmitter {
  constructor(){super();this.requests=[];this.stdout=new EventEmitter();this.stdin=new EventEmitter();this.stdin.write=(data,callback)=>{this.requests.push(data);callback?.();};this.killed=false;}
  send(...chunks){for(const chunk of chunks)this.stdout.emit('data',chunk);}
  kill(){if(!this.killed){this.killed=true;queueMicrotask(()=>this.emit('close',0));}return true;}
}
const fakeReader=(maxBytes=2*1024*1024)=>{const fake=new FakeGit();return {fake,reader:createGitObjectReader({cwd:staging,maxBytes,spawnProcess:()=>fake})};};

test('fragmented header/body, exact 2 MiB payload, serial queue and independent results',async()=>{
  const {fake,reader}=fakeReader();
  const big=Buffer.alloc(2*1024*1024,173),small=Buffer.from([0,255,13,10,128]);
  const bigId=oid(big),smallId=oid(small);
  try{
    const first=reader.readBlob(bigId),second=reader.readBlob(smallId);
    assert.deepEqual(fake.requests,[bigId+'\n'],'Second request waits for first response');
    const header=head(bigId,big.length);
    fake.send(header.subarray(0,7),header.subarray(7));
    for(let offset=0;offset<big.length;offset+=4096)fake.send(big.subarray(offset,Math.min(offset+4096,big.length)));
    fake.send(Buffer.from('\n'));
    const returned=await first;
    assert.deepEqual(returned,big);
    assert.deepEqual(fake.requests,[bigId+'\n',smallId+'\n']);
    const secondHeader=head(smallId,small.length);
    fake.send(secondHeader.subarray(0,2),secondHeader.subarray(2),small.subarray(0,2),small.subarray(2),Buffer.from('\n'));
    assert.deepEqual(await second,small);
    returned.fill(0);
    const third=reader.readBlob(bigId);
    fake.send(head(bigId,big.length),big,Buffer.from('\n'));
    assert.deepEqual(await third,big,'Caller mutation cannot affect a later read');
  }finally{await reader.close();}
});

test('malformed framing, object kind/OID/hash, declared size and trailing bytes fail closed',async()=>{
  const bytes=Buffer.from('fixture'),id=oid(bytes),foreign='f'.repeat(40);
  const cases=[
    ['non-blob',[Buffer.from(`${id} tree ${bytes.length}\n`),bytes,Buffer.from('\n')]],
    ['mismatched-oid',[head(foreign,bytes.length),bytes,Buffer.from('\n')]],
    ['noncanonical-size',[Buffer.from(`${id} blob 07\n`),bytes,Buffer.from('\n')]],
    ['oversize',[head(id,9)]],
    ['header-too-long',[Buffer.alloc(256,65)]],
    ['bad-terminator',[head(id,bytes.length),bytes,Buffer.from('X')]],
    ['trailing-byte',[head(id,bytes.length),bytes,Buffer.from('\nX')]],
    ['corrupt-hash',[head(id,bytes.length),Buffer.from('fixturF'),Buffer.from('\n')]],
  ];
  for(const [name,chunks] of cases){
    const {fake,reader}=fakeReader(name==='oversize'?8:2*1024*1024);
    try{const pending=reader.readBlob(id);fake.send(...chunks);await assert.rejects(pending,undefined,name);await assert.rejects(reader.readBlob(id));}
    finally{await reader.close();}
  }
  const {fake,reader}=fakeReader();
  try{const pending=reader.readBlob(id);fake.send(head(id,bytes.length),bytes.subarray(0,3));fake.emit('close',0);await assert.rejects(pending,/exited unexpectedly/);await reader.close();}
  finally{await reader.close();}
});

test('empty blob, exact zero bound, invalid input, close rejects active and queued',async()=>{
  const empty=Buffer.alloc(0),id=oid(empty);
  const {fake,reader}=fakeReader(0);
  try{
    await assert.rejects(reader.readBlob('HEAD'),/40|SHA-1/);
    const pending=reader.readBlob(id);
    fake.send(head(id,0),Buffer.from('\n'));
    assert.deepEqual(await pending,empty);
    const active=reader.readBlob(id),queued=reader.readBlob(id);
    assert.equal(fake.requests.length,2);
    const closed=reader.close();
    const outcomes=await Promise.allSettled([active,queued]);
    assert(outcomes.every(x=>x.status==='rejected'));
    await closed;await reader.close();
    await assert.rejects(reader.readBlob(id));
  }finally{await reader.close();}
});

test('tiny E-owned real Git repository returns exact blobs with no working-tree fallback',async()=>{
  const fixture=await mkdtemp(join(staging,'reader-fixture-'));
  const git=(args,input)=>execFileSync('git',args,{cwd:fixture,windowsHide:true,input,encoding:'utf8',
    env:{...process.env,GIT_CONFIG_NOSYSTEM:'1',GIT_CONFIG_GLOBAL:process.platform==='win32'?'NUL':'/dev/null'},
    stdio:['pipe','pipe','pipe']}).trim();
  let reader,originalReader;
  try{
    git(['init','--quiet']);
    const data=Buffer.from(Array.from({length:64*1024},(_,i)=>i%251));
    const id=git(['hash-object','-w','--stdin'],data);
    reader=createGitObjectReader({cwd:fixture,maxBytes:data.length});
    const originalBytes=execFileSync('git',['show','aa4a92a958408d665eafceacbd9850dd5712cb41:scripts/git-object-reader.mjs'],{cwd:root,windowsHide:true,maxBuffer:16000000,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}});
    assert.equal(oid(originalBytes),'6e8a0160079548fb02c5ef74ddfddba879048021','Exact immutable predecessor Git blob');
    const original=await import('data:text/javascript;base64,'+originalBytes.toString('base64'));
    originalReader=original.createGitObjectReader({cwd:fixture,maxBytes:data.length});
    const [first,second]=await Promise.all([reader.readBlob(id),reader.readBlob(id)]);
    const prior=await originalReader.readBlob(id);
    assert.deepEqual(first,prior,'Old and new readers return identical Git blob bytes');
    assert.deepEqual(first,data);assert.deepEqual(second,data);
    first.fill(0);assert.deepEqual(await reader.readBlob(id),data);
    await assert.rejects(reader.readBlob('0'.repeat(40)));
    await reader.close();
    await originalReader.close();
  }finally{
    await reader?.close();
    await originalReader?.close();
    const real=await realpath(fixture),base=await realpath(staging),rel=relative(base,real);
    assert(!isAbsolute(rel)&&!rel.startsWith('..')&&dirname(real)===base&&basename(real).startsWith('reader-fixture-')&&resolve(real)!==resolve(base));
    await rm(real,{recursive:true,force:true});
  }
});
