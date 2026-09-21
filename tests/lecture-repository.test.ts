/* eslint-disable @typescript-eslint/no-explicit-any */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { DatabaseSync, type SQLInputValue, type StatementSync } from "node:sqlite";
import test from "node:test";
import ts from "typescript";

import * as lectureContent from "../lib/lecture-content.ts";
import * as lectureManifest from "../lib/lecture-manifest.ts";
import { LECTURE_SCHEMA } from "../db/lecture.ts";

const nodeRequire = createRequire(import.meta.url);

type BoundStatement = {
  statement: StatementSync;
  parameters: SQLInputValue[];
};

class D1Adapter {
  beforeBatch: (() => void) | null = null;
  readonly sqlite: DatabaseSync;

  constructor(sqlite: DatabaseSync) { this.sqlite = sqlite; }

  prepare(sql: string) {
    const statement = this.sqlite.prepare(sql);
    return {
      bind: (...parameters: SQLInputValue[]) => this.bound(statement, parameters),
      first: <T>() => (statement.get() as T | undefined) ?? null,
      all: <T>() => ({ results: statement.all() as T[] }),
      run: () => {
        const result = statement.run();
        return { meta: { changes: Number(result.changes) } };
      },
    };
  }

  private bound(statement: StatementSync, parameters: SQLInputValue[]) {
    const bound: BoundStatement = { statement, parameters };
    return Object.assign(bound, {
      first: <T>() => (statement.get(...parameters) as T | undefined) ?? null,
      all: <T>() => ({ results: statement.all(...parameters) as T[] }),
      run: () => {
        const result = statement.run(...parameters);
        return { meta: { changes: Number(result.changes) } };
      },
    });
  }

  async batch(statements: BoundStatement[]) {
    const hook = this.beforeBatch;
    this.beforeBatch = null;
    hook?.();
    this.sqlite.exec("BEGIN IMMEDIATE");
    try {
      const results = statements.map(({ statement, parameters }) => {
        const result = statement.run(...parameters);
        return { meta: { changes: Number(result.changes) } };
      });
      this.sqlite.exec("COMMIT");
      return results;
    } catch (error) {
      this.sqlite.exec("ROLLBACK");
      throw error;
    }
  }
}

type Auth = { userId: string; displayName: string };

const AUTHOR: Auth = { userId: "author-1", displayName: "Author One" };
const REVIEWER: Auth = { userId: "reviewer-1", displayName: "Reviewer One" };
const OTHER_AUTHOR: Auth = { userId: "other-author", displayName: "Other Author" };
const OTHER_ORG: Auth = { userId: "other-org", displayName: "Other Org" };
const LEARNER: Auth = { userId: "learner-1", displayName: "Learner One" };
const ATLAS_ONLY: Auth = { userId: "atlas-only", displayName: "Atlas Learner" };
const WORKBOOK_ID = "workbook:11111111-1111-4111-8111-111111111111";

const roles = new Map<string, string[]>([
  [AUTHOR.userId, ["instructor"]],
  [REVIEWER.userId, ["examiner"]],
  [OTHER_AUTHOR.userId, ["instructor"]],
  [OTHER_ORG.userId, ["instructor"]],
  [LEARNER.userId, ["learner"]],
  [ATLAS_ONLY.userId, ["learner"]],
]);

function compileCommonJs(path: string, mocks: Record<string, unknown>) {
  const source = readFileSync(new URL(path, import.meta.url), "utf8");
  const code = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
    },
  }).outputText;
  const compiledModule = { exports: {} as Record<string, any> };
  new Function("require", "module", "exports", code)(
    (name: string) => name in mocks ? mocks[name] : nodeRequire(name),
    compiledModule,
    compiledModule.exports,
  );
  return compiledModule.exports;
}

