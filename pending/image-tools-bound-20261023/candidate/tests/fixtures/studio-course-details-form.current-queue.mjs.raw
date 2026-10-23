import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import {stableMutationContext} from './studio-mutation-context-fixture.mjs';

const require = createRequire(import.meta.url);
const ts = require('typescript');
const course = {id: 'course/1', title: 'Original title', description: 'Original course description for learners.'};
const recoveryScope = {actorId: 'edu:synthetic-author', organizationId: 'org:synthetic'};
const detailsStorageKey = `visible-medicine-studio-draft:${JSON.stringify(['v1', recoveryScope.actorId, recoveryScope.organizationId, `course-details:${course.id}`])}`;

function compile(path, mocks) {
  const source = readFileSync(new URL('../' + path, import.meta.url), 'utf8');
  const code = ts.transpileModule(source, {compilerOptions: {
    jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022,
  }}).outputText;
  const module = {exports: {}};
  new Function('require', 'module', 'exports', code)(name => name === '../lib/studio-mutation-context.ts' ? stableMutationContext : mocks[name] ?? require(name), module, module.exports);
  return module.exports;
}

function walk(node, predicate) {
  if (Array.isArray(node)) {for (const child of node) {const found = walk(child, predicate); if (found) return found;} return null;}
  if (!node?.props) return null;
  if (predicate(node)) return node;
  return walk(node.props.children, predicate);
}

test('both authenticated course pages pass the server actor and Studio organization to persisted form roots', async () => {
  const identity = {userId:'synthetic-user',email:'synthetic@example.invalid',displayName:'Synthetic'};
  const snapshot = {organization:{id:'org:synthetic'},courses:[course],workbooks:[],releases:[]};
  const received=[];
  const create='CreateCourseForm', template='CreateCourseFromTemplateForm', editor='StudioCourseEditor';
  const shared={
    'next/link':'a',
    '@/components/StudioShell':{StudioShell:'StudioShell'},
    '@/lib/education-platform':{getStudioSnapshot:async auth=>{received.push(auth);return snapshot;}},
  };
  const list=compile('app/studio/courses/page.tsx',{
    ...shared,
    '../../chatgpt-auth':{requireChatGPTUser:async()=>identity},
    '@/components/StudioForms':{CreateCourseForm:create,CreateCourseFromTemplateForm:template},
  });
  const listTree=await list.default({searchParams:Promise.resolve({new:'1'})});
  for(const type of [create,template]){
    const form=walk(listTree,node=>node.type===type);
    assert.deepEqual(form.props.recoveryScope,{actorId:'edu:synthetic-user',organizationId:'org:synthetic'});
  }
  const detail=compile('app/studio/courses/[courseId]/page.tsx',{
    ...shared,
    'next/navigation':{notFound:()=>{throw Error('unexpected notFound');}},
    '../../../chatgpt-auth':{requireChatGPTUser:async()=>identity},
    '@/components/StudioCourseEditor':{StudioCourseEditor:editor},
  });
  const detailTree=await detail.default({params:Promise.resolve({courseId:course.id})});
  assert.deepEqual(walk(detailTree,node=>node.type===editor).props.recoveryScope,{actorId:'edu:synthetic-user',organizationId:'org:synthetic'});
  assert.equal(received.length,2);
  for(const auth of received)assert.equal(auth.userId,'edu:synthetic-user');
});

