import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {stableMutationContext} from './studio-mutation-context-fixture.mjs';

const require = createRequire(import.meta.url);
const React = require('react');
const ts = require('typescript');
const source = readFileSync(new URL('../components/StudioForms.tsx', import.meta.url), 'utf8');
const code = ts.transpileModule(source, {compilerOptions: {
  jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022,
}}).outputText;
const recoveryScope = {actorId:'edu:synthetic-author',organizationId:'org:synthetic'};
const releaseStorageKey = (id) => `visible-medicine-studio-draft:${JSON.stringify(['v1',recoveryScope.actorId,recoveryScope.organizationId,`release:${id}`])}`;

function fixture({savedDraft, delayTimers = false, newRelease = false} = {}) {
  const slots = {release: [], action: []};
  let phase = 'release', cursor = 0, props, releaseTree, actionTree;
  const payloads = [], refreshes = [];
  const effects = {release: [], action: []};
  const effectRecords={release:new Map(),action:new Map()};let renderNeeded=false;
  const timers = [];
  let confirmResult = false, confirmCalls = 0;
  let reply = {ok: true, status: 200, body: {ok:true, action:'save-release', releaseId: 'release:one'}};
  const oldGlobals = new Map(['fetch', 'FormData', 'navigator', 'localStorage', 'window', 'document',
    'HTMLInputElement', 'HTMLTextAreaElement', 'HTMLSelectElement'].map(name => [name, Object.getOwnPropertyDescriptor(globalThis, name)]));
  const hooks = {
    ...React,
    useState(initial) {const at = cursor++; const bag = slots[phase]; if (!(at in bag)) bag[at] = typeof initial === 'function' ? initial() : initial; return [bag[at], value => {const next=typeof value === 'function' ? value(bag[at]) : value;if(!Object.is(next,bag[at])){bag[at]=next;renderNeeded=true;}}];},
    useRef(initial) {const at = cursor++; const bag = slots[phase]; return bag[at] ??= {current: initial};},
    useEffect(create,deps) {const at=cursor++,records=effectRecords[phase],queue=effects[phase],old=records.get(at);if(!old||!deps||deps.some((value,index)=>!Object.is(value,old.deps[index])))queue.push(()=>{old?.cleanup?.();records.set(at,{deps,cleanup:create()});});},
    useLayoutEffect(create,deps) {hooks.useEffect(create,deps);},
  };
  const module = {exports: {}};
  new Function('require', 'module', 'exports', code)((name) => name === 'react' ? hooks
    : name === 'next/navigation' ? {useRouter: () => ({refresh: () => refreshes.push(true)})}
    : name === '@/lib/studio-templates' ? {STUDIO_COURSE_TEMPLATES: []}
    : name === '../lib/studio-navigation-guard.ts' ? {registerStudioNavigationGuard: () => () => {}}
    : name === '../lib/studio-mutation-context.ts' ? stableMutationContext : require(name), module, module.exports);
  const release = {id: 'release:one', version: 2, status: 'draft', workbookIds: ['workbook:one'], outcomes: ['Identify structures', 'Compare views'],
    title: 'Original release', slug: 'original-release', summary: 'Original saved description for a teaching release.',
    level: 'Intermediate', duration: 'Self-paced', publisher: 'School', publisherKind: 'institution',
    visibility: 'private', accessModel: 'invitation', priceMinor: 0, currency: 'GBP', enrolmentOpen: true};
  props = {course: {id: 'course:one', title: 'Course', description: release.summary},
    workbooks: [{id: 'workbook:one', title: 'Workbook one', mode: 'lecture', caseCount: 0}], release: newRelease ? undefined : release, recoveryScope};
  const fields = new Map([['expectedCourseId', 'course:one'], ['expectedReleaseId', newRelease ? '' : 'release:one'], ['expectedVersion', newRelease ? 'new' : '2'],
    ['title', 'Original release'], ['slug', 'original-release'], ['summary', release.summary],
    ['level', 'Intermediate'], ['duration', 'Self-paced'], ['outcomes', 'Identify structures\nCompare views'],
    ['publisherName', 'School'], ['publisherKind', 'institution'], ['visibility', 'private'],
    ['accessModel', 'invitation'], ['enrolmentOpen', 'on'], ['workbookIds', ['workbook:one']]]);
  class Input {
    constructor(name, type = 'text') {this.name = name; this.type = type;}
    get value() {return fields.get(this.name) ?? '';}
    set value(value) {fields.set(this.name, String(value));}
    get checked() {return this.type === 'checkbox' && fields.has(this.name);}
    set checked(value) {if (!value) fields.delete(this.name);}
  }
  class Textarea extends Input {}
  class Select extends Input {}
  const form = {elements: [...fields.keys()].map(name => new Input(name, name === 'workbookIds' || name === 'enrolmentOpen' ? 'checkbox' : 'text')),
    querySelectorAll: () => []};
  class SubmittedFormData {
    constructor() {this.values = new Map([...fields].map(([key, value]) => [key, Array.isArray(value) ? [...value] : value]));}
    get(name) {const value = this.values.get(name); return Array.isArray(value) ? value[0] ?? null : value ?? null;}
    getAll(name) {const value = this.values.get(name); return value === undefined ? [] : Array.isArray(value) ? [...value] : [value];}
    keys() {return this.values.keys();}
  }
  const stored = new Map();
  if (savedDraft !== undefined) stored.set(releaseStorageKey(newRelease ? 'course:one' : 'release:one'), JSON.stringify(savedDraft));
  const globals = {
    FormData: SubmittedFormData, HTMLInputElement: Input, HTMLTextAreaElement: Textarea, HTMLSelectElement: Select,
    navigator: {locks: {request: async (_name, action) => action()}},
    localStorage: {getItem: key => stored.get(key) ?? null, setItem: (key, value) => stored.set(key, value), removeItem: key => stored.delete(key)},
    document: {addEventListener(){},removeEventListener(){}}, window: {setTimeout: callback => {if (delayTimers) timers.push(callback); else callback(); return timers.length;}, clearTimeout() {}, addEventListener() {}, removeEventListener() {},
      confirm: () => {confirmCalls++; return confirmResult;}},
    fetch: async (_url, options) => {payloads.push(JSON.parse(options.body)); return {ok: reply.ok, status: reply.status, json: async () => reply.body};},
  };
  for (const [name, value] of Object.entries(globals)) Object.defineProperty(globalThis, name, {value, configurable: true, writable: true});
  function render() {
    let passes=0;do{assert(++passes<30);renderNeeded=false;
    phase = 'release'; cursor = 0; releaseTree = module.exports.ReleaseDraftForm(props);
    function attachRefs(node) {
      if (Array.isArray(node)) {node.forEach(attachRefs); return;}
      if (!node?.props) return;
      const {name, ref} = node.props;
      if (name && ref && typeof ref === 'object') ref.current = form.elements.find(item => item.name === name) ?? new Input(name);
      attachRefs(node.props.children);
    }
    attachRefs(releaseTree.props.children);
    phase = 'action'; cursor = 0; actionTree = releaseTree.type(releaseTree.props);
    actionTree.props.ref.current = form;
    for(const effect of effects.release.splice(0))effect();for(const effect of effects.action.splice(0))effect();
    }while(renderNeeded);
    return {releaseTree, actionTree};
  }
  async function submit() {render(); await actionTree.props.onSubmit({preventDefault() {}, currentTarget: form});}
  function find(predicate) {
    function walk(node) {if (Array.isArray(node)) {for (const child of node) {const match = walk(child); if (match) return match;} return null;}
      if (!node?.props) return null; return predicate(node) ? node : walk(node.props.children);}
    return walk(releaseTree);
  }
  function text(node) {return Array.isArray(node) ? node.map(text).join(' ') : node?.props ? text(node.props.children) :
    typeof node === 'string' || typeof node === 'number' ? String(node) : '';}
  function dispose() {for (const [name, descriptor] of oldGlobals) {if (descriptor) Object.defineProperty(globalThis, name, descriptor); else delete globalThis[name];}}
  render();
  return {props, fields, payloads, refreshes, stored, render, submit, find, text, dispose,
    setReply(value) {reply = value;}, setConfirm(value) {confirmResult = value;}, get confirmCalls() {return confirmCalls;},
    runTimers() {for (const callback of timers.splice(0)) callback(); render();}};
}

