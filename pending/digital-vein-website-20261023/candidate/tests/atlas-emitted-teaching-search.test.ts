import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {emittedTeaching,emittedTeachingSearch} from './atlas-emitted-teaching.ts';
const sha=(b:Uint8Array)=>createHash('sha256').update(b).digest('hex');
function fixture(){
  const values=new Map([
    ['index.html',Buffer.from('<script src="assets/main.js"></script>')],
    ['assets/main.js',Buffer.from('import "./body-content-demo.js"; import "./end.js";\nmain-end')],
    ['assets/body-content-demo.js',Buffer.from('a'.repeat(65535)+'é🙂 teaching "quoted" and \\u03b1\nbody-end')],
    ['assets/end.js',Buffer.from('end-start\nlast-line')],
  ]);
  const files=[...values].map(([path,b])=>({path,sha256:sha(b)}));
  const reads:string[]=[];
  const read=(p:string)=>{reads.push(p);const value=values.get(p);assert(value,'Existing test artifact: '+p);return value;};
  return {values,files,read,reads};
}

test('bounded search equals the original complete DFS joined string, including chunk/file/Unicode boundaries',()=>{
  const f=fixture(),old=emittedTeaching('',f.files,true,f.read),search=emittedTeachingSearch('',f.files,f.read);
  for(const needle of ['', 'not present','teaching','é🙂','aé🙂','"quoted"','\\u03b1',
    'main-end\naaaa','body-end\nend-start','last-line','last-line\n','a'.repeat(70000),old.slice(65510,65610)])
    assert.equal(search.includes(needle),old.includes(needle),JSON.stringify(needle.slice(0,80)));
});

test('every reachable script is rehashed even when a match occurs in the first script',()=>{
  const f=fixture(),search=emittedTeachingSearch('',f.files,f.read);f.reads.length=0;
  assert(search.includes('main-end'));
  assert.deepEqual(f.reads,['assets/main.js','assets/body-content-demo.js','assets/end.js']);
  f.values.set('assets/end.js',Buffer.from('changed after construction'));
  assert.throws(()=>search.includes('main-end'),/assets\/end.js/);
  assert.throws(()=>search.includes(''),/assets\/end.js/);
});

test('unmanifested, mismatched and missing reachable output is refused',()=>{
  for(const change of [
    (f:ReturnType<typeof fixture>)=>{f.files=f.files.filter(x=>x.path!=='assets/end.js');},
    (f:ReturnType<typeof fixture>)=>{f.files.find(x=>x.path==='assets/end.js')!.sha256='0'.repeat(64);},
    (f:ReturnType<typeof fixture>)=>{f.values.delete('assets/end.js');},
  ]){const f=fixture();change(f);assert.throws(()=>emittedTeachingSearch('',f.files,f.read));}
});

test('deferred teaching must remain uniquely manifested and reachable, not merely present in an unused file',()=>{
  const missing=fixture();missing.files=missing.files.filter(x=>!x.path.includes('body-content'));
  assert.throws(()=>emittedTeachingSearch('',missing.files,missing.read));
  const duplicate=fixture();duplicate.files.push({...duplicate.files[0]});
  assert.throws(()=>emittedTeachingSearch('',duplicate.files,duplicate.read),/Unique emitted paths/);
  const extra=fixture();extra.files.push({path:'assets/body-content-extra.js',sha256:sha(Buffer.from('unused'))});
  assert.throws(()=>emittedTeachingSearch('',extra.files,extra.read),/One emitted deferred teaching module/);
  const unreachable=fixture();unreachable.values.set('index.html',Buffer.from('<script src="assets/end.js"></script>'));
  unreachable.files[0].sha256=sha(unreachable.values.get('index.html')!);
  assert.throws(()=>emittedTeachingSearch('',unreachable.files,unreachable.read),/reachable/);
});

test('the complete original emittedTeaching implementation survives unchanged at its prior role',()=>{
  const read=(p:string)=>readFileSync(new URL(p,import.meta.url));
  const old=read('./fixtures/cranial-xray-before/atlas-emitted-teaching.ts.raw');
  assert.equal(sha(old),'3191c4777baac4c1f3dc7e201654f7e9b40f87ef2406750f410ec73f8ae0a388');
  let source=read('./atlas-emitted-teaching.ts').toString().replaceAll('\r\n','\n');
  const marker='\n/** Same manifested DFS text search without retaining every viewer script. */';
  assert.equal(source.split(marker).length,2);source=source.split(marker)[0];
  const importLine="import {StringDecoder} from 'node:string_decoder';\n";
  assert.equal(source.split(importLine).length,2);source=source.replace(importLine,'');
  assert.equal(source,old.toString().replaceAll('\r\n','\n'));
});
