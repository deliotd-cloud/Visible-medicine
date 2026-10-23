import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import {headFeatureRoles,readBeforeHeadFeatureSource,restoreBeforeHeadFeatureRepair,assertUnchangedHeadFeatureParent} from './head-feature-roles-preservation.mjs';
import {readHistorical2381Source,validateHistorical2381Delivery,assertActualHeadFeatureDelivery} from './head-feature-source-roles.mjs';
import {validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url));
for(const name of Object.keys(headFeatureRoles))test('complete original feature source and enumerated repair survive: '+name,()=>{
 const old=readBeforeHeadFeatureSource(name),actual=read('tests/'+name);
 assert.deepEqual(restoreBeforeHeadFeatureRepair(name,actual,old),old);
 assert.throws(()=>restoreBeforeHeadFeatureRepair(name,Buffer.concat([actual,Buffer.from('\n// forged\n')]),old));
 assert.throws(()=>restoreBeforeHeadFeatureRepair(name,actual,Buffer.concat([old,Buffer.from('\n// forged\n')])));
 assert.throws(()=>restoreBeforeHeadFeatureRepair(name,old,old));
});
test('actual and historical validators and original inverse helpers are not weakened',()=>{
 for(const path of ['tests/current-atlas-delivery.mjs','tests/fixtures/current-atlas-delivery.json',
  'tests/atlas-source-repo.mjs','tests/surface-binder-history-inverse.mjs',
  'tests/zero-registration-current-roles-inverse.mjs','tests/head-tools-wider-consumer-inverse.mjs',
  'tests/head-tools-epoch-20261022.mjs'])assertUnchangedHeadFeatureParent(path,read(path));
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
