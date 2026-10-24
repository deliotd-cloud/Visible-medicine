// Pure source/Git controls only: no original application suite is imported.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { execFileSync, spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import test from 'node:test';
import { read, json, sha } from './source-only-backup-20261019.mjs';

const scene = 'F:/VisibleMedicine/staging/20261024-scene-epoch-proposal';
const nonhead = 'F:/VisibleMedicine/staging/20261024-nonhead-harness-proposal';
const stage = 'F:/VisibleMedicine/staging/20261024-additional-release-proposals';
const sourceReceipt = 'F:/VisibleMedicine/staging/20261024-pancreatic-us-website/SOURCE_BOUND.json';
assert.equal(sha(read(sourceReceipt)), 'cf587b88877f0a51b082e1ac039792938ccd6f0a6272a958669651a651b22a8e');
const source = json(sourceReceipt), native = 'F:/VisibleMedicine/staging/20261024-pancreatic-venous-us-draft/atlas';
const sceneInfo = json(scene + '/INVERSE.json');
const helperImport = "import {beforeToolbarContrastCss} from './scene-epoch-css-inverse.mjs';\n";
const seams = new Map([
  ['atlas-contextual-undo.test.ts', [
    { after: helperImport, before: '' },
    { after: "  const preContrastCss=cssAt('fa1bf9a233c6989fef42b533bbbac9d6ab034311');\n  assert.deepEqual(preContrastCss,Buffer.concat([historicalCss,append]),'Complete original CSS plus only the exact reviewed desktop-gutter append at its historical source epoch');\n  assert.deepEqual(beforeToolbarContrastCss(committedCss),preContrastCss,'Current source preserves the whole pre-contrast CSS through one exact toolbar seam');", before: "  assert.deepEqual(committedCss,Buffer.concat([historicalCss,append]),'Complete original CSS plus only the exact reviewed desktop-gutter append');" },
  ]],
  ['atlas-scene-sizing.test.ts', [
    { after: helperImport, before: '' },
    { after: "  const preContrastCss=execFileSync('git',['show','fa1bf9a233c6989fef42b533bbbac9d6ab034311:app/body-explorer.css'],{cwd:currentAtlasDeliveryRoot(),maxBuffer:32e6,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}});\n  assert.deepEqual(preContrastCss,Buffer.concat([historicalCss,append]),'Exact previous CSS plus only the reviewed desktop gutter append at its historical source epoch');\n  assert.deepEqual(beforeToolbarContrastCss(source),preContrastCss,'Current source preserves the whole pre-contrast CSS through one exact toolbar seam');", before: "  assert.deepEqual(source,Buffer.concat([historicalCss,append]),'Exact previous CSS plus only the reviewed desktop gutter append');" },
  ]],
  ['atlas-regional-spread.test.ts', [
    { after: "const currentShoulderExplorerSha='4096396d647711652aa7d8a605c32c45edfc8e8c0aa90c9af31250d19464a045';\n", before: '' },
    { after: " assert.equal(sha(sourceAtRevision('fa1bf9a233c6989fef42b533bbbac9d6ab034311','app/shoulder-explorer.tsx')),shoulderSearchExplorerSha,\n  'The historical shoulder search source remains pinned at its actual source epoch');\n const currentShoulder=sourceAtRevision(CURRENT_ATLAS_REVISION,'app/shoulder-explorer.tsx');\n assert.equal(sha(currentShoulder),currentShoulderExplorerSha,'Later shoulder UI source is independently pinned');\n assert.equal(new Map(revisions.display).get('app/shoulder-explorer.tsx'),sha(currentShoulder),\n  'Current Review display pin follows the exact later shoulder UI source');", before: " assert.equal(new Map(revisions.display).get('app/shoulder-explorer.tsx'),shoulderSearchExplorerSha,\n  'The later shoulder UI revision is source-pinned separately from the a104 Spread milestone');" },
  ]],
]);
const nonheadFile = nonhead + '/candidate/tests/atlas-nonhead-comparison-ui.test.mjs';
const appendedMarker = "\ntest('real query validators keep regional tours separate from study and head-learning handoffs'";
const newTourImports = "const {atlasBodyRegions,selectedBodyRegion}=compiled('lib/atlas-navigation.ts');\nconst {regionalTourEntrySuffix}=compiled('lib/regional-tour-entry-navigation.ts',{\n  './atlas-navigation':{atlasBodyRegions},\n});\nconst {hasHeadLearningQuery}=require('../lib/head-atlas-learning.ts');";
const newPageImports = "  '../../../lib/regional-tour-entry-navigation':{regionalTourEntrySuffix},\n  '../../../lib/head-atlas-learning':{hasHeadLearningQuery},\n";
const reverse = (text, replacements) => {
  for (const seam of replacements) { assert.equal(text.split(seam.after).length, 2, 'one exact inverse seam'); text = text.replace(seam.after, seam.before); }
  return Buffer.from(text);
};
const selected = [...Object.keys(sceneInfo.candidateSha256).map(file => scene + '/candidate/' + file), nonheadFile];
const gitBytes = (revision, file) => execFileSync('git', ['-C', native, 'show', revision + ':' + file], { windowsHide: true, maxBuffer: 4e6, env: { ...process.env, GIT_NO_REPLACE_OBJECTS: '1', GIT_TERMINAL_PROMPT: '0' } });

