import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const contracts={
 'clinical-review-axillary-branch-xray.test.ts':{
  current:'61f897b2e0a9eb612f986fb2aa3c32e29efe23ac8828e5119897080400462663',
  prior:'ab1425cecf8040d098eb74926b2d3dfcf4a98f25b94c64c3ad3a4ac525444166',
  reducer:'n'},
 'clinical-review-girdle-muscle-xray.test.ts':{
  current:'f3947bb370e3fa79a8929c7d57d5dd65dc809e6104bbdcdddd1e8e65231b52ae',
  prior:'66d1e61d1708b8bdc70468ae9d757b33ddecca409a9078b1c439d1378d7ea0e1',
  reducer:'count'},
};

export function restoreClinicalStructureCurrentRole(name,bytes){
 const contract=contracts[name];assert(contract,'Declared clinical feature only');
 assert.equal(sha(bytes),contract.current,'Exact current clinical consumer');
 let source=bytes.toString();
 const once=(after,before)=>{assert.equal(source.split(after).length,2,'One exact structure-source seam');source=source.replace(after,before);};
 once('assert.deepEqual(current.structures,live.structures);assert.deepEqual(epoch.structures,old.structures);',
  'assert.deepEqual(current.structures,live.structures);assert.deepEqual(live.structures,old.structures);');
 once('assert.deepEqual(epoch.dissectionProfiles,old.dissectionProfiles);',
  'assert.deepEqual(live.dissectionProfiles,old.dissectionProfiles);');
 once('assert.equal(current.regionalTours.length,53);','assert.equal(current.regionalTours.length,51);');
 once(`assert.equal(current.regionalTours.reduce((${contract.reducer}:number,tour:any)=>${contract.reducer}+tour.steps.length,0),317);`,
  `assert.equal(current.regionalTours.reduce((${contract.reducer}:number,tour:any)=>${contract.reducer}+tour.steps.length,0),309);`);
 const restored=Buffer.from(source);
 assert.equal(sha(restored),contract.prior,'Complete reviewed clinical source restored');
 return restored;
}
