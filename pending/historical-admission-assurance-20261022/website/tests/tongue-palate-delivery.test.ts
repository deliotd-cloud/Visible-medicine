import assert from 'node:assert/strict';
import test from 'node:test';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
import {build} from 'esbuild';
import {emittedTeaching} from './atlas-emitted-teaching.ts';
import {currentAtlasDeliveryRoot, validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';
import {beforeNeckXraySnapshot,beforeNeckXrayBody} from './tongue-palate-neck-history.mjs';

const authored = '6036a7a59dcc1fd75eee4a23af34ca2a568d86b6';
const current = validateCurrentAtlasDelivery().source;
const tree = '6da62962106cfab9419b09618547a9da5e3aafc6';
const parent = 'a2475a37201bdd5fdd12f5849fc8ee043412d02f';
const sourcePaths = [
  'LICENSES/THIRD_PARTY_NOTICES.md',
  'app/body-content.ts',
  'content/regional-teaching/head-neck.json',
  'content/tongue-palate-quiz-pins.json',
  'content/tongue-palate-quiz.ts',
  'lib/tongue-palate-quiz.ts',
];
const facts = {
  genioglossus: {fmas: ['FMA46702', 'FMA46698'], answer: 'Tongue protrusion', position: 0,
    question: 'Which movement does bilateral genioglossus contraction support?',
    explanation: 'Genioglossus helps advance the tongue.'},
  hyoglossus: {fmas: ['FMA46704', 'FMA46703'], answer: 'Hypoglossal (XII)', position: 1,
    question: 'Which nerve supplies hyoglossus?',
    explanation: 'Hyoglossus receives motor supply from XII.'},
  levator: {fmas: ['FMA46729', 'FMA46728'], answer: 'Soft palate', position: 2,
    question: 'What does levator veli palatini elevate?',
    explanation: 'Levator veli palatini raises the soft palate.'},
  tensor: {fmas: ['FMA46732', 'FMA46731'], answer: 'Mandibular (V3)', position: 3,
    question: 'Which motor supply reaches tensor veli palatini?',
    explanation: 'Tensor veli palatini receives motor supply through V3.'},
} as const;
const reference = 'https://anatomy.ttuhscep.edu/anatomytables/muscles_head_neck.html';
const sha = (bytes: Buffer | string) => createHash('sha256').update(bytes).digest('hex');
const read = (path: string) => readFileSync(path);
const json = (path: string) => JSON.parse(read(path).toString());
const wire = (value: unknown) => JSON.parse(JSON.stringify(value));
const visible = (code: string, value: string) =>
  code.includes(value) || code.includes(JSON.stringify(value).slice(1, -1));
const git = (atlas: string, ...args: string[]) => execFileSync('git', args, {
  cwd: atlas, windowsHide: true, maxBuffer: 32e6,
  env: {...process.env, GIT_NO_REPLACE_OBJECTS: '1'},
});

test('6036 delivers four original quiz facts across eight exact source placements and unsigned Review',
  {timeout: 180000}, async () => {
    const pin = validateCurrentAtlasDelivery();
    assert.equal(pin.source, current);
    assert.equal(git(currentAtlasDeliveryRoot(), 'rev-parse', `${authored}^{tree}`).toString().trim(), tree);
    const atlas = currentAtlasDeliveryRoot();
    assert.equal(git(atlas, 'rev-parse', 'HEAD^{tree}').toString().trim(), pin.sourceTree);
    assert.equal(git(atlas, 'rev-parse', `${parent}^{commit}`).toString().trim(), parent);
    execFileSync('git', ['merge-base', '--is-ancestor', parent, current], {cwd: atlas, windowsHide: true});
    execFileSync('git', ['merge-base', '--is-ancestor', authored, current], {cwd: atlas, windowsHide: true});

    const review = json('atlas-review/manifest.json');
    const binding = json('atlas-review/integration-inputs.json');
    assert.equal(review.revision, current);
    assert.equal(binding.sourceCommit, current);
    assert.equal(review.websiteIntegrationSha256, pin.reviewIntegration);
    assert.equal(binding.sha256, pin.reviewIntegration);
    for (const path of sourcePaths) {
      const source = git(atlas, 'show', `${current}:${path}`);
      const imported = read(`atlas-review/${path}`);
      const row = review.files.find((file: {path: string}) => file.path === path);
      assert(row, `Review source missing: ${path}`);
      assert.equal(row.sourceSha256, sha(source), `${path}: exact committed source`);
      assert.equal(row.importedSha256, sha(imported), `${path}: exact imported source`);
      assert.equal(binding.inputs.find((file: {path: string}) => file.path === `atlas-review/${path}`)?.sha256,
        sha(imported), `${path}: exact website input`);
      if (['content/tongue-palate-quiz-pins.json', 'content/tongue-palate-quiz.ts',
        'lib/tongue-palate-quiz.ts'].includes(path))
        assert.deepEqual(source, git(atlas, 'show', `${authored}:${path}`), `${path}: authored 6036 source retained`);
    }

    const snapshotPath='content/regional-teaching/head-neck.json';
    const authoredSnapshotBytes=git(atlas,'show',`${authored}:${snapshotPath}`);
    const liveSnapshotBytes=git(atlas,'show',`${current}:${snapshotPath}`);
    const liveSnapshot=JSON.parse(liveSnapshotBytes.toString());
    const currentSnapshotBytes=beforeNeckXraySnapshot(liveSnapshotBytes,git(atlas,'show',`6d7a356ae949e13f2ff4bf1fec610ee6ae7762c1:${snapshotPath}`));
    assert.equal(sha(authoredSnapshotBytes),'94992de62a724b2be250abffd347c14dafd8bcaf86ec4edde730e533ec292d2b');
    assert.equal(sha(currentSnapshotBytes),'e6a486cc4ab9745eae110615b340fa1797bb0e6e0b72195f083bec766543da25');
    const authoredSnapshot=JSON.parse(authoredSnapshotBytes.toString());
    const currentSnapshot=JSON.parse(currentSnapshotBytes.toString());
    assert.equal(authoredSnapshot.entries.length,262);
    assert.equal(currentSnapshot.entries.length,262);
    assert.equal(currentSnapshot.undefinedPaths.length,20);
    const changedMriIndices=[...Array(28)].map((_,index)=>205+index).concat([250,251]);
    let restoredSnapshot=currentSnapshotBytes.toString();
    for(const index of changedMriIndices){
      const before=authoredSnapshot.entries[index],after=currentSnapshot.entries[index];
      assert.equal(after.identity,before.identity,`${index}: source identity retained`);
      const identity=JSON.parse(after.identity);
      assert(index<233 ? identity.id.endsWith('-tooth') : identity.id.endsWith('inferior-thyroid-artery'),
        `${index}: exact later MRI family`);
      const oldMri=JSON.stringify(before.lessons.mri),newMri=JSON.stringify(after.lessons.mri);
      assert.notEqual(newMri,oldMri,`${index}: later MRI lesson is distinct`);
      assert.equal(restoredSnapshot.split(newMri).length,2,`${index}: unique later MRI source`);
      restoredSnapshot=restoredSnapshot.replace(newMri,oldMri);
    }
    assert(Buffer.from(restoredSnapshot).equals(authoredSnapshotBytes),
      'Only 28 dental and two inferior-thyroid MRI lessons change the complete authored 6036 snapshot');
    const authoredBody = git(atlas, 'show', `${authored}:app/body-content.ts`);
    let currentBody = beforeNeckXrayBody(git(atlas, 'show', `${current}:app/body-content.ts`),git(atlas,'show','6d7a356ae949e13f2ff4bf1fec610ee6ae7762c1:app/body-content.ts')).toString();
    for (const addition of [
      "import {dentalMriLesson} from '../lib/dental-mri';\n",
      "import { colicArteryUltrasoundLesson } from '../lib/colic-artery-ultrasound';\n",
      '  const dentalMri=dentalMriLesson(s,tab);\n  if(dentalMri)return dentalMri;\n',
      '  const colicUltrasound = colicArteryUltrasoundLesson(s, tab);\n  if (colicUltrasound) return colicUltrasound;\n',
    ]) {
      assert.equal(currentBody.split(addition).length, 2, 'Exactly one later dental/colic source addition');
      currentBody = currentBody.replace(addition, '');
    }
    assert(Buffer.from(currentBody).equals(authoredBody), 'Only the exact later dental/colic branches change body-content from 6036');

    const pinsBytes = git(atlas, 'show', `${current}:content/tongue-palate-quiz-pins.json`);
    assert.equal(sha(pinsBytes), '150fae10b5b29dd10659040a820de8ff0a9eeccd7012406b2d0ed0bd9200ab32');
    const pins = JSON.parse(pinsBytes.toString());
    assert.equal(pins.parentCommit, parent);
    assert.equal(pins.entries.length, 8);
    assert.equal(new Set(pins.entries.map((entry: {identity: {id: string}}) => entry.identity.id)).size, 8);
    for(const entry of pins.entries){
      const authoredEntry=authoredSnapshot.entries.find((row:{identity:string})=>JSON.parse(row.identity).id===entry.identity.id);
      const currentEntry=currentSnapshot.entries.find((row:{identity:string})=>JSON.parse(row.identity).id===entry.identity.id);
      assert(authoredEntry && currentEntry,`${entry.identity.id}: both source placements retained`);
      assert.deepEqual(liveSnapshot.entries.find((row:{identity:string})=>JSON.parse(row.identity).id===entry.identity.id),authoredEntry,`${entry.identity.id}: actual current complete tongue/palate row remains exact`);
      assert.equal(sha(JSON.stringify(currentEntry)),sha(JSON.stringify(authoredEntry)),
        `${entry.identity.id}: original quiz placement and all other teaching retained`);
    }
    assert.deepEqual([...new Set(pins.entries.map((entry: {group: string}) => entry.group))].sort(),
      Object.keys(facts).sort());

    const bundle = await build({stdin: {contents: [
      "export {bodyLesson,bodyContent} from './atlas-review/app/body-content';",
      "export {bodyDisplayCatalog} from './atlas-review/lib/body-display-catalog';",
      "export {bodyReviewMaterial} from './atlas-review/lib/body-review-material';",
      "export {decodeRegionalTeachingSnapshot} from './atlas-review/lib/regional-teaching-snapshot';",
    ].join('\n'), resolveDir: process.cwd(), loader: 'ts'},
    bundle: true, write: false, platform: 'node', format: 'esm'});
    const api = await import('data:text/javascript;base64,' +
      Buffer.from(bundle.outputFiles[0].text).toString('base64'));
    const {exactSourceHistoryApi} = await import(
      pathToFileURL(`${atlas}/scripts/exact-source-history-api.mjs`).href);
    const before = await exactSourceHistoryApi(parent, 'display-content');
    const rawCatalog = json('atlas-review/public/models/bodyparts3d/full-body/catalog.json');
    const display = api.bodyDisplayCatalog(rawCatalog);
    assert.deepEqual(display, before.bodyDisplayCatalog(rawCatalog), 'No source display/geometry change');
    assert.deepEqual(display.coordinateSystem, pins.coordinateSystem);
    assert.equal(display.sourceVersion, pins.sourceVersion);
    for (const expectedBundle of pins.bundles) {
      assert.deepEqual(display.bundles.find((row: {id: string}) => row.id === expectedBundle.id),
        expectedBundle, 'Source bundle and geometry hash unchanged');
    }

    const learners = ['head-neck', 'shoulder', 'lower-limb', 'female-pelvis'];
    for (const name of learners) {
      const manifest = json(`public/atlas-runtime/${name}/manifest.json`);
      assert.equal(manifest.sourceCommit, pin.runtimeSources[name], `${name}: pinned runtime revision`);
      assert.equal(manifest.patientDataIncluded, false);
      assert.notEqual(manifest.clinicalApproved, true);
      assert.notEqual(manifest.imagingConnection, true);
      assert.notEqual(manifest.standaloneReviewConnection, true);
    }
    const base = 'public/atlas-runtime/head-neck/';
    const learner = json(`${base}manifest.json`);
    const learnerInputs = json(`${base}source-inputs.json`);
    for (const path of sourcePaths) {
      const row = learnerInputs.find((file: {path: string}) => file.path === path);
      assert(row, `Head-neck learner source missing: ${path}`);
      assert.equal(row.sha256, sha(read(`atlas-review/${path}`)), `${path}: learner/Review source agreement`);
    }
    const emitted = emittedTeaching(base, learner.files, true);
    const regional = json('atlas-review/content/regional-teaching/head-neck.json');
    assert.equal(regional.region, 'head-neck');
    // Execute the actual reachable data-only browser chunk, not just a text search.
    const regionalChunks = learner.files.filter((file: {path: string}) => /^assets\/head-neck-[\w-]+\.js$/.test(file.path));
    assert.equal(regionalChunks.length, 1);
    const chunk = regionalChunks[0], chunkBytes = read(base + chunk.path);
    assert.equal(sha(chunkBytes), chunk.sha256);
    assert(emitted.includes(chunkBytes.toString()), 'The region chunk is reachable from the shipped entry');
    assert(!/(?:^|;)import\s|import\s*\(/.test(chunkBytes.toString()), 'Expected a data-only region chunk');
    const compiledSnapshot = (await import('data:text/javascript;base64,' + Buffer.from(chunkBytes).toString('base64'))).default;
    assert.deepEqual(compiledSnapshot, regional, 'Actual browser data agrees with the imported source snapshot');
    const emittedRegion = api.decodeRegionalTeachingSnapshot(compiledSnapshot, 'head-neck');

    const grouped = new Map<string, unknown>();
    const targets = new Set<string>();
    for (const entry of pins.entries) {
      const {identity, group, previous} = entry;
      const fact = facts[group as keyof typeof facts];
      assert(fact, `Unexpected principle: ${group}`);
      targets.add(identity.id);
      assert(fact.fmas.includes(identity.fmaId as never), `${identity.id}: independent FMA group`);
      assert.equal(identity.id,
        `vm:anatomy:body:head-neck:${identity.laterality}:muscle:${identity.laterality}-${
          group === 'levator' ? 'levator-veli-palatini' : group === 'tensor' ? 'tensor-veli-palatini' : group}`);
      const structure = display.structures.find((row: {id: string}) => row.id === identity.id);
      assert.deepEqual(structure, identity, `${identity.id}: exact source identity`);
      assert.deepEqual(before.bodyLesson(structure, 'quiz'), previous);
      const lesson = api.bodyLesson(structure, 'quiz');
      assert.deepEqual(emittedRegion.bodyLesson(structure, 'quiz'), lesson);
      assert.equal(lesson.readiness, 'draft');
      assert.equal(lesson.title, `${identity.name} · Tongue and palate quick check · draft`);
      assert.equal(lesson.body, fact.question);
      assert.equal(lesson.correctAnswer, fact.answer);
      assert.equal(lesson.bullets.indexOf(fact.answer), fact.position);
      assert.equal(lesson.bullets.length, 4);
      assert.equal(new Set(lesson.bullets).size, 4);
      assert.equal(lesson.explanation, fact.explanation);
      assert.deepEqual(lesson.citations, [reference]);
      assert.match(lesson.note, /Radiologist review pending/);
      assert.match(lesson.note, /Atlas, imaging-case and lecture access remain independent/);
      assert.match(lesson.note, /No geometry approval or spatial registration is implied/);
      const {readiness: _readiness, ...section} = lesson;
      assert.deepEqual(api.bodyContent(structure, 'quiz'), section);

      const principle = [lesson.body, lesson.bullets, lesson.correctAnswer,
        lesson.explanation, lesson.citations];
      if (grouped.has(group)) assert.deepEqual(principle, grouped.get(group));
      else grouped.set(group, wire(principle));
      const rows = regional.entries.filter((row: {identity: string}) => JSON.parse(row.identity).id === identity.id);
      assert.equal(rows.length, 1);
      assert.deepEqual(JSON.parse(rows[0].identity), identity);
      assert.deepEqual(rows[0].lessons.quiz, lesson);
      for (const value of [lesson.title, lesson.body, ...lesson.bullets,
        lesson.correctAnswer, lesson.explanation, ...lesson.citations])
        assert(visible(emitted, value), `${identity.id}: missing emitted quiz content`);

      const packet = wire(await api.bodyReviewMaterial(identity.id));
      assert.equal(packet.approval, false);
      assert.equal(packet.status, 'worksheet-not-submitted');
      assert.deepEqual(packet.topics.find((topic: {tab: string}) => topic.tab === 'quiz'),
        {tab: 'quiz', ...lesson});
      for (const tab of ['anatomy', 'function', 'ct', 'mri', 'xray', 'ultrasound', 'pathology', 'clinical'])
        assert.deepEqual(api.bodyLesson(structure, tab), before.bodyLesson(structure, tab),
          `${identity.id}: unchanged ${tab}`);
    }
    assert.equal(targets.size, 8);
    assert.equal(grouped.size, 4);

    const notice = read('atlas-review/LICENSES/THIRD_PARTY_NOTICES.md').toString();
    assert.match(notice, /## Tongue and soft-palate quick checks — 20 October 2026/);
    assert.match(notice, /Four original project-MIT factual questions are shared across eight existing/);
    assert.match(notice, /That copyrighted reference is a reading citation, not an imported or relicensed/);
    assert.match(notice, /Current OpenStax A&P 2e text\/art\/assessments are excluded/);
    const priorNotice = git(atlas, 'show', `${parent}:LICENSES/THIRD_PARTY_NOTICES.md`).toString();
    const authoredNotice = git(atlas, 'show', `${authored}:LICENSES/THIRD_PARTY_NOTICES.md`).toString();
    const oldStart = '## Corpus spongiosum X-ray context v2 — 19 October 2026';
    assert(notice.includes(oldStart));
    const dentalStart=notice.indexOf('## Dental MRI methods orientation — 21 October 2026');
    const tongueStart=notice.indexOf('## Tongue and soft-palate quick checks — 20 October 2026');
    const corpusStart=notice.indexOf('## Corpus spongiosum CT boundary teaching — 20 October 2026');
    assert(dentalStart>=0 && tongueStart>dentalStart && corpusStart>tongueStart);
    assert(notice.slice(0,dentalStart)+notice.slice(tongueStart,corpusStart-1)===authoredNotice,
      'Only the exact later dental and corpus notices extend the authored 6036 notice');
    assert(authoredNotice.slice(authoredNotice.indexOf(oldStart))===priorNotice.slice(priorNotice.indexOf(oldStart)),
      'Earlier third-party notices remain byte equivalent');
    assert.equal(json('public/atlas-review-viewer/manifest.json').personalRecordsIncluded, false);
  });
