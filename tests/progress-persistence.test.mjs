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
    build.onLoad({filter: /.*/, namespace: 'synthetic'}, () => ({contents: 'export const env = globalThis.__progressPersistenceEnv;', loader: 'js'}));
  }}],
});
const moduleUrl = 'data:text/javascript;base64,' + Buffer.from(compiled.outputFiles[0].text).toString('base64');

function fixture() {
  const sqlite = new DatabaseSync(':memory:');
  const statements = [];
  let nextHold = null;
  let hideNextReturn = false;
  const execute = async (sql, values, method) => {
    if (/^\s*INSERT\s+INTO\s+learning_progress/i.test(sql) && nextHold) {
      const hold = nextHold;
      nextHold = null;
      hold.enter();
      await hold.wait;
    }
    statements.push({sql, values, method});
    if (method === 'all') return {results: sqlite.prepare(sql).all(...values)};
    if (method === 'first') {
      const row = sqlite.prepare(sql).get(...values) ?? null;
      if (hideNextReturn) { hideNextReturn = false; return null; }
      return row && {...row};
    }
    return sqlite.prepare(sql).run(...values);
  };
  globalThis.__progressPersistenceEnv = {DB: {prepare(sql) {
    const bound = values => ({
      first: () => execute(sql, values, 'first'),
      all: () => execute(sql, values, 'all'),
      run: () => execute(sql, values, 'run'),
    });
    return {bind: (...values) => bound(values), ...bound([])};
  }}};
  let instanceNumber = 0;
  return {
    sqlite, statements,
    async instance() { return import(moduleUrl + '#' + ++instanceNumber + '-' + Math.random()); },
    row(user, type, slug) {
      return sqlite.prepare('SELECT resource_type AS resourceType, resource_slug AS resourceSlug, progress, last_position AS lastPosition, updated_at AS updatedAt FROM learning_progress WHERE user_id=? AND resource_type=? AND resource_slug=?').get(user, type, slug);
    },
    holdNextWrite() {
      let enter, release;
      const entered = new Promise(resolve => { enter = resolve; });
      const wait = new Promise(resolve => { release = resolve; });
      nextHold = {enter, wait};
      return {entered, release};
    },
    hideNextReturn() { hideNextReturn = true; },
    close() { sqlite.close(); },
  };
}

const course = (progress, lastPosition, resourceSlug = 'course-a') => ({resourceType: 'course', resourceSlug, progress, lastPosition});
const atlas = (progress, lastPosition, resourceSlug = 'atlas-a') => ({resourceType: 'atlas', resourceSlug, progress, lastPosition});
const plain = row => row && {...row};

for (const [first, second] of [[course(100, 15), course(5, 2)], [course(5, 2), course(100, 15)], [course(70, 25), course(70, 4)], [course(70, 4), course(70, 25)], [course(70, 3), course(5, 30)]]) {
  test(`course SQL merges ${first.progress}/${first.lastPosition} then ${second.progress}/${second.lastPosition}`, {concurrency: false}, async () => {
    const f = fixture();
    try {
      const tabA = await f.instance();
      const tabB = await f.instance();
      await tabA.saveProgress('learner', first);
      const acknowledgement = await tabB.saveProgress('learner', second);
      const expected = {resourceType: 'course', resourceSlug: 'course-a', progress: Math.max(first.progress, second.progress), lastPosition: Math.max(first.lastPosition, second.lastPosition)};
      const persisted = f.row('learner', 'course', 'course-a');
      assert.deepEqual(persisted && {...persisted, updatedAt: undefined}, {...expected, updatedAt: undefined});
      assert.deepEqual(acknowledgement, plain(persisted), 'acknowledgement must be the persisted merged row');
      assert.deepEqual((await tabA.listProgress('learner'))[0], plain(persisted));
      const saves = f.statements.filter(s => /^\s*INSERT\s+INTO\s+learning_progress/i.test(s.sql));
      assert.equal(saves.length, 2);
      assert(saves.every(s => s.method === 'first' && /\bRETURNING\b/i.test(s.sql)), 'each save uses the write statement RETURNING');
      assert.equal(f.statements.filter(s => /^\s*SELECT\b/i.test(s.sql)).length, 1, 'only explicit list reads');
    } finally { f.close(); }
  });
}

test('inverted arrival from separate module instances cannot regress a course', {concurrency: false}, async () => {
  const f = fixture();
  try {
    const oldTab = await f.instance();
    const newTab = await f.instance();
    await oldTab.ensureProgressSchema();
    await newTab.ensureProgressSchema();
    const hold = f.holdNextWrite();
    const stale = oldTab.saveProgress('learner', course(5, 2));
    await hold.entered;
    const current = await newTab.saveProgress('learner', course(100, 15));
    hold.release();
    const delayed = await stale;
    assert.equal(current.progress, 100);
    assert.equal(delayed.progress, 100);
    assert.equal(delayed.lastPosition, 15);
    assert.deepEqual(delayed, plain(f.row('learner', 'course', 'course-a')));
  } finally { f.close(); }
});

test('user, slug and resource type keys remain isolated; bound hostile identifiers stay data', {concurrency: false}, async () => {
  const f = fixture();
  try {
    const a = await f.instance();
    const hostile = "x' OR 1=1 --";
    await a.saveProgress(hostile, course(90, 9, hostile));
    await a.saveProgress('learner', course(10, 1, hostile));
    await a.saveProgress('learner', course(20, 2, 'other'));
    await a.saveProgress('learner', atlas(30, 3, hostile));
    await a.saveProgress('learner', course(5, 0, hostile));
    assert.equal(f.row(hostile, 'course', hostile).progress, 90);
    assert.equal(f.row('learner', 'course', hostile).progress, 10);
    assert.equal(f.row('learner', 'course', 'other').progress, 20);
    assert.equal(f.row('learner', 'atlas', hostile).progress, 30);
    assert.equal((await a.listProgress('learner')).length, 3);
    assert.equal((await a.listProgress(hostile)).length, 1);
    assert(f.statements.filter(s => /^\s*INSERT\b/i.test(s.sql)).every(s => s.values.length === 6 && s.sql.includes('VALUES (?, ?, ?, ?, ?, ?)')));
  } finally { f.close(); }
});

test('Atlas revisiting an earlier slice records the actual latest slice', {concurrency: false}, async () => {
  const f = fixture();
  try {
    const a = await f.instance();
    await a.saveProgress('learner', atlas(80, 40));
    const ack = await a.saveProgress('learner', atlas(20, 3));
    assert.equal(f.row('learner', 'atlas', 'atlas-a').lastPosition, 3);
    assert.deepEqual(ack, plain(f.row('learner', 'atlas', 'atlas-a')));
  } finally { f.close(); }
});

test('missing write RETURNING row rejects, even when SQLite applied the write', {concurrency: false}, async () => {
  const f = fixture();
  try {
    const a = await f.instance();
    await a.ensureProgressSchema();
    f.hideNextReturn();
    await assert.rejects(a.saveProgress('learner', course(25, 8)));
    assert.equal(f.row('learner', 'course', 'course-a').progress, 25);
  } finally { f.close(); }
});
