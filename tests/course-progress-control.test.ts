import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import React from 'react';
import ts from 'typescript';

const require = createRequire(import.meta.url);
const source = readFileSync(process.env.COURSE_PROGRESS_SOURCE ?? new URL('../components/CourseProgressControl.tsx', import.meta.url), 'utf8');
const code = ts.transpileModule(source, {compilerOptions: {jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022}}).outputText;
type Element = {type: unknown; props: Record<string, any>};
const date = '2026-10-16T10:00:00.000Z';
function deferred() {let resolve!: (value: any) => void, reject!: (error: Error) => void;
  const promise = new Promise<any>((yes, no) => {resolve = yes; reject = no;}); return {promise, resolve, reject};}
function harness(slug = 'course-a') {
  const props = {courseSlug: slug};
  const oldFetch = Object.getOwnPropertyDescriptor(globalThis, 'fetch');
  const oldWindow = Object.getOwnPropertyDescriptor(globalThis, 'window');
  const slots: any[] = [], effects: Array<() => void> = [], setups: Array<() => void | (() => void)> = [], cleanups: Array<() => void> = [];
  const calls: Array<{url: string; options: RequestInit; response: ReturnType<typeof deferred>}> = [];
  let cursor = 0, mounted = true, writesAfterUnmount = 0, confirms = 0, confirmAnswer = true, scheduledRenders = 0;
  Object.defineProperty(globalThis, 'fetch', {configurable: true, value: (url: string, options: RequestInit) => {
    const response = deferred(); calls.push({url, options, response}); return response.promise;
  }});
  Object.defineProperty(globalThis, 'window', {configurable: true, value: {confirm: () => {confirms++; return confirmAnswer;}}});
  const hooks = {...React,
    useState(initial: unknown) {const index = cursor++; if (!(index in slots)) slots[index] = initial;
      return [slots[index], (value: any) => {if (!mounted) writesAfterUnmount++; else scheduledRenders++;
        slots[index] = typeof value === 'function' ? value(slots[index]) : value;}];},
    useRef(initial: unknown) {const index = cursor++; if (!(index in slots)) slots[index] = {current: initial}; return slots[index];},
    useEffect(effect: () => void | (() => void), deps?: unknown[]) {const index = cursor++;
      if (!(index in slots) || !deps || deps.some((value, position) => value !== slots[index][position])) {
        slots[index] = deps; setups[index] = effect;
        effects.push(() => {cleanups[index]?.(); cleanups[index] = effect() ?? (() => {});});
      }
    },
  };
  const mod = {exports: {} as Record<string, (input: {courseSlug: string}) => Element>};
  new Function('require', 'module', 'exports', code)((id: string) => id === 'react' ? hooks : require(id), mod, mod.exports);
  const render = () => {cursor = 0; const tree = mod.exports.CourseProgressControl(props); for (const effect of effects.splice(0)) effect(); return tree;};
  const flushScheduled = () => {assert.ok(scheduledRenders > 0, 'React must be asked to repaint'); scheduledRenders = 0; return render();};
  function all(root: any, predicate: (node: Element) => boolean): Element[] {
    if (Array.isArray(root)) return root.flatMap(item => all(item, predicate));
    if (!root?.props) return []; return [...(predicate(root) ? [root] : []), ...all(root.props.children, predicate)];
  }
  const buttons = (tree: Element) => all(tree, node => node.type === 'button');
  const notice = (tree: Element) => all(tree, node => node.props.role === 'status' || node.props.role === 'alert')[0];
  const payloads = () => calls.map(call => JSON.parse(String(call.options.body)));
  const finish = (index: number, body: Record<string, unknown>, ok = true) => calls[index].response.resolve({ok, json: async () => body});
  const acknowledgement = (index: number, overrides: Record<string, unknown> = {}) => ({progress: {...payloads()[index], updatedAt: date}, completionId: payloads()[index].progress === 100 ? 'completion-1' : null, ...overrides});
  const settle = async () => {for (let i = 0; i < 10; i++) await Promise.resolve();};
  const unmount = () => {mounted = false; for (const cleanup of cleanups) cleanup?.(); cleanups.length = 0;};
  const replayEffects = () => {unmount(); mounted = true; for (let i = 0; i < setups.length; i++) if (setups[i]) cleanups[i] = setups[i]() ?? (() => {});};
  const dispose = () => {unmount(); for (const [key, old] of [['fetch', oldFetch], ['window', oldWindow]] as const)
    if (old) Object.defineProperty(globalThis, key, old); else delete (globalThis as any)[key];};
  return {props, render, flushScheduled, buttons, notice, calls, payloads, finish, acknowledgement, settle, unmount, replayEffects, dispose,
    get scheduledRenders() {return scheduledRenders;},
    get confirms() {return confirms;}, set confirmAnswer(value: boolean) {confirmAnswer = value;}, get writesAfterUnmount() {return writesAfterUnmount;}};
}