test('a refreshed release version cannot silently rebind an older open form to the newer CAS version', async () => {
  const h = fixture();
  try {
    h.props.release = {...h.props.release, version: 3, title: 'Another educator saved this'};
    await h.submit();
    assert.equal(h.payloads.length, 1);
    assert.equal(h.payloads[0].expectedVersion, 2, 'open form must retain the version whose fields it displays');
    assert.equal(h.payloads[0].title, 'Original release');
  } finally {h.dispose();}
});

test('one accepted save advances the open draft baseline exactly once for a subsequent save', async () => {
  const h = fixture();
  try {
    await h.submit();
    assert.equal(h.payloads[0].expectedVersion, 2);
    h.fields.set('title', 'Second local edit');
    await h.submit();
    assert.deepEqual(h.payloads.map(item => item.expectedVersion), [2, 3]);
    assert.equal(h.payloads[1].title, 'Second local edit');
  } finally {h.dispose();}
});

test('a queued newer edit retains the advanced accepted baseline in device-local storage', async () => {
  const h = fixture({savedDraft: {expectedCourseId: 'course:one', expectedReleaseId: 'release:one', expectedVersion: '2', title: 'Submitted revision'}});
  try {
    let finish;
    const pendingReply = new Promise(resolve => {finish = resolve;});
    globalThis.fetch = async (_url, options) => {
      h.payloads.push(JSON.parse(options.body));
      await pendingReply;
      return {ok: true, json: async () => ({ok:true, action:'save-release', releaseId: 'release:one'})};
    };
    const pending = h.submit();
    h.fields.set('title', 'Newer queued input');
    h.render().actionTree.props.onChange();
    await Promise.resolve();
    finish(); await pending;
    const saved = JSON.parse(h.stored.get(releaseStorageKey('release:one')));
    assert.equal(saved.title, 'Newer queued input');
    assert.equal(saved.expectedVersion, '3');
    assert.equal(h.payloads[0].title, 'Submitted revision');
    assert.equal(h.payloads[0].expectedVersion, 2);
  } finally {h.dispose();}
});

