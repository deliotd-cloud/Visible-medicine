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
import {VENTRICULAR_CLINICAL_REVISION,ventricularClinicalPacket} from '../lib/head-ventricular-clinical.ts';
import {headTeachingDraftContext,blankHeadTeachingDraft,parseSavedHeadTeachingDraft,headTeachingDraftStale} from '../lib/head-teaching-review-contract.ts';
import * as contract from '../lib/head-teaching-review-contract.ts';
import * as client from '../lib/head-teaching-review-client.ts';
import * as workingCopy from '../lib/head-review-working-copy.ts';

const require=createRequire(import.meta.url);
const digest=(value:unknown)=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
const ventricularIds=['ventricle-left-lateral','ventricle-right-lateral','ventricle-third','ventricle-fourth'];

test('ventricular draft context binds exactly the current independent packet and four concepts',async()=>{
  const ventricular=await headTeachingDraftContext(HEAD_LINK_REVISION,'ventricular-clinical');
  const anatomy=await headTeachingDraftContext(HEAD_LINK_REVISION);
  const brainstem=await headTeachingDraftContext(HEAD_LINK_REVISION,'brainstem-clinical');
  assert.equal(digest(ventricularClinicalPacket()),VENTRICULAR_CLINICAL_REVISION);
  assert.equal(ventricular.packetRevision,VENTRICULAR_CLINICAL_REVISION);
  assert.equal(ventricular.catalogScope,'head-ventricular-clinical-drafts');
  assert.equal(ventricular.packetId,'head-ventricular-clinical');
  assert.deepEqual(ventricular.conceptIds,ventricularIds);
  assert.deepEqual(ventricular.checklist.map(check=>check.label),ventricularClinicalPacket().content.reviewChecks);
  assert.equal(ventricular.checklist.length,4);
  for(const flag of ['patientRegistration','clinicalApproval','publicationApproval'] as const)assert.equal(ventricular[flag],false);
  assert.notEqual(ventricular.packetRevision,anatomy.packetRevision);
  assert.notEqual(ventricular.packetRevision,brainstem.packetRevision);
  const event={eventSchema:'vm-head-teaching-draft-event-1' as const,context:ventricular,version:1,savedAt:'2026-10-11T12:00:00.000Z',draft:blankHeadTeachingDraft(ventricular)};
  assert.deepEqual(parseSavedHeadTeachingDraft(event),event);
  assert.equal(headTeachingDraftStale(event,ventricular),false);
  assert.equal(headTeachingDraftStale(event,anatomy),true);
  assert.equal(headTeachingDraftStale(event,brainstem),true);
  assert.equal(headTeachingDraftStale({...event,context:{...ventricular,packetRevision:'a'.repeat(64)}},ventricular),true);
  for(const context of [
    {...ventricular,catalogScope:brainstem.catalogScope},
    {...ventricular,packetId:anatomy.packetId},
    {...ventricular,conceptIds:[...ventricularIds,'brainstem-pons']},
    {...ventricular,conceptIds:ventricularIds.slice(0,3)},
    {...ventricular,conceptIds:[ventricularIds[0],ventricularIds[0],...ventricularIds.slice(2)]},
    {...ventricular,checklist:[...ventricular.checklist,{id:'approval',label:'Approve'}]},
  ])assert.throws(()=>parseSavedHeadTeachingDraft({...event,context}));
  await assert.rejects(headTeachingDraftContext('0'.repeat(64),'ventricular-clinical'));
  const mutable=ventricularClinicalPacket().content as unknown as {notes:{text:string}[]};
  const original=mutable.notes[0].text;
  try{
    mutable.notes[0].text=original+' temporary hash probe';
    await assert.rejects(headTeachingDraftContext(HEAD_LINK_REVISION,'ventricular-clinical'),/hash/);
  }finally{mutable.notes[0].text=original;}
});

