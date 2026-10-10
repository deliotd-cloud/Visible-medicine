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
// Exercise the production component handlers, not just the identification reducer.
const eventSlots = [];
let eventCursor = 0, eventTree;
const eventReact = { ...React,
  useState(initial) {
    const index = eventCursor++;
    if (!(index in eventSlots)) eventSlots[index] = typeof initial === 'function' ? initial() : initial;
    return [eventSlots[index], update => {
      eventSlots[index] = typeof update === 'function' ? update(eventSlots[index]) : update;
    }];
  },
  useRef(initial) { const index = eventCursor++; return eventSlots[index] ??= { current: initial }; },
  useEffect() {},
};
const eventModule = { exports: {} };
runInNewContext(component.outputFiles[0].text, {
  module: eventModule, exports: eventModule.exports,
  require: id => id === 'react' ? eventReact : require(id), URL, console,
  process: { env: { NODE_ENV: 'test' } },
});
const descendants = tree => !tree || typeof tree !== 'object' ? [] : Array.isArray(tree)
  ? tree.flatMap(descendants) : [tree, ...descendants(tree.props?.children)];
const nodeText = tree => tree == null ? '' : typeof tree === 'string' || typeof tree === 'number'
  ? String(tree) : Array.isArray(tree) ? tree.map(nodeText).join('') : nodeText(tree.props?.children);
