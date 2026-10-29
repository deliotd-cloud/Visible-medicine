import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runInNewContext } from 'node:vm';
import test from 'node:test';

const proposalRoot = fileURLToPath(new URL('../', import.meta.url));
const atlasRoot = resolve(process.env.VM_ATLAS_SOURCE_ROOT ?? proposalRoot);
const beforePath = process.env.VM_EPIGASTRIC_BEFORE_PATH ?? join(proposalRoot, 'scripts/fixtures/inferior-epigastric-vessels.before.ts.txt');
assert.equal(createHash('sha256').update(readFileSync(beforePath)).digest('hex'),
  'cde444a140807cc788cfbed570907316c52e32d00bb2c6295b2c5817c17df997', 'Exact saved baseline source');
const sourceRequire = createRequire(join(atlasRoot, 'package.json'));
const ts = sourceRequire('typescript');
const compile = path => ts.transpileModule(readFileSync(path, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const evaluate = (path, require) => {
  const module = { exports: {} };
  runInNewContext(compile(path), { module, exports: module.exports, require });
  return module.exports;
};
const source = JSON.parse(readFileSync(join(atlasRoot, 'public/models/bodyparts3d/inferior-epigastric-vessels/catalog.json'), 'utf8'));
const canonicalModule = evaluate(join(atlasRoot, 'lib/body-source-additions.ts'), name => {
  if (name === './body-presentation-parts.ts') return { validBodyPresentationParts: () => true };
  throw Error(`Unexpected canonical dependency: ${name}`);
});
const study = evaluate(join(atlasRoot, 'content/inferior-epigastric-study.ts'), () => { throw Error('Unexpected study dependency'); });
const dependency = name => {
  if (name.endsWith('/inferior-epigastric-vessels/catalog.json')) return { default: source };
  if (name === './body-source-additions') return canonicalModule;
  if (name === '../content/inferior-epigastric-study') return study;
  throw Error(`Unexpected lesson dependency: ${name}`);
};
const before = evaluate(resolve(beforePath), dependency);
const after = evaluate(join(proposalRoot, 'lib/inferior-epigastric-vessels.ts'), dependency);
const tabs = evaluate(join(atlasRoot, 'lib/content-types.ts'), () => { throw Error('Unexpected tab dependency'); }).contentTabs;
const publication = 'https://pmc.ncbi.nlm.nih.gov/articles/PMC11023341/';
const university = 'https://anatomy.ttuhscep.edu/anatomytables/arteries_abdomen.html';

test('four exact source structures have four distinct scored options and retained draft limits', () => {
  assert.equal(source.structures.length, 4);
  for (const structure of source.structures) {
    const old = before.inferiorEpigastricLesson(structure, 'quiz');
    const lesson = after.inferiorEpigastricLesson(structure, 'quiz');
    const artery = ['FMA20689', 'FMA20688'].includes(structure.fmaId);
    assert.equal(lesson.readiness, 'draft');
    assert.equal(lesson.note, old.note);
    assert.equal(lesson.title, old.title);
    assert.equal(lesson.bullets.length, 4);
    assert.equal(new Set(lesson.bullets).size, 4);
    assert.equal(lesson.bullets.filter(option => option === lesson.correctAnswer).length, 1);
    assert.equal(lesson.correctAnswer, artery ? 'External iliac artery' : 'External iliac vein');
    assert.equal(typeof lesson.explanation, 'string');
    assert(lesson.explanation.length > 20);
    assert(lesson.citations.includes(university));
    assert.equal(lesson.citations.includes(publication), !artery);
    assert.deepEqual(structuredClone(lesson.citations.filter(url => url !== publication)), structuredClone(old.citations));
  }
});

test('changed source record is refused by the actual canonical identity guard', () => {
  const changed = structuredClone(source.structures[0]);
  changed.name += ' changed';
  assert.notEqual(canonicalModule.sourceCanonical(changed), canonicalModule.sourceCanonical(source.structures[0]));
  for (const tab of tabs) assert.equal(after.inferiorEpigastricLesson(changed, tab), undefined);
});

test('all non-quiz tab outputs are identical before and after for every source structure', () => {
  for (const structure of source.structures) {
    for (const tab of tabs.filter(tab => tab !== 'quiz')) {
      assert.deepEqual(structuredClone(after.inferiorEpigastricLesson(structure, tab)),
        structuredClone(before.inferiorEpigastricLesson(structure, tab)), `${structure.id} / ${tab}`);
    }
  }
});
