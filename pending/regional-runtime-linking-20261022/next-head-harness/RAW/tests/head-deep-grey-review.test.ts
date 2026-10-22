import assert from 'node:assert/strict';
import test from 'node:test';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {resolve} from 'node:path';
import {build} from 'esbuild';
import {Miniflare,Log,LogLevel,convertV4MiniflareOptions} from 'miniflare';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import ts from 'typescript';
import {groupedReviewConfirmation} from './grouped-review-confirmation-harness.mjs';
import {HEAD_LINK_REVISION} from '../lib/head-atlas-links.ts';
import {DEEP_GREY_CLINICAL_REVISION,deepGreyClinicalPacket} from '../lib/head-deep-grey-clinical.ts';
import {headTeachingDraftContext,blankHeadTeachingDraft,parseSavedHeadTeachingDraft,headTeachingDraftStale} from '../lib/head-teaching-review-contract.ts';
import * as contract from '../lib/head-teaching-review-contract.ts';
import * as client from '../lib/head-teaching-review-client.ts';
import * as workingCopy from '../lib/head-review-working-copy.ts';

const require=createRequire(import.meta.url);
const digest=(value:unknown)=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
const deepGreyIds=['left','right'].flatMap(side=>['caudate','putamen','globus-pallidus','thalamus'].map(part=>`deep-${side}-${part}`));
const kinds=['anatomy','brainstem-clinical','ventricular-clinical','cerebellar-clinical','deep-grey-clinical'] as const;
const paths=['anatomy','brainstem','ventricular','cerebellar','deep-grey'] as const;