function fixture() {
  const React = require('react');
  const requests = [], routes = []; let refreshes = 0;
  const oldFetch = globalThis.fetch;
  const oldWindow = Object.getOwnPropertyDescriptor(globalThis, 'window');
  const historyWrites = [];
  const location = new URL(`http://localhost/studio/courses/${encodeURIComponent(course.id)}?keep=1&pane=review#outline`);
  Object.defineProperty(globalThis, 'window', {configurable:true, writable:true, value:{
    location, history:{state:{existing:'retained'}, pushState(state, _title, url) {
      historyWrites.push({state,url}); location.href = new URL(url, location.href).href;
    }},
  }});
  globalThis.fetch = async (url, options) => {
    const request = {url, options, payload: JSON.parse(options.body), ok: true, body: {ok:true, action:'update-course', courseId: course.id}};
    requests.push(request);
    return {get ok() {return request.ok;}, json: async () => request.body};
  };
  const forms = compile('components/StudioForms.tsx', {
    react: React,
    'next/navigation': {useRouter: () => ({push: path => routes.push(path), refresh: () => refreshes++})},
    '@/lib/studio-templates': {STUDIO_COURSE_TEMPLATES: []},
  });
  const editorSlots = []; let editorCursor = 0;
  const editorReact = {
    ...React,
    useRef(initial) { const slot = editorCursor++; return editorSlots[slot] ??= {current: initial}; },
    useState(initial) {
      const slot = editorCursor++;
      if (!(slot in editorSlots)) editorSlots[slot] = typeof initial === 'function' ? initial() : initial;
      return [editorSlots[slot], value => {editorSlots[slot] = typeof value === 'function' ? value(editorSlots[slot]) : value;}];
    },
    useEffect: () => {},
  };
  const editor = compile('components/StudioCourseEditor.tsx', {
    react: editorReact,
    'next/link': ({children, ...props}) => ({type: 'a', props: {...props, children}}),
    'next/navigation': {useSearchParams: () => new URLSearchParams('?pane=review')},
    './StudioForms': forms,
  });
  return {forms, editor, requests, routes, historyWrites, renderEditor() {editorCursor = 0; return editor.StudioCourseEditor({course, workbooks: [], releases: [], recoveryScope});}, get refreshes() {return refreshes;}, dispose() {globalThis.fetch = oldFetch;if(oldWindow)Object.defineProperty(globalThis,'window',oldWindow);else delete globalThis.window;}};
}

function editForm(h, onDraftRecoveryChange) {
  // Invoke the wrapper with React's real hooks through a server render to inspect
  // native fields, then exercise the same submit closure in a lightweight hook host.
  const originalReact = require('react');
  const expectedTitle = {value: course.title}, expectedDescription = {value: course.description};
  const refs = [expectedTitle, expectedDescription]; let ref = 0;
  const forms = compile('components/StudioForms.tsx', {
    react: {...originalReact, useRef: () => ({current: refs[ref++]}), useState: value => [typeof value === 'function' ? value() : value, () => {}], useEffect: () => {}},
    'next/navigation': {useRouter: () => ({refresh: () => h.refreshCount++, push: () => {throw Error('save must stay on page');}})},
    '@/lib/studio-templates': {STUDIO_COURSE_TEMPLATES: []},
  });
  const action = forms.EditCourseDetailsForm({course, recoveryScope, onDraftRecoveryChange});
  return {action, expectedTitle, expectedDescription};
}

test('course options expose a bounded details form in Content and preserve the duplicate option and unrelated URL state', () => {
  const h = fixture();
  try {
    const tree = h.renderEditor();
    const details = walk(tree, node => node.type === 'details' && node.props.className === 'course-options');
    assert.ok(details);
    const toggle = walk(details, node => node.type === 'button' && node.props.children === 'Edit course details');
    assert.equal(toggle.props['aria-controls'], 'course-details-editor');
    assert.equal(toggle.props['aria-expanded'], false);
    assert.ok(walk(details, node => node.type === h.forms.DuplicateCourseButton));
    const panel = walk(tree, node => node.props.id === 'course-details-editor');
    assert.equal(panel.props.hidden, true);
    assert.ok(walk(panel, node => node.type === h.forms.EditCourseDetailsForm));
    assert.equal(walk(tree, node => node.props.role === 'tab' && node.props['aria-controls'] === 'course-review').props['aria-selected'], true);
    assert.equal(walk(tree, node => node.props.id === 'course-content').props.hidden, true);
    toggle.props.onClick({currentTarget:{closest:()=>({open:true,querySelector:()=>({focus(){}})})}});
    const opened = h.renderEditor();
    assert.equal(walk(opened, node => node.props.id === 'course-details-editor').props.hidden, false);
    assert.equal(walk(opened, node => node.props.role === 'tab' && node.props['aria-controls'] === 'course-content').props['aria-selected'], true);
    assert.equal(walk(opened, node => node.props.id === 'course-review').props.hidden, true);
    assert.deepEqual(h.historyWrites, [{state:{existing:'retained',__vinext_externalHistoryState:true},url:`/studio/courses/${encodeURIComponent(course.id)}?keep=1&pane=content#outline`}]);
    walk(opened, node => node.props['aria-controls'] === 'course-details-editor').props.onClick({currentTarget:{closest:()=>({open:true,querySelector:()=>({focus(){}})})}});
    assert.equal(walk(h.renderEditor(), node => node.props.id === 'course-details-editor').props.hidden, true);
    assert.equal(h.historyWrites.length, 1, 'Hiding details does not create another pane entry');
  } finally {h.dispose();}
});

