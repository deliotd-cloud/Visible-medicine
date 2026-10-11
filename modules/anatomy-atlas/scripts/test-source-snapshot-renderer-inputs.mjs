import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {auditRendererInputs} from './source-snapshot-renderer-inputs.mjs';

const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const blob = bytes => createHash('sha1').update(`blob ${bytes.length}\0`).update(bytes).digest('hex');
const program = 'scripts/body-renderer-revisions.mjs';
const pinned = '6a297c3c75b427d275e3c63dc5a275b880430667237b1b3fa0f1991b9a4f4baf';
const command = 'node scripts/body-renderer-revisions.mjs';
const seeds = [
  'app/body-explorer.tsx', 'app/layout.tsx', 'app/globals.css', 'vite.config.ts',
  'package.json', 'package-lock.json', 'scripts/compress-model-delivery.mjs',
  'scripts/glb-lossless-codec.mjs',
];
const fixture = (extra = {}, options = {}) => {
  const content = new Map();
  for (const path of seeds) content.set(path, Buffer.from(extra[path] ?? ''));
  for (const [path, value] of Object.entries(extra)) content.set(path, Buffer.from(value));
  const rows = new Map([...content].map(([path, bytes]) => [path,
    {path, mode: '100644', type: 'blob', gitBlob: blob(bytes), bytes: bytes.length}]));
  const reads = [], adds = [];
  const input = {path: program, sha256: pinned, invocations: [command], rows,
    add: (path, reason) => { adds.push([path, reason]); return !options.held?.has(path) && rows.has(path); },
    readCode: async (path) => { reads.push(path); if (options.missingRead?.has(path)) return undefined;
      if (options.throwRead?.has(path)) throw Error('synthetic read failure'); return content.get(path); }};
  return {input, rows, reads, adds, content};
};
const audit = f => auditRendererInputs(f.input);
const codes = report => report.issues.map(item => item.code);

test('only exact path, normalized program hash and sole default invocation qualify', async () => {
  const f = fixture();
  for (const change of [
    {path: 'scripts/other.mjs'}, {sha256: '0'.repeat(64)}, {invocations: []},
    {invocations: [command, command]}, {invocations: [command + ' --check']},
  ]) assert.equal(await auditRendererInputs({...f.input, ...change}), null);
  assert.equal(f.reads.length, 0);
  const report = await audit(f);
  assert.equal(report.graphComplete, true);
  assert.deepEqual(report.entrypoints, seeds);
  assert.equal(report.dependencies.length, seeds.length);
  assert.equal(report.sourceExecutionObserved, false);
  assert.equal(report.installedToolIdentityVerified, false);
  assert.equal(Object.hasOwn(report, 'closureProven'), false);
  assert.deepEqual(f.reads, seeds);
});

test('recursive TS and CSS imports follow exact suffix order and stable normalized report hash', async () => {
  const f = fixture({
    'app/body-explorer.tsx': `import './local';\nimport '@/lib/root';\n`,
    'app/globals.css': `@import "./colors.css";\n@import url('../styles/more.css');\n`,
    'app/local.ts': `export {thing} from '../lib/thing';\n`,
    'app/local.tsx': `throw Error('wrong suffix');\n`,
    'lib/root/index.ts': `export const root = 1;\n`,
    'lib/thing.mjs': `export const thing = 1;\n`,
    'app/colors.css': `@import '../styles/more.css';\n`,
    'styles/more.css': `body { color: black; }\n`,
  });
  const report = await audit(f);
  assert.equal(report.graphComplete, true, JSON.stringify(report.issues));
  const paths = report.dependencies.map(item => item.path);
  assert(paths.includes('app/local.ts'));
  assert(!paths.includes('app/local.tsx'));
  assert(paths.includes('lib/root/index.ts'));
  assert(paths.includes('lib/thing.mjs'));
  assert.equal(paths.filter(path => path === 'styles/more.css').length, 1);
  assert.deepEqual(paths, [...paths].sort((a, b) => a.localeCompare(b)));
  assert.equal(report.normalizedDependenciesSha256, sha(JSON.stringify(
    report.dependencies.map(({path, normalizedSha256}) => ({path, sha256: normalizedSha256})))));
});

