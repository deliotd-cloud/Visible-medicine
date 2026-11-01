import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import test from 'node:test';
import {validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';
import {assertCervicalRoleIdentity,assertCompleteCervicalChild,
  authenticatedHistoricalCervicalCollector,authenticateCervicalCollector} from './cervical-delivery-roles.mjs';

const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const base=new URL('./fixtures/cervical-delivery-roles/',import.meta.url);
const metadata=JSON.parse(readFileSync(new URL('manifest.json',base),'utf8'));
const original=readFileSync(new URL('original-one.mjs.raw',base));
const currentWrapper=readFileSync(new URL('./atlas-cervical-projection-xray.test.mjs',import.meta.url));
const collector=authenticatedHistoricalCervicalCollector();
const priorReceiptPath='F:/VisibleMedicine/staging/20261025-cervical-role-website/SOURCE_CANDIDATE.json';
const priorReceiptSha='77d9a0e3ddbae2b32376e8c6205451d1deb8d2109378697d64e9ed59b6999270';
const priorPinPath='tests/fixtures/current-atlas-delivery.json';
// Retained earlier delivery epoch. The current delivery is authenticated by
// validateCurrentAtlasDelivery, so this identity must now be rejected there.
const prior445=Object.freeze({
 source:'44516d0ab85be6c6d6a3accec42b1e7372a0886b',
 sourceTree:'751918d281359cef629b37288697e3a9beec4d3e',
 runtimeSources:Object.fromEntries(['head-neck','shoulder','lower-limb','female-pelvis'].map(name=>[name,'44516d0ab85be6c6d6a3accec42b1e7372a0886b'])),
 reviewIntegration:'86367e17f6dc52b5e051184cedf3c1c30cdc6ca6707eaaf0cf8a84d6d2a412e3',
 reviewSourceFiles:1632,viewerFiles:54,viewerPackages:24,
});

test('only exact whole cervical source and collector payload enter the historical inverse',()=>{
 assert.equal(sha(original),metadata.original.sha256);
 assert.equal(sha(collector),metadata.collectorSha256);
 assert.equal(sha(currentWrapper),'1a4fd63e6fdb219a895bef90b67eda6d8252aefda4561993ae8d8270693ac78d');
 assert.deepEqual(authenticateCervicalCollector(currentWrapper),original);
 assert.deepEqual(authenticateCervicalCollector(original),original);
 assert.deepEqual(authenticateCervicalCollector(collector),original);
 for(const altered of [Buffer.concat([collector,Buffer.from('\n')]),
   Buffer.from(collector.toString('utf8').replace('await runOriginalCervicalRole();','await runOriginalCervicalRole(1);')),
   Buffer.from(collector.toString('utf8').replace('whole original cervical proof','weakened cervical proof')),
   Buffer.concat([original,Buffer.from('\n')]),
   Buffer.concat([currentWrapper,Buffer.from('\n')]),
   Buffer.from(currentWrapper.toString('utf8').replace('runNineHistory','runNineHistoryChanged'))]){
  assert(!altered.equals(collector)&&!altered.equals(original)&&!altered.equals(currentWrapper),'Effective source mutation');
  assert.throws(()=>authenticateCervicalCollector(altered),'Changed source refuses');
 }
});

test('current and historical delivery identities refuse crossed family and Review roles',()=>{
 const current=validateCurrentAtlasDelivery();
 const historical=JSON.parse(readFileSync(metadata.historicalPaths.website+'/tests/fixtures/current-atlas-delivery.json','utf8'));
 const receiptBytes=readFileSync(priorReceiptPath);
 assert.equal(sha(receiptBytes),priorReceiptSha,'Exact prior 727 website receipt');
 const receipt=JSON.parse(receiptBytes);
 assert.equal(receipt.website,'F:/VisibleMedicine/staging/20261025-cervical-role-website/website');
 const rows=receipt.sourceRows.filter(row=>row.path===priorPinPath);
 assert.equal(rows.length,1,'One prior 727 delivery pin');
 const priorBytes=readFileSync(receipt.website+'/'+priorPinPath);
 assert.equal(priorBytes.length,rows[0].bytes);
 assert.equal(sha(priorBytes),rows[0].sha256,'Exact receipt-bound prior 727 pin');
 const prior=JSON.parse(priorBytes);
 assert.throws(()=>assertCervicalRoleIdentity(current,prior445));
 assertCervicalRoleIdentity(prior,metadata.identities.current);
 assertCervicalRoleIdentity(historical,metadata.identities.historical);
 assert.throws(()=>assertCervicalRoleIdentity(historical,metadata.identities.current));
 assert.throws(()=>assertCervicalRoleIdentity(current,metadata.identities.current));
 assert.throws(()=>assertCervicalRoleIdentity(prior,metadata.identities.historical));
 assert.throws(()=>assertCervicalRoleIdentity(current,metadata.identities.historical));
 const mixed=structuredClone(current);mixed.runtimeSources.shoulder=metadata.identities.historical.runtimeSources.shoulder;
 assert.throws(()=>validateCurrentAtlasDelivery({pin:mixed}),'Historical family cannot enter current graph');
 const changed=structuredClone(current);changed.reviewIntegration='0'.repeat(64);
 assert.throws(()=>validateCurrentAtlasDelivery({pin:changed}),'Forged Review cannot enter current graph');
});

test('historical child transport refuses incomplete or contradictory TAP',()=>{
 const result={code:0,signal:null};
 const good=['TAP version 13','ok 1 - complete original','1..1','# tests 1','# pass 1','# fail 0',
  '# cancelled 0','# skipped 0','# todo 0',''];
 assert.deepEqual(assertCompleteCervicalChild(result,good.join('\n')),
  {tests:1,pass:1,fail:0,cancelled:0,skipped:0,todo:0});
 const changed=(from,to)=>good.join('\n').replace(from,to);
 for(const tap of [changed('ok 1','not ok 1'),changed('ok 1','ok 1 # SKIP'),
  changed('ok 1','ok 1 # TODO'),changed('ok 1','ok 2'),changed('1..1','1..2'),
  changed('# tests 1','# tests 2'),changed('# pass 1','# pass 0'),
  good.join('\n').replace('1..1\n',''),good.join('\n')+'not ok 2 - contradiction\n',
  good.join('\n')+'# pass 1\n','Bail out!\n'+good.join('\n')])
  assert.throws(()=>assertCompleteCervicalChild(result,tap),'False or incomplete child TAP refuses');
 for(const failure of [{code:1,signal:null},{code:0,signal:'SIGTERM'},
  {code:0,signal:null,error:'start failed'}])
  assert.throws(()=>assertCompleteCervicalChild(failure,good.join('\n')),'Child transport failure refuses');
});