test('form sends exact update payload and advances comparison only after a successful save', async () => {
  const h = fixture(); h.refreshCount = 0;
  try {
    const {action, expectedTitle, expectedDescription} = editForm(h);
    const title = walk(action, node => node.props.name === 'title');
    assert.equal(title.props.minLength, 4);
    assert.equal(title.props.maxLength, 160);
    assert.equal(walk(action, node => node.props.name === 'description').props.maxLength, 1200);
    assert.equal(walk(action, node => node.type === 'p').props.children, 'Course details only; release snapshots unchanged.');
    const draft = {title: '  Revised title  ', description: '  A revised course description for learners.  ', expectedTitle: course.title, expectedDescription: course.description};
    const form = {get: key => draft[key]};
    await action.props.onSubmit(form, () => true);
    assert.equal(h.requests[0].url, '/api/studio');
    assert.equal(h.requests[0].options.method, 'POST');
    assert.deepEqual(h.requests[0].payload, {action: 'update-course', expectedStudioContext:recoveryScope,courseId: course.id, title: 'Revised title', description: 'A revised course description for learners.', expectedTitle: course.title, expectedDescription: course.description});
    assert.equal(expectedTitle.value, 'Revised title');
    assert.equal(expectedDescription.value, 'A revised course description for learners.');
    assert.equal(h.refreshCount, 1);
    draft.title = 'Second revision'; draft.description = 'Another revised course description for learners.';
    draft.expectedTitle = expectedTitle.value; draft.expectedDescription = expectedDescription.value;
    await action.props.onSubmit(form, () => true);
    assert.equal(h.requests[1].payload.expectedTitle, 'Revised title');
    assert.equal(h.requests[1].payload.expectedDescription, 'A revised course description for learners.');
    assert.equal(h.refreshCount, 2);
  } finally {h.dispose();}
});

test('course details forwards only the generic recovery callback into the actual ActionForm',()=>{
 const h=fixture();try{const report=()=>{};assert.equal(editForm(h,report).action.props.onDraftRecoveryChange,report);}finally{h.dispose();}
});

test('recovered stale baseline is submitted intact and a conflict retains values and baseline', async () => {
  const h = fixture(); h.refreshCount = 0;
  try {
    const {action, expectedTitle, expectedDescription} = editForm(h);
    const recovered = {title: 'Recovered change', description: 'Recovered description for a course edit.', expectedTitle: 'Older title', expectedDescription: 'Older description from the saved draft.'};
    // ActionForm restores each named input, including the hidden baseline, from
    // its device-local draft before invoking the wrapped save handler.
    expectedTitle.value = recovered.expectedTitle;
    expectedDescription.value = recovered.expectedDescription;
    const form = {get: key => recovered[key]};
    const oldFetch = globalThis.fetch;
    globalThis.fetch = async (url, options) => {
      const payload = JSON.parse(options.body);
      h.requests.push({url, options, payload});
      return {ok: false, status: 409, json: async () => ({error: 'Course details changed elsewhere. Reload and compare before saving.'})};
    };
    await assert.rejects(action.props.onSubmit(form, () => true), /changed elsewhere/);
    assert.equal(h.requests[0].payload.expectedTitle, 'Older title');
    assert.equal(h.requests[0].payload.expectedDescription, 'Older description from the saved draft.');
    assert.deepEqual([recovered.title, recovered.description, expectedTitle.value, expectedDescription.value],
      ['Recovered change', 'Recovered description for a course edit.', 'Older title', 'Older description from the saved draft.']);
    assert.equal(h.refreshCount, 1);
    globalThis.fetch = oldFetch;
  } finally {h.dispose();}
});

