import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import vm from "node:vm";
import { fileURLToPath } from "node:url";
import { build } from "./workspace-test-build.mjs";
import { build as componentBuild } from "./workspace-component-test-build.mjs";
const root = fileURLToPath(new URL("../", import.meta.url));
const result = await build({
  stdin: {
    contents:
      "export * from './lib/nested-review';export * from './lib/nested-review-material';export * from './lib/nested-review-client';export * from './lib/nested-review-api';export * from './lib/nested-review-store';export {nestedTeachingReferences} from './lib/nested-teaching';export {canonicalSpecimenValue} from './lib/specimen-links';",
    resolveDir: root,
    loader: "ts",
  },
  bundle: true,
  format: "esm",
  platform: "node",
  write: false,
});
const api = await import(
  `data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}`
);
const extra=await build({stdin:{contents:"export {bodyDisplayCatalog} from './lib/body-display-catalog';export {nestedStudyTargets} from './lib/nested-anatomy';export {parseStudyLink,resolveStudyLink} from './lib/study-links';export {nestedReviewHref} from './lib/nested-review-links';",resolveDir:root,loader:'ts'},bundle:true,format:'esm',platform:'node',write:false});
const nav=await import('data:text/javascript;base64,'+Buffer.from(extra.outputFiles[0].text).toString('base64'));
const catalog=nav.bodyDisplayCatalog(JSON.parse(await readFile(new URL('../public/models/bodyparts3d/full-body/catalog.json',import.meta.url),'utf8')));
const targets=nav.nestedStudyTargets(catalog),hashes=new Set(),packets=[];
let contexts=0,teachingReady=0,pending=0;
for(const group of api.nestedReviewRows)for(const row of group.surfaces){
 const p=await api.nestedReviewMaterial(group.key,row.id),c=p.context;
 const target=targets.find(t=>t.parentId===p.source.parent.id&&t.study===p.source.study&&t.structureId===row.id);
 assert(target);assert.equal(c.structureId,row.id);assert.equal(c.nestedKey,group.key);
 assert.equal(c.catalogScope,'nested-dissection');assert.equal(c.sourceFrame,p.source.sourceFrame);
 assert.equal(p.source.childBundleHash,target.sourceHash);assert.equal(p.source.parentBundle.sha256,target.parentHash);
 assert.equal(c.revisions.imaging,null);assert.equal(p.source.structure.id,row.id);assert(p.atlasLink);
 const url=new URL(p.atlasLink,'https://atlas.test'),region=p.source.parent.region;
 assert.equal(nav.resolveStudyLink(catalog,region,nav.parseStudyLink(Object.fromEntries(url.searchParams))).status,'ready');
 for(const key of ['source','partSource']){const changed=new URL(url);changed.searchParams.set(key,'0'.repeat(64));assert.notEqual(nav.resolveStudyLink(catalog,region,nav.parseStudyLink(Object.fromEntries(changed.searchParams))).status,'ready');}
 const href=nav.nestedReviewHref(p.source.parent,p.source.study,p.source.structure);assert(href);assert.equal(new URL(href,'https://atlas.test').searchParams.get('source'),c.sourceHash);
 assert.equal(nav.nestedReviewHref({...p.source.parent,name:'foreign'},p.source.study,p.source.structure),null);
 const used=new Set([...p.teaching.topics.flatMap(t=>t.references),...(p.teaching.lesson?.extended.selfCheck.references??[])]);
 assert(Object.keys(p.teaching.referenceTitles).every(url=>used.has(url)));
 assert.equal(nav.nestedReviewHref(p.source.parent,p.source.study,{...p.source.structure,name:'foreign'}),null);
 assert.equal(await api.nestedReviewMaterial(group.key,row.id+'-invalid'),null);
 for(const other of api.nestedReviewRows.filter(r=>r.key!==group.key&&!r.surfaces.some(s=>s.id===row.id)).slice(0,2))assert.equal(await api.nestedReviewMaterial(other.key,row.id),null);
 for(const track of api.nestedReviewTracks)assert(api.nestedApprovalProblems(api.blankNestedReview(c,track),c,track).length);
 const copy=structuredClone(p);copy.source.structure.name='foreign';copy.teaching.topics[0].body='foreign';
 assert.deepEqual(await api.nestedReviewMaterial(group.key,row.id),p);
 hashes.add(c.materialHash);packets.push(p);contexts++;teachingReady+=c.blockers.teaching.length===0?1:0;pending+=p.teaching.topics.filter(t=>t.readiness==='pending').length;
 assert.deepEqual(await api.nestedReviewSelection(group.key,row.id,c.sourceHash),p);
 for(const bad of [undefined,null,'','0'.repeat(64),[c.sourceHash]])assert.equal(await api.nestedReviewSelection(group.key,row.id,bad),null);
 const sourceDigest=v=>createHash('sha256').update(api.canonicalSpecimenValue(JSON.parse(JSON.stringify(v)))).digest('hex');
 assert.equal(sourceDigest(p.source),c.sourceHash);
 for(const mutate of [v=>v.parent.name+=' foreign',v=>v.parentBundle.sha256='0'.repeat(64),v=>v.coordinateSystem.unitsPerMillimetre+=0.001]){
  const changed=structuredClone(p.source);mutate(changed);const token=sourceDigest(changed);
  assert.notEqual(token,c.sourceHash);assert.equal(await api.nestedReviewSelection(group.key,row.id,token),null);
 }
}
assert.equal(contexts,targets.length);assert(contexts>100);assert.equal(hashes.size,contexts);assert(teachingReady>0);assert(pending>0);
const bundleIndex=new Map();
for(const path of execFileSync('git',['ls-files','public/models'],{cwd:root,encoding:'utf8'}).trim().split(/\r?\n/).filter(p=>p.endsWith('/catalog.json'))){
 const data=JSON.parse(await readFile(new URL('../'+path,import.meta.url),'utf8'));
 for(const b of data.bundles??[])if(b.url&&b.sha256)bundleIndex.set(b.sha256,b);
}
const verifiedBundles=new Set();
for(const p of packets)bundleIndex.set(p.source.parentBundle.sha256,p.source.parentBundle);
for(const p of packets)for(const sha of [p.source.parentBundle.sha256,p.source.childBundleHash]){
 if(verifiedBundles.has(sha))continue;
 const b=bundleIndex.get(sha);assert(b,'Missing public source bundle '+sha);
 const path=b.url.split('?')[0];assert(path.startsWith('/models/')&&!path.includes('..'));
 const bytes=await readFile(new URL('../public'+path,import.meta.url));
 assert.equal(createHash('sha256').update(bytes).digest('hex'),sha);assert.equal(bytes.length,b.bytes);
 verifiedBundles.add(sha);
}
for(const key of ['', '__proto__','body-display-catalog','shoulder-pilot','independent-specimen','["foreign","eye"]'])assert.equal(await api.nestedReviewMaterial(key,'unknown'),null);
const packet=packets.find(p=>p.context.blockers.teaching.length===0),c=packet.context,id=c.structureId;
const unusedRef=Object.values(api.nestedTeachingReferences).find(r=>!Object.hasOwn(packet.teaching.referenceTitles,r.url));
assert(unusedRef);const unusedTitle=unusedRef.title;unusedRef.title+=' unrelated edit';
assert.equal((await api.nestedReviewMaterial(c.nestedKey,id)).context.teachingHash,c.teachingHash);unusedRef.title=unusedTitle;
const usedRef=Object.values(api.nestedTeachingReferences).find(r=>Object.hasOwn(packet.teaching.referenceTitles,r.url));
assert(usedRef);const usedTitle=usedRef.title;usedRef.title+=' relevant edit';
assert.notEqual((await api.nestedReviewMaterial(c.nestedKey,id)).context.teachingHash,c.teachingHash);usedRef.title=usedTitle;
const sqlite=new DatabaseSync(':memory:');
for(const name of ['0000_shoulder_review_events','0001_body_review_events','0002_specimen_review_events']){
 const path='drizzle/'+name+'.sql',bytes=await readFile(new URL('../'+path,import.meta.url));
 const prior=execFileSync('git',['show','74f8b43097e547c0acd83412ff452ae3d00e6163:'+path],{cwd:root});
 assert.equal(bytes.toString().replaceAll('\r\n','\n'),prior.toString().replaceAll('\r\n','\n'));sqlite.exec(bytes.toString());
}
sqlite.exec("INSERT INTO review_events VALUES('sentinel','existing','geometry',1,'{}','unchanged'); INSERT INTO body_review_events VALUES('sentinel','existing','geometry',1,'{}','unchanged'); INSERT INTO specimen_review_events VALUES('sentinel','existing','existing','geometry',1,'{}','unchanged');");
sqlite.exec(await readFile(new URL('../drizzle/0003_nested_review_events.sql',import.meta.url),'utf8'));
const db = {
  prepare(sql) {
    return {
      bind(...values) {
        return {
          async all() {
            return { results: sqlite.prepare(sql).all(...values) };
          },
          async run() {
            return {
              meta: {
                changes: Number(sqlite.prepare(sql).run(...values).changes),
              },
            };
          },
        };
      },
    };
  },
};
const origin = "https://atlas.test";
const get = (user = "TEST_A", tail = "", track = "geometry") =>
  new Request(
    `${origin}/api/nested-review?nestedKey=${encodeURIComponent(c.nestedKey)}&structureId=${encodeURIComponent(id)}&track=${track}${tail}`,
    { headers: user ? { "oai-authenticated-user-id": user } : {} },
  );