test('conflict refreshes saved context while retaining the open fields and original comparison version', async () => {
  const h = fixture();
  try {
    h.setReply({ok: false, status: 409, body: {error: 'This release draft changed or entered review. Refresh before saving.'}});
    h.fields.set('title', 'Unsent local revision');
    await h.submit();
    assert.equal(h.payloads[0].expectedVersion, 2);
    assert.equal(h.fields.get('title'), 'Unsent local revision');
    assert.equal(h.refreshes.length, 1);
    h.props.release = {...h.props.release, version: 3, title: 'Other saved revision'};
    h.setReply({ok: true, status: 200, body: {ok:true, action:'save-release', releaseId: 'release:one'}});
    await h.submit();
    assert.notEqual(h.payloads[1]?.expectedVersion, 3, 'stale form cannot adopt refreshed version without explicit comparison');
  } finally {h.dispose();}
});

test('network failure retains the open input and original comparison version', async () => {
  const h = fixture();
  try {
    h.fields.set('title', 'Unsent after outage');
    h.setReply({ok: false, status: 503, body: {error: 'Service unavailable'}});
    await h.submit();
    assert.equal(h.fields.get('title'), 'Unsent after outage');
    assert.equal(h.payloads[0].expectedVersion, 2);
    assert.equal(h.refreshes.length, 0);
  } finally {h.dispose();}
});

test('recovered older draft keeps its original version while newer saved props are displayed for comparison', async () => {
  const h = fixture({savedDraft: {expectedCourseId: 'course:one', expectedReleaseId: 'release:one', expectedVersion: '1',
    title: 'Recovered unsent release', outcomes: 'Identify structures\nCompare views'}});
  try {
    h.props.release = {...h.props.release, version: 3, title: 'Current saved release'};
    h.render();
    assert.equal(h.fields.get('title'), 'Recovered unsent release');
    assert.equal(h.fields.get('expectedVersion'), '1');
    assert(h.find(node => node.props['aria-label'] === 'Compare saved release draft'));
    await h.submit();
    assert.equal(h.payloads[0].expectedVersion, 1);
  } finally {h.dispose();}
});

for (const [name, saved] of [
  ['scoped old-shape draft without version', {title: 'Legacy unsent release', outcomes: 'Identify structures\nCompare views'}],
  ['malformed version', {expectedCourseId: 'course:one', expectedReleaseId: 'release:one', expectedVersion: '3x', title: 'Malformed version draft'}],
  ['different course identity', {expectedCourseId: 'course:other', expectedReleaseId: 'release:one', expectedVersion: '2', title: 'Other course draft'}],
  ['different release identity', {expectedCourseId: 'course:one', expectedReleaseId: 'release:other', expectedVersion: '2', title: 'Other release draft'}],
]) test(`${name} cannot save until a valid same-identity comparison`, async () => {
  const h = fixture({savedDraft: saved});
  try {
    await h.submit();
    assert.equal(h.payloads.length, 0);
    assert.equal(h.fields.get('title'), saved.title);
    assert(h.find(node => node.props['aria-label'] === 'Compare saved release draft'));
  } finally {h.dispose();}
});

