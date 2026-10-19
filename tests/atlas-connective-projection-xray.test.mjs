import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, extname, relative, resolve } from 'node:path';
import { runInNewContext } from 'node:vm';
import { build } from 'esbuild';
import test from 'node:test';
import { checkedAtlasSourceRepo } from './atlas-source-repo.mjs';
import { CURRENT_ATLAS_REVISION } from './current-atlas-delivery.mjs';
import { emittedTeaching } from './atlas-emitted-teaching.ts';
import { pathToFileURL } from 'node:url';

// Original feature admission stays immutable; current delivery has its own pin.
const revision = '408759d57644b05402e98a937e7cf6338b5509cf';
const deliveryRevision = CURRENT_ATLAS_REVISION;
const parent = 'ac71406105da66f77115117bbab2c38428f7e5c3';
const root = process.cwd();
const sourceRepo = checkedAtlasSourceRepo(deliveryRevision);
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const json = path => JSON.parse(readFileSync(path, 'utf8'));
const gitBytes = (commit, path) => execFileSync('git', ['-C', sourceRepo, 'show', `${commit}:${path}`], {
  windowsHide: true, maxBuffer: 32e6, env: { ...process.env, GIT_NO_REPLACE_OBJECTS: '1' },
});
const same = (actual, expected, label) => assert.deepEqual(structuredClone(actual), structuredClone(expected), label);

async function liveApi() {
  const entry = [
    "export * from './atlas-review/lib/connective-projection-xray';",
    "export * from './atlas-review/content/connective-projection-xray';",
    "export {bodyLesson,bodyContent} from './atlas-review/app/body-content';",
    "export {bodyDisplayCatalog} from './atlas-review/lib/body-display-catalog';",
    "export * from './atlas-review/lib/body-review-material';",
    "export * from './atlas-review/lib/body-review-context';",
    "export * from './atlas-review/lib/body-review-response';",
    "export * from './atlas-review/lib/body-review-api';",
    "export * from './atlas-review/lib/body-review-decisions';",
  ].join('');
  const built = await build({ stdin: { contents: entry, resolveDir: root, loader: 'ts' },
    bundle: true, write: false, format: 'cjs', platform: 'node', packages: 'external' });
  const module = { exports: {} };
  runInNewContext(built.outputFiles[0].text, { module, exports: module.exports,
    require: createRequire(root + '/package.json'), crypto, TextEncoder, TextDecoder,
    Request, Response, URL, URLSearchParams, structuredClone });
  return module.exports;
}

async function parentReviewApi() {
  const files = new Set(execFileSync('git', ['-C', sourceRepo, 'ls-tree', '-r', '--name-only', parent],
    { encoding: 'utf8', windowsHide: true }).split(/\r?\n/));
  const entry = "export * from './lib/body-review-material';" +
    "export * from './lib/body-review-context';";
  const built = await build({ stdin: { contents: entry, resolveDir: sourceRepo, loader: 'ts' },
    bundle: true, write: false, format: 'cjs', platform: 'node', packages: 'external',
    plugins: [{ name: 'parent-atlas-source', setup(plugin) {
      plugin.onResolve({ filter: /.*/ }, args => {
        if (!args.path.startsWith('.') && !args.path.startsWith('@/')) return;
        const target = args.path.startsWith('@/')
          ? resolve(sourceRepo, args.path.slice(2)) : resolve(args.resolveDir, args.path);
        const path = relative(sourceRepo, target).replaceAll('\\', '/');
        assert.ok(!path.startsWith('..'), `historical import outside Atlas: ${path}`);
        for (const suffix of ['', '.ts', '.tsx', '.json', '/index.ts']) {
          if (files.has(path + suffix))
            return { path: resolve(sourceRepo, path + suffix), namespace: 'parent-atlas-source' };
        }
        throw Error(`Missing historical Atlas module: ${path}`);
      });
      plugin.onLoad({ filter: /.*/, namespace: 'parent-atlas-source' }, args => {
        const path = relative(sourceRepo, args.path).replaceAll('\\', '/');
        return { contents: gitBytes(parent, path).toString(),
          loader: ({ '.ts': 'ts', '.tsx': 'tsx', '.json': 'json' })[extname(path)] || 'js',
          resolveDir: dirname(args.path) };
      });
    } }] });
  const module = { exports: {} };
  runInNewContext(built.outputFiles[0].text, { module, exports: module.exports,
    require: createRequire(sourceRepo + '/package.json'), crypto, TextEncoder, TextDecoder,
    Request, Response, URL, URLSearchParams, structuredClone });
  return module.exports;
}

