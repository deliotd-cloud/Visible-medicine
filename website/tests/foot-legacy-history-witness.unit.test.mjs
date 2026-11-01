import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {CORPUS,PINNED_ROWS,validateWitness,validateWitnessBytes,validateLegacyState,validateBlob} from './foot-legacy-history-witness.mjs';
const root='F:\\VisibleMedicine\\atlas';
const valid=()=>({schema:'vm-foot-legacy-history-witness/1',legacy:{root,head:'f949979e975b6260575a7fd72901bcc2aec0be05',tree:'a'.repeat(40)},corpus:{...CORPUS},rows:structuredClone(PINNED_ROWS)});
test('exact witness shape and explicit external byte seal',()=>{
 const w=valid(),bytes=Buffer.from(JSON.stringify(w)),pin=createHash('sha256').update(bytes).digest('hex');
 assert.deepEqual(validateWitness(validateWitnessBytes(bytes,pin),root),w);
 for(const invalid of [undefined,'','A'.repeat(64),'a'.repeat(63),'0'.repeat(64)])assert.throws(()=>validateWitnessBytes(bytes,invalid));
 assert.throws(()=>validateWitnessBytes(Buffer.concat([bytes,Buffer.from(' ')]),pin));
 assert.throws(()=>validateWitnessBytes(Buffer.from('{'),createHash('sha256').update('{').digest('hex')));
});
test('foreign root, corpus, schema, revision, path, hash and count fail closed',()=>{
 for(const mutate of [w=>w.schema='other',w=>w.extra=true,w=>w.legacy.root='G:\\foreign',w=>w.legacy.head='HEAD',w=>w.legacy.tree='',w=>w.legacy.extra=true,w=>w.corpus.head='b'.repeat(40),w=>w.corpus.tree='b'.repeat(40),w=>w.rows.pop(),w=>w.rows.push(w.rows[0]),w=>w.rows.reverse(),w=>w.rows[1]=w.rows[0],w=>w.rows[0].revision='b'.repeat(40),w=>w.rows[0].path='other',w=>w.rows[0].sha256='c'.repeat(64),w=>w.rows[0].bytes++,w=>w.rows[0].extra=true,w=>w.rows=null]){
  const w=valid();mutate(w);assert.throws(()=>validateWitness(w,root));
 }
});
test('root, HEAD or tree changes during either check fail closed',()=>{
 const w=valid();assert.doesNotThrow(()=>validateLegacyState(w,{...w.legacy}));
 for(const key of ['root','head','tree'])assert.throws(()=>validateLegacyState(w,{...w.legacy,[key]:'changed'}));
});
test('both blob inputs must match fixed bytes and digest',()=>{
 const bytes=Buffer.from('synthetic pure seam only'),row={bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex')};
 assert.doesNotThrow(()=>validateBlob(row,bytes,Buffer.from(bytes)));
 const changed=Buffer.from(bytes);changed[0]^=1;
 for(const [a,b] of [[changed,bytes],[bytes,changed],[Buffer.alloc(0),bytes],[bytes,Buffer.alloc(0)]])assert.throws(()=>validateBlob(row,a,b));
});
