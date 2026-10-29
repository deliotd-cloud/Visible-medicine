import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runInNewContext } from 'node:vm';
import test from 'node:test';

const proposalRoot = fileURLToPath(new URL('../', import.meta.url));
const atlasRoot = resolve(process.env.VM_ATLAS_SOURCE_ROOT ?? proposalRoot);
const requireFromAtlas = createRequire(join(atlasRoot, 'package.json'));
const ts = requireFromAtlas('typescript');
const baselineHash = 'd31ea68bd362db13907de78743f138c8f7cae518895303cefc03370a821c650f';
const beforePath = join(proposalRoot, 'scripts/fixtures/limbic-landmarks.before.ts.txt');
const afterPath = join(proposalRoot, 'lib/limbic-landmarks.ts');
const catalog = JSON.parse(readFileSync(join(atlasRoot, 'public/models/bodyparts3d/limbic-landmarks/catalog.json'), 'utf8'));
const compile = path => ts.transpileModule(readFileSync(path, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const evaluate = (path, dependency) => {
  const module = { exports: {} };
  runInNewContext(compile(path), { module, exports: module.exports, require: dependency });
  return module.exports;
};
const canonical = evaluate(join(atlasRoot, 'lib/body-source-additions.ts'), name => {
  if (name === './body-presentation-parts.ts') return { validBodyPresentationParts: () => true };
  throw Error(`Unexpected canonical dependency: ${name}`);
});
const study = evaluate(join(atlasRoot, 'content/limbic-landmark-study.ts'), () => {
  throw Error('Unexpected study dependency');
});
const dependency = name => {
  if (name.endsWith('/limbic-landmarks/catalog.json')) return { default: catalog };
  if (name === './body-source-additions') return canonical;
  if (name === '../content/limbic-landmark-study') return study;
  throw Error(`Unexpected limbic dependency: ${name}`);
};
const before = evaluate(beforePath, dependency);
const after = evaluate(afterPath, dependency);
const tabs = evaluate(join(atlasRoot, 'lib/content-types.ts'), () => {
  throw Error('Unexpected tab dependency');
}).contentTabs;
const answer = {
  FMA73414: 'Habenular region',
  FMA73413: 'Habenular region',
  FMA61975: 'Anterior wall of the third ventricle',
  FMA61842: 'No; a separate septal nucleus is not certified.',
};

test('the fixture is the exact saved baseline and the real catalog has four landmarks', () => {
  assert.equal(createHash('sha256').update(readFileSync(beforePath)).digest('hex'), baselineHash);
  assert.deepEqual(catalog.structures.map(s => s.fmaId), Object.keys(answer));
});

test('each real landmark has one scored, unspoiled draft question', () => {
  for (const structure of catalog.structures) {
    const old = before.limbicLandmarkLesson(structure, 'quiz');
    const lesson = after.limbicLandmarkLesson(structure, 'quiz');
    assert.equal(lesson.readiness, 'draft');
    assert.equal(lesson.title, old.title);
    assert.equal(lesson.body, old.body);
    assert.equal(lesson.note, old.note);
    assert.deepEqual(structuredClone(lesson.citations), structuredClone(old.citations));
    assert.equal(lesson.bullets.length, 4);
    assert.equal(new Set(lesson.bullets).size, 4);
    assert.equal(lesson.correctAnswer, answer[structure.fmaId]);
    assert.equal(lesson.bullets.filter(choice => choice === lesson.correctAnswer).length, 1);
    assert(!lesson.body.toLowerCase().includes(lesson.correctAnswer.toLowerCase()), structure.fmaId);
    assert(lesson.explanation.toLowerCase().includes(lesson.correctAnswer.toLowerCase()));
    assert.match(lesson.explanation, /does not|do not|not certified/);
    assert.match(lesson.note, /radiologist review/);
  }
});

test('the real sourceCanonical guard rejects changed identity, side, and source hash', () => {
  for (const structure of catalog.structures) {
    const mutations = [
      { ...structure, fmaId: 'FMA0' },
      { ...structure, laterality: structure.laterality === 'left' ? 'right' : 'left' },
      { ...structure, name: `${structure.name} changed` },
      { ...structure, sources: structure.sources.map((source, index) => index ? source : { ...source, sha256: '0'.repeat(64) }) },
    ];
    for (const mutation of mutations) {
      assert.notEqual(canonical.sourceCanonical(mutation), canonical.sourceCanonical(structure));
      for (const tab of tabs) assert.equal(after.limbicLandmarkLesson(mutation, tab), undefined);
    }
  }
});

test('every non-quiz topic and readiness gate matches the baseline', () => {
  for (const structure of catalog.structures) for (const tab of tabs.filter(t => t !== 'quiz')) {
    assert.deepEqual(structuredClone(after.limbicLandmarkLesson(structure, tab)),
      structuredClone(before.limbicLandmarkLesson(structure, tab)), `${structure.fmaId} / ${tab}`);
  }
  for (const region of study.limbicLandmarkStudy.regions) {
    assert.equal(after.limbicLandmarkStudyReady(catalog, region, study.limbicLandmarkStudy.id),
      before.limbicLandmarkStudyReady(catalog, region, study.limbicLandmarkStudy.id));
  }
});
