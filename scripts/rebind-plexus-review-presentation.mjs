// Narrow, audited host-stylesheet transition. Does not admit the schematic or
// migrate decisions. Rebuilding its geometry/assets still uses the source importer.
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {plexusFingerprints,plexusHash} from './plexus-review-fingerprints.mjs';

const cssPath='app/workspace/atlas-review/website-review.css';
const oldCss='930718b6b17c0bd8a5e8dce7d7da2677225f0bcc046a2ac35635caa79bf1d6df';
const newCss='acd14e1c9a23f62fe86de0778d07b74ac23c19b62d63941858906a941ac77c0b';
const oldMaterial='b37a78363dd1a279530425312dc65f19523f4a4106c060aced579d9e981f8a6c';
const marker='export const plexusReviewAssets: Record<string,string> = ';

export function rebindPlexusPresentation(original,moduleText,readWebsite){
  const packet=structuredClone(original);
  assert.equal(packet.context.materialHash,oldMaterial,'Only the audited prior packet is eligible');
  assert.equal(packet.context.sourceCommit,'de82626457fb60c3b92b4e4d87a0016b6c3c09ce');
  assert.equal(packet.admissions,0);assert.equal(packet.clinicalValidation,false);assert.equal(packet.patientDataIncluded,false);
  assert.equal(packet.context.clinicalApproved,false);assert.equal(packet.context.learnerCatalogAdmission,false);
  assert(moduleText.startsWith("import 'server-only';"));assert.equal(moduleText.split(marker).length,2);
  const assets=JSON.parse(moduleText.split(marker)[1].trim().replace(/;$/,''));
  assert.deepEqual(Object.keys(assets).sort(),packet.files.map(f=>f.name).sort());
  for(const file of packet.files){const bytes=Buffer.from(assets[file.name],'base64');assert.equal(bytes.length,file.bytes);assert.equal(plexusHash(bytes),file.sha256);}
  const fingerprint=()=>plexusFingerprints({study:packet.study,topologyInputs:packet.topologyInputs,presentationInputs:packet.presentationInputs,assets:packet.files.filter(f=>f.name!=='index.html').map(({name,sha256})=>({name,sha256})),packages:packet.packages,checklistVersion:packet.context.checklistVersion,checklists:packet.context.checklists});
  const before=fingerprint();for(const key of ['topologyHash','presentationHash','materialHash'])assert.equal(before[key],packet.context[key]);
  assert.equal(packet.context.revisions.topology,before.topologyHash);assert.equal(packet.context.revisions.presentation,before.presentationHash);
  assert.equal(packet.topologyInputs.filter(f=>f.path===cssPath).length,0);
  assert.equal(packet.presentationInputs.filter(f=>f.kind==='website'&&f.path===cssPath).length,1);
  for(const input of [...packet.topologyInputs,...packet.presentationInputs].filter(f=>f.kind==='website')){
    const current=plexusHash(readWebsite(input.path));
    if(input.path===cssPath){assert.equal(input.sha256,oldCss);assert.equal(current,newCss);input.sha256=current;}
    else assert.equal(current,input.sha256,'Unrelated input changed: '+input.path);
  }
  const after=fingerprint();assert.equal(after.topologyHash,before.topologyHash);assert.notEqual(after.presentationHash,before.presentationHash);assert.notEqual(after.materialHash,before.materialHash);
  Object.assign(packet.context,after);packet.context.revisions.presentation=after.presentationHash;
  let html=Buffer.from(assets['index.html'],'base64').toString('utf8');
  for(const file of ['app.js','app.css']){const from='./'+file+'?revision='+oldMaterial;assert.equal(html.split(from).length,2);html=html.replace(from,'./'+file+'?revision='+after.materialHash);}
  const htmlBytes=Buffer.from(html);assets['index.html']=htmlBytes.toString('base64');
  const pin=packet.files.find(f=>f.name==='index.html');pin.bytes=htmlBytes.length;pin.sha256=plexusHash(htmlBytes);
  // Preserve all four non-HTML assets, topology and decision/checklist semantics.
  assert.deepEqual(packet.study,original.study);assert.deepEqual(packet.topologyInputs,original.topologyInputs);
  assert.deepEqual(packet.context.checklists,original.context.checklists);
  assert.deepEqual(packet.files.filter(f=>f.name!=='index.html'),original.files.filter(f=>f.name!=='index.html'));
  const nextModule=moduleText.slice(0,moduleText.indexOf(marker))+marker+JSON.stringify(assets)+';\n';
  return {packet,moduleText:nextModule,before,after};
}

if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  assert.equal(process.argv[2],'--apply','Use --apply after preserving the prior packet');
  const path='lib/plexus-review-manifest.json',assets='.local/plexus-review/assets.ts';
  const result=rebindPlexusPresentation(JSON.parse(readFileSync(path)),readFileSync(assets,'utf8'),p=>readFileSync(p));
  writeFileSync(assets,result.moduleText);writeFileSync(path,JSON.stringify(result.packet,null,2)+'\n');
  console.log(JSON.stringify({before:result.before,after:result.after,topologyUnchanged:true,nonHtmlAssetsUnchanged:true,approvalsMigrated:false}));
}