test('ventricular, brainstem and anatomy drafts have separate real-schema histories', {timeout:60000},async()=>{
  const entry=`
    import {getHeadTeachingDrafts,postHeadTeachingDraft} from './lib/head-teaching-review-api';
    import {headTeachingDraftContext,blankHeadTeachingDraft} from './lib/head-teaching-review-contract';
    import {HEAD_LINK_REVISION} from './lib/head-atlas-links';
    export default {async fetch(request,env){
      const url=new URL(request.url);
      const kind=url.pathname==='/ventricular'?'ventricular-clinical':url.pathname==='/brainstem'?'brainstem-clinical':'anatomy';
      if(url.pathname==='/fixture'){
        const selected=url.searchParams.get('kind');
        const context=await headTeachingDraftContext(HEAD_LINK_REVISION,selected);
        return Response.json({context,draft:blankHeadTeachingDraft(context)});
      }
      return request.method==='POST'
        ?postHeadTeachingDraft(request,env.DB,HEAD_LINK_REVISION,kind)
        :getHeadTeachingDrafts(request,env.DB,HEAD_LINK_REVISION,kind);
    }};`;
  const bundled=await build({stdin:{contents:entry,resolveDir:process.cwd(),sourcefile:'ventricular-review-fixture.ts'},bundle:true,write:false,format:'esm',platform:'neutral',target:'es2022'});
  const mf=new Miniflare(convertV4MiniflareOptions({modules:[{type:'ESModule',path:resolve('.local/ventricular-review-fixture.mjs'),contents:bundled.outputFiles[0].text}],compatibilityDate:'2026-08-23',d1Databases:['DB'],log:new Log(LogLevel.NONE)}));
  try{
    const db=await mf.getD1Database('DB');
    for(const sql of readFileSync('drizzle/0008_solid_infant_terrible.sql','utf8').split('--> statement-breakpoint').map(value=>value.trim()).filter(Boolean))await db.prepare(sql).run();
    const fixture=async(kind:string)=>(await (await mf.dispatchFetch('https://review.test/fixture?kind='+kind)).json()) as any;
    const ventricular=await fixture('ventricular-clinical'),brainstem=await fixture('brainstem-clinical'),anatomy=await fixture('anatomy');
    const body=(value:any)=>({catalogScope:value.context.catalogScope,packetId:value.context.packetId,packetRevision:value.context.packetRevision,headRevision:value.context.headRevision,checklistVersion:value.context.checklistVersion,expectedVersion:0,draft:value.draft});
    const call=(path:string,user:string,payload?:unknown)=>mf.dispatchFetch('https://review.test/'+path,{method:payload===undefined?'GET':'POST',headers:{'oai-authenticated-user-id':user,...(payload===undefined?{}:{origin:'https://review.test','content-type':'application/json'})},...(payload===undefined?{}:{body:JSON.stringify(payload)})});
    assert.equal((await call('ventricular','alice',body(anatomy))).status,400);
    assert.equal((await call('ventricular','alice',body(brainstem))).status,400);
    assert.equal((await call('anatomy','alice',body(ventricular))).status,400);
    assert.equal((await call('brainstem','alice',body(ventricular))).status,400);
    assert.equal((await call('ventricular','alice',{...body(ventricular),packetRevision:'f'.repeat(64)})).status,409);
    for(const [path,value] of [['anatomy',anatomy],['brainstem',brainstem],['ventricular',ventricular]] as const){
      const saved=await call(path,'alice',body(value));
      assert.equal(saved.status,201,path+' '+await saved.clone().text());
    }
    assert.equal((await call('ventricular','alice',body(ventricular))).status,409,'a stale version cannot overwrite the ventricular draft');
    for(const path of ['anatomy','brainstem','ventricular']){
      const history=await (await call(path,'alice')).json() as any;
      assert.deepEqual(history.history.map((record:any)=>record.version),[1]);
      assert.equal(history.context.packetId,path==='anatomy'?'head-learning-anatomy':`head-${path}-clinical`);
      assert.deepEqual((await (await call(path,'bob')).json() as any).history,[]);
    }
    const rows=(await db.prepare('SELECT user_id,nested_key,structure_id,track FROM atlas_personal_nested_review_events').all<any>()).results;
    assert.equal(rows.length,3);
    assert.equal(new Set(rows.map(row=>row.user_id)).size,3);
    assert.equal(new Set(rows.map(row=>row.nested_key)).size,3);
    assert.equal(new Set(rows.map(row=>row.structure_id)).size,3);
    assert.deepEqual([...new Set(rows.map(row=>row.track))],['teaching']);
    const ventricularRow=rows.find(row=>row.structure_id==='head-ventricular-clinical');assert(ventricularRow);
    const anatomyHistory=await (await call('anatomy','alice')).json() as any;
    await db.prepare('UPDATE atlas_personal_nested_review_events SET payload=? WHERE user_id=? AND nested_key=? AND version=1')
      .bind(JSON.stringify(anatomyHistory.history[0]),ventricularRow.user_id,ventricularRow.nested_key).run();
    assert.equal((await call('ventricular','alice')).status,503,'a cross-packet stored event must fail closed');
    assert.equal((await call('anatomy','alice')).status,200,'other packet history remains available');
  }finally{await mf.dispose();}
});

