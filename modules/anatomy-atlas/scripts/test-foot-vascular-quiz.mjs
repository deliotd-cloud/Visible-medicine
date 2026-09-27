import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { runInNewContext } from 'node:vm';
import { contentContext, contentValidator } from './content-contract-tools.mjs';
import { exactSourceHistoryApi } from './exact-source-history-api.mjs';
import { beforeCircleWillisImaging } from './circle-willis-imaging-history.mjs';
import { build as componentBuild } from './workspace-component-test-build.mjs';
import { build } from './workspace-test-build.mjs';
import pins from '../content/foot-vascular-quiz-pins.json' with { type: 'json' };
import { footVascularQuizGroups, footVascularQuizQuestions } from '../content/foot-vascular-quiz.ts';

const hash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const snapshot = (api, display) => ({ body: display.structures.map(s => ({ id: s.id, sections: Object.fromEntries(api.contentTabs.map(t => [t, api.bodyLesson(s, t)])) })), shoulder: api.structures, recipes: api.dissectionProfiles });

const { api: currentApi, catalog, registry } = await contentContext();
// Check the frozen foot transition after verifying/replaying later editorial work.
const api = beforeCircleWillisImaging(currentApi);
const display = api.bodyDisplayCatalog(catalog), parent = await exactSourceHistoryApi(pins.parentCommit);
const built = await build({ stdin: { contents: "export {footVascularQuizLesson} from './lib/foot-vascular-quiz';", resolveDir: process.cwd(), loader: 'ts' }, bundle: true, write: false, platform: 'node', format: 'esm' });
const { footVascularQuizLesson } = await import('data:text/javascript;base64,' + Buffer.from(built.outputFiles[0].text).toString('base64'));
assert.equal(pins.parentCommit, '59b35d8f3b176fb542b6ff561472206477f9bbda');
assert.equal(hash(pins), '2e79508e0b0844d576036557726dcea202dc71be69dfe6a3467f8b568dba4209');
assert.deepEqual(display, parent.bodyDisplayCatalog(catalog));
assert.deepEqual(display.coordinateSystem, pins.coordinateSystem);
assert.equal(hash(snapshot(parent, display)), pins.previousAllLessonsAndRecipesHash);
assert.deepEqual(api.structures, parent.structures); assert.deepEqual(api.dissectionProfiles, parent.dissectionProfiles);
assert.deepEqual(pins.entries.map(e => e.identity.fmaId), Object.values(footVascularQuizGroups).flat());
for (const bundle of pins.bundles) {
  assert.deepEqual(display.bundles.find(b => b.id === bundle.id), bundle);
  const bytes = await readFile('public' + bundle.url.split('?')[0]);
  assert.equal(bytes.length, bundle.bytes); assert.equal(createHash('sha256').update(bytes).digest('hex'), bundle.sha256);
}
const targets = new Map(pins.entries.map(e => [e.identity.id, e]));
const records = api.bodyContentRecords(display), validate = await contentValidator(registry);
let changed = 0, unchanged = 0, rejected = 0;
const entries = [];
for (const s of display.structures) for (const tab of api.contentTabs) {
  const before = parent.bodyLesson(s, tab), now = api.bodyLesson(s, tab), target = targets.get(s.id);
  if (!target || tab !== 'quiz') {
    assert.deepEqual(now, before, s.id + '|' + tab); assert.equal(footVascularQuizLesson(s, tab), undefined); unchanged++; continue;
  }
  assert.deepEqual(s, target.identity); assert.deepEqual(target.topics, ['quiz']);
  assert.deepEqual(before, target.previous.quiz); assert.notDeepEqual(now, before);
  assert.deepEqual(now, footVascularQuizLesson(s, tab)); assert.equal(now.readiness, 'draft');
  assert.equal(now.bullets.length, 4); assert.equal(new Set(now.bullets).size, 4);
  assert.equal(now.bullets.filter(c => c === now.correctAnswer).length, 1); assert(now.explanation.trim());
  assert.match(now.note, /Radiologist review pending/); assert.match(now.note, /topology.*flow are not validated/);
  assert.deepEqual(now.citations, [footVascularQuizQuestions[target.group].reference]);
  const { readiness: _readiness, ...shown } = now; assert.deepEqual(api.bodyContent(s, tab), shown);
  const record = records.find(r => r.id === s.id); assert(validate(record)); assert.deepEqual(record.content.quiz, now);
  assert.equal(record.validation.clinicalApproval, 'not-included');
  const packet = await api.bodyReviewMaterial(s.id); assert.equal(packet.approval, false);
  const { tab: _tab, ...topic } = packet.topics.find(t => t.tab === 'quiz'); assert.deepEqual(topic, now);
  const copy = structuredClone(now); now.bullets.push('foreign'); now.citations.length = 0;
  assert.deepEqual(footVascularQuizLesson(s, tab), copy);
  entries.push({ id: s.id, tab, previousHash: hash(before), currentHash: hash(copy) }); changed++;
}
assert.equal(changed, 8); assert.equal(unchanged, 9928);
const leaves = (v, path = []) => v === null || typeof v !== 'object' ? [path] : Object.entries(v).flatMap(([k, c]) => leaves(c, [...path, k]));
for (const { identity } of pins.entries) for (const path of leaves(identity)) {
  const bad = structuredClone(identity); let obj = bad;
  for (const key of path.slice(0, -1)) obj = obj[key];
  const key = path.at(-1), old = obj[key]; obj[key] = typeof old === 'number' ? old + .01 : typeof old === 'boolean' ? !old : String(old) + '-foreign';
  assert.equal(footVascularQuizLesson(bad, 'quiz'), undefined); rejected++;
}
assert.equal(footVascularQuizLesson({ ...pins.entries[0].identity, id: 'unknown' }, 'quiz'), undefined);
for (const { identity } of pins.entries) {
  assert.equal(footVascularQuizLesson({ ...identity, unexpectedSourceField: true }, 'quiz'), undefined); rejected++;
  const missing = structuredClone(identity); assert(Object.hasOwn(missing, 'coverageNote'));
  delete missing.coverageNote; assert.equal(footVascularQuizLesson(missing, 'quiz'), undefined); rejected++;
}
const words = groups => groups.map(g => footVascularQuizQuestions[g].body + ' ' + footVascularQuizQuestions[g].explanation).join(' ').split(/\s+/).length;
assert(words(['medialPlantar', 'plantarArch', 'deepPlantar']) <= 150); assert(words(['dorsalVenousArch']) <= 80);
assert.deepEqual(Object.values(footVascularQuizQuestions).map(q => q.choices.indexOf(q.correctAnswer)), [0, 1, 2, 3]);

