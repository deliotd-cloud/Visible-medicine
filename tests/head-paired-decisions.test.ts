import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {build} from 'esbuild';
import {Miniflare,Log,LogLevel,convertV4MiniflareOptions} from 'miniflare';
import {HEAD_LINK_REVISION} from '../lib/head-atlas-links.ts';
import {HEAD_INSULA_COMPARISON_REVISION} from '../lib/head-insula-comparison-review.ts';
import {HEAD_ORBITAL_COMPARISON_REVISION} from '../lib/head-orbital-comparison-review.ts';
import {parseSavedCtBoneDecision,ctBoneDecisionContext,blankCtBoneDecision} from '../lib/head-ct-bone-decision-contract.ts';
import {PAIRED_DECISION_CONCEPTS,pairedDecisionContext,blankPairedDecision,validatePairedDecision,parseSavedPairedDecision,pairedDecisionStale,currentPairedSemanticAcceptance} from '../lib/head-paired-decision-contract.ts';
import {parseSavedHeadMriDraft} from '../lib/head-mri-review-draft-contract.ts';
import {parseSavedHeadTeachingDraft} from '../lib/head-teaching-review-contract.ts';

const clone=<T>(v:T):T=>JSON.parse(JSON.stringify(v));
const savedAt='2026-10-09T10:00:00.000Z';
test('each CT/MRI comparison has an independent exact-revision review context',async()=>{
  for(const concept of PAIRED_DECISION_CONCEPTS){
    const c=await pairedDecisionContext(HEAD_LINK_REVISION,concept);
    assert.equal(c.conceptId,concept);assert.equal(c.comparisonRevision,concept.startsWith('cortex-')?HEAD_INSULA_COMPARISON_REVISION:HEAD_ORBITAL_COMPARISON_REVISION);
    assert.equal(c.clinicalApproval,false);assert.equal(c.publicationApproval,false);assert.equal(c.patientRegistration,false);
    assert.equal(c.decisionScope,'personal-semantic-comparison-only');
    assert.deepEqual(validatePairedDecision(blankPairedDecision(c),c),blankPairedDecision(c));
  }
  for(const id of ['bone-frontal','deep-left-thalamus','limbic-left-amygdala',null,[]])await assert.rejects(pairedDecisionContext(HEAD_LINK_REVISION,id));
  await assert.rejects(pairedDecisionContext('a'.repeat(64),'cortex-left-insula'));
});
test('acceptance requires every check and explicit narrow attestation, never broad approval',async()=>{
  const c=await pairedDecisionContext(HEAD_LINK_REVISION,'cortex-left-insula'),draft=blankPairedDecision(c);
  const accepted={...draft,status:'accepted-semantic' as const,reviewer:' Reviewer ',qualification:' Radiologist ',checks:{identity:true,extent:true,comparison:true,limits:true},attested:true};
  assert.equal(validatePairedDecision(accepted,c).reviewer,'Reviewer');
  for(const patch of [{reviewer:' '},{qualification:''},{attested:false},{status:'approved'},{clinicalApproval:true},{notes:'x'.repeat(8001)},
    {checks:{...accepted.checks,extra:true}},...Object.keys(accepted.checks).map(key=>({checks:{...accepted.checks,[key]:false}}))])assert.throws(()=>validatePairedDecision({...accepted,...patch},c));
  assert.throws(()=>validatePairedDecision({...draft,attested:true},c));
  assert.throws(()=>validatePairedDecision({...draft,status:'changes-required',notes:'short'},c));
  assert.equal(validatePairedDecision({...draft,status:'changes-required',notes:'Recheck native extent.'},c).status,'changes-required');
});
test('history preserves recorded evidence and acceptance expires on source, wording or item changes',async()=>{
  const c=await pairedDecisionContext(HEAD_LINK_REVISION,'cortex-left-insula'),blank=blankPairedDecision(c);
  const event=parseSavedPairedDecision({eventSchema:'vm-paired-decision-event-1',context:c,version:1,savedAt,decision:{...blank,status:'accepted-semantic',reviewer:'Synthetic reviewer',qualification:'Test fixture only',checks:{identity:true,extent:true,comparison:true,limits:true},attested:true}});
  assert(currentPairedSemanticAcceptance(event,c));
  const correction=parseSavedPairedDecision({...event,version:2,decision:{...blank,status:'changes-required',notes:'Synthetic correction supersedes acceptance.'}});
  assert(!currentPairedSemanticAcceptance(correction,c));
  for(const edit of [
    (x:typeof event)=>{x.context.headRevision='a'.repeat(64);},
    (x:typeof event)=>{x.context.comparisonRevision='b'.repeat(64);},
    (x:typeof event)=>{x.context.checklistVersion='old-version';},
    (x:typeof event)=>{x.context.checklist[0].label='Earlier identity check';},
    (x:typeof event)=>{x.context.attestation='Earlier recorded attestation';},
    (x:typeof event)=>{x.context.conceptId='cortex-right-insula';},
  ]){const old=clone(event);edit(old);assert.deepEqual(parseSavedPairedDecision(old),old);assert(pairedDecisionStale(old,c));assert(!currentPairedSemanticAcceptance(old,c));}
  for(const patch of [{version:0},{version:2147483648},{version:1.1},{savedAt:'2026-02-30T10:00:00.000Z'},{savedAt:'2026-10-09T10:00:00Z'},
    {context:{...c,clinicalApproval:true}},{context:{...c,conceptId:'not-a-bone'}},{context:{...c,checklist:[...c.checklist].reverse()}},
    {context:{...c,extra:true}},{decision:{...event.decision,attested:false}},{eventSchema:'vm-head-mri-draft-event-1'}])assert.throws(()=>parseSavedPairedDecision({...event,...patch}));
  assert.throws(()=>parseSavedCtBoneDecision(event));assert.throws(()=>parseSavedHeadMriDraft(event));assert.throws(()=>parseSavedHeadTeachingDraft(event));
});

