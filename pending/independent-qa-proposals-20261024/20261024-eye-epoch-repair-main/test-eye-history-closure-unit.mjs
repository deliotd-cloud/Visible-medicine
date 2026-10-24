import assert from 'node:assert/strict';
import test, { after } from 'node:test';
import fs from 'node:fs';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { join, posix, win32 } from 'node:path';

const stage = 'F:/VisibleMedicine/staging/20261024-eye-epoch-repair-main';
const website = 'F:/VisibleMedicine/staging/20261024-pancreatic-us-website/website';
const path = 'tests/atlas-eye-layer-guide.test.ts';
const original = fs.readFileSync(website + '/' + path, 'utf8');
const candidate = fs.readFileSync(stage + '/candidate/' + path, 'utf8');
const worker = fs.readFileSync(stage + '/WORKER.test.ts.raw', 'utf8');
const sha = value => createHash('sha256').update(value).digest('hex');
const expectedCandidate = '34028e3a00d5b015b1332dc989b70a0289bc80cb7419270d8fd01152228df660';
assert.equal(sha(original), 'aec1dafd53f02444c8ff3b51182c2bb849165ee226d3c4df885d4df066f47695');
assert.equal(sha(worker), '0b391cbb321d453ac0b11229738ebe42c1f9635ac6de0d827b8a23bf926f394f');
assert.equal(sha(candidate), expectedCandidate);
const previousCwd = process.cwd(); process.chdir(website); after(() => process.chdir(previousCwd));
const historyGitEnv = { ...process.env, GIT_NO_REPLACE_OBJECTS: '1', GIT_TERMINAL_PROMPT: '0' };
const git = (...args) => execFileSync('git', args, { cwd: website, encoding: 'utf8', env: historyGitEnv, windowsHide: true, maxBuffer: 32e6 });
function between(text, start, end) {
  const a = text.indexOf(start), b = text.indexOf(end, a + start.length);
  assert(a >= 0 && b > a); assert.equal(text.indexOf(start, a + 1), -1); assert.equal(text.indexOf(end, b + 1), -1);
  return text.slice(a, b);
}
const seams = [
  { name: 'path import', before: "import {dirname,relative} from 'node:path';", after: "import {join,posix,win32} from 'node:path';" },
  { name: 'saved-tree preflight', before: between(original, ' const saved=previous?base:', ' const result=await build('), after: between(candidate, ' const saved=previous?base:', ' const result=await build(') },
  { name: 'complete historical loader', before: between(original, " plugins:[{name:'exact-eye-guide-website-epoch'", ' const module={exports:{}}'), after: between(candidate, " plugins:[{name:'exact-eye-guide-website-epoch'", ' const module={exports:{}}') },
];
const once = (text, a, b) => { assert.equal(text.split(a).length, 2); return text.replace(a, b); };
const invert = text => { for (const seam of seams) text = once(text, seam.after, seam.before); assert.equal(text, original); return text; };
const roles = [
  { commit: '4aa346e7923e3b303ad869d71e0ea36044d61aa6', tree: '9fa17c09032a409e4375f7df1ba837e2a818069a', count: 1983 },
  { commit: '792810f5bcf8808f57d2f55e12cca217ed4d262d', tree: '921ac8a7a47f237cea1a195e7c3fa2027507a1f7', count: 1971 },
].map(role => ({ ...role, tracked: new Set(git('ls-tree', '-r', '--name-only', role.commit).trim().split('\n')) }));
const resolveStart = '  api.onResolve({filter:/.*/},args=>{\n';
const resolverBody = between(candidate, resolveStart, '  api.onLoad({filter:/.*/,namespace:').slice(resolveStart.length);
assert(resolverBody.endsWith('  });\n'));
const loadStart = "  api.onLoad({filter:/.*/,namespace:'eye-history'},args=>{\n";
const loadBody = between(candidate, loadStart, ' }}]});').slice(loadStart.length);
assert(loadBody.endsWith('  });\n'));
function callbacks(role) {
  const loaded = new Set();
  const resolve = new Function('assert', 'tracked', 'saved', 'posix', 'win32', 'process', 'join',
    'return args => {\n' + resolverBody.slice(0, -'  });\n'.length) + '\n};')(assert, role.tracked, role.commit, posix, win32, process, join);
  const load = new Function('assert', 'tracked', 'saved', 'loaded', 'execFileSync', 'historyGitEnv', 'join', 'posix', 'process',
    'return args => {\n' + loadBody.slice(0, -'  });\n'.length) + '\n};')(assert, role.tracked, role.commit, loaded, execFileSync, historyGitEnv, join, posix, process);
  return { resolve, load, loaded };
}
const entry = request => ({ namespace: 'file', importer: '<stdin>', path: request });
const fromSaved = request => ({ namespace: 'eye-history', importer: 'atlas-review/lib/nested-review-material.ts', path: request });

