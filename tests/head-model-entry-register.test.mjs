import test from 'node:test';
import fs from 'node:fs';
import {runFrozenHeadOpen44Epoch} from './historical-head-open-44-epoch.mjs';
import {validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';

runFrozenHeadOpen44Epoch(import.meta.url);

test('current delivery binding is closed independently of frozen register44',()=>{
 const root=new URL('../',import.meta.url);
 const read=relative=>fs.readFileSync(new URL(relative,root));
 const pin=JSON.parse(read('tests/fixtures/current-atlas-delivery.json'));
 validateCurrentAtlasDelivery({pin,read});
});