test('rapid Save course and Record completion share one synchronous flight', async () => {
  const h = harness(); try {const [save, complete] = h.buttons(h.render()); save.props.onClick(); complete.props.onClick(); save.props.onClick();
    assert.equal(h.calls.length, 1); assert.equal(h.calls[0].url, '/api/progress');
    assert.deepEqual(h.payloads(), [{resourceType: 'course', resourceSlug: 'course-a', progress: 5, lastPosition: 1}]);
    assert.deepEqual(h.buttons(h.render()).map(button => button.props.disabled), [true, true]);
    h.finish(0, h.acknowledgement(0)); await h.settle();
    assert.equal(h.notice(h.render()).props.role, 'status'); assert.match(String(h.notice(h.render()).props.children), /saved to My Learning/);
  } finally {h.dispose();}
});

test('completion requires education-only confirmation and confirmed completion id', async () => {
  const h = harness(); try {h.confirmAnswer = false; h.buttons(h.render())[1].props.onClick(); assert.equal(h.calls.length, 0);
    h.confirmAnswer = true; const complete = h.buttons(h.render())[1]; complete.props.onClick(); complete.props.onClick();
    assert.equal(h.confirms, 2); assert.equal(h.calls.length, 1);
    assert.deepEqual(h.payloads(), [{resourceType: 'course', resourceSlug: 'course-a', progress: 100, lastPosition: 999}]);
    h.finish(0, h.acknowledgement(0)); await h.settle(); const tree = h.render();
    assert.match(String(h.notice(tree).props.children), /education-only record/);
    assert.deepEqual(h.buttons(tree).map(button => button.props.disabled), [true, true]);
    h.buttons(tree)[0].props.onClick(); assert.equal(h.calls.length, 1, 'same visit must not downgrade a confirmed completion');
  } finally {h.dispose();}
});

test('saved 100 without a confirmed record never reports completion', async () => {
  const h = harness(); try {h.buttons(h.render())[1].props.onClick(); h.finish(0, h.acknowledgement(0, {completionId: null})); await h.settle();
    const tree = h.render(); assert.equal(h.notice(tree).props.role, 'status');
    assert.match(String(h.notice(tree).props.children), /completion record could not be confirmed/);
    assert.doesNotMatch(String(h.notice(tree).props.children), /completion recorded/);
    assert.deepEqual(h.buttons(tree).map(button => button.props.disabled), [true, true]);
  } finally {h.dispose();}
});

for (const [name, mutate] of [
  ['missing body', () => ({})],
  ['wrong course', (body: any) => ({...body, progress: {...body.progress, resourceSlug: 'another-course'}})],
  ['regressing progress', (body: any) => ({...body, progress: {...body.progress, progress: 4}})],
  ['regressing position', (body: any) => ({...body, progress: {...body.progress, lastPosition: 0}})],
  ['bad timestamp', (body: any) => ({...body, progress: {...body.progress, updatedAt: 'invalid'}})],
  ['nested error', (body: any) => ({...body, progress: {...body.progress, error: 'Failed'}})],
  ['top-level error', (body: any) => ({...body, error: 'Failed'})],
  ['missing completion field', (body: any) => {const copy = {...body}; delete copy.completionId; return copy;}],
  ['foreign completion id for 5', (body: any) => ({...body, completionId: 'foreign-record'})],
  ['array progress', (body: any) => ({...body, progress: [body.progress]})],
] as const) test(`${name} fails closed and permits explicit retry`, async () => {
  const h = harness(); try {h.buttons(h.render())[0].props.onClick(); h.finish(0, mutate(h.acknowledgement(0))); await h.settle();
    const tree = h.render(); assert.equal(h.notice(tree).props.role, 'alert'); assert.match(String(h.notice(tree).props.children), /could not confirm/i);
    assert.equal(h.buttons(tree)[0].props.disabled, false); h.buttons(tree)[0].props.onClick(); assert.equal(h.calls.length, 2);
  } finally {h.dispose();}
});

for (const [name, completionId] of [
  ['missing', undefined], ['blank', ' '], ['surrounding space', ' completion-1 '],
  ['control', 'completion-1\n'], ['oversized', 'x'.repeat(201)],
] as const) test(`completion ${name} id cannot confirm a record`, async () => {
  const h = harness(); try {h.buttons(h.render())[1].props.onClick();
    h.finish(0, h.acknowledgement(0, {completionId})); await h.settle(); const tree = h.render();
    assert.equal(h.notice(tree).props.role, 'alert'); assert.match(String(h.notice(tree).props.children), /could not confirm/);
    assert.equal(h.buttons(tree)[0].props.disabled, true);
    assert.equal(h.buttons(tree)[1].props.disabled, false, 'explicit completion retry remains available');
  } finally {h.dispose();}
});