// Actual QuizNotes, workspace provider and native radio controls. Next Link is
// unavailable in this Vite checkout and must never render in this narrow harness.
const require = createRequire(import.meta.url), React = require('react'), render = require('react-dom/server').renderToStaticMarkup;
const component = await componentBuild({ stdin: { contents: "export {QuizNotes,AtlasWorkspace} from './app/atlas-workspace';", resolveDir: process.cwd(), loader: 'tsx' }, bundle: true, platform: 'node', format: 'cjs', write: false });
const scope = { exports: {} }; runInNewContext(component.outputFiles[0].text, { module: scope, exports: scope.exports,
  require: id => id === 'next/link' ? () => { throw Error('Unrelated Next Link must not render'); } : require(id), console });
const escaped = value => render(React.createElement('span', null, value)).slice(6, -7);
let rendered = 0;
for (const { identity } of pins.entries) {
  const question = api.bodyLesson(identity, 'quiz');
  const html = render(React.createElement(scope.exports.AtlasWorkspace, { exam: false }, React.createElement(scope.exports.QuizNotes, { structure: identity })));
  assert.equal((html.match(/type="radio"/g) || []).length, 4); assert(html.includes('<fieldset'));
  assert.match(html, /<button[^>]*disabled=""[^>]*>Check answer/);
  assert(!html.includes('Correct answer:')); assert(!html.includes(escaped(question.explanation)));
  assert(html.includes(escaped(question.body))); assert(html.includes(question.citations[0]));
  for (const choice of question.bullets) assert(html.includes(escaped(choice)));
  const examHtml = render(React.createElement(scope.exports.AtlasWorkspace, { exam: true }, React.createElement(scope.exports.QuizNotes, { structure: identity })));
  assert(!examHtml.includes('type="radio"')); assert(!examHtml.includes(escaped(question.body))); assert(!examHtml.includes(question.citations[0])); rendered++;
}
const transition = { parentCommit: pins.parentCommit, pinsHash: hash(pins), previousAllLessonsAndRecipesHash: pins.previousAllLessonsAndRecipesHash,
  currentAllLessonsAndRecipesHash: hash(snapshot(api, display)), entries };
if (process.argv.includes('--record')) await writeFile('content/foot-vascular-quiz-transition.json', JSON.stringify(transition, null, 2) + '\n', { flag: 'wx' });
else assert.deepEqual(JSON.parse(await readFile('content/foot-vascular-quiz-transition.json')), transition);
console.log(JSON.stringify({ changed, unchanged, rejected, rendered, arterialWords: words(['medialPlantar', 'plantarArch', 'deepPlantar']), venousWords: words(['dorsalVenousArch']), transitionHash: hash(transition), clinicalApproval: false }));
