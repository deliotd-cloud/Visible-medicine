import assert from 'node:assert/strict';
import test from 'node:test';
import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import {restoreReasoningRegistry} from './reasoning-current-source-epoch.mjs';
import {CURRENT_ATLAS_REVISION,currentAtlasDeliveryRoot} from './current-atlas-delivery.mjs';

test('later reasoning cohorts preserve the complete original registry and reject drift',()=>{
 const root=currentAtlasDeliveryRoot();
 const source=revision=>execFileSync('git',['--no-replace-objects','-C',root,'show',revision+':lib/reasoning-questions.ts'],{windowsHide:true,maxBuffer:1e6});
 const historical=source('9fba9a1e24b6669aafd48e945d55fc0939d50ab2'),current=source(CURRENT_ATLAS_REVISION);
 assert.deepEqual(readFileSync('atlas-review/lib/reasoning-questions.ts'),current);
 assert.deepEqual(restoreReasoningRegistry(current,historical),historical);
 for(const [from,to]of [
  ['c.region','s.region'],
  ['abdominalVesselReasoningSourceMatches(s, c.key)','true'],
  ['...ventricularLandmarkReasoningConcepts','...abdominalVesselReasoningConcepts'],
 ]){
  assert(current.toString().includes(from));
  assert.throws(()=>restoreReasoningRegistry(Buffer.from(current.toString().replace(from,to)),historical),/current reasoning registry/);
 }
 const altered=Buffer.from(historical);altered[0]^=1;
 assert.throws(()=>restoreReasoningRegistry(current,altered),/original reasoning registry/);
});
