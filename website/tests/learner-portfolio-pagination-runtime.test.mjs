import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { DatabaseSync } from 'node:sqlite';

const site = process.env.VISIBLE_MEDICINE_WEBSITE ?? process.cwd();
const require = createRequire(resolve(site, 'package.json'));
const ts = require('typescript');
function compiled(path) {
  return ts.transpileModule(readFileSync(resolve(site, path), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
}
const paginationModule = { exports: {} };
new Function('module', 'exports', compiled('lib/learner-portfolio-pagination.ts'))(paginationModule, paginationModule.exports);
const pagination = paginationModule.exports;

function fixture() {
  const db = new DatabaseSync(':memory:');
  db.exec(`CREATE TABLE learner_notes (id TEXT, learner_id TEXT, resource_type TEXT, resource_id TEXT, title TEXT, body TEXT, updated_at TEXT);
    CREATE TABLE learner_review_queue (id TEXT, learner_id TEXT, resource_type TEXT, resource_id TEXT, title TEXT, prompt TEXT, due_at TEXT, interval_days INTEGER, status TEXT, updated_at TEXT);
    CREATE TABLE course_completions (id TEXT, learner_id TEXT, course_slug TEXT, course_title TEXT, percent_complete INTEGER, completed_at TEXT, status TEXT);
    CREATE TABLE education_certificates (completion_id TEXT, public_code TEXT, title TEXT, issued_at TEXT, revoked_at TEXT);`);
  const addNote = db.prepare('INSERT INTO learner_notes VALUES (?, ?, ?, ?, ?, ?, ?)');
  const addReview = db.prepare('INSERT INTO learner_review_queue VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
  const due = n => new Date(Date.UTC(2026, 9, 10 + Math.floor(n / 4), 10)).toISOString();
  for (let i = 0; i < 125; i++) {
    const id = `n-${String(i).padStart(3, '0')}`;
    const rid = `r-${String(i).padStart(3, '0')}`;
    addNote.run(id, 'owner', 'atlas', 'ct-head', id, 'Learning', due(Math.floor(i / 2)));
    addReview.run(rid, 'owner', 'atlas', 'ct-head', rid, 'Recall', due(i % 60), 7, i < 60 ? 'active' : 'completed', due(i % 60));
  }
  // Equal keys belonging to another learner must never appear in any page.
  for (let i = 0; i < 5; i++) {
    addNote.run(`foreign-n-${i}`, 'other', 'atlas', 'ct-head', 'Foreign', 'Private', due(i));
    addReview.run(`foreign-r-${i}`, 'other', 'atlas', 'ct-head', 'Foreign', 'Private', due(i), 7, 'active', due(i));
  }
  const readSource = readFileSync(resolve(site, 'lib/platform-governance.ts'), 'utf8');
  const slice = readSource.slice(readSource.indexOf('export async function getLearnerPortfolio('), readSource.indexOf('export async function saveLearnerNote('));
  assert.match(slice, /export async function getLearnerPortfolioPage/);
  const js = ts.transpileModule(slice, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const module = { exports: {} };
  const env = { DB: { prepare(sql) { let args = []; return { bind(...values) { args = values; return this; }, all() { return { results: db.prepare(sql).all(...args) }; } }; } } };
  new Function('env', 'ensureEducationUser', 'ensurePlatformSchema', 'portfolioPage', 'parsePortfolioCursor', 'module', 'exports', js)(
    env, async () => {}, async () => {}, pagination.portfolioPage, pagination.parsePortfolioCursor, module, module.exports);
  return { db, api: module.exports };
}

test('actual SQL walks all notes and reviews across tied keys and status boundary', async () => {
  const { db, api } = fixture();
  try {
    const auth = { userId: 'owner' };
    const first = await api.getLearnerPortfolio(auth);
    assert.equal(first.notes.length, 50);
    assert.equal(first.reviews.length, 50);
    assert.equal(first.completions.length, 0);
    for (const section of ['notes', 'reviews']) {
      let items = first[section];
      let cursor = first[`${section}NextCursor`];
      const pages = [items.length];
      while (cursor) {
        const page = await api.getLearnerPortfolioPage(auth, section, cursor);
        assert.equal(page.section, section);
        items = [...items, ...page[section]];
        pages.push(page[section].length);
        cursor = page.nextCursor;
      }
      assert.deepEqual(pages, [50, 50, 25]);
      assert.equal(new Set(items.map(item => item.id)).size, 125);
      assert.ok(items.every(item => !item.id.startsWith('foreign-')));
      const expected = db.prepare(section === 'notes'
        ? 'SELECT id FROM learner_notes WHERE learner_id=? ORDER BY updated_at DESC, id DESC'
        : "SELECT id FROM learner_review_queue WHERE learner_id=? ORDER BY CASE status WHEN 'active' THEN 0 ELSE 1 END, due_at ASC, id ASC").all('owner').map(row => row.id);
      assert.deepEqual(items.map(item => item.id), expected);
    }
    const foreign = pagination.encodePortfolioCursor({ section: 'notes', updatedAt: '2026-10-10T10:00:00.000Z', id: 'foreign-n-0' });
    const page = await api.getLearnerPortfolioPage(auth, 'notes', foreign);
    assert.ok(page.notes.every(item => !item.id.startsWith('foreign-')));
    await assert.rejects(api.getLearnerPortfolioPage(auth, 'reviews', foreign));
  } finally { db.close(); }
});

test('GET route keeps legacy snapshot, validates paging, and sends private errors after auth', async () => {
  const routeSource = compiled('app/api/learner/portfolio/route.ts');
  const module = { exports: {} };
  const { db, api } = fixture();
  let signedIn = true;
  class PlatformGovernanceError extends Error { constructor(message, status = 422) { super(message); this.status = status; } }
  new Function('require', 'module', 'exports', routeSource)(name => {
    if (name === '@/lib/auth') return { getAuthContext: async () => signedIn ? { userId: 'owner' } : null };
    if (name === '@/lib/platform-governance') return { ...api, PlatformGovernanceError };
    if (name === '@/lib/learner-portfolio-pagination') return pagination;
    if (name === '@/lib/mutation-json') return { readBoundedMutationJson() { throw new Error('POST not used'); } };
    throw new Error(name);
  }, module, module.exports);
  try {
    const route = module.exports;
    const legacy = await route.GET(new Request('https://example.test/api/learner/portfolio?workbookId=from-query'));
    assert.equal(legacy.status, 200);
    assert.equal((await legacy.json()).notes.length, 50);
    assert.equal(legacy.headers.get('Cache-Control'), 'private, no-store');
    const initial = await route.GET();
    const first = await initial.json();
    const continued = await route.GET(new Request(`https://example.test/api/learner/portfolio?section=notes&cursor=${first.notesNextCursor}`));
    assert.equal(continued.status, 200);
    assert.equal((await continued.json()).notes.length, 50);
    for (const suffix of ['section=notes', 'cursor=abc', 'section=other&cursor=abc', `section=notes&cursor=${first.reviewsNextCursor}`]) {
      const response = await route.GET(new Request(`https://example.test/api/learner/portfolio?${suffix}`));
      assert.equal(response.status, 400, suffix);
      assert.equal(response.headers.get('Cache-Control'), 'private, no-store');
    }
    signedIn = false;
    const unauth = await route.GET(new Request('https://example.test/api/learner/portfolio?section=notes&cursor=abc'));
    assert.equal(unauth.status, 401);
    assert.equal(unauth.headers.get('Cache-Control'), 'private, no-store');
  } finally { db.close(); }
});
