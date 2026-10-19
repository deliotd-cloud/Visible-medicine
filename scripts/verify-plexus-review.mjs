import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {plexusHash,plexusFingerprints} from './plexus-review-fingerprints.mjs';
export function verifyPlexusReview(){
  const packet=JSON.parse(readFileSync('lib/plexus-review-manifest.json'));
  assert.equal(packet.purpose,'private-original-plexus-schematic-review');assert.equal(packet.admissions,0);assert.equal(packet.clinicalValidation,false);assert.equal(packet.patientDataIncluded,false);
  const context=packet.context;
  assert.equal(context.sourceCommit,'de82626457fb60c3b92b4e4d87a0016b6c3c09ce');
  assert.deepEqual(context.frame,{kind:'diagrammatic',units:'arbitrary',patientRegistration:false});
  assert.equal(context.partCount,35);assert.equal(context.connectionCount,38);assert.equal(context.clinicalApproved,false);assert.equal(context.learnerCatalogAdmission,false);
  for(const file of [...packet.topologyInputs,...packet.presentationInputs].filter(f=>f.kind==='website'))assert.equal(plexusHash(readFileSync(file.path)),file.sha256,'Schematic input changed; regenerate: '+file.path);
  const module=readFileSync('.local/plexus-review/assets.ts','utf8');
  const marker='export const plexusReviewAssets: Record<string,string> = ';
  assert.equal(module.split(marker).length,2);
  assert(module.startsWith("import 'server-only';"));
  const assets=JSON.parse(module.split(marker)[1].trim().replace(/;$/,''));
  assert.deepEqual(Object.keys(assets).sort(),packet.files.map(f=>f.name).sort());
  for(const pin of packet.files){const bytes=Buffer.from(assets[pin.name],'base64');assert.equal(bytes.length,pin.bytes);assert.equal(plexusHash(bytes),pin.sha256,pin.name);}
  const recomputed=plexusFingerprints({study:packet.study,topologyInputs:packet.topologyInputs,presentationInputs:packet.presentationInputs,
    assets:packet.files.filter(f=>f.name!=='index.html').map(({name,sha256})=>({name,sha256})),packages:packet.packages,checklistVersion:context.checklistVersion,checklists:context.checklists});
  for(const key of ['topologyHash','presentationHash','materialHash'])assert.equal(context[key],recomputed[key],key);
  assert.equal(context.revisions.topology,context.topologyHash);assert.equal(context.revisions.presentation,context.presentationHash);
  const html=Buffer.from(assets['index.html'],'base64').toString('utf8');
  for(const file of ['app.js','app.css'])assert(html.includes('./'+file+'?revision='+context.materialHash));
  const allowed=new Set(['MIT','ISC','BSD-2-Clause','BSD-3-Clause','Apache-2.0','Zlib']);
  assert(packet.packages.length>0);assert(packet.packages.every(p=>allowed.has(p.license)&&/^[a-f0-9]{64}$/.test(p.licenseSha256)));
  return {sourceCommit:context.sourceCommit,materialHash:context.materialHash,files:packet.files.length,packages:packet.packages.length,admissions:0,private:true};
}
if(process.argv[1]?.replaceAll('\\','/').endsWith('/verify-plexus-review.mjs'))console.log(JSON.stringify(verifyPlexusReview()));
