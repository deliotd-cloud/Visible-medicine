import assert from 'node:assert/strict';
import test from 'node:test';
import {loadFixture,validateManifest,validateBytes,resolveModule} from './head-teaching-historical-source.mjs';

test('saved teaching fixture preserves the complete ten-case original and authentic source roles',()=>{
 const f=loadFixture();f.verify();
 assert.equal((f.read(f.manifest.entryPath).toString().match(/^test\(/gm)??[]).length,10);
 assert.match(f.read('components/HeadTeachingReviewNavigator.tsx').toString(),/>Open summary</);
 assert.doesNotMatch(f.read('app/workspace/atlas-review/head-learning/page.tsx').toString(),/const sequenceTargets=/);
});
test('fixture mutation and missing bytes fail before source execution',()=>{
 const f=loadFixture(),row=f.manifest.sourceRows[0],bytes=f.read(row.path),changed=Buffer.from(bytes);
 changed[0]^=1;assert.throws(()=>validateBytes(row,changed));assert.throws(()=>validateBytes(row,bytes.subarray(1)));
});
test('missing, forged, duplicate and escaping fixture roles fail closed',()=>{
 const f=loadFixture();
 for(const change of [v=>v.sourceRows.pop(),v=>v.sourceReceiptSha256='0'.repeat(64),v=>v.modulePaths[1]=v.modulePaths[0],v=>v.sourceRows[0].fixture='../current.ts']){
  const value=structuredClone(f.manifest);change(value);assert.throws(()=>validateManifest(value));
 }
 const root='file:///fixture/virtual/',parent=root+f.manifest.entryPath;
 for(const specifier of ['../../../../current.ts','@/lib/head-atlas-learning','file:///current.ts','../lib/unbound.ts','../lib/head-atlas-links.ts?latest'])
  assert.throws(()=>resolveModule(root,parent,specifier,f.manifest.modulePaths));
 assert.equal(resolveModule(root,parent,'../lib/head-atlas-links.ts',f.manifest.modulePaths),root+'lib/head-atlas-links.ts');
});
