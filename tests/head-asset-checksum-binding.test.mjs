import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import crypto from 'node:crypto';
const read=relative=>fs.readFileSync(new URL('../'+relative,import.meta.url));
const json=relative=>JSON.parse(read(relative));
const sha=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
test('asset checksum dependency and commercial MIT notices are exact and served locally',()=>{
 const pkg=json('package.json'),lock=json('package-lock.json');
 assert.equal(pkg.dependencies['@noble/hashes'],'2.4.0');
 assert.equal(lock.packages[''].dependencies['@noble/hashes'],'2.4.0');
 const dep=lock.packages['node_modules/@noble/hashes'];
 assert.equal(dep.version,'2.4.0');assert.equal(dep.license,'MIT');
 assert.equal(dep.integrity,'sha512-X5XaVWZIBCT7HHZGm5I7ZQXDwLG+bGXuSrMQAW+7Zvl87h1kmc1ZB1VSRJcpUfoUrGQp4Fkoxm5kZ+Ms+aW+eA==');
 assert.equal(dep.dependencies,undefined);
 const license=read('LICENSES/head-atlas-noble-hashes-LICENSE.txt');
 assert.equal(sha(license),'4f221aee6e072336700c408c68ab3b96a3fc09f6aebe6f48f1bd99e5ef13faec');
 assert.deepEqual(read('public/licenses/head-atlas-noble-hashes-LICENSE.txt'),license);
 assert.match(read('LICENSES/THIRD_PARTY_NOTICES.md').toString(),/@noble\/hashes/);
});
test('normal Review binds the exact checksum helper, package lock and locally served notice',()=>{
 const binding=json('atlas-review/integration-inputs.json');
 for(const relative of ['lib/head-asset-checksum.ts','lib/head-atlas-import.ts','package-lock.json','LICENSES/head-atlas-noble-hashes-LICENSE.txt','public/licenses/head-atlas-noble-hashes-LICENSE.txt']){
   const entries=binding.inputs.filter(row=>row.path===relative);assert.equal(entries.length,1,relative);
   assert.equal(entries[0].sha256,sha(read(relative)),relative);
 }
 const helper=read('lib/head-asset-checksum.ts').toString();
 assert.match(helper,/from '@noble\/hashes\/sha2\.js'/);
 assert.doesNotMatch(helper,/subtle|fetch\s*\(|localStorage|indexedDB|sendBeacon|XMLHttpRequest|\.slice\(/);
});
test('the preceding d6 delivery remains immutable historical proof, not current admission',()=>{
 const previous=read('tests/fixtures/current-atlas-delivery-before-incremental-checksum.txt');
 assert.equal(sha(previous),'9e89397b23ed1ae3ddda0cf88eb1dc88c6bffa104d223e88dd081e510ef956a7');
 const pin=JSON.parse(previous),current=JSON.parse((()=>{const bytes=read('tests/fixtures/current-atlas-delivery-bc925194.json');assert.equal(sha(bytes),'f50171ac10bcf767cc29eb34cae7e873ff526a3940b03a0a59fe6d932cf01eab');return bytes;})());
 assert.equal(pin.reviewIntegration,'d6dd10a3b38cc7f42d9a7a12f7f30a5110b5ed73b6c283b34ff6060e0df42597');
 assert.equal(pin.source,current.source);assert.equal(pin.sourceTree,current.sourceTree);
 assert.notEqual(pin.reviewIntegration,current.reviewIntegration);
});
