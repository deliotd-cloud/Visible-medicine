import assert from 'node:assert/strict';
import test from 'node:test';
import {loadHistoricalHeadFixture,validateHistoricalManifest,validateHistoricalBytes,resolveHistoricalModule} from './head-review-historical-source.mjs';
test('portable fixture contains every exact original test/page and actually evaluated pure module',()=>{
  const fixture=loadHistoricalHeadFixture();assert.equal(fixture.manifest.sourceRows.length,17);assert.equal(fixture.manifest.modulePaths.length,16);
  fixture.verify();assert.match(fixture.read(fixture.manifest.entryPath).toString(),/authorization precedes every packet getter/);
  assert.equal((fixture.read(fixture.manifest.entryPath).toString().match(/^test\(/mg)||[]).length,14);
});
test('source mutation, missing bytes and decoding drift fail the actual byte validator',()=>{
  const f=loadHistoricalHeadFixture(),row=f.manifest.sourceRows.find(row=>row.path===f.manifest.entryPath),bytes=f.read(row.path);
  const changed=Buffer.from(bytes);changed[0]^=1;assert.throws(()=>validateHistoricalBytes(row,changed));
  assert.throws(()=>validateHistoricalBytes(row,bytes.subarray(1)));assert.throws(()=>validateHistoricalBytes(row,Buffer.concat([bytes,Buffer.from('\n')])));
});
test('path traversal, unbound current imports and aliases have no live filesystem fallback',()=>{
  const {manifest}=loadHistoricalHeadFixture(),base='file:///fixture/virtual/',parent=base+manifest.entryPath;
  assert.equal(resolveHistoricalModule(base,parent,'../lib/head-atlas-links.ts',manifest.modulePaths),base+'lib/head-atlas-links.ts');
  for(const specifier of ['../../../../current.ts','@/lib/current','file:///current.ts','../lib/unbound.ts','../lib/head-atlas-links.ts?latest'])assert.throws(()=>resolveHistoricalModule(base,parent,specifier,manifest.modulePaths));
});
test('missing/duplicate paths and forged source roles fail before registering the fixture',()=>{
  const {manifest}=loadHistoricalHeadFixture();
  for(const change of [value=>value.sourceRows.pop(),value=>value.modulePaths[0]=value.modulePaths[1],value=>value.sourceReceiptSha256='0'.repeat(64),value=>value.sourceRows[0].fixture='../current.ts']){
    const value=structuredClone(manifest);change(value);assert.throws(()=>validateHistoricalManifest(value));
  }
});