const fixture = (track) => ({
  ...api.blankNestedReview(c, track),
  reviewer: "SOFTWARE TEST ONLY",
  qualification: "Not clinical sign-off",
  scope: "Synthetic software validation only",
  checks: Object.fromEntries(c.checklists[track].map((x) => [x.id, true])),
  evidence: [
    {
      title: "Synthetic fixture",
      url: "https://example.com/test",
      note: "Not clinical evidence",
    },
  ],
  attested: true,
  status: "approved",
});
const payload = (
  expectedVersion = 0,
  track = "geometry",
  draft = fixture(track),
) => ({
  catalogScope: c.catalogScope,
  nestedKey: c.nestedKey,
  sourceFrame: c.sourceFrame,
  structureId: id,
  track,
  expectedVersion,
  materialHash: c.materialHash,
  revisionHash: c.revisions[track],
  checklistVersion: c.checklistVersion,
  draft,
});
const post = (value = payload(), user = "TEST_A", headers = {}) =>
  new Request(origin + "/api/nested-review", {
    method: "POST",
    headers: {
      Origin: origin,
      "Content-Type": "application/json",
      ...(user ? { "oai-authenticated-user-id": user } : {}),
      ...headers,
    },
    body: typeof value === "string" ? value : JSON.stringify(value),
  });
