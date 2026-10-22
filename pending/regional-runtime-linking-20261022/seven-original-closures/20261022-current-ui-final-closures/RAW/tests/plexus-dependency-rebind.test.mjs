import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {plexusHash} from '../scripts/plexus-review-fingerprints.mjs';
import {rebindPlexusDependency} from '../scripts/rebind-plexus-review-dependency.mjs';
import {readHistoricalWebsite,readPostLockCheckpoint} from './plexus-historical-source.mjs';
const packetBytes=readFileSync('tests/fixtures/plexus-before-head-checksum.txt');
const beforeLock=readFileSync('tests/fixtures/plexus-before-head-checksum-lock.txt'),afterLock=readFileSync('package-lock.json');
const originalPacket=JSON.parse(packetBytes),current=JSON.parse(readFileSync('lib/plexus-review-manifest.json'));
const actual=readFileSync('.local/plexus-review/assets.ts','utf8');
const marker='export const plexusReviewAssets: Record<string,string> = ';
const assets=JSON.parse(actual.split(marker)[1].trim().replace(/;$/,''));
assets['index.html']=Buffer.from(Buffer.from(assets['index.html'],'base64').toString('utf8').replaceAll(current.context.materialHash,originalPacket.context.materialHash)).toString('base64');
const original=actual.slice(0,actual.indexOf(marker))+marker+JSON.stringify(assets)+';\n';
const read=relative=>relative==='package-lock.json'?afterLock:readHistoricalWebsite(relative);
test('the exact earlier delivery helper and its historical source expectation are retained',()=>{
 const bytes=readFileSync('tests/fixtures/plexus-delivery-before-head-checksum.txt');
 assert.equal(plexusHash(bytes),'4bccfb64fb9a675a2839a1a6d03d3cb195958b8e9838bc67ec87c7802561d6d6');
 assert(bytes.toString().includes("assert.equal(broad.revision,'9fba9a1e24b6669aafd48e945d55fc0939d50ab2')"));
});
test('immutable source and exact dependency-only transition reproduce the private packet without changing topology or non-HTML assets',()=>{
 assert.equal(plexusHash(packetBytes),'846970bb1ec6b27e9b3ba5eeddaf9e773915802fe1374c29c2739382455f8140');
 assert.equal(plexusHash(beforeLock),'da6513ef764b1291e1bc87ebd50184971ebe7ffe44be24e9753e8071fe297b68');
 const beforePacket=Buffer.from(packetBytes),beforeModule=original;
 const result=rebindPlexusDependency(packetBytes,original,beforeLock,afterLock,read);
 assert.deepEqual(packetBytes,beforePacket);assert.equal(original,beforeModule);
 assert.deepEqual(result.packet,readPostLockCheckpoint());
 assert.equal(plexusHash(result.moduleText),'c9c6fbcb71502709b87fefee105bde32cce51cdf88065ec550caa6d8a665bec6');
 assert.equal(result.before.topologyHash,result.after.topologyHash);
 assert.notEqual(result.before.presentationHash,result.after.presentationHash);
 assert.notEqual(result.before.materialHash,result.after.materialHash);
 for(const key of ['admissions','clinicalValidation','patientDataIncluded'])assert.equal(result.packet[key],originalPacket[key]);
 assert.deepEqual(result.packet.study,originalPacket.study);
 assert.deepEqual(result.packet.files.filter(row=>row.name!=='index.html'),originalPacket.files.filter(row=>row.name!=='index.html'));
});
test('unknown lock changes, original module tampering and unrelated website drift are refused',()=>{
 assert.throws(()=>rebindPlexusDependency(packetBytes,original,beforeLock,Buffer.from(afterLock+' '),read));
 assert.throws(()=>rebindPlexusDependency(packetBytes,original+' ',beforeLock,afterLock,read));
 assert.throws(()=>rebindPlexusDependency(packetBytes,original,beforeLock,afterLock,p=>p==='lib/plexus-review-api.ts'?Buffer.from('changed authority'):read(p)));
});
test('coordinated repinning of another source, changed scope or repeated transition cannot bypass the immutable baseline',()=>{
 const forged=structuredClone(originalPacket),row=[...forged.topologyInputs,...forged.presentationInputs].find(row=>row.path==='lib/plexus-review-api.ts');assert(row);
 row.sha256=plexusHash('changed authority');
 assert.throws(()=>rebindPlexusDependency(Buffer.from(JSON.stringify(forged,null,2)+'\n'),original,beforeLock,afterLock,p=>p==='lib/plexus-review-api.ts'?Buffer.from('changed authority'):read(p)));
 for(const key of ['admissions','clinicalValidation','patientDataIncluded']){const changed=structuredClone(originalPacket);changed[key]=true;assert.throws(()=>rebindPlexusDependency(Buffer.from(JSON.stringify(changed,null,2)+'\n'),original,beforeLock,afterLock,read));}
 assert.throws(()=>rebindPlexusDependency(Buffer.from(JSON.stringify(current,null,2)+'\n'),actual,beforeLock,afterLock,read));
});
test('later 16-to-18 presentation dependency extension is separate from the immutable lock transition',()=>{
 const historical=readPostLockCheckpoint();
 assert.equal(plexusHash(readFileSync('lib/plexus-review-manifest.json')),'b09b4b8ad4adbe33efecbfe5c01b2778a05cc5abbe600e385d9da9be3d621fc2');
 assert.equal(historical.presentationInputs.length,16);assert.equal(current.presentationInputs.length,18);
 assert.equal(historical.context.materialHash,'95a91de1490fadf54bf7f27d891328780c59c97a705ca09d1ae0cd2182b6310e');
 assert.equal(current.context.materialHash,'34a6c5f096d84897033fab883a4404c49f897ddc5c2ebaeedc7af10829b5cdd4');
 const changes=new Map([
  ['scripts/import-plexus-review.mjs','3c04c80a6be6ae27af8f9e34c2dca7e2c4215973366f135dae2ceb223700f98b'],
  ['components/PlexusReviewWorksheet.tsx','9eb612a0a5a117eca2817072c644d17b805381933f4a06bdaa3d17ebaec99478'],
  ['lib/clinical-review-fetch.ts','61f43dc7fdb4d8ac4b6ab2dc69d2901ee23f02e2e87801a2978719ccc8a8952c'],
 ]);
 const additions=[
  {kind:'website',path:'components/GroupedReviewConfirmation.tsx',sha256:'b5c844502c8f44591a776d7abc1468b174af6529108576e13c944f36bebd51f4'},
  {kind:'website',path:'lib/review-draft-autosave.ts',sha256:'9192c9af4dc0ad1c6bbe31eb762846dcf1d2af81753e9f6244fd4ea81c8249db'},
 ];
 const expected=structuredClone(historical.presentationInputs);
 expected.splice(3,0,...additions);
 for(const row of expected)if(changes.has(row.path))row.sha256=changes.get(row.path);
 assert.deepEqual(current.presentationInputs,expected);
 for(const row of [...additions,...current.presentationInputs.filter(row=>changes.has(row.path))])assert.equal(plexusHash(readFileSync(row.path)),row.sha256,`Live source mismatch: ${row.path}`);
 assert.deepEqual(current.topologyInputs,historical.topologyInputs);
 assert.deepEqual(current.study,historical.study);
 assert.deepEqual(current.packages,historical.packages);
 assert.deepEqual(current.context.checklists,historical.context.checklists);
 assert.deepEqual(current.files.filter(row=>row.name!=='index.html'),historical.files.filter(row=>row.name!=='index.html'));
 assert.deepEqual(current.files.map(row=>row.name),historical.files.map(row=>row.name));
 for(const key of ['purpose','admissions','clinicalValidation','patientDataIncluded'])assert.deepEqual(current[key],historical[key]);
 for(const key of ['sourceCommit','topologyHash','clinicalApproved','learnerCatalogAdmission','frame','partCount','connectionCount','checklistVersion'])assert.deepEqual(current.context[key],historical.context[key]);
 assert.equal(current.admissions,0);assert.equal(current.clinicalValidation,false);assert.equal(current.patientDataIncluded,false);
 assert.equal(current.context.clinicalApproved,false);assert.equal(current.context.learnerCatalogAdmission,false);
});
