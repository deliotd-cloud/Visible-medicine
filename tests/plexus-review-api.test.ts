import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { build } from 'esbuild';
import { Miniflare, Log, LogLevel, convertV4MiniflareOptions } from 'miniflare';
import { blankPlexusReview, parseSavedPlexusReview, plexusReviewStale } from '../lib/plexus-review-decisions.ts';
import { plexusSpecimenKey } from '../lib/plexus-review-store.ts';
import type { PlexusReviewContext } from '../lib/plexus-review-contract.ts';

const context = (JSON.parse(readFileSync('lib/plexus-review-manifest.json','utf8')) as {context:PlexusReviewContext}).context;
const endpoint = 'https://review.test/api/atlas-review/plexus-review';

test('schematic decisions retain recorded context and separate track revisions', () => {
  const draft = blankPlexusReview(context,'topology');
  const saved = parseSavedPlexusReview({...draft,eventSchema:'vm-plexus-schematic-review-event-1',context,
    track:'topology',version:1,savedAt:'2026-10-04T12:00:00.000Z',reviewedAt:null,
    revisionHash:context.revisions.topology});
  assert.equal(plexusReviewStale(saved,context),false);
  assert.equal(plexusReviewStale(saved,{...context,materialHash:'f'.repeat(64),presentationHash:'f'.repeat(64),
    revisions:{...context.revisions,presentation:'f'.repeat(64)}}),false);
  const future={...context,sourceCommit:'f'.repeat(40),materialHash:'e'.repeat(64),
    presentationHash:'f'.repeat(64),revisions:{...context.revisions,presentation:'f'.repeat(64)}};
  assert.equal(parseSavedPlexusReview(saved).version,1,'recorded context remains readable after later packet changes');
  assert.equal(plexusReviewStale(saved,future),false,'renderer-only revision preserves topology review');
  assert.equal(plexusReviewStale(saved,{...future,checklistVersion:'original-plexus-review-2'}),true);
  assert.equal(plexusReviewStale(saved,{...context,topologyHash:'f'.repeat(64),revisions:{...context.revisions,topology:'f'.repeat(64)}}),true);
  assert.throws(() => parseSavedPlexusReview({...saved,context:{...context,frame:{kind:'imaging',units:'mm',patientRegistration:true}}}));
});

test('stale schematic packet is refused before review storage access', async () => {
  const bundle = await build({entryPoints:['lib/plexus-review-api.ts'],bundle:true,write:false,
    format:'esm',platform:'neutral',target:'es2022'});
  const {postPlexusReview} = await import('data:text/javascript;base64,'+
    Buffer.from(bundle.outputFiles[0].text).toString('base64'));
  let touched=false;
  const db = new Proxy(Object.create(null) as Pick<D1Database,'prepare'>, {
    get(){ touched=true; throw Error('Review storage must not be touched'); },
  });
  const draft=blankPlexusReview(context,'topology');
  const request=new Request(endpoint,{method:'POST',headers:{'oai-authenticated-user-id':'server-derived',
    origin:'https://review.test','content-type':'application/json'},body:JSON.stringify({catalogScope:context.catalogScope,
      candidateId:context.candidateId,frame:context.frame,sourceCommit:context.sourceCommit,
      track:'topology',materialHash:context.materialHash,revisionHash:'f'.repeat(64),
      checklistVersion:context.checklistVersion,expectedVersion:0,draft})});
  assert.equal((await postPlexusReview(request,db)).status,409);
  assert.equal(touched,false);
});

