import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';
import { read, json, sha } from './source-only-backup-20261019.mjs';

const stage = 'F:/VisibleMedicine/staging/20261024-review-heading-proposal';
const prep = json(stage + '/PREPARATION.json');
const atlas = stage + '/atlas', folder = stage + '/checks/main-portable';
assert(!fs.existsSync(folder));
assert.equal(sha(read(prep.parentReceipt)), prep.parentReceiptSha256);
assert.equal(json('CURRENT_CHECKPOINT.json').activeWork.current.ownerPreviewPolicy.restartPermitted, false);
const reviewPath = 'app/review/body/review-dashboard.tsx';
const testPath = 'scripts/test-teaching-heading.mjs';
const rows = prep.rows.map(row => {
  const before = read(stage + '/preimages/' + row.path + '.raw');
  assert.equal(sha(before), row.sha256);
  assert.equal(sha(read(prep.parentAtlas + '/' + row.path)), row.sha256);
  const after = read(atlas + '/' + row.path);
  if (row.path === reviewPath) {
    const added = "import { teachingHeading } from '@/lib/teaching-heading';\n";
    const next = '<h4>{teachingHeading(topic.title, s.name)}</h4>';
    let inverse = after.toString('utf8');
    assert.equal(inverse.split(added).length, 2);
    assert.equal(inverse.split(next).length, 2);
    inverse = inverse.replace(added, '').replace(next, '<h4>{topic.title}</h4>');
    assert.equal(Buffer.compare(Buffer.from(inverse), before), 0, 'whole genuine original via exactly two seams');
  } else if (row.path === testPath) {
    assert.equal(Buffer.compare(after.subarray(0, before.length), before), 0, 'all four original tests exact prefix');
    assert(!after.includes(Buffer.from('20261024-pancreatic-venous-us-draft')), 'portable test, no dated sibling root');
    assert(after.includes(Buffer.from('createRequire(import.meta.url)')));
  } else assert.equal(Buffer.compare(after, before), 0, 'existing helper/learner unchanged');
  return { path: row.path, bytes: after.length, sha256: sha(after), parentSha256: row.sha256 };
});
const fromParent = createRequire(prep.parentAtlas + '/package.json');
const runtime = Object.fromEntries(['typescript', 'react', 'react-dom'].map(name => {
  const file = fromParent.resolve(name + '/package.json');
  return [name, { file: fs.realpathSync(file), sha256: sha(read(file)), version: json(file).version }];
}));
const routePaths = ['F:/VisibleMedicine/website/app/workspace/atlas-review/body/page.tsx', prep.parentAtlas + '/app/review/body/page.tsx'];
const routeRows = routePaths.map(file => ({ path: file, sha256: sha(read(file)) }));
assert.match(read(routePaths[0]).toString(), /from '@\/atlas-review\/app\/review\/body\/page'/);
assert.match(read(routePaths[1]).toString(), /import \{ BodyReviewDashboard \} from '\.\/review-dashboard'/);
fs.mkdirSync(folder, { recursive: true });
const write = (name, value) => fs.writeFileSync(folder + '/' + name, JSON.stringify(value, null, 2) + '\n', { flag: 'wx' });
write('STARTED.json', { at: new Date().toISOString(), rows, routeRows, runtime, originalTestsPreserved: 4, wholePriorDashboardInverse: true, sourceReceipt: prep.parentReceipt, sourceReceiptSha256: prep.parentReceiptSha256, memoryLimitMb: 128, fullAppGraphOrStrictCompiler: false });
const args = ['--max-old-space-size=128', '--test', '--test-concurrency=1', '--test-reporter=tap', atlas + '/' + testPath];
const result = spawnSync(process.execPath, args, {
  cwd: atlas, encoding: 'utf8', windowsHide: true, maxBuffer: 4e6,
  env: { ...process.env, NODE_OPTIONS: '--max-old-space-size=128', NODE_PATH: fs.realpathSync(prep.parentAtlas + '/node_modules'), GOMAXPROCS: '2', RAYON_NUM_THREADS: '1' },
});
fs.writeFileSync(folder + '/stdout.log', result.stdout ?? '', { flag: 'wx' });
fs.writeFileSync(folder + '/stderr.log', result.stderr ?? '', { flag: 'wx' });
for (const row of rows) {
  assert.equal(sha(read(atlas + '/' + row.path)), row.sha256);
  assert.equal(sha(read(prep.parentAtlas + '/' + row.path)), row.parentSha256);
}
for (const row of routeRows) assert.equal(sha(read(row.path)), row.sha256);
const counts = Object.fromEntries(['tests', 'pass', 'fail', 'cancelled', 'skipped', 'todo'].map(key => [key, Number(result.stdout?.match(new RegExp('^# ' + key + ' (\\d+)$', 'm'))?.[1] ?? -1)]));
write('TERMINAL.json', { at: new Date().toISOString(), args, exitCode: result.status, signal: result.signal, error: result.error?.message ?? null, counts, rows, routeRows, runtime, sourceUnchanged: true, stdoutSha256: sha(read(folder + '/stdout.log')), stderrSha256: sha(read(folder + '/stderr.log')), limits: 'Narrow real-component excerpt SSR and display formatter controls. No complete app import, configured strict graph, build, protected signed-in Review, browser or clinical acceptance.', previewChanged: false, installed: false });
console.log(JSON.stringify({ receipt: folder + '/TERMINAL.json', ...counts, code: result.status }));
if (result.status !== 0 || counts.tests !== 6 || counts.pass !== 6 || counts.fail !== 0) process.exitCode = 1;