assert.equal((await api.getNestedReviews(get(""), db)).status, 401);
assert.equal(
  (await api.postNestedReview(post(payload(), ""), db)).status,
  401,
);
assert.equal(
  (
    await api.postNestedReview(
      post(payload(), "TEST_A", { Origin: "https://evil.test" }),
      db,
    )
  ).status,
  403,
);
assert.equal(
  (
    await api.postNestedReview(
      post(payload(), "TEST_A", { "sec-fetch-site": "cross-site" }),
      db,
    )
  ).status,
  403,
);
assert.equal(
  (
    await api.postNestedReview(
      post(payload(), "TEST_A", { "Content-Type": "text/plain" }),
      db,
    )
  ).status,
  415,
);
assert.equal((await api.postNestedReview(post("{"), db)).status, 400);
assert.equal(
  (await api.postNestedReview(post("x".repeat(32001)), db)).status,
  413,
);
assert.equal((await api.getNestedReviews(get(), undefined)).status, 503);
for (const tail of [
  "&before=0",
  "&before=2147483649",
  "&track=teaching",
  "&nestedKey=bad",
  "&structureId=bad",
])
  assert.equal(
    (await api.getNestedReviews(get("TEST_A", tail), db)).status,
    400,
  );
for (const patch of [
  { catalogScope: "body-display-catalog" },
  { track: "bad" },
  { expectedVersion: -1 },
  { expectedVersion: 2147483647 },
])
  assert.equal(
    (await api.postNestedReview(post({ ...payload(), ...patch }), db)).status,
    400,
  );
for (const patch of [
  { sourceFrame: "other-frame" },
  { materialHash: "0".repeat(64) },
  { revisionHash: null },
  { checklistVersion: "old" },
])
  assert.equal(
    (await api.postNestedReview(post({ ...payload(), ...patch }), db)).status,
    409,
  );
