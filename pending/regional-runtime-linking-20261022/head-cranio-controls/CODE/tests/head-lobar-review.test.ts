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
import {LOBAR_CLINICAL_REVISION,lobarClinicalPacket} from '../lib/head-lobar-clinical.ts';
import {blankHeadTeachingDraft,headTeachingDraftContext,headTeachingDraftStale,parseSavedHeadTeachingDraft} from '../lib/head-teaching-review-contract.ts';
import * as contract from '../lib/head-teaching-review-contract.ts';
import * as client from '../lib/head-teaching-review-client.ts';
import * as workingCopy from '../lib/head-review-working-copy.ts';
import * as navigationGuard from '../lib/clinical-review-navigation-guard.ts';

const require=createRequire(import.meta.url);
const digest=(value:unknown)=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
const lobarIds=['left','right'].flatMap(side=>['frontal','parietal','temporal','occipital'].map(part=>`cortex-${side}-${part}-lobe`));
const kinds=['anatomy','brainstem-clinical','ventricular-clinical','cerebellar-clinical','deep-grey-clinical','lobar-clinical'] as const;
const paths=['anatomy','brainstem','ventricular','cerebellar','deep-grey','lobar'] as const;

test('lobar draft context is source-bound, distinct and rejects altered identities or approvals',async()=>{
  const contexts=await Promise.all(kinds.map(kind=>headTeachingDraftContext(HEAD_LINK_REVISION,kind)));
  const lobar=contexts[5],packet=lobarClinicalPacket();
  assert.equal(LOBAR_CLINICAL_REVISION,'a0217a9f8621b59aaa906678565c52cbbfc5ebf3a8ef7ac8c29168879dd617c1');
  assert.equal(digest(packet),LOBAR_CLINICAL_REVISION);
  assert.equal(lobar.packetRevision,LOBAR_CLINICAL_REVISION);
  assert.equal(lobar.catalogScope,'head-lobar-clinical-drafts');
  assert.equal(lobar.packetId,'head-lobar-clinical');
  assert.equal(lobar.checklistVersion,'head-lobar-clinical-draft-review-1');
  assert.deepEqual(lobar.conceptIds,lobarIds);
  assert.deepEqual(lobar.checklist.map(check=>check.id),['wording','scan-attribution','imaging','bindings']);
  assert.deepEqual(lobar.checklist.map(check=>check.label),packet.content.reviewChecks);
  assert.equal(packet.bindings.length,8);
  assert(packet.bindings.every(binding=>binding?.atlasHref&&binding.ctHref&&binding.mriHref));
  for(const flag of ['patientRegistration','clinicalApproval','publicationApproval'] as const)assert.equal(lobar[flag],false);
  for(const field of ['catalogScope','packetId','packetRevision'] as const)assert.equal(new Set(contexts.map(context=>context[field])).size,6);
  const event={eventSchema:'vm-head-teaching-draft-event-1' as const,context:lobar,version:1,savedAt:'2026-10-11T12:00:00.000Z',draft:blankHeadTeachingDraft(lobar)};
  assert.deepEqual(parseSavedHeadTeachingDraft(event),event);
  for(const previous of contexts.slice(0,5))assert.equal(headTeachingDraftStale(event,previous),true);
  for(const changed of [{...lobar,packetRevision:'f'.repeat(64)},{...lobar,headRevision:'f'.repeat(64)},{...lobar,checklistVersion:'head-lobar-clinical-draft-review-2'},{...lobar,checklist:[...lobar.checklist].reverse()}])assert.equal(headTeachingDraftStale(event,changed),true);
  for(const bad of [
    {...lobar,catalogScope:contexts[4].catalogScope},
    {...lobar,packetId:contexts[4].packetId},
    {...lobar,conceptIds:lobarIds.slice(1)},
    {...lobar,conceptIds:[lobarIds[0],...lobarIds.slice(0,7)]},
    {...lobar,conceptIds:[...lobarIds.slice(0,7),'deep-left-caudate']},
    {...lobar,checklist:[...lobar.checklist,{id:'approval',label:'Approve'}]},
    {...lobar,clinicalApproval:true},
    {...lobar,publicationApproval:true},
    {...lobar,patientRegistration:true},
  ])assert.throws(()=>parseSavedHeadTeachingDraft({...event,context:bad}));
  assert.throws(()=>parseSavedHeadTeachingDraft({...event,draft:{...event.draft,attested:true}}));
  await assert.rejects(headTeachingDraftContext('0'.repeat(64),'lobar-clinical'));
  const mutable=packet.content as unknown as {notes:{text:string}[]};
  const original=mutable.notes[0].text;
  try{mutable.notes[0].text=original+' temporary source probe';await assert.rejects(headTeachingDraftContext(HEAD_LINK_REVISION,'lobar-clinical'),/packet|source|hash/i);}
  finally{mutable.notes[0].text=original;}
});

