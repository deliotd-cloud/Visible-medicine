// Pure, exact presentation transition; callers own isolated writes and verification.
import assert from 'node:assert/strict';
import {plexusFingerprints,plexusHash} from './plexus-review-fingerprints.mjs';

const helper='lib/clinical-review-navigation-guard.ts';
const marker='export const plexusReviewAssets: Record<string,string> = ';
export const historyPins=Object.freeze({
  packetBefore:'eb64e9c997d122f0be9dfe0228a94d46a7269e3386db9563b6ab97601076f526',
  moduleBefore:'7b887626086d37445c4cea36bf77463275b97cd96528b9269cfca92a888ba394',
  helperBefore:'8c779ba3552af0423a5c724587e6fcb8f371572c0feb48aa1cc281b671725cbb',
  helperAfter:'0826c7d11015b63939e0774e775d0964be9e215f9e63cd24f243c3c6a8c1d58b'
});
const fingerprints=p=>plexusFingerprints({study:p.study,topologyInputs:p.topologyInputs,presentationInputs:p.presentationInputs,assets:p.files.filter(f=>f.name!=='index.html').map(({name,sha256})=>({name,sha256})),packages:p.packages,checklistVersion:p.context.checklistVersion,checklists:p.context.checklists});

export function rebindPlexusHistory(original,moduleText,readOriginal,readCandidate){
  assert.equal(plexusHash(JSON.stringify(original)),historyPins.packetBefore,'Exact pre-history packet');
  assert.equal(plexusHash(moduleText),historyPins.moduleBefore,'Exact pre-history private module');
  assert.match(historyPins.helperAfter,/^[a-f0-9]{64}$/,'Main must admit the complete reviewed helper source');
  assert.equal(original.admissions,0);assert.equal(original.clinicalValidation,false);assert.equal(original.patientDataIncluded,false);
  assert.equal(original.context.clinicalApproved,false);assert.equal(original.context.learnerCatalogAdmission,false);assert.equal(original.context.frame.patientRegistration,false);
  const all=[...original.topologyInputs,...original.presentationInputs];
  assert.equal(new Set(all.map(r=>r.kind+':'+r.path)).size,all.length);
  assert.equal(original.topologyInputs.filter(r=>r.path===helper).length,0);
  const helperPins=original.presentationInputs.filter(r=>r.kind==='website'&&r.path===helper);assert.equal(helperPins.length,1);assert.equal(helperPins[0].sha256,historyPins.helperBefore);
  for(const row of all.filter(r=>r.kind==='website')){
    assert.equal(plexusHash(readOriginal(row.path)),row.sha256,'Original source drift: '+row.path);
    assert.equal(plexusHash(readCandidate(row.path)),row.path===helper?historyPins.helperAfter:row.sha256,'Candidate source drift: '+row.path);
  }
  assert(moduleText.startsWith("import 'server-only';"));assert.equal(moduleText.split(marker).length,2);
  const assets=JSON.parse(moduleText.split(marker)[1].trim().replace(/;$/,''));
  assert.deepEqual(Object.keys(assets).sort(),original.files.map(r=>r.name).sort());
  for(const row of original.files){const bytes=Buffer.from(assets[row.name],'base64');assert.equal(bytes.length,row.bytes);assert.equal(plexusHash(bytes),row.sha256);}
  const before=fingerprints(original);for(const key of ['topologyHash','presentationHash','materialHash'])assert.equal(before[key],original.context[key]);
  assert.equal(original.context.revisions.topology,before.topologyHash);assert.equal(original.context.revisions.presentation,before.presentationHash);
  const packet=structuredClone(original);packet.presentationInputs.find(r=>r.kind==='website'&&r.path===helper).sha256=historyPins.helperAfter;
  const after=fingerprints(packet);assert.equal(after.topologyHash,before.topologyHash);assert.notEqual(after.presentationHash,before.presentationHash);assert.notEqual(after.materialHash,before.materialHash);
  Object.assign(packet.context,after);packet.context.revisions.presentation=after.presentationHash;
  let html=Buffer.from(assets['index.html'],'base64').toString('utf8');
  for(const name of ['app.js','app.css']){const old='./'+name+'?revision='+before.materialHash;assert.equal(html.split(old).length,2);html=html.replace(old,'./'+name+'?revision='+after.materialHash);}
  const bytes=Buffer.from(html);assets['index.html']=bytes.toString('base64');Object.assign(packet.files.find(r=>r.name==='index.html'),{bytes:bytes.length,sha256:plexusHash(bytes)});
  const inverse=structuredClone(packet);inverse.context=structuredClone(original.context);inverse.presentationInputs=structuredClone(original.presentationInputs);inverse.files=structuredClone(original.files);assert.deepEqual(inverse,original,'No other packet semantics change');
  assert.deepEqual(packet.files.filter(r=>r.name!=='index.html'),original.files.filter(r=>r.name!=='index.html'));
  return {packet,moduleText:moduleText.slice(0,moduleText.indexOf(marker))+marker+JSON.stringify(assets)+';\n',before,after};
}
