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

const {api,catalog} = await contentContext();
const originalStructureHash = hash(api.structures);
const display = api.bodyDisplayCatalog(catalog);
const snapshot = (value, structures) => ({
  body: structures.map(s => ({id:s.id,sections:Object.fromEntries(api.contentTabs.map(tab => [tab,value.bodyLesson(s,tab)]))})),
  shoulder: value.structures, recipes: value.dissectionProfiles,
});
const prior = authoringBeforeHipImaging({api,catalog});
const rawAfterWrist = authoringBeforeWristImaging({api,catalog});
const keyed = catalog.structures.filter(s => {
  const q = rawAfterWrist.bodyLesson(s,'quiz');
  return q.correctAnswer !== undefined || q.explanation !== undefined;
});
assert.equal(keyed.length,11);
const originalQuizHash = hash(keyed.map(s => rawAfterWrist.bodyLesson(s,'quiz')));
const afterWrist = beforeRegionalQuickCheckKeysOnly(rawAfterWrist,catalog);
assert.equal(hash(keyed.map(s => rawAfterWrist.bodyLesson(s,'quiz'))),originalQuizHash);
assert.equal(beforeRegionalQuickCheckKeysOnly(afterWrist,catalog),afterWrist);
// The preintegration E test independently compared the original wrapper bytes.
// Here retain the documented foot-then-key composition contract.
const {beforeFootVascularQuiz}=await import('./foot-vascular-quiz-history.mjs');
const originalRegional = beforeRegionalQuickCheckKeysOnly(beforeFootVascularQuiz(api),catalog);
const candidateRegional = beforeRegionalQuickCheckKeys(api,catalog);
assert.deepEqual(snapshot(candidateRegional,catalog.structures),snapshot(originalRegional,catalog.structures));
const foreignBody = {...rawAfterWrist,bodyLesson(s,tab) {
  const lesson = rawAfterWrist.bodyLesson(s,tab);
  return s.id===keyed[0].id&&tab==='quiz' ? {...lesson,correctAnswer:'foreign'} : lesson;
}};
assert.throws(()=>beforeRegionalQuickCheckKeysOnly(foreignBody,catalog));
const mixedBody = {...rawAfterWrist,bodyLesson(s,tab) {
  const lesson = rawAfterWrist.bodyLesson(s,tab);
  if (s.id!==keyed[0].id||tab!=='quiz') return lesson;
  const {correctAnswer:_a,explanation:_e,...old}=lesson;
  return old;
}};
assert.throws(()=>beforeRegionalQuickCheckKeysOnly(mixedBody,catalog));
const partialBody = {...rawAfterWrist,bodyLesson(s,tab) {
  const lesson = rawAfterWrist.bodyLesson(s,tab);
  if (s.id!==keyed[0].id||tab!=='quiz') return lesson;
  const {explanation:_e,...partial}=lesson;
  return partial;
}};
assert.throws(()=>beforeRegionalQuickCheckKeysOnly(partialBody,catalog));
for(const s of keyed){
  assert.deepEqual(afterWrist.bodyContent(s,'quiz'),
    (({readiness:_r,...shown})=>shown)(afterWrist.bodyLesson(s,'quiz')));
  assert.deepEqual(afterWrist.bodyLesson(s,'anatomy'),rawAfterWrist.bodyLesson(s,'anatomy'));
}
assert.equal(hash(snapshot(prior,catalog.structures)), hipPin.allLessonsAndRecipesHash);
let preserved = 0;
for (const s of catalog.structures) for (const tab of api.contentTabs) {
  if (hipPin.tabs.includes(tab) && hipPin.entries.some(e => e.identity.id === s.id)) continue;
  assert.deepEqual(afterWrist.bodyLesson(s,tab),prior.bodyLesson(s,tab));
  preserved++;
}
assert.equal(preserved, 9120);
assert.equal(hash(api.structures), originalStructureHash);
const noLumbar = beforeLumbarDiscMri(api,catalog);
const noCoronary = {...noLumbar,dissectionProfiles:preCoronaryArterialStudyProfiles(noLumbar.dissectionProfiles)};
const abdominal = beforeAbdominalOrganQuiz(noCoronary);
assert.equal(hash(snapshot(abdominal,display.structures)),abdominalPin.previousAllLessonsAndRecipesHash);
console.log(JSON.stringify({shoulderStructures:9,shoulderRefusals:7,bodyKeyed:11,bodyRefusals:3,
  regionalWrapperEquivalent:true,bodyPreserved:preserved,
  hipHash:hipPin.allLessonsAndRecipesHash,abdominalHash:abdominalPin.previousAllLessonsAndRecipesHash,
  originalStructureHash,clinicalApproval:false}));