test('comparison requires confirmation, retains unsent text, then binds the selected saved version', async () => {
  const h = fixture({savedDraft: {expectedCourseId: 'course:one', expectedReleaseId: 'release:one', expectedVersion: '1',
    title: 'My unsent title', outcomes: 'Identify structures\nCompare views'}});
  try {
    h.props.release = {...h.props.release, version: 3, title: 'Saved by colleague'};
    h.render();
    const comparison = h.find(node => node.props['aria-label'] === 'Compare saved release draft');
    const summary = h.text(comparison);
    for (const required of ['Saved by colleague', 'original-release', 'Original saved description', 'Intermediate',
      'Identify structures', 'Workbook one', 'School', 'private', 'invitation', 'GBP', 'Open', 'draft']) assert(summary.includes(required), required);
    const rebase = h.find(node => node.type === 'button' && node.props.children === 'Keep my edits using this saved version');
    assert(rebase);
    rebase.props.onClick(); h.render();
    assert.equal(h.confirmCalls, 1);
    assert.equal(h.fields.get('expectedVersion'), '1');
    h.setConfirm(true);
    h.find(node => node.type === 'button' && node.props.children === 'Keep my edits using this saved version').props.onClick();
    h.render();
    assert.equal(h.fields.get('title'), 'My unsent title');
    assert.equal(h.fields.get('expectedVersion'), '3');
    await h.submit();
    assert.equal(h.payloads[0].expectedVersion, 3);
    assert.equal(h.payloads[0].title, 'My unsent title');
  } finally {h.dispose();}
});

test('a noneditable saved release offers no rebase and sends no save mutation', async () => {
  const h = fixture();
  try {
    h.props.release = {...h.props.release, version: 3, status: 'in-review'};
    h.render();
    assert(h.find(node => node.props['aria-label'] === 'Compare saved release draft'));
    assert.equal(h.find(node => node.type === 'button' && node.props.children === 'Keep my edits using this saved version'), null);
    await h.submit();
    assert.equal(h.payloads.length, 0);
  } finally {h.dispose();}
});

test('recovery binds its old version before the delayed notice fires', async () => {
  const h = fixture({delayTimers: true, savedDraft: {expectedCourseId: 'course:one', expectedReleaseId: 'release:one',
    expectedVersion: '1', title: 'Recovered before notice', outcomes: 'Identify structures\nCompare views'}});
  try {
    assert.equal(h.fields.get('expectedVersion'), '1');
    await h.submit();
    assert.equal(h.payloads[0].expectedVersion, 1);
    h.runTimers();
  } finally {h.dispose();}
});

test('a locally accepted version cannot rebase down to still stale server props', async () => {
  const h = fixture();
  try {
    await h.submit();
    h.render();
    assert.equal(h.fields.get('expectedVersion'), '3');
    assert.equal(h.find(node => node.type === 'button' && node.props.children === 'Keep my edits using this saved version'), null);
    await h.submit();
    assert.deepEqual(h.payloads.map(item => item.expectedVersion), [2, 3]);
  } finally {h.dispose();}
});

test('scoped old-shape new-release draft requires explicit confirmation of the new private context', async () => {
  const h = fixture({newRelease: true, savedDraft: {title: 'Legacy new release', outcomes: 'Identify structures\nCompare views'}});
  try {
    await h.submit();
    assert.equal(h.payloads.length, 0);
    const rebase = h.find(node => node.type === 'button' && node.props.children === 'Keep my edits using this saved version');
    assert(rebase);
    h.setConfirm(true); rebase.props.onClick(); h.render();
    assert.equal(h.fields.get('expectedVersion'), 'new');
    assert.equal(h.fields.get('title'), 'Legacy new release');
    await h.submit();
    assert.equal(h.payloads.length, 1);
    assert.equal(h.payloads[0].releaseId, undefined);
    assert.equal(h.payloads[0].expectedVersion, undefined);
    assert.equal(h.fields.get('expectedReleaseId'), 'release:one');
    assert.equal(h.fields.get('expectedVersion'), '1');
  } finally {h.dispose();}
});
