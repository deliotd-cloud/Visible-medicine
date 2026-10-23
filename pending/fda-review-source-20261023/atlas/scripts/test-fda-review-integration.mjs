import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import path from 'node:path';import {createHash} from 'node:crypto';import {DatabaseSync} from 'node:sqlite';import {fileURLToPath,pathToFileURL} from 'node:url';import {build} from 'esbuild';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),parent='F:/VisibleMedicine/staging/20261023-fda-shoulder-reference/atlas',evidence=path.resolve(root,'../integration-evidence');fs.mkdirSync(evidence,{recursive:true});
const sha=x=>createHash('sha256').update(x).digest('hex');
async function bundle(base,name){const output=evidence+'/'+name+'.mjs';await build({stdin:{contents:"export * from './lib/specimen-review-material';export * from './lib/specimen-review-api';export * from './lib/specimen-review';export * from './lib/specimen-review-client';export * from './lib/clinical-review-index';export * from './lib/clinical-review-queue';",resolveDir:base,loader:'ts'},bundle:true,platform:'node',format:'esm',outfile:output,logLevel:'error'});return import(pathToFileURL(output).href);}
const current=await bundle(root,'current'),previous=await bundle(parent,'parent');
await build({entryPoints:[root+'/lib/fda-reference-links.ts'],outfile:evidence+'/links.mjs',bundle:true,platform:'node',format:'esm',logLevel:'error'});
const {parseFdaReferenceSelection}=await import(pathToFileURL(evidence+'/links.mjs').href);
const key='fda-shoulder-fc9f3e56',row=current.specimenReviewRows.find(r=>r.key===key),catalogue=JSON.parse(fs.readFileSync(root+'/public/models/fda-shoulder-draft/catalog.json'));
const native=new DatabaseSync(':memory:');native.exec(fs.readFileSync(root+'/drizzle/0002_specimen_review_events.sql','utf8'));
const db={prepare(sql){return {bind(...values){return {async all(){return {success:true,results:native.prepare(sql).all(...values)};},async run(){return {success:true,meta:{changes:Number(native.prepare(sql).run(...values).changes)}};}};}};}};
const origin='https://synthetic-atlas.invalid';
const request=(id,user='TEST_A',track='geometry',tail='')=>new Request(origin+'/api/specimen-review?'+new URLSearchParams({specimenKey:key,structureId:id,track})+tail,{headers:user?{'oai-authenticated-user-id':user}:{}});
const post=(payload,user='TEST_A',headers={})=>new Request(origin+'/api/specimen-review',{method:'POST',headers:{origin,'content-type':'application/json',...(user?{'oai-authenticated-user-id':user}:{}),...headers},body:JSON.stringify(payload)});
const envelope=(packet,draft,expectedVersion=0,track='geometry')=>({catalogScope:packet.context.catalogScope,specimenKey:key,sourceFrame:packet.context.sourceFrame,structureId:packet.context.structureId,track,expectedVersion,materialHash:packet.context.materialHash,revisionHash:packet.context.revisions[track],checklistVersion:packet.context.checklistVersion,draft});

test('all356 complete legacy materials and index entries remain exact',async()=>{
 const rows=current.specimenReviewRows.filter(r=>r.key!==key);assert.deepEqual(rows,previous.specimenReviewRows);
 assert.deepEqual(current.clinicalReviewEntries.filter(e=>!e.context.includes(key)),previous.clinicalReviewEntries);
 const proofs=[];
 for(const group of previous.specimenReviewRows)for(const structure of group.surfaces){
  const a=await previous.specimenReviewMaterial(group.key,structure.id),b=await current.specimenReviewMaterial(group.key,structure.id);
  assert.deepEqual(b,a,group.key+':'+structure.id);proofs.push({key:group.key,id:structure.id,sha256:sha(JSON.stringify(a))});
 }
 assert.equal(proofs.length,356);fs.writeFileSync(evidence+'/LEGACY_MATERIALS.json',JSON.stringify({parent: '65005a2435d732ba71b5dfc48a3842756b711494',whole356PacketsEqual:true,proofs},null,2)+'\n');
});

