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
const sourceRequire = createRequire(join(atlasRoot, 'package.json'));
const ts = sourceRequire('typescript');
const beforePath = join(proposalRoot, 'scripts/fixtures/elbow-arteries.before.ts.txt');
const baselineHash = '6b2b82e4cf22e9a07af4d29e7109769c30ae14b5d4cc994f4a23dfe01ce4c73c';
assert.equal(createHash('sha256').update(readFileSync(beforePath)).digest('hex'), baselineHash, 'exact saved source baseline');
const compile = path => ts.transpileModule(readFileSync(path, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const evaluate = (path, require) => {
  const module = { exports: {} };
  runInNewContext(compile(path), { module, exports: module.exports, require });
  return module.exports;
};
const catalog = JSON.parse(readFileSync(join(atlasRoot, 'public/models/bodyparts3d/elbow-arteries/catalog.json'), 'utf8'));
const canonicalModule = evaluate(join(atlasRoot, 'lib/body-source-additions.ts'), name => {
  if (name === './body-presentation-parts.ts') return { validBodyPresentationParts: () => true };
  throw Error(`Unexpected canonical dependency: ${name}`);
});
const facts = evaluate(join(atlasRoot, 'content/elbow-arterial.ts'), () => { throw Error('Unexpected fact dependency'); });
const dependency = name => {
  if (name.endsWith('/elbow-arteries/catalog.json')) return { default: catalog };
  if (name === './body-source-additions') return canonicalModule;
  if (name === '../content/elbow-arterial') return facts;
  throw Error(`Unexpected elbow lesson dependency: ${name}`);
};
const before = evaluate(beforePath, dependency);
const after = evaluate(join(proposalRoot, 'lib/elbow-arteries.ts'), dependency);
const tabs = evaluate(join(atlasRoot, 'lib/content-types.ts'), () => { throw Error('Unexpected tab dependency'); }).contentTabs;
const choices = ['brachial artery', 'deep brachial artery', 'radial artery', 'ulnar artery'];

test('all 14 exact source placements have one explicit, source-fact answer', () => {
  assert.equal(catalog.structures.length, 14);
  for (const structure of catalog.structures) {
    const fact = facts.elbowArterialFacts.find(row => row.fmaIds.includes(structure.fmaId));
    assert(fact, structure.id);
    const old = before.elbowArteryLesson(structure, 'quiz');
    const lesson = after.elbowArteryLesson(structure, 'quiz');
    assert.equal(lesson.readiness, 'draft');
    assert.equal(lesson.title, old.title);
    assert.equal(lesson.note, old.note);
    assert.deepEqual(structuredClone(lesson.citations), structuredClone(old.citations));
    assert.deepEqual(structuredClone(lesson.bullets), choices);
    assert.equal(lesson.bullets.filter(option => option === lesson.correctAnswer).length, 1);
    assert.equal(lesson.correctAnswer, fact.parentName);
    assert.match(lesson.body, /usual direct parent/);
    assert(lesson.explanation.includes(fact.parentName));
    assert.match(lesson.explanation, /individual patient/);
  }
});

test('actual source canonical guard refuses malformed and changed identities', () => {
  const pin = catalog.structures[0];
  const changedName = structuredClone(pin); changedName.name += ' changed';
  const changedFma = structuredClone(pin); changedFma.fmaId = 'FMA0';
  assert.notEqual(canonicalModule.sourceCanonical(changedName), canonicalModule.sourceCanonical(pin));
  for (const changed of [{}, { id: pin.id }, { ...pin, id: 'different' }, changedName, changedFma]) {
    for (const tab of tabs) assert.equal(after.elbowArteryLesson(changed, tab), undefined);
  }
});

test('every non-quiz tab is structurally identical before and after', () => {
  for (const structure of catalog.structures) {
    for (const tab of tabs.filter(tab => tab !== 'quiz')) {
      assert.deepEqual(structuredClone(after.elbowArteryLesson(structure, tab)),
        structuredClone(before.elbowArteryLesson(structure, tab)), `${structure.id} / ${tab}`);
    }
  }
});
