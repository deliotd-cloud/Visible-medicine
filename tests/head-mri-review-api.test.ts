import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {build} from 'esbuild';
import {Miniflare,Log,LogLevel,convertV4MiniflareOptions} from 'miniflare';

test('MRI-only drafts use private durable history without changing original-25 notes', {timeout:120000}, async()=>{
  // Identity headers stand in for the trusted preview bridge only in this memory worker.
  const entry=`
    import * as mri from './app/api/atlas-review/head-mri-learning/route';
    import * as original from './app/api/atlas-review/head-learning/route';
    import {headMriDraftContext,blankHeadMriDraft} from './lib/head-mri-review-draft-contract';
    import {headTeachingDraftContext,blankHeadTeachingDraft} from './lib/head-teaching-review-contract';
    import {HEAD_MANIFEST_SHA256} from './lib/head-atlas-import';
    import {runClinicalReview} from './lib/clinical-review-server';
    import {getHeadMriDrafts,postHeadMriDraft} from './lib/head-mri-review-draft-api';
    import {env} from 'cloudflare:workers';
    export default {async fetch(request){
      globalThis.__reviewTestHeaders=request.headers;
      const url=new URL(request.url);
      if(url.pathname==='/__fixture'){
        const context=await headMriDraftContext(HEAD_MANIFEST_SHA256);
        const originalContext=await headTeachingDraftContext(HEAD_MANIFEST_SHA256);
        return Response.json({context,draft:blankHeadMriDraft(context),originalContext,originalDraft:blankHeadTeachingDraft(originalContext)});
      }
      if(['/api/atlas-review/head-mri-unavailable','/api/atlas-review/head-mri-stale'].includes(url.pathname)){
        return runClinicalReview(request,guarded=>(request.method==='GET'?getHeadMriDrafts:postHeadMriDraft)(guarded,
          url.pathname.endsWith('unavailable')?undefined:env.DB.withSession('first-primary'),
          url.pathname.endsWith('stale')?'f'.repeat(64):HEAD_MANIFEST_SHA256));
      }
      const route=url.pathname==='/api/atlas-review/head-mri-learning'?mri:url.pathname==='/api/atlas-review/head-learning'?original:null;
      return route?.[request.method]?.(request)??new Response('Not found',{status:404});
    }};`;
  const bundled=await build({stdin:{contents:entry,resolveDir:process.cwd(),sourcefile:'head-mri-review-fixture.ts'},bundle:true,write:false,format:'esm',platform:'neutral',target:'es2022',external:['cloudflare:workers'],define:{'import.meta.env.DEV':'false'},plugins:[{name:'test-request-headers',setup(b){
    b.onResolve({filter:/^next\/(headers|navigation)$/},args=>({path:args.path,namespace:'fixture'}));
    b.onLoad({filter:/.*/,namespace:'fixture'},args=>({contents:args.path==='next/headers'?'export async function headers(){return globalThis.__reviewTestHeaders;}':'export function redirect(){throw Error("Unexpected redirect");}'}));
  }}]});
  const mf=new Miniflare(convertV4MiniflareOptions({modules:[{type:'ESModule',path:resolve(process.env.TEMP??'.local','head-mri-review-fixture.mjs'),contents:bundled.outputFiles[0].text}],compatibilityDate:'2026-08-23',d1Databases:['DB'],log:new Log(LogLevel.NONE)}));
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
    const fixture=await mf.dispatchFetch('https://review.test/__fixture');
    assert.equal(fixture.status,200,await fixture.clone().text());
    const {context,draft,originalContext,originalDraft}=await fixture.json() as Record<string,any>;
    assert.equal(context.conceptIds.length,4);
    assert.equal(context.catalogScope,'head-mri-only-drafts');
    assert.equal(context.packetId,'head-mri-only-learning');
    assert.equal(context.patientRegistration,false);
    assert.equal(context.clinicalApproval,false);
    assert.equal(context.publicationApproval,false);
    const contexts:Record<string,string>={};
    const call=async(subject:string|null='a',payload?:unknown,search='',extra:Record<string,string>={},path='head-mri-learning')=>{
      const response=await mf.dispatchFetch('https://review.test/api/atlas-review/'+path+search,{method:payload===undefined?'GET':'POST',headers:{...(subject?{'oai-authenticated-user-id':subject,'oai-authenticated-user-email':subject+'@test.invalid',...(contexts[subject]?{'X-Clinical-Review-Context':contexts[subject]}:{})}:{}),...(payload===undefined?{}:{origin:'https://review.test','content-type':'application/json'}),...extra},...(payload===undefined?{}:{body:JSON.stringify(payload)})});
      if(subject&&response.headers.has('X-Clinical-Review-Context'))contexts[subject]=response.headers.get('X-Clinical-Review-Context')!;
      return response;
    };
    const payload={catalogScope:context.catalogScope,packetId:context.packetId,headRevision:context.headRevision,comparisonRevision:context.comparisonRevision,teachingRevision:context.teachingRevision,learningRevision:context.learningRevision,checklistVersion:context.checklistVersion,expectedVersion:0,draft};
    const rows=async()=>db.prepare('SELECT user_id,nested_key,structure_id,track,version,payload,saved_at FROM atlas_personal_nested_review_events ORDER BY version').all<any>();
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
    assert.equal(loaded.nextBefore,null);
    assert.equal(loaded.scope,'private-to-signed-in-account-and-institution');
    for(const path of ['head-mri-unavailable','head-mri-stale']){
      for(const body of [undefined,payload]){
        const response=await call('a',body,'',{},path);
        assert.equal(response.status,503,path);
        assert.match(response.headers.get('Cache-Control')??'',/private, no-store/);
        assert.equal((await rows()).results.length,0);
      }
    }
    const rejected:Array<[string,unknown,number,Record<string,string>?,string?]>=[
      ['foreign origin',payload,403,{origin:'https://attacker.test'}],
      ['wrong media type',payload,415,{'content-type':'text/plain'}],
      ['query on write',payload,400,{},'?userId=b'],
      ['wrong scope',{...payload,catalogScope:originalContext.catalogScope},400],
      ['wrong packet',{...payload,packetId:originalContext.packetId},400],
      ['stale head',{...payload,headRevision:'f'.repeat(64)},409],
      ['stale comparison',{...payload,comparisonRevision:'f'.repeat(64)},409],
      ['stale teaching',{...payload,teachingRevision:'f'.repeat(64)},409],
      ['stale learning',{...payload,learningRevision:'f'.repeat(64)},409],
      ['stale checklist',{...payload,checklistVersion:'old-checklist'},409],
      ['extra input',{...payload,userId:'edu:b'},400],
      ['approval',{...payload,draft:{...draft,status:'approved'}},422],
      ['attestation',{...payload,draft:{...draft,attested:true}},422],
      ['extra draft field',{...payload,draft:{...draft,clinicalApproval:true}},422],
      ['wrong concepts',{...payload,draft:{...draft,conceptIds:originalContext.conceptIds}},422],
      ['invalid correction',{...payload,draft:{...draft,status:'changes-required',notes:'short'}},422],
      ['invalid version',{...payload,expectedVersion:-1},400],
      ['oversize',{...payload,draft:{...draft,notes:'x'.repeat(33000)}},413],
    ];
    for(const [label,changed,status,headers={},search=''] of rejected){
      const response=await call('a',changed,search,headers);
      assert.equal(response.status,status,label+' '+await response.clone().text());
      assert.equal((await rows()).results.length,0,label+' appended history');
    }
    for(const search of ['?before=0','?before=01','?before=-1','?before=2147483649','?before=2.0','?before=2&before=1','?userId=b'])
      assert.equal((await call('a',undefined,search)).status,400,search);
    const first={...payload,draft:{...draft,notes:'Synthetic MRI-only draft, no clinical sign-off.'}};
    const saved=await call('a',first);assert.equal(saved.status,201,await saved.clone().text());
    const review=(await saved.json() as any).review;
    assert.equal(review.eventSchema,'vm-head-mri-draft-event-1');
    assert.equal(review.version,1);
    assert.deepEqual(review.context,context);
    assert.equal(review.draft.notes,first.draft.notes);
    assert.equal((await call('a',first)).status,409,'same version cannot be appended twice');
    const second={...first,expectedVersion:1,draft:{...first.draft,status:'changes-required',notes:'Synthetic correction to the MRI-only teaching facts.'}};
    const correction=await call('a',second);assert.equal(correction.status,201,await correction.clone().text());
    const after=await (await call()).json() as any;
    assert.deepEqual(after.history.map((r:any)=>r.version),[2,1]);
    assert.equal(after.history[0].draft.status,'changes-required');
    assert.equal(after.history[1].draft.status,'draft');
    assert.deepEqual(after.history[0].context,context);
    assert.equal(after.history[0].draft.attested,false);
    assert.deepEqual((await (await call('a',undefined,'?before=2')).json() as any).history.map((r:any)=>r.version),[1]);
    for(const other of ['b','c']){
      const privateHistory=await call(other);assert.equal(privateHistory.status,200);
      assert.deepEqual((await privateHistory.json() as any).history,[],other+' leaked private history');
      assert.equal((await call(other,first,'',{'X-Clinical-Review-Context':contexts.a})).status,409,'another account cannot reuse continuity');
    }
    const mriRows=(await rows()).results;
    assert.equal(mriRows.length,2);
    assert.deepEqual(JSON.parse(mriRows[0].user_id),['vm-head-mri-personal-drafts-1',JSON.stringify(['vm-website-personal-review-1','edu:a','org-a'])]);
    assert.deepEqual(JSON.parse(mriRows[0].nested_key),['vm-head-mri-drafts-1','mri']);
    assert.equal(mriRows[0].structure_id,'head-mri-only-learning');
    assert.equal(mriRows[0].track,'teaching');
    const originalPayload={catalogScope:originalContext.catalogScope,packetId:originalContext.packetId,packetRevision:originalContext.packetRevision,headRevision:originalContext.headRevision,checklistVersion:originalContext.checklistVersion,expectedVersion:0,draft:{...originalDraft,notes:'Synthetic original-25 note.'}};
    assert.equal((await call('a',undefined,'',{},'head-learning')).status,200);
    const originalSave=await call('a',originalPayload,'',{},'head-learning');assert.equal(originalSave.status,201,await originalSave.clone().text());
    const coexist=(await rows()).results;
    assert.equal(coexist.length,3);
    const oldRow=coexist.find((r:any)=>r.nested_key!==mriRows[0].nested_key);
    assert.ok(oldRow);
    assert.deepEqual(JSON.parse(oldRow.user_id),['vm-head-teaching-personal-drafts-1',JSON.stringify(['vm-website-personal-review-1','edu:a','org-a'])]);
    assert.deepEqual(JSON.parse(oldRow.nested_key),['vm-head-teaching-drafts-1','ct-mri']);
    assert.equal(oldRow.version,1);
    assert.deepEqual((await (await call('a',undefined,'',{},'head-learning')).json() as any).history.map((r:any)=>r.version),[1]);
    assert.deepEqual((await (await call()).json() as any).history.map((r:any)=>r.version),[2,1]);
    const racing={...first,expectedVersion:2,draft:{...first.draft,notes:'Synthetic competing MRI edit.'}};
    assert.deepEqual((await Promise.all([call('a',racing),call('a',racing)])).map(r=>r.status).sort(),[201,409]);
    for(let expectedVersion=3;expectedVersion<21;expectedVersion++){
      const response=await call('a',{...first,expectedVersion,draft:{...first.draft,notes:'Synthetic MRI history page '+(expectedVersion+1)}});
      assert.equal(response.status,201,await response.clone().text());
    }
    const firstPage=await (await call()).json() as any;
    assert.deepEqual(firstPage.history.map((r:any)=>r.version),Array.from({length:20},(_,index)=>21-index));
    assert.equal(firstPage.nextBefore,2);
    const secondPage=await (await call('a',undefined,'?before=2')).json() as any;
    assert.deepEqual(secondPage.history.map((r:any)=>r.version),[1]);
    assert.equal(secondPage.nextBefore,null);
    await db.prepare("UPDATE organization_memberships SET organization_id='org-b' WHERE user_id='edu:a'").run();
    assert.equal((await call('a',second)).status,409,'old institution continuity cannot append');
    assert.deepEqual((await (await call()).json() as any).history,[],'history cannot follow account into another institution');
    await db.prepare("UPDATE organization_memberships SET organization_id='org-a' WHERE user_id='edu:a'").run();
    const corrupt=JSON.stringify({...firstPage.history.at(-1),version:999});
    await db.prepare('UPDATE atlas_personal_nested_review_events SET payload=? WHERE user_id=? AND nested_key=? AND version=2')
      .bind(corrupt,mriRows[0].user_id,mriRows[0].nested_key).run();
    const blocked=await call('a',undefined,'?before=3');
    assert.equal(blocked.status,503,'corrupt stored envelope must fail closed');
    assert.match(JSON.stringify(await blocked.json()),/Storage could not be confirmed/);
    assert.equal((await call('a',{...first,expectedVersion:21})).status,503,'corrupt recent history cannot append');
    assert.equal((await rows()).results.length,22);
    assert.deepEqual((await (await call('a',undefined,'',{},'head-learning')).json() as any).history.map((r:any)=>r.version),[1],'original-25 history remains readable');
  }finally{await mf.dispose();}
});
