import assert from 'node:assert/strict';
import test from 'node:test';
import {createRequire} from 'node:module';
import {DatabaseSync} from 'node:sqlite';
import {readFile} from 'node:fs/promises';
import {dirname, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(resolve(root, 'package.json'));
const {build} = require('esbuild');
const source = await readFile(process.env.PLATFORM_DB_SOURCE ? resolve(process.env.PLATFORM_DB_SOURCE) : resolve(root, 'db/platform.ts'), 'utf8');
const compiled = await build({
  stdin: {contents: source, resolveDir: root, sourcefile: 'db/platform.ts', loader: 'ts'},
  bundle: true, write: false, platform: 'node', format: 'esm',
  plugins: [{name: 'synthetic-platform-dependencies', setup(build) {
    build.onResolve({filter: /^cloudflare:workers$/}, () => ({path: 'workers', namespace: 'synthetic'}));
    build.onLoad({filter: /^workers$/, namespace: 'synthetic'}, () => ({contents: 'export const env = globalThis.__platformBootstrapEnv;', loader: 'js'}));
    build.onResolve({filter: /^\.\/bootstrap$/}, () => ({path: 'bootstrap', namespace: 'synthetic'}));
    build.onLoad({filter: /^bootstrap$/, namespace: 'synthetic'}, () => ({contents: 'export function ensureEducationUser() { throw new Error("bootstrap must not execute in platform schema tests"); }', loader: 'js'}));
  }}],
});
const moduleUrl = 'data:text/javascript;base64,' + Buffer.from(compiled.outputFiles[0].text).toString('base64');
let instance = 0;

function deferred() {
  let resolve, reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return {promise, resolve, reject};
}

function binding() {
  const sqlite = new DatabaseSync(':memory:');
  sqlite.exec('PRAGMA foreign_keys = ON');
  assert.equal(sqlite.prepare('PRAGMA foreign_keys').get().foreign_keys, 1);
  // These are the real seed's parent IDs. Keep foreign keys enabled throughout.
  sqlite.exec(`
    CREATE TABLE users (id TEXT PRIMARY KEY);
    CREATE TABLE courses (id TEXT PRIMARY KEY, status TEXT NOT NULL);
    CREATE TABLE workbooks (id TEXT PRIMARY KEY, status TEXT NOT NULL);
    CREATE TABLE ingestion_jobs (id TEXT PRIMARY KEY, status TEXT NOT NULL);
    INSERT INTO users VALUES ('edu:system-examiner');
    INSERT INTO courses VALUES ('course-advanced-imaging', 'active');
    INSERT INTO workbooks VALUES ('workbook-teaching-demo', 'published'), ('workbook-assessment', 'published');
    INSERT INTO ingestion_jobs VALUES ('synthetic-ingestion', 'ready-for-review');
  `);
  const events = [];
  const actions = {schema: [], seed: [], optimize: []};
  const query = (sql, values = []) => sqlite.prepare(sql).get(...values);
  const rows = (sql, values = []) => sqlite.prepare(sql).all(...values);
  const count = table => query(`SELECT COUNT(*) AS n FROM ${table}`).n;
  const executeBatch = statements => {
    sqlite.exec('BEGIN');
    try {
      const results = statements.map(({sql, values}) => sqlite.prepare(sql).run(...values));
      sqlite.exec('COMMIT');
      return results;
    } catch (error) {
      sqlite.exec('ROLLBACK');
      throw error;
    }
  };
  const DB = {
    prepare(sql) {
      const make = values => ({sql, values, bind: (...args) => make(args),
        run() {
          if (/^\s*PRAGMA optimize/i.test(sql)) {
            events.push('optimize');
            const action = actions.optimize.shift();
            if (action?.kind === 'throw') throw Error('synthetic optimize throw');
            if (action?.kind === 'reject') return Promise.reject(Error('synthetic optimize rejection'));
            if (action?.kind === 'defer') return action.gate.promise.then(() => sqlite.prepare(sql).run(...values));
          }
          return Promise.resolve(sqlite.prepare(sql).run(...values));
        },
        first() { return Promise.resolve(sqlite.prepare(sql).get(...values) ?? null); },
        all() { return Promise.resolve({results: sqlite.prepare(sql).all(...values)}); },
      });
      return make([]);
    },
    batch(statements) {
      const phase = /^\s*CREATE/i.test(statements[0].sql) ? 'schema' : 'seed';
      events.push(phase);
      const action = actions[phase].shift();
      if (action?.kind === 'throw') throw Error(`synthetic ${phase} throw`);
      if (action?.kind === 'reject') return Promise.reject(Error(`synthetic ${phase} rejection`));
      if (action?.kind === 'defer') return action.gate.promise.then(() => executeBatch(statements));
      return Promise.resolve(executeBatch(statements));
    },
  };
  return {DB, actions, events, query, rows, count, close: () => sqlite.close()};
}

async function fixture(existing = binding()) {
  const env = {DB: existing.DB};
  globalThis.__platformBootstrapEnv = env;
  const platform = await import(moduleUrl + '#' + ++instance);
  return {primary: existing, env, platform};
}

function seeded(b) {
  assert.equal(b.count('organizations'), 1);
  assert.equal(b.count('organization_entitlements'), 1);
  assert.equal(b.count('education_publications'), 2);
  assert.equal(b.count('organization_profiles'), 1);
  assert.equal(b.count('course_ownership'), 1);
  assert.equal(b.count('course_releases'), 1);
  assert.equal(b.count('course_release_workbooks'), 2);
  assert.equal(b.count('billing_accounts'), 1);
  assert.equal(b.count('subscription_records'), 1);
  assert.equal(b.count('organization_memberships'), 0);
  assert.equal(b.count('course_release_reviews'), 0);
  assert.equal(b.count('atlas_publication_reviews'), 0);
  assert.equal(b.count('course_completions'), 0);
  assert.equal(b.count('education_certificates'), 0);
}

test('cold bootstrap commits real schema and FK-valid synthetic seed exactly once', {concurrency: false}, async () => {
  const {primary: b, platform} = await fixture();
  try {
    await platform.ensurePlatformSchema();
    seeded(b);
    assert.deepEqual(b.events, ['schema', 'seed', 'optimize']);
    await platform.ensurePlatformSchema();
    assert.equal(b.events.length, 3);
  } finally { b.close(); }
});

for (const phase of ['schema', 'seed', 'optimize']) {
  for (const kind of ['reject', 'throw']) {
    test(`${phase} ${kind} propagates and an explicit later call recovers`, {concurrency: false}, async () => {
      const {primary: b, platform} = await fixture();
      try {
        b.actions[phase].push({kind});
        await assert.rejects(platform.ensurePlatformSchema(), new RegExp(`synthetic ${phase} ${kind === 'reject' ? 'rejection' : 'throw'}`));
        assert.deepEqual(b.events, phase === 'schema' ? ['schema'] : phase === 'seed' ? ['schema', 'seed'] : ['schema', 'seed', 'optimize']);
        await platform.ensurePlatformSchema();
        seeded(b);
        const completed = b.events.length;
        await platform.ensurePlatformSchema();
        assert.equal(b.events.length, completed, 'warm binding must not repeat any phase');
      } finally { b.close(); }
    });
  }
}

test('a second D1 binding gets its own complete setup, then both stay warm', {concurrency: false}, async () => {
  const {primary: a, env, platform} = await fixture();
  const b = binding();
  try {
    await platform.ensurePlatformSchema();
    env.DB = b.DB;
    await platform.ensurePlatformSchema();
    seeded(a); seeded(b);
    assert.deepEqual(a.events, ['schema', 'seed', 'optimize']);
    assert.deepEqual(b.events, ['schema', 'seed', 'optimize']);
    env.DB = a.DB;
    await platform.ensurePlatformSchema();
    env.DB = b.DB;
    await platform.ensurePlatformSchema();
    assert.equal(a.events.length, 3);
    assert.equal(b.events.length, 3);
  } finally { a.close(); b.close(); }
});

test('concurrent cold calls do independent batches; a late failure cannot clear success', {concurrency: false}, async () => {
  const {primary: b, platform} = await fixture();
  const gate = deferred();
  try {
    b.actions.schema.push({kind: 'defer', gate});
    const lateFailure = platform.ensurePlatformSchema();
    const success = platform.ensurePlatformSchema();
    const started = [...b.events];
    const raced = await Promise.race([
      success.then(() => 'success', () => 'rejection'),
      new Promise(resolve => setTimeout(() => resolve('still pending'), 40)),
    ]);
    gate.reject(Error('late caller failed'));
    await assert.rejects(lateFailure, /late caller failed/);
    assert.equal(raced, 'success', 'the independent second call must finish before the first gate settles');
    assert.deepEqual(started, ['schema', 'schema']);
    const count = b.events.length;
    await platform.ensurePlatformSchema();
    assert.equal(b.events.length, count);
    seeded(b);
  } finally { b.close(); }
});

test('binding switch while schema is pending keeps seed and optimize on original D1', {concurrency: false}, async () => {
  const {primary: a, env, platform} = await fixture();
  const b = binding();
  const gate = deferred();
  try {
    a.actions.schema.push({kind: 'defer', gate});
    const old = platform.ensurePlatformSchema();
    env.DB = b.DB;
    const replacement = platform.ensurePlatformSchema();
    gate.resolve();
    await Promise.all([old, replacement]);
    seeded(a); seeded(b);
    assert.deepEqual(a.events, ['schema', 'seed', 'optimize']);
    assert.deepEqual(b.events, ['schema', 'seed', 'optimize']);
  } finally { a.close(); b.close(); }
});

for (const phase of ['seed', 'optimize']) {
  test(`retry after ${phase} failure preserves existing access, release and review edits`, {concurrency: false}, async () => {
    const b = binding();
    try {
      const first = await fixture(b);
      await first.platform.ensurePlatformSchema();
      await b.DB.prepare(`UPDATE organization_entitlements SET plan = ?, status = ?, atlas_access = ?, studio_access = ? WHERE organization_id = ?`).bind('Edited plan', 'suspended', 0, 0, 'org-elivion-pilot').run();
      // The release has no rights_status column; rights/review edits live in publications.
      await b.DB.prepare(`UPDATE course_releases SET visibility = ?, status = ?, price_minor = ?, reviewed_by = ?, review_notes = ? WHERE id = ?`).bind('private', 'draft', 725, null, 'Needs new review', 'release-integrated-imaging-v1').run();
      await b.DB.prepare(`UPDATE education_publications SET status = ?, rights_status = ?, deidentification_status = ?, specialist_review_status = ?, reviewer = ? WHERE id = ?`).bind('withheld', 'restricted', 'pending', 'rejected', 'synthetic-reviewer', 'publication-ct-head-v1').run();
      const before = {
        entitlement: b.query(`SELECT plan, status, atlas_access, studio_access FROM organization_entitlements WHERE organization_id = 'org-elivion-pilot'`),
        release: b.query(`SELECT visibility, status, price_minor, reviewed_by, review_notes FROM course_releases WHERE id = 'release-integrated-imaging-v1'`),
        publication: b.query(`SELECT status, rights_status, deidentification_status, specialist_review_status, reviewer FROM education_publications WHERE id = 'publication-ct-head-v1'`),
      };
      const retry = await fixture(b);
      b.actions[phase].push({kind: 'reject'});
      await assert.rejects(retry.platform.ensurePlatformSchema(), new RegExp(`synthetic ${phase} rejection`));
      await retry.platform.ensurePlatformSchema();
      assert.deepEqual(b.query(`SELECT plan, status, atlas_access, studio_access FROM organization_entitlements WHERE organization_id = 'org-elivion-pilot'`), before.entitlement);
      assert.deepEqual(b.query(`SELECT visibility, status, price_minor, reviewed_by, review_notes FROM course_releases WHERE id = 'release-integrated-imaging-v1'`), before.release);
      assert.deepEqual(b.query(`SELECT status, rights_status, deidentification_status, specialist_review_status, reviewer FROM education_publications WHERE id = 'publication-ct-head-v1'`), before.publication);
      seeded(b);
    } finally { b.close(); }
  });
}