function schema(sqlite: DatabaseSync) {
  sqlite.exec(`
    PRAGMA foreign_keys=ON;
    CREATE TABLE users (id TEXT PRIMARY KEY, display_name TEXT NOT NULL);
    CREATE TABLE courses (id TEXT PRIMARY KEY, title TEXT NOT NULL);
    CREATE TABLE modules (id TEXT PRIMARY KEY, course_id TEXT NOT NULL);
    CREATE TABLE workbooks (id TEXT PRIMARY KEY, module_id TEXT NOT NULL, title TEXT NOT NULL, mode TEXT NOT NULL, version INTEGER NOT NULL, status TEXT NOT NULL);
    CREATE TABLE course_ownership (course_id TEXT NOT NULL, organization_id TEXT NOT NULL);
    CREATE TABLE workbook_authorship (workbook_id TEXT PRIMARY KEY, author_id TEXT NOT NULL);
    CREATE TABLE enrolments (course_id TEXT NOT NULL, user_id TEXT NOT NULL, status TEXT NOT NULL);
    CREATE TABLE workbook_assignments (id TEXT PRIMARY KEY, workbook_id TEXT NOT NULL, learner_id TEXT NOT NULL, status TEXT NOT NULL);
    CREATE TABLE workbook_assignment_rules (assignment_id TEXT PRIMARY KEY, available_from TEXT, expires_at TEXT, prerequisite_workbook_id TEXT, prerequisite_min_percent INTEGER);
    CREATE TABLE workbook_progress (workbook_id TEXT NOT NULL, learner_id TEXT NOT NULL, percent_complete INTEGER NOT NULL);
    CREATE TABLE cohorts (id TEXT PRIMARY KEY, course_id TEXT NOT NULL, status TEXT NOT NULL);
    CREATE TABLE cohort_members (cohort_id TEXT NOT NULL, learner_id TEXT NOT NULL, status TEXT NOT NULL);
    CREATE TABLE cohort_workbook_assignments (id TEXT PRIMARY KEY, cohort_id TEXT NOT NULL, workbook_id TEXT NOT NULL, status TEXT NOT NULL, available_from TEXT, expires_at TEXT, prerequisite_workbook_id TEXT, prerequisite_min_percent INTEGER);
    CREATE TABLE course_releases (id TEXT PRIMARY KEY, slug TEXT NOT NULL, status TEXT NOT NULL);
    CREATE TABLE course_release_workbooks (release_id TEXT NOT NULL, workbook_id TEXT NOT NULL);
  `);
  for (const statement of LECTURE_SCHEMA) sqlite.exec(statement);
  const insertUser = sqlite.prepare("INSERT INTO users VALUES (?,?)");
  for (const user of [AUTHOR, REVIEWER, OTHER_AUTHOR, OTHER_ORG, LEARNER, ATLAS_ONLY])
    insertUser.run(user.userId, user.displayName);
  sqlite.exec(`
    INSERT INTO courses VALUES ('course-1','Clinical anatomy');
    INSERT INTO modules VALUES ('module-1','course-1');
    INSERT INTO workbooks VALUES ('${WORKBOOK_ID}','module-1','Initial lecture','lecture',1,'draft');
    INSERT INTO course_ownership VALUES ('course-1','org-1');
    INSERT INTO workbook_authorship VALUES ('${WORKBOOK_ID}','${AUTHOR.userId}');
    INSERT INTO lecture_drafts VALUES ('${WORKBOOK_ID}','[]',NULL,'2026-09-21T00:00:00.000Z');
    INSERT INTO course_releases VALUES ('release-1','clinical-anatomy','published');
    INSERT INTO course_release_workbooks VALUES ('release-1','${WORKBOOK_ID}');
  `);
}

function harness() {
  const sqlite = new DatabaseSync(":memory:");
  schema(sqlite);
  const DB = new D1Adapter(sqlite);
  const envModule = { env: { DB } };
  const accessPolicy = { hasWorkbookStaffAccess: (userRoles: readonly string[]) => userRoles.some((role) => ["instructor", "examiner", "administrator"].includes(role)) };
  const workbookAccess = compileCommonJs("../lib/workbook-access.ts", {
    "cloudflare:workers": envModule,
    "@/lib/workbook-access-policy": accessPolicy,
  });
  const audits: string[] = [];
  const repository = compileCommonJs("../lib/lecture-repository.ts", {
    "cloudflare:workers": envModule,
    "@/db/bootstrap": {
      ensureEducationUser: async (auth: Auth) => ({ roles: roles.get(auth.userId) ?? [] }),
      appendAudit: async (_actor: string, action: string) => { audits.push(action); },
    },
    "@/db/platform": {
      getPlatformSnapshot: async (auth: Auth) => ({
        organization: { id: auth.userId === OTHER_ORG.userId ? "org-2" : "org-1" },
        entitlement: { studioAccess: true, atlasAccess: auth.userId === ATLAS_ONLY.userId },
      }),
    },
    "@/lib/workbook-access": workbookAccess,
    "@/lib/lecture-content": lectureContent,
    "@/lib/lecture-manifest": lectureManifest,
  });
  return { sqlite, DB, repository, audits };
}

