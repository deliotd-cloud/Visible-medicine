import assert from 'node:assert/strict';
import test from 'node:test';
import {Buffer} from 'node:buffer';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {readFileSync, readdirSync} from 'node:fs';
import {resolve} from 'node:path';
import {build, transform} from 'esbuild';

test('cranial bone quick checks retain exact source, learner and revision-bound review evidence', async () => {
  const source = '4b6f0629ffedd99c5529882ed74341d9402e6ef0';
  const parent = 'bc03ed3f7324819f4bfa3e7cd0afb7203cc8e3b8';
  const websiteBaseline = '736ad7a31aa8e6414493a534f66ce7810b0a4780';
  const sourceRepo = process.env.ATLAS_SOURCE_REPO ?? resolve('..', '..', '..', '2026-09-05', 'referenced-chatgpt-conversation-this-is-an-2', 'outputs');
  const sourceFile = (path: string) => Buffer.from(execFileSync('git', ['-C', sourceRepo, 'show', `${source}:${path}`], {maxBuffer: 8e6}));
  const sourceBefore = (path: string) => Buffer.from(execFileSync('git', ['-C', sourceRepo, 'show', `${parent}:${path}`], {maxBuffer: 8e6}));
  const websiteBefore = (path: string) => Buffer.from(execFileSync('git', ['show', `${websiteBaseline}:${path}`], {maxBuffer: 8e6}));
  const json = (path: string) => JSON.parse(readFileSync(path, 'utf8'));
  const sha = (bytes: Buffer) => createHash('sha256').update(bytes).digest('hex');

  const sourcePins = JSON.parse(sourceFile('content/cranial-bone-quiz-pins.json').toString('utf8'));
  const transition = JSON.parse(sourceFile('content/cranial-bone-quiz-transition.json').toString('utf8'));
  assert.equal(sourcePins.parentCommit, parent);
  assert.equal(sourcePins.entries.length, 8);
  assert.equal(transition.parentCommit, parent);
  assert.equal(transition.entries.length, 8);
  assert.equal(new Set(transition.entries.map((entry: any) => entry.id)).size, 8);
  assert.deepEqual(transition.entries.map((entry: any) => entry.id).sort(), sourcePins.entries.map((entry: any) => entry.identity.id).sort());
  assert(transition.entries.every((entry: any) => entry.tab === 'quiz'));
  assert.deepEqual(sourcePins.entries.map((entry: any) => entry.identity.fmaId).sort(),
    ['FMA52734', 'FMA52735', 'FMA52736', 'FMA52738', 'FMA52739', 'FMA52740', 'FMA52788', 'FMA52789'].sort());
  const sourceQuestionModule = await transform(sourceFile('content/cranial-bone-quiz.ts').toString('utf8'), {loader: 'ts', format: 'esm'});
  const sourceQuestions = await import('data:text/javascript;base64,' + Buffer.from(sourceQuestionModule.code).toString('base64'));
  assert.equal(Object.keys(sourceQuestions.cranialBoneQuizQuestions).length, 6);
  assert.deepEqual(Object.values(sourceQuestions.cranialBoneQuizGroups).flat().sort(), sourcePins.entries.map((entry: any) => entry.identity.fmaId).sort());

  const review = json('atlas-review/manifest.json');
  const inputs = json('public/atlas-runtime/head-neck/source-inputs.json');
  assert.equal(review.revision, source);
  for (const region of ['head-neck', 'shoulder'])
    assert.equal(json(`public/atlas-runtime/${region}/manifest.json`).sourceCommit, source);
  for (const path of ['content/cranial-bone-quiz.ts', 'content/cranial-bone-quiz-pins.json', 'lib/cranial-bone-quiz.ts']) {
    const imported = review.files.find((file: any) => file.path === path);
    assert(imported, path);
    assert.equal(imported.sourceSha256, sha(sourceFile(path)), path);
    assert.equal(inputs.find((file: any) => file.path === path)?.sha256, imported.sourceSha256, path);
    assert.equal(sha(readFileSync(`atlas-review/${path}`)), imported.importedSha256, path);
  }
  assert.deepEqual(json('atlas-review/content/cranial-bone-quiz-pins.json'), sourcePins);

  const compiled = await build({stdin: {contents:
    "export * from './atlas-review/app/body-content'; export * from './atlas-review/lib/body-review-material'; export * from './atlas-review/lib/body-review-context'; export * from './atlas-review/lib/body-review-response';",
    resolveDir: process.cwd(), loader: 'ts'}, bundle: true, write: false, platform: 'node', format: 'esm'});
  const api = await import('data:text/javascript;base64,' + Buffer.from(compiled.outputFiles[0].text).toString('base64'));
  const expectedAnswers: Record<string, string> = {
    frontal: 'Frontal bone', parietal: 'Sagittal suture', occipital: 'C1 (atlas)',
    temporal: 'Petrous part', sphenoid: 'Sphenoid bone', ethmoid: 'Cribriform plate',
  };
  const learnerAsset = readdirSync('public/atlas-runtime/head-neck/assets').filter(name => /^body-content-[\w-]+\.js$/.test(name));
  assert.equal(learnerAsset.length, 1, 'one lazy body teaching asset');
  const shippedTeaching = readFileSync(`public/atlas-runtime/head-neck/assets/${learnerAsset[0]}`, 'utf8');
  const questionBodies = new Set<string>();
  for (const entry of sourcePins.entries) {
    const {identity, group} = entry;
    const question = sourceQuestions.cranialBoneQuizQuestions[group];
    assert(question, group);
    assert.equal(question.correctAnswer, expectedAnswers[group]);
    assert.equal(question.choices.length, 4);
    assert.equal(new Set(question.choices).size, 4);
    assert.equal(question.choices.filter((choice: string) => choice === question.correctAnswer).length, 1);
    questionBodies.add(question.body);
    const expected = {
      readiness: 'draft', title: `${identity.name} · Cranial bone quick check · draft`,
      body: question.body, bullets: question.choices, correctAnswer: question.correctAnswer,
      explanation: question.explanation, citations: [question.reference],
    };
    const lesson = api.bodyLesson(identity, 'quiz');
    for (const [field, value] of Object.entries(expected)) assert.deepEqual(lesson[field], value, `${identity.id}: ${field}`);
    assert.match(lesson.note, /Radiologist review pending for this source revision/);
    assert.match(lesson.note, /not individually segmented or validated/);
    assert.match(lesson.note, /not patient imaging or registered CT\/MRI/);
    assert.match(lesson.note, /Atlas, imaging-case and lecture access remain independent/);
    const learner = api.bodyContent(identity, 'quiz');
    const {readiness: _readiness, ...shown} = lesson;
    assert.deepEqual(learner, shown, identity.id);
    for (const text of [question.body, question.correctAnswer, question.explanation, question.reference])
      assert(shippedTeaching.includes(text), `lazy teaching asset: ${group} ${text}`);
    const packet = await api.bodyReviewMaterial(identity.id);
    assert(packet);
    assert.deepEqual(packet.source.structure, identity);
    assert.equal(packet.schema, 'vm-body-review-worksheet-3');
    assert.equal(packet.status, 'worksheet-not-submitted');
    assert.equal(packet.approval, false);
    assert.deepEqual(packet.topics.find((topic: any) => topic.tab === 'quiz'), {tab: 'quiz', ...lesson});
    assert.deepEqual(await api.parseBodyReviewResponse(packet, identity.id), packet);
    const context = await api.bodyReviewContext(identity.id);
    assert(context);
    assert(context.teachingTabs.includes('quiz'));
    assert.equal(context.revisions.imaging, null);
    assert(context.revisions.teaching);
    assert(context.checklists.teaching.some((check: any) => check.id === 'drafts'));
    for (const mutate of [
      (value: any) => { value.topics.find((topic: any) => topic.tab === 'quiz').correctAnswer = 'Wrong answer'; },
      (value: any) => { value.topics.find((topic: any) => topic.tab === 'quiz').bullets.reverse(); },
      (value: any) => { value.topics.find((topic: any) => topic.tab === 'quiz').explanation += ' Unreviewed'; },
      (value: any) => { value.topics.find((topic: any) => topic.tab === 'quiz').citations = []; },
      (value: any) => { value.topics.find((topic: any) => topic.tab === 'quiz').readiness = 'approved'; },
      (value: any) => { value.topics = value.topics.filter((topic: any) => topic.tab !== 'quiz'); },
      (value: any) => { value.approval = true; },
    ]) {
      const changed = structuredClone(packet);
      mutate(changed);
      assert.equal(await api.parseBodyReviewResponse(changed, identity.id), null, `altered packet: ${identity.id}`);
    }
    assert.equal(api.bodyLesson({...identity, nodeName: 'foreign'}, 'quiz').readiness, 'generated-identification');
  }
  assert.equal(questionBodies.size, 6);

  const sourceOldPins = JSON.parse(sourceBefore('content/body-review-display-pins.json').toString('utf8'));
  const sourceNewPins = JSON.parse(sourceFile('content/body-review-display-pins.json').toString('utf8'));
  const importedPins = json('atlas-review/content/body-review-display-pins.json');
  const oldPins = JSON.parse(websiteBefore('atlas-review/content/body-review-display-pins.json').toString('utf8'));
  assert.deepEqual(oldPins, sourceOldPins, 'website baseline matches the exact Atlas parent');
  assert.deepEqual(importedPins, sourceNewPins, 'review pins match immutable Atlas source');
  assert.deepEqual(Object.fromEntries(Object.entries(importedPins).filter(([key]) => key !== 'pins')),
    Object.fromEntries(Object.entries(oldPins).filter(([key]) => key !== 'pins')));
  const before = new Map(oldPins.pins.map((pin: any) => [pin.structureId, pin.sha256]));
  // Preserve the exact skull-quiz milestone. The new pelvic integration test
  // separately proves the five later pin changes against this saved milestone.
  const historicalPins=JSON.parse(execFileSync('git',['show','443896f4:atlas-review/content/body-review-display-pins.json'],{encoding:'utf8',maxBuffer:8e6}));
  const after = new Map(historicalPins.pins.map((pin: any) => [pin.structureId, pin.sha256]));
  assert.equal(before.size, oldPins.pins.length);
  assert.equal(after.size, importedPins.pins.length);
  assert.deepEqual([...after.keys()].sort(), [...before.keys()].sort());
  assert.deepEqual([...after].filter(([id, hash]) => hash !== before.get(id)).map(([id]) => id).sort(),
    sourcePins.entries.map((entry: any) => entry.identity.id).sort(), 'exactly eight review display pin deltas');
  assert.deepEqual(json('lib/atlas-model-inventory.json').models,
    JSON.parse(websiteBefore('lib/atlas-model-inventory.json').toString('utf8')).models,
    'all model identities, paths and hashes remain unchanged');
  for (const path of ['public/atlas-runtime/head-neck/models/bodyparts3d/full-body/catalog.json'])
    assert.deepEqual(readFileSync(path), websiteBefore(path), `no catalog, model inventory or tour changes: ${path}`);
  assert.deepEqual(execFileSync('git',['show','443896f4:atlas-review/lib/regional-tours.ts'],{maxBuffer:8e6}),
    websiteBefore('atlas-review/lib/regional-tours.ts'),'all tours at the cranial checkpoint remain unchanged');
  for (const bundle of sourcePins.bundles) {
    const path = `public/atlas-runtime/head-neck${bundle.url.split('?')[0]}`;
    const bytes = readFileSync(path);
    assert.equal(bytes.length, bundle.bytes);
    assert.equal(sha(bytes), bundle.sha256);
    assert.deepEqual(bytes, websiteBefore(path), 'model bytes remain unchanged');
  }
  assert.equal(json('public/atlas-review-viewer/manifest.json').personalRecordsIncluded, false);
});
