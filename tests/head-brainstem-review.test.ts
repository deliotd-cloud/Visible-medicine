import assert from 'node:assert/strict';
import test from 'node:test';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
import {readFileSync} from 'node:fs';
import {build} from 'esbuild';
import {Miniflare,Log,LogLevel,convertV4MiniflareOptions} from 'miniflare';
import {HEAD_LINK_REVISION} from '../lib/head-atlas-links.ts';
import {BRAINSTEM_CLINICAL_REVISION,brainstemClinicalPacket} from '../lib/head-brainstem-clinical.ts';
import {headTeachingDraftContext,blankHeadTeachingDraft,parseSavedHeadTeachingDraft,headTeachingDraftStale} from '../lib/head-teaching-review-contract.ts';

const digest=(value:unknown)=>createHash('sha256').update(JSON.stringify(value)).digest('hex');

test('clinical context binds the exact independent packet and preserves anatomy history',async()=>{
  const clinical=await headTeachingDraftContext(HEAD_LINK_REVISION,'brainstem-clinical');
  const anatomy=await headTeachingDraftContext(HEAD_LINK_REVISION);
  assert.equal(digest(brainstemClinicalPacket()),BRAINSTEM_CLINICAL_REVISION);
  assert.equal(clinical.packetRevision,BRAINSTEM_CLINICAL_REVISION);
  assert.equal(clinical.catalogScope,'head-brainstem-clinical-drafts');
  assert.equal(clinical.packetId,'head-brainstem-clinical');
  assert.deepEqual(clinical.conceptIds,['brainstem-midbrain','brainstem-pons','brainstem-medulla']);
  assert.equal(clinical.checklist.length,4);
  assert.deepEqual(clinical.checklist.map(item=>item.label),brainstemClinicalPacket().content.reviewChecks);
  assert.equal(clinical.clinicalApproval,false);
  assert.equal(clinical.publicationApproval,false);
  assert.equal(clinical.patientRegistration,false);
  assert.equal(anatomy.conceptIds.length,25);
  const event={eventSchema:'vm-head-teaching-draft-event-1' as const,context:clinical,version:1,savedAt:'2026-10-11T12:00:00.000Z',draft:blankHeadTeachingDraft(clinical)};
  assert.deepEqual(parseSavedHeadTeachingDraft(event),event);
  assert.equal(headTeachingDraftStale(event,clinical),false);
  assert.equal(headTeachingDraftStale(event,anatomy),true);
  assert.equal(headTeachingDraftStale({...event,context:{...clinical,packetRevision:'a'.repeat(64)}},clinical),true);
  for(const context of [
    {...clinical,catalogScope:anatomy.catalogScope},
    {...clinical,packetId:anatomy.packetId},
    {...clinical,conceptIds:[...clinical.conceptIds,'ventricle-third']},
    {...clinical,checklist:[...clinical.checklist,{id:'approval',label:'Approve'}]},
  ])assert.throws(()=>parseSavedHeadTeachingDraft({...event,context}));
  await assert.rejects(headTeachingDraftContext('0'.repeat(64),'brainstem-clinical'));
  const mutable=brainstemClinicalPacket().content as unknown as {notes:{text:string}[]};
  const original=mutable.notes[0].text;
  try{mutable.notes[0].text=original+' temporary hash probe';await assert.rejects(headTeachingDraftContext(HEAD_LINK_REVISION,'brainstem-clinical'),/hash/);}
  finally{mutable.notes[0].text=original;}
});

