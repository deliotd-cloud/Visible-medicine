import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { build } from './workspace-test-build.mjs';
import { build as componentBuild } from './workspace-component-test-build.mjs';
import { createRequire } from 'node:module';
import { runInNewContext } from 'node:vm';
const result = await build({ stdin: { contents: "export * from './lib/um-limb-teaching.ts'; export { limbDefinitions } from './lib/um-limb-studies.ts'; export { specimenLessons } from './content/um-limb-teaching.ts';", resolveDir: process.cwd(), loader: 'ts' }, bundle: true, write: false, format: 'esm', platform: 'node' });
const api = await import('data:text/javascript;base64,' + Buffer.from(result.outputFiles[0].text).toString('base64'));
const { limbDefinitions, specimenTeachingFor, createIdentification, reduceIdentification, specimenLessons } = api;
const whole = limbDefinitions.whole, copy = x => JSON.parse(JSON.stringify(x));
let checks = 0;
const same = (a, b, message) => { checks++; assert.deepEqual(a, b, message); };
same(Object.keys(specimenLessons).length, 67);
same(whole.surfaces.filter(s => specimenTeachingFor(whole, s)?.attachments).length, 42);
for (const surface of whole.surfaces) {
  const lesson = specimenTeachingFor(whole, surface);
  same(lesson, specimenLessons[surface.slug]);
  same(lesson.references.every(url => /^https:\/\//.test(url)), true);
  same(JSON.stringify(lesson).includes('FMA'), false);
  same(specimenTeachingFor(whole, { ...surface, name: 'Reassigned source identity' }), null);
  const altered = copy(whole); altered.catalog.bundles.find(b => b.id === surface.bundle).sha256 = 'changed';
  same(specimenTeachingFor(altered, surface), null);
  const shifted = copy(surface); shifted.bounds.min[0] += .1;
  same(specimenTeachingFor(whole, shifted), null);
  const reSource = copy(surface); reSource.sources[0].sha256 = 'changed';
  same(specimenTeachingFor(whole, reSource), null);
  lesson.function = 'mutated'; same(specimenTeachingFor(whole, surface).function, specimenLessons[surface.slug].function);
}
same(specimenTeachingFor(limbDefinitions.foot, whole.surfaces.find(s => s.slug === 'gluteus-maximus')), null);
const preserved = JSON.stringify(limbDefinitions);
for (const definition of Object.values(limbDefinitions)) {
  const visible = definition.surfaces.map(s => s.id);
  const initial = createIdentification(definition, visible, () => .3);
  same(initial.questions.length, Math.min(10, visible.length));
  same(new Set(initial.questions.map(q => q.targetId)).size, initial.questions.length);
  same(reduceIdentification(initial, { type: 'next' }), initial);
  same(reduceIdentification(initial, { type: 'answer', id: 'FMA99999' }), initial);
  let state = initial;
  while (state.questions[state.index]) {
    const q = state.questions[state.index];
    same(q.options.length, Math.min(4, visible.length)); same(new Set(q.options).size, q.options.length);
    same(q.options.every(id => visible.includes(id)), true); same(q.options.includes(q.targetId), true);
    if (state.index % 3 === 0) {
      const id = q.options.find(id => id !== q.targetId);
      state = reduceIdentification(state, { type: 'answer', id }); same(state.feedback, 'wrong');
      same(reduceIdentification(state, { type: 'answer', id }), state);
      state = reduceIdentification(state, { type: 'answer', id: q.targetId });
      same(state.results.at(-1).firstTry, false);
    } else if (state.index % 3 === 1) {
      state = reduceIdentification(state, { type: 'reveal' }); same(state.results.at(-1).firstTry, false);
      same(state.results.at(-1).revealed, true);
    } else { state = reduceIdentification(state, { type: 'answer', id: q.targetId }); same(state.results.at(-1).firstTry, true); }
    same(reduceIdentification(state, { type: 'answer', id: q.targetId }), state);
    same(reduceIdentification(state, { type: 'reveal' }), state);
    state = reduceIdentification(state, { type: 'next' }); same(state.wrong, []);
  }
  same(state.results.length, initial.questions.length);
  same(reduceIdentification(state, { type: 'next' }), state);
  const missed = state.results.filter(r => !r.firstTry).map(r => r.targetId);
  const retry = createIdentification(definition, visible, () => .7, missed);
  same(retry.questions.every(q => missed.includes(q.targetId)), true);
  const pair = createIdentification(definition, visible.slice(0, 2), () => .5);
  same(pair.questions.length, 2); same(pair.questions.every(q => q.options.length === 2), true);
  same(createIdentification(definition, visible.slice(0, 1)), null);
  same(createIdentification(definition, ['not-a-source']), null);
  same(createIdentification(definition, visible, () => .5, ['not-a-source']), null);
}
same(JSON.stringify(limbDefinitions), preserved);
const component = await componentBuild({ entryPoints: ['app/um-limb-learning.tsx'], bundle: true, write: false, format: 'cjs', platform: 'node', plugins: [{ name: 'scene-boundary', setup(api) {
  api.onLoad({ filter: /body-scene\.tsx$/ }, () => ({ loader: 'js', contents: 'export function BodyScene(props) { globalThis.sceneProps = props; return null; }' }));
} }] });
const require = createRequire(import.meta.url), React = require('react'), mod = { exports: {} };
const context = { module: mod, exports: mod.exports, require, URL, console, process: { env: { NODE_ENV: 'test' } } };
runInNewContext(component.outputFiles[0].text, context);
const render = (name, props) => require('react-dom/server').renderToStaticMarkup(React.createElement(mod.exports[name], props));
const escape = t => t.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#x27;');
for (const selected of whole.surfaces) {
  const html = render('SpecimenLearning', { definition: whole, selected });
  same(html.includes(escape(specimenLessons[selected.slug].anatomy)), true);
  same(html.includes('Teaching draft'), true);
  same(html.includes('Clinical/pathology'), true);
}
for (const definition of Object.values(limbDefinitions)) {
  const visibleIds = definition.surfaces.map(s => s.id), initial = createIdentification(definition, visibleIds, () => .2);
  const html = render('SpecimenIdentification', { definition, visibleIds, initial, initialView: 'anterior', onClose() {} });
  same(html.includes('Name the highlighted structure'), true);
  same(html.includes('Answering is paused until the model is ready.'), true);
  const props = context.sceneProps;
  same(props.selectedId, initial.questions[0].targetId); same(props.labels, false); same(props.showOrigins, false);
  same(props.isolated, true); same(props.explode, 0); same(props.focus, true);
  same(JSON.stringify(props.landmarks), '[]'); same(props.cameraBounds, null);
}
const parent = await readFile('app/um-knee-study.tsx', 'utf8');
same(parent.includes('if (practice) return <SpecimenIdentification'), true);
same(parent.includes("restorePracticeFocus.current = true; setHealth('starting'); setPractice(null);"), true);
same(parent.includes('ready && !practice && restorePracticeFocus.current'), true);
same(parent.includes('<SpecimenLearning definition={specimen} selected={selected} />'), true);
console.log(JSON.stringify({ checks, exactSourceLessons: 67, muscleAttachmentLessons: 42, learningMarkupCases: 67, practiceMarkupCases: 5, rounds: 'up to 10, first-try/reveal/retry-missed verified', clinicalOrBrowserAcceptance: false }));