test('deep-grey clinical evidence includes private notes only for the verified packet',()=>{
  const source=readFileSync(new URL('../components/HeadDeepGreyClinicalReview.tsx',import.meta.url),'utf8');
  const compiled=ts.transpileModule(source,{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS}}).outputText;
  const mod={exports:{} as {HeadDeepGreyClinicalReview:React.ComponentType<{revision:string;clinicalRevision:string|null;reviewNotes?:React.ReactNode}>}};
  const load=(id:string)=>id==='./HeadReviewImageLink'?{HeadReviewImageLink:({children}:{children:React.ReactNode})=>React.createElement('span',null,children)}:require(id);
  new Function('require','module','exports',compiled)(load,mod,mod.exports);
  const marker=React.createElement('form',{'data-test-private-notes':'deepGrey'},'Synthetic private corrections');
  const render=(revision:string,clinicalRevision:string|null)=>renderToStaticMarkup(React.createElement(mod.exports.HeadDeepGreyClinicalReview,{revision,clinicalRevision,reviewNotes:marker}));
  assert.match(render(HEAD_LINK_REVISION,DEEP_GREY_CLINICAL_REVISION),/<details id="deep-grey-clinical-corrections"><summary>Private corrections &amp; saved history<\/summary><form data-test-private-notes="deepGrey"/);
  for(const [revision,clinicalRevision] of [['stale',DEEP_GREY_CLINICAL_REVISION],[HEAD_LINK_REVISION,'stale'],[HEAD_LINK_REVISION,null]])assert.doesNotMatch(render(revision!,clinicalRevision),/Synthetic private corrections|<form/);
  const page=readFileSync(new URL('../app/workspace/atlas-review/head-learning/page.tsx',import.meta.url),'utf8');
  assert.match(page,/if\(deepGreyClinicalRevision\)try\{deepGreyContext=await headTeachingDraftContext\(HEAD_MANIFEST_SHA256,'deep-grey-clinical'\)/);
  assert.match(page,/reviewNotes=\{deepGreyContext\?<HeadTeachingReviewNotes key=\{JSON.stringify\(deepGreyContext\)\} context=\{deepGreyContext\}/);
  assert.match(page,/id:'deep-grey-clinical-corrections',label:'Deep-grey clinical corrections · Private notes'/);
  assert.match(page,/additionalTargets=\{additionalTargets\}/);
  const binder=readFileSync(new URL('../scripts/bind-clinical-review.mjs',import.meta.url),'utf8');
  for(const file of ['lib/head-teaching-review-contract.ts','lib/head-teaching-review-api.ts','lib/head-teaching-review-store.ts','components/HeadTeachingReviewNotes.tsx','app/api/atlas-review/head-deep-grey-clinical/route.ts'])assert(binder.includes(`'${file}'`));
  const route=readFileSync(new URL('../app/api/atlas-review/head-deep-grey-clinical/route.ts',import.meta.url),'utf8');
  assert.match(route,/runClinicalReview\(request,guarded=>getHeadTeachingDrafts\(guarded,[^\n]*'deep-grey-clinical'\)/);
  assert.match(route,/runClinicalReview\(request,guarded=>postHeadTeachingDraft\(guarded,[^\n]*'deep-grey-clinical'\)/);
});

test('deep-grey corrections bind the exact separate packet, concepts and review checklist',async()=>{
  const contexts=await Promise.all(kinds.map(kind=>headTeachingDraftContext(HEAD_LINK_REVISION,kind)));
  const [anatomy,brainstem,ventricular,cerebellar,deepGrey]=contexts;
  const packet=deepGreyClinicalPacket();
  assert.equal(digest(packet),DEEP_GREY_CLINICAL_REVISION);
  assert.equal(DEEP_GREY_CLINICAL_REVISION,'6f966b9f29ebd4a77fd8d6547c29c509e8c616f9158e3c0994ca05b7bb5d81e9');
  assert.equal(deepGrey.packetRevision,DEEP_GREY_CLINICAL_REVISION);
  assert.equal(deepGrey.catalogScope,'head-deep-grey-clinical-drafts');
  assert.equal(deepGrey.packetId,'head-deep-grey-clinical');
  assert.equal(deepGrey.checklistVersion,'head-deep-grey-clinical-draft-review-1');
  assert.deepEqual(deepGrey.conceptIds,deepGreyIds);
  assert.deepEqual(deepGrey.checklist.map(check=>check.id),['wording','scan-attribution','imaging','bindings']);
  assert.deepEqual(deepGrey.checklist.map(check=>check.label),packet.content.reviewChecks);
  assert.equal(packet.bindings.length,8);
  assert(packet.bindings.every(binding=>binding?.atlasHref&&binding.ctHref&&binding.mriHref));
  for(const flag of ['patientRegistration','clinicalApproval','publicationApproval'] as const)assert.equal(deepGrey[flag],false);
  assert.equal(new Set(contexts.map(context=>context.packetRevision)).size,5);
  assert.equal(new Set(contexts.map(context=>context.packetId)).size,5);
  assert.equal(new Set(contexts.map(context=>context.catalogScope)).size,5);

  const event={eventSchema:'vm-head-teaching-draft-event-1' as const,context:deepGrey,version:1,savedAt:'2026-10-11T12:00:00.000Z',draft:blankHeadTeachingDraft(deepGrey)};
  assert.deepEqual(parseSavedHeadTeachingDraft(event),event);
  assert.equal(headTeachingDraftStale(event,deepGrey),false);
  for(const prior of [anatomy,brainstem,ventricular,cerebellar])assert.equal(headTeachingDraftStale(event,prior),true);
  for(const changed of [
    {...deepGrey,packetRevision:'a'.repeat(64)},
    {...deepGrey,headRevision:'a'.repeat(64)},
    {...deepGrey,checklistVersion:'head-deep-grey-clinical-draft-review-2'},
    {...deepGrey,checklist:[...deepGrey.checklist].reverse()},
  ])assert.equal(headTeachingDraftStale(event,changed),true);
  for(const badContext of [
    {...deepGrey,catalogScope:brainstem.catalogScope},
    {...deepGrey,packetId:ventricular.packetId},
    {...deepGrey,conceptIds:[...deepGreyIds,'brainstem-pons']},
    {...deepGrey,conceptIds:deepGreyIds.slice(0,7)},
    {...deepGrey,conceptIds:[deepGreyIds[0],...deepGreyIds.slice(0,7)]},
    {...deepGrey,checklist:[...deepGrey.checklist,{id:'approval',label:'Approve'}]},
    {...deepGrey,clinicalApproval:true},
    {...deepGrey,publicationApproval:true},
    {...deepGrey,patientRegistration:true},
  ])assert.throws(()=>parseSavedHeadTeachingDraft({...event,context:badContext}));
  assert.throws(()=>parseSavedHeadTeachingDraft({...event,draft:{...event.draft,attested:true}}));
  await assert.rejects(headTeachingDraftContext('0'.repeat(64),'deep-grey-clinical'));
  const mutable=packet.content as unknown as {notes:{text:string}[]};
  const original=mutable.notes[0].text;
  try{mutable.notes[0].text=original+' temporary hash probe';await assert.rejects(headTeachingDraftContext(HEAD_LINK_REVISION,'deep-grey-clinical'),/packet|source|hash/i);}
  finally{mutable.notes[0].text=original;}

});

test('all five real-schema histories are private, isolated, version guarded and fail closed on poisoned rows', {timeout:60000},async()=>{
  const entry=`
    import {getHeadTeachingDrafts,postHeadTeachingDraft} from './lib/head-teaching-review-api';
    import {headTeachingDraftContext,blankHeadTeachingDraft} from './lib/head-teaching-review-contract';
    import {HEAD_LINK_REVISION} from './lib/head-atlas-links';
    export default {async fetch(request,env){
      const url=new URL(request.url);
      const kinds={anatomy:'anatomy',brainstem:'brainstem-clinical',ventricular:'ventricular-clinical',cerebellar:'cerebellar-clinical','deep-grey':'deep-grey-clinical'};
      if(url.pathname==='/fixture'){
        const context=await headTeachingDraftContext(HEAD_LINK_REVISION,url.searchParams.get('kind'));
        return Response.json({context,draft:blankHeadTeachingDraft(context)});
      }
      const kind=kinds[url.pathname.slice(1)];
      if(!kind)return new Response('Not found',{status:404});
      return request.method==='POST'
        ?postHeadTeachingDraft(request,env.DB,HEAD_LINK_REVISION,kind)
        :getHeadTeachingDrafts(request,env.DB,HEAD_LINK_REVISION,kind);
    }};`;
  const bundled=await build({stdin:{contents:entry,resolveDir:process.cwd(),sourcefile:'deepGrey-review-fixture.ts'},bundle:true,write:false,format:'esm',platform:'neutral',target:'es2022'});
  const mf=new Miniflare(convertV4MiniflareOptions({modules:[{type:'ESModule',path:resolve('.local/deepGrey-review-fixture.mjs'),contents:bundled.outputFiles[0].text}],compatibilityDate:'2026-08-23',d1Databases:['DB'],log:new Log(LogLevel.NONE)}));
  try{
    const db=await mf.getD1Database('DB');
    for(const sql of readFileSync('drizzle/0008_solid_infant_terrible.sql','utf8').split('--> statement-breakpoint').map(value=>value.trim()).filter(Boolean))await db.prepare(sql).run();
    const fixture=async(kind:string)=>(await (await mf.dispatchFetch('https://review.test/fixture?kind='+kind)).json()) as any;
    const values=await Promise.all(kinds.map(fixture));
    const body=(item:any,expectedVersion=0)=>({catalogScope:item.context.catalogScope,packetId:item.context.packetId,packetRevision:item.context.packetRevision,headRevision:item.context.headRevision,checklistVersion:item.context.checklistVersion,expectedVersion,draft:item.draft});
    const call=(path:string,user:string|null,payload?:unknown,search='')=>mf.dispatchFetch('https://review.test/'+path+search,{method:payload===undefined?'GET':'POST',headers:{...(user?{'oai-authenticated-user-id':user}:{}),...(payload===undefined?{}:{origin:'https://review.test','content-type':'application/json'})},...(payload===undefined?{}:{body:JSON.stringify(payload)})});
    const deepGrey=values[4];
    assert.equal((await call('deep-grey',null)).status,401);
    assert.equal((await call('deep-grey',null,body(deepGrey))).status,401);
    for(const prior of values.slice(0,4))assert.equal((await call('deep-grey','alice',body(prior))).status,400);
    for(const path of paths.slice(0,4))assert.equal((await call(path,'alice',body(deepGrey))).status,400);
    assert.equal((await call('deep-grey','alice',{...body(deepGrey),packetRevision:'f'.repeat(64)})).status,409);
    assert.equal((await call('deep-grey','alice',{...body(deepGrey),headRevision:'f'.repeat(64)})).status,409);
    assert.equal((await call('deep-grey','alice',{...body(deepGrey),checklistVersion:'stale'})).status,409);
    assert.equal((await call('deep-grey','alice',{...body(deepGrey),draft:{...deepGrey.draft,attested:true}})).status,422);
    assert.equal((await call('deep-grey','alice',{...body(deepGrey),draft:{...deepGrey.draft,clinicalApproval:true}})).status,422);
    for(const [index,path] of paths.entries()){
      const saved=await call(path,'alice',body(values[index]));
      assert.equal(saved.status,201,path+' '+await saved.clone().text());
      assert.match(saved.headers.get('Cache-Control')??'',/private, no-store/);
    }
    assert.equal((await call('deep-grey','alice',body(deepGrey))).status,409);
    const changed={...body(deepGrey,1),draft:{...deepGrey.draft,status:'changes-required',notes:'Please correct this synthetic deep-grey note.'}};
    assert.equal((await call('deep-grey','alice',changed)).status,201);
    const raced=await Promise.all([call('deep-grey','alice',{...changed,expectedVersion:2}),call('deep-grey','alice',{...changed,expectedVersion:2})]);
    assert.deepEqual(raced.map(response=>response.status).sort(),[201,409]);
    for(const [index,path] of paths.entries()){
      const result=await call(path,'alice');
      assert.equal(result.status,200);
      assert.match(result.headers.get('Cache-Control')??'',/private, no-store/);
      const parsed=await result.json() as any;
      assert.equal(parsed.context.packetId,values[index].context.packetId);
      assert.deepEqual(parsed.history.map((event:any)=>event.version),path==='deep-grey'?[3,2,1]:[1]);
      assert.deepEqual((await (await call(path,'bob')).json() as any).history,[]);
    }
    assert.deepEqual((await (await call('deep-grey','alice',undefined,'?before=2')).json() as any).history.map((event:any)=>event.version),[1]);
    const rows=(await db.prepare('SELECT user_id,nested_key,structure_id,track FROM atlas_personal_nested_review_events').all<any>()).results;
    assert.equal(rows.length,7);
    assert.equal(new Set(rows.map(row=>row.user_id)).size,5);
    assert.equal(new Set(rows.map(row=>row.nested_key)).size,5);
    assert.equal(new Set(rows.map(row=>row.structure_id)).size,5);
    assert.deepEqual([...new Set(rows.map(row=>row.track))],['teaching']);
    const deepGreyRow=rows.find(row=>row.structure_id==='head-deep-grey-clinical');assert(deepGreyRow);
    const anatomyHistory=await (await call('anatomy','alice')).json() as any;
    await db.prepare('UPDATE atlas_personal_nested_review_events SET payload=? WHERE user_id=? AND nested_key=? AND version=1')
      .bind(JSON.stringify(anatomyHistory.history[0]),deepGreyRow.user_id,deepGreyRow.nested_key).run();
    assert.equal((await call('deep-grey','alice',undefined,'?before=2')).status,503,'a cross-packet stored event must fail closed');
    assert.equal((await call('anatomy','alice')).status,200,'other packet history remains available');
  }finally{await mf.dispose();}
});

test('client rejects cross-packet history and forged save; SSR and export retain deep-grey identity',async()=>{
  const deepGrey=await headTeachingDraftContext(HEAD_LINK_REVISION,'deep-grey-clinical');
  const cerebellar=await headTeachingDraftContext(HEAD_LINK_REVISION,'cerebellar-clinical');
  const draft=blankHeadTeachingDraft(deepGrey);
  const event={eventSchema:'vm-head-teaching-draft-event-1' as const,context:deepGrey,version:1,savedAt:'2026-10-11T12:00:00.000Z',draft};
  const empty={context:deepGrey,history:[],nextBefore:null,scope:'private-to-signed-in-account-and-institution'};
  assert.deepEqual(client.parseHeadTeachingHistory(empty,deepGrey).history,[]);
  assert.throws(()=>client.parseHeadTeachingHistory({...empty,context:cerebellar},deepGrey),client.HeadTeachingSourceChangedError);
  assert.throws(()=>client.parseHeadTeachingHistory({...empty,history:[{...event,context:cerebellar}]},deepGrey));
  assert.throws(()=>client.parseHeadTeachingHistory({...empty,history:[event,event]},deepGrey));
  assert.throws(()=>client.parseHeadTeachingHistory({...empty,history:[event],nextBefore:1},deepGrey));
  assert.deepEqual(client.confirmHeadTeachingSave({review:event},deepGrey,0,draft),event);
  for(const forged of [
    {...event,context:cerebellar},
    {...event,version:2},
    {...event,draft:{...draft,notes:'different'}},
    {...event,draft:{...draft,attested:true}},
  ])assert.throws(()=>client.confirmHeadTeachingSave({review:forged},deepGrey,0,draft));

  const source=readFileSync(new URL('../components/HeadTeachingReviewNotes.tsx',import.meta.url),'utf8');
  const compiled=ts.transpileModule(source,{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS}}).outputText;
  const mod={exports:{} as {HeadTeachingReviewNotes:React.ComponentType<any>}};
  const load=(id:string)=>id==='../lib/head-review-working-copy'?workingCopy:id==='../lib/head-teaching-review-contract'?contract:id==='../lib/head-teaching-review-client'?client:id==='../lib/clinical-review-fetch'?{clinicalReviewFetch(){throw Error('SSR must not fetch');}}:id==='./GroupedReviewConfirmation'?groupedReviewConfirmation:id==='../lib/review-draft-autosave'?require('../lib/review-draft-autosave.ts'):id.endsWith('.css')?{}:require(id);
  new Function('require','module','exports',compiled)(load,mod,mod.exports);
  const Component=mod.exports.HeadTeachingReviewNotes;
  const contexts=await Promise.all(kinds.map(kind=>headTeachingDraftContext(HEAD_LINK_REVISION,kind)));
  const html=renderToStaticMarkup(React.createElement(React.Fragment,null,...contexts.map(context=>React.createElement(Component,{context}))));
  for(const id of ['head-review-notes-title','brainstem-clinical-notes-title','ventricular-clinical-notes-title','cerebellar-clinical-notes-title','deep-grey-clinical-notes-title'])assert.equal((html.match(new RegExp(`id="${id}"`,'g'))||[]).length,1);
  const clinicalHtml=renderToStaticMarkup(React.createElement(Component,{context:deepGrey}));
  assert.match(clinicalHtml,/Private deep-grey clinical notes &amp; corrections/);
  assert.match(clinicalHtml,/Do not enter patient data/);
  assert.match(clinicalHtml,/Download working copy/);
  assert(clinicalHtml.includes(DEEP_GREY_CLINICAL_REVISION.slice(0,12)));
  for(const check of deepGrey.checklist)assert(clinicalHtml.includes(check.label.replaceAll('&','&amp;')));
  const exported=workingCopy.headTeachingWorkingCopy(deepGrey,draft,{baseVersion:null,unsavedChanges:true,saveUncertain:false,reloadRequired:false},'2026-10-11T12:00:00.000Z');
  assert.equal(exported.kind,'head-deep-grey-clinical');
  assert.deepEqual(exported.context,deepGrey);
  for(const flag of ['serverSaveConfirmed','clinicalApproval','publicationApproval','patientRegistration'] as const)assert.equal(exported[flag],false);
  assert.throws(()=>Reflect.apply(workingCopy.headTeachingWorkingCopy,null,[deepGrey,{...draft,attested:true},{baseVersion:null,unsavedChanges:true,saveUncertain:false,reloadRequired:false}]));
});

