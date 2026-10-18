import test from 'node:test';
import fs from 'node:fs';
import {runFrozenNavigation43Epoch,historicalNavigation43ValidateCurrentAtlasDelivery} from './historical-navigation-43-epoch.mjs';
runFrozenNavigation43Epoch(import.meta.url);

test('current delivery binding is closed independently of frozen register43',()=>{
 const root=new URL('../',import.meta.url);
 const read=relative=>fs.readFileSync(new URL(relative,root));
 const pin=JSON.parse(read('tests/fixtures/current-atlas-delivery.json'));
 historicalNavigation43ValidateCurrentAtlasDelivery({pin,read});
});
