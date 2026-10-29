import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {runFrozenNavigation43Epoch,historicalNavigation43ValidateCurrentAtlasDelivery} from './historical-navigation-43-epoch.mjs';
import {CURRENT_ATLAS_REVISION,currentAtlasDeliveryRoot,validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';
import {execFileSync} from 'node:child_process';
runFrozenNavigation43Epoch(import.meta.url);

test('current delivery binding is closed independently of frozen register43',()=>{
 const root=new URL('../',import.meta.url);
 const read=relative=>fs.readFileSync(new URL(relative,root));
 const pin=JSON.parse(read('tests/fixtures/current-atlas-delivery.json'));
 historicalNavigation43ValidateCurrentAtlasDelivery();
 const current=validateCurrentAtlasDelivery({pin,read});
 assert.equal(current.source,CURRENT_ATLAS_REVISION);
 assert.equal(current.source,'9cef8900417bf592d3130f6ff92bf3e748cb55fc');
 assert.equal(current.runtimeSources['head-neck'],current.source);
 for(const name of ['shoulder','lower-limb','female-pelvis'])assert.equal(current.runtimeSources[name],current.source);
 const atlas=currentAtlasDeliveryRoot();
 const git=(...args)=>execFileSync('git',args,{cwd:atlas,encoding:'utf8',windowsHide:true,
  env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}}).trim();
 assert.equal(git('merge-base','2381efe43b75f8a7fb768a069eecd7268c508dac',current.source),
  '2381efe43b75f8a7fb768a069eecd7268c508dac','Frozen register43 successor remains an ancestor');
 assert.equal(git('rev-parse',`${current.source}^{tree}`),current.sourceTree);
});