test('API rejects unauthenticated, forged, malformed and stale requests before preparing storage',async()=>{
  // The API imports Cloudflare's review-http.ts, whose parameter property is
  // intentionally compiled by the application build, not Node's strip-only loader.
  const compiled=await build({entryPoints:[resolve('lib/head-teaching-review-api.ts')],bundle:true,write:false,format:'esm',platform:'node',target:'es2022'});
  const api=await import('data:text/javascript;base64,'+Buffer.from(compiled.outputFiles[0].text).toString('base64')) as typeof import('../lib/head-teaching-review-api.ts');
  const {getHeadTeachingDrafts,postHeadTeachingDraft}=api;
  const lobar=await headTeachingDraftContext(HEAD_LINK_REVISION,'lobar-clinical');
  const draft=blankHeadTeachingDraft(lobar);
  const body={catalogScope:lobar.catalogScope,packetId:lobar.packetId,packetRevision:lobar.packetRevision,
    headRevision:lobar.headRevision,checklistVersion:lobar.checklistVersion,expectedVersion:0,draft};
  let prepares=0;
  const db={prepare(){prepares++;throw Error('Storage must not be prepared for a refused request.');}} as unknown as Pick<D1Database,'prepare'>;
  const get=(query='',user='alice')=>new Request('https://review.test/lobar'+query,{headers:user?{'oai-authenticated-user-id':user}:{}});
  const post=(payload:unknown,options:{user?:string;query?:string;origin?:string;contentType?:string;site?:string;raw?:string}={})=>
    new Request('https://review.test/lobar'+(options.query??''),{method:'POST',headers:{
      ...(options.user===''?{}:{'oai-authenticated-user-id':options.user??'alice'}),
      origin:options.origin??'https://review.test',
      'content-type':options.contentType??'application/json',
      ...(options.site?{'sec-fetch-site':options.site}:{}),
    },body:options.raw??JSON.stringify(payload)});
  const rejectedGet:[Request,number][]=[
    [get('', ''),401],
    [get('?before=0'),400],
    [get('?before=2&before=3'),400],
    [get('?other=1'),400],
  ];
  for(const [request,status] of rejectedGet){
    assert.equal((await getHeadTeachingDrafts(request,db,HEAD_LINK_REVISION,'lobar-clinical')).status,status);
    assert.equal(prepares,0,request.url);
  }
  const rejectedPost:[Request,number][]=[
    [post(body,{user:''}),401],
    [post(body,{query:'?before=1'}),400],
    [post({...body,extra:true}),400],
    [post({...body,catalogScope:'head-deep-grey-clinical-drafts'}),400],
    [post({...body,packetId:'head-deep-grey-clinical'}),400],
    [post({...body,packetRevision:'f'.repeat(64)}),409],
    [post({...body,headRevision:'f'.repeat(64)}),409],
    [post({...body,checklistVersion:'stale'}),409],
    [post({...body,expectedVersion:-1}),400],
    [post({...body,expectedVersion:1.5}),400],
    [post({...body,draft:{...draft,clinicalApproval:true}}),422],
    [post({...body,draft:{...draft,publicationApproval:true}}),422],
    [post({...body,draft:{...draft,patientRegistration:true}}),422],
    [post({...body,draft:{...draft,attested:true}}),422],
    [post(body,{origin:'https://foreign.test'}),403],
    [post(body,{site:'cross-site'}),403],
    [post(body,{contentType:'text/plain'}),415],
    [post(body,{raw:'{"broken":'}),400],
    [post(body,{raw:' '.repeat(32001)}),413],
  ];
  for(const [request,status] of rejectedPost){
    assert.equal((await postHeadTeachingDraft(request,db,HEAD_LINK_REVISION,'lobar-clinical')).status,status,request.url);
    assert.equal(prepares,0,request.url);
  }
});