test('chosen held, missing, and nonregular inputs are never read or bypassed by suffix fallback', async () => {
  const f = fixture({'app/body-explorer.tsx': `import './held';\nimport './absent';\nimport './link';\n`,
    'app/held.ts': 'held secret', 'app/held.tsx': 'allowed fallback',
    'app/link.ts': 'symlink target', 'app/link.tsx': 'allowed fallback'} ,
    {held: new Set(['app/held.ts'])});
  f.rows.set('app/link.ts', {...f.rows.get('app/link.ts'), mode: '120000'});
  const report = await audit(f);
  assert.equal(report.graphComplete, false);
  assert(codes(report).includes('HELD_INPUT'));
  assert(codes(report).includes('UNRESOLVED_LOCAL_IMPORT'));
  assert(codes(report).includes('NONREGULAR_GIT_INPUT'));
  for (const path of ['app/held.ts', 'app/link.ts', 'app/held.tsx', 'app/link.tsx'])
    assert(!f.reads.includes(path));
  assert(f.adds.some(([path]) => path === 'app/held.ts'));
  assert.equal(report.normalizedDependenciesSha256, null);
  assert(!JSON.stringify(report).includes('held secret'));
});

test('computed imports, parse errors, escapes, and circular destination remain explicit', async () => {
  const f = fixture({'app/body-explorer.tsx': `import('./literal.ts');\nimport(variable);\nimport './broken';\nimport '../content/body-renderer-revision.json';\nimport '../../escape';\nimport 'C:\\Windows\\evil';\n`,
    'app/literal.ts': 'export {}',
    'app/broken.ts': 'const = ;',
    'content/body-renderer-revision.json': '{"saved":"not proof"}',
  });
  const report = await audit(f);
  for (const code of ['COMPUTED_IMPORT', 'SOURCE_PARSE', 'CIRCULAR_METADATA', 'UNSAFE_LOCAL_IMPORT'])
    assert(codes(report).includes(code), code);
  assert(!f.reads.includes('content/body-renderer-revision.json'));
  assert(!f.reads.includes('C:/Windows/evil'));
  assert.equal(report.graphComplete, false);
});

test('CRLF hashes preserve raw identity and normalize revision bytes; arbitrary side effects never execute', async () => {
  globalThis.rendererFixtureSideEffect = 0;
  const f = fixture({'app/body-explorer.tsx': `import './side-effect.js';\r\n`,
    'app/side-effect.js': `globalThis.rendererFixtureSideEffect++;\r\n`});
  const report = await audit(f);
  assert.equal(report.graphComplete, true, JSON.stringify(report.issues));
  const row = report.dependencies.find(row => row.path === 'app/body-explorer.tsx');
  assert.equal(row.rawSha256, sha(f.content.get(row.path)));
  assert.equal(row.normalizedSha256, sha(`import './side-effect.js';\n`));
  assert.notEqual(row.rawSha256, row.normalizedSha256);
  assert.equal(globalThis.rendererFixtureSideEffect, 0);
  delete globalThis.rendererFixtureSideEffect;
});

test('undefined reads, thrown reads, and mismatched bytes cannot complete a graph', async () => {
  for (const options of [{missingRead: new Set(['app/layout.tsx'])},
    {throwRead: new Set(['app/layout.tsx'])}]) {
    const f = fixture({}, options);
    const report = await audit(f);
    assert.equal(report.graphComplete, false);
    assert.equal(report.normalizedDependenciesSha256, null);
    assert(codes(report).includes(options.missingRead ? 'READ_UNRESOLVED' : 'READ_ERROR'));
  }
  const f = fixture();
  f.content.set('app/layout.tsx', Buffer.from('changed'));
  const report = await audit(f);
  assert(codes(report).includes('BLOB_MISMATCH'));
  assert.equal(report.graphComplete, false);
});
