import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
import {build} from 'esbuild';
import {HEAD_LINK_REVISION} from '../lib/head-atlas-links.ts';
import {HEAD_CT_BONE_COMPARISON_REVISION} from '../lib/head-ct-bone-comparison-review.ts';
import {HEAD_CT_BONE_TEACHING_REVISION} from '../lib/head-ct-bone-teaching.ts';
import {CT_BONE_TEACHING_DECISION_CONCEPTS,ctBoneTeachingDecisionContext,blankCtBoneTeachingDecision,validateCtBoneTeachingDecision,parseSavedCtBoneTeachingDecision,ctBoneTeachingDecisionStale,currentCtBoneTeachingAcceptance} from '../lib/head-ct-bone-teaching-decision-contract.ts';
import {ctBoneTeachingSavePayload,confirmCtBoneTeachingSave,parseCtBoneTeachingHistory,CtBoneTeachingSourceChangedError} from '../lib/head-ct-bone-teaching-decision-client.ts';
import {blankCtBoneDecision,ctBoneDecisionContext,parseSavedCtBoneDecision} from '../lib/head-ct-bone-decision-contract.ts';
import {ctBoneDecisionKey} from '../lib/head-ct-bone-decision-store.ts';
import {ctBoneTeachingDecisionKey} from '../lib/head-ct-bone-teaching-decision-store.ts';
import {parseSavedHeadMriDraft} from '../lib/head-mri-review-draft-contract.ts';
import {parseSavedHeadTeachingDraft} from '../lib/head-teaching-review-contract.ts';