test('server prop refresh does not replace a recovered comparison baseline', () => {
  const React = require('react');
  const slots = []; let cursor = 0;
  const hooks = {
    ...React,
    useState(initial) {
      const at = cursor++;
      if (!(at in slots)) slots[at] = typeof initial === 'function' ? initial() : initial;
      return [slots[at], value => {slots[at] = typeof value === 'function' ? value(slots[at]) : value;}];
    },
    useRef(initial) {const at = cursor++; return slots[at] ??= {current: initial};},
    useEffect() {},
  };
  const forms = compile('components/StudioForms.tsx', {
    react: hooks,
    'next/navigation': {useRouter: () => ({refresh() {}})},
    '@/lib/studio-templates': {STUDIO_COURSE_TEMPLATES: []},
  });
  cursor = 0;
  const first = forms.EditCourseDetailsForm({course, recoveryScope});
  const baselineBefore = walk(first, node => node.props.name === 'expectedTitle').props.defaultValue;
  first.props.onValuesChange(null, {title: 'Recovered edit', description: 'Recovered description for the course.', expectedTitle: 'Older saved title', expectedDescription: 'Older saved description for learners.'});
  cursor = 0;
  const refreshed = forms.EditCourseDetailsForm({course: {...course, title: 'Changed in another tab'}, recoveryScope});
  assert.equal(baselineBefore, course.title);
  assert.equal(walk(refreshed, node => node.props.name === 'expectedTitle').props.defaultValue, 'Older saved title');
  assert.equal(walk(refreshed, node => node.props.name === 'expectedDescription').props.defaultValue, 'Older saved description for learners.');
  assert.equal(walk(refreshed, node => node.props.name === 'title').props.defaultValue, 'Recovered edit');
  assert.equal(walk(refreshed, node => node.props.name === 'description').props.defaultValue, 'Recovered description for the course.');
  const compare = walk(refreshed, node => node.props.role === 'group' && node.props['aria-label'] === 'Compare saved course details');
  assert.ok(compare);
  const rebasedTitle = {value: 'Older saved title'}, rebasedDescription = {value: 'Older saved description for learners.'};
  walk(refreshed, node => node.props.name === 'expectedTitle').props.ref.current = rebasedTitle;
  walk(refreshed, node => node.props.name === 'expectedDescription').props.ref.current = rebasedDescription;
  const oldWindow = globalThis.window;
  globalThis.window = {confirm: () => true};
  try {walk(compare, node => node.type === 'button').props.onClick();}
  finally {if (oldWindow) globalThis.window = oldWindow; else delete globalThis.window;}
  cursor = 0;
  const resolved = forms.EditCourseDetailsForm({course: {...course, title: 'Changed in another tab'}, recoveryScope});
  assert.equal(rebasedTitle.value, 'Changed in another tab');
  assert.equal(walk(resolved, node => node.props.name === 'expectedTitle').props.defaultValue, 'Changed in another tab');
  assert.equal(walk(resolved, node => node.props.name === 'title').props.defaultValue, 'Recovered edit');
  assert.equal(resolved.props.draftRevision, '1');
});