test('six real-schema histories remain isolated, append-only and fail closed on poisoned rows',{timeout:60000},async()=>{
  const entry=`
    import {getHeadTeachingDrafts,postHeadTeachingDraft} from './lib/head-teaching-review-api';
    import {headTeachingDraftContext,blankHeadTeachingDraft} from './lib/head-teaching-review-contract';
    import {HEAD_LINK_REVISION} from './lib/head-atlas-links';
    export default {async fetch(request,env){
      const url=new URL(request.url);
      const kinds={anatomy:'anatomy',brainstem:'brainstem-clinical',ventricular:'ventricular-clinical',cerebellar:'cerebellar-clinical','deep-grey':'deep-grey-clinical',lobar:'lobar-clinical'};
      if(url.pathname==='/fixture'){
        const context=await headTeachingDraftContext(HEAD_LINK_REVISION,url.searchParams.get('kind'));
        return Response.json({context,draft:blankHeadTeachingDraft(context)});
      }
      const kind=kinds[url.pathname.slice(1)];
      if(!kind)return new Response('Not found',{status:404});
      return request.method==='POST'?postHeadTeachingDraft(request,env.DB,HEAD_LINK_REVISION,kind):getHeadTeachingDrafts(request,env.DB,HEAD_LINK_REVISION,kind);
    }};`;
  const bundled=await build({stdin:{contents:entry,resolveDir:process.cwd(),sourcefile:'lobar-review-fixture.ts'},bundle:true,write:false,format:'esm',platform:'neutral',target:'es2022'});
  const mf=new Miniflare(convertV4MiniflareOptions({modules:[{type:'ESModule',path:resolve('.local/lobar-review-fixture.mjs'),contents:bundled.outputFiles[0].text}],compatibilityDate:'2026-08-23',d1Databases:['DB'],log:new Log(LogLevel.NONE)}));
  try{
    const db=await mf.getD1Database('DB');
    for(const sql of readFileSync('drizzle/0008_solid_infant_terrible.sql','utf8').split('--> statement-breakpoint').map(value=>value.trim()).filter(Boolean))await db.prepare(sql).run();
    const fixture=async(kind:string)=>(await (await mf.dispatchFetch('https://review.test/fixture?kind='+kind)).json()) as any;
    const values=await Promise.all(kinds.map(fixture));
    const body=(item:any,expectedVersion=0)=>({catalogScope:item.context.catalogScope,packetId:item.context.packetId,packetRevision:item.context.packetRevision,headRevision:item.context.headRevision,checklistVersion:item.context.checklistVersion,expectedVersion,draft:item.draft});
    const call=(path:string,user:string|null,payload?:unknown,search='')=>mf.dispatchFetch('https://review.test/'+path+search,{method:payload===undefined?'GET':'POST',headers:{...(user?{'oai-authenticated-user-id':user}:{}),...(payload===undefined?{}:{origin:'https://review.test','content-type':'application/json'})},...(payload===undefined?{}:{body:JSON.stringify(payload)})});
    const lobar=values[5];
    assert.equal((await call('lobar',null)).status,401);
    assert.equal((await call('lobar',null,body(lobar))).status,401);
    for(const previous of values.slice(0,5))assert.equal((await call('lobar','alice',body(previous))).status,400);
    for(const path of paths.slice(0,5))assert.equal((await call(path,'alice',body(lobar))).status,400);
    for(const patch of [{packetRevision:'f'.repeat(64)},{headRevision:'f'.repeat(64)},{checklistVersion:'stale'}])assert.equal((await call('lobar','alice',{...body(lobar),...patch})).status,409);
    for(const patch of [{attested:true},{clinicalApproval:true},{patientRegistration:true}])assert.equal((await call('lobar','alice',{...body(lobar),draft:{...lobar.draft,...patch}})).status,422);
    // These refusals must happen before a database is required or touched.
    assert.equal((await call('lobar','alice',{...body(lobar),packetId:'head-deep-grey-clinical'})).status,400);
    const emptyRows=(await db.prepare('SELECT COUNT(*) AS count FROM atlas_personal_nested_review_events').first<{count:number}>())!;
    assert.equal(emptyRows.count,0);
    for(const [index,path] of paths.entries()){
      const saved=await call(path,'alice',body(values[index]));
      assert.equal(saved.status,201,path+' '+await saved.clone().text());
      assert.match(saved.headers.get('Cache-Control')??'',/private, no-store/);
    }
    assert.equal((await call('lobar','alice',body(lobar))).status,409);
    const changed={...body(lobar,1),draft:{...lobar.draft,status:'changes-required',notes:'Correct this synthetic lobar note.'}};
    assert.equal((await call('lobar','alice',changed)).status,201);
    const raced=await Promise.all([call('lobar','alice',{...changed,expectedVersion:2}),call('lobar','alice',{...changed,expectedVersion:2})]);
    assert.deepEqual(raced.map(response=>response.status).sort(),[201,409]);
    for(const [index,path] of paths.entries()){
      const result=await call(path,'alice');
      assert.equal(result.status,200);
      assert.match(result.headers.get('Cache-Control')??'',/private, no-store/);
      const parsed=await result.json() as any;
      assert.equal(parsed.context.packetId,values[index].context.packetId);
      assert.deepEqual(parsed.history.map((event:any)=>event.version),path==='lobar'?[3,2,1]:[1]);
      assert.deepEqual((await (await call(path,'bob')).json() as any).history,[]);
    }
    assert.deepEqual((await (await call('lobar','alice',undefined,'?before=2')).json() as any).history.map((event:any)=>event.version),[1]);
    const rows=(await db.prepare('SELECT user_id,nested_key,structure_id,track FROM atlas_personal_nested_review_events').all<any>()).results;
    assert.equal(rows.length,8);
    assert.equal(new Set(rows.map(row=>row.user_id)).size,6);
    assert.equal(new Set(rows.map(row=>row.nested_key)).size,6);
    assert.equal(new Set(rows.map(row=>row.structure_id)).size,6);
    assert.deepEqual([...new Set(rows.map(row=>row.track))],['teaching']);
    const lobarRow=rows.find(row=>row.structure_id==='head-lobar-clinical');assert(lobarRow);
    assert.equal(lobarRow.nested_key,JSON.stringify(['vm-head-lobar-clinical-drafts-1','ct-mri']));
    assert.equal(lobarRow.user_id,JSON.stringify(['vm-head-lobar-clinical-personal-drafts-1','alice']));
    const anatomyHistory=await (await call('anatomy','alice')).json() as any;
    await db.prepare('UPDATE atlas_personal_nested_review_events SET payload=? WHERE user_id=? AND nested_key=? AND version=1')
      .bind(JSON.stringify(anatomyHistory.history[0]),lobarRow.user_id,lobarRow.nested_key).run();
    assert.equal((await call('lobar','alice',undefined,'?before=2')).status,503);
    assert.equal((await call('anatomy','alice')).status,200);
  }finally{await mf.dispose();}
});