const clone=<T>(v:T):T=>JSON.parse(JSON.stringify(v));
const savedAt='2026-10-09T10:00:00.000Z';
test('each CT-only bone note has an independent exact teaching and comparison revision context',async()=>{
  for(const concept of CT_BONE_TEACHING_DECISION_CONCEPTS){
    const c=await ctBoneTeachingDecisionContext(HEAD_LINK_REVISION,concept);
    assert.equal(c.conceptId,concept);assert.equal(c.comparisonRevision,HEAD_CT_BONE_COMPARISON_REVISION);
    assert.equal(c.teachingRevision,HEAD_CT_BONE_TEACHING_REVISION);
    assert.equal(c.packetId,'head-ct-bone-teaching');assert.equal(c.catalogScope,'head-ct-bone-teaching');
    assert.equal(c.clinicalApproval,false);assert.equal(c.publicationApproval,false);assert.equal(c.patientRegistration,false);
    assert.equal(c.decisionScope,'personal-teaching-only');
    assert.deepEqual(validateCtBoneTeachingDecision(blankCtBoneTeachingDecision(c),c),blankCtBoneTeachingDecision(c));
  }
  for(const id of ['bone-frontal','deep-left-thalamus','limbic-left-amygdala',null,[]])await assert.rejects(ctBoneTeachingDecisionContext(HEAD_LINK_REVISION,id));
  await assert.rejects(ctBoneTeachingDecisionContext('a'.repeat(64),'bone-occipital'));
});
test('acceptance requires every check and explicit narrow attestation, never broad approval',async()=>{
  const c=await ctBoneTeachingDecisionContext(HEAD_LINK_REVISION,'bone-occipital'),draft=blankCtBoneTeachingDecision(c);
  const accepted={...draft,status:'accepted-teaching' as const,reviewer:' Reviewer ',qualification:' Self-reported radiologist ',checks:{facts:true,references:true,exercise:true,limits:true},attested:true};
  assert.equal(validateCtBoneTeachingDecision(accepted,c).reviewer,'Reviewer');
  for(const patch of [{reviewer:' '},{qualification:''},{attested:false},{status:'approved'},{clinicalApproval:true},{notes:'x'.repeat(8001)},
    {checks:{...accepted.checks,extra:true}},...Object.keys(accepted.checks).map(key=>({checks:{...accepted.checks,[key]:false}}))])assert.throws(()=>validateCtBoneTeachingDecision({...accepted,...patch},c));
  assert.throws(()=>validateCtBoneTeachingDecision({...draft,attested:true},c));
  assert.throws(()=>validateCtBoneTeachingDecision({...draft,status:'changes-required',notes:'short'},c));
  assert.equal(validateCtBoneTeachingDecision({...draft,status:'changes-required',notes:'Recheck native extent.'},c).status,'changes-required');
});
test('history preserves recorded evidence and acceptance expires on source, wording or item changes',async()=>{
  const c=await ctBoneTeachingDecisionContext(HEAD_LINK_REVISION,'bone-occipital'),blank=blankCtBoneTeachingDecision(c);
  const event=parseSavedCtBoneTeachingDecision({eventSchema:'vm-ct-bone-teaching-decision-event-1',context:c,version:1,savedAt,decision:{...blank,status:'accepted-teaching',reviewer:'Synthetic reviewer',qualification:'Test fixture only',checks:{facts:true,references:true,exercise:true,limits:true},attested:true}});
  assert(currentCtBoneTeachingAcceptance(event,c));
  const correction=parseSavedCtBoneTeachingDecision({...event,version:2,decision:{...blank,status:'changes-required',notes:'Synthetic correction supersedes acceptance.'}});
  assert(!currentCtBoneTeachingAcceptance(correction,c));
  for(const edit of [
    (x:typeof event)=>{x.context.headRevision='a'.repeat(64);},
    (x:typeof event)=>{x.context.comparisonRevision='b'.repeat(64);},
    (x:typeof event)=>{x.context.teachingRevision='c'.repeat(64);},
    (x:typeof event)=>{x.context.checklistVersion='old-version';},
    (x:typeof event)=>{x.context.checklist[0].label='Earlier identity check';},
    (x:typeof event)=>{x.context.attestation='Earlier recorded attestation';},
    (x:typeof event)=>{x.context.conceptId='bone-ethmoid';},
  ]){const old=clone(event);edit(old);assert.deepEqual(parseSavedCtBoneTeachingDecision(old),old);assert(ctBoneTeachingDecisionStale(old,c));assert(!currentCtBoneTeachingAcceptance(old,c));}
  for(const patch of [{version:0},{version:2147483648},{version:1.1},{savedAt:'2026-02-30T10:00:00.000Z'},{savedAt:'2026-10-09T10:00:00Z'},
    {context:{...c,clinicalApproval:true}},{context:{...c,teachingRevision:'stale'}},{context:{...c,conceptId:'not-a-bone'}},{context:{...c,checklist:[...c.checklist].reverse()}},
    {context:{...c,extra:true}},{decision:{...event.decision,attested:false}},{eventSchema:'vm-head-mri-draft-event-1'}])assert.throws(()=>parseSavedCtBoneTeachingDecision({...event,...patch}));
  assert.throws(()=>parseSavedHeadMriDraft(event));assert.throws(()=>parseSavedHeadTeachingDraft(event));assert.throws(()=>parseSavedCtBoneDecision(event));
});

test('client confirmation binds the exact teaching context, decision, version and history',async()=>{
  const context=await ctBoneTeachingDecisionContext(HEAD_LINK_REVISION,'bone-ethmoid');
  const decision=blankCtBoneTeachingDecision(context);
  const payload=ctBoneTeachingSavePayload(context,0,decision);
  const saved=parseSavedCtBoneTeachingDecision({eventSchema:'vm-ct-bone-teaching-decision-event-1',context,version:1,savedAt,decision});
  assert.deepEqual(confirmCtBoneTeachingSave({review:saved},context,0,decision),saved);
  assert.deepEqual(parseCtBoneTeachingHistory({context,history:[saved],nextBefore:null,scope:'private-to-signed-in-account-and-institution'},context).history,[saved]);
  assert.throws(()=>confirmCtBoneTeachingSave({review:{...saved,version:2}},context,0,decision));
  assert.throws(()=>confirmCtBoneTeachingSave({review:saved},{...context,teachingRevision:'f'.repeat(64)},0,decision));
  assert.throws(()=>parseCtBoneTeachingHistory({context,history:[saved],nextBefore:null,scope:'private-to-signed-in-account-and-institution'},{...context,teachingRevision:'f'.repeat(64)}),CtBoneTeachingSourceChangedError);
  assert.equal(payload.expectedVersion,0);
});

