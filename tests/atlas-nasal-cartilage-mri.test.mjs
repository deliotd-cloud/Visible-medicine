// Current delivery after the408759 import; nasal admission remains the exact9f→ac714 epoch in Atlas source tests.
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

const revision = '408759d57644b05402e98a937e7cf6338b5509cf';
const deliveryRevision = CURRENT_ATLAS_REVISION;
const parent = '9fba9a1e24b6669aafd48e945d55fc0939d50ab2';
const root = process.cwd();
const sourceRepo = checkedAtlasSourceRepo(deliveryRevision);
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const json = path => JSON.parse(readFileSync(path, 'utf8'));
const source = path => execFileSync('git', ['-C', sourceRepo, 'show', `${revision}:${path}`], {
  windowsHide: true, maxBuffer: 32e6, env: { ...process.env, GIT_NO_REPLACE_OBJECTS: '1' },
});
const currentSource = path => execFileSync('git', ['-C', sourceRepo, 'show', `${deliveryRevision}:${path}`], {
  windowsHide: true, maxBuffer: 32e6, env: { ...process.env, GIT_NO_REPLACE_OBJECTS: '1' },
});
const same = (actual, expected, label) => assert.deepEqual(structuredClone(actual), structuredClone(expected), label);

async function liveApi() {
  const entry = [
    "export * from './atlas-review/lib/nasal-cartilage-mri';",
    "export * from './atlas-review/content/nasal-cartilage-mri';",
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

async function previousReviewApi() {
  const files = new Set(execFileSync('git', ['-C', sourceRepo, 'ls-tree', '-r', '--name-only', parent],
    { encoding: 'utf8', windowsHide: true }).split(/\r?\n/));
  const entry = "export * from './lib/body-review-material';" +
    "export * from './lib/body-review-context';";
  const built = await build({ stdin: { contents: entry, resolveDir: sourceRepo, loader: 'ts' },
    bundle: true, write: false, format: 'cjs', platform: 'node', packages: 'external',
    plugins: [{ name: 'previous-atlas-source', setup(plugin) {
      plugin.onResolve({ filter: /.*/ }, args => {
        if (!args.path.startsWith('.') && !args.path.startsWith('@/')) return;
        const target = args.path.startsWith('@/')
          ? resolve(sourceRepo, args.path.slice(2)) : resolve(args.resolveDir, args.path);
        const path = relative(sourceRepo, target).replaceAll('\\', '/');
        assert.ok(!path.startsWith('..'), `historical import outside Atlas: ${path}`);
        for (const suffix of ['', '.ts', '.tsx', '.json', '/index.ts']) {
          if (files.has(path + suffix))
            return { path: resolve(sourceRepo, path + suffix), namespace: 'previous-atlas-source' };
        }
        throw Error(`Missing historical Atlas module: ${path}`);
      });
      plugin.onLoad({ filter: /.*/, namespace: 'previous-atlas-source' }, args => {
        const path = relative(sourceRepo, args.path).replaceAll('\\', '/');
        const bytes = execFileSync('git', ['-C', sourceRepo, 'show', `${parent}:${path}`],
          { windowsHide: true, maxBuffer: 32e6, env: { ...process.env, GIT_NO_REPLACE_OBJECTS: '1' } });
        return { contents: bytes.toString(), loader: ({ '.ts': 'ts', '.tsx': 'tsx', '.json': 'json' })[extname(path)] || 'js',
          resolveDir: dirname(args.path) };
      });
    } }] });
  const module = { exports: {} };
  runInNewContext(built.outputFiles[0].text, { module, exports: module.exports,
    require: createRequire(sourceRepo + '/package.json'), crypto, TextEncoder, TextDecoder,
    Request, Response, URL, URLSearchParams, structuredClone });
  return module.exports;
}

test('five source-bound MRI drafts reach the learner and revision-bound Review without implying image approval', async () => {
  const review = json('atlas-review/manifest.json');
  assert.equal(review.revision, deliveryRevision);
  const paths = ['app/body-content.ts', 'lib/nasal-cartilage-mri.ts',
    'content/nasal-cartilage-mri.ts', 'content/nasal-cartilage-quiz-pins.json'];
  const importRows = paths.map(path => {
    const row = review.files.find(file => file.path === path);
    assert.ok(row, `Review imports ${path}`);
    assert.equal(row.sourceSha256, sha(currentSource(path)), `${path} current committed source`);
    assert.equal(row.importedSha256, sha(readFileSync(`atlas-review/${path}`)), `${path} imported bytes`);
    return row;
  });
  const pins = json('atlas-review/content/nasal-cartilage-quiz-pins.json');
  for (const path of paths.slice(1))
    assert.deepEqual(currentSource(path), source(path), `${path} immutable feature source retained`);
  assert.equal(sha(readFileSync('atlas-review/content/nasal-cartilage-quiz-pins.json')),
    'c42f02da2a65fcdc4faaad275c049b77aa48754cfae4df7e0f263b8cbea716ae');
  assert.equal(pins.entries.length, 5);
  assert.deepEqual(pins.entries.map(entry => entry.identity.fmaId).sort(),
    ['FMA59503', 'FMA59505', 'FMA59506', 'FMA59512', 'FMA59513']);

  const base = 'public/atlas-runtime/head-neck/';
  const manifest = json(base + 'manifest.json');
  assert.equal(manifest.sourceCommit, deliveryRevision);
  const inputs = json(base + 'source-inputs.json');
  for (const row of importRows) {
    same(inputs.filter(input => input.path === row.path),
      [{ path: row.path, sha256: row.sourceSha256 }], `head-neck input ${row.path}`);
  }
  for (const flag of ['patientDataIncluded', 'clinicalApproved', 'standaloneReviewConnection', 'imagingConnection'])
    assert.equal(manifest[flag], false, flag);
  const api = await liveApi();
  const prior = await previousReviewApi();
  const {exactSourceHistoryApi} = await import(pathToFileURL(sourceRepo + '/scripts/exact-source-history-api.mjs').href);
  const feature = await exactSourceHistoryApi(revision, 'review-security');
  const catalog = api.bodyDisplayCatalog(json('atlas-review/public/models/bodyparts3d/full-body/catalog.json'));
  const ids = new Set(pins.entries.map(entry => entry.identity.id));
  assert.equal(ids.size, 5);
  const delivered = emittedTeaching(base, manifest.files, true);
  for (const topic of Object.values(api.nasalCartilageMriTopics)) {
    for (const text of [topic.body, ...topic.bullets, ...topic.citations])
      assert.ok(delivered.includes(text) || delivered.includes(JSON.stringify(text).slice(1, -1)),
        'MRI teaching reaches the emitted module graph');
  }
  for (const id of ids) assert.ok(delivered.includes(id), `emitted source identity ${id}`);

  let refusals = 0;
  let reviewRefusals = 0;
  let storageCalls = 0;
  for (const { identity, group } of pins.entries) {
    const selected = catalog.structures.find(s => s.id === identity.id);
    same(selected, identity, `full source identity ${identity.id}`);
    const lesson = api.bodyLesson(selected, 'mri');
    assert.equal(lesson.readiness, 'draft');
    same(lesson, api.nasalCartilageMriLesson(selected, 'mri'), 'real learner dispatcher');
    same(lesson, feature.bodyLesson(selected, 'mri'), 'immutable feature-era MRI teaching');
    const { readiness, ...shown } = lesson;
    same(api.bodyContent(selected, 'mri'), shown, 'learner content section');
    same({ body: lesson.body, bullets: lesson.bullets, citations: lesson.citations },
      api.nasalCartilageMriTopics[group], 'group teaching');
    assert.match(lesson.note, /revision-bound radiologist review pending/i);
    assert.match(lesson.note, /Atlas, imaging-case and paid-lecture access remain independent/i);
    for (const text of ['one cadaver head and one volunteer', 'routine brain MRI',
      'acquired', 'registration',
      group === 'septal' ? 'full extent' : group === 'alar' ? 'medial crus' : 'upper lateral–septal interface'])
      assert.match([lesson.body, ...lesson.bullets, lesson.note].join(' '),
      new RegExp(text, 'i'), `${identity.id}: ${text}`);
    for (const tab of ['anatomy', 'ct', 'xray', 'ultrasound', 'quiz']) {
      assert.equal(api.nasalCartilageMriLesson(selected, tab), undefined);
      refusals++;
    }
    for (const edit of [s => { s.bounds.min[0] += .01; }, s => { s.sources[0].sha256 = '0'.repeat(64); },
      s => { s.regions.push('foreign'); }, s => { s.provenance.license = 'foreign'; }]) {
      const foreign = structuredClone(selected); edit(foreign);
      assert.equal(api.nasalCartilageMriLesson(foreign, 'mri'), undefined);
      assert.notEqual(api.bodyLesson(foreign, 'mri').readiness, 'draft');
      refusals++;
    }
    const worksheet = await api.bodyReviewMaterial(selected.id);
    assert.ok(worksheet);
    const featureWorksheet = await feature.bodyReviewMaterial(selected.id);
    assert(featureWorksheet);
    same(worksheet.topics.find(topic => topic.tab === 'mri'),
      featureWorksheet.topics.find(topic => topic.tab === 'mri'),
      'immutable feature-era MRI worksheet topic');
    assert.equal(worksheet.approval, false);
    assert.ok(await api.parseBodyReviewResponse(worksheet, selected.id));
    same(worksheet.topics.find(topic => topic.tab === 'mri'), { tab: 'mri', ...lesson },
      'current Review worksheet reflects learner draft');
    for (const edit of [w => { w.topics.find(topic => topic.tab === 'mri').body += ' foreign'; },
      w => { w.topics.find(topic => topic.tab === 'mri').readiness = 'approved'; },
      w => { w.source.structure.sources = []; }, w => { w.approval = true; }]) {
      const forged = structuredClone(worksheet); edit(forged);
      assert.equal(await api.parseBodyReviewResponse(forged, selected.id), null);
      reviewRefusals++;
    }
    const current = await api.bodyReviewContext(selected.id);
    const old = await prior.bodyReviewContext(selected.id);
    assert.ok(old);
    assert.equal(current.sourceHash, old.sourceHash, 'source identity unchanged');
    assert.notEqual(current.revisions.teaching, old.revisions.teaching, 'MRI draft changes teaching revision');
    assert.equal(current.revisions.imaging, null);
    assert.ok(current.blockers.imaging.some(text => /No validated acquired-image series/.test(text)));
    const stale = { catalogScope: current.catalogScope, structureId: selected.id,
      track: 'teaching', expectedVersion: 0, materialHash: old.materialHash,
      revisionHash: old.revisions.teaching, checklistVersion: old.checklistVersion,
      draft: api.blankBodyReview(current, 'teaching') };
    const response = await api.postBodyDecision(new Request('https://atlas.test/api/body-review/decisions', {
      method: 'POST', headers: { origin: 'https://atlas.test', 'content-type': 'application/json',
        'oai-authenticated-user-id': 'SYNTHETIC_NASAL_MRI_REVIEWER' }, body: JSON.stringify(stale),
    }), { prepare() { storageCalls++; throw Error('Stale evidence reached storage'); } });
    assert.equal(response.status, 409);
    const forged = { ...stale, materialHash: current.materialHash, revisionHash: '0'.repeat(64) };
    const forgedResponse = await api.postBodyDecision(new Request('https://atlas.test/api/body-review/decisions', {
      method: 'POST', headers: { origin: 'https://atlas.test', 'content-type': 'application/json',
        'oai-authenticated-user-id': 'SYNTHETIC_NASAL_MRI_REVIEWER' }, body: JSON.stringify(forged),
    }), { prepare() { storageCalls++; throw Error('Forged evidence reached storage'); } });
    assert.equal(forgedResponse.status, 409);
  }
  const unrelated = catalog.structures.find(s => !ids.has(s.id));
  assert.equal(api.nasalCartilageMriLesson(unrelated, 'mri'), undefined);
  assert.equal(refusals, 45);
  assert.equal(reviewRefusals, 20);
  assert.equal(storageCalls, 0);
  for (const path of ['lib/independent-study-links.ts', 'lib/didanix-atlas-adapter.ts',
    'lib/atlas-practice.ts']) assert.equal(sha(source(path)), sha(execFileSync('git',
      ['-C', sourceRepo, 'show', `${parent}:${path}`], { windowsHide: true, maxBuffer: 32e6,
        env: { ...process.env, GIT_NO_REPLACE_OBJECTS: '1' } })), `${path} access seam unchanged`);
  console.log(JSON.stringify({ revision, deliveryRevision, sourceBindings: 5, deliveryInputs: paths.length,
    identityRefusals: refusals, forgedWorksheetsRefused: reviewRefusals,
    staleOrForgedRefusalsBeforeStorage: 10, storageCalls, clinicalApproval: false }));
});
