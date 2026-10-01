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
      "export * from './lib/specimen-review';export * from './lib/specimen-review-material';export * from './lib/specimen-review-client';export * from './lib/specimen-review-api';export * from './lib/specimen-review-store';",
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
let contexts = 0,
  teachingReady = 0,
  pending = 0;
const hashes = new Set();
for (const group of api.specimenReviewRows)
  for (const row of group.surfaces) {
    const p = await api.specimenReviewMaterial(group.key, row.id),
      c = p.context;
    assert.equal(c.structureId, row.id);
    assert.equal(c.specimenKey, group.key);
    assert.equal(c.catalogScope, "independent-specimen");
    assert.equal(c.sourceFrame, p.source.catalogue.sourceFrame);
    assert.equal(c.revisions.imaging, null);
    assert.equal(p.source.structure.id, row.id);
    hashes.add(c.materialHash);
    contexts++;
    teachingReady += c.blockers.teaching.length === 0 ? 1 : 0;
    pending += p.teaching.topics.filter((t) => t.body === null).length;
    for (const t of api.specimenReviewTracks)
      assert(
        api.specimenApprovalProblems(api.blankSpecimenReview(c, t), c, t)
          .length,
      );
    assert.equal(
      await api.specimenReviewMaterial(group.key, row.id + "-invalid"),
      null,
    );
    const other = api.specimenReviewRows.find((r) => r.key !== group.key);
    const otherMaterial = await api.specimenReviewMaterial(other.key, row.id);
    const sharedUreter = ['right','left'].some(side => row.id === 'vm:reference:hra-united-female-v1-10:kidneys:'+side+'-ureter');
    if (sharedUreter && [group.key, other.key].every(key => ['hra-united-female-v1.10-kidneys','hra-united-female-v1.10-pelvis'].includes(key))) {
      assert(otherMaterial);
      assert.notEqual(otherMaterial.context.materialHash,c.materialHash);
      assert.notEqual(otherMaterial.context.revisions.geometry,c.revisions.geometry);
      for(const track of api.specimenReviewTracks)
        assert(api.specimenApprovalProblems(api.blankSpecimenReview(c,track),otherMaterial.context,track).length);
    } else assert(otherMaterial === null, 'Foreign source must not acquire review material');
  }
assert.equal(contexts, 356);
assert.equal(hashes.size, 356);
// Back-topic completion adds ten software prerequisites to the saved342.
// The full356 back transition test separately proves this exact change.
// Populated draft topics are not clinical approval.
// Renal completion fills94 topic slots without clearing more prerequisites.
assert.equal(teachingReady, 352);
for (const key of ["", "__proto__", "body-display-catalog", "shoulder-pilot"])
  assert.equal(await api.specimenReviewMaterial(key, "unknown"), null);
const group = api.specimenReviewRows[0],
  id = group.surfaces[0].id;
const packet = await api.specimenReviewMaterial(group.key, id),
  c = packet.context;
const modified = structuredClone(packet);
modified.source.structure.name = "Changed";
modified.teaching.topics[0].body = "Changed";
assert.deepEqual(await api.specimenReviewMaterial(group.key, id), packet);
for (const model of ["hra-renal", "hra-pelvis"]) {
  const raw = JSON.parse(
    await readFile(
      new URL(`../public/models/${model}/catalog.json`, import.meta.url),
      "utf8",
    ),
  );
  for (const bundle of raw.bundles) {
    const bytes = await readFile(
      new URL("../public" + bundle.url, import.meta.url),
    );
    assert.equal(
      createHash("sha256").update(bytes).digest("hex"),
      bundle.sha256,
    );
  }
}
const sqlite = new DatabaseSync(":memory:");
for (const name of ["0000_shoulder_review_events", "0001_body_review_events"]) {
  const path = `drizzle/${name}.sql`,
    bytes = await readFile(new URL("../" + path, import.meta.url));
  const prior = execFileSync(
    "git",
    ["show", `bc36e110fda43e394f3811676626f42fc0ec6b2f:${path}`],
    { cwd: root },
  );
  assert.equal(
    bytes.toString().replaceAll("\r\n", "\n"),
    prior.toString().replaceAll("\r\n", "\n"),
  );
  sqlite.exec(bytes.toString());
}
sqlite.exec(
  "INSERT INTO review_events VALUES('sentinel','existing','geometry',1,'{}','unchanged'); INSERT INTO body_review_events VALUES('sentinel','existing','geometry',1,'{}','unchanged');",
);
sqlite.exec(
  await readFile(
    new URL("../drizzle/0002_specimen_review_events.sql", import.meta.url),
    "utf8",
  ),
);
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
    `${origin}/api/specimen-review?specimenKey=${encodeURIComponent(c.specimenKey)}&structureId=${encodeURIComponent(id)}&track=${track}${tail}`,
    { headers: user ? { "oai-authenticated-user-id": user } : {} },
  );
