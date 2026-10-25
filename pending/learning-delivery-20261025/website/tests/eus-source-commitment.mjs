import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
export const historicalScopeExclusions=Object.freeze(['.git','node_modules','.next','dist','.wrangler']);
function safeRelative(value){
 assert(typeof value==='string'&&/^[A-Za-z0-9_.\[\]@()+ /-]+$/.test(value),'Explicit relative source path');
 assert(value.split('/').every(part=>part&&part!=='.'&&part!=='..'),'No empty, absolute or traversal path');
 assert(!value.includes('\\')&&!value.includes(':'),'No platform path escape');return value;
}
export function canonicalSourceRows(rows){
 assert(Array.isArray(rows),'Source rows must be an array');const seen=new Set();
 const normalized=rows.map(row=>{
  assert(row&&typeof row==='object'&&!Array.isArray(row)&&[Object.prototype,null].includes(Object.getPrototypeOf(row)),'Plain source row');
  const descriptors=Object.getOwnPropertyDescriptors(row);
  assert.deepEqual(Reflect.ownKeys(row).sort(),['bytes','path','sha256']);
  for(const key of ['path','bytes','sha256'])assert(Object.hasOwn(descriptors[key],'value'),'No metadata accessor');
  const name=safeRelative(row.path);assert(!seen.has(name),'No duplicate source path');seen.add(name);
  assert(Number.isSafeInteger(row.bytes)&&row.bytes>=0,'Safe nonnegative source size');
  assert(typeof row.sha256==='string'&&/^[a-f0-9]{64}$/.test(row.sha256),'Exact lowercase SHA-256');
  return {path:name,bytes:row.bytes,sha256:row.sha256};
 });
 normalized.sort((a,b)=>a.path<b.path?-1:a.path>b.path?1:0);
 return JSON.stringify(normalized)+'\n';
}
export function sourceCommitment(rows){return {count:rows.length,sha256:createHash('sha256').update(canonicalSourceRows(rows),'utf8').digest('hex')};}
/** Enumerate every file in the historical root, with only the five root build,
 * dependency and Git entries excluded. Nested lookalikes are never ignored. */
export function enumerateHistoricalSources(root){
 const base=fs.realpathSync(root),rows=[];
 function walk(directory,prefix=''){
  for(const item of fs.readdirSync(directory,{withFileTypes:true})){
   if(!prefix&&historicalScopeExclusions.includes(item.name))continue;
   const relative=safeRelative(prefix+item.name),file=path.join(directory,item.name);
   assert(!item.isSymbolicLink(),'Historical source symlinks are not admitted');
   if(item.isDirectory()){walk(file,relative+'/');continue;}
   assert(item.isFile(),'Only regular historical source files');
   const fd=fs.openSync(file,'r');let count=0;const hash=createHash('sha256'),buffer=Buffer.allocUnsafe(64*1024);
   try{
    const before=fs.fstatSync(fd);let n;while((n=fs.readSync(fd,buffer,0,buffer.length,null))!==0){hash.update(buffer.subarray(0,n));count+=n;}
    const after=fs.fstatSync(fd);assert.equal(count,before.size,'Historical source changed during read');assert.equal(after.size,before.size);assert.equal(after.mtimeMs,before.mtimeMs);
   }finally{fs.closeSync(fd);}
   rows.push({path:relative,bytes:count,sha256:hash.digest('hex')});
  }
 }
 walk(base);return rows;
}
export function verifyHistoricalSourceCommitment(root,expected){
 assert.equal(expected.count,6672,'Exact complete historical scope');assert.match(expected.sha256,/^[a-f0-9]{64}$/);
 const actual=sourceCommitment(enumerateHistoricalSources(root));
 assert.deepEqual(actual,{count:expected.count,sha256:expected.sha256},'Historical whole-source count or aggregate commitment changed');return actual;
}