import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { build } from 'esbuild';
import { Miniflare, Log, LogLevel, convertV4MiniflareOptions } from 'miniflare';
import { reviewModelHref } from '../lib/clinical-review-links.ts';

const priorMaterial = JSON.parse(readFileSync('tests/fixtures/clinical-review-prior-material-20260926.json','utf8')) as {
  atlasSource:string; records:Array<{key:string;scope:string;structureId:string;revisionHash:string;materialHash?:string;checklistVersion:string}>;
};

test('current review includes draft answer evidence and admitted teaching without the held skin candidate', () => {
  const review = JSON.parse(readFileSync('atlas-review/manifest.json', 'utf8'));
  const viewer = JSON.parse(readFileSync('public/atlas-review-viewer/manifest.json', 'utf8'));
  const regional = JSON.parse(readFileSync('public/atlas-runtime/head-neck/manifest.json', 'utf8'));
  // Review and learner exports retain their independently verified source pins.
  assert.equal(review.revision, '922b99a18d917376ba14493e2743ae4d09b84988');
  assert.equal(viewer.sourceCommit, review.revision);
  assert.equal(viewer.websiteIntegrationSha256, review.websiteIntegrationSha256);
  assert.equal(regional.sourceCommit, '922b99a18d917376ba14493e2743ae4d09b84988');
  assert.notEqual(review.revision, priorMaterial.atlasSource);
  const paths = new Set(review.files.map((file: {path:string}) => file.path));
  for (const path of ['app/structure-quick-check.tsx', 'content/coronary-arterial-us.ts', 'content/elbow-arterial-ct.ts', 'content/achilles-ct.ts']) assert.ok(paths.has(path), path);
  assert.ok(![...paths].some(path => String(path).startsWith('app/review/candidates/')));
  const dashboard = readFileSync('atlas-review/app/review/review-dashboard.tsx', 'utf8');
  assert.ok(dashboard.includes('Draft answer key:'));
  assert.ok(dashboard.includes('Draft explanation:'));
  assert.ok(!readFileSync('atlas-review/app/review/overview/page.tsx', 'utf8').includes('/review/candidates/skin'));
});

test('source model links preserve exact identities through the website', () => {
  for (const href of ['/?study=1&structure=FMA1&source=abc&side=both', '/regions/head-neck?study=2&part=child&partSource=def', '/specimens/kidneys?ref=1&refSource=abc', '/specimens/lower-limb?specimen=1&specimenScope=foot&specimenPart=toe']) {
    const before = new URL(href, 'https://x.test'), after = new URL(reviewModelHref(href), 'https://x.test');
    assert.equal(after.pathname, '/workspace/atlas-review/model');
    for (const [key, value] of before.searchParams) assert.equal(after.searchParams.get(key), value);
  }
  for (const href of ['https://other.test/', '//other.test/', '/unknown', null]) assert.equal(reviewModelHref(href), '/workspace/atlas-review');
});

