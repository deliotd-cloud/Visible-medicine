// Exact presentation-only transition. Pure: callers own isolated writes and verification.
import assert from 'node:assert/strict';
import {plexusFingerprints,plexusHash} from './plexus-review-fingerprints.mjs';

const worksheet='components/PlexusReviewWorksheet.tsx';
const importer='scripts/import-plexus-review.mjs';
const helper='lib/clinical-review-navigation-guard.ts';
const marker='export const plexusReviewAssets: Record<string,string> = ';
const PACKET_PIN='4ff761ea4c245bc95e3af22abe82c6469436c1ffa8aa989ecc8825b8c6c008f2';
export const navigationPins=Object.freeze({
  worksheetBefore:'9eb612a0a5a117eca2817072c644d17b805381933f4a06bdaa3d17ebaec99478',
  worksheetAfter:'96eeb116e7244a6577d8708ea5dcd615dc25e57ed9fe18321b285eef5f03c120',
  importerBefore:'3c04c80a6be6ae27af8f9e34c2dca7e2c4215973366f135dae2ceb223700f98b',
  importerAfter:'a5a164006d188ac2a5579b3749bbfbc15917b32223c2dea3a0fd440b0b2caacd',
  helperAfter:'8c779ba3552af0423a5c724587e6fcb8f371572c0feb48aa1cc281b671725cbb',
  moduleBefore:'c0e960bd831e9cb82659e0ecb903b3c5f47eb44ba03e8ca8f6752b7f4dfa4a75',
  materialBefore:'34a6c5f096d84897033fab883a4404c49f897ddc5c2ebaeedc7af10829b5cdd4'
});
const once=(text,from,to)=>{assert.equal(text.split(from).length,2,'Expected exactly one declared seam');return text.replace(from,to);};
export function navigationWorksheet(original){
  assert.equal(plexusHash(original),navigationPins.worksheetBefore);
  let next=once(original.toString(),"import { clinicalReviewFetch } from '@/lib/clinical-review-fetch';\n","import { clinicalReviewFetch } from '@/lib/clinical-review-fetch';\nimport { registerClinicalReviewNavigationGuard } from '../lib/clinical-review-navigation-guard';\n");
  next=once(next,"    return () => window.removeEventListener('beforeunload', guard);","    const unregister = registerClinicalReviewNavigationGuard(document, () => true);\n    return () => { window.removeEventListener('beforeunload', guard); unregister(); };");
  assert.equal(plexusHash(next),navigationPins.worksheetAfter);return next;
}
export function navigationImporter(original){
  assert.equal(plexusHash(original),navigationPins.importerBefore);
  const next=once(original.toString(),"const websitePresentationPaths=['components/GroupedReviewConfirmation.tsx',","const websitePresentationPaths=['lib/clinical-review-navigation-guard.ts','components/GroupedReviewConfirmation.tsx',");
  assert.equal(plexusHash(next),navigationPins.importerAfter);return next;
}
const fingerprint=p=>plexusFingerprints({study:p.study,topologyInputs:p.topologyInputs,presentationInputs:p.presentationInputs,assets:p.files.filter(f=>f.name!=='index.html').map(({name,sha256})=>({name,sha256})),packages:p.packages,checklistVersion:p.context.checklistVersion,checklists:p.context.checklists});

