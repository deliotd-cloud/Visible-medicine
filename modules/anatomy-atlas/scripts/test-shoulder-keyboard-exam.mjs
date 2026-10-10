/* oxlint-disable react-hooks/rules-of-hooks -- controlled hooks run the production component */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { runInNewContext } from 'node:vm';
import { test } from 'node:test';

const root = process.cwd();
const { build } = await import(pathToFileURL(join(root, 'scripts/workspace-component-test-build.mjs')).href);
const require = createRequire(join(root, 'package.json'));
const React = require('react');
const source = await readFile(process.env.SHOULDER_EXAM_SOURCE ?? join(root, 'app/shoulder-explorer.tsx'), 'utf8');
const built = await build({
  stdin: { contents: "export { default as ShoulderExplorer } from './app/shoulder-explorer'; export { quizQuestions, structureById } from './app/anatomy-data';", loader: 'tsx', resolveDir: root },
  bundle: true, platform: 'node', format: 'cjs', write: false, loader: { '.css': 'empty' },
  plugins: [{ name: 'staged-shoulder-exam', setup(api) {
    api.onLoad({ filter: /[\\/]app[\\/]shoulder-explorer\.tsx$/ }, () => ({ loader: 'tsx', contents: source, resolveDir: join(root, 'app') }));
    api.onLoad({ filter: /[\\/]app[\\/]anatomy-scene\.tsx$/ }, () => ({ loader: 'tsx', contents: 'export function AnatomyScene(){return null;}' }));
    api.onLoad({ filter: /[\\/]app[\\/]workspace-session\.tsx?$/ }, () => ({ loader: 'ts', contents: 'export function useWorkspaceSession(){return window.__workspace;}' }));
    api.onLoad({ filter: /[\\/]app[\\/]imaging-link\.tsx$/ }, () => ({ loader: 'tsx', contents: 'export function ImagingLink(){return null;} export function useImagingLink(){return {publish(){}};}' }));
  } }],
});
const nodes = tree => !tree || typeof tree !== 'object' ? [] : Array.isArray(tree) ? tree.flatMap(nodes) : [tree, ...nodes(tree.props?.children)];
const label = tree => typeof tree === 'string' ? tree : typeof tree === 'number' ? String(tree) : !tree || typeof tree !== 'object' ? '' : Array.isArray(tree) ? tree.map(label).join('') : label(tree.props?.children);

function harness() {
  const slots = [], setters = [];
  let cursor = 0, pending = [], dirty = false, tree;
  const depsChanged = (old, next) => !old || !next || old.length !== next.length || old.some((v, i) => !Object.is(v, next[i]));
  const shim = { ...React,
    useContext() { return { mode: win.__workspace.mode, exam: false, chooseMode: mode => { win.__workspace.mode = mode; }, setPanelOpen() {} }; },
    useId() { return 'shoulder-exam-test'; },
    useState(initial) { const i = cursor++; if (!(i in slots)) slots[i] = typeof initial === 'function' ? initial() : initial; setters[i] ??= value => { const next = typeof value === 'function' ? value(slots[i]) : value; if (!Object.is(next, slots[i])) { slots[i] = next; dirty = true; } }; return [slots[i], setters[i]]; },
    useRef(initial) { return slots[cursor++] ??= { current: initial }; },
    useMemo(fn, deps) { const i = cursor++; if (depsChanged(slots[i]?.deps, deps)) slots[i] = { deps, value: fn() }; return slots[i].value; },
    useCallback(fn, deps) { return shim.useMemo(() => fn, deps); },
    useReducer(reducer, initial) { const [state, set] = shim.useState(initial); return [state, action => set(value => reducer(value, action))]; },
    useEffect(fn, deps) { const i = cursor++; if (depsChanged(slots[i]?.deps, deps)) pending.push(() => { slots[i]?.cleanup?.(); slots[i] = { deps, cleanup: fn() }; }); },
  };
  const doc = { hidden: false, addEventListener() {}, removeEventListener() {} };
  const win = { __workspace: { mode: 'explore', chooseMode(mode) { this.mode = mode; } }, matchMedia: () => ({ matches: false, addEventListener() {}, removeEventListener() {} }), setTimeout, clearTimeout };
  const mod = { exports: {} };
  runInNewContext(built.outputFiles[0].text, { module: mod, exports: mod.exports, structuredClone, AbortController, window: win, document: doc, console,
    require(id) { if (id === 'react') return shim; if (id === 'next/dynamic') return () => 'AnatomyScene'; if (id === 'next/link') return 'a'; if (id === 'next/image') return 'img'; if (id === 'next/navigation') return { useRouter: () => ({}), useSearchParams: () => new URLSearchParams(), usePathname: () => '/shoulder' }; return require(id); } });
  function render() { let count = 0; do { dirty = false; cursor = 0; pending = []; tree = mod.exports.ShoulderExplorer({ connectedReviews: false }); for (const fn of pending) fn(); assert(++count < 15, 'Hook render settles'); } while (dirty); return tree; }
  const find = predicate => { const matches = nodes(tree).filter(predicate); assert.equal(matches.length, 1, 'Find one production element'); return matches[0].props; };
  const button = text => find(n => n.type?.name === 'Button' && label(n).includes(text));
  const scene = () => find(n => n.type === 'AnatomyScene');
  const choices = () => find(n => n.props?.role === 'group' && n.props?.['aria-label'] === 'Answer by structure name').children;
  const choice = id => { const name = mod.exports.structureById.get(id).name; const found = choices().filter(n => label(n) === name); assert.equal(found.length, 1); return found[0].props; };
  const examText = () => label(find(n => n.props?.className === 'exam-panel').children);
  render();
  return { render, button, scene, choice, choices, examText, api: mod.exports };
}

