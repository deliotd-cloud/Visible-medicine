import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {build} from 'esbuild';
import {Miniflare,Log,LogLevel,convertV4MiniflareOptions} from 'miniflare';

for(const kind of ['anatomy','brainstem-clinical','ventricular-clinical','cerebellar-clinical','deep-grey-clinical','lobar-clinical','hippocampal-clinical','mri-only-clinical','mri-anatomy-checks'] as const)test(`${kind} drafts use the real website route, private durable history, and draft-only contract`, {timeout:120000}, async()=>{
  const routeName=kind==='anatomy'?'head-learning':`head-${kind}`;
  // These synthetic request headers stand in for the trusted preview identity
  // bridge only inside this memory worker; this fixture does not test that bridge.
  const entry=`
    import * as route from './app/api/atlas-review/${routeName}/route';
    import {headTeachingDraftContext,blankHeadTeachingDraft} from './lib/head-teaching-review-contract';
    import {HEAD_MANIFEST_SHA256} from './lib/head-atlas-import';
    export default {async fetch(request){
      globalThis.__reviewTestHeaders=request.headers;
      const url=new URL(request.url);
      if(url.pathname==='/__fixture'){
        const context=await headTeachingDraftContext(HEAD_MANIFEST_SHA256,'${kind}');
        return Response.json({context,draft:blankHeadTeachingDraft(context)});
      }
      if(url.pathname!=='/api/atlas-review/${routeName}')return new Response('Not found',{status:404});
      return route[request.method]?.(request)??new Response('Not found',{status:404});
    }};`;
  const bundled=await build({stdin:{contents:entry,resolveDir:process.cwd(),sourcefile:'head-teaching-review-fixture.ts'},bundle:true,write:false,format:'esm',platform:'neutral',target:'es2022',external:['cloudflare:workers'],define:{'import.meta.env.DEV':'false'},plugins:[{name:'test-request-headers',setup(b){
    b.onResolve({filter:/^next\/(headers|navigation)$/},args=>({path:args.path,namespace:'fixture'}));
    b.onLoad({filter:/.*/,namespace:'fixture'},args=>({contents:args.path==='next/headers'?'export async function headers(){return globalThis.__reviewTestHeaders;}':'export function redirect(){throw Error("Unexpected redirect");}'}));
  }}]});
  const mf=new Miniflare(convertV4MiniflareOptions({modules:[{type:'ESModule',path:resolve('.local/head-teaching-review-fixture.mjs'),contents:bundled.outputFiles[0].text}],compatibilityDate:'2026-08-23',d1Databases:['DB'],log:new Log(LogLevel.NONE)}));
  try{
    const db=await mf.getD1Database('DB');
    for(const sql of [
      'CREATE TABLE users (id TEXT PRIMARY KEY, external_subject TEXT NOT NULL, roles TEXT NOT NULL)',
      'CREATE TABLE account_security_profiles (user_id TEXT PRIMARY KEY, status TEXT NOT NULL)',
      'CREATE TABLE organizations (id TEXT PRIMARY KEY, status TEXT NOT NULL, created_at TEXT NOT NULL)',
      'CREATE TABLE organization_memberships (organization_id TEXT, user_id TEXT, role TEXT, status TEXT, PRIMARY KEY(organization_id,user_id))',
      ...readFileSync('drizzle/0008_solid_infant_terrible.sql','utf8').split('--> statement-breakpoint').map(s=>s.trim()).filter(Boolean),
    ])await db.prepare(sql).run();
    await db.prepare("INSERT INTO organizations VALUES ('org-a','active','2026-01-01'),('org-b','active','2026-01-02')").run();
    for(const [subject,roles,member,org] of [['a','administrator','owner','org-a'],['b','administrator','owner','org-a'],['c','administrator','administrator','org-b'],['instructor','instructor','educator','org-a'],['learner','learner','learner','org-a'],['admin-no-membership','administrator','learner','org-a']]){
      await db.prepare('INSERT INTO users VALUES (?,?,?)').bind('edu:'+subject,'sites:'+subject,roles).run();
      await db.prepare('INSERT INTO account_security_profiles VALUES (?,?)').bind('edu:'+subject,'active').run();
      await db.prepare('INSERT INTO organization_memberships VALUES (?,?,?,?)').bind(org,'edu:'+subject,member,'active').run();
    }
    const fixtureResponse=await mf.dispatchFetch('https://review.test/__fixture');
    assert.equal(fixtureResponse.status,200,await fixtureResponse.clone().text());
    const {context,draft}=await fixtureResponse.json() as {context:any;draft:any};
    assert.equal(context.patientRegistration,false);
    assert.equal(context.clinicalApproval,false);
    assert.equal(context.publicationApproval,false);
    assert.equal(context.conceptIds.length,kind==='anatomy'?25:kind==='hippocampal-clinical'||kind==='mri-only-clinical'?2:kind==='ventricular-clinical'||kind==='mri-anatomy-checks'?4:kind==='deep-grey-clinical'||kind==='lobar-clinical'?8:3);
    assert.equal(context.checklistVersion,kind==='anatomy'?'head-teaching-draft-review-2':`head-${kind}-draft-review-1`);
    const contexts:Record<string,string>={};
    const call=async(subject:string|null='a',payload?:unknown,search='',extra:Record<string,string>={})=>{
      const response=await mf.dispatchFetch('https://review.test/api/atlas-review/'+routeName+search,{method:payload===undefined?'GET':'POST',headers:{...(subject?{'oai-authenticated-user-id':subject,'oai-authenticated-user-email':subject+'@test.invalid',...(contexts[subject]?{'X-Clinical-Review-Context':contexts[subject]}:{})}:{}),...(payload===undefined?{}:{origin:'https://review.test','content-type':'application/json'}),...extra},...(payload===undefined?{}:{body:JSON.stringify(payload)})});
      if(subject&&response.headers.has('X-Clinical-Review-Context'))contexts[subject]=response.headers.get('X-Clinical-Review-Context')!;
      return response;
    };
    const payload={catalogScope:context.catalogScope,packetId:context.packetId,packetRevision:context.packetRevision,headRevision:context.headRevision,checklistVersion:context.checklistVersion,expectedVersion:0,draft};
    const count=async()=>Number((await db.prepare('SELECT COUNT(*) AS n FROM atlas_personal_nested_review_events').first<{n:number}>())?.n);
    assert.equal((await call('a',payload)).status,409,'POST requires loaded account and institution continuity');
    for(const who of [null,'unknown','instructor','learner','admin-no-membership']){
      assert.equal((await call(who)).status,who?403:401,String(who));
      assert.equal((await call(who,payload)).status,who?403:401,String(who));
    }
    const initial=await call();assert.equal(initial.status,200,await initial.clone().text());
    assert.match(initial.headers.get('Cache-Control')??'',/no-store/);
    const loaded=await initial.json() as any;
    assert.deepEqual(loaded.context,context);
    assert.deepEqual(loaded.history,[]);
    assert.equal(loaded.scope,'private-to-signed-in-account-and-institution');
    assert.equal(await count(),0);
    for(const [label,changed,headers,search] of [
      ['foreign origin',payload,{origin:'https://attacker.test'},''],
      ['wrong media type',payload,{'content-type':'text/plain'},''],
      ['query on write',payload,{},'?userId=b'],
      ['stale packet',{...payload,packetRevision:'f'.repeat(64)},{},''],
      ['stale head',{...payload,headRevision:'f'.repeat(64)},{},''],
      ['stale checklist',{...payload,checklistVersion:'old-checklist'},{},''],
      ['unknown input',{...payload,userId:'edu:b'},{},''],
      ['approval',{...payload,draft:{...draft,status:'approved'}},{},''],
      ['attestation',{...payload,draft:{...draft,attested:true}},{},''],
      ['extra draft field',{...payload,draft:{...draft,clinicalApproval:true}},{},''],
      ['oversize',{...payload,draft:{...draft,notes:'x'.repeat(33000)}},{},''],
    ] as Array<[string,unknown,Record<string,string>,string]>){
      const rejected=await call('a',changed,search,headers);
      assert.ok(rejected.status>=400,label+' '+rejected.status+' '+await rejected.clone().text());
      assert.equal(await count(),0,label+' appended history');
    }
    assert.equal((await call('a',undefined,'?before=0')).status,400);
    assert.equal((await call('a',undefined,'?before=01')).status,400);
    assert.equal((await call('a',undefined,'?userId=b')).status,400);
    const first={...payload,draft:{...draft,notes:'Synthetic draft persistence; no clinical sign-off.'}};
    const saved=await call('a',first);assert.equal(saved.status,201,await saved.clone().text());
    assert.equal(await count(),1);
    assert.equal((await call('a',first)).status,409,'two tabs cannot append the same version');
    const second={...first,expectedVersion:1,draft:{...first.draft,status:'changes-required',notes:'Synthetic correction request for teaching text.'}};
    const correction=await call('a',second);assert.equal(correction.status,201,await correction.clone().text());
    assert.equal(await count(),2);
    const after=await (await call()).json() as any;
    assert.deepEqual(after.history.map((r:any)=>r.version),[2,1]);
    assert.equal(after.history[0].draft.status,'changes-required');
    assert.equal(after.history[1].draft.status,'draft');
    assert.deepEqual(after.history[0].context,context);
    assert.equal(after.history[0].draft.attested,false);
    const older=await call('a',undefined,'?before=2');assert.equal(older.status,200,await older.clone().text());
    assert.deepEqual((await older.json() as any).history.map((r:any)=>r.version),[1]);
    for(const other of ['b','c']){
      const privateHistory=await call(other);
      assert.equal(privateHistory.status,200);
      assert.deepEqual((await privateHistory.json() as any).history,[],other+' leaked private history');
      assert.equal((await call(other,first,'',{'X-Clinical-Review-Context':contexts.a})).status,409,'another account cannot reuse continuity');
    }
    const row=await db.prepare('SELECT user_id,nested_key,structure_id,track FROM atlas_personal_nested_review_events LIMIT 1').first<{user_id:string;nested_key:string;structure_id:string;track:string}>();
    assert.deepEqual(JSON.parse(row!.user_id),[kind==='anatomy'?'vm-head-teaching-personal-drafts-1':`vm-head-${kind}-personal-drafts-1`,JSON.stringify(['vm-website-personal-review-1','edu:a','org-a'])]);
    assert.notEqual(row!.track,'geometry');
    const racing={...first,expectedVersion:2,draft:{...first.draft,notes:'Synthetic competing edit.'}};
    const race=await Promise.all([call('a',racing),call('a',racing)]);
    assert.deepEqual(race.map(response=>response.status).sort(),[201,409],'atomic compare insert admits one tab');
    for(let expectedVersion=3;expectedVersion<21;expectedVersion++){
      const response=await call('a',{...first,expectedVersion,draft:{...first.draft,notes:'Synthetic history page '+(expectedVersion+1)}});
      assert.equal(response.status,201,await response.clone().text());
    }
    const firstPage=await (await call()).json() as any;
    assert.deepEqual(firstPage.history.map((r:any)=>r.version),Array.from({length:20},(_,index)=>21-index));
    assert.equal(firstPage.nextBefore,2);
    const secondPage=await (await call('a',undefined,'?before=2')).json() as any;
    assert.deepEqual(secondPage.history.map((r:any)=>r.version),[1]);
    assert.equal(secondPage.nextBefore,null);
    for(const cursor of ['2147483649','-1','2.0','2&before=1'])assert.equal((await call('a',undefined,'?before='+cursor)).status,400,cursor);
    await db.prepare("UPDATE organization_memberships SET organization_id='org-b' WHERE user_id='edu:a'").run();
    assert.equal((await call('a',second)).status,409,'old institution continuity cannot append');
    assert.deepEqual((await (await call()).json() as any).history,[],'private records do not move with account');
    assert.equal(await count(),21);
    await db.prepare("UPDATE organization_memberships SET organization_id='org-a' WHERE user_id='edu:a'").run();
    const corrupt=JSON.stringify({...firstPage.history.at(-1),version:999});
    await db.prepare('UPDATE atlas_personal_nested_review_events SET payload=? WHERE user_id=? AND nested_key=? AND version=2')
      .bind(corrupt,row!.user_id,row!.nested_key).run();
    const blocked=await call('a',undefined,'?before=3');
    assert.equal(blocked.status,503,'corrupt stored envelope must not be silently accepted');
    assert.match(JSON.stringify(await blocked.json()),/Storage could not be confirmed/);
  }finally{await mf.dispose();}
});
