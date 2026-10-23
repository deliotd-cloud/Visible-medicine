import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {build} from 'esbuild';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const evidence=path.resolve(root,'../material-worker');
fs.mkdirSync(evidence,{recursive:true});
const entries=['lib/fda-specimen-review-material.ts','lib/specimen-review.ts','lib/fda-shoulder-reference.ts','lib/body-review-decisions.ts'];
await build({entryPoints:entries.map(p=>path.join(root,p)),bundle:true,platform:'node',format:'esm',packages:'bundle',outdir:evidence,entryNames:'[name]',logLevel:'error'});
const [material,review,reference,decisions]=await Promise.all(entries.map(p=>import(pathToFileURL(path.join(evidence,path.basename(p,'.ts')+'.js')).href)));
const sha=value=>createHash('sha256').update(value).digest('hex');
const read=relative=>fs.readFileSync(path.join(root,relative));
const catalogue=JSON.parse(read('public/models/fda-shoulder-draft/catalog.json'));
const renderer=JSON.parse(read('content/fda-reference-renderer-revision.json'));
const bodyRenderer=JSON.parse(read('content/body-renderer-revision.json'));
const sourceHashes=Object.fromEntries([...entries,'public/models/fda-shoulder-draft/catalog.json','content/fda-reference-renderer-revision.json','content/body-renderer-revision.json'].map(p=>[p,sha(read(p))]));
fs.writeFileSync(path.join(evidence,'source-hashes.json'),JSON.stringify({sourceHashes},null,2)+'\n');

test('real source and renderer pins bind six distinct review materials',async()=>{
 assert.equal(renderer.schema,'vm-fda-reference-renderer/1');
 assert.equal(renderer.sha256,sha(JSON.stringify(renderer.inputs)));
 assert.equal(reference.fdaReferenceCatalogueSha256,sha(read('public/models/fda-shoulder-draft/catalog.json')));
 await reference.assertPinnedFdaCatalogue(catalogue);
 assert.equal(material.fdaSpecimenReviewRows.length,1);
 const row=material.fdaSpecimenReviewRows[0];
 assert.equal(row.key,reference.fdaShoulderSpecimenId);
 assert.equal(row.name,'FDA shoulder · independent unitless draft');
 assert.equal(row.surfaces.length,6);
 assert.equal(new Set(row.surfaces.map(s=>s.id)).size,6);
 assert(row.surfaces.every(s=>s.laterality==='unverified'));
 const hashes=new Set(),geometry=new Set();
 for(const surface of row.surfaces){
  const packet=await material.fdaSpecimenReviewMaterial(row.key,surface.id);
  const again=await material.fdaSpecimenReviewMaterial(row.key,surface.id);
  assert.deepEqual(packet,again);
  assert.equal(packet.context.catalogScope,'independent-specimen');
  assert.equal(packet.context.sourceFrame,'fda-shoulder-fc9f3e56:unitless-normalized-source-assembly');
  assert.equal(packet.context.checklistVersion,'fda-unitless-specimen-review-1');
  assert.equal(packet.source.catalogue.source.commit,catalogue.source.commit);
  assert.deepEqual(packet.source.catalogue,catalogue);
  assert.equal(packet.source.structure.sourceName,catalogue.structures.find(s=>s.id===surface.id).sourcePart);
  assert.equal(packet.source.structure.fmaId,null);
  assert.equal(packet.source.structure.laterality,null);
  assert.equal(packet.source.catalogue.display.unitsPerMillimetre,null);
  assert.equal(packet.source.catalogue.display.anatomicalAxesVerified,false);
  assert.equal(packet.atlasPath,'/specimens/fda-shoulder');
  assert.equal(packet.atlasLink,`/specimens/fda-shoulder?referenceRevision=${reference.fdaReferenceCatalogueSha256}&structure=${encodeURIComponent(surface.id)}`);
  assert.equal(packet.teaching.topics.length,8);
  assert(packet.teaching.topics.every(t=>t.body===null&&t.references.length===0));
  assert.equal(packet.teaching.lesson,null);
  assert.equal(packet.teaching.motorSupplies,undefined);
  assert.equal(packet.teaching.guidedDissection,null);
  assert.equal(packet.teaching.referenceTitles[catalogue.source.publicationURL],'OSEL-DAM / FDA shoulder model publication');
  assert.equal(packet.context.revisions.teaching,null);
  assert.equal(packet.context.revisions.imaging,null);
  assert.match(packet.context.revisions.geometry,/^[a-f0-9]{64}$/);
  assert(packet.context.blockers.geometry.some(b=>b.includes('Gcart')));
  assert(packet.context.blockers.teaching.length>0&&packet.context.blockers.imaging.length>0);
  assert.equal(packet.context.rendererHash,sha(JSON.stringify({bodyRenderer:bodyRenderer.sha256,fdaReferenceRenderer:renderer.sha256})));
  hashes.add(packet.context.materialHash);geometry.add(packet.context.revisions.geometry);
  for(const track of review.specimenReviewTracks){
   const complete={...review.blankSpecimenReview(packet.context,track),status:'approved',reviewer:'Independent reviewer',qualification:'Radiologist',scope:'Exact FDA source part and revision',evidence:[{title:'Publisher',url:catalogue.source.publicationURL,note:'Source provenance'}],attested:true,checks:Object.fromEntries(packet.context.checklists[track].map(item=>[item.id,true]))};
   assert(review.specimenApprovalProblems(complete,packet.context,track).length>0);
   const draft=decisions.validateBodyReviewDraft({...complete,status:'changes-required'},packet.context.checklists[track]);
   assert.equal(draft.status,'changes-required');
  }
 }
 assert.equal(hashes.size,6);assert.equal(geometry.size,6);
});

test('foreign, held and mismatched source IDs refuse material',async()=>{
 const key=reference.fdaShoulderSpecimenId;
 for(const [specimen,id] of [['foreign',catalogue.structures[0].id],[key,'vm:reference:fda-shoulder-fc9f3e56:Gcart'],[key,'vm:bodyparts3d:shoulder'],[key,'foreign']])
  assert.equal(await material.fdaSpecimenReviewMaterial(specimen,id),null);
});