test('three exact loader seams restore every byte of the original theorem', () => {
  assert.equal(invert(candidate), original);
  let forward = original; for (const seam of seams) forward = once(forward, seam.before, seam.after);
  assert.equal(forward, candidate);
});
test('appended, removed or changed medical/history assertions cannot pass the actual inverse', () => {
  for (const altered of [candidate + '\nassert(false);', candidate.slice(0, -5), candidate.replace('assert.equal(review.files.length,944)', 'assert.equal(review.files.length,945)')])
    assert.throws(() => invert(altered));
});
test('both complete historical trees and named guide availability are genuine Git objects', () => {
  for (const [index, role] of roles.entries()) {
    assert.equal(git('rev-parse', role.commit + '^{tree}').trim(), role.tree);
    assert.equal(role.tracked.size, role.count);
    assert.equal(role.tracked.has('atlas-review/lib/eye-layer-guide.ts'), index === 0);
  }
});
test('entry, relative and alias application imports resolve only within their selected Git tree', () => {
  for (const role of roles) {
    const { resolve } = callbacks(role);
    assert.deepEqual(resolve(entry('./atlas-review/lib/nested-review-material')), { path: 'atlas-review/lib/nested-review-material.ts', namespace: 'eye-history' });
    assert.deepEqual(resolve(fromSaved('./nested-review')), { path: 'atlas-review/lib/nested-review.ts', namespace: 'eye-history' });
    assert.deepEqual(resolve(entry('@/atlas-review/lib/nested-review-material')), { path: 'atlas-review/lib/nested-review-material.ts', namespace: 'eye-history' });
  }
});
test('three actual current FDA files absent in both old trees are refused without filesystem fallback', () => {
  for (const role of roles) for (const file of ['atlas-review/lib/fda-reference-links.ts', 'atlas-review/lib/fda-shoulder-reference.ts', 'atlas-review/public/models/fda-shoulder-draft/catalog.json']) {
    assert(fs.existsSync(website + '/' + file)); assert.equal(role.tracked.has(file), false);
    assert.throws(() => callbacks(role).resolve(entry('./' + file)), /No saved/);
  }
});
test('current filesystem importers and unknown namespaces cannot enter the old application graph', () => {
  const { resolve } = callbacks(roles[0]);
  assert.throws(() => resolve({ ...entry('./atlas-review/lib/nested-review'), importer: website + '/lib/clinical-review-reference-selection.ts' }), /No current filesystem/);
  assert.throws(() => resolve({ ...entry('./atlas-review/lib/nested-review'), namespace: '', importer: website + '/lib/clinical-review-reference-selection.ts' }), /No current filesystem/);
  assert.throws(() => resolve({ ...entry('./atlas-review/lib/nested-review'), namespace: '', importer: '' }), /No current filesystem/);
  assert.throws(() => resolve({ ...entry('./atlas-review/lib/nested-review'), namespace: 'unknown' }), /No source resolution/);
  assert.throws(() => resolve({ ...fromSaved('./nested-review'), importer: 'missing-source.ts' }), /Only a saved module/);
});
test('POSIX, Windows drive, UNC, file URL and escaping paths all fail closed', () => {
  for (const request of ['/private/app.ts', 'F:/private/app.ts', String.raw`C:\private\app.ts`, String.raw`\\server\share\app.ts`, 'file:///F:/private/app.ts', '../outside.ts', '@/../outside.ts'])
    assert.throws(() => callbacks(roles[0]).resolve(entry(request)), /No absolute|inside the saved/);
});
test('the existing bare-package ABI stays external rather than sourcing current application files', () => {
  for (const request of ['react/jsx-runtime', 'next/link', 'next/navigation', 'node:crypto'])
    assert.deepEqual(callbacks(roles[0]).resolve(fromSaved(request)), { path: request, external: true });
});
test('the actual historical onLoad fetches exact Git bytes with replacement objects disabled', () => {
  for (const role of roles) {
    const { load, loaded } = callbacks(role), file = 'atlas-review/lib/nested-review-material.ts';
    const result = load({ path: file });
    assert.equal(result.contents.toString(), git('show', role.commit + ':' + file));
    assert.equal(result.loader, 'ts'); assert.equal(result.resolveDir, join(website, posix.dirname(file)));
    assert.deepEqual([...loaded], [file]);
  }
});
test('untracked and unsupported module loads refuse instead of falling through', () => {
  for (const role of roles) {
    const { load } = callbacks(role);
    assert.throws(() => load({ path: 'not-in-saved-tree.ts' }), /Only the complete/);
    const markdown = [...role.tracked].find(p => p.endsWith('.md')); assert(markdown);
    assert.throws(() => load({ path: markdown }), /Unsupported saved application/);
  }
});
test('actual esbuild stdin resolution obeys the candidate callback contract without loading application source', async () => {
  const requireSite = createRequire(website + '/package.json'), esbuild = requireSite('esbuild');
  const lock = JSON.parse(fs.readFileSync(website + '/package-lock.json', 'utf8'));
  assert.equal(esbuild.version, lock.packages['node_modules/esbuild'].version);
  const observed = [], { resolve } = callbacks(roles[0]);
  const result = await esbuild.build({
    stdin: { contents: "import assert from 'node:assert/strict'; export default assert;", loader: 'js', resolveDir: website },
    write: false, bundle: true, platform: 'node', format: 'esm', metafile: true, tsconfigRaw: {},
    plugins: [{ name: 'stdin-contract-control', setup(api) { api.onResolve({ filter: /.*/ }, args => { observed.push({ namespace: args.namespace, importer: args.importer, path: args.path }); return resolve(args); }); } }],
  });
  assert.equal(observed.length, 1);
  assert.deepEqual(Object.keys(result.metafile.inputs), ['<stdin>']);
  assert(result.metafile.outputs['stdin.js'].imports.every(row => row.external));
});

after(() => {
  assert.match(process.env.VM_EYE_PURE_PHASE, /^[a-z0-9-]+$/);
  fs.writeFileSync(stage + '/checks/' + process.env.VM_EYE_PURE_PHASE + '/MAIN_INVERSE.json', JSON.stringify({
    at: new Date().toISOString(), originalPath: website + '/' + path, originalSha256: sha(original),
    candidatePath: stage + '/candidate/' + path, candidateSha256: sha(candidate),
    seams, exactWholeOriginalRestored: true, assertionChanges: 0,
    actualApplicationBundleOrOriginalTestsRun: false, clinicalApproval: false, previewChanged: false,
  }, null, 2) + '\n', { flag: 'wx' });
});