const fixture = (track) => ({
  ...api.blankSpecimenReview(c, track),
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
  specimenKey: c.specimenKey,
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
  new Request(origin + "/api/specimen-review", {
    method: "POST",
    headers: {
      Origin: origin,
      "Content-Type": "application/json",
      ...(user ? { "oai-authenticated-user-id": user } : {}),
      ...headers,
    },
    body: typeof value === "string" ? value : JSON.stringify(value),
  });
assert.equal((await api.getSpecimenReviews(get(""), db)).status, 401);
assert.equal(
  (await api.postSpecimenReview(post(payload(), ""), db)).status,
  401,
);
assert.equal(
  (
    await api.postSpecimenReview(
      post(payload(), "TEST_A", { Origin: "https://evil.test" }),
      db,
    )
  ).status,
  403,
);
assert.equal(
  (
    await api.postSpecimenReview(
      post(payload(), "TEST_A", { "sec-fetch-site": "cross-site" }),
      db,
    )
  ).status,
  403,
);
assert.equal(
  (
    await api.postSpecimenReview(
      post(payload(), "TEST_A", { "Content-Type": "text/plain" }),
      db,
    )
  ).status,
  415,
);
assert.equal((await api.postSpecimenReview(post("{"), db)).status, 400);
assert.equal(
  (await api.postSpecimenReview(post("x".repeat(32001)), db)).status,
  413,
);
assert.equal((await api.getSpecimenReviews(get(), undefined)).status, 503);
for (const tail of [
  "&before=0",
  "&before=2147483649",
  "&track=teaching",
  "&specimenKey=bad",
  "&structureId=bad",
])
  assert.equal(
    (await api.getSpecimenReviews(get("TEST_A", tail), db)).status,
    400,
  );
for (const patch of [
  { catalogScope: "body-display-catalog" },
  { track: "bad" },
  { expectedVersion: -1 },
  { expectedVersion: 2147483647 },
])
  assert.equal(
    (await api.postSpecimenReview(post({ ...payload(), ...patch }), db)).status,
    400,
  );
for (const patch of [
  { sourceFrame: "other-frame" },
  { materialHash: "0".repeat(64) },
  { revisionHash: null },
  { checklistVersion: "old" },
])
  assert.equal(
    (await api.postSpecimenReview(post({ ...payload(), ...patch }), db)).status,
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
      await api.postSpecimenReview(
        post(payload(0, "geometry", { ...fixture("geometry"), ...patch })),
        db,
      )
    ).status,
    422,
  );
assert.equal(
  (await api.postSpecimenReview(post(payload(0, "imaging")), db)).status,
  422,
);
const response = await api.postSpecimenReview(post(), db);
assert.equal(response.status, 201);
assert.match(response.headers.get("cache-control"), /private, no-store/);
const saved = (await response.json()).review;
assert.equal(saved.version, 1);
assert.equal((await api.postSpecimenReview(post(), db)).status, 409);
assert.equal(
  (await api.getSpecimenReviews(get("TEST_B"), db).then((r) => r.json()))
    .history.length,
  0,
);
assert.equal(
  (await api.postSpecimenReview(post(payload(), "TEST_B"), db)).status,
  201,
);
assert.equal(
  (await api.postSpecimenReview(post(payload(0, "teaching")), db)).status,
  201,
);
const returned = await api.getSpecimenReviews(get(), db).then((r) => r.json());
assert.equal(
  api.parseSpecimenHistory(returned, c, "geometry").history[0].version,
  1,
);
assert.equal(api.specimenDecisionLabel(saved, c), "Approval recorded");
for (const patch of [
  { sourceFrame: "changed" },
  { specimenKey: "other" },
  { structureId: "other" },
  { checklistVersion: "old" },
  { revisions: { ...c.revisions, geometry: "0".repeat(64) } },
])
  assert(api.specimenReviewStale(saved, { ...c, ...patch }));
const old = { ...saved, revisionHash: "0".repeat(64) };
assert(
  Object.values(api.specimenDraftFromSaved(old, c, "geometry").checks).every(
    (v) => v === false,
  ),
);
assert.equal(api.specimenDraftFromSaved(saved, c, "geometry").attested, false);
for (const mutate of [
  (v) => (v.scope = "public"),
  (v) => (v.context = { ...c, sourceFrame: "other" }),
  (v) => (v.history[0].specimenKey = "other"),
  (v) => v.history.push(v.history[0]),
  (v) => (v.nextBefore = 99),
]) {
  const v = structuredClone(returned);
  mutate(v);
  assert.throws(() => api.parseSpecimenHistory(v, c, "geometry"));
}
for (const patch of [
  { eventSchema: "vm-body-review-event-1" },
  { catalogScope: "body-display-catalog" },
  { savedAt: "not-a-date" },
  { version: 0 },
  { reviewedAt: null },
  { attested: false },
])
  assert.throws(() => api.parseSavedSpecimenReview({ ...saved, ...patch }));
const issue = {
  id: "keep",
  title: "Synthetic correction",
  severity: "major",
  resolved: false,
  resolution: "",
};
assert.equal(
  (
    await api.postSpecimenReview(
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
assert.equal((await api.postSpecimenReview(post(payload(2)), db)).status, 422);
const resolved = {
  ...issue,
  resolved: true,
  resolution: "Test resolution only",
};
assert.equal(
  (
    await api.postSpecimenReview(
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
      await api.postSpecimenReview(
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
const page = await api.getSpecimenReviews(get(), db).then((r) => r.json());
assert.equal(page.history.length, 20);
assert.equal(page.nextBefore, 3);
const older = await api
  .getSpecimenReviews(get("TEST_A", "&before=3"), db)
  .then((r) => r.json());
assert.equal(older.history.length, 2);
assert.equal(
  api.parseSpecimenHistory(older, c, "geometry", 3).nextBefore,
  null,
);
const next = { ...page.history[0], version: 23 };
assert.deepEqual(
  await Promise.all([
    api.appendSpecimenReview(db, "TEST_A", next, 22),
    api.appendSpecimenReview(db, "TEST_A", next, 22),
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
    "EXPLAIN QUERY PLAN SELECT payload FROM specimen_review_events WHERE user_id=? AND specimen_key=? AND structure_id=? AND track=? AND version<? ORDER BY version DESC LIMIT 20",
  )
  .all("TEST_A", c.specimenKey, id, "geometry", 24);
assert(plan.some((x) => /USING INDEX/.test(x.detail)));
const bundle = await componentBuild({
  entryPoints: ["app/review/specimens/workspace.tsx"],
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
// Renal and pelvic topics are populated. Preserve pending-state coverage using
// the explicit still-incomplete UM knee femur, not a fabricated missing topic.
const pendingGroup = api.specimenReviewRows.find(row => row.key === 'um-5t6tz7-v1-2:knee');
assert(pendingGroup);
const pendingPacket = await api.specimenReviewMaterial(pendingGroup.key, 'vm:reference:um-5t6tz7-v1-2:knee:femur');
assert(pendingPacket.teaching.topics.some(topic => topic.body === null));
for (const p of [null, packet, pendingPacket]) {
  const html = renderToStaticMarkup(
    React.createElement(module.exports.SpecimenReviewWorkspace, {
      rows: api.specimenReviewRows,
      packet: p,
      invalid: false,
    }),
  );
  assert.match(html, /Find a structure/);
  assert.match(html, /HRA kidneys and female pelvis/);
  if (p) {
    assert.match(html, /Private history not loaded/);
    assert.match(html, /<fieldset disabled/);
    assert.match(html, /Export unsigned worksheet/);
    if (p === pendingPacket) assert.match(html, /Pending — no authored topic/);
    else {
      assert(p.teaching.topics.every(topic => typeof topic.body === 'string'));
      assert(!html.includes('Pending — no authored topic'));
    }
    assert(!html.includes("Approval recorded"));
  }
}
sqlite.close();
const report = {
  schemaVersion: 1,
  scope: "independent-specimen-review-software-only",
  specimens: api.specimenReviewRows.map((r) => ({
    key: r.key,
    selections: r.surfaces.length,
  })),
  contexts,
  teachingApprovalPrerequisitesPresent: teachingReady,
  pendingTopicStates: pending,
  checks: [
    "exact source/frame separation",
    `${contexts} unique regional/specimen material identities`,
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
  new URL("../docs/specimen-review-validation.json", import.meta.url),
  JSON.stringify(report, null, 2) + "\n",
);
console.log(JSON.stringify(report));