let eventProps;
function eventRender() {
  eventCursor = 0;
  eventTree = eventModule.exports.SpecimenIdentification(eventProps);
  return eventTree;
}
function eventNode(predicate, label) {
  const found = descendants(eventTree).filter(predicate);
  same(found.length, 1, label);
  return found[0].props;
}
const eventScene = () => eventNode(node => node.type?.name === 'BodyScene', 'one identification scene');
const eventButton = label => eventNode(node => node.props?.onClick && nodeText(node) === label, `button ${label}`);
function startComponentRound(length, firstWrong = false, answerImmediately = true, sharedChoices = false) {
  eventSlots.length = 0;
  const definition = limbDefinitions.whole;
  const visibleIds = definition.surfaces.map(surface => surface.id);
  const initial = createIdentification(definition, visibleIds, () => .2);
  const questions = initial.questions.slice(0, length).map(question => ({ ...question, options: [...question.options] }));
  if (sharedChoices && questions.length > 1) {
    const include = (question, id) => ({ ...question,
      options: [question.targetId, id, ...question.options.filter(option => option !== question.targetId && option !== id)].slice(0, 4),
    });
    const [first, second] = questions;
    questions[0] = include(first, second.targetId);
    questions[1] = include(second, first.targetId);
  }
  eventProps = { definition, visibleIds, initial: { ...initial, questions },
    initialView: 'anterior', onClose() {} };
  eventRender();
  const scene = eventScene();
  for (const bundle of definition.catalog.bundles) scene.onLoaded(bundle.id);
  scene.onRendererHealth('ready');
  eventRender();
  const question = eventProps.initial.questions[0];
  if (!answerImmediately) return { definition, scene, first: question.targetId };
  if (firstWrong) {
    const wrong = question.options.find(id => id !== question.targetId);
    eventButton(definition.surfaces.find(surface => surface.id === wrong).name).onClick();
    eventRender();
  }
  eventButton(definition.surfaces.find(surface => surface.id === question.targetId).name).onClick();
  eventRender();
  return { definition, scene, first: question.targetId };
}
for (const action of ['answer', 'reveal']) {
  const round = startComponentRound(1, false, false);
  const answerName = round.definition.surfaces.find(surface => surface.id === round.first).name;
  const queued = eventButton(action === 'answer' ? answerName : 'Reveal answer').onClick;
  const before = JSON.stringify(eventSlots[0]);
  eventScene().onRendererHealth('lost');
  queued(); // Callback captured while enabled, fired before the loss re-render.
  eventRender();
  same(JSON.stringify(eventSlots[0]), before, `${action} cannot change feedback, score or question after loss`);
  same(nodeText(eventTree).includes('Question 1 of 1'), true);
  same(eventButton('Reveal answer').disabled, true);
  same(eventButton('Back to dissection').disabled ?? false, false);
  eventScene().onRendererHealth('ready');
  eventRender();
  const enabled = eventButton(action === 'answer' ? answerName : 'Reveal answer');
  same(enabled.disabled, false);
  enabled.onClick();
  eventRender();
  same(eventSlots[0].feedback, action === 'answer' ? 'correct' : 'revealed');
  same(eventButton('Finish round').disabled, false);
}
{
  const round = startComponentRound(2, false, false, true);
  const [first, second] = eventProps.initial.questions;
  const oldAnswers = first.options.map(id => eventButton(round.definition.surfaces.find(surface => surface.id === id).name).onClick);
  const oldReveal = eventButton('Reveal answer').onClick;
  same(first.options.includes(second.targetId), true);
  same(second.options.includes(first.targetId), true);
  eventButton(round.definition.surfaces.find(surface => surface.id === first.targetId).name).onClick();
  eventRender();
  const oldNext = eventButton('Next structure').onClick;
  oldNext(); // Advance once; a second queued Next must not skip the new question.
  const secondState = JSON.stringify(eventSlots[0]);
  for (const callback of [...oldAnswers, oldReveal, oldNext]) callback();
  same(JSON.stringify(eventSlots[0]), secondState, 'Queued Q1 callbacks cannot change Q2 before render');
  eventRender();
  same(nodeText(eventTree).includes('Question 2 of 2'), true);
  for (const callback of [...oldAnswers, oldReveal, oldNext]) callback();
  eventRender();
  same(JSON.stringify(eventSlots[0]), secondState, 'Captured Q1 callbacks cannot change Q2 after render');
  same(eventScene().selectedId, second.targetId);
  same(eventButton('Back to dissection').disabled ?? false, false);
}
{
  const round = startComponentRound(2);
  same(eventButton('Next structure').disabled, false);
  const queuedNext = eventButton('Next structure').onClick;
  eventScene().onRendererHealth('lost');
  queuedNext(); // A callback queued before loss must observe revoked readiness.
  eventRender();
  same(eventButton('Next structure').disabled, true);
  eventButton('Next structure').onClick(); // Forced invocation of a disabled control.
  eventRender();
  same(eventScene().selectedId, round.first);
  same(nodeText(eventTree).includes('Question 1 of 2'), true);
  same(eventButton('Back to dissection').disabled ?? false, false);
  eventScene().onRendererHealth('ready');
  eventRender();
  same(eventButton('Next structure').disabled, false);
  eventButton('Next structure').onClick();
  eventRender();
  same(nodeText(eventTree).includes('Question 2 of 2'), true);
  const second = eventProps.initial.questions[1];
  eventButton(round.definition.surfaces.find(surface => surface.id === second.targetId).name).onClick();
  eventRender();
  const required = round.definition.catalog.bundles.find(bundle => round.definition.surfaces.some(surface => surface.bundle === bundle.id));
  eventScene().onFailure(required.id);
  eventRender();
  same(eventButton('Finish round').disabled, true);
  eventButton('Finish round').onClick();
  eventRender();
  same(nodeText(eventTree).includes('Question 2 of 2'), true);
}
{
  const round = startComponentRound(1, true);
  same(eventButton('Finish round').disabled, false);
  const scene = eventScene();
  scene.onRendererHealth('lost');
  eventRender();
  same(eventButton('Finish round').disabled, true);
  eventButton('Finish round').onClick();
  eventRender();
  same(eventScene().selectedId, round.first);
  scene.onRendererHealth('ready');
  eventRender();
  eventButton('Finish round').onClick();
  eventRender();
  same(nodeText(eventTree).includes('Round complete'), true);
  same(eventButton('Retry missed').disabled, false);
  scene.onFailure(round.definition.catalog.bundles[0].id);
  eventRender();
  same(eventButton('New round').disabled, true);
  same(eventButton('Retry missed').disabled, true);
  eventButton('New round').onClick();
  eventButton('Retry missed').onClick();
  eventRender();
  same(nodeText(eventTree).includes('Round complete'), true);
  same(eventButton('Back to dissection').disabled ?? false, false);
}
for (const replay of ['Retry missed', 'New round']) {
  startComponentRound(1, true);
  eventButton('Finish round').onClick();
  eventRender();
  const oldNewRound = eventButton('New round').onClick;
  const oldRetryMissed = eventButton('Retry missed').onClick;
  same(eventButton('Retry missed').disabled, false);
  eventButton(replay).onClick();
  eventRender();
  const currentRound = JSON.stringify(eventSlots[0]);
  same(eventSlots[0].feedback, 'ready');
  for (const callback of [oldNewRound, oldRetryMissed]) callback();
  same(JSON.stringify(eventSlots[0]), currentRound, `${replay} old-round callbacks blocked before render`);
  eventRender();
  for (const callback of [oldNewRound, oldRetryMissed]) callback();
  eventRender();
  same(JSON.stringify(eventSlots[0]), currentRound, `${replay} old-round callbacks blocked after render`);
  same(eventButton('Back to dissection').disabled ?? false, false);
}
const parent = await readFile('app/um-knee-study.tsx', 'utf8');
same(parent.includes('if (practice) return <SpecimenIdentification'), true);
same(parent.includes("restorePracticeFocus.current = true; setHealth('starting'); setPractice(null);"), true);
same(parent.includes('ready && !practice && restorePracticeFocus.current'), true);
same(parent.includes('<SpecimenLearning definition={specimen} selected={selected} initialTopic='), true);
console.log(JSON.stringify({ checks, exactSourceLessons: 67, muscleAttachmentLessons: 42, learningMarkupCases: 67, practiceMarkupCases: 5, componentReadinessCases: 4, staleContextCases: 3, rounds: 'up to 10, first-try/reveal/retry-missed verified', clinicalOrBrowserAcceptance: false }));
