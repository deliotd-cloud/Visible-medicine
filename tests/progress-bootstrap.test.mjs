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
const source = process.env.PROGRESS_DB_SOURCE
  ? await readFile(resolve(process.env.PROGRESS_DB_SOURCE), 'utf8')
  : await readFile(resolve(root, 'db/progress.ts'), 'utf8');
const compiled = await build({
  stdin: {contents: source, resolveDir: root, sourcefile: 'db/progress.ts', loader: 'ts'},
  bundle: true, write: false, platform: 'node', format: 'esm',
  plugins: [{name: 'synthetic-workers', setup(build) {
    build.onResolve({filter: /^cloudflare:workers$/}, () => ({path: 'workers', namespace: 'synthetic'}));
    build.onLoad({filter: /.*/, namespace: 'synthetic'}, () => ({contents: 'export const env = globalThis.__progressBootstrapEnv;', loader: 'js'}));
  }}],
});
const moduleUrl = 'data:text/javascript;base64,' + Buffer.from(compiled.outputFiles[0].text).toString('base64');
let instanceNumber = 0;

function deferred() {
  let resolve, reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return {promise, resolve, reject};
}

function binding() {
  const sqlite = new DatabaseSync(':memory:');
  const events = [];
  const schemaActions = [];
  const execute = (sql, values, method) => {
    events.push(method);
    if (method === 'all') return Promise.resolve({results: sqlite.prepare(sql).all(...values)});
    if (method === 'first') return Promise.resolve(sqlite.prepare(sql).get(...values) ?? null);
    return Promise.resolve(sqlite.prepare(sql).run(...values));
  };
  const DB = {prepare(sql) {
    if (/^\s*CREATE TABLE IF NOT EXISTS learning_progress/i.test(sql)) {
      events.push('schema:prepare');
      const action = schemaActions.shift();
      if (action?.kind === 'prepare-throw') throw new Error('synthetic prepare failure');
      return {run() {
        events.push('schema:run');
        if (action?.kind === 'run-throw') throw new Error('synthetic run failure');
        if (action?.kind === 'reject') return Promise.reject(new Error('synthetic DDL rejection'));
        if (action?.kind === 'defer') return action.gate.promise.then(() => sqlite.prepare(sql).run());
        return Promise.resolve(sqlite.prepare(sql).run());
      }};
    }
    const bound = values => ({
      first: () => execute(sql, values, 'first'),
      all: () => execute(sql, values, 'all'),
      run: () => execute(sql, values, 'run'),
    });
    return {bind: (...values) => bound(values), ...bound([])};
  }};
  return {
    DB, events, schemaActions,
    row(user, type, slug) {
      return sqlite.prepare('SELECT progress, last_position AS lastPosition FROM learning_progress WHERE user_id=? AND resource_type=? AND resource_slug=?').get(user, type, slug);
    },
    close() { sqlite.close(); },
  };
}

async function fixture() {
  const primary = binding();
  const env = {DB: primary.DB};
  globalThis.__progressBootstrapEnv = env;
  const progress = await import(moduleUrl + '#' + ++instanceNumber);
  return {primary, env, progress};
}

const course = (progress, lastPosition, resourceSlug = 'course-a') => ({resourceType: 'course', resourceSlug, progress, lastPosition});
const atlas = (progress, lastPosition) => ({resourceType: 'atlas', resourceSlug: 'atlas-a', progress, lastPosition});
const schemaRuns = b => b.events.filter(event => event === 'schema:run').length;
const writes = b => b.events.filter(event => event === 'first').length;

test('rejected initialization propagates; a later save and list can recover without replaying the failed save', {concurrency: false}, async () => {
  const {primary: b, progress} = await fixture();
  try {
    b.schemaActions.push({kind: 'reject'});
    await assert.rejects(progress.saveProgress('learner', course(5, 2)), /synthetic DDL rejection/);
    assert.equal(writes(b), 0, 'failed initialization must not write');
    assert.equal(b.events.includes('all'), false, 'failed initialization must not list');
    const saved = await progress.saveProgress('learner', course(70, 9));
    assert.equal(saved.progress, 70);
    assert.equal(writes(b), 1, 'no automatic replay or duplicate save');
    assert.equal((await progress.listProgress('learner')).length, 1);
    assert.equal(schemaRuns(b), 2, 'successful binding remains warm');
  } finally { b.close(); }
});

for (const kind of ['prepare-throw', 'run-throw']) {
  test(`synchronous schema ${kind} propagates and the next call recovers`, {concurrency: false}, async () => {
    const {primary: b, progress} = await fixture();
    try {
      b.schemaActions.push({kind});
      await assert.rejects(progress.listProgress('learner'), /synthetic .* failure/);
      assert.equal(b.events.includes('all'), false, 'list must await its own successful initialization');
      assert.deepEqual(await progress.listProgress('learner'), []);
      assert.equal(schemaRuns(b), kind === 'run-throw' ? 2 : 1);
    } finally { b.close(); }
  });
}