test('six canonical source review entries have exact nonmetric links; held/foreign links refuse',async()=>{
 assert.equal(row.surfaces.length,6);const entries=current.clinicalReviewEntries.filter(e=>e.context.includes(key));assert.equal(entries.length,6);
 assert.deepEqual(parseFdaReferenceSelection({}),{expectedRevision:'56cf325c006a00e4349a6b45844797800a11c005448d32a08f40e64664288b44'});
 for(const structure of row.surfaces){const packet=await current.specimenReviewMaterial(key,structure.id),url=new URL(packet.atlasLink,origin),params=Object.fromEntries(url.searchParams);
  assert.deepEqual(parseFdaReferenceSelection(params),{selectedId:structure.id,expectedRevision:params.referenceRevision});
  assert.equal(packet.source.structure.laterality,null);assert(!('unitsPerMillimetre' in packet.source.structure));
  for(const change of [{...params,referenceRevision:'0'.repeat(64)},{...params,structure:'foreign'},{...params,structure:'vm:reference:fda-shoulder-fc9f3e56:Gcart'},{...params,referenceRevision:[params.referenceRevision,params.referenceRevision]},{...params,kind:'body'},{structure:structure.id}])assert.equal(parseFdaReferenceSelection(change),null);
 }
 assert.equal(current.findClinicalReviewEntries({scope:'specimens',q:key}).total,6);
 assert.equal(await current.specimenReviewMaterial('hra-united-female-v1.10-kidneys',row.surfaces[0].id),null);
});

test('native API rejects auth/origin/stale/foreign/approval before any storage access',async()=>{
 const packet=await current.specimenReviewMaterial(key,row.surfaces[0].id),draft=current.blankSpecimenReview(packet.context,'geometry'),payload=envelope(packet,draft);
 let touched=0;const never={prepare(){touched++;throw Error('Storage must not be reached');}};
 assert.equal((await current.getSpecimenReviews(request(packet.context.structureId,''),never)).status,401);
 assert.equal((await current.postSpecimenReview(post(payload,''),never)).status,401);
 assert.equal((await current.postSpecimenReview(post(payload,'TEST_A',{origin:'https://foreign.invalid'}),never)).status,403);
 for(const [patch,code]of [[{sourceFrame:'source-lps'},409],[{materialHash:'0'.repeat(64)},409],[{revisionHash:'0'.repeat(64)},409],[{checklistVersion:'specimen-review-1'},409],[{structureId:'foreign'},404],[{structureId:'vm:reference:fda-shoulder-fc9f3e56:Gcart'},404],[{specimenKey:'hra-united-female-v1.10-kidneys'},404]])assert.equal((await current.postSpecimenReview(post({...payload,...patch}),never)).status,code);
 const complete={...draft,status:'approved',reviewer:'SOFTWARE TEST ONLY',qualification:'No clinical sign-off',scope:'Synthetic independent-source validation only',attested:true,evidence:[{title:'Software fixture',url:'https://example.com/',note:'Not clinical evidence'}],checks:Object.fromEntries(packet.context.checklists.geometry.map(c=>[c.id,true]))};
 assert.equal((await current.postSpecimenReview(post(envelope(packet,complete)),never)).status,422);
 assert.equal(touched,0);
});

test('all six source drafts save/read separately; account, issue and version boundaries hold',async()=>{
 for(const [index,structure]of row.surfaces.entries()){
  const packet=await current.specimenReviewMaterial(key,structure.id),draft={...current.blankSpecimenReview(packet.context,'geometry'),notes:'SOFTWARE TEST ONLY: source '+index},payload=envelope(packet,draft);
  const response=await current.postSpecimenReview(post(payload),db);assert.equal(response.status,201);assert.match(response.headers.get('cache-control'),/private, no-store/);
  const saved=(await response.json()).review;assert.equal(saved.status,'draft');assert.equal(saved.reviewedAt,null);assert.equal(saved.version,1);
  const history=await current.getSpecimenReviews(request(structure.id),db).then(r=>r.json());assert.equal(current.parseSpecimenHistory(history,packet.context,'geometry').history[0].notes,draft.notes);
  const other=await current.getSpecimenReviews(request(structure.id,'TEST_B'),db).then(r=>r.json());assert.equal(other.history.length,0);
  assert.equal((await current.postSpecimenReview(post(payload),db)).status,409);
  const issue={id:'preserve',title:'Synthetic source question',severity:'major',resolved:false,resolution:''};
  assert.equal((await current.postSpecimenReview(post(envelope(packet,{...draft,status:'changes-required',issues:[issue]},1)),db)).status,201);
  assert.equal((await current.postSpecimenReview(post(envelope(packet,draft,2)),db)).status,422);
 }
 const queueRequest=new Request(origin+'/api/clinical-review-queue?'+new URLSearchParams({q:key,scope:'specimens'}),{headers:{'oai-authenticated-user-id':'TEST_A'}});
 const queue=await current.getClinicalReviewQueue(queueRequest,db);assert.equal(queue.status,200);const result=await queue.json();assert.equal(result.items.length,6);assert(result.items.every(i=>i.geometry==='changes-required'&&i.teaching==='not-started'));
 assert.equal(native.prepare('SELECT COUNT(*) AS count FROM specimen_review_events').get().count,12);native.close();
});