test('four exact connective X-ray drafts reach runtime and revision-bound Review', async () => {
  const paths = ['app/body-content.ts', 'lib/connective-projection-xray.ts',
    'content/connective-projection-xray.ts', 'content/connective-imaging-pins.json',
    'content/foot-surface-imaging-pins.json'];
  const review = json('atlas-review/manifest.json');
  const base = 'public/atlas-runtime/head-neck/';
  const manifest = json(base + 'manifest.json');
  const inputs = json(base + 'source-inputs.json');
  assert.equal(review.revision, deliveryRevision);
  assert.equal(manifest.sourceCommit, deliveryRevision);
  for (const path of paths) {
    const row = review.files.find(file => file.path === path);
    assert.ok(row, `Review imports ${path}`);
    assert.equal(row.sourceSha256, sha(gitBytes(deliveryRevision, path)), `${path} current committed source`);
    assert.equal(row.importedSha256, sha(readFileSync(`atlas-review/${path}`)), `${path} imported bytes`);
    same(inputs.filter(input => input.path === path),
      [{ path, sha256: row.sourceSha256 }], `head-neck input ${path}`);
  }
  for (const path of paths.slice(3))
    assert.equal(sha(gitBytes(revision, path)), sha(gitBytes(parent, path)), `${path} original identity pin`);
  for (const path of paths.slice(1))
    assert.deepEqual(gitBytes(deliveryRevision, path), gitBytes(revision, path),
      `${path} feature source remains exact in current delivery`);
  for (const flag of ['patientDataIncluded', 'clinicalApproved', 'standaloneReviewConnection', 'imagingConnection'])
    assert.equal(manifest[flag], false, flag);

  const api = await liveApi();
  const prior = await parentReviewApi();
  const {exactSourceHistoryApi} = await import(pathToFileURL(sourceRepo + '/scripts/exact-source-history-api.mjs').href);
  const feature = await exactSourceHistoryApi(revision, 'review-security');
  const catalog = api.bodyDisplayCatalog(json('atlas-review/public/models/bodyparts3d/full-body/catalog.json'));
  const wrist = json('atlas-review/content/connective-imaging-pins.json').entries
    .filter(entry => entry.group === 'wrist').map(entry => ({ group: 'wrist', identity: entry.identity }));
  const foot = json('atlas-review/content/foot-surface-imaging-pins.json').entries
    .filter(entry => entry.family === 'longPlantar')
    .map(entry => ({ group: 'longPlantar', identity: entry.identity }));
  const targets = [...wrist, ...foot];
  assert.equal(targets.length, 4);
  same(api.connectiveProjectionXrayGroups,
    { wrist: ['FMA40120', 'FMA40121'], longPlantar: ['FMA44249', 'FMA44250'] }, 'exact admitted groups');
  same(targets.map(({ identity }) => identity.fmaId).sort(),
    ['FMA40120', 'FMA40121', 'FMA44249', 'FMA44250'], 'exact pinned FMA identities');
  assert.equal(new Set(targets.map(({ identity }) => identity.id)).size, 4);

  const emitted = emittedTeaching(base, manifest.files, true);
  for (const topic of Object.values(api.connectiveProjectionXrayTopics))
    for (const value of [topic.body, ...topic.bullets, ...topic.citations])
      assert.ok(emitted.includes(value) || emitted.includes(JSON.stringify(value).slice(1, -1)),
        'source teaching text reaches emitted shared module graph');
  for (const { identity } of targets)
    assert.ok(emitted.includes(identity.id), `emitted source identity ${identity.id}`);

  let identityRefusals = 0;
  let worksheetRefusals = 0;
  let storageCalls = 0;
  for (const { group, identity } of targets) {
    const selected = catalog.structures.find(s => s.id === identity.id);
    same(selected, identity, `full unchanged source identity ${identity.id}`);
    const lesson = api.bodyLesson(selected, 'xray');
    assert.equal(lesson.readiness, 'draft');
    same(lesson, api.connectiveProjectionXrayLesson(selected, 'xray'), 'real learner resolver');
    same(lesson, feature.bodyLesson(selected, 'xray'), 'immutable feature-era X-ray teaching');
    const { readiness, ...shown } = lesson;
    same(api.bodyContent(selected, 'xray'), shown, 'learner content section');
    same({ body: lesson.body, bullets: lesson.bullets, citations: lesson.citations },
      api.connectiveProjectionXrayTopics[group], 'group teaching');
    assert.match(lesson.note, /revision-bound radiologist review pending/i);
    assert.match(lesson.note, /not validated ligament visibility/i);
    assert.match(lesson.note, /Atlas, imaging-case and paid-lecture access remain independent/i);
    for (const tab of ['anatomy', 'mri', 'ct', 'ultrasound', 'quiz']) {
      assert.equal(api.connectiveProjectionXrayLesson(selected, tab), undefined);
      identityRefusals++;
    }
    for (const edit of [s => { s.bounds.min[0] += .01; },
      s => { s.sources[0].sha256 = '0'.repeat(64); },
      s => { s.regions.push('foreign'); },
      s => { s.provenance.license = 'foreign'; },
      s => { s.foreign = true; }]) {
      const foreign = structuredClone(selected); edit(foreign);
      assert.equal(api.connectiveProjectionXrayLesson(foreign, 'xray'), undefined);
      assert.notEqual(api.bodyLesson(foreign, 'xray').readiness, 'draft');
      identityRefusals++;
    }
    const worksheet = await api.bodyReviewMaterial(selected.id);
    const oldWorksheet = await prior.bodyReviewMaterial(selected.id);
    assert.ok(worksheet && oldWorksheet);
    assert.equal(worksheet.approval, false);
    const featureWorksheet = await feature.bodyReviewMaterial(selected.id);
    assert(featureWorksheet);
    same(worksheet.topics.find(topic => topic.tab === 'xray'),
      featureWorksheet.topics.find(topic => topic.tab === 'xray'),
      'immutable feature-era X-ray worksheet topic');
    same(worksheet.topics.find(topic => topic.tab === 'xray'), { tab: 'xray', ...lesson },
      'current Review worksheet reflects learner draft');
    assert.ok(await api.parseBodyReviewResponse(worksheet, selected.id));
    assert.equal(await api.parseBodyReviewResponse(oldWorksheet, selected.id), null);
    worksheetRefusals++;
    for (const edit of [w => { w.topics.find(topic => topic.tab === 'xray').body += ' foreign'; },
      w => { w.topics.find(topic => topic.tab === 'xray').readiness = 'approved'; },
      w => { w.source.structure.sources = []; }, w => { w.approval = true; }]) {
      const forged = structuredClone(worksheet); edit(forged);
      assert.equal(await api.parseBodyReviewResponse(forged, selected.id), null);
      worksheetRefusals++;
    }
    const current = await api.bodyReviewContext(selected.id);
    const old = await prior.bodyReviewContext(selected.id);
    assert.ok(current && old);
    assert.equal(current.sourceHash, old.sourceHash, 'source identity unchanged');
    assert.notEqual(current.revisions.teaching, old.revisions.teaching, 'teaching revision advanced');
    assert.equal(current.revisions.imaging, null);
    assert.ok(current.blockers.imaging.some(text => /No validated acquired-image series/.test(text)));
    const packet = context => ({ catalogScope: context.catalogScope, structureId: selected.id,
      track: 'teaching', expectedVersion: 0, materialHash: context.materialHash,
      revisionHash: context.revisions.teaching, checklistVersion: context.checklistVersion,
      draft: api.blankBodyReview(current, 'teaching') });
    for (const stale of [packet(old), { ...packet(current), revisionHash: '0'.repeat(64) },
      { ...packet(current), materialHash: '0'.repeat(64) }]) {
      const response = await api.postBodyDecision(new Request('https://atlas.test/api/body-review/decisions', {
        method: 'POST', headers: { origin: 'https://atlas.test', 'content-type': 'application/json',
          'oai-authenticated-user-id': 'SYNTHETIC_CONNECTIVE_XRAY_REVIEWER' },
        body: JSON.stringify(stale),
      }), { prepare() { storageCalls++; throw Error('Stale evidence reached storage'); } });
      assert.equal(response.status, 409);
    }
  }
  assert.equal(identityRefusals, 40);
  assert.equal(worksheetRefusals, 20);
  assert.equal(storageCalls, 0);
  for (const path of ['lib/independent-study-links.ts', 'lib/didanix-atlas-adapter.ts',
    'lib/atlas-practice.ts'])
    assert.equal(sha(gitBytes(revision, path)), sha(gitBytes(parent, path)), `${path} access seam unchanged`);
  console.log(JSON.stringify({ revision, deliveryRevision, sourceBindings: 4, deliveryInputs: paths.length,
    identityRefusals, worksheetRefusals, staleOrForgedSavesRefused: 12,
    storageCalls, clinicalApproval: false, patientRegistration: false }));
});
