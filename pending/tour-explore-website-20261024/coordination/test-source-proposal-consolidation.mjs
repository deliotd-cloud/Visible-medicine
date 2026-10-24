import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {planProposalSourceSelection} from './source-proposal-checkpoint.mjs';

const sha=b=>createHash('sha256').update(b).digest('hex');
const head='a'.repeat(40),tree='b'.repeat(40);
function fixture(count=5999,duplicates=100){
 const bytes=new Map(),files=[];
 for(let i=0;i<count;i++){
  const p=`atlas/source-${String(i).padStart(4,'0')}.ts`;
  const b=Buffer.from(i<duplicates?'same inherited source':`unique source ${i}`);
  bytes.set(p,b);files.push({path:p,bytes:b.length,sha256:sha(b)});
 }
 return{bytes,files};
}
function plan(f,option,newPaths=[]){
 const incoming=new Map(newPaths.map(p=>[p,Buffer.from(`new ${p}`)]));
 return planProposalSourceSelection({inheritedFiles:f.files,inheritedBytesFor:p=>f.bytes.get(p),newPaths,newBytesFor:p=>incoming.get(p),id:'synthetic',exactDuplicateConsolidation:option,parentHead:head,parentTree:tree});
}
const option={targetCount:5900,maxOmissions:128,protectedPaths:['atlas/source-0000.ts']};

test('5999 inherited paths consolidate before new artifacts; aliases retain byte proof and parent identity',()=>{
 const f=fixture();const added=['pending/synthetic/new/a.mjs','pending/synthetic/new/b.ts'];
 const r=plan(f,option,added);
 assert.equal(r.consolidation.inheritedPathsBefore,5999);
 assert.equal(r.consolidation.inheritedPathsAfter,5900);
 assert.equal(r.files.length,5902);
 assert.equal(r.aliases.length,99);
 assert.equal(r.consolidation.omittedBytes,99*Buffer.byteLength('same inherited source'));
 assert.equal(r.consolidation.parentHead,head);assert.equal(r.consolidation.parentTree,tree);
 assert(r.files.some(x=>x.path==='atlas/source-0000.ts'));
 for(const a of r.aliases){assert.equal(a.retainedPath,'atlas/source-0000.ts');assert.equal(a.sha256,sha(f.bytes.get(a.omittedPath)));assert.equal(a.bytes,f.bytes.get(a.omittedPath).length);assert(!r.files.some(x=>x.path===a.omittedPath));}
 for(const p of added)assert(r.files.some(x=>x.path===p));
});

test('actual restored byte mismatch rejects inherited manifest',()=>{
 const f=fixture();f.bytes.set('atlas/source-0001.ts',Buffer.from('tampered restored source'));
 assert.throws(()=>plan(f,option),/Restored byte count mismatch|Restored digest mismatch/);
});

test('protected inherited representative is retained and insufficient omission cap fails',()=>{
 const f=fixture();
 assert.throws(()=>plan(f,{...option,maxOmissions:98}),/Target exceeds omission cap/);
 assert.throws(()=>plan(f,{...option,protectedPaths:f.files.slice(0,100).map(x=>x.path)}),/Insufficient exact inherited duplicates/);
});

test('strict under-6000 gate still applies after consolidation and append',()=>{
 const f=fixture();const added=Array.from({length:100},(_,i)=>`pending/synthetic/new/${i}.mjs`);
 assert.throws(()=>plan(f,option,added),/Selected source count must remain within backup gate/);
});

test('absent option preserves all inherited paths and ordinary sorted selection',()=>{
 const f=fixture(3,2);const r=plan(f,undefined,['pending/synthetic/new/one.mjs']);
 assert.equal(r.consolidation,null);assert.deepEqual(r.aliases,[]);
 assert.deepEqual(r.files.map(x=>x.path),[...f.files.map(x=>x.path),'pending/synthetic/new/one.mjs'].sort((a,b)=>a.localeCompare(b)));
 assert.equal(r.files.length,4);
});