test('non-JSON response gives uncertain-save guidance without parser details', async () => {
  const h = harness(); try {h.buttons(h.render())[0].props.onClick();
    h.calls[0].response.resolve({ok: true, json: async () => {throw new SyntaxError('Unexpected token <');}}); await h.settle();
    const tree = h.render(); assert.equal(h.notice(tree).props.role, 'alert');
    assert.match(String(h.notice(tree).props.children), /Check My Learning before trying again/);
    assert.doesNotMatch(String(h.notice(tree).props.children), /Unexpected token/);
    h.buttons(tree)[0].props.onClick();
    h.calls[1].response.resolve({ok: false, json: async () => {throw new SyntaxError('Invalid JSON');}}); await h.settle();
    assert.equal(h.notice(h.render()).props.role, 'alert');
    assert.doesNotMatch(String(h.notice(h.render()).props.children), /Invalid JSON/);
  } finally {h.dispose();}
});

test('HTTP and network failures are alerts with no automatic retry', async () => {
  const h = harness(); try {h.buttons(h.render())[0].props.onClick(); h.finish(0, {error: 'Not available'}, false); await h.settle();
    assert.equal(h.notice(h.render()).props.role, 'alert'); assert.equal(h.calls.length, 1);
    h.buttons(h.render())[0].props.onClick(); h.calls[1].response.reject(new Error('Offline')); await h.settle();
    assert.equal(h.notice(h.render()).props.role, 'alert'); assert.equal(h.calls.length, 2);
  } finally {h.dispose();}
});

test('old A response cannot report success after A to B to A', async () => {
  const h = harness(); try {h.buttons(h.render())[0].props.onClick(); h.props.courseSlug = 'course-b'; h.render(); h.props.courseSlug = 'course-a'; h.render();
    h.finish(0, h.acknowledgement(0)); await h.settle(); assert.equal(h.notice(h.render()), undefined);
    h.buttons(h.render())[0].props.onClick(); assert.equal(h.calls.length, 2);
    h.finish(1, h.acknowledgement(1)); await h.settle(); assert.equal(h.notice(h.render()).props.role, 'status');
  } finally {h.dispose();}
});

for (const outcome of ['success', 'error', 'network'] as const) test(`old ${outcome} finally cannot unlock a newer course request`, async () => {
  const h = harness(); try {h.buttons(h.render())[0].props.onClick(); h.props.courseSlug = 'course-b'; h.buttons(h.render())[0].props.onClick();
    if (outcome === 'network') h.calls[0].response.reject(new Error('Old failure'));
    else h.finish(0, outcome === 'success' ? h.acknowledgement(0) : {error: 'Old error'}, outcome === 'success');
    await h.settle(); assert.deepEqual(h.buttons(h.render()).map(button => button.props.disabled), [true, true]);
    h.buttons(h.render())[0].props.onClick(); assert.equal(h.calls.length, 2);
    h.finish(1, h.acknowledgement(1)); await h.settle(); assert.equal(h.notice(h.render()).props.role, 'status');
  } finally {h.dispose();}
});

test('initial effect replay repaints stale handlers and permits fresh activation', async () => {
  const h = harness(); try {const oldClick = h.buttons(h.render())[0].props.onClick; h.replayEffects();
    oldClick(); assert.equal(h.calls.length, 0); assert.ok(h.scheduledRenders > 0);
    const repaired = h.flushScheduled(); h.buttons(repaired)[0].props.onClick(); assert.equal(h.calls.length, 1);
    h.finish(0, h.acknowledgement(0)); await h.settle(); assert.equal(h.notice(h.render()).props.role, 'status');
  } finally {h.dispose();}
});

test('effect replay preserves the flight until its old request settles, then unlocks', async () => {
  const h = harness(); try {const oldClick = h.buttons(h.render())[0].props.onClick; oldClick(); h.replayEffects();
    oldClick(); assert.equal(h.calls.length, 1); const tree = h.flushScheduled();
    assert.deepEqual(h.buttons(tree).map(button => button.props.disabled), [true, true]);
    h.buttons(tree)[0].props.onClick(); assert.equal(h.calls.length, 1);
    h.finish(0, h.acknowledgement(0)); await h.settle(); assert.equal(h.notice(h.render()), undefined);
    const unlocked = h.flushScheduled(); assert.equal(h.buttons(unlocked)[0].props.disabled, false);
    h.buttons(unlocked)[0].props.onClick(); assert.equal(h.calls.length, 2);
    h.unmount(); const writes = h.writesAfterUnmount; h.finish(1, h.acknowledgement(1)); await h.settle();
    assert.equal(h.writesAfterUnmount, writes);
  } finally {h.dispose();}
});