test('API keeps clinical and anatomy drafts private, isolated, and compare-and-swap guarded', {timeout:60000},async()=>{
  const entry=`
    import {getHeadTeachingDrafts,postHeadTeachingDraft} from './lib/head-teaching-review-api';
    import {headTeachingDraftContext,blankHeadTeachingDraft} from './lib/head-teaching-review-contract';
    import {HEAD_LINK_REVISION} from './lib/head-atlas-links';
    export default {async fetch(request,env){
      const url=new URL(request.url);
      if(url.pathname==='/fixture'){
        const kind=url.searchParams.get('kind')==='clinical'?'brainstem-clinical':'anatomy';
        const context=await headTeachingDraftContext(HEAD_LINK_REVISION,kind);
        return Response.json({context,draft:blankHeadTeachingDraft(context)});
      }
      const kind=url.pathname==='/clinical'?'brainstem-clinical':'anatomy';
      return request.method==='POST'
        ?postHeadTeachingDraft(request,env.DB,HEAD_LINK_REVISION,kind)
        :getHeadTeachingDrafts(request,env.DB,HEAD_LINK_REVISION,kind);
    }};`;
  const bundled=await build({stdin:{contents:entry,resolveDir:process.cwd(),sourcefile:'brainstem-review-fixture.ts'},bundle:true,write:false,format:'esm',platform:'neutral',target:'es2022'});
  const mf=new Miniflare(convertV4MiniflareOptions({modules:[{type:'ESModule',path:resolve('.local/brainstem-review-fixture.mjs'),contents:bundled.outputFiles[0].text}],compatibilityDate:'2026-08-23',d1Databases:['DB'],log:new Log(LogLevel.NONE)}));
  try{
    const db=await mf.getD1Database('DB');
    for(const sql of readFileSync('drizzle/0008_solid_infant_terrible.sql','utf8').split('--> statement-breakpoint').map(value=>value.trim()).filter(Boolean))await db.prepare(sql).run();
    const fixture=async(kind:'clinical'|'anatomy')=>(await (await mf.dispatchFetch('https://review.test/fixture?kind='+kind)).json()) as any;
    const clinical=await fixture('clinical'),anatomy=await fixture('anatomy');
    const call=(path:string,user:string|null,payload?:unknown,search='')=>mf.dispatchFetch('https://review.test/'+path+search,{method:payload===undefined?'GET':'POST',headers:{...(user?{'oai-authenticated-user-id':user}:{}),...(payload===undefined?{}:{origin:'https://review.test','content-type':'application/json'})},...(payload===undefined?{}:{body:JSON.stringify(payload)})});
    const body=(item:any)=>({catalogScope:item.context.catalogScope,packetId:item.context.packetId,packetRevision:item.context.packetRevision,headRevision:item.context.headRevision,checklistVersion:item.context.checklistVersion,expectedVersion:0,draft:item.draft});
    assert.equal((await call('clinical',null)).status,401);
    assert.equal((await call('clinical',null,body(clinical))).status,401);
    assert.equal((await call('clinical','alice',body(anatomy))).status,400);
    assert.equal((await call('anatomy','alice',body(clinical))).status,400);
    assert.equal((await call('clinical','alice',{...body(clinical),packetRevision:'f'.repeat(64)})).status,409);
    assert.equal((await call('clinical','alice',{...body(clinical),draft:{...clinical.draft,attested:true}})).status,422);
    const first=await call('clinical','alice',body(clinical));assert.equal(first.status,201,await first.clone().text());
    assert.match(first.headers.get('Cache-Control')??'',/private, no-store/);
    assert.equal((await call('clinical','alice',body(clinical))).status,409);
    assert.equal((await call('anatomy','alice',body(anatomy))).status,201);
    const second={...body(clinical),expectedVersion:1,draft:{...clinical.draft,status:'changes-required',notes:'Please correct this synthetic clinical note.'}};
    assert.equal((await call('clinical','alice',second)).status,201);
    const race=await Promise.all([call('clinical','alice',{...second,expectedVersion:2}),call('clinical','alice',{...second,expectedVersion:2})]);
    assert.deepEqual(race.map(response=>response.status).sort(),[201,409]);
    const history=await call('clinical','alice');assert.equal(history.status,200);
    assert.match(history.headers.get('Cache-Control')??'',/private, no-store/);
    assert.deepEqual(((await history.json()) as any).history.map((saved:any)=>saved.version),[3,2,1]);
    assert.deepEqual(((await (await call('clinical','alice',undefined,'?before=2')).json()) as any).history.map((saved:any)=>saved.version),[1]);
    assert.deepEqual(((await (await call('anatomy','alice')).json()) as any).history.map((saved:any)=>saved.version),[1]);
    assert.deepEqual(((await (await call('clinical','bob')).json()) as any).history,[]);
    const rows=(await db.prepare('SELECT user_id,nested_key,structure_id,track FROM atlas_personal_nested_review_events').all<any>()).results;
    assert.equal(rows.length,4);
    assert.equal(new Set(rows.map(row=>row.nested_key)).size,2);
    assert.equal(new Set(rows.map(row=>row.user_id)).size,2);
    assert.equal(new Set(rows.map(row=>row.structure_id)).size,2);
    assert.deepEqual([...new Set(rows.map(row=>row.track))],['teaching'],'both packets use the existing constrained teaching track; keys and structures isolate them');
    const clinicalRow=rows.find(row=>row.structure_id==='head-brainstem-clinical');assert(clinicalRow);
    await db.prepare('UPDATE atlas_personal_nested_review_events SET payload=? WHERE user_id=? AND nested_key=? AND version=1')
      .bind(JSON.stringify({...((await (await call('anatomy','alice')).json()) as any).history[0],version:1}),clinicalRow.user_id,clinicalRow.nested_key).run();
    assert.equal((await call('clinical','alice',undefined,'?before=2')).status,503,'cross-packet stored record must fail closed');
  }finally{await mf.dispose();}
});