test('client rejects foreign history and saves; form and working copy retain lobar identity',async()=>{
  const lobar=await headTeachingDraftContext(HEAD_LINK_REVISION,'lobar-clinical');
  const deepGrey=await headTeachingDraftContext(HEAD_LINK_REVISION,'deep-grey-clinical');
  const draft=blankHeadTeachingDraft(lobar);
  const event={eventSchema:'vm-head-teaching-draft-event-1' as const,context:lobar,version:1,savedAt:'2026-10-11T12:00:00.000Z',draft};
  const empty={context:lobar,history:[],nextBefore:null,scope:'private-to-signed-in-account-and-institution'};
  assert.deepEqual(client.parseHeadTeachingHistory(empty,lobar).history,[]);
  assert.throws(()=>client.parseHeadTeachingHistory({...empty,context:deepGrey},lobar),client.HeadTeachingSourceChangedError);
  assert.throws(()=>client.parseHeadTeachingHistory({...empty,history:[{...event,context:deepGrey}]},lobar));
  assert.throws(()=>client.parseHeadTeachingHistory({...empty,history:[event,event]},lobar));
  assert.deepEqual(client.confirmHeadTeachingSave({review:event},lobar,0,draft),event);
  for(const forged of [{...event,context:deepGrey},{...event,version:2},{...event,draft:{...draft,notes:'different'}},{...event,draft:{...draft,attested:true}}])assert.throws(()=>client.confirmHeadTeachingSave({review:forged},lobar,0,draft));
  const source=readFileSync(new URL('../components/HeadTeachingReviewNotes.tsx',import.meta.url),'utf8');
  const compiled=ts.transpileModule(source,{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS}}).outputText;
  const mod={exports:{} as {HeadTeachingReviewNotes:React.ComponentType<any>}};
  const load=(id:string)=>id==='../lib/clinical-review-navigation-guard'?navigationGuard:id==='../lib/head-review-working-copy'?workingCopy:id==='../lib/head-teaching-review-contract'?contract:id==='../lib/head-teaching-review-client'?client:id==='../lib/clinical-review-fetch'?{clinicalReviewFetch(){throw Error('SSR must not fetch');}}:id==='./GroupedReviewConfirmation'?groupedReviewConfirmation:id==='../lib/review-draft-autosave'?require('../lib/review-draft-autosave.ts'):id.endsWith('.css')?{}:require(id);
  new Function('require','module','exports',compiled)(load,mod,mod.exports);
  const all=renderToStaticMarkup(React.createElement(React.Fragment,null,...(await Promise.all(kinds.map(kind=>headTeachingDraftContext(HEAD_LINK_REVISION,kind)))).map(context=>React.createElement(mod.exports.HeadTeachingReviewNotes,{context}))));
  for(const id of ['head-review-notes-title','brainstem-clinical-notes-title','ventricular-clinical-notes-title','cerebellar-clinical-notes-title','deep-grey-clinical-notes-title','lobar-clinical-notes-title'])assert.equal((all.match(new RegExp(`id="${id}"`,'g'))||[]).length,1);
  const html=renderToStaticMarkup(React.createElement(mod.exports.HeadTeachingReviewNotes,{context:lobar}));
  assert.match(html,/Private cerebral-lobe clinical notes &amp; corrections/);
  assert.match(html,/Do not enter patient data/);
  assert.match(html,/Download working copy/);
  assert(html.includes(LOBAR_CLINICAL_REVISION.slice(0,12)));
  for(const check of lobar.checklist)assert(html.includes(check.label.replaceAll('&','&amp;')));
  const exported=workingCopy.headTeachingWorkingCopy(lobar,draft,{baseVersion:null,unsavedChanges:true,saveUncertain:false,reloadRequired:false},'2026-10-11T12:00:00.000Z');
  assert.equal(exported.kind,'head-lobar-clinical');
  assert.deepEqual(exported.context,lobar);
  for(const flag of ['serverSaveConfirmed','clinicalApproval','publicationApproval','patientRegistration'] as const)assert.equal(exported[flag],false);
  assert.throws(()=>Reflect.apply(workingCopy.headTeachingWorkingCopy,null,[lobar,{...draft,attested:true},{baseVersion:null,unsavedChanges:true,saveUncertain:false,reloadRequired:false}]));
});