const slide = {
  id: "slide-1",
  title: "Introduction",
  body: "A bounded education-only lecture slide.",
  referenceUrl: "https://example.edu/reference",
};

async function save(repository: any, auth: Auth, expectedVersion: number, title = "Saved lecture", slides = [slide]) {
  return repository.mutateLecture(auth, WORKBOOK_ID, { action: "save", id: WORKBOOK_ID, expectedVersion, title, slides });
}

async function publishFlow(repository: any) {
  await save(repository, AUTHOR, 1);
  await repository.mutateLecture(AUTHOR, WORKBOOK_ID, { action: "request-review", id: WORKBOOK_ID, expectedVersion: 2 });
  await repository.mutateLecture(REVIEWER, WORKBOOK_ID, { action: "review", id: WORKBOOK_ID, expectedVersion: 2, decision: "approved", comment: "Approved for education." });
  await repository.mutateLecture(AUTHOR, WORKBOOK_ID, { action: "publish", id: WORKBOOK_ID, expectedVersion: 2 });
}

test("empty drafts save and reload, but cannot enter review", async (t) => {
  const { sqlite, repository } = harness();
  t.after(() => sqlite.close());
  const saved = await save(repository, AUTHOR, 1, "Empty draft lecture", []);
  assert.equal(saved.version, 2);
  assert.deepEqual(saved.slides, []);
  await assert.rejects(
    () => repository.mutateLecture(AUTHOR, WORKBOOK_ID, { action: "request-review", id: WORKBOOK_ID, expectedVersion: 2 }),
    (error: any) => error.status === 422,
  );
});

test("unfinished slides save safely but cannot pass the review gate",async(t)=>{
  const {sqlite,repository}=harness();t.after(()=>sqlite.close());
  const partial={...slide,title:"",body:""};
  const saved=await save(repository,AUTHOR,1,"Working lecture",[partial]);
  assert.deepEqual(saved.slides,[partial]);
  assert.deepEqual((await repository.getLectureStudio(AUTHOR,WORKBOOK_ID)).slides,[partial]);
  await assert.rejects(()=>repository.mutateLecture(AUTHOR,WORKBOOK_ID,{action:"request-review",id:WORKBOOK_ID,expectedVersion:2}),(error:any)=>error.status===422);
});

test("save is atomic on version conflict, including a race immediately before batch", async (t) => {
  const { sqlite, DB, repository } = harness();
  t.after(() => sqlite.close());
  const first = await save(repository, AUTHOR, 1, "First saved title", [slide]);
  assert.equal(first.title, "First saved title");
  assert.deepEqual(first.slides, [slide]);
  await assert.rejects(() => save(repository, AUTHOR, 1, "Stale title", [{ ...slide, body: "stale" }]), (error: any) => error.status === 409);
  assert.deepEqual({ ...sqlite.prepare("SELECT title,version FROM workbooks WHERE id=?").get(WORKBOOK_ID) }, { title: "First saved title", version: 2 });
  assert.equal(sqlite.prepare("SELECT slides_json FROM lecture_drafts WHERE workbook_id=?").get(WORKBOOK_ID)?.slides_json, JSON.stringify([slide]));

  DB.beforeBatch = () => sqlite.prepare("UPDATE workbooks SET title='Concurrent title',version=3 WHERE id=?").run(WORKBOOK_ID);
  await assert.rejects(() => save(repository, AUTHOR, 2, "Racing stale title", [{ ...slide, body: "racing stale body" }]), (error: any) => error.status === 409);
  assert.deepEqual({ ...sqlite.prepare("SELECT title,version FROM workbooks WHERE id=?").get(WORKBOOK_ID) }, { title: "Concurrent title", version: 3 });
  assert.equal(sqlite.prepare("SELECT slides_json FROM lecture_drafts WHERE workbook_id=?").get(WORKBOOK_ID)?.slides_json, JSON.stringify([slide]));
});

