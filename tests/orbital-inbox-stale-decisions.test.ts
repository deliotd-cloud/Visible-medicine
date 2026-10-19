import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
import {build} from 'esbuild';
import {checkedAtlasSourceRepo} from './atlas-source-repo.mjs';
import {CURRENT_ATLAS_REVISION,validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';
import type {BodyReviewContext,SavedBodyReview} from '../atlas-review/lib/body-review-decisions.ts';
import type {InboxBatch,InboxItem} from '../lib/clinical-review-inbox-contract.ts';

validateCurrentAtlasDelivery();
const require=createRequire(import.meta.url),atlas=checkedAtlasSourceRepo(CURRENT_ATLAS_REVISION);
const built=await build({stdin:{contents:"export {getClinicalReviewInbox} from './lib/clinical-review-inbox';export {clinicalReviewEntries} from './atlas-review/lib/clinical-review-index';export {bodyReviewContext} from './atlas-review/lib/body-review-context';export {parseSavedBodyReview,bodyApprovalProblems} from './atlas-review/lib/body-review-decisions';",resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,format:'cjs',platform:'node',packages:'external'});
const mod={exports:{} as any};new Function('require','module','exports',built.outputFiles[0].text)((name:string)=>name==='server-only'?{}:require(name),mod,mod.exports);
const {getClinicalReviewInbox,clinicalReviewEntries,bodyReviewContext,parseSavedBodyReview,bodyApprovalProblems}=mod.exports;
const pins=JSON.parse(readFileSync('atlas-review/content/orbital-nerve-mri-pins.json','utf8')).entries as {identity:{id:string}}[];
const ids=new Set(pins.map(pin=>pin.identity.id));assert.equal(ids.size,14);
const selections=clinicalReviewEntries.map((entry:any,index:number)=>({entry,index})).filter(({entry}:any)=>entry.scope==='body'&&ids.has(entry.id));
assert.equal(selections.length,14);
const pages=[...new Set<number>(selections.map(({index}:any)=>Math.floor(index/12)+2))];
const request=(query='')=>new Request('https://review.invalid/api/atlas-review/inbox'+query,{headers:{'oai-authenticated-user-id':'synthetic-stale-decision-test'}});
const privateMarker='synthetic private worksheet note must never leave the read-only inbox';
function approved(context:BodyReviewContext,track:'geometry'|'teaching'):SavedBodyReview{
 const event={status:'approved',reviewer:'Synthetic offline fixture',qualification:'Test only; no clinical authority',scope:'Synthetic exact-revision software test only',notes:privateMarker,
  checks:Object.fromEntries(context.checklists[track].map(check=>[check.id,true])),evidence:[{title:'Synthetic fixture',url:'https://example.org/test-only',note:'Not clinical evidence'}],issues:[],attested:true,
  eventSchema:'vm-body-review-event-1',catalogScope:context.catalogScope,structureId:context.structureId,track,version:1,savedAt:'2026-10-01T00:00:00.000Z',reviewedAt:'2026-10-01T00:00:00.000Z',
  revisionHash:context.revisions[track],checklistVersion:context.checklistVersion,checklist:context.checklists[track],
  material:{sourceHash:context.sourceHash,teachingHash:context.teachingHash,rendererHash:context.rendererHash,materialHash:context.materialHash,teachingTabs:context.teachingTabs}};
 return parseSavedBodyReview(event);
}
function database(saved:Map<string,SavedBodyReview[]>,corrupt=false){
 const reads:{sql:string;args:unknown[]}[]=[];
 return {reads,prepare(sql:string){
  assert.match(sql,/^\s*SELECT\b/i,'Inbox must not write synthetic decisions');let args:unknown[]=[];
  const statement={bind(...values:unknown[]){args=values;return statement;},async all(){
   reads.push({sql,args});
   if(!sql.includes('FROM atlas_personal_body_review_events'))return {success:true,results:[]};
   assert.equal(args[0],'synthetic-stale-decision-test');const id=String(args[1]);
   const rows=(saved.get(id)??[]).map(event=>({structure_id:corrupt?'wrong-storage-id':id,track:event.track,version:event.version,payload:JSON.stringify(event)}));
   return {success:true,results:rows};
  },async run(){throw Error('Unexpected write');},async raw(){throw Error('Unexpected raw access');}};return statement;
 }};
}
async function inboxRows(db:ReturnType<typeof database>){
 const first=await getClinicalReviewInbox(request(),db);assert.equal(first.status,200);
 assert.equal(first.headers.get('Cache-Control'),'private, no-store');
 const initial=await first.json() as InboxBatch,all:InboxItem[]=[];
 for(const page of pages){
  const response=await getClinicalReviewInbox(request(`?page=${page}&revision=${initial.catalogRevision}`),db);assert.equal(response.status,200);
  const bytes=await response.text();assert(!bytes.includes(privateMarker));assert(!bytes.includes('Synthetic offline fixture'));assert(!bytes.includes('sourceHash'));
  all.push(...(JSON.parse(bytes) as InboxBatch).items);
 }
 return new Map<string,InboxItem>(selections.flatMap(({entry}:any)=>(['geometry','teaching'] as const).map(track=>{
  const key=JSON.stringify([entry.key,track]),matches=all.filter(row=>row.key===key);assert.equal(matches.length,1,key);return [key,matches[0]] as [string,InboxItem];
 })));
}

test('saved exact old orbital approvals never become approval for changed current material',async()=>{
 const history=await import(pathToFileURL(atlas+'/scripts/exact-source-history-api.mjs').href);
 const previous=await history.exactSourceHistoryApi('ab8f5594df9ff55132d3d8754e9d229a806dc325','review-security');
 const saved=new Map<string,SavedBodyReview[]>(),contexts=new Map<string,BodyReviewContext>();
 for(const {entry} of selections){
  const old=await previous.bodyReviewContext(entry.id),now=await bodyReviewContext(entry.id);assert(old&&now);
  assert.equal(now.sourceHash,old.sourceHash,entry.id+' source shape retained');
  saved.set(entry.id,[approved(old,'geometry'),approved(old,'teaching')]);contexts.set(entry.id,now);
 }
 const db=database(saved),rows=await inboxRows(db);let changedTeaching=0,changedGeometry=0;
 for(const {entry} of selections)for(const event of saved.get(entry.id)!){
  const now=contexts.get(entry.id)!,row=rows.get(JSON.stringify([entry.key,event.track]))!;
  assert.equal(row.revision,now.revisions[event.track]);assert.equal(row.capability,'decision');
  if(event.revisionHash!==now.revisions[event.track]||event.checklistVersion!==now.checklistVersion){
   assert.equal(row.status,'re-review',entry.id+' stale '+event.track);assert.notEqual(row.status,'approval-recorded');
   if(event.track==='teaching')changedTeaching++;else changedGeometry++;
  }else assert.equal(row.status,bodyApprovalProblems(event,now,event.track).length?'unavailable':'approval-recorded',entry.id+' exact unchanged '+event.track);
 }
 assert(changedTeaching>=12,'The original twelve CT worksheet changes must invalidate old teaching approval');
 assert.equal(changedGeometry,14,'Old renderer-bound geometry approval must remain stale');
 assert(db.reads.length>0);assert(db.reads.every(row=>/^\s*SELECT\b/i.test(row.sql)));
});

test('only exact current valid synthetic approval is recorded; corrupted storage stays unavailable',async()=>{
 const saved=new Map<string,SavedBodyReview[]>(),contexts=new Map<string,BodyReviewContext>();
 for(const {entry} of selections){const now=await bodyReviewContext(entry.id);assert(now);contexts.set(entry.id,now);saved.set(entry.id,[approved(now,'geometry'),approved(now,'teaching')]);}
 const current=await inboxRows(database(saved));let accepted=0;
 for(const {entry} of selections)for(const event of saved.get(entry.id)!){
  const row=current.get(JSON.stringify([entry.key,event.track]))!,now=contexts.get(entry.id)!;
  const expected=bodyApprovalProblems(event,now,event.track).length?'unavailable':'approval-recorded';
  assert.equal(row.status,expected);assert.equal(row.revision,now.revisions[event.track]);if(expected==='approval-recorded')accepted++;
 }
 assert(accepted>0,'Positive control must actually exercise a valid exact synthetic approval');
 const corrupted=await inboxRows(database(saved,true));
 for(const {entry} of selections)for(const track of ['geometry','teaching'])assert.equal(corrupted.get(JSON.stringify([entry.key,track]))!.status,'unavailable');
});