test('teaching API uses real in-memory SQLite with independent account, item and comparison histories',{timeout:120000},async()=>{
  // The production route supplies its separate access gate. These handlers use
  // server-derived reviewer headers and the existing append-only SQL schema.
  // Bundle the service so Node's strip-only loader can read the existing
  // review-http parameter property without changing production code.
  const bundled=await build({stdin:{contents:"export {getCtBoneTeachingDecisions,postCtBoneTeachingDecision} from './lib/head-ct-bone-teaching-decision-api.ts'",resolveDir:process.cwd(),sourcefile:'ct-bone-teaching-api-test.ts'},bundle:true,write:false,format:'esm',platform:'node',target:'es2022'});
  const {getCtBoneTeachingDecisions,postCtBoneTeachingDecision}=await import('data:text/javascript;base64,'+Buffer.from(bundled.outputFiles[0].text).toString('base64')) as typeof import('../lib/head-ct-bone-teaching-decision-api.ts');
  const db=new DatabaseSync(':memory:');
  try{
    for(const sql of readFileSync('drizzle/0008_solid_infant_terrible.sql','utf8').split('--> statement-breakpoint').map(part=>part.trim()).filter(Boolean))db.exec(sql);
    const adapter={prepare(sql:string){return {bind(...params:unknown[]){
      const statement=db.prepare(sql);
      return {
        all:async()=>({success:true,results:statement.all(...params as any[])}),
        run:async()=>({success:true,meta:{changes:Number(statement.run(...params as any[]).changes)}}),
      };
    }};}} as unknown as Pick<D1Database,'prepare'>;
    const fixtureContext=await ctBoneTeachingDecisionContext(HEAD_LINK_REVISION,'bone-occipital');
    const blank=blankCtBoneTeachingDecision(fixtureContext);
    const payload={context:fixtureContext,expectedVersion:0,decision:blank};
    const call=async(who:string|null='org-a:a',body?:unknown,query=body===undefined?'?concept=bone-occipital':'',extra:Record<string,string>={},manifest=HEAD_LINK_REVISION)=>{
      const headers=new Headers({...extra});
      if(who)headers.set('oai-authenticated-user-id',who);
      if(body!==undefined){headers.set('origin',extra.origin??'https://review.test');headers.set('content-type',extra['content-type']??'application/json');}
      const request=new Request('https://review.test/review'+query,{method:body===undefined?'GET':'POST',headers,body:body===undefined?undefined:JSON.stringify(body)});
      return body===undefined?getCtBoneTeachingDecisions(request,adapter,manifest):postCtBoneTeachingDecision(request,adapter,manifest);
    };
    const rows=()=>db.prepare('SELECT * FROM atlas_personal_nested_review_events').all() as Array<{user_id:string;nested_key:string;structure_id:string;track:string;version:number;payload:string;saved_at:string}>;
    assert.equal((await call(null)).status,401);
    assert.equal((await call(null,payload)).status,401);
    const initial=await call();assert.equal(initial.status,200);assert.match(initial.headers.get('Cache-Control')??'',/no-store/);
    assert.deepEqual((await initial.json() as any).history,[]);
    const noBody=new Request('https://review.test/review',{method:'POST',headers:{'oai-authenticated-user-id':'org-a:a',origin:'https://review.test','content-type':'application/json'}});
    assert.equal((await postCtBoneTeachingDecision(noBody,adapter,HEAD_LINK_REVISION)).status,400);
    for(const [body,code,extra,query] of [
      [payload,403,{origin:'https://elsewhere.test'},''],[payload,415,{'content-type':'text/plain'},''],
      [payload,400,{},'?concept=bone-occipital'],[{...payload,extra:true},400,{},''],
      [{...payload,context:{...fixtureContext,headRevision:'a'.repeat(64)}},409,{},''],
      [{...payload,context:{...fixtureContext,comparisonRevision:'b'.repeat(64)}},409,{},''],
      [{...payload,context:{...fixtureContext,teachingRevision:'c'.repeat(64)}},409,{},''],
      [{...payload,context:{...fixtureContext,attestation:'Changed attestation'}},409,{},''],
      [{...payload,context:{...fixtureContext,clinicalApproval:true}},400,{},''],
      [{...payload,decision:{...blank,status:'accepted-teaching'}},422,{},''],
      [{...payload,expectedVersion:-1},400,{},''],
      [{...payload,decision:{...blank,notes:'x'.repeat(33000)}},413,{},''],
    ] as Array<[unknown,number,Record<string,string>,string]>){
      assert.equal((await call('org-a:a',body,query,extra)).status,code);
      assert.equal(rows().length,0);
    }
    for(const query of ['', '?concept=bone-occipital&concept=bone-ethmoid','?concept=unknown','?concept=bone-occipital&before=01','?concept=bone-occipital&before=2147483649','?concept=bone-occipital&user=b'])
      assert.equal((await call('org-a:a',undefined,query)).status,400);
    assert.equal((await call('org-a:a',undefined,'?concept=bone-occipital',{},'f'.repeat(64))).status,503);
    const accepted={...payload,decision:{...blank,status:'accepted-teaching',reviewer:'Synthetic test',qualification:'Self-reported test fixture',checks:{facts:true,references:true,exercise:true,limits:true},attested:true}};
    const saved=await call('org-a:a',accepted);assert.equal(saved.status,201,await saved.clone().text());
    const first=(await saved.json() as any).review;assert.equal(first.version,1);assert.equal(first.context.clinicalApproval,false);
    assert.equal(first.context.teachingRevision,HEAD_CT_BONE_TEACHING_REVISION);
    assert.equal((await call('org-a:a',accepted)).status,409);
    const comparisonContext=await ctBoneDecisionContext(HEAD_LINK_REVISION,'bone-occipital');
    const comparisonEvent=parseSavedCtBoneDecision({eventSchema:'vm-ct-bone-decision-event-1',context:comparisonContext,version:1,savedAt,decision:blankCtBoneDecision(comparisonContext)});
    db.prepare('INSERT INTO atlas_personal_nested_review_events (user_id,nested_key,structure_id,track,version,payload,saved_at) VALUES (?,?,?,?,?,?,?)')
      .run(rows()[0].user_id,ctBoneDecisionKey,'bone-occipital','teaching',1,JSON.stringify(comparisonEvent),savedAt);
    assert.notEqual(ctBoneTeachingDecisionKey,ctBoneDecisionKey);
    assert.equal(rows().length,2);
    assert.deepEqual((await (await call()).json() as any).history.map((record:any)=>record.version),[1]);
    const correction={...payload,expectedVersion:1,decision:{...blank,status:'changes-required',notes:'Synthetic correction supersedes personal teaching acceptance.'}};
    const races=await Promise.all([call('org-a:a',correction),call('org-a:a',correction)]);
    assert.deepEqual(races.map(response=>response.status).sort(),[201,409]);
    const history=(await (await call()).json() as any).history;
    assert.deepEqual(history.map((record:any)=>record.version),[2,1]);
    assert.equal(history[0].decision.status,'changes-required');
    assert.equal(history[1].decision.status,'accepted-teaching');
    for(const who of ['org-a:b','org-b:a'])assert.deepEqual((await (await call(who)).json() as any).history,[]);
    const ethmoid=(await (await call('org-a:a',undefined,'?concept=bone-ethmoid')).json() as any);
    assert.deepEqual(ethmoid.history,[]);
    assert.equal((await call('org-a:a',{context:ethmoid.context,expectedVersion:0,decision:blank})).status,201);
    for(let version=2;version<22;version++)assert.equal((await call('org-a:a',{...payload,expectedVersion:version})).status,201);
    const page=await (await call()).json() as any;
    assert.equal(page.history.length,20);assert.equal(page.nextBefore,3);
    assert.deepEqual((await (await call('org-a:a',undefined,'?concept=bone-occipital&before=3')).json() as any).history.map((record:any)=>record.version),[2,1]);
    const row=rows().find(record=>record.nested_key===ctBoneTeachingDecisionKey&&record.structure_id==='bone-occipital'&&record.version===22)!;
    const altered=JSON.parse(row.payload as string);altered.context.conceptId='bone-ethmoid';
    db.prepare('UPDATE atlas_personal_nested_review_events SET payload=? WHERE user_id=? AND nested_key=? AND structure_id=? AND version=?')
      .run(JSON.stringify(altered),row.user_id,row.nested_key,row.structure_id,row.version);
    assert.equal((await call()).status,503);
    assert.equal((await call('org-a:a',{...payload,expectedVersion:22})).status,503);
  }finally{db.close();}
});