test("studio mutations enforce educator, organization, author and reviewer separation", async (t) => {
  const { sqlite, repository } = harness();
  t.after(() => sqlite.close());
  await assert.rejects(() => save(repository, LEARNER, 1), (error: any) => error.status === 403);
  await assert.rejects(() => save(repository, OTHER_ORG, 1), (error: any) => error.status === 404);
  await assert.rejects(() => save(repository, OTHER_AUTHOR, 1), (error: any) => error.status === 403);
  await save(repository, AUTHOR, 1);
  await repository.mutateLecture(AUTHOR, WORKBOOK_ID, { action: "request-review", id: WORKBOOK_ID, expectedVersion: 2 });
  await assert.rejects(
    () => repository.mutateLecture(AUTHOR, WORKBOOK_ID, { action: "review", id: WORKBOOK_ID, expectedVersion: 2, decision: "approved", comment: "Self approval" }),
    (error: any) => error.status === 403,
  );
});

test("changes requested invalidates the old hash and requires fresh independent approval", async (t) => {
  const { sqlite, repository } = harness();
  t.after(() => sqlite.close());
  await save(repository, AUTHOR, 1);
  await repository.mutateLecture(AUTHOR, WORKBOOK_ID, { action: "request-review", id: WORKBOOK_ID, expectedVersion: 2 });
  const oldHash = sqlite.prepare("SELECT review_hash FROM lecture_drafts WHERE workbook_id=?").get(WORKBOOK_ID)?.review_hash;
  await repository.mutateLecture(REVIEWER, WORKBOOK_ID, { action: "review", id: WORKBOOK_ID, expectedVersion: 2, decision: "changes-requested", comment: "Revise the explanation." });
  await save(repository, AUTHOR, 2, "Revised lecture", [{ ...slide, body: "A revised explanation." }]);
  assert.equal(sqlite.prepare("SELECT review_hash FROM lecture_drafts WHERE workbook_id=?").get(WORKBOOK_ID)?.review_hash, null);
  await assert.rejects(() => repository.mutateLecture(AUTHOR, WORKBOOK_ID, { action: "publish", id: WORKBOOK_ID, expectedVersion: 3 }), (error: any) => error.status === 409);
  await repository.mutateLecture(AUTHOR, WORKBOOK_ID, { action: "request-review", id: WORKBOOK_ID, expectedVersion: 3 });
  const newHash = sqlite.prepare("SELECT review_hash FROM lecture_drafts WHERE workbook_id=?").get(WORKBOOK_ID)?.review_hash;
  assert.notEqual(newHash, oldHash);
  await repository.mutateLecture(REVIEWER, WORKBOOK_ID, { action: "review", id: WORKBOOK_ID, expectedVersion: 3, decision: "approved", comment: "Revision approved." });
  await repository.mutateLecture(AUTHOR, WORKBOOK_ID, { action: "publish", id: WORKBOOK_ID, expectedVersion: 3 });
  assert.equal(sqlite.prepare("SELECT status FROM workbooks WHERE id=?").get(WORKBOOK_ID)?.status, "published");
});

test("publication stores an immutable verified manifest and rejects later editing", async (t) => {
  const { sqlite, repository } = harness();
  t.after(() => sqlite.close());
  await publishFlow(repository);
  const stored = sqlite.prepare("SELECT manifest_json,integrity_hash,version FROM lecture_versions WHERE workbook_id=?").get(WORKBOOK_ID) as any;
  const verified = await lectureManifest.parseAndVerifyLectureManifest(stored.manifest_json, stored.integrity_hash);
  assert.equal(verified.workbook.id, WORKBOOK_ID);
  assert.equal(verified.workbook.version, 2);
  assert.deepEqual(verified.slides, [slide]);
  await assert.rejects(() => save(repository, AUTHOR, 2, "Edited after publish"), (error: any) => error.status === 409);
  assert.equal(sqlite.prepare("SELECT COUNT(*) AS count FROM lecture_versions WHERE workbook_id=?").get(WORKBOOK_ID)?.count, 1);
});

