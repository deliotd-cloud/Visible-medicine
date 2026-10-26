import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
import {hash,json} from './bounded-source-hash-20261026.mjs';

const stage='F:/VisibleMedicine/staging/20261026-tongue-website';
const sourceFile=stage+'/SOURCE_CANDIDATE.json',source=json(sourceFile),site=source.website;
const parent=json(source.parent),wire=value=>JSON.parse(JSON.stringify(value));
assert.equal(hash(source.parent),source.parentSha256);
assert.equal(process.cwd().replaceAll('\\','/'),site);
for(const r of source.sourceRows)assert.equal(hash(site+'/'+r.path),r.sha256,r.path);
const {build}=createRequire(site+'/package.json')('esbuild');
const {validateCurrentAtlasDelivery,currentAtlasDeliveryRoot}=await import(pathToFileURL(site+'/tests/current-atlas-delivery.mjs'));
assert.equal(validateCurrentAtlasDelivery().source,source.atlasHead);
assert.equal(currentAtlasDeliveryRoot().replaceAll('\\','/').replace(/\/$/,''),source.atlas);
const {emittedTeaching}=await import(pathToFileURL(site+'/tests/atlas-emitted-teaching.ts'));
async function apiAt(root,previous=false){
 const contents=[
  "export {bodyLesson} from './atlas-review/app/body-content';",
  "export {bodyReviewMaterial} from './atlas-review/lib/body-review-material';",
  "export {bodyReviewContext} from './atlas-review/lib/body-review-context';",
  ...previous?[]:[
   "export {bodyDisplayCatalog} from './atlas-review/lib/body-display-catalog';",
   "export {parseBodyReviewResponse} from './atlas-review/lib/body-review-response';",
   "export {postBodyDecision} from './atlas-review/lib/body-review-api';",
   "export {blankBodyReview} from './atlas-review/lib/body-review-decisions';",
  ],
 ].join('\n');
 const compiled=await build({stdin:{contents,resolveDir:root,loader:'ts'},bundle:true,write:false,platform:'node',format:'esm'});
 return import('data:text/javascript;base64,'+Buffer.from(compiled.outputFiles[0].text).toString('base64'));
}
const before=await apiAt(parent.website,true),now=await apiAt(site);
const pins=json(site+'/atlas-review/content/tongue-imaging-pins.json');
assert.equal(pins.entries.length,5);
const catalog=now.bodyDisplayCatalog(json(site+'/atlas-review/public/models/bodyparts3d/full-body/catalog.json'));
assert.equal(catalog.structures.length,1104);
const emitted=['public/atlas-runtime/head-neck/','public/atlas-review-viewer/'].map(base=>{
 const manifest=json(site+'/'+base+'manifest.json');
 assert.equal(manifest.sourceCommit,source.atlasHead);
 return emittedTeaching(site+'/'+base,manifest.files,true);
});
const visible=(code,value)=>code.includes(value)||code.includes(JSON.stringify(value).slice(1,-1));
let placements=0,tamperRefusals=0,staleDecisions=0;
for(const {identity} of pins.entries){
 assert.deepEqual(catalog.structures.find(s=>s.id===identity.id),identity);
 const oldPacket=wire(await before.bodyReviewMaterial(identity.id));
 const packet=wire(await now.bodyReviewMaterial(identity.id));
 const oldContext=await before.bodyReviewContext(identity.id),context=await now.bodyReviewContext(identity.id);
 assert(packet&&context&&oldPacket&&oldContext);
 assert.equal(packet.approval,false);assert.equal(packet.status,'worksheet-not-submitted');
 assert.deepEqual(packet.source.structure,identity);
 assert.equal(context.sourceHash,oldContext.sourceHash,'Source geometry identity retained');
 assert.notEqual(context.teachingHash,oldContext.teachingHash,'New content creates a new teaching revision');
 assert.notEqual(context.revisions.teaching,oldContext.revisions.teaching);
 assert.notEqual(context.materialHash,oldContext.materialHash);
 assert.equal(context.revisions.imaging,null,'No acquired-image or registration approval');
 assert.deepEqual(await now.parseBodyReviewResponse(packet,identity.id),packet);
 assert.equal(await now.parseBodyReviewResponse(oldPacket,identity.id),null,'Old worksheet cannot masquerade as current');
 for(const tab of ['ct','mri']){
  const lesson=now.bodyLesson(identity,tab);
  assert.equal(before.bodyLesson(identity,tab).readiness,'pending');
  assert.equal(lesson.readiness,'draft');assert(lesson.citations.length>=2);
  assert.match(lesson.note,/revision-bound radiologist review pending/);
  assert.deepEqual(packet.topics.find(t=>t.tab===tab),{tab,...lesson});
  assert(context.teachingTabs.includes(tab));
  for(const code of emitted)for(const value of [lesson.body,...lesson.bullets,...lesson.citations,lesson.note])assert(visible(code,value),identity.id+'/'+tab+': emitted lesson missing');
  for(const mutate of [
   p=>{p.topics.find(t=>t.tab===tab).body+=' foreign';},
   p=>{p.topics.find(t=>t.tab===tab).bullets[0]+=' foreign';},
   p=>{p.topics.find(t=>t.tab===tab).citations[0]+='?foreign=1';},
  ]){const bad=wire(packet);mutate(bad);assert.equal(await now.parseBodyReviewResponse(bad,identity.id),null);tamperRefusals++;}
  placements++;
 }
 const bad=wire(packet);bad.source.structure.sources[0].sha256='0'.repeat(64);
 assert.equal(await now.parseBodyReviewResponse(bad,identity.id),null);tamperRefusals++;
 for(const field of ['materialHash','revisionHash']){
  let storageCalls=0;
  const payload={catalogScope:context.catalogScope,structureId:identity.id,track:'teaching',expectedVersion:0,
   materialHash:context.materialHash,revisionHash:context.revisions.teaching,checklistVersion:context.checklistVersion,draft:now.blankBodyReview(context,'teaching')};
  payload[field]=field==='materialHash'?oldContext.materialHash:oldContext.revisions.teaching;
  const response=await now.postBodyDecision(new Request('https://review.test/api/body-decisions',{
   method:'POST',headers:{origin:'https://review.test','content-type':'application/json','oai-authenticated-user-id':'synthetic-reviewer'},body:JSON.stringify(payload),
  }),{prepare(){storageCalls++;throw Error('Old source decision reached storage');}});
  assert.equal(response.status,409);assert.equal(storageCalls,0);staleDecisions++;
 }
}
assert.equal(placements,10);assert.equal(tamperRefusals,35);assert.equal(staleDecisions,10);
for(const r of source.sourceRows)assert.equal(hash(site+'/'+r.path),r.sha256,r.path);
for(const r of parent.sourceRows)assert.equal(hash(parent.website+'/'+r.path),r.sha256,r.path);
const result={at:new Date().toISOString(),passing:true,source:{path:sourceFile,sha256:hash(sourceFile)},parent:{path:source.parent,sha256:source.parentSha256},
 currentDefaultDeliveryAndNativeRootVerified:true,placements,structures:5,emittedSurfaces:2,currentWorksheetsParsed:5,
 previousWorksheetsRefused:5,tamperRefusals,staleDecisionsRefusedBeforeStorage:staleDecisions,
 allSourceBytesUnchanged:true,syntheticHandlersOnly:true,realAccountAcceptance:false,clinicalApproval:false,patientSpaceRegistration:false,normalPreviewChanged:false};
const out=stage+'/CONTENT_QA.json';fs.writeFileSync(out,JSON.stringify(result,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({contentQA:out,sha256:hash(out),passing:true,placements,tamperRefusals,staleDecisions}));