test('actual schematic route: auth, input gates, isolation, append race and corrupt envelope', {timeout:120000}, async () => {
  const entry = `
    import * as plexus from './app/api/atlas-review/plexus-review/route';
    import * as overview from './app/api/atlas-review/review-overview/route';
    export default {async fetch(request) {
      globalThis.__reviewTestHeaders = request.headers;
      const path = new URL(request.url).pathname;
      if (path.endsWith('/plexus-review')) return plexus[request.method](request);
      if (path.endsWith('/review-overview')) return overview[request.method](request);
      return new Response('Not found',{status:404});
    }};`;
  const bundled = await build({stdin:{contents:entry,resolveDir:process.cwd(),sourcefile:'plexus-review-fixture.ts'},
    bundle:true,write:false,format:'esm',platform:'neutral',target:'es2022',external:['cloudflare:workers'],
    define:{'import.meta.env.DEV':'false'},plugins:[{name:'test-headers',setup(b) {
      b.onResolve({filter:/^next\/(headers|navigation)$/},args=>({path:args.path,namespace:'fixture'}));
      b.onLoad({filter:/.*/,namespace:'fixture'},args=>({contents:args.path==='next/headers'
        ? 'export async function headers(){ return globalThis.__reviewTestHeaders; }'
        : 'export function redirect(){ throw Error("Unexpected redirect"); }'}));
    }}]});
  const mf = new Miniflare(convertV4MiniflareOptions({modules:[{type:'ESModule',
    path:resolve('.local/plexus-review-fixture.mjs'),contents:bundled.outputFiles[0].text}],
    compatibilityDate:'2026-08-23',d1Databases:['DB'],log:new Log(LogLevel.NONE)}));
  try {
    const db = await mf.getD1Database('DB');
    for (const sql of [
      'CREATE TABLE users (id TEXT PRIMARY KEY, external_subject TEXT NOT NULL, roles TEXT NOT NULL)',
      'CREATE TABLE account_security_profiles (user_id TEXT PRIMARY KEY, status TEXT NOT NULL)',
      'CREATE TABLE organizations (id TEXT PRIMARY KEY, status TEXT NOT NULL, created_at TEXT NOT NULL)',
      'CREATE TABLE organization_memberships (organization_id TEXT, user_id TEXT, role TEXT, status TEXT, PRIMARY KEY(organization_id,user_id))',
      ...readFileSync('drizzle/0008_solid_infant_terrible.sql','utf8').split('--> statement-breakpoint').map(s=>s.trim()).filter(Boolean),
    ]) await db.prepare(sql).run();
    await db.prepare("INSERT INTO organizations VALUES ('org-a','active','2026-01-01'),('org-b','active','2026-01-02')").run();
    for (const [subject,org] of [['a','org-a'],['b','org-a'],['c','org-b']]) {
      await db.prepare('INSERT INTO users VALUES (?,?,?)').bind('edu:'+subject,'sites:'+subject,'administrator').run();
      await db.prepare('INSERT INTO account_security_profiles VALUES (?,?)').bind('edu:'+subject,'active').run();
      await db.prepare('INSERT INTO organization_memberships VALUES (?,?,?,?)').bind(org,'edu:'+subject,'owner','active').run();
    }
    const contexts:Record<string,string> = {};
    const call = async (subject:string|null='a',payload?:unknown,query='',extra:Record<string,string>={}) => {
      const response = await mf.dispatchFetch(endpoint+query,{method:payload===undefined?'GET':'POST',
        headers:{...(subject?{'oai-authenticated-user-id':subject,'oai-authenticated-user-email':subject+'@test.invalid',
          ...(contexts[subject]?{'X-Clinical-Review-Context':contexts[subject]}:{})}:{}),
          ...(payload===undefined?{}:{origin:'https://review.test','content-type':'application/json'}),...extra},
        ...(payload===undefined?{}:{body:JSON.stringify(payload)})});
      if (subject && response.headers.has('X-Clinical-Review-Context')) contexts[subject]=response.headers.get('X-Clinical-Review-Context')!;
      return response;
    };
    const query='?track=topology';
    assert.equal((await call(null,undefined,query)).status,401);
    assert.equal((await call('missing',undefined,query)).status,403);
    assert.equal((await call('a',undefined,'?track=topology&userId=b')).status,400);
    assert.equal((await call('a',undefined,'?track=topology&track=presentation')).status,400);
    assert.equal((await call('a',undefined,'?track=imaging')).status,400);
    const first=await call('a',undefined,query);
    assert.equal(first.status,200,await first.clone().text());
    assert.match(first.headers.get('cache-control')!,/no-store/);
    const draft=blankPlexusReview(context,'topology');
    const payload={catalogScope:context.catalogScope,candidateId:context.candidateId,frame:context.frame,
      sourceCommit:context.sourceCommit,track:'topology',materialHash:context.materialHash,
      revisionHash:context.revisions.topology,checklistVersion:context.checklistVersion,expectedVersion:0,draft};
    assert.equal((await call('a',payload,'',{origin:'https://attacker.test'})).status,403);
    assert.equal((await call('a',payload,'',{'content-type':'text/plain'})).status,415);
    assert.equal((await call('a',{...payload,draft:{...draft,notes:'x'.repeat(33000)}})).status,413);
    assert.equal((await call('a',{...payload,frame:{kind:'diagrammatic',units:'mm',patientRegistration:false}})).status,400);
    assert.equal((await call('a',{...payload,revisionHash:'f'.repeat(64)})).status,409);
    assert.equal((await call('a',{...payload,draft:{...draft,status:'approved'}})).status,422);
    const saved=await call('a',payload);assert.equal(saved.status,201,await saved.clone().text());
    const history=(await (await call('a',undefined,query)).json()) as {history:Array<{version:number;issues:Array<{id:string}>}>};
    assert.equal(history.history[0].version,1);
    assert.equal(((await (await call('b',undefined,query)).json()) as {history:unknown[]}).history.length,0);
    assert.equal(((await (await call('c',undefined,query)).json()) as {history:unknown[]}).history.length,0);
    const namespace=JSON.stringify(['vm-schematic-personal-review-1',JSON.stringify(['vm-website-personal-review-1','edu:a','org-a'])]);
    const row=await db.prepare('SELECT user_id,specimen_key,structure_id,track FROM atlas_personal_specimen_review_events LIMIT 1')
      .first<{user_id:string;specimen_key:string;structure_id:string;track:string}>();
    assert.equal(row?.user_id,namespace);assert.equal(row?.specimen_key,plexusSpecimenKey);
    assert.equal(row?.structure_id,context.candidateId);assert.equal(row?.track,'geometry');
    const overview=await mf.dispatchFetch(endpoint.replace('plexus-review','review-overview'),
      {headers:{'oai-authenticated-user-id':'a','oai-authenticated-user-email':'a@test.invalid'}});
    assert.equal(overview.status,200);
    assert.ok(!JSON.stringify(await overview.json()).includes(context.candidateId));
    const correction={...payload,expectedVersion:1,draft:{...draft,issues:[{id:'issue-1',title:'Check branch',severity:'minor',resolved:false,resolution:''}]}};
    const race=await Promise.all([call('a',correction),call('a',correction)]);
    assert.deepEqual(race.map(r=>r.status).sort(),[201,409]);
    assert.equal((await call('a',{...payload,expectedVersion:2})).status,422,'issue IDs remain append-only');
    const approved={...payload,expectedVersion:2,draft:{...draft,status:'approved',reviewer:'Synthetic reviewer',
      qualification:'Radiologist',scope:'Synthetic schematic topology review only',attested:true,
      checks:Object.fromEntries(context.checklists.topology.map(c=>[c.id,true])),
      evidence:[{title:'Synthetic evidence',url:'https://example.org/review',note:'Test fixture only'}],
      issues:[{id:'issue-1',title:'Check branch',severity:'minor',resolved:true,resolution:'Synthetic resolution'}]}};
    assert.equal((await call('a',approved)).status,201);
    const result=(await (await call('a',undefined,query)).json()) as {history:Array<{status:string;reviewedAt:string|null}>};
    assert.equal(result.history[0].status,'approved');assert.ok(result.history[0].reviewedAt);
    await db.prepare('UPDATE atlas_personal_specimen_review_events SET saved_at=? WHERE user_id=? AND version=3')
      .bind('2026-01-01T00:00:00.000Z',namespace).run();
    assert.equal((await call('a',undefined,query)).status,503,'mismatched envelope is not returned');
  } finally { await mf.dispose(); }
});
