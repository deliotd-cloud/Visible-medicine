import assert from 'node:assert/strict';
import test from 'node:test';
import {loadHistoricalActiveIdentityFixture,validateHistoricalManifest,validatedBytes,resolveHistoricalModule} from './head-active-identity-historical-source.mjs';

test('historical active-identity fixture keeps all five original bodies and complete observed source graph',()=>{
 const f=loadHistoricalActiveIdentityFixture();f.verify();assert.equal(f.manifest.sourceRows.length,28);assert.equal(f.manifest.modulePaths.length,27);
 assert.equal((f.read(f.manifest.entryPath).toString().match(/^test\(/gm)??[]).length,5);
 assert.match(f.read(f.manifest.entryPath).toString(),/Website comparisons stay in the same tab/);
 assert.doesNotMatch(f.read(f.manifest.viewerPath).toString(),/HeadSeparateComparisonLink/);
});
test('historical active-identity bytes reject tampering, truncation and appended source',()=>{
 const f=loadHistoricalActiveIdentityFixture(),row=f.manifest.sourceRows.find(r=>r.path===f.manifest.entryPath),b=f.read(row.path),changed=Buffer.from(b);changed[0]^=1;
 for(const bytes of [changed,b.subarray(1),Buffer.concat([b,Buffer.from('\n')])])assert.throws(()=>validatedBytes(row,bytes));
});
test('historical active-identity manifest rejects omitted, duplicate, forged and escaping rows',()=>{
 const {manifest}=loadHistoricalActiveIdentityFixture();
 for(const change of [v=>v.sourceRows.pop(),v=>v.sourceRows[0]=v.sourceRows[1],v=>v.modulePaths[0]=v.modulePaths[1],v=>v.sourceReceiptSha256='0'.repeat(64),v=>v.sourceRows[0].fixture='../live.ts',v=>v.thirdPartyVersions['@noble/hashes']='unbound']){
  const copy=structuredClone(manifest);change(copy);assert.throws(()=>validateHistoricalManifest(copy));
 }
});
test('historical active-identity namespace refuses current aliases, traversal and undeclared modules',()=>{
 const {manifest}=loadHistoricalActiveIdentityFixture(),root='file:///fixture/virtual/',parent=root+manifest.entryPath;
 for(const name of ['../../../../current.ts','@/lib/current','file:///current.ts','../lib/not-frozen.ts','../lib/head-atlas-links.ts?latest','../lib/head-atlas-links.ts#latest','../lib\\head-atlas-links.ts'])assert.throws(()=>resolveHistoricalModule(root,parent,name,manifest.modulePaths));
 assert.equal(resolveHistoricalModule(root,parent,'../lib/head-atlas-links.ts',manifest.modulePaths),root+'lib/head-atlas-links.ts');
 assert.equal(resolveHistoricalModule(root,parent,'../lib/head-atlas-geometry.mjs',manifest.modulePaths),root+'lib/head-atlas-geometry.mjs');
});
test('historical active-identity metadata and returned byte copies cannot mutate the frozen fixture',()=>{
 const f=loadHistoricalActiveIdentityFixture();assert(Object.isFrozen(f.manifest));assert(Object.isFrozen(f.manifest.sourceRows[0]));
 assert.throws(()=>{f.manifest.sourceRows[0].sha256='0'.repeat(64);});assert.throws(()=>f.manifest.modulePaths.push('current.ts'));
 const b=f.read(f.manifest.entryPath),original=Buffer.from(b);b[0]^=1;assert.deepEqual(f.read(f.manifest.entryPath),original);
 assert.throws(()=>f.read('lib/not-frozen.ts'));
});
test('historical active-identity packages retain the exact four observed versions',()=>{
 const {manifest}=loadHistoricalActiveIdentityFixture();assert.deepEqual(manifest.thirdPartyVersions,{'react':'19.2.8','react-dom':'19.2.8','@noble/hashes':'2.4.0','typescript':'5.9.3'});
});