for (const patch of [
  { attested: false },
  { checks: {} },
  { reviewer: "" },
  { evidence: [] },
  { scope: "short" },
  {
    issues: [
      {
        id: "x",
        title: "Open",
        severity: "major",
        resolved: false,
        resolution: "",
      },
    ],
  },
])
  assert.equal(
    (
      await api.postNestedReview(
        post(payload(0, "geometry", { ...fixture("geometry"), ...patch })),
        db,
      )
    ).status,
    422,
  );
assert.equal(
  (await api.postNestedReview(post(payload(0, "imaging")), db)).status,
  400,
);
assert.equal((await api.getNestedReviews(get('TEST_A','','imaging'),db)).status,400);
assert.equal((await api.postNestedReview(post(payload(0,'imaging',{...fixture('imaging'),status:'draft'})),db)).status,400);
for(const p of packets.filter(p=>p.context.blockers.teaching.length)){const x=p.context;const bad={...payload(0,'teaching'),nestedKey:x.nestedKey,structureId:x.structureId,sourceFrame:x.sourceFrame,materialHash:x.materialHash,revisionHash:x.revisions.teaching};assert.equal((await api.postNestedReview(post(bad),db)).status,422);}
const response = await api.postNestedReview(post(), db);
assert.equal(response.status, 201);
assert.match(response.headers.get("cache-control"), /private, no-store/);
const saved = (await response.json()).review;
assert.equal(saved.version, 1);
assert.equal((await api.postNestedReview(post(), db)).status, 409);
assert.equal(
  (await api.getNestedReviews(get("TEST_B"), db).then((r) => r.json()))
    .history.length,
  0,
);
assert.equal(
  (await api.postNestedReview(post(payload(), "TEST_B"), db)).status,
  201,
);
assert.equal(
  (await api.postNestedReview(post(payload(0, "teaching")), db)).status,
  201,
);
const returned = await api.getNestedReviews(get(), db).then((r) => r.json());
assert.equal(
  api.parseNestedHistory(returned, c, "geometry").history[0].version,
  1,
);
assert.equal(api.nestedDecisionLabel(saved, c), "Approval recorded");
for (const patch of [
  { sourceFrame: "changed" },
  { nestedKey: "other" },
  { structureId: "other" },
  { checklistVersion: "old" },
  { revisions: { ...c.revisions, geometry: "0".repeat(64) } },
])
  assert(api.nestedReviewStale(saved, { ...c, ...patch }));
const old = { ...saved, revisionHash: "0".repeat(64) };
assert(
  Object.values(api.nestedDraftFromSaved(old, c, "geometry").checks).every(
    (v) => v === false,
  ),
);
assert.equal(api.nestedDraftFromSaved(saved, c, "geometry").attested, false);
for (const mutate of [
  (v) => (v.scope = "public"),
  (v) => (v.context = { ...c, sourceFrame: "other" }),
  (v) => (v.history[0].nestedKey = "other"),
  (v) => v.history.push(v.history[0]),
  (v) => (v.nextBefore = 99),
]) {
  const v = structuredClone(returned);
  mutate(v);
  assert.throws(() => api.parseNestedHistory(v, c, "geometry"));
}
for (const patch of [
  { eventSchema: "vm-body-review-event-1" },
  { catalogScope: "body-display-catalog" },
  { savedAt: "not-a-date" },
  { version: 0 },
  { reviewedAt: null },
  { attested: false },
])
  assert.throws(() => api.parseSavedNestedReview({ ...saved, ...patch }));
const issue = {
  id: "keep",
  title: "Synthetic correction",
  severity: "major",
  resolved: false,
  resolution: "",
};
assert.equal(
  (
    await api.postNestedReview(
      post(
        payload(1, "geometry", {
          ...fixture("geometry"),
          status: "changes-required",
          issues: [issue],
        }),
      ),
      db,
    )
  ).status,
  201,
);
assert.equal((await api.postNestedReview(post(payload(2)), db)).status, 422);
const resolved = {
  ...issue,
  resolved: true,
  resolution: "Test resolution only",
};
assert.equal(
  (
    await api.postNestedReview(
      post(
        payload(2, "geometry", { ...fixture("geometry"), issues: [resolved] }),
      ),
      db,
    )
  ).status,
  201,
);
for (let version = 3; version < 22; version++)
  assert.equal(
    (
      await api.postNestedReview(
        post(
          payload(version, "geometry", {
            ...fixture("geometry"),
            status: "draft",
            issues: [resolved],
          }),
        ),
        db,
      )
    ).status,
    201,
  );