test('Keyboard alternatives use exact authored options, answer once, and refuse captured callbacks on renderer loss and later questions', () => {
  const h = harness();
  h.scene().onRendererHealth('ready'); h.scene().onModelReady(true); h.render();
  const reportHealth = h.scene().onRendererHealth;
  const reportModel = h.scene().onModelReady;
  h.button('Start identification exam').onClick(); h.render();
  assert.strictEqual(h.scene().onRendererHealth, reportHealth, 'Stable renderer callback');
  assert.strictEqual(h.scene().onModelReady, reportModel, 'Stable model callback');
  const questions = h.api.quizQuestions;
  for (let index = 0; index < questions.length; index++) {
    const q = questions[index];
    assert.equal(new Set(q.options).size, q.options.length, 'Authored alternatives are unique');
    assert.equal(q.options.filter(id => id === q.answer).length, 1, 'Target occurs exactly once');
    for (const id of q.options) assert(h.api.structureById.get(id)?.name, `Named shoulder structure: ${id}`);
    assert.deepEqual(h.choices().map(n => label(n)), q.options.map(id => h.api.structureById.get(id).name));
    assert(h.choices().every(n => n.props.disabled === false), 'Ready answer buttons are enabled');
    assert(!h.examText().includes('Correct') && !h.examText().includes('Not quite'), 'No pre-answer feedback');
    const captured = q.options.map(id => h.choice(id).onClick);
    const wrong = q.options.find(id => id !== q.answer);
    h.scene().onRendererHealth('lost');
    h.choice(wrong).onClick(); h.render();
    assert(!h.examText().includes('Not quite'), 'Renderer loss refuses queued answer before render');
    assert(h.choices().every(n => n.props.disabled), 'Renderer loss disables answer buttons');
    h.scene().onRendererHealth('ready'); h.render();
    assert(h.choices().every(n => n.props.disabled === false), 'Renderer recovery enables answer buttons');
    assert.strictEqual(h.scene().onRendererHealth, reportHealth);
    h.scene().onModelReady(false);
    captured[q.options.indexOf(q.answer)](); h.render();
    assert(!h.examText().includes('Correct'), 'Model loss refuses captured answer before render');
    assert(h.choices().every(n => n.props.disabled), 'Model loss disables answer buttons');
    h.scene().onModelReady(true); h.render();
    assert(h.choices().every(n => n.props.disabled === false), 'Model recovery enables answer buttons');
    assert.strictEqual(h.scene().onModelReady, reportModel);
    if (index === 0) {
      h.choice(wrong).onClick(); h.render();
      assert(h.examText().includes('Not quite'));
      captured[q.options.indexOf(q.answer)](); h.render();
      assert(h.examText().includes('Not quite'), 'Second answer cannot replace wrong answer');
    } else {
      h.choice(q.answer).onClick(); h.render();
      assert(h.examText().includes('Correct'));
    }
    assert(h.examText().includes(`Current result${index} / ${index + 1}`), 'Exact answer score and progress');
    const next = h.button(index === questions.length - 1 ? 'Restart exam' : 'Next question').onClick;
    next();
    captured[0]();
    h.render();
    assert(!h.examText().includes('Not quite'), 'Previous question option cannot answer new question');
    if (index < questions.length - 1) assert(!h.examText().includes('Correct'));
    else {
      captured[0](); h.render();
      assert(h.examText().includes('Current result0 / 0'), 'Old-round callback cannot score the restarted exam');
      assert(!h.examText().includes('Correct'), 'Restart has no leaked answer feedback');
    }
  }
});

test('3D pointer remains a valid answer path and keyboard callback cannot replace it', () => {
  const h = harness();
  h.scene().onRendererHealth('ready'); h.scene().onModelReady(true); h.render();
  h.button('Start identification exam').onClick(); h.render();
  const q = h.api.quizQuestions[0];
  const keyboard = h.choice(q.answer).onClick;
  h.scene().onSelect(q.options.find(id => id !== q.answer)); h.render();
  assert(h.examText().includes('Not quite'));
  keyboard(); h.render();
  assert(h.examText().includes('Not quite'), 'Pointer answer remains first and final');
});
