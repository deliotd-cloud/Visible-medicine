import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {runFrozenNavigation43Epoch,historicalNavigation43ValidateCurrentAtlasDelivery} from './historical-navigation-43-epoch.mjs';
import {validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';
runFrozenNavigation43Epoch(import.meta.url);

test('current delivery binding is closed independently of frozen register43',()=>{
 const root=new URL('../',import.meta.url);
 const read=relative=>fs.readFileSync(new URL(relative,root));
 const pin=JSON.parse(read('tests/fixtures/current-atlas-delivery.json'));
 historicalNavigation43ValidateCurrentAtlasDelivery();
 const current=validateCurrentAtlasDelivery({pin,read});
 assert.equal(current.source,'2381efe43b75f8a7fb768a069eecd7268c508dac');
 assert.equal(current.runtimeSources['head-neck'],current.source);
 for(const name of ['shoulder','lower-limb','female-pelvis'])assert.equal(current.runtimeSources[name],'190a63238eadcf906abe89dcbb6a67c88afe70b9');
});
