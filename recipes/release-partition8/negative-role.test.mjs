import assert from 'node:assert/strict';
import test from 'node:test';
import {runDeepBrainHistoricalRole} from './website/tests/deep-brain-history-role.mjs';
const historical='G:/VisibleMedicine-temp/proposals/20261031-release-partition8-repair/historical-native';
const current='F:/VisibleMedicine/atlas';
test('wrong dedicated historical native is rejected before child',async()=>{
 const before=process.env.VM_DEEP_BRAIN_HISTORY_NATIVE,outer=process.env.VM_DBFOOT_NATIVE;
 try{process.env.VM_DEEP_BRAIN_HISTORY_NATIVE=current;process.env.VM_DBFOOT_NATIVE=current;
  await assert.rejects(runDeepBrainHistoricalRole(),/No crossed dedicated historical native context/);
  assert.equal(process.env.VM_DBFOOT_NATIVE,current);
 }finally{if(before===undefined)delete process.env.VM_DEEP_BRAIN_HISTORY_NATIVE;else process.env.VM_DEEP_BRAIN_HISTORY_NATIVE=before;
  if(outer===undefined)delete process.env.VM_DBFOOT_NATIVE;else process.env.VM_DBFOOT_NATIVE=outer;}
});
test('crossed outer native is rejected before child',async()=>{
 const before=process.env.VM_DEEP_BRAIN_HISTORY_NATIVE,outer=process.env.VM_DBFOOT_NATIVE;
 try{delete process.env.VM_DEEP_BRAIN_HISTORY_NATIVE;process.env.VM_DBFOOT_NATIVE=historical;
  await assert.rejects(runDeepBrainHistoricalRole(),/No crossed outer current native context/);
  assert.equal(process.env.VM_DBFOOT_NATIVE,historical);
 }finally{if(before===undefined)delete process.env.VM_DEEP_BRAIN_HISTORY_NATIVE;else process.env.VM_DEEP_BRAIN_HISTORY_NATIVE=before;
  if(outer===undefined)delete process.env.VM_DBFOOT_NATIVE;else process.env.VM_DBFOOT_NATIVE=outer;}
});
