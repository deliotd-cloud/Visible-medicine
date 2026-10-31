import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import test from 'node:test';
import {headFeatureRoles,readBeforeHeadFeatureSource,restoreBeforeHeadFeatureRepair,assertUnchangedHeadFeatureParent,readSealedHeadFeatureParent,assertCurrentHeadFeaturePin} from './head-feature-roles-preservation.mjs';
import {readHistorical2381Source,validateHistorical2381Delivery,assertActualHeadFeatureDelivery} from './head-feature-source-roles.mjs';
import {validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url));
const sha=b=>createHash('sha256').update(b).digest('hex');
const sealed=(file,digest)=>{const bytes=readFileSync(file);assert.equal(sha(bytes),digest);return JSON.parse(bytes);};
const parent=sealed('F:/VisibleMedicine/staging/20261024-head-tools-proof/SOURCE_BOUND.json','1071697c3bd7da15fa7b3daa563f4d55ce3d9b4ae1854d9eb36fe1790a6492e0');
const successor=sealed('F:/VisibleMedicine/staging/20261027-head-release-repairs/SOURCE_CANDIDATE.json','bd6d2004d744d23fe252d3b9d15d46f760c7f4d418f374c3d84f13df4ab425b7');
const archived=(receipt,path)=>{const rows=receipt.sourceRows.filter(r=>r.path===path);assert.equal(rows.length,1,path);const bytes=readFileSync(receipt.website+'/'+path);assert.equal(bytes.length,rows[0].bytes,path);assert.equal(sha(bytes),rows[0].sha256,path);return bytes;};
for(const name of Object.keys(headFeatureRoles))test('complete original feature source and enumerated repair survive: '+name,()=>{
 const old=readBeforeHeadFeatureSource(name),actual=archived(successor,'tests/'+name);
 assert.deepEqual(restoreBeforeHeadFeatureRepair(name,actual,old),old);
 assert.throws(()=>restoreBeforeHeadFeatureRepair(name,Buffer.concat([actual,Buffer.from('\n// forged\n')]),old));
 assert.throws(()=>restoreBeforeHeadFeatureRepair(name,actual,Buffer.concat([old,Buffer.from('\n// forged\n')])));
 assert.throws(()=>restoreBeforeHeadFeatureRepair(name,old,old));
});
test('actual and historical validators and original inverse helpers are not weakened',()=>{
 for(const path of ['tests/current-atlas-delivery.mjs','tests/fixtures/current-atlas-delivery.json',
  'tests/atlas-source-repo.mjs','tests/surface-binder-history-inverse.mjs',
  'tests/zero-registration-current-roles-inverse.mjs','tests/head-tools-wider-consumer-inverse.mjs',
  'tests/head-tools-epoch-20261022.mjs'])assertUnchangedHeadFeatureParent(path,path==='tests/fixtures/current-atlas-delivery.json'?readSealedHeadFeatureParent(path):archived(parent,path));
 assertCurrentHeadFeaturePin(archived(successor,'tests/fixtures/current-atlas-delivery.json'));
 const current=validateCurrentAtlasDelivery();
 assert.equal(current.source,'c32bc81cf0fd7ec22fa83e8b1365019297f9a0b3');
 assert.equal(current.sourceTree,'d7ead7f3673ddf5c4b68db755b559b08b921eec6');
 assert.equal(current.reviewSourceFiles,1647);
});
test('all twelve historical and all twelve actual documents refuse byte mutations in their own roles',()=>{
 const old=validateHistorical2381Delivery(),actual=assertActualHeadFeatureDelivery();
 assert.equal(Object.keys(old.documents).length,12);assert.equal(Object.keys(actual.documents).length,12);
 for(const path of Object.keys(old.documents))assert.throws(()=>validateHistorical2381Delivery({
  read:p=>p===path?Buffer.concat([readHistorical2381Source(p),Buffer.from('\n')]):readHistorical2381Source(p),
 }),path);
 for(const path of Object.keys(actual.documents))assert.throws(()=>validateCurrentAtlasDelivery({
  read:p=>p===path?Buffer.concat([read(p),Buffer.from('\n')]):read(p),
 }),path);
});
test('source-role readers refuse undeclared/private paths and consumer aliases',()=>{
 for(const path of ['.env.local','../../.env','C:/Cases/private.dcm'])assert.throws(()=>readHistorical2381Source(path));
 assert.throws(()=>readBeforeHeadFeatureSource('other.test.mjs'));
 assert.throws(()=>restoreBeforeHeadFeatureRepair('other.test.mjs',Buffer.from('')));
});