test('ventricular notes render distinct private corrections and export a distinct unsaved copy',async()=>{
  const ventricular=await headTeachingDraftContext(HEAD_LINK_REVISION,'ventricular-clinical');
  const anatomy=await headTeachingDraftContext(HEAD_LINK_REVISION);
  const brainstem=await headTeachingDraftContext(HEAD_LINK_REVISION,'brainstem-clinical');
  const source=readFileSync(new URL('../components/HeadTeachingReviewNotes.tsx',import.meta.url),'utf8');
  const compiled=ts.transpileModule(source,{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS}}).outputText;
  const mod={exports:{} as {HeadTeachingReviewNotes:React.ComponentType<any>}};
  const load=(id:string)=>id==='../lib/head-review-working-copy'?workingCopy:id==='../lib/head-teaching-review-contract'?contract:id==='../lib/head-teaching-review-client'?client:id==='../lib/clinical-review-fetch'?{clinicalReviewFetch(){throw Error('SSR must not fetch');}}:id==='./GroupedReviewConfirmation'?groupedReviewConfirmation:id==='../lib/review-draft-autosave'?require('../lib/review-draft-autosave.ts'):id.endsWith('.css')?{}:require(id);
  new Function('require','module','exports',compiled)(load,mod,mod.exports);
  const Component=mod.exports.HeadTeachingReviewNotes;
  const html=renderToStaticMarkup(React.createElement(React.Fragment,null,
    React.createElement(Component,{context:anatomy}),React.createElement(Component,{context:brainstem}),React.createElement(Component,{context:ventricular})));
  assert.equal((html.match(/id="head-review-notes-title"/g)||[]).length,1);
  assert.equal((html.match(/id="brainstem-clinical-notes-title"/g)||[]).length,1);
  assert.equal((html.match(/id="ventricular-clinical-notes-title"/g)||[]).length,1);
  assert.match(html,/Private ventricular clinical notes &amp; corrections/);
  const ventricularHtml=renderToStaticMarkup(React.createElement(Component,{context:ventricular}));
  assert.match(ventricularHtml,/Clinical packet · lateral, third and fourth ventricles/);
  assert.match(ventricularHtml,/Do not enter patient data/);
  assert.match(ventricularHtml,/Download working copy/);
  assert(ventricularHtml.includes(VENTRICULAR_CLINICAL_REVISION.slice(0,12)));
  for(const check of ventricular.checklist)assert(ventricularHtml.includes(check.label.replaceAll('&','&amp;')));
  const draft=blankHeadTeachingDraft(ventricular);
  const exported=workingCopy.headTeachingWorkingCopy(ventricular,draft,{baseVersion:null,unsavedChanges:true,saveUncertain:false,reloadRequired:false},'2026-10-11T12:00:00.000Z');
  assert.equal(exported.kind,'head-ventricular-clinical');
  assert.deepEqual(exported.context,ventricular);
  for(const flag of ['serverSaveConfirmed','clinicalApproval','publicationApproval','patientRegistration'] as const)assert.equal(exported[flag],false);
});
