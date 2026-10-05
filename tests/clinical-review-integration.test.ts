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
  assert.equal(review.revision, '1445d904f96a1e3d3f617b3ddf7c3013b78c4099');
  assert.equal(viewer.sourceCommit, review.revision);
  assert.equal(viewer.websiteIntegrationSha256, review.websiteIntegrationSha256);
  assert.equal(regional.sourceCommit, '1445d904f96a1e3d3f617b3ddf7c3013b78c4099');
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
    import { blankNestedReview, nestedApprovalProblems } from './atlas-review/lib/nested-review';
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
        // Additional teaching scope exercises the real website authorization,
        // namespaced D1 storage and eleven-tab saved-event parser together.
        const calfEntry=clinicalReviewEntries.find(e=>e.scope==='specimens'&&e.id==='vm:reference:um-5t6tz7-v1-2:lower-limb:soleus'&&JSON.parse(e.key.slice('specimens:'.length))[0].endsWith(':calf'));
        if(!calfEntry)throw Error('Missing exact calf source fixture');
        const calfPair=JSON.parse(calfEntry.key.slice('specimens:'.length)),calfContext=(await specimenReviewMaterial(...calfPair)).context;
        const calf={endpoint:'specimen-review',query:'?'+new URLSearchParams({specimenKey:calfContext.specimenKey,structureId:calfContext.structureId,track:'teaching'}),
          payload:{catalogScope:calfContext.catalogScope,specimenKey:calfContext.specimenKey,sourceFrame:calfContext.sourceFrame,structureId:calfContext.structureId,
            track:'teaching',expectedVersion:0,materialHash:calfContext.materialHash,revisionHash:calfContext.revisions.teaching,
            checklistVersion:calfContext.checklistVersion,draft:blankSpecimenReview(calfContext,'teaching')}};
        const thighEntry=clinicalReviewEntries.find(e=>e.scope==='specimens'&&e.id==='vm:reference:um-5t6tz7-v1-2:lower-limb:rectus-femoris'&&JSON.parse(e.key.slice('specimens:'.length))[0].endsWith(':hip-thigh'));
        if(!thighEntry)throw Error('Missing exact thigh source fixture');
        const thighPair=JSON.parse(thighEntry.key.slice('specimens:'.length)),thighContext=(await specimenReviewMaterial(...thighPair)).context;
        const thigh={endpoint:'specimen-review',query:'?'+new URLSearchParams({specimenKey:thighContext.specimenKey,structureId:thighContext.structureId,track:'teaching'}),
          payload:{catalogScope:thighContext.catalogScope,specimenKey:thighContext.specimenKey,sourceFrame:thighContext.sourceFrame,structureId:thighContext.structureId,
            track:'teaching',expectedVersion:0,materialHash:thighContext.materialHash,revisionHash:thighContext.revisions.teaching,
            checklistVersion:thighContext.checklistVersion,draft:blankSpecimenReview(thighContext,'teaching')}};
        const deepHipEntry=clinicalReviewEntries.find(e=>e.scope==='specimens'&&e.id==='vm:reference:um-5t6tz7-v1-2:lower-limb:piriformis'&&JSON.parse(e.key.slice('specimens:'.length))[0].endsWith(':hip-thigh'));
        if(!deepHipEntry)throw Error('Missing exact deep-hip source fixture');
        const deepHipPair=JSON.parse(deepHipEntry.key.slice('specimens:'.length)),deepHipMaterial=await specimenReviewMaterial(...deepHipPair),deepHipContext=deepHipMaterial.context;
        if(deepHipMaterial.teaching.lesson.depth.revision!=='um-deep-hip-depth-20261005-v1')throw Error('Wrong deep-hip teaching revision');
        const deepHip={endpoint:'specimen-review',query:'?'+new URLSearchParams({specimenKey:deepHipContext.specimenKey,structureId:deepHipContext.structureId,track:'teaching'}),depthRevision:deepHipMaterial.teaching.lesson.depth.revision,
          payload:{catalogScope:deepHipContext.catalogScope,specimenKey:deepHipContext.specimenKey,sourceFrame:deepHipContext.sourceFrame,structureId:deepHipContext.structureId,
            track:'teaching',expectedVersion:0,materialHash:deepHipContext.materialHash,revisionHash:deepHipContext.revisions.teaching,
            checklistVersion:deepHipContext.checklistVersion,draft:blankSpecimenReview(deepHipContext,'teaching')}};
        const kneeEntry=clinicalReviewEntries.find(e=>e.scope==='specimens'&&e.id==='vm:reference:um-5t6tz7-v1-2:knee:acl'&&JSON.parse(e.key.slice('specimens:'.length))[0].endsWith(':knee'));
        if(!kneeEntry)throw Error('Missing exact knee guide fixture');
        const kneePair=JSON.parse(kneeEntry.key.slice('specimens:'.length)),kneeMaterial=await specimenReviewMaterial(...kneePair),kneeContext=kneeMaterial.context;
        const kneeGuide=kneeMaterial.teaching.guidedDissection;
        if(kneeGuide.steps.length!==7||kneeGuide.steps[5].id!=='um-knee-stability-compare')throw Error('Wrong knee guided-learning revision');
        const knee={endpoint:'specimen-review',query:'?'+new URLSearchParams({specimenKey:kneeContext.specimenKey,structureId:kneeContext.structureId,track:'teaching'}),
          guideSteps:kneeGuide.steps.length,comparisonStep:kneeGuide.steps[5].id,
          payload:{catalogScope:kneeContext.catalogScope,specimenKey:kneeContext.specimenKey,sourceFrame:kneeContext.sourceFrame,structureId:kneeContext.structureId,
            track:'teaching',expectedVersion:0,materialHash:kneeContext.materialHash,revisionHash:kneeContext.revisions.teaching,
            checklistVersion:kneeContext.checklistVersion,draft:blankSpecimenReview(kneeContext,'teaching')}};
        const footEntry=clinicalReviewEntries.find(e=>e.scope==='specimens'&&e.id==='vm:reference:um-5t6tz7-v1-2:lower-limb:flexor-digitorum-brevis'&&JSON.parse(e.key.slice('specimens:'.length))[0].endsWith(':foot'));
        if(!footEntry)throw Error('Missing exact intrinsic-foot source fixture');
        const footPair=JSON.parse(footEntry.key.slice('specimens:'.length)),footMaterial=await specimenReviewMaterial(...footPair),footContext=footMaterial.context;
        if(footMaterial.teaching.lesson.depth.revision!=='um-foot-depth-20261005-v1')throw Error('Wrong foot teaching revision');
        const foot={endpoint:'specimen-review',query:'?'+new URLSearchParams({specimenKey:footContext.specimenKey,structureId:footContext.structureId,track:'teaching'}),depthRevision:footMaterial.teaching.lesson.depth.revision,
          payload:{catalogScope:footContext.catalogScope,specimenKey:footContext.specimenKey,sourceFrame:footContext.sourceFrame,structureId:footContext.structureId,
            track:'teaching',expectedVersion:0,materialHash:footContext.materialHash,revisionHash:footContext.revisions.teaching,
            checklistVersion:footContext.checklistVersion,draft:blankSpecimenReview(footContext,'teaching')}};
        // Optional CSF illustration needs explicit, revision-bound display and
        // teaching review. These synthetic records do not grant clinical approval.
        const csf=[];
        for(const id of ["vm:anatomy:body:head-neck:left:space:left-lateral-ventricle","vm:anatomy:body:head-neck:right:space:right-lateral-ventricle","vm:anatomy:body:head-neck:midline:space:third-ventricle","vm:anatomy:body:head-neck:midline:space:fourth-ventricle"]) {
          const csfEntry=clinicalReviewEntries.find(e=>e.scope==='nested'&&e.id===id);
          if(!csfEntry)throw Error('Missing exact ventricular source fixture');
          const pair=JSON.parse(csfEntry.key.slice('nested:'.length));
          const packet=await nestedReviewMaterial(...pair),c=packet.context;
          if(packet.teaching.guidedLearning?.steps.length!==5||packet.teaching.csfMotion?.markerCount!==160)
            throw Error('Missing exact guided learning/CSF metadata');
          for(const track of ['geometry','teaching']) {
            const draft=blankNestedReview(c,track);
            const complete={...draft,status:'approved',reviewer:'SOFTWARE TEST ONLY',qualification:'Not radiologist sign-off',
              scope:'Synthetic exact-source CSF safeguard check',attested:true,
              checks:Object.fromEntries(Object.keys(draft.checks).map(id=>[id,true])),
              evidence:[{title:'Synthetic fixture',url:'https://example.test/csf-fixture',note:'Not clinical evidence'}]};
            if(nestedApprovalProblems(complete,c,track).length)throw Error('Invalid complete CSF test control');
            csf.push({complete,
            endpoint:'nested-review',query:'?'+new URLSearchParams({nestedKey:c.nestedKey,structureId:c.structureId,track}),
            motion:packet.teaching.csfMotion,guideSteps:packet.teaching.guidedLearning.steps.length,
            payload:{catalogScope:c.catalogScope,nestedKey:c.nestedKey,structureId:c.structureId,sourceFrame:c.sourceFrame,
              track,expectedVersion:0,materialHash:c.materialHash,revisionHash:c.revisions[track],
              checklistVersion:c.checklistVersion,draft}});
          }
        }
        return Response.json({count:clinicalReviewEntries.length,fixtures,calf,thigh,deepHip,knee,foot,csf});
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
    const seed=await seedResponse.json() as {count:number;fixtures:Array<{key:string;scope:string;endpoint:string;query:string;payload:any}>;calf:{endpoint:string;query:string;payload:any};thigh:{endpoint:string;query:string;payload:any};deepHip:{endpoint:string;query:string;payload:any;depthRevision:string};knee:{endpoint:string;query:string;payload:any;guideSteps:number;comparisonStep:string};foot:{endpoint:string;query:string;payload:any;depthRevision:string};csf:Array<{endpoint:string;query:string;payload:any;complete:any;motion:any;guideSteps:number}>};
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
    const calf=seed.calf;
    assert.equal(calf.payload.draft.checks['calf-depth'],false);
    calf.payload.draft.notes='Synthetic calf teaching persistence; not clinical review.';
    const calfSaved=await call(calf.endpoint,'a',calf.payload);
    assert.equal(calfSaved.status,201,await calfSaved.clone().text());
    const calfDraft=await calfSaved.json() as any;
    assert.equal(calfDraft.review.material.teachingTabs.length,11);
    assert(calfDraft.review.material.teachingTabs.includes('calf-depth'));
    assert.equal(calfDraft.review.status,'draft');
    const calfHistory=await (await call(calf.endpoint+calf.query)).json() as any;
    assert.equal(calfHistory.history[0].notes,calf.payload.draft.notes);
    assert.equal((await call(calf.endpoint,'a',calf.payload)).status,409);
    const syntheticApproval={...calf.payload,expectedVersion:1,draft:{...calf.payload.draft,status:'approved',
      reviewer:'SOFTWARE TEST ONLY',qualification:'Not radiologist sign-off',scope:'Synthetic exact-source calf teaching persistence check',
      attested:true,checks:Object.fromEntries(Object.keys(calf.payload.draft.checks).map(id=>[id,true])),
      evidence:[{title:'Synthetic fixture',url:'https://example.test/fixture',note:'Not clinical evidence'}]}};
    assert.equal((await call(calf.endpoint,'a',{...syntheticApproval,draft:{...syntheticApproval.draft,checks:{...syntheticApproval.draft.checks,'calf-depth':false}}})).status,422);
    const calfApproved=await call(calf.endpoint,'a',syntheticApproval);
    assert.equal(calfApproved.status,201,await calfApproved.clone().text());
    const calfAfter=await (await call(calf.endpoint+calf.query)).json() as any;
    assert.deepEqual(calfAfter.history.map((r:any)=>r.version),[2,1]);
    assert.equal(calfAfter.history[0].material.teachingTabs.length,11);
    assert.equal(calfAfter.history[0].status,'approved');
    for(const other of ['b','c'])assert.equal(((await (await call(calf.endpoint+calf.query,other)).json()) as any).history.length,0);
    const thigh=seed.thigh;
    assert.equal(thigh.payload.draft.checks['thigh-depth'],false);
    assert.equal(thigh.payload.draft.checks['calf-depth'],undefined,'calf approvals cannot cover thigh text');
    thigh.payload.draft.notes='Synthetic thigh teaching persistence; not clinical review.';
    const thighSaved=await call(thigh.endpoint,'a',thigh.payload);
    assert.equal(thighSaved.status,201,await thighSaved.clone().text());
    const thighDraft=await thighSaved.json() as any;
    assert.equal(thighDraft.review.material.teachingTabs.length,11);
    assert(thighDraft.review.material.teachingTabs.includes('thigh-depth'));
    assert(!thighDraft.review.material.teachingTabs.includes('calf-depth'));
    assert.equal(thighDraft.review.status,'draft');
    const thighHistory=await (await call(thigh.endpoint+thigh.query)).json() as any;
    assert.equal(thighHistory.history[0].notes,thigh.payload.draft.notes);
    assert.equal((await call(thigh.endpoint,'a',thigh.payload)).status,409);
    const thighApproval={...thigh.payload,expectedVersion:1,draft:{...thigh.payload.draft,status:'approved',
      reviewer:'SOFTWARE TEST ONLY',qualification:'Not radiologist sign-off',scope:'Synthetic exact-source thigh teaching persistence check',
      attested:true,checks:Object.fromEntries(Object.keys(thigh.payload.draft.checks).map(id=>[id,true])),
      evidence:[{title:'Synthetic fixture',url:'https://example.test/fixture',note:'Not clinical evidence'}]}};
    assert.equal((await call(thigh.endpoint,'a',{...thighApproval,draft:{...thighApproval.draft,checks:{...thighApproval.draft.checks,'thigh-depth':false}}})).status,422);
    assert.equal((await call(thigh.endpoint,'a',{...thighApproval,draft:{...thighApproval.draft,attested:false}})).status,422);
    const thighApproved=await call(thigh.endpoint,'a',thighApproval);
    assert.equal(thighApproved.status,201,await thighApproved.clone().text());
    const thighAfter=await (await call(thigh.endpoint+thigh.query)).json() as any;
    assert.deepEqual(thighAfter.history.map((r:any)=>r.version),[2,1]);
    assert.equal(thighAfter.history[0].material.teachingTabs.length,11);
    assert.equal(thighAfter.history[0].status,'approved');
    for(const other of ['b','c'])assert.equal(((await (await call(thigh.endpoint+thigh.query,other)).json()) as any).history.length,0);
    const deepHip=seed.deepHip;
    assert.equal(deepHip.depthRevision,'um-deep-hip-depth-20261005-v1');
    assert.equal(deepHip.payload.draft.checks['thigh-depth'],false);
    assert.equal(deepHip.payload.draft.checks['calf-depth'],undefined);
    assert.equal((await call(deepHip.endpoint,null,deepHip.payload)).status,401);
    const beforeDeepHip=JSON.parse(readFileSync('tests/atlas-deep-hip-depth-baseline.json','utf8')).specimenPackets
      .find((packet:any)=>packet.key===deepHip.payload.specimenKey+'|'+deepHip.payload.structureId);
    assert(beforeDeepHip,'exact prior deep-hip source context');
    assert.notEqual(beforeDeepHip.teachingRevision,deepHip.payload.revisionHash);
    const countBeforeDeepHip=await db.prepare('SELECT COUNT(*) AS n FROM atlas_personal_specimen_review_events').first<{n:number}>();
    assert.equal((await call(deepHip.endpoint,'a',{...deepHip.payload,materialHash:beforeDeepHip.materialHash,revisionHash:beforeDeepHip.teachingRevision})).status,409);
    assert.deepEqual(await db.prepare('SELECT COUNT(*) AS n FROM atlas_personal_specimen_review_events').first<{n:number}>(),countBeforeDeepHip,'stale source cannot append an event');
    deepHip.payload.draft.notes='Synthetic deep-hip teaching persistence; not clinical review.';
    const deepHipSaved=await call(deepHip.endpoint,'a',deepHip.payload);
    assert.equal(deepHipSaved.status,201,await deepHipSaved.clone().text());
    const deepHipDraft=await deepHipSaved.json() as any;
    assert.equal(deepHipDraft.review.status,'draft');
    assert.equal(deepHipDraft.review.material.teachingTabs.length,11);
    assert(deepHipDraft.review.material.teachingTabs.includes('thigh-depth'));
    assert(!deepHipDraft.review.material.teachingTabs.includes('calf-depth'));
    const deepHipHistory=await (await call(deepHip.endpoint+deepHip.query)).json() as any;
    assert.equal(deepHipHistory.history[0].notes,deepHip.payload.draft.notes);
    assert.equal((await call(deepHip.endpoint,'a',deepHip.payload)).status,409);
    const deepHipApproval={...deepHip.payload,expectedVersion:1,draft:{...deepHip.payload.draft,status:'approved',
      reviewer:'SOFTWARE TEST ONLY',qualification:'Not radiologist sign-off',scope:'Synthetic exact-source deep-hip teaching check',
      attested:true,checks:Object.fromEntries(Object.keys(deepHip.payload.draft.checks).map(id=>[id,true])),
      evidence:[{title:'Synthetic fixture',url:'https://example.test/fixture',note:'Not clinical evidence'}]}};
    assert.equal((await call(deepHip.endpoint,'a',{...deepHipApproval,draft:{...deepHipApproval.draft,checks:{...deepHipApproval.draft.checks,'thigh-depth':false}}})).status,422);
    assert.equal((await call(deepHip.endpoint,'a',{...deepHipApproval,draft:{...deepHipApproval.draft,attested:false}})).status,422);
    const deepHipApproved=await call(deepHip.endpoint,'a',deepHipApproval);
    assert.equal(deepHipApproved.status,201,await deepHipApproved.clone().text());
    const deepHipAfter=await (await call(deepHip.endpoint+deepHip.query)).json() as any;
    assert.deepEqual(deepHipAfter.history.map((r:any)=>r.version),[2,1]);
    assert.equal(deepHipAfter.history[0].material.teachingTabs.length,11);
    assert.equal(deepHipAfter.history[0].status,'approved');
    assert.equal(deepHipAfter.history[1].status,'draft');
    for(const other of ['b','c'])assert.equal(((await (await call(deepHip.endpoint+deepHip.query,other)).json()) as any).history.length,0);
    const knee=seed.knee;
    assert.equal(knee.guideSteps,7);assert.equal(knee.comparisonStep,'um-knee-stability-compare');
    assert.equal(knee.payload.draft.checks['guided-dissection'],false);
    assert.equal((await call(knee.endpoint,null,knee.payload)).status,401);
    const beforeKnee=JSON.parse(readFileSync('tests/atlas-knee-stability-guide-baseline.json','utf8')).packets
      .find((packet:any)=>packet.key===knee.payload.specimenKey+'|'+knee.payload.structureId);
    assert(beforeKnee,'actual pre-import knee context');
    assert.notEqual(beforeKnee.teachingRevision,knee.payload.revisionHash);
    const countBeforeKnee=await db.prepare('SELECT COUNT(*) AS n FROM atlas_personal_specimen_review_events').first<{n:number}>();
    for(const patch of [{revisionHash:beforeKnee.teachingRevision},{materialHash:beforeKnee.materialHash},{sourceFrame:'foreign-frame'}]) {
      assert.equal((await call(knee.endpoint,'a',{...knee.payload,...patch})).status,409);
      assert.deepEqual(await db.prepare('SELECT COUNT(*) AS n FROM atlas_personal_specimen_review_events').first<{n:number}>(),countBeforeKnee,'stale or foreign knee guide cannot append history');
    }
    knee.payload.draft.notes='Synthetic knee guide persistence; not clinical approval.';
    const kneeSaved=await call(knee.endpoint,'a',knee.payload);
    assert.equal(kneeSaved.status,201,await kneeSaved.clone().text());
    const kneeHistory=await (await call(knee.endpoint+knee.query)).json() as any;
    assert.equal(kneeHistory.history[0].status,'draft');
    assert.equal(kneeHistory.history[0].notes,knee.payload.draft.notes);
    assert.equal(kneeHistory.history[0].checks['guided-dissection'],false);
    assert.equal(kneeHistory.history[0].revisionHash,knee.payload.revisionHash);
    assert.equal((await call(knee.endpoint,'a',knee.payload)).status,409);
    const kneeApproval={...knee.payload,expectedVersion:1,draft:{...knee.payload.draft,status:'approved',
      reviewer:'SOFTWARE TEST ONLY',qualification:'Not radiologist sign-off',scope:'Synthetic exact-source knee guide check',
      attested:true,checks:Object.fromEntries(Object.keys(knee.payload.draft.checks).map(id=>[id,true])),
      evidence:[{title:'Synthetic fixture',url:'https://example.test/fixture',note:'Not clinical evidence'}]}};
    assert.equal((await call(knee.endpoint,'a',{...kneeApproval,draft:{...kneeApproval.draft,checks:{...kneeApproval.draft.checks,'guided-dissection':false}}})).status,422);
    assert.equal((await call(knee.endpoint,'a',{...kneeApproval,draft:{...kneeApproval.draft,attested:false}})).status,422);
    const kneeApproved=await call(knee.endpoint,'a',kneeApproval);
    assert.equal(kneeApproved.status,201,await kneeApproved.clone().text());
    const kneeAfter=await (await call(knee.endpoint+knee.query)).json() as any;
    assert.deepEqual(kneeAfter.history.map((r:any)=>r.version),[2,1]);
    assert.equal(kneeAfter.history[0].status,'approved');assert.equal(kneeAfter.history[1].status,'draft');
    for(const other of ['b','c'])assert.equal(((await (await call(knee.endpoint+knee.query,other)).json()) as any).history.length,0);
    const foot=seed.foot;
    assert.equal(foot.depthRevision,'um-foot-depth-20261005-v1');
    assert.equal(foot.payload.draft.checks['foot-depth'],false);
    assert.equal(foot.payload.draft.checks['calf-depth'],undefined);
    assert.equal(foot.payload.draft.checks['thigh-depth'],undefined);
    assert.equal((await call(foot.endpoint,null,foot.payload)).status,401);
    const beforeFoot=JSON.parse(readFileSync('tests/atlas-foot-depth-baseline.json','utf8')).packets
      .find((packet:any)=>packet.key===foot.payload.specimenKey+'|'+foot.payload.structureId);
    assert(beforeFoot,'actual pre-import intrinsic-foot context');
    assert.notEqual(beforeFoot.teachingRevision,foot.payload.revisionHash);
    const countBeforeFoot=await db.prepare('SELECT COUNT(*) AS n FROM atlas_personal_specimen_review_events').first<{n:number}>();
    for(const patch of [{revisionHash:beforeFoot.teachingRevision},{materialHash:beforeFoot.materialHash},{sourceFrame:'foreign-frame'}]) {
      assert.equal((await call(foot.endpoint,'a',{...foot.payload,...patch})).status,409);
      assert.deepEqual(await db.prepare('SELECT COUNT(*) AS n FROM atlas_personal_specimen_review_events').first<{n:number}>(),countBeforeFoot,'stale or foreign foot teaching cannot append history');
    }
    foot.payload.draft.notes='Synthetic intrinsic-foot persistence; not clinical approval.';
    const footSaved=await call(foot.endpoint,'a',foot.payload);
    assert.equal(footSaved.status,201,await footSaved.clone().text());
    const footDraft=await footSaved.json() as any;
    assert.equal(footDraft.review.material.teachingTabs.length,11);
    assert(footDraft.review.material.teachingTabs.includes('foot-depth'));
    assert(!footDraft.review.material.teachingTabs.includes('thigh-depth'));
    const footHistory=await (await call(foot.endpoint+foot.query)).json() as any;
    assert.equal(footHistory.history[0].status,'draft');
    assert.equal(footHistory.history[0].notes,foot.payload.draft.notes);
    assert.equal(footHistory.history[0].checks['foot-depth'],false);
    assert.equal(footHistory.history[0].revisionHash,foot.payload.revisionHash);
    assert.equal((await call(foot.endpoint,'a',foot.payload)).status,409);
    const footApproval={...foot.payload,expectedVersion:1,draft:{...foot.payload.draft,status:'approved',
      reviewer:'SOFTWARE TEST ONLY',qualification:'Not radiologist sign-off',scope:'Synthetic exact-source intrinsic-foot teaching check',
      attested:true,checks:Object.fromEntries(Object.keys(foot.payload.draft.checks).map(id=>[id,true])),
      evidence:[{title:'Synthetic fixture',url:'https://example.test/fixture',note:'Not clinical evidence'}]}};
    for(const draft of [{...footApproval.draft,checks:{...footApproval.draft.checks,'foot-depth':false}},{...footApproval.draft,attested:false}]) {
      assert.equal((await call(foot.endpoint,'a',{...footApproval,draft})).status,422);
      assert.equal((await db.prepare('SELECT COUNT(*) AS n FROM atlas_personal_specimen_review_events').first<{n:number}>())?.n,countBeforeFoot!.n+1,'failed approval cannot append history');
    }
    const footApproved=await call(foot.endpoint,'a',footApproval);
    assert.equal(footApproved.status,201,await footApproved.clone().text());
    const footAfter=await (await call(foot.endpoint+foot.query)).json() as any;
    assert.deepEqual(footAfter.history.map((r:any)=>r.version),[2,1]);
    assert.equal(footAfter.history[0].status,'approved');assert.equal(footAfter.history[1].status,'draft');
    assert.equal(footAfter.history[1].notes,foot.payload.draft.notes);
    assert.equal(footAfter.history[0].material.teachingTabs.length,11);
    for(const other of ['b','c'])assert.equal(((await (await call(foot.endpoint+foot.query,other)).json()) as any).history.length,0);
    assert.equal(seed.csf.length,8,'four spaces, explicit display and teaching scopes');
    const priorCSF=JSON.parse(readFileSync('tests/atlas-csf-motion-baseline.json','utf8'));
    assert.equal(priorCSF.atlasSource,'9fcf6007719b78c83979a1fbfbca0e4eadbcc42b','immutable historical fixture, not current delivery pin');
    for(const item of seed.csf) {
      const p=item.payload,track=p.track;
      assert.equal(item.motion.markerCount,160);assert.equal(item.motion.periodSeconds,4);
      assert.equal(item.guideSteps,5);assert.equal(item.motion.status,'draft');
      assert.match(item.motion.limitation,/not measured physiology/u);
      assert.equal(p.draft.checks['csf-motion'],false);
      if(track==='teaching')assert.equal(p.draft.checks['guided-learning'],false);
      const prior=priorCSF.contexts.find((row:any)=>row.context.structureId===p.structureId)?.context;
      assert(prior,'exact pre-import ventricular context');
      assert.notEqual(prior.revisions[track],p.revisionHash);
      assert.equal((await call(item.endpoint,null,p)).status,401);
      const before=await db.prepare('SELECT COUNT(*) AS n FROM atlas_personal_nested_review_events').first<{n:number}>();
      for(const patch of [{revisionHash:prior.revisions[track]},{materialHash:prior.materialHash},{sourceFrame:'foreign-frame'}]) {
        assert.equal((await call(item.endpoint,'a',{...p,...patch})).status,409);
        assert.deepEqual(await db.prepare('SELECT COUNT(*) AS n FROM atlas_personal_nested_review_events').first<{n:number}>(),before,
          'stale CSF/walkthrough or foreign frame must refuse before storage');
      }
      p.draft.notes='Synthetic schematic CSF persistence; not radiologist sign-off.';
      const saved=await call(item.endpoint,'a',p);
      assert.equal(saved.status,201,await saved.clone().text());
      const record=await saved.json() as any;
      assert.equal(record.review.status,'draft');
      assert.equal(record.review.material.materialHash,p.materialHash);
      assert.equal(record.review.checks['csf-motion'],false);
      if(track==='teaching')assert.equal(record.review.material.teachingTabs.length,9,'eight earlier topics plus guided learning; CSF is a checklist, not another tab');
      const history=await (await call(item.endpoint+item.query)).json() as any;
      assert.equal(history.history.length,1);assert.equal(history.history[0].notes,p.draft.notes);
      assert.equal(history.history[0].revisionHash,p.revisionHash);
      assert.equal(history.history[0].checks['csf-motion'],false);
      assert.equal((await call(item.endpoint,'a',p)).status,409,'append-only optimistic conflict');
      const complete=item.complete;
      assert.equal(complete.evidence[0].url,'https://example.test/csf-fixture');
      const refusals=[{...complete,checks:{...complete.checks,'csf-motion':false}},{...complete,attested:false},
        ...(track==='teaching'?[{...complete,checks:{...complete.checks,'guided-learning':false}}]:[])];
      for(const draft of refusals) {
        const refused=await call(item.endpoint,'a',{...p,expectedVersion:1,draft});
        assert.equal(refused.status,422);
        assert.match(JSON.stringify(await refused.json()),draft.attested?/Complete every checklist item/u:/Confirm you personally performed the review/u,
          'refusal must name the flipped safeguard, not an unrelated invalid input');
        assert.equal((await db.prepare('SELECT COUNT(*) AS n FROM atlas_personal_nested_review_events').first<{n:number}>())?.n,before!.n+1,
          'unchecked illustration/walkthrough/attestation cannot append approval');
      }
      for(const other of ['b','c'])assert.equal(((await (await call(item.endpoint+item.query,other)).json()) as any).history.length,0,
        'CSF review remains private to account and institution');
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
      const expectedCount=table==='atlas_personal_specimen_review_events'?13:table==='atlas_personal_nested_review_events'?11:3;
      assert.equal((await db.prepare(`SELECT COUNT(*) AS n FROM ${table}`).first<{n:number}>())?.n,expectedCount,
        'original three events per scope plus two each calf, thigh, deep-hip, knee and foot and eight draft-only ventricular scope events');
      const row=await db.prepare(`SELECT user_id FROM ${table} LIMIT 1`).first<{user_id:string}>();
      assert.deepEqual(JSON.parse(row!.user_id),['vm-website-personal-review-1','edu:a','org-a']);
    }
  } finally { await mf.dispose(); }
});