test('actual website endpoints: authorization, isolated durable decisions, conflicts and corrections', { timeout: 120000 }, async () => {
  // Test-only header context, compiled into this memory worker, never production.
  const entry = `
    import * as shoulder from './app/api/atlas-review/reviews/route';
    import * as body from './app/api/atlas-review/body-review/decisions/route';
    import * as nested from './app/api/atlas-review/nested-review/route';
    import * as specimen from './app/api/atlas-review/specimen-review/route';
    import * as overview from './app/api/atlas-review/review-overview/route';
    import * as material from './app/api/atlas-review/body-review/route';
    import { clinicalReviewEntries } from './atlas-review/lib/clinical-review-index';
    import { blankReview, currentRevision, checklistVersion } from './atlas-review/lib/review-workspace';
    import { bodyReviewContext } from './atlas-review/lib/body-review-context';
    import { blankBodyReview } from './atlas-review/lib/body-review-decisions';
    import { nestedReviewMaterial } from './atlas-review/lib/nested-review-material';
    import { blankNestedReview } from './atlas-review/lib/nested-review';
    import { specimenReviewMaterial } from './atlas-review/lib/specimen-review-material';
    import { blankSpecimenReview } from './atlas-review/lib/specimen-review';
    const routes = {reviews:shoulder, 'body-review/decisions':body, 'nested-review':nested, 'specimen-review':specimen, 'review-overview':overview, 'body-review':material};
    export default {async fetch(request) {
      globalThis.__reviewTestHeaders = request.headers;
      const url = new URL(request.url);
      if(url.pathname === '/__fixtures') {
        const fixtures=[];
        for(const scope of ['shoulder','body','nested','specimens']) {
          const entry=clinicalReviewEntries.find(e=>e.scope===scope), track='geometry';
          if(scope==='shoulder') fixtures.push({endpoint:'reviews', query:'?history=1&structureId='+entry.id+'&track=geometry', payload:{structureId:entry.id,track,expectedVersion:0,revisionHash:currentRevision(entry.id,track),checklistVersion,draft:blankReview(entry.id,track)}});
          else {
            const pair=scope==='body'?null:JSON.parse(entry.key.slice(scope.length+1));
            const c=scope==='body'?await bodyReviewContext(entry.id):scope==='nested'?(await nestedReviewMaterial(...pair)).context:(await specimenReviewMaterial(...pair)).context;
            const draft=scope==='body'?blankBodyReview(c,track):scope==='nested'?blankNestedReview(c,track):blankSpecimenReview(c,track);
            const endpoint=scope==='body'?'body-review/decisions':scope==='nested'?'nested-review':'specimen-review';
            const query=new URLSearchParams({structureId:entry.id,track,...(scope==='nested'?{nestedKey:c.nestedKey}:scope==='specimens'?{specimenKey:c.specimenKey}:{})});
            fixtures.push({endpoint,query:'?'+query,payload:{catalogScope:c.catalogScope,structureId:entry.id,nestedKey:c.nestedKey,specimenKey:c.specimenKey,sourceFrame:c.sourceFrame,track,expectedVersion:0,materialHash:c.materialHash,revisionHash:c.revisions[track],checklistVersion:c.checklistVersion,draft}});
          }
          Object.assign(fixtures.at(-1),{key:entry.key,scope:entry.scope});
        }
        return Response.json({count:clinicalReviewEntries.length,fixtures});
      }
      const route=routes[url.pathname.slice('/api/atlas-review/'.length)];
      return route?.[request.method]?.(request) ?? new Response('Not found',{status:404});
    }};`;
  const bundled = await build({ stdin: { contents: entry, resolveDir: process.cwd(), sourcefile: 'clinical-review-fixture.ts' }, bundle: true, write: false, format: 'esm', platform: 'neutral', target: 'es2022', external: ['cloudflare:workers'], define: {'import.meta.env.DEV':'false'},
    plugins: [{ name: 'test-request-headers', setup(b) {
      b.onResolve({filter:/^next\/(headers|navigation)$/}, args=>({path:args.path,namespace:'fixture'}));
      b.onLoad({filter:/.*/,namespace:'fixture'}, args=>({contents:args.path==='next/headers'?'export async function headers(){ return globalThis.__reviewTestHeaders; }':'export function redirect(){ throw Error("Unexpected redirect"); }'}));
    }}] });
  const mf = new Miniflare(convertV4MiniflareOptions({ modules: [{type:'ESModule',path:resolve('.local/clinical-review-fixture.mjs'),contents:bundled.outputFiles[0].text}], compatibilityDate:'2026-08-23',d1Databases:['DB'],log:new Log(LogLevel.NONE) }));
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
    for(const [subject,roles,member,org] of [['a','administrator','owner','org-a'],['b','administrator','owner','org-a'],['c','administrator','administrator','org-b'],['instructor','instructor','educator','org-a'],['learner','learner','learner','org-a'],['admin-no-membership','administrator','learner','org-a']]) {
      await db.prepare('INSERT INTO users VALUES (?,?,?)').bind('edu:'+subject,'sites:'+subject,roles).run();
      await db.prepare('INSERT INTO account_security_profiles VALUES (?,?)').bind('edu:'+subject,'active').run();
      await db.prepare('INSERT INTO organization_memberships VALUES (?,?,?,?)').bind(org,'edu:'+subject,member,'active').run();
    }
    const contexts:Record<string,string>={};
    const call = async (endpoint:string, subject:string|null='a', payload?:unknown, extra:Record<string,string>={}) => {
      const response=await mf.dispatchFetch('https://review.test/api/atlas-review/'+endpoint, {method:payload===undefined?'GET':'POST', headers:{...(subject?{'oai-authenticated-user-id':subject,'oai-authenticated-user-email':subject+'@test.invalid',...(contexts[subject]?{'X-Clinical-Review-Context':contexts[subject]}:{})}:{}),...(payload===undefined?{}:{origin:'https://review.test','content-type':'application/json'}),...extra}, ...(payload===undefined?{}:{body:JSON.stringify(payload)})});
      if(subject&&response.headers.has('X-Clinical-Review-Context')) contexts[subject]=response.headers.get('X-Clinical-Review-Context')!;
      return response;
    };
    const seedResponse=await mf.dispatchFetch('https://review.test/__fixtures');
    assert.equal(seedResponse.status,200,await seedResponse.clone().text());
    const seed=await seedResponse.json() as {count:number;fixtures:Array<{key:string;scope:string;endpoint:string;query:string;payload:any}>};
    assert.equal(seed.count,1577);
    assert.equal((await call('reviews','a',seed.fixtures[0].payload)).status,409,'save requires loaded account context');
    await call('reviews');
    for(const endpoint of ['reviews','body-review','body-review/decisions','nested-review','specimen-review','review-overview']) {
      for(const who of [null,'unknown','instructor','learner','admin-no-membership']) {
        assert.equal((await call(endpoint,who)).status,who?403:401,endpoint+' '+who);
        assert.equal((await call(endpoint,who,{})).status,endpoint==='body-review'||endpoint==='review-overview'?404:who?403:401);
      }
    }
    for(const fixture of seed.fixtures) {
      const {endpoint,query,payload}=fixture;
      const prior=priorMaterial.records.find(row=>row.key===fixture.key);
      assert(prior,'real prior source identity fixture');
      assert.notEqual(payload.revisionHash,prior.revisionHash,'changed review integration requires a new revision');
      assert.equal((await call(endpoint,'a',{...payload,revisionHash:prior.revisionHash,
        ...(prior.materialHash?{materialHash:prior.materialHash}:{})})).status,409,'prior-release form cannot approve current material');
      payload.draft.notes='Synthetic integration check; no clinical review.';
      assert.equal((await call(endpoint,'a',payload,{origin:'https://attacker.test'})).status,403);
      assert.equal((await call(endpoint,'a',payload,{'content-type':'text/plain'})).status,415);
      assert.equal((await call(endpoint,'a',{...payload,revisionHash:'f'.repeat(64)})).status,409);
      assert.equal((await call(endpoint,'a',{...payload,draft:{...payload.draft,notes:'x'.repeat(33000)}})).status,413);
      const saved=await call(endpoint,'a',payload); assert.equal(saved.status,201,await saved.clone().text());
      const history=await (await call(endpoint+query)).json() as any;
      assert.equal(history.history[0].version,1);assert.equal(history.history[0].notes,payload.draft.notes);
      for(const other of ['b','c']) assert.equal(((await (await call(endpoint+query,other)).json()) as any).history.length,0);
      // Emulate a pre-upgrade record in disposable in-memory storage only. The
      // fingerprints are captured from the actual prior release, not invented.
      const table={shoulder:'atlas_personal_review_events',body:'atlas_personal_body_review_events',nested:'atlas_personal_nested_review_events',specimens:'atlas_personal_specimen_review_events'}[fixture.scope];
      assert(table);
      const historical={...history.history[0],revisionHash:prior.revisionHash};
      const replaced=await db.prepare(`UPDATE ${table} SET payload=? WHERE user_id=? AND structure_id=? AND track='geometry' AND version=1`)
        .bind(JSON.stringify(historical),JSON.stringify(['vm-website-personal-review-1','edu:a','org-a']),payload.structureId).run();
      assert.equal(replaced.meta.changes,1);
      const statusPath='review-overview?'+new URLSearchParams({scope:fixture.scope,q:payload.structureId});
      const staleQueue=await (await call(statusPath)).json() as any;
      assert.equal(staleQueue.items.find((row:any)=>row.key===fixture.key)?.geometry,'re-review','prior decision is not applied to current material');
      const preserved=await (await call(endpoint+query)).json() as any;
      assert.deepEqual(preserved.history[0],historical,'reading current material does not migrate historical decisions');
      assert.equal((await call(endpoint,'a',payload)).status,409);
      const correction={...payload,expectedVersion:1,draft:{...payload.draft,notes:'Synthetic correction; no clinical approval.'}};
      const race=await Promise.all([call(endpoint,'a',correction),call(endpoint,'a',correction)]);
      assert.deepEqual(race.map(r=>r.status).sort(),[201,409]);
      const after=await (await call(endpoint+query)).json() as any;
      assert.deepEqual(after.history.map((r:any)=>r.version),[2,1]);
      assert.equal(after.history[1].notes,payload.draft.notes,'append-only original');
      assert.equal(after.history[1].revisionHash,prior.revisionHash,'old revision retained after fresh correction');
      assert.equal(after.history[0].status,'draft');
      const currentQueue=await (await call(statusPath)).json() as any;
      assert.equal(currentQueue.items.find((row:any)=>row.key===fixture.key)?.geometry,'in-progress','fresh draft is current, not approved');
      assert.equal((await call(endpoint+'?userId=b&organizationId=org-b','a',{...correction,expectedVersion:2})).status,201,'client IDs cannot select a different store');
    }
    await call('reviews','b');
    assert.equal((await call('reviews','b',seed.fixtures[0].payload,{'X-Clinical-Review-Context':contexts.a})).status,409,'old document cannot save under another account');
    // Revocations are checked freshly and never healed by reading review APIs.
    for(const [table,column,value,where,restore] of [
      ['account_security_profiles','status','restricted',"user_id='edu:a'",'active'],
      ['organization_memberships','status','revoked',"user_id='edu:a'",'active'],
      ['organizations','status','suspended',"id='org-a'",'active'],
      ['users','external_subject','sites:other',"id='edu:a'",'sites:a'],
      ['users','roles','instructor',"id='edu:a'",'administrator'],
    ]) {
      await db.prepare(`UPDATE ${table} SET ${column}=? WHERE ${where}`).bind(value).run();
      assert.equal((await call('review-overview')).status,403);
      assert.equal((await call('reviews','a',seed.fixtures[0].payload)).status,403);
      await db.prepare(`UPDATE ${table} SET ${column}=? WHERE ${where}`).bind(restore).run();
    }
    await db.prepare("UPDATE organization_memberships SET organization_id='org-b' WHERE user_id='edu:a'").run();
    assert.equal((await call('reviews','a',seed.fixtures[0].payload)).status,409,'old document cannot save under another institution');
    assert.equal(((await (await call(seed.fixtures[0].endpoint+seed.fixtures[0].query)).json()) as any).history.length,0,'personal records do not migrate institutions');
    const overview=await call('review-overview');assert.equal(overview.status,200);assert.match(overview.headers.get('cache-control')! ,/no-store/);
    assert.equal((await call('review-overview?userId=b')).status,400);
    for(const table of ['atlas_personal_review_events','atlas_personal_body_review_events','atlas_personal_nested_review_events','atlas_personal_specimen_review_events']) {
      assert.equal((await db.prepare(`SELECT COUNT(*) AS n FROM ${table}`).first<{n:number}>())?.n,3);
      const row=await db.prepare(`SELECT user_id FROM ${table} LIMIT 1`).first<{user_id:string}>();
      assert.deepEqual(JSON.parse(row!.user_id),['vm-website-personal-review-1','edu:a','org-a']);
    }
  } finally { await mf.dispose(); }
});