const page = await api.getNestedReviews(get(), db).then((r) => r.json());
assert.equal(page.history.length, 20);
assert.equal(page.nextBefore, 3);
const older = await api
  .getNestedReviews(get("TEST_A", "&before=3"), db)
  .then((r) => r.json());
assert.equal(older.history.length, 2);
assert.equal(
  api.parseNestedHistory(older, c, "geometry", 3).nextBefore,
  null,
);
const next = { ...page.history[0], version: 23 };
assert.deepEqual(
  await Promise.all([
    api.appendNestedReview(db, "TEST_A", next, 22),
    api.appendNestedReview(db, "TEST_A", next, 22),
  ]),
  [true, false],
);
assert.equal(
  sqlite
    .prepare("SELECT saved_at FROM review_events WHERE user_id='sentinel'")
    .get().saved_at,
  "unchanged",
);
assert.equal(
  sqlite
    .prepare("SELECT saved_at FROM body_review_events WHERE user_id='sentinel'")
    .get().saved_at,
  "unchanged",
);
const plan = sqlite
  .prepare(
    "EXPLAIN QUERY PLAN SELECT payload FROM nested_review_events WHERE user_id=? AND nested_key=? AND structure_id=? AND track=? AND version<? ORDER BY version DESC LIMIT 20",
  )
  .all("TEST_A", c.nestedKey, id, "geometry", 24);
assert(plan.some((x) => /USING INDEX/.test(x.detail)));
const bundle = await componentBuild({
  entryPoints: ["app/review/nested/workspace.tsx"],
  bundle: true,
  format: "cjs",
  platform: "node",
  write: false,
});
const module = { exports: {} };
const require = createRequire(new URL("../package.json", import.meta.url));
vm.runInNewContext(bundle.outputFiles[0].text, {
  module,
  exports: module.exports,
  require,
  console,
  URL,
  TextEncoder,
  TextDecoder,
  setTimeout,
  clearTimeout,
  structuredClone,
});
const React = require("react"),
  { renderToStaticMarkup } = require("react-dom/server");
for (const p of [null, packet]) {
  const html = renderToStaticMarkup(
    React.createElement(module.exports.NestedReviewWorkspace, {
      rows: api.nestedReviewRows,
      packet: p,
      invalid: false,
    }),
  );
  assert.match(html, /Find a structure/);
  assert.match(html, /Each parent, dissection study and child/);
  if (p) {
    assert.match(html, /Private history not loaded/);
    assert.match(html, /<fieldset disabled/);
    assert.match(html, /Export unsigned worksheet/);
    assert.match(html, /Acquired imaging review is unavailable/);
    assert(!html.includes("Approval recorded"));
  }
}
assert.equal(sqlite.prepare("SELECT saved_at FROM specimen_review_events WHERE user_id='sentinel'").get().saved_at,'unchanged');
sqlite.close();
const report = {
  schemaVersion: 1,
  scope: "nested-dissection-review-software-only",
  nesteds: api.nestedReviewRows.map((r) => ({
    key: r.key,
    selections: r.surfaces.length,
  })),
  contexts,
  sourceBundlesVerified: verifiedBundles.size,
  teachingApprovalPrerequisitesPresent: teachingReady,
  pendingTopicStates: pending,
  checks: [
    "exact source/frame separation",
    "unique parent/study/child material identities",
    "original GLB hashes",
    "immutable prior migrations",
    "account isolation",
    "origin and body-size guards",
    "revision/checklist conflicts",
    "server-side approval gates",
    "imaging approval prohibited",
    "append-only issue/history retention",
    "optimistic concurrency",
    "paged indexed SQLite queries",
    "stale checks reset",
    "strict response parsing",
    "actual server-rendered workspace states",
  ],
  clinicalApproval: false,
  productionRecordsRead: false,
  browserOrGpuTesting: false,
};
await writeFile(
  new URL("../docs/nested-review-validation.json", import.meta.url),
  JSON.stringify(report, null, 2) + "\n",
);
console.log(JSON.stringify(report));
