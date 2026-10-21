// Offline exact quick-check history tests. Runtime content and approvals are not modified.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const root = dirname(here);
const scripts = join(root, 'scripts');
const hash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const {beforeRegionalQuickCheckKeys, beforeRegionalQuickCheckKeysOnly, beforeRegionalShoulderQuickCheckKeys} =
  await import('./regional-quick-check-history.mjs');
const {authoringBeforeHipImaging} = await import('./hip-imaging-history.mjs');
const {contentContext} = await import(pathToFileURL(join(scripts, 'content-contract-tools.mjs')).href);
const {authoringBeforeWristImaging} = await import(pathToFileURL(join(scripts, 'wrist-imaging-history.mjs')).href);
const {beforeLumbarDiscMri} = await import(pathToFileURL(join(scripts, 'lumbar-disc-mri-history.mjs')).href);
const {preCoronaryArterialStudyProfiles} = await import(pathToFileURL(join(scripts, 'coronary-arterial-study-history.mjs')).href);
const {beforeAbdominalOrganQuiz} = await import(pathToFileURL(join(scripts, 'abdominal-organ-quiz-history.mjs')).href);
const hipPin = JSON.parse(readFileSync(join(root, 'content/hip-imaging.before.json'), 'utf8'));
const abdominalPin = JSON.parse(readFileSync(join(root, 'content/abdominal-organ-quiz-pins.json'), 'utf8'));

// Derive the nine source Quiz literals without compiling runtime or executing UI code.
const ts = (await import(pathToFileURL(join(root, 'node_modules/typescript/lib/typescript.js')).href)).default;
const source = ts.createSourceFile('anatomy-data.ts', readFileSync(join(root, 'app/anatomy-data.ts'), 'utf8'), ts.ScriptTarget.Latest, true);
const prop = (object, key) => object.properties.find(p => p.name?.getText(source) === key)?.initializer;
let array;
function walk(node) {
  if (ts.isVariableDeclaration(node) && node.name.getText(source) === 'structures') array = node.initializer;
  ts.forEachChild(node, walk);
}
walk(source);
const shoulders = array.elements.map((object, index) => {
  const quiz = prop(prop(object, 'sections'), 'quiz');
  return {id: prop(object, 'id').text, marker: `metadata-${index}`, sections: {
    anatomy: {body: `preserve-${index}`},
    quiz: {body: `quiz-${index}`, correctAnswer: prop(quiz, 'correctAnswer').text,
      explanation: prop(quiz, 'explanation').text},
  }};
});
assert.equal(shoulders.length, 9);
assert.equal(hash(shoulders.map(s => s.id)), 'caa2fc69aa18b1f33595dacfb9a9c45166f2dbd51976a719d934732ec2e8020b');
assert.equal(hash(shoulders.map(s => [s.id, s.sections.quiz.correctAnswer, s.sections.quiz.explanation])),
  '073dbb66cdbee4854995fb83ddc693051fd5790bfcc24ca176e83c132f861180');
const unchanged = structuredClone(shoulders);
const restored = beforeRegionalShoulderQuickCheckKeys(shoulders);
assert.deepEqual(shoulders, unchanged);
assert.notStrictEqual(restored, shoulders);
for (let i = 0; i < 9; i++) {
  assert.equal(restored[i].marker, shoulders[i].marker);
  assert.deepEqual(restored[i].sections.anatomy, shoulders[i].sections.anatomy);
  assert.deepEqual(restored[i].sections.quiz, {body: `quiz-${i}`});
}
assert.deepEqual(beforeRegionalShoulderQuickCheckKeys(restored), restored);
for (const mutate of [
  value => {value[0].sections.quiz.correctAnswer = unchanged[0].sections.quiz.correctAnswer;},
  value => {value[0].sections.quiz.explanation = 'foreign';},
  value => {value[0].sections.quiz.correctAnswer = 'foreign';},
  value => {value[0].id = 'foreign';},
  value => {value.pop();},
]) {
  const value = structuredClone(restored);
  mutate(value);
  assert.throws(() => beforeRegionalShoulderQuickCheckKeys(value));
}
const foreign = structuredClone(shoulders);
foreign[0].sections.quiz.correctAnswer = 'foreign';
assert.throws(() => beforeRegionalShoulderQuickCheckKeys(foreign));
const partial = structuredClone(shoulders);
delete partial[0].sections.quiz.explanation;
assert.throws(() => beforeRegionalShoulderQuickCheckKeys(partial));

// Immutable body/history is checked by the unchanged whole author script.
// Execute the unchanged, source-bound author-epoch test in a trusted checkout.
// A missing or altered checkout is a failed test, never a skipped test.
import {runOriginalHipQuickCheck} from './hip-quick-check-history-context.mjs';

try {
  process.exitCode = runOriginalHipQuickCheck();
} catch (error) {
  console.error(error);
  process.exitCode = 1;
}