test('guarded internal service stores separate durable per-item decisions without granting access or publication',{timeout:120000},async()=>{
  // Test-only identity bridge and memory database. No production route, users,
  // clinical approvals, masks, entitlement or hosted storage are modified.
  const entry=`
    import {env} from 'cloudflare:workers';
    import * as route from './app/api/atlas-review/head-paired-comparisons/route';
    import * as boneRoute from './app/api/atlas-review/head-ct-bone/route';
    import {runClinicalReview} from './lib/clinical-review-server';
    import {getPairedDecisions,postPairedDecision} from './lib/head-paired-decision-api';
    import {pairedDecisionContext,blankPairedDecision} from './lib/head-paired-decision-contract';
    import {HEAD_LINK_REVISION} from './lib/head-atlas-links';
    export default {async fetch(request){
      globalThis.__reviewTestHeaders=request.headers;
      const url=new URL(request.url);
      if(url.pathname==='/fixture'){const context=await pairedDecisionContext(HEAD_LINK_REVISION,'cortex-left-insula');return Response.json({context,decision:blankPairedDecision(context)});}
      if(url.pathname==='/review')return route[request.method](request);
      if(url.pathname==='/ct-bone')return boneRoute[request.method](request);
      return runClinicalReview(request,r=>(request.method==='GET'?getPairedDecisions:postPairedDecision)(r,
        url.pathname==='/unavailable'?undefined:env.DB.withSession('first-primary'),url.pathname==='/stale'?'f'.repeat(64):HEAD_LINK_REVISION));
    }};`;
  const bundled=await build({stdin:{contents:entry,resolveDir:process.cwd(),sourcefile:'paired-decision-fixture.ts'},bundle:true,write:false,format:'esm',platform:'neutral',target:'es2022',external:['cloudflare:workers'],define:{'import.meta.env.DEV':'false'},plugins:[{name:'test-headers',setup(b){
    b.onResolve({filter:/^next\/(headers|navigation)$/},a=>({path:a.path,namespace:'fixture'}));
    b.onLoad({filter:/.*/,namespace:'fixture'},a=>({contents:a.path==='next/headers'?'export async function headers(){return globalThis.__reviewTestHeaders;}':'export function redirect(){throw Error("Unexpected redirect");}'}));
  }}]});
  const mf=new Miniflare(convertV4MiniflareOptions({modules:[{type:'ESModule',path:resolve(process.env.TEMP??'.local','paired-decision-fixture.mjs'),contents:bundled.outputFiles[0].text}],compatibilityDate:'2026-08-23',d1Databases:['DB'],log:new Log(LogLevel.NONE)}));
  try{
    const db=await mf.getD1Database('DB');
    for(const sql of [
      'CREATE TABLE users (id TEXT PRIMARY KEY,external_subject TEXT NOT NULL,roles TEXT NOT NULL)',
      'CREATE TABLE account_security_profiles (user_id TEXT PRIMARY KEY,status TEXT NOT NULL)',
      'CREATE TABLE organizations (id TEXT PRIMARY KEY,status TEXT NOT NULL,created_at TEXT NOT NULL)',
      'CREATE TABLE organization_memberships (organization_id TEXT,user_id TEXT,role TEXT,status TEXT,PRIMARY KEY(organization_id,user_id))',
      ...readFileSync('drizzle/0008_solid_infant_terrible.sql','utf8').split('--> statement-breakpoint').map(s=>s.trim()).filter(Boolean),
    ])await db.prepare(sql).run();
    await db.prepare("INSERT INTO organizations VALUES ('org-a','active','2026-01-01'),('org-b','active','2026-01-02')").run();
    for(const [id,role,org] of [['a','administrator','org-a'],['b','administrator','org-a'],['c','administrator','org-b'],['learner','learner','org-a']]){
      await db.prepare('INSERT INTO users VALUES (?,?,?)').bind('edu:'+id,'sites:'+id,role).run();
      await db.prepare("INSERT INTO account_security_profiles VALUES (?,'active')").bind('edu:'+id).run();
      await db.prepare('INSERT INTO organization_memberships VALUES (?,?,?,?)').bind(org,'edu:'+id,role==='administrator'?'owner':'learner','active').run();
    }
    const fixture=await (await mf.dispatchFetch('https://review.test/fixture')).json() as any;
    const payload={...fixture,expectedVersion:0},tokens:Record<string,string>={};
    const call=async(who:string|null='a',body?:unknown,query=body?'':'?concept=cortex-left-insula',headers:Record<string,string>={},path='/review')=>{
      const response=await mf.dispatchFetch('https://review.test'+path+query,{method:body===undefined?'GET':'POST',headers:{...(who?{'oai-authenticated-user-id':who,'oai-authenticated-user-email':who+'@test.invalid',...(tokens[who]?{'X-Clinical-Review-Context':tokens[who]}:{})}:{}),...(body===undefined?{}:{origin:'https://review.test','content-type':'application/json'}),...headers},...(body===undefined?{}:{body:JSON.stringify(body)})});
      if(who&&response.headers.has('X-Clinical-Review-Context'))tokens[who]=response.headers.get('X-Clinical-Review-Context')!;
      return response;
    };
    const rows=()=>db.prepare('SELECT * FROM atlas_personal_nested_review_events').all<any>();
    assert.equal((await call('a',payload)).status,409,'No save before history/account context');
    for(const who of [null,'unknown','learner'])for(const body of [undefined,payload])assert.equal((await call(who,body)).status,who?403:401);
    const initial=await call();assert.equal(initial.status,200);assert.match(initial.headers.get('Cache-Control')??'',/no-store/);
    assert.deepEqual((await initial.json() as any).history,[]);
    for(const [body,code,extra,query] of [
      [payload,403,{origin:'https://elsewhere.test'},''],[payload,415,{'content-type':'text/plain'},''],[payload,400,{},'?concept=cortex-left-insula'],
      [{...payload,extra:true},400,{},''],[{...payload,context:{...fixture.context,headRevision:'a'.repeat(64)}},409,{},''],
      [{...payload,context:{...fixture.context,attestation:'Changed attestation'}},409,{},''],
      [{...payload,context:{...fixture.context,clinicalApproval:true}},400,{},''],
      [{...payload,decision:{...fixture.decision,status:'accepted-semantic'}},422,{},''],
      [{...payload,expectedVersion:-1},400,{},''],[{...payload,decision:{...fixture.decision,notes:'x'.repeat(33000)}},413,{},''],
    ] as Array<[unknown,number,Record<string,string>,string]>){assert.equal((await call('a',body,query,extra)).status,code);assert.equal((await rows()).results.length,0);}
    for(const q of ['','?concept=cortex-left-insula&concept=orbit-left-globe','?concept=unknown','?concept=cortex-left-insula&before=01','?concept=cortex-left-insula&before=2147483649','?concept=cortex-left-insula&user=b'])assert.equal((await call('a',undefined,q)).status,400);
    for(const path of ['/unavailable','/stale'])assert.equal((await call('a',undefined,undefined,{},path)).status,503);
    const accepted={...payload,decision:{...fixture.decision,status:'accepted-semantic',reviewer:'Synthetic test',qualification:'Synthetic fixture',checks:{identity:true,extent:true,comparison:true,limits:true},attested:true}};
    const bone=await (await call('a',undefined,'?concept=bone-occipital',{},'/ct-bone')).json() as any;
    assert.equal((await call('a',{context:bone.context,expectedVersion:0,decision:fixture.decision},'',{},'/ct-bone')).status,201);
    assert.deepEqual((await (await call()).json() as any).history,[],'CT bone decisions cannot populate paired history');
    assert.equal((await call('a',{...payload,context:bone.context})).status,400,'CT packet rejected by paired endpoint');
    const saved=await call('a',accepted);assert.equal(saved.status,201,await saved.clone().text());
    const first=(await saved.json() as any).review;assert.equal(first.version,1);assert.equal(first.context.clinicalApproval,false);
    assert.equal((await call('a',accepted)).status,409);
    const correction={...payload,expectedVersion:1,decision:{...fixture.decision,status:'changes-required',notes:'Synthetic correction supersedes personal acceptance.'}};
    const races=await Promise.all([call('a',correction),call('a',correction)]);assert.deepEqual(races.map(r=>r.status).sort(),[201,409]);
    const history=(await (await call()).json() as any).history;assert.deepEqual(history.map((r:any)=>r.version),[2,1]);
    assert.equal(history[0].decision.status,'changes-required');assert.equal(history[1].decision.status,'accepted-semantic');
    for(const who of ['b','c'])assert.deepEqual((await (await call(who)).json() as any).history,[]);
    const ethmoid=await (await call('a',undefined,'?concept=orbit-left-globe')).json() as any;assert.deepEqual(ethmoid.history,[]);
    assert.equal((await call('a',{context:ethmoid.context,expectedVersion:0,decision:fixture.decision})).status,201,'Independent per-concept version');
    // Same authenticated user changes institution: old context cannot write.
    await db.prepare("UPDATE organization_memberships SET organization_id='org-b' WHERE user_id='edu:a'").run();
    assert.equal((await call('a',{...payload,expectedVersion:2})).status,409);
    assert.deepEqual((await (await call()).json() as any).history,[]);
    await db.prepare("UPDATE organization_memberships SET organization_id='org-a' WHERE user_id='edu:a'").run();await call();
    for(let version=2;version<22;version++)assert.equal((await call('a',{...payload,expectedVersion:version})).status,201);
    const page=await (await call()).json() as any;assert.equal(page.history.length,20);assert.equal(page.nextBefore,3);
    const boneHistory=await (await call('a',undefined,'?concept=bone-occipital',{},'/ct-bone')).json() as any;
    assert.deepEqual(boneHistory.history.map((r:any)=>r.version),[1],'paired writes never alter CT history');
    assert.deepEqual((await (await call('a',undefined,'?concept=cortex-left-insula&before=3')).json() as any).history.map((r:any)=>r.version),[2,1]);
    // Corrupt envelope must fail closed; do not silently accept a neighbouring item.
    const row=(await rows()).results.find((r:any)=>r.structure_id==='cortex-left-insula'&&r.version===22)!;
    const altered=JSON.parse(row.payload);altered.context.conceptId='orbit-left-globe';
    await db.prepare('UPDATE atlas_personal_nested_review_events SET payload=? WHERE user_id=? AND nested_key=? AND structure_id=? AND version=?').bind(JSON.stringify(altered),row.user_id,row.nested_key,row.structure_id,row.version).run();
    assert.equal((await call()).status,503);assert.equal((await call('a',{...payload,expectedVersion:22})).status,503);
  }finally{await mf.dispose();}
});

test('insula, globe and CT-bone review scopes cannot inherit each other',async()=>{
 const insula=await pairedDecisionContext(HEAD_LINK_REVISION,'cortex-left-insula'),globe=await pairedDecisionContext(HEAD_LINK_REVISION,'orbit-left-globe'),bone=await ctBoneDecisionContext(HEAD_LINK_REVISION,'bone-occipital');
 const event={eventSchema:'vm-paired-decision-event-1',context:insula,version:1,savedAt,decision:blankPairedDecision(insula)};
 assert.throws(()=>parseSavedPairedDecision({...event,context:{...insula,packetId:globe.packetId}}));
 assert.throws(()=>parseSavedPairedDecision({...event,context:{...globe,packetId:insula.packetId}}));
 assert.throws(()=>parseSavedPairedDecision({eventSchema:'vm-ct-bone-decision-event-1',context:bone,version:1,savedAt,decision:blankCtBoneDecision(bone)}));
 assert.throws(()=>parseSavedPairedDecision({...event,context:bone}));
});