test('confirmed completion lock survives effect replay', async () => {
  const h = harness(); try {h.buttons(h.render())[1].props.onClick(); h.finish(0, h.acknowledgement(0)); await h.settle();
    h.replayEffects(); const tree = h.flushScheduled();
    assert.deepEqual(h.buttons(tree).map(button => button.props.disabled), [true, true]);
    h.buttons(tree)[0].props.onClick(); assert.equal(h.calls.length, 1);
  } finally {h.dispose();}
});

for(const percent of [25,99,100])test(`a bookmark preserves existing${percent}% without inferring a completion record`,async()=>{
  const h=harness();try{
    h.buttons(h.render())[0].props.onClick();const body=h.acknowledgement(0);body.progress.progress=percent;body.progress.lastPosition=999;
    h.finish(0,body);await h.settle();const tree=h.render();assert.equal(h.notice(tree).props.role,'status');
    assert.match(String(h.notice(tree).props.children),new RegExp(`existing ${percent}% progress was preserved`));assert.doesNotMatch(String(h.notice(tree).props.children),/completion recorded/);
    assert.equal(h.buttons(tree)[0].props.disabled,percent===100);assert.equal(h.buttons(tree)[1].props.disabled,false,'a bookmark is not an explicit completion attestation');
    assert.equal(h.payloads()[0].progress,5);assert.equal(body.completionId,null);
  }finally{h.dispose();}
});

test('merged acknowledgements still reject invalid numeric ranges and unsafe positions',async()=>{
  for(const value of [{progress:101},{progress:5.5},{progress:'100'},{progress:NaN},{progress:Infinity},{lastPosition:1.5},{lastPosition:'999'},{lastPosition:Number.MAX_SAFE_INTEGER+1}]){
    const h=harness();try{h.buttons(h.render())[0].props.onClick();const body=h.acknowledgement(0);Object.assign(body.progress,value);h.finish(0,body);await h.settle();assert.equal(h.notice(h.render()).props.role,'alert');assert.equal(h.calls.length,1);}finally{h.dispose();}
  }
});

test('preserved100 bookmark still permits a human-confirmed completion record without another lower save',async()=>{
 const h=harness();try{
  const oldSave=h.buttons(h.render())[0].props.onClick;oldSave();const body=h.acknowledgement(0);body.progress.progress=100;body.progress.lastPosition=999;h.finish(0,body);await h.settle();
  const tree=h.render();assert.equal(h.buttons(tree)[0].props.disabled,true);oldSave();assert.equal(h.calls.length,1);assert.equal(h.confirms,0);
  h.buttons(tree)[1].props.onClick();assert.equal(h.confirms,1);assert.equal(h.calls.length,2);assert.equal(h.payloads()[1].progress,100);
  h.finish(1,h.acknowledgement(1));await h.settle();assert.match(String(h.notice(h.render()).props.children),/education-only record/);
 }finally{h.dispose();}
});

for(const outcome of ['network','http','json','malformed'] as const)test(`uncertain completion ${outcome} cannot be followed by a lower save, but permits explicit completion retry`,async()=>{
  const h=harness();try{
    const oldSave=h.buttons(h.render())[0].props.onClick;h.buttons(h.render())[1].props.onClick();
    if(outcome==='network')h.calls[0].response.reject(Error('Offline'));
    else if(outcome==='http')h.finish(0,{error:'Service unavailable'},false);
    else if(outcome==='json')h.calls[0].response.resolve({ok:true,json:async()=>{throw Error('PRIVATE_PARSE_DETAIL');}});
    else h.finish(0,{});
    await h.settle();let tree=h.render();assert.equal(h.notice(tree).props.role,'alert');
    assert.equal(h.buttons(tree)[0].props.disabled,true);oldSave();h.buttons(tree)[0].props.onClick();assert.equal(h.calls.length,1);
    h.replayEffects();tree=h.flushScheduled();assert.equal(h.buttons(tree)[0].props.disabled,true);assert.equal(h.buttons(tree)[1].props.disabled,false);
    const retry=h.buttons(tree)[1].props.onClick;retry();retry();assert.equal(h.calls.length,2);assert.equal(h.payloads()[1].progress,100);
    h.finish(1,h.acknowledgement(1));await h.settle();assert.match(String(h.notice(h.render()).props.children),/completion recorded/);
  }finally{h.dispose();}
});
