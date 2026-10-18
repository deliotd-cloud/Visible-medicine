import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {plexusHash} from '../scripts/plexus-review-fingerprints.mjs';
import {rebindPlexusDependency} from '../scripts/rebind-plexus-review-dependency.mjs';
const packetBytes=readFileSync('tests/fixtures/plexus-before-head-checksum.txt');
const beforeLock=readFileSync('tests/fixtures/plexus-before-head-checksum-lock.txt'),afterLock=readFileSync('package-lock.json');
const originalPacket=JSON.parse(packetBytes),current=JSON.parse(readFileSync('lib/plexus-review-manifest.json'));
const actual=readFileSync('.local/plexus-review/assets.ts','utf8');
const marker='export const plexusReviewAssets: Record<string,string> = ';
const assets=JSON.parse(actual.split(marker)[1].trim().replace(/;$/,''));
assets['index.html']=Buffer.from(Buffer.from(assets['index.html'],'base64').toString('utf8').replaceAll(current.context.materialHash,originalPacket.context.materialHash)).toString('base64');
const original=actual.slice(0,actual.indexOf(marker))+marker+JSON.stringify(assets)+';\n';
const read=relative=>readFileSync(relative);
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
 assert.deepEqual(result.packet,current);assert.equal(result.moduleText,actual);
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