test('ActionForm restores the original comparison fields from a device-local draft', () => {
  const React = require('react');
  const saved = {title: 'Recovered edit', description: 'Recovered description for the course.', expectedTitle: 'Older title', expectedDescription: 'Older description from the draft.'};
  const original = Object.fromEntries(['HTMLInputElement', 'HTMLTextAreaElement', 'HTMLSelectElement', 'FormData', 'localStorage', 'window', 'document'].map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
  class Input {constructor(name, value, type = 'text') {Object.assign(this, {name, value, type});}}
  class Textarea {constructor(name, value) {Object.assign(this, {name, value});}}
  class Select {}
  Object.assign(globalThis, {
    HTMLInputElement: Input, HTMLTextAreaElement: Textarea, HTMLSelectElement: Select,
    FormData: class {constructor(form) {this.form = form;} get(key) {return this.form.elements.find(element => element.name === key)?.value ?? null;}},
    localStorage: {getItem: key => key === detailsStorageKey ? JSON.stringify(saved) : null},
    window: {setTimeout: fn => {fn(); return 1;}, clearTimeout() {}, addEventListener() {}, removeEventListener() {}},
    document: {addEventListener(){},removeEventListener(){}},
  });
  let phase = 'edit', cursor = 0; const actionRefs = [], actionStates=[], effects = [],effectRecords=new Map();let renderNeeded=false;
  const hooks = {
    ...React,
    useRef(initial) {if (phase === 'edit') return {current: null}; const at = cursor++; return actionRefs[at] ??= {current: initial};},
    useState(initial) {if(phase==='edit')return [typeof initial==='function'?initial():initial,()=>{}];const at=cursor++;if(!(at in actionStates))actionStates[at]=typeof initial==='function'?initial():initial;return[actionStates[at],value=>{const next=typeof value==='function'?value(actionStates[at]):value;if(!Object.is(next,actionStates[at])){actionStates[at]=next;renderNeeded=true;}}];},
    useEffect(effect,deps) {const at=cursor++,old=effectRecords.get(at);if(!old||!deps||deps.some((value,index)=>!Object.is(value,old.deps[index])))effects.push(()=>{old?.cleanup?.();effectRecords.set(at,{deps,cleanup:effect()});});},
    useLayoutEffect(effect,deps) {hooks.useEffect(effect,deps);},
  };
  try {
    const forms = compile('components/StudioForms.tsx', {
      react: hooks,
      'next/navigation': {useRouter: () => ({refresh() {}})},
      '@/lib/studio-templates': {STUDIO_COURSE_TEMPLATES: []},
      '../lib/studio-navigation-guard.ts': {registerStudioNavigationGuard: () => () => {}},
    });
    const action = forms.EditCourseDetailsForm({course, recoveryScope});
    phase = 'action'; cursor = 0;
    let formNode = action.type(action.props);
    const nodes = [];
    function collect(node) {
      if (Array.isArray(node)) {node.forEach(collect); return;}
      if (!node?.props) return;
      if (node.props.name) nodes.push(node);
      collect(node.props.children);
    }
    collect(action.props.children);
    const elements = nodes.map(node => {
      const {name, defaultValue = ''} = node.props;
      const element = node.type === 'textarea' ? new Textarea(name, defaultValue) : new Input(name, defaultValue, node.props.type);
      if (node.props.ref) node.props.ref.current = element;
      return element;
    });
    const form = {elements};
    formNode.props.ref.current = form;
    let passes=0;do{assert(++passes<20);renderNeeded=false;for(const effect of effects.splice(0))effect();if(renderNeeded){cursor=0;formNode=action.type(action.props);formNode.props.ref.current=form;}}while(renderNeeded||effects.length);
    assert.deepEqual(Object.fromEntries(elements.map(element => [element.name, element.value])), saved);
    assert.equal(nodes.some(node => node.props.name === 'expectedTitle' && node.props.type === 'hidden'), true);
    assert.equal(nodes.some(node => node.props.name === 'expectedDescription' && node.props.type === 'hidden'), true);
  } finally {
    for (const [key, descriptor] of Object.entries(original)) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else delete globalThis[key];
    }
  }
});
