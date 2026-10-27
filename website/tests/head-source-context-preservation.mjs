import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import {createHash} from 'node:crypto';
const sha=b=>createHash('sha256').update(b).digest('hex');
const bytes=readFileSync(new URL('./fixtures/head-source-context-repair.json',import.meta.url));assert.equal(sha(bytes),'7c52aaef3330fb2379c0aad495ae4e1ddef51267cfd70bc6dec14990a100441f');
const migration=JSON.parse(bytes),parentBytes=readFileSync(migration.parentReceipt);assert.equal(sha(parentBytes),migration.parentSha256);const parent=JSON.parse(parentBytes);
export function invertDeclaredHeadSource(postBytes,delta){
 const text=postBytes.toString('utf8');assert(Buffer.from(text).equals(postBytes));assert(!text.includes('\r'));assert(typeof delta==='string'&&!delta.includes('\r'));
 const post=text.split('\n'),lines=delta.split('\n');assert.equal(lines.at(-1),'');let cursor=0,i=0,hunks=0;const original=[];
 while(i<lines.length-1){
  const head=/^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@/.exec(lines[i++]);assert(head);
  const oldStart=Number(head[1]),oldCount=Number(head[2]??1),newStart=Number(head[3]),newCount=Number(head[4]??1);
  const oldIndex=oldCount===0?oldStart:oldStart-1,newIndex=newCount===0?newStart:newStart-1;
  assert(newIndex>=cursor&&newIndex<=post.length);original.push(...post.slice(cursor,newIndex));cursor=newIndex;assert.equal(original.length,oldIndex);
  let oldSeen=0,newSeen=0;while(i<lines.length-1&&!lines[i].startsWith('@@ ')){
   const line=lines[i++],mode=line[0],value=line.slice(1);assert(['+','-',' '].includes(mode));
   if(mode!=='-'){assert.equal(post[cursor++],value,'Exact edited line');newSeen++;}if(mode!=='+'){original.push(value);oldSeen++;}
  }assert.equal(oldSeen,oldCount);assert.equal(newSeen,newCount);hunks++;
 }assert(hunks>0);original.push(...post.slice(cursor));return Buffer.from(original.join('\n'));
}
export function restoreHeadContextSource(bytes,name){
 const row=migration.rows.find(r=>r.path==='tests/'+name);assert(row,'Explicit context migration');assert.equal(sha(bytes),row.afterSha256,'Complete migrated source');
 assert.equal(sha(row.delta),row.deltaSha256,'Declared edit delta');const inverse=invertDeclaredHeadSource(bytes,row.delta);
 const old=parent.sourceRows.find(r=>r.path===row.path);assert.equal(old?.sha256,row.beforeSha256);const before=readFileSync(parent.website+'/'+row.path);
 assert.equal(sha(before),row.beforeSha256,'Authentic original assertions');assert.equal(sha(inverse),row.beforeSha256,'Complete inverse endpoint');assert(inverse.equals(before),'All original bytes reconstructed from edited source');return inverse;
}