// readOriginal reads the authenticated canonical baseline; readCandidate reads the
// isolated candidate. No observed-hash repinning, decision writes or asset rebuilds.
export function rebindPlexusNavigation(original,moduleText,readOriginal,readCandidate){
  assert.equal(plexusHash(JSON.stringify(original)),PACKET_PIN,'Exact reviewed baseline packet required');
  assert.equal(plexusHash(moduleText),navigationPins.moduleBefore,'Exact reviewed baseline module required');
  assert.equal(original.context.materialHash,navigationPins.materialBefore);
  assert.equal(original.admissions,0);assert.equal(original.clinicalValidation,false);assert.equal(original.patientDataIncluded,false);
  assert.equal(original.context.clinicalApproved,false);assert.equal(original.context.learnerCatalogAdmission,false);
  assert(moduleText.startsWith("import 'server-only';"));assert.equal(moduleText.split(marker).length,2);
  const assets=JSON.parse(moduleText.split(marker)[1].trim().replace(/;$/,''));
  assert.deepEqual(Object.keys(assets).sort(),original.files.map(f=>f.name).sort());
  for(const pin of original.files){const bytes=Buffer.from(assets[pin.name],'base64');assert.equal(bytes.length,pin.bytes);assert.equal(plexusHash(bytes),pin.sha256);}
  const before=fingerprint(original);
  for(const key of ['topologyHash','presentationHash','materialHash'])assert.equal(before[key],original.context[key]);
  assert.equal(original.context.revisions.topology,before.topologyHash);assert.equal(original.context.revisions.presentation,before.presentationHash);
  const all=[...original.topologyInputs,...original.presentationInputs];
  assert.equal(new Set(all.map(f=>f.kind+':'+f.path)).size,all.length,'Duplicate original input');
  assert.equal(all.filter(f=>f.path===helper).length,0);
  for(const path of [worksheet,importer])assert.equal(original.presentationInputs.filter(f=>f.kind==='website'&&f.path===path).length,1);
  for(const pin of all.filter(f=>f.kind==='website'))assert.equal(plexusHash(readOriginal(pin.path)),pin.sha256,'Original input drift: '+pin.path);
  const nextWorksheet=navigationWorksheet(readOriginal(worksheet));
  const nextImporter=navigationImporter(readOriginal(importer));
  assert.equal(plexusHash(readCandidate(worksheet)),plexusHash(nextWorksheet),'Candidate worksheet drift');
  assert.equal(plexusHash(readCandidate(importer)),plexusHash(nextImporter),'Candidate importer drift');
  assert.equal(plexusHash(readCandidate(helper)),navigationPins.helperAfter,'Candidate helper drift');
  for(const pin of all.filter(f=>f.kind==='website'&&![worksheet,importer].includes(f.path)))assert.equal(plexusHash(readCandidate(pin.path)),pin.sha256,'Unrelated candidate input drift: '+pin.path);
  const packet=structuredClone(original);
  for(const pin of packet.presentationInputs){if(pin.path===worksheet)pin.sha256=navigationPins.worksheetAfter;if(pin.path===importer)pin.sha256=plexusHash(nextImporter);}
  // Match the future clean importer order: helper precedes existing Website inputs.
  packet.presentationInputs.splice(packet.presentationInputs.findIndex(f=>f.kind==='website'),0,{kind:'website',path:helper,sha256:navigationPins.helperAfter});
  const after=fingerprint(packet);assert.equal(after.topologyHash,before.topologyHash);assert.notEqual(after.presentationHash,before.presentationHash);assert.notEqual(after.materialHash,before.materialHash);
  Object.assign(packet.context,after);packet.context.revisions.presentation=after.presentationHash;
  let html=Buffer.from(assets['index.html'],'base64').toString('utf8');
  for(const file of ['app.js','app.css'])html=once(html,'./'+file+'?revision='+before.materialHash,'./'+file+'?revision='+after.materialHash);
  const htmlBytes=Buffer.from(html);assets['index.html']=htmlBytes.toString('base64');
  Object.assign(packet.files.find(f=>f.name==='index.html'),{bytes:htmlBytes.length,sha256:plexusHash(htmlBytes)});
  // Inverse proves every other packet field remains byte-equivalent in JSON.
  const inverse=structuredClone(packet);inverse.context=structuredClone(original.context);inverse.presentationInputs=structuredClone(original.presentationInputs);inverse.files=structuredClone(original.files);
  assert.deepEqual(inverse,original);
  assert.deepEqual(packet.files.filter(f=>f.name!=='index.html'),original.files.filter(f=>f.name!=='index.html'));
  const nextModule=moduleText.slice(0,moduleText.indexOf(marker))+marker+JSON.stringify(assets)+';\n';
  return {packet,moduleText:nextModule,before,after};
}