test('successful readiness is scoped to the D1 binding', {concurrency: false}, async () => {
  const {primary: a, env, progress} = await fixture();
  const b = binding();
  try {
    await progress.ensureProgressSchema();
    await progress.ensureProgressSchema();
    assert.equal(schemaRuns(a), 1);
    env.DB = b.DB;
    await progress.saveProgress('learner', course(30, 4));
    assert.equal(schemaRuns(b), 1, 'new binding requires its own schema');
    await progress.listProgress('learner');
    assert.equal(schemaRuns(b), 1);
    env.DB = a.DB;
    await progress.listProgress('learner');
    assert.equal(schemaRuns(a), 1);
  } finally { a.close(); b.close(); }
});

test('concurrent cold callers own independent initialization and save gates', {concurrency: false}, async () => {
  const {primary: b, progress} = await fixture();
  const gate = deferred();
  try {
    b.schemaActions.push({kind: 'defer', gate});
    const first = progress.saveProgress('first', course(10, 1));
    const second = progress.saveProgress('second', course(60, 6));
    const started = schemaRuns(b);
    // Settle the first gate even when the assertion fails, so this test leaves no pending work.
    gate.resolve();
    const results = await Promise.allSettled([first, second]);
    assert.equal(started, 2, 'cold callers must not share an in-flight D1 operation');
    assert(results.every(result => result.status === 'fulfilled'));
    assert.equal(writes(b), 2);
    assert.equal(b.row('first', 'course', 'course-a').progress, 10);
    assert.equal(b.row('second', 'course', 'course-a').progress, 60);
  } finally { b.close(); }
});

test('one concurrent initialization failure does not erase another caller’s success', {concurrency: false}, async () => {
  const {primary: b, progress} = await fixture();
  const gate = deferred();
  try {
    b.schemaActions.push({kind: 'defer', gate});
    const failed = progress.saveProgress('first', course(10, 1));
    const succeeded = progress.saveProgress('second', course(60, 6));
    const started = schemaRuns(b);
    gate.reject(new Error('first caller DDL failed'));
    const results = await Promise.allSettled([failed, succeeded]);
    assert.equal(started, 2);
    assert.equal(results[0].status, 'rejected');
    assert.match(results[0].reason.message, /first caller DDL failed/);
    assert.equal(results[1].status, 'fulfilled');
    assert.equal(writes(b), 1, 'the failed caller never saves');
    assert.equal(b.row('second', 'course', 'course-a').progress, 60);
    await progress.listProgress('second');
    assert.equal(schemaRuns(b), 2, 'failed caller must not clear successful binding readiness');
  } finally { b.close(); }
});

test('a binding switch during initialization keeps pending save and list on their original binding', {concurrency: false}, async () => {
  const {primary: a, env, progress} = await fixture();
  const b = binding();
  const gate = deferred();
  try {
    a.schemaActions.push({kind: 'defer', gate}, {kind: 'defer', gate});
    const save = progress.saveProgress('learner', course(45, 5));
    const list = progress.listProgress('learner');
    const started = schemaRuns(a);
    env.DB = b.DB;
    const replacementList = progress.listProgress('learner');
    gate.resolve();
    const results = await Promise.allSettled([save, list, replacementList]);
    assert.equal(started, 2);
    assert(results.every(result => result.status === 'fulfilled'));
    assert.equal(results[0].value.progress, 45);
    assert.equal(results[1].value.length, 1);
    assert.deepEqual(results[2].value, []);
    assert.equal(a.row('learner', 'course', 'course-a').progress, 45);
    assert.deepEqual(await progress.listProgress('learner'), []);
    assert.equal(schemaRuns(b), 1);
    assert.equal(writes(b), 0, 'pending save must not move to replacement binding');
  } finally { a.close(); b.close(); }
});

test('recovered storage retains user isolation, course maxima and Atlas revisit semantics', {concurrency: false}, async () => {
  const {primary: b, progress} = await fixture();
  try {
    b.schemaActions.push({kind: 'reject'});
    await assert.rejects(progress.listProgress('learner'));
    await progress.saveProgress('learner', course(90, 8));
    await progress.saveProgress('learner', course(5, 2));
    await progress.saveProgress('other', course(20, 3));
    await progress.saveProgress('learner', atlas(80, 40));
    await progress.saveProgress('learner', atlas(20, 3));
    assert.deepEqual({...b.row('learner', 'course', 'course-a')}, {progress: 90, lastPosition: 8});
    assert.deepEqual({...b.row('other', 'course', 'course-a')}, {progress: 20, lastPosition: 3});
    assert.deepEqual({...b.row('learner', 'atlas', 'atlas-a')}, {progress: 20, lastPosition: 3});
    assert.equal((await progress.listProgress('learner')).length, 2);
    assert.equal((await progress.listProgress('other')).length, 1);
  } finally { b.close(); }
});