if (process.env.VM_ADDITIONAL_SOURCE_CONTROLS === '1') {
  for (const [file, replacements] of seams) test('whole original assertion file reconstructs exactly: ' + file, () => {
    const original = read(source.website + '/tests/' + file);
    assert.equal(sha(original), sceneInfo.originalTestsSha256['tests/' + file]);
    assert.equal(sha(original), source.sourceRows.find(row => row.path === 'tests/' + file).sha256);
    const candidate = read(scene + '/candidate/tests/' + file);
    assert.equal(sha(candidate), sceneInfo.candidateSha256['tests/' + file]);
    assert.deepEqual(reverse(candidate.toString(), replacements), original);
    assert.throws(() => reverse(candidate.toString().replace(replacements[1].after, 'tampered theorem'), replacements));
  });
  test('nonhead harness preserves the full original and uses genuine query implementations', () => {
    const text = read(nonheadFile).toString(), offset = text.indexOf(appendedMarker);
    assert(offset > 0); assert.equal(text.split(appendedMarker).length, 2);
    const original = read(nonhead + '/preimage.test.mjs.raw');
    assert.equal(sha(original), 'c5f978d63d09ffbfaee2b0ecdf3c12dc9224554c29a09310aa3bb7eb52b9ba6f');
    assert.deepEqual(original, read(source.website + '/tests/atlas-nonhead-comparison-ui.test.mjs'));
    const prior = reverse(text.slice(0, offset), [
      { after: newTourImports, before: "const {selectedBodyRegion}=compiled('lib/atlas-navigation.ts');" },
      { after: newPageImports, before: '' },
    ]);
    assert.deepEqual(prior, original);
    assert.equal((text.match(/^test\(/gm) ?? []).length, (original.toString().match(/^test\(/gm) ?? []).length + 1);
    assert.match(text, /assert\.ok\(Object\.hasOwn\(imports,id\),`unexpected import/);
    assert.match(text, /const \{hasHeadLearningQuery\}=require\('\.\.\/lib\/head-atlas-learning\.ts'\)/);
    for (const token of ['headTour', 'headStep', 'headRevision', "patientId:'private'", "tourRevision:'../invalid'", "tourSource:'a'.repeat(39)"])
      assert(text.slice(offset).includes(token), token);
  });
  const { beforeToolbarContrastCss } = await import(pathToFileURL(scene + '/candidate/tests/scene-epoch-css-inverse.mjs'));
  const current = gitBytes(sceneInfo.currentAtlasCommit, 'app/body-explorer.css');
  const historical = gitBytes(sceneInfo.css.preContrastGitCommit, 'app/body-explorer.css');
  test('actual whole current Git CSS inverts to actual historical CSS and compact source plus exact gutter', () => {
    const compact = gitBytes(sceneInfo.css.compactGitCommit, 'app/body-explorer.css');
    const append = read(source.website + '/tests/fixtures/drawable-space-css-append.css.raw');
    for (const [bytes, expected] of [[current, sceneInfo.css.currentSha256], [historical, sceneInfo.css.preContrastSha256], [compact, sceneInfo.css.compactSha256], [append, sceneInfo.css.gutterAppendSha256]]) assert.equal(sha(bytes), expected);
    assert.deepEqual(historical, Buffer.concat([compact, append]));
    assert.deepEqual(beforeToolbarContrastCss(current), historical);
    assert.equal(sha(read(native + '/app/body-explorer.css')), sha(current));
  });
  test('strict CSS inverse refuses tampered, shortened, extended, historical and non-buffer inputs', () => {
    const altered = Buffer.from(current); altered[0] ^= 1;
    for (const bytes of [altered, current.subarray(1), current.subarray(0, -1), Buffer.concat([current, Buffer.from('\n')]), historical]) assert.throws(() => beforeToolbarContrastCss(bytes));
    for (const value of [null, undefined, current.toString(), new Uint8Array(current)]) assert.throws(() => beforeToolbarContrastCss(value));
  });
  test('historical shoulder fingerprint stays distinct from exact current source and Review pin', () => {
    const before = gitBytes(sceneInfo.shoulder.historicalGitCommit, sceneInfo.shoulder.path);
    const now = gitBytes(sceneInfo.currentAtlasCommit, sceneInfo.shoulder.path);
    assert.equal(sha(before), sceneInfo.shoulder.historicalSha256);
    assert.equal(sha(now), sceneInfo.shoulder.currentSha256);
    assert.notEqual(sha(before), sha(now));
    assert.equal(new Map(json(source.website + '/atlas-review/content/review-revisions.json').display).get(sceneInfo.shoulder.path), sha(now));
  });
  test('all candidate and baseline source hashes remain independently bound', () => {
    for (const [file, hash] of Object.entries(sceneInfo.candidateSha256)) assert.equal(sha(read(scene + '/candidate/' + file)), hash);
    for (const file of ['lib/regional-tour-entry-navigation.ts', 'lib/head-atlas-learning.ts', 'lib/atlas-navigation.ts', 'app/atlas/3d/page.tsx']) assert.equal(sha(read(source.website + '/' + file)), source.sourceRows.find(row => row.path === file).sha256);
    assert.equal(sha(read(sourceReceipt)), sceneInfo.frozenWebsiteSourceBoundSha256);
  });
} else {
  assert(!fs.existsSync(stage)); fs.mkdirSync(stage);
  const folder = stage + '/checks/source-only-v1'; fs.mkdirSync(folder, { recursive: true });
  const rows = selected.map(file => ({ path: file, bytes: read(file).length, sha256: sha(read(file)) }));
  const write = (name, value) => fs.writeFileSync(folder + '/' + name, JSON.stringify(value, null, 2) + '\n', { flag: 'wx' });
  const recipeSha256 = sha(read(new URL(import.meta.url)));
  write('STARTED.json', { at: new Date().toISOString(), rows, recipeSha256, sourceReceipt, sourceReceiptSha256: sha(read(sourceReceipt)), originalApplicationGraphOrSuiteRun: false });
  const result = spawnSync(process.execPath, ['--max-old-space-size=128', '--test', '--test-concurrency=1', '--test-reporter=tap', new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')], { encoding: 'utf8', windowsHide: true, maxBuffer: 4e6, env: { ...process.env, NODE_OPTIONS: '--max-old-space-size=128', VM_ADDITIONAL_SOURCE_CONTROLS: '1' } });
  fs.writeFileSync(folder + '/stdout.log', result.stdout ?? '', { flag: 'wx' }); fs.writeFileSync(folder + '/stderr.log', result.stderr ?? '', { flag: 'wx' });
  const counts = Object.fromEntries(['tests', 'pass', 'fail', 'cancelled', 'skipped', 'todo'].map(key => [key, Number(result.stdout?.match(new RegExp('^# ' + key + ' (\\d+)$', 'm'))?.[1] ?? -1)]));
  for (const row of rows) assert.equal(sha(read(row.path)), row.sha256);
  const syntax = rows.map(row => {
    const result = spawnSync(process.execPath, ['--check', row.path], { encoding: 'utf8', windowsHide: true });
    assert.equal(result.status, 0, result.stderr); return { path: row.path, sha256: row.sha256, exitCode: result.status };
  });
  assert.equal(sha(read(new URL(import.meta.url))), recipeSha256);
  write('TERMINAL.json', { at: new Date().toISOString(), exitCode: result.status, signal: result.signal, counts, rows, recipeSha256, syntax, stdoutSha256: sha(read(folder + '/stdout.log')), stderrSha256: sha(read(folder + '/stderr.log')), originalApplicationGraphOrSuiteRun: false, previewChanged: false });
  console.log(JSON.stringify({ terminal: folder + '/TERMINAL.json', ...counts, code: result.status }));
  if (result.status !== 0 || counts.tests !== 8 || counts.pass !== 8 || counts.fail !== 0) process.exitCode = 1;
}
