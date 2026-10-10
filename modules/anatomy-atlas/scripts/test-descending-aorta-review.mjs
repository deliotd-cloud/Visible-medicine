import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {resolve,dirname} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {DatabaseSync} from 'node:sqlite';
process.on('uncaughtException',error=>{process.stderr.write(error.message+'\n');process.exit(1);});
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const baseline='3ebfae0ac6443e4981098b011775e6fd26d3476b';
const id='vm:anatomy:body:thorax:unspecified:vessel:descending-thoracic-aorta';
const {build}=await import(pathToFileURL(resolve(root,'scripts/workspace-test-build.mjs')));
const {exactSourceHistoryApi}=await import(pathToFileURL(resolve(root,'scripts/exact-source-history-api.mjs')));
const bundle=await build({stdin:{contents:"export * from './lib/body-review-api.ts';export * from './lib/body-review-context.ts';export * from './lib/body-review-material.ts';export * from './lib/body-review-decisions.ts';export * from './lib/central-vessel-imaging.ts';export * from './content/central-vessel-imaging.ts';",resolveDir:root,loader:'ts'},bundle:true,write:false,format:'esm',platform:'node'});
const current=await import('data:text/javascript;base64,'+Buffer.from(bundle.outputFiles[0].text).toString('base64'));
const old=await exactSourceHistoryApi(baseline,'review-security');
const previous=await old.bodyReviewContext(id),context=await current.bodyReviewContext(id);
assert(context&&previous);
assert.equal(context.sourceHash,previous.sourceHash);
assert.notEqual(context.materialHash,previous.materialHash);
assert.notEqual(context.revisions.teaching,previous.revisions.teaching);
assert.notEqual(context.rendererHash,previous.rendererHash,'Run after actual current renderer regeneration');
assert.notEqual(context.revisions.geometry,previous.revisions.geometry);
assert.equal(context.revisions.imaging,null);
const material=await current.bodyReviewMaterial(id);
assert.equal(material.approval,false);
assert.equal(material.status,'worksheet-not-submitted');
assert.equal(material.source.structure.fmaId,'FMA87217');
assert.equal(material.topics.find(t=>t.tab==='ultrasound').readiness,'draft');
assert(material.topics.find(t=>t.tab==='ultrasound').citations.includes('https://www.asecho.org/wp-content/uploads/2014/05/2013_Performing-Comprehensive-TEE.pdf'));
const origin='https://visible-medicine-review.test',user='synthetic-descending-aorta-review';
const payload=(track='teaching')=>({catalogScope:context.catalogScope,structureId:id,track,expectedVersion:0,materialHash:context.materialHash,revisionHash:context.revisions[track],checklistVersion:context.checklistVersion,draft:current.blankBodyReview(context,track)});
const request=body=>new Request(origin+'/api/body-review',{method:'POST',headers:{origin,'content-type':'application/json','oai-authenticated-user-id':user},body:JSON.stringify(body)});
let storageTouches=0;
const forbidden=new Proxy({}, {get(){storageTouches++;throw Error('Rejected request reached storage');}});
const foreign=current.bodyReviewSummaries.find(s=>s.id!==id).id;
const cases=[
  ['old-material',payload(),p=>p.materialHash=previous.materialHash,409],
  ['old-teaching',payload(),p=>p.revisionHash=previous.revisions.teaching,409],
  ['old-geometry',payload('geometry'),p=>p.revisionHash=previous.revisions.geometry,409],
  ['foreign-scope',payload(),p=>p.catalogScope='shoulder',400],
  ['foreign-id-signature',payload(),p=>p.structureId=foreign,409],
  ['unknown-id',payload(),p=>p.structureId=id+'-foreign',404],
  ['foreign-checklist',payload(),p=>p.checklistVersion+='-foreign',409],
];
for(const [name,p,mutate,status]of cases){mutate(p);const result=await current.postBodyDecision(request(p),forbidden);assert.equal(result.status,status,name);assert.equal(result.headers.get('cache-control'),'private, no-store');const body=await result.json();assert.equal(typeof body.error,'string');assert.equal(storageTouches,0,name+' must reject before storage');}

// Disposable SQLite only: public checked-in schema, no on-disk database.
const sqlite=new DatabaseSync(':memory:');
try {
  sqlite.exec(await readFile(resolve(root,'drizzle/0001_body_review_events.sql'),'utf8'));
  const db={prepare(sql){return {bind(...values){const statement=sqlite.prepare(sql.replace(/\?(\d+)/g,':p$1'));const bindings=Object.fromEntries(values.map((value,index)=>['p'+(index+1),value]));return {async all(){return {results:statement.all(bindings)};},async run(){return {meta:{changes:Number(statement.run(bindings).changes)}};}};}};}};
  const input=payload();assert.equal(input.draft.status,'draft');assert.equal(input.draft.attested,false);
  const saved=await current.postBodyDecision(request(input),db);assert.equal(saved.status,201);
  const record=(await saved.json()).review;assert.equal(record.status,'draft');assert.equal(record.attested,false);assert.equal(record.reviewedAt,null);assert.equal(record.version,1);assert.equal(record.material.materialHash,context.materialHash);assert.equal(record.material.rendererHash,context.rendererHash);
  const readback=await current.getBodyDecisions(new Request(origin+'/api/body-review?structureId='+encodeURIComponent(id)+'&track=teaching',{headers:{'oai-authenticated-user-id':user}}),db);
  assert.equal(readback.status,200);const returned=await readback.json();assert.equal(returned.scope,'private-to-signed-in-user');assert.equal(returned.history.length,1);assert.deepEqual(returned.history[0],record);assert.equal(returned.history[0].attested,false);assert.equal(returned.history[0].reviewedAt,null);
  assert.equal(sqlite.prepare('SELECT COUNT(*) AS total FROM body_review_events').get().total,1);
  console.log(JSON.stringify({baseline,rejectedBeforeStorage:cases.length,storageTouches,exactSource:true,staleMaterial:true,staleTeaching:true,staleGeometry:true,draftSaveReadback:true,status:record.status,attested:record.attested,reviewedAt:record.reviewedAt,renderer:context.rendererHash}));
} finally {sqlite.close();}
