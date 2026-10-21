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
import {HEAD_LINK_REVISION} from '../lib/head-atlas-links.ts';
import {CEREBELLAR_CLINICAL_REVISION,cerebellarClinicalPacket} from '../lib/head-cerebellar-clinical.ts';
import * as imageLinks from '../lib/head-image-only-links.ts';
import * as clinicalPacket from '../lib/head-cerebellar-clinical.ts';
import {headTeachingDraftContext,blankHeadTeachingDraft,parseSavedHeadTeachingDraft,headTeachingDraftStale} from '../lib/head-teaching-review-contract.ts';
import * as contract from '../lib/head-teaching-review-contract.ts';
import * as client from '../lib/head-teaching-review-client.ts';
import * as workingCopy from '../lib/head-review-working-copy.ts';

const require=createRequire(import.meta.url);
const digest=(value:unknown)=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
const cerebellarIds=['cerebellum-left-hemisphere','cerebellum-right-hemisphere','cerebellum-vermis'];
const kinds=['anatomy','brainstem-clinical','ventricular-clinical','cerebellar-clinical'] as const;
const paths=['anatomy','brainstem','ventricular','cerebellar'] as const;

test('clinical evidence includes private notes only for the verified packet',()=>{
  const source=readFileSync(new URL('../components/HeadCerebellarClinicalReview.tsx',import.meta.url),'utf8');
  const compiled=ts.transpileModule(source,{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS}}).outputText;
  const mod={exports:{} as {HeadCerebellarClinicalReview:React.ComponentType<{revision:string;clinicalRevision:string|null;reviewNotes?:React.ReactNode}>}};
  const load=(id:string)=>id==='./HeadReviewImageLink'?{HeadReviewImageLink:({children}:{children:React.ReactNode})=>React.createElement('span',null,children)}:require(id);
  new Function('require','module','exports',compiled)(load,mod,mod.exports);
  const marker=React.createElement('form',{'data-test-private-notes':'cerebellar'},'Synthetic private corrections');
  const render=(revision:string,clinicalRevision:string|null)=>renderToStaticMarkup(React.createElement(mod.exports.HeadCerebellarClinicalReview,{revision,clinicalRevision,reviewNotes:marker}));
  assert.match(render(HEAD_LINK_REVISION,CEREBELLAR_CLINICAL_REVISION),/<details id="cerebellar-clinical-corrections"><summary>Private corrections &amp; saved history<\/summary><form data-test-private-notes="cerebellar"/);
  for(const [revision,clinicalRevision] of [['stale',CEREBELLAR_CLINICAL_REVISION],[HEAD_LINK_REVISION,'stale'],[HEAD_LINK_REVISION,null]])assert.doesNotMatch(render(revision!,clinicalRevision),/Synthetic private corrections|<form/);
  const page=readFileSync(new URL('../app/workspace/atlas-review/head-learning/page.tsx',import.meta.url),'utf8');
  assert.match(page,/if\(cerebellarClinicalRevision\)try\{cerebellarContext=await headTeachingDraftContext\(HEAD_MANIFEST_SHA256,'cerebellar-clinical'\)/);
  assert.match(page,/reviewNotes=\{cerebellarContext\?<HeadTeachingReviewNotes key=\{JSON.stringify\(cerebellarContext\)\} context=\{cerebellarContext\}/);
  assert.match(page,/id:'cerebellar-clinical-corrections',label:'Cerebellar clinical corrections · Private notes'/);
  const binder=readFileSync(new URL('../scripts/bind-clinical-review.mjs',import.meta.url),'utf8');
  for(const file of ['lib/head-teaching-review-contract.ts','lib/head-teaching-review-api.ts','lib/head-teaching-review-store.ts','components/HeadTeachingReviewNotes.tsx','app/api/atlas-review/head-cerebellar-clinical/route.ts'])assert(binder.includes(`'${file}'`));
});

test('cerebellar corrections bind the exact separate packet, concepts and review checklist',async()=>{
  const contexts=await Promise.all(kinds.map(kind=>headTeachingDraftContext(HEAD_LINK_REVISION,kind)));
  const [anatomy,brainstem,ventricular,cerebellar]=contexts;
  const packet=cerebellarClinicalPacket();
  assert.equal(digest(packet),CEREBELLAR_CLINICAL_REVISION);
  assert.equal(CEREBELLAR_CLINICAL_REVISION,'49f55fc8ff432818ebc3b2fbe6e17891ec7dd25d5092d1699870fde06f02631d');
  assert.equal(cerebellar.packetRevision,CEREBELLAR_CLINICAL_REVISION);
  assert.equal(cerebellar.catalogScope,'head-cerebellar-clinical-drafts');
  assert.equal(cerebellar.packetId,'head-cerebellar-clinical');
  assert.equal(cerebellar.checklistVersion,'head-cerebellar-clinical-draft-review-1');
  assert.deepEqual(cerebellar.conceptIds,cerebellarIds);
  assert.deepEqual(cerebellar.checklist.map(check=>check.id),['wording','scan-attribution','imaging','bindings']);
  assert.deepEqual(cerebellar.checklist.map(check=>check.label),packet.content.reviewChecks);
  assert.deepEqual(packet.bindings.map(binding=>binding?.atlasHref??null),[null,null,null]);
  for(const flag of ['patientRegistration','clinicalApproval','publicationApproval'] as const)assert.equal(cerebellar[flag],false);
  assert.equal(new Set(contexts.map(context=>context.packetRevision)).size,4);
  assert.equal(new Set(contexts.map(context=>context.packetId)).size,4);
  assert.equal(new Set(contexts.map(context=>context.catalogScope)).size,4);

  const event={eventSchema:'vm-head-teaching-draft-event-1' as const,context:cerebellar,version:1,savedAt:'2026-10-11T12:00:00.000Z',draft:blankHeadTeachingDraft(cerebellar)};
  assert.deepEqual(parseSavedHeadTeachingDraft(event),event);
  assert.equal(headTeachingDraftStale(event,cerebellar),false);
  for(const prior of [anatomy,brainstem,ventricular])assert.equal(headTeachingDraftStale(event,prior),true);
  for(const changed of [
    {...cerebellar,packetRevision:'a'.repeat(64)},
    {...cerebellar,headRevision:'a'.repeat(64)},
    {...cerebellar,checklistVersion:'head-cerebellar-clinical-draft-review-2'},
    {...cerebellar,checklist:[...cerebellar.checklist].reverse()},
  ])assert.equal(headTeachingDraftStale(event,changed),true);
  for(const badContext of [
    {...cerebellar,catalogScope:brainstem.catalogScope},
    {...cerebellar,packetId:ventricular.packetId},
    {...cerebellar,conceptIds:[...cerebellarIds,'brainstem-pons']},
    {...cerebellar,conceptIds:cerebellarIds.slice(0,2)},
    {...cerebellar,conceptIds:[cerebellarIds[0],cerebellarIds[0],cerebellarIds[2]]},
    {...cerebellar,checklist:[...cerebellar.checklist,{id:'approval',label:'Approve'}]},
    {...cerebellar,clinicalApproval:true},
    {...cerebellar,publicationApproval:true},
    {...cerebellar,patientRegistration:true},
  ])assert.throws(()=>parseSavedHeadTeachingDraft({...event,context:badContext}));
  assert.throws(()=>parseSavedHeadTeachingDraft({...event,draft:{...event.draft,attested:true}}));
  await assert.rejects(headTeachingDraftContext('0'.repeat(64),'cerebellar-clinical'));
  const mutable=packet.content as unknown as {notes:{text:string}[]};
  const original=mutable.notes[0].text;
  try{mutable.notes[0].text=original+' temporary hash probe';await assert.rejects(headTeachingDraftContext(HEAD_LINK_REVISION,'cerebellar-clinical'),/packet or comparison source changed/);}
  finally{mutable.notes[0].text=original;}
  const compile=(path:string,overrides:Record<string,unknown>)=>{
    const source=readFileSync(new URL(path,import.meta.url),'utf8');
    const code=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
    const mod={exports:{} as Record<string,any>};
    new Function('require','module','exports',code)((id:string)=>overrides[id]??require('../lib/'+id.slice(2)),mod,mod.exports);
    return mod.exports;
  };
  const alteredClinical=compile('../lib/head-cerebellar-clinical.ts',{'./head-image-only-links.ts':{
    ...imageLinks,headImageConceptById:(id:string)=>{
      const binding=imageLinks.headImageConceptById(id);
      return binding?{...binding,atlasHref:'/atlas/head-neck-3d'}:null;
    },
  }}) as typeof clinicalPacket;
  assert.equal(await alteredClinical.verifiedCerebellarClinicalRevision(HEAD_LINK_REVISION),null);
  const alteredContract=compile('../lib/head-teaching-review-contract.ts',{'./head-cerebellar-clinical.ts':alteredClinical}) as typeof contract;
  await assert.rejects(alteredContract.headTeachingDraftContext(HEAD_LINK_REVISION,'cerebellar-clinical'));
});

test('all four real-schema histories are private, isolated and version guarded', {timeout:60000},async()=>{
  const entry=`
    import {getHeadTeachingDrafts,postHeadTeachingDraft} from './lib/head-teaching-review-api';
    import {headTeachingDraftContext,blankHeadTeachingDraft} from './lib/head-teaching-review-contract';
    import {HEAD_LINK_REVISION} from './lib/head-atlas-links';
    export default {async fetch(request,env){
      const url=new URL(request.url);
      const kinds={anatomy:'anatomy',brainstem:'brainstem-clinical',ventricular:'ventricular-clinical',cerebellar:'cerebellar-clinical'};
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
  const bundled=await build({stdin:{contents:entry,resolveDir:process.cwd(),sourcefile:'cerebellar-review-fixture.ts'},bundle:true,write:false,format:'esm',platform:'neutral',target:'es2022'});
  const mf=new Miniflare(convertV4MiniflareOptions({modules:[{type:'ESModule',path:resolve('.local/cerebellar-review-fixture.mjs'),contents:bundled.outputFiles[0].text}],compatibilityDate:'2026-08-23',d1Databases:['DB'],log:new Log(LogLevel.NONE)}));
  try{
    const db=await mf.getD1Database('DB');
    for(const sql of readFileSync('drizzle/0008_solid_infant_terrible.sql','utf8').split('--> statement-breakpoint').map(value=>value.trim()).filter(Boolean))await db.prepare(sql).run();
    const fixture=async(kind:string)=>(await (await mf.dispatchFetch('https://review.test/fixture?kind='+kind)).json()) as any;
    const values=await Promise.all(kinds.map(fixture));
    const body=(item:any,expectedVersion=0)=>({catalogScope:item.context.catalogScope,packetId:item.context.packetId,packetRevision:item.context.packetRevision,headRevision:item.context.headRevision,checklistVersion:item.context.checklistVersion,expectedVersion,draft:item.draft});
    const call=(path:string,user:string|null,payload?:unknown,search='')=>mf.dispatchFetch('https://review.test/'+path+search,{method:payload===undefined?'GET':'POST',headers:{...(user?{'oai-authenticated-user-id':user}:{}),...(payload===undefined?{}:{origin:'https://review.test','content-type':'application/json'})},...(payload===undefined?{}:{body:JSON.stringify(payload)})});
    const cerebellar=values[3];
    assert.equal((await call('cerebellar',null)).status,401);
    assert.equal((await call('cerebellar',null,body(cerebellar))).status,401);
    for(const prior of values.slice(0,3))assert.equal((await call('cerebellar','alice',body(prior))).status,400);
    for(const path of paths.slice(0,3))assert.equal((await call(path,'alice',body(cerebellar))).status,400);
    assert.equal((await call('cerebellar','alice',{...body(cerebellar),packetRevision:'f'.repeat(64)})).status,409);
    assert.equal((await call('cerebellar','alice',{...body(cerebellar),headRevision:'f'.repeat(64)})).status,409);
    assert.equal((await call('cerebellar','alice',{...body(cerebellar),checklistVersion:'stale'})).status,409);
    assert.equal((await call('cerebellar','alice',{...body(cerebellar),draft:{...cerebellar.draft,attested:true}})).status,422);
    assert.equal((await call('cerebellar','alice',{...body(cerebellar),draft:{...cerebellar.draft,clinicalApproval:true}})).status,422);
    for(const [index,path] of paths.entries()){
      const saved=await call(path,'alice',body(values[index]));
      assert.equal(saved.status,201,path+' '+await saved.clone().text());
      assert.match(saved.headers.get('Cache-Control')??'',/private, no-store/);
    }
    assert.equal((await call('cerebellar','alice',body(cerebellar))).status,409);
    const changed={...body(cerebellar,1),draft:{...cerebellar.draft,status:'changes-required',notes:'Please correct this synthetic cerebellar note.'}};
    assert.equal((await call('cerebellar','alice',changed)).status,201);
    const raced=await Promise.all([call('cerebellar','alice',{...changed,expectedVersion:2}),call('cerebellar','alice',{...changed,expectedVersion:2})]);
    assert.deepEqual(raced.map(response=>response.status).sort(),[201,409]);
    for(const [index,path] of paths.entries()){
      const result=await call(path,'alice');
      assert.equal(result.status,200);
      assert.match(result.headers.get('Cache-Control')??'',/private, no-store/);
      const parsed=await result.json() as any;
      assert.equal(parsed.context.packetId,values[index].context.packetId);
      assert.deepEqual(parsed.history.map((event:any)=>event.version),path==='cerebellar'?[3,2,1]:[1]);
      assert.deepEqual((await (await call(path,'bob')).json() as any).history,[]);
    }
    assert.deepEqual((await (await call('cerebellar','alice',undefined,'?before=2')).json() as any).history.map((event:any)=>event.version),[1]);
    const rows=(await db.prepare('SELECT user_id,nested_key,structure_id,track FROM atlas_personal_nested_review_events').all<any>()).results;
    assert.equal(rows.length,6);
    assert.equal(new Set(rows.map(row=>row.user_id)).size,4);
    assert.equal(new Set(rows.map(row=>row.nested_key)).size,4);
    assert.equal(new Set(rows.map(row=>row.structure_id)).size,4);
    assert.deepEqual([...new Set(rows.map(row=>row.track))],['teaching']);
    const cerebellarRow=rows.find(row=>row.structure_id==='head-cerebellar-clinical');assert(cerebellarRow);
    const anatomyHistory=await (await call('anatomy','alice')).json() as any;
    await db.prepare('UPDATE atlas_personal_nested_review_events SET payload=? WHERE user_id=? AND nested_key=? AND version=1')
      .bind(JSON.stringify(anatomyHistory.history[0]),cerebellarRow.user_id,cerebellarRow.nested_key).run();
    assert.equal((await call('cerebellar','alice',undefined,'?before=2')).status,503,'a cross-packet stored event must fail closed');
    assert.equal((await call('anatomy','alice')).status,200,'other packet history remains available');
  }finally{await mf.dispose();}
});

test('client rejects wrong history and forged save; SSR and export keep clinical corrections distinct',async()=>{
  const cerebellar=await headTeachingDraftContext(HEAD_LINK_REVISION,'cerebellar-clinical');
  const ventricular=await headTeachingDraftContext(HEAD_LINK_REVISION,'ventricular-clinical');
  const draft=blankHeadTeachingDraft(cerebellar);
  const event={eventSchema:'vm-head-teaching-draft-event-1' as const,context:cerebellar,version:1,savedAt:'2026-10-11T12:00:00.000Z',draft};
  const empty={context:cerebellar,history:[],nextBefore:null,scope:'private-to-signed-in-account-and-institution'};
  assert.deepEqual(client.parseHeadTeachingHistory(empty,cerebellar).history,[]);
  assert.throws(()=>client.parseHeadTeachingHistory({...empty,context:ventricular},cerebellar),client.HeadTeachingSourceChangedError);
  assert.throws(()=>client.parseHeadTeachingHistory({...empty,history:[{...event,context:ventricular}]},cerebellar));
  assert.throws(()=>client.parseHeadTeachingHistory({...empty,history:[event,event]},cerebellar));
  assert.throws(()=>client.parseHeadTeachingHistory({...empty,history:[event],nextBefore:1},cerebellar));
  assert.deepEqual(client.confirmHeadTeachingSave({review:event},cerebellar,0,draft),event);
  for(const forged of [
    {...event,context:ventricular},
    {...event,version:2},
    {...event,draft:{...draft,notes:'different'}},
    {...event,draft:{...draft,attested:true}},
  ])assert.throws(()=>client.confirmHeadTeachingSave({review:forged},cerebellar,0,draft));

  const source=readFileSync(new URL('../components/HeadTeachingReviewNotes.tsx',import.meta.url),'utf8');
  const compiled=ts.transpileModule(source,{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS}}).outputText;
  const mod={exports:{} as {HeadTeachingReviewNotes:React.ComponentType<any>}};
  const load=(id:string)=>id==='../lib/head-review-working-copy'?workingCopy:id==='../lib/head-teaching-review-contract'?contract:id==='../lib/head-teaching-review-client'?client:id==='../lib/clinical-review-fetch'?{clinicalReviewFetch(){throw Error('SSR must not fetch');}}:id.endsWith('.css')?{}:require(id);
  new Function('require','module','exports',compiled)(load,mod,mod.exports);
  const Component=mod.exports.HeadTeachingReviewNotes;
  const contexts=await Promise.all(kinds.map(kind=>headTeachingDraftContext(HEAD_LINK_REVISION,kind)));
  const html=renderToStaticMarkup(React.createElement(React.Fragment,null,...contexts.map(context=>React.createElement(Component,{context}))));
  for(const id of ['head-review-notes-title','brainstem-clinical-notes-title','ventricular-clinical-notes-title','cerebellar-clinical-notes-title'])assert.equal((html.match(new RegExp(`id="${id}"`,'g'))||[]).length,1);
  const clinicalHtml=renderToStaticMarkup(React.createElement(Component,{context:cerebellar}));
  assert.match(clinicalHtml,/Private cerebellar clinical notes &amp; corrections/);
  assert.match(clinicalHtml,/Do not enter patient data/);
  assert.match(clinicalHtml,/Download working copy/);
  assert(clinicalHtml.includes(CEREBELLAR_CLINICAL_REVISION.slice(0,12)));
  for(const check of cerebellar.checklist)assert(clinicalHtml.includes(check.label.replaceAll('&','&amp;')));
  assert.doesNotMatch(clinicalHtml,/Inspect [^<]*3D/);
  const exported=workingCopy.headTeachingWorkingCopy(cerebellar,draft,{baseVersion:null,unsavedChanges:true,saveUncertain:false,reloadRequired:false},'2026-10-11T12:00:00.000Z');
  assert.equal(exported.kind,'head-cerebellar-clinical');
  assert.deepEqual(exported.context,cerebellar);
  for(const flag of ['serverSaveConfirmed','clinicalApproval','publicationApproval','patientRegistration'] as const)assert.equal(exported[flag],false);
  assert.throws(()=>Reflect.apply(workingCopy.headTeachingWorkingCopy,null,[cerebellar,{...draft,attested:true},{baseVersion:null,unsavedChanges:true,saveUncertain:false,reloadRequired:false}]));
});