test("published playback requires this workbook allocation and optional course identity", async (t) => {
  const { sqlite, repository } = harness();
  t.after(() => sqlite.close());
  await publishFlow(repository);
  sqlite.prepare("INSERT INTO enrolments VALUES ('course-1',?,'active')").run(LEARNER.userId);
  sqlite.prepare("INSERT INTO workbook_assignments VALUES ('assignment-1',?,?,'active')").run(WORKBOOK_ID, LEARNER.userId);
  assert.equal((await repository.getPublishedLecture(LEARNER, WORKBOOK_ID, "clinical-anatomy")).manifest.workbook.id, WORKBOOK_ID);
  await assert.rejects(() => repository.getPublishedLecture(LEARNER, WORKBOOK_ID, "wrong-course"), (error: any) => error.status === 404);
  await assert.rejects(() => repository.getPublishedLecture(ATLAS_ONLY, WORKBOOK_ID), (error: any) => error.status === 403);

  sqlite.prepare("UPDATE workbook_assignments SET status='revoked' WHERE id='assignment-1'").run();
  await assert.rejects(() => repository.getPublishedLecture(LEARNER, WORKBOOK_ID), (error: any) => error.status === 403);
  sqlite.prepare("UPDATE workbook_assignments SET status='active' WHERE id='assignment-1'").run();
  sqlite.prepare("INSERT INTO workbook_assignment_rules VALUES ('assignment-1',NULL,'2020-01-01T00:00:00.000Z',NULL,NULL)").run();
  await assert.rejects(() => repository.getPublishedLecture(LEARNER, WORKBOOK_ID), (error: any) => error.status === 403);
});

test("playback denies corrupt hash, corrupt content and manifest identity", async (t) => {
  const { sqlite, repository } = harness();
  t.after(() => sqlite.close());
  await publishFlow(repository);
  const original = sqlite.prepare("SELECT manifest_json,integrity_hash FROM lecture_versions WHERE workbook_id=?").get(WORKBOOK_ID) as any;

  sqlite.prepare("UPDATE lecture_versions SET integrity_hash=? WHERE workbook_id=?").run("0".repeat(64), WORKBOOK_ID);
  await assert.rejects(() => repository.getPublishedLecture(AUTHOR, WORKBOOK_ID), (error: any) => error.status === 409);
  sqlite.prepare("UPDATE lecture_versions SET integrity_hash=?,manifest_json=? WHERE workbook_id=?").run(original.integrity_hash, original.manifest_json.replace("Introduction", "Corruption"), WORKBOOK_ID);
  await assert.rejects(() => repository.getPublishedLecture(AUTHOR, WORKBOOK_ID), (error: any) => error.status === 409);

  const wrongIdentity = JSON.parse(original.manifest_json);
  wrongIdentity.workbook.id = "workbook:22222222-2222-4222-8222-222222222222";
  const record = await lectureManifest.createLectureManifestRecord(wrongIdentity);
  sqlite.prepare("UPDATE lecture_versions SET integrity_hash=?,manifest_json=? WHERE workbook_id=?").run(record.integrityHash, record.manifestJson, WORKBOOK_ID);
  await assert.rejects(() => repository.getPublishedLecture(AUTHOR, WORKBOOK_ID), (error: any) => error.status === 409);
});

test("prefixed workbook IDs accept a near-48KB slide payload", async (t) => {
  const { sqlite, repository } = harness();
  t.after(() => sqlite.close());
  const slides = Array.from({ length: 9 }, (_, index) => ({
    id: `slide-${index + 1}`,
    title: `Slide ${index + 1}`,
    body: "x".repeat(5_000),
    referenceUrl: "https://example.edu/reference",
  }));
  const slideBytes = new TextEncoder().encode(JSON.stringify(slides)).byteLength;
  assert.ok(slideBytes > 45_000 && slideBytes < 48_000);
  await save(repository, AUTHOR, 1, "Large bounded lecture", slides);
  await repository.mutateLecture(AUTHOR, WORKBOOK_ID, { action: "request-review", id: WORKBOOK_ID, expectedVersion: 2 });
  assert.match(String(sqlite.prepare("SELECT review_hash FROM lecture_drafts WHERE workbook_id=?").get(WORKBOOK_ID)?.review_hash), /^[a-f0-9]{64}$/);
});
