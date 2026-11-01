import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {advanceContract,requireReviewBuild,sha,source,integration,predecessor} from './contract.mjs';
const fixture=name=>fs.readFileSync(new URL('./fixtures/'+name,import.meta.url));
const original=fixture('predecessor-contract.txt').toString();
test('actual current contract advances only eight exact seams and recovers every predecessor byte',()=>{
 const r=advanceContract(original);assert.equal(r.changes.length,8);let restored=r.text;
 for(const[from,to]of [...r.changes].reverse())restored=restored.replace(to,from);
 assert.equal(restored,original);assert(r.text.includes(`read('${predecessor}.txt')`));
 // The large immutable history assertions and embedded source hashes survive.
 for(const line of original.split(/\r?\n/))if(line.includes('assert.equal(sha('))assert(r.text.includes(line));
});
test('missing, duplicated and already-advanced current seams are refused',()=>{
 const r=advanceContract(original),seam=r.changes[0][0];
 assert.throws(()=>advanceContract(original.replace(seam,'')),/seam missing/);
 assert.throws(()=>advanceContract(original+'\n'+seam),/duplicated/);
 assert.throws(()=>advanceContract(r.text),/seam missing/);
});
function valid(){const manifestBytes=Buffer.from(JSON.stringify({sourceCommit:source,websiteIntegrationSha256:integration,mode:'production',personalRecordsIncluded:false,files:Array(63).fill({}),packages:Array(24).fill({})}));return{result:{passing:true,supervisor:{code:0},process:{terminalObserved:true,exitCode:0,interrupted:false}},receipt:{source,reviewIntegration:integration,viewerManifestSha256:sha(manifestBytes)},manifestBytes};}
test('completed exact Review build is required, not just an emitted manifest',()=>{
 assert.equal(requireReviewBuild(valid()).sourceCommit,source);
 for(const mutate of [x=>delete x.result,x=>x.result.passing=false,x=>x.result.process.terminalObserved=false,x=>x.result.process.interrupted=true,x=>x.result.process.exitCode=1,x=>x.result.supervisor.code=1]){const x=valid();mutate(x);assert.throws(()=>requireReviewBuild(x),/completed successful/);}
});
test('old source, integration, artifact drift and debug builds cannot advance the delivery pin',()=>{
 for(const patch of [{sourceCommit:'7d3ab00f500a738d4f2d261ca6cd768e7f6ce1bc'},{websiteIntegrationSha256:'0'.repeat(64)},{mode:'debug'},{personalRecordsIncluded:true},{files:Array(62).fill({})},{packages:Array(25).fill({})}]){const x=valid();x.manifestBytes=Buffer.from(JSON.stringify({...JSON.parse(x.manifestBytes),...patch}));x.receipt.viewerManifestSha256=sha(x.manifestBytes);assert.throws(()=>requireReviewBuild(x));}
 const x=valid();x.manifestBytes=Buffer.concat([x.manifestBytes,Buffer.from(' ')]);assert.throws(()=>requireReviewBuild(x),/Viewer changed/);
});
test('actual prior viewer cannot be admitted by relabelling its enclosing build receipt',()=>{
 const prior=JSON.parse(fixture('predecessor-pin.json'));
 const x=valid();x.manifestBytes=fixture('predecessor-viewer.json');x.receipt.viewerManifestSha256=sha(x.manifestBytes);
 assert.equal(JSON.parse(x.manifestBytes).sourceCommit,prior.source);
 assert.notEqual(prior.source,source);assert.throws(()=>requireReviewBuild(x));
});