test('verified review alone mounts private corrections, and page and route guard the form',()=>{
  const source=readFileSync(new URL('../components/HeadLobarClinicalReview.tsx',import.meta.url),'utf8');
  const compiled=ts.transpileModule(source,{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS}}).outputText;
  const mod={exports:{} as {HeadLobarClinicalReview:React.ComponentType<{revision:string;clinicalRevision:string|null;reviewNotes?:React.ReactNode}>}};
  const load=(id:string)=>id==='./HeadReviewImageLink'?{HeadReviewImageLink:({children}:{children:React.ReactNode})=>React.createElement('span',null,children)}:require(id);
  new Function('require','module','exports',compiled)(load,mod,mod.exports);
  const marker=React.createElement('form',{'data-test-private-notes':'lobar'},'Synthetic private corrections');
  const render=(revision:string,clinicalRevision:string|null)=>renderToStaticMarkup(React.createElement(mod.exports.HeadLobarClinicalReview,{revision,clinicalRevision,reviewNotes:marker}));
  assert.match(render(HEAD_LINK_REVISION,LOBAR_CLINICAL_REVISION),/<details id="lobar-clinical-corrections"><summary>Private corrections &amp; saved history<\/summary><form data-test-private-notes="lobar"/);
  for(const [revision,clinicalRevision] of [['stale',LOBAR_CLINICAL_REVISION],[HEAD_LINK_REVISION,'stale'],[HEAD_LINK_REVISION,null]])assert.doesNotMatch(render(revision!,clinicalRevision),/Synthetic private corrections|<form/);
  const page=readFileSync(new URL('../app/workspace/atlas-review/head-learning/page.tsx',import.meta.url),'utf8');
  assert(page.indexOf('await authorizeClinicalReview()')<page.indexOf("headTeachingDraftContext(HEAD_MANIFEST_SHA256,'lobar-clinical')"));
  assert.match(page,/if\(lobarClinicalRevision\)try\{lobarContext=await headTeachingDraftContext\(HEAD_MANIFEST_SHA256,'lobar-clinical'\)/);
  assert.match(page,/reviewNotes=\{lobarContext\?<HeadTeachingReviewNotes key=\{JSON.stringify\(lobarContext\)\} context=\{lobarContext\}/);
  assert.match(page,/id:'lobar-clinical-corrections',label:'Cerebral-lobe clinical corrections · Private notes'/);
  const route=readFileSync(new URL('../app/api/atlas-review/head-lobar-clinical/route.ts',import.meta.url),'utf8');
  assert.match(route,/runClinicalReview\(request,guarded=>getHeadTeachingDrafts\(guarded,[^\n]*'lobar-clinical'\)/);
  assert.match(route,/runClinicalReview\(request,guarded=>postHeadTeachingDraft\(guarded,[^\n]*'lobar-clinical'\)/);
  const binder=readFileSync(new URL('../scripts/bind-clinical-review.mjs',import.meta.url),'utf8');
  assert(binder.includes("'app/api/atlas-review/head-lobar-clinical/route.ts'"));
});
