import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';
import {validateChecklist} from '../scripts/refresh-completion-checklist.mjs';

const read=p=>readFileSync(new URL('../'+p,import.meta.url));
const sha=b=>createHash('sha256').update(b).digest('hex');
const frozen=(name,hash)=>{const bytes=read('tests/fixtures/'+name);assert.equal(sha(bytes),hash);return bytes;};
const beforeTest=frozen('current-atlas-delivery-before-check-mri.mjs.raw','93f2c445671038c2b6d4451e1537ca46c4521d55e6af4c67943e455cd88f5c40');
const beforePin=JSON.parse(frozen('current-atlas-delivery-before-check-mri.json.raw','00279e09c93e73bf775a1702cd163b7619ce99c5211707d32150da6efeb550f0'));
const beforeRegister=JSON.parse(frozen('completion-checklist-before-check-mri.json.raw','0e21b34cb08141409e4c6927b4caee719a0f0837063ecfc75261732883061e6c'));
const source='f5052a1906bf9b87e5235bda57d367b1103729db',tree='36381d525f7c6886743bcec00fcee96931d65c58';

test('current delivery changes only its two declared source/tree expectations; all assertions remain exact',()=>{
 let restored=read('tests/current-atlas-delivery.test.mjs').toString('utf8');
 for(const [after,before]of [
  [`assert.equal(CURRENT_ATLAS_REVISION,'${source}');`,"assert.equal(CURRENT_ATLAS_REVISION,'509b01da5d72f33bd774e4a59d63e2406af1f2ff');"],
  [`assert.equal(pin.sourceTree,'${tree}');`,"assert.equal(pin.sourceTree,'a9a1581bd6a3220b7d4b2554644fe0c56b688430');"],
 ]){assert.equal(restored.split(after).length,2);restored=restored.replace(after,before);}
 assert.deepEqual(Buffer.from(restored),beforeTest);
});

test('prior complete509b pin is immutable but cannot admit the new four-module and Review source',()=>{
 assert.equal(beforePin.source,'509b01da5d72f33bd774e4a59d63e2406af1f2ff');
 assert.equal(beforePin.sourceTree,'a9a1581bd6a3220b7d4b2554644fe0c56b688430');
 assert.equal(beforePin.reviewIntegration,'5a3836a48643bdef042c61dcc0d27bb252b130947238b5a154660f3eab8a2a0b');
 assert.equal(beforePin.reviewSourceFiles,1538);assert.equal(Object.keys(beforePin.documents).length,12);
 assert.throws(()=>validateCurrentAtlasDelivery({pin:beforePin}),/Current delivery changed:/);
 const current=validateCurrentAtlasDelivery();assert.equal(current.source,source);assert.equal(current.sourceTree,tree);
 assert.notEqual(current.reviewIntegration,beforePin.reviewIntegration);
 for(const key of ['schema','reviewSourceFiles','viewerFiles','viewerPackages'])assert.deepEqual(current[key],beforePin[key]);
 assert.deepEqual(Object.keys(current.documents),Object.keys(beforePin.documents));
});

test('register63 changes delivered source metadata, not the71 requirements, eight ideas or clinical gates',()=>{
 const current=validateChecklist(JSON.parse(read('docs/completion-checklist.json'))),pin=validateCurrentAtlasDelivery();
 assert.equal(beforeRegister.revision,62);assert.equal(current.revision,63);
 for(const key of ['items','roots','rules','statusDefinitions'])assert.deepEqual(current[key],beforeRegister[key],key);
 assert.equal(current.items.length,71);assert.equal(current.items.filter(i=>i.scope==='optional').length,8);
 assert.deepEqual(current.changeLog.slice(1),beforeRegister.changeLog);assert.equal(current.changeLog[0].revision,63);
 const rest=b=>Object.fromEntries(Object.entries(b).filter(([k])=>!['atlasCommit','atlasTree','reviewIntegration','reviewSourceFiles'].includes(k)));
 assert.deepEqual(rest(current.baseline),rest(beforeRegister.baseline));
 assert.equal(current.baseline.atlasCommit,pin.source);assert.equal(current.baseline.atlasTree,pin.sourceTree);
 assert.equal(current.baseline.reviewIntegration,pin.reviewIntegration);assert.equal(current.baseline.reviewSourceFiles,1538);
 assert.equal(current.baseline.privateClinicalDecisionCounts,null);assert.equal(current.baseline.publicReleaseApproval,null);
 assert.equal(current.pendingAtlasSource.websiteImported,true);assert.equal(current.pendingAtlasSource.commit,source);
 for(const key of ['rootDraftPlacements','rootPendingPlacements','rootGeneratedIdentificationPlacements'])
  assert.equal(current.pendingAtlasSource[key],beforeRegister.pendingAtlasSource[key]);
 assert.match(current.pendingAtlasSource.note,/no approval, scan or registration/i);
});
