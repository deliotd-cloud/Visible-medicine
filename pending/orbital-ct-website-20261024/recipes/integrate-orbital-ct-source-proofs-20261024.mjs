// Main-owned test-only composition; preserve complete previous proof bytes.
import fs from 'node:fs';import assert from 'node:assert/strict';
import {hash,json} from './seal-simple-website-successor.mjs';
const stage='F:/VisibleMedicine/staging/20261024-orbital-ct-website',site=stage+'/website',proposal='F:/VisibleMedicine/staging/20261024-orbital-ct-role-proposal';
const handoff=json(proposal+'/HANDOFF.json'),files=[];
for(const r of handoff.changed){assert.equal(hash(r.path),r.sha256);const to=site+'/tests/'+r.path.split('/').at(-1);fs.copyFileSync(r.path,to,fs.constants.COPYFILE_EXCL);files.push({path:to.slice(site.length+1),sha256:hash(to)});}
const before=fs.readFileSync(site+'/tests/adjacent-current-tour-source-role.mjs','utf8');
const changes=[
 ["import assert from 'node:assert/strict';","import {assertOrbitalCtCurrentTourSource,assertOrbitalCtCurrentDisplay} from './orbital-ct-current-source-role.mjs';\nimport assert from 'node:assert/strict';"],
 ['sourceCommit=current}={}){','sourceCommit=validateCurrentAtlasDelivery().source}={}){'],
 [" assert.equal(sourceCommit,current,'Only exact b79 Website delivery is current');",` if(sourceCommit==='80d323ec504afc7867e3e716bf735681a29ab5bc'){
  const pin=validateCurrentAtlasDelivery();assert.equal(pin.source,sourceCommit);
  assertOrbitalCtCurrentTourSource({atlasRoot,sourceCommit});
  assertOrbitalCtCurrentDisplay({root:site,manifest:JSON.parse(readFileSync(site+'/atlas-review/manifest.json')),binding:JSON.parse(readFileSync(site+'/atlas-review/integration-inputs.json'))});
  return {sha256:'b1a1bc9d9d80b84d4d98aed1aaa08aa4e9d7313e58bdd40f3b8a10ea0bab215d',gitBlob:'3c5647f29383ba5699b6d387ff528f6b0f8f57b9',oldSha256:'88f195fd9dbfcd4033a5012eeb760f358cca16da7f48cbca8671ef92c69bea97',oldGitBlob:'fb65a9c68d8753fc1789c7e6281e36c2889e0136'};
 }
 assert.equal(sourceCommit,current,'Only exact b79 Website delivery is current');`],
];
let after=before;for(const[a,b]of changes){assert.equal(after.split(a).length,2,a);after=after.replace(a,b);}let inverse=after;for(const[a,b]of [...changes].reverse())inverse=inverse.replace(b,a);assert.equal(inverse,before);
const fixture='tests/fixtures/current-atlas-delivery-studio-b79.mjs.raw';fs.copyFileSync(stage+'/preimages/tests/current-atlas-delivery.test.mjs.raw',site+'/'+fixture,fs.constants.COPYFILE_EXCL);
fs.writeFileSync(stage+'/PROOF_PATCH.json',JSON.stringify({patch:'*** Begin Patch\n*** Update File: '+site+'/tests/adjacent-current-tour-source-role.mjs\n@@\n'+before.trimEnd().split('\n').map(l=>'-'+l).join('\n')+'\n'+after.trimEnd().split('\n').map(l=>'+'+l).join('\n')+'\n*** End Patch',beforeSha256:hash(site+'/tests/adjacent-current-tour-source-role.mjs'),files,changes,wholePreviousHelperInverseVerified:true,workerTestSlotViolationRetained:true,workerInitialFailureRetained:true,previewChanged:false},null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({newProofFiles:files.length,historicalRaw:fixture,wholePreviousHelperInverseVerified:true,previewChanged:false}));
