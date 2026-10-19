import test from 'node:test';
import assert from 'node:assert/strict';
import {EventEmitter} from 'node:events';
import {createHash} from 'node:crypto';
import {createGitObjectReader} from './git-object-reader.mjs';

const blob=bytes=>createHash('sha1').update(`blob ${bytes.length}\0`).update(bytes).digest('hex');
class FakeGit extends EventEmitter {
 constructor(){super();this.stdin=new EventEmitter();this.stdout=new EventEmitter();this.requests=[];this.killed=false;
  this.stdin.write=(data,callback)=>{this.requests.push(data);callback?.();};}
 kill(){this.killed=true;queueMicrotask(()=>this.emit('close',0));return true;}
 send(...parts){for(const part of parts)this.stdout.emit('data',part);}
}

test('one bounded process reads serial blobs and rejects corruption or truncated output',async()=>{
 const data=Buffer.from('historical fixture'),id=blob(data);
 const fake=new FakeGit();let spawns=0;
 const reader=createGitObjectReader({cwd:process.cwd(),spawnProcess:()=>{spawns++;return fake;},maxBytes:data.length});
 try{
  await assert.rejects(reader.readBlob('HEAD'),/SHA-1/);
  assert.equal(spawns,0,'invalid ID starts no child');
  const first=reader.readBlob(id),second=reader.readBlob(id);
  assert.deepEqual(fake.requests,[id+'\n']);
  fake.send(Buffer.from(`${id} blob ${data.length}\n`),data,Buffer.from('\n'));
  assert.deepEqual(await first,data);
  assert.deepEqual(fake.requests,[id+'\n',id+'\n']);
  fake.send(Buffer.from(`${id} blob ${data.length}\n`),data,Buffer.from('\n'));
  assert.deepEqual(await second,data);
  assert.equal(spawns,1,'multiple blob reads use one child');
 }finally{await reader.close();assert(fake.killed,'successful reader closes its child');}
 const foreign='f'.repeat(40);
 for(const parts of [
  [Buffer.from(`${id} blob ${data.length}\n`),data.subarray(0,3)],
  [Buffer.from(`${id} tree ${data.length}\n`)],
  [Buffer.from(`${id} missing\n`)],
  [Buffer.from(`${foreign} blob ${data.length}\n`),data,Buffer.from('\n')],
  [Buffer.from(`${id} blob ${data.length+1}\n`)],
  [Buffer.from(`${id} blob ${data.length}\n`),Buffer.alloc(data.length,0),Buffer.from('\n')],
 ]){
  const child=new FakeGit(),subject=createGitObjectReader({cwd:process.cwd(),spawnProcess:()=>child,maxBytes:data.length});
  try{
   const pending=subject.readBlob(id);child.send(...parts);
   if(parts.length===2&&parts[1].length===3)child.emit('close',1);
   await assert.rejects(pending);
   await assert.rejects(subject.readBlob(id));
  }finally{await subject.close();assert(child.killed,'failed reader closes its child');}
 }
});
