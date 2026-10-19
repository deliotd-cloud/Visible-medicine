import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import React from 'react';
import ts from 'typescript';

const require = createRequire(import.meta.url);
type Node = { type: unknown; props: Record<string, any> };

function harness() {
  const code = ts.transpileModule(readFileSync(new URL('../components/StudioForms.tsx', import.meta.url), 'utf8'), { compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const outerSlots: any[] = [], actionSlots: any[] = [];
  let slots = outerSlots, cursor = 0;
  const outerEffects = new Map<number,{deps:unknown[];cleanup?:()=>void}>(),actionEffects = new Map<number,{deps:unknown[];cleanup?:()=>void}>();
  let pendingOuter: Array<() => void> = [],pendingAction: Array<() => void> = [];
  const same=(a:unknown[]|undefined,b:unknown[])=>!!a&&a.length===b.length&&a.every((value,index)=>Object.is(value,b[index]));
  const effect=(create:()=>void|(()=>void),deps:unknown[]=[])=>{const index=cursor++,map=slots===outerSlots?outerEffects:actionEffects,pending=slots===outerSlots?pendingOuter:pendingAction,old=map.get(index);if(!same(old?.deps,deps))pending.push(()=>{old?.cleanup?.();const cleanup=create();map.set(index,{deps,cleanup:typeof cleanup==='function'?cleanup:undefined});});};
  const hooks = {
    ...React,
    useEffect:effect,useLayoutEffect:effect,
    useState(initial: unknown) { const bucket = slots, index = cursor++; if (!(index in bucket)) bucket[index] = typeof initial === 'function' ? initial() : initial; return [bucket[index], (next: any) => { bucket[index] = typeof next === 'function' ? next(bucket[index]) : next; }]; },
    useRef(initial: unknown) { const index = cursor++; if (!(index in slots)) slots[index] = { current: initial }; return slots[index]; },
  };
  const module = { exports: {} as { ReleaseDraftForm: (props: any) => Node } };
  new Function('require', 'module', 'exports', code)((name: string) => name === 'react' ? hooks : name === 'next/navigation' ? { useRouter: () => ({ refresh() {} }) } : name === '@/lib/studio-templates' ? { STUDIO_COURSE_TEMPLATES: [] } : require(name), module, module.exports);
  const scope={actorId:'edu:synthetic-author',organizationId:'org:synthetic'},draftKey=`visible-medicine-studio-draft:${JSON.stringify(['v1',scope.actorId,scope.organizationId,'release:release:1'])}`;
  const originalGlobals=new Map<string,PropertyDescriptor|undefined>(),stored=new Map<string,string>();
  const browser={document:{visibilityState:'visible',location:{href:'https://synthetic.invalid/studio'},addEventListener(){},removeEventListener(){}},navigator:{locks:{request:async(_key:string,action:()=>unknown)=>action()}},localStorage:{getItem:(key:string)=>stored.get(key)??null,setItem:(key:string,value:string)=>{stored.set(key,value);},removeItem:(key:string)=>{stored.delete(key);}},window:{addEventListener(){},removeEventListener(){},setTimeout(){return 1;},clearTimeout(){},requestAnimationFrame(){return 1;},cancelAnimationFrame(){}}};
  for(const [name,value]of Object.entries(browser)){originalGlobals.set(name,Object.getOwnPropertyDescriptor(globalThis,name));Object.defineProperty(globalThis,name,{value,writable:true,configurable:true});}
  const render = () => { slots = outerSlots; cursor = 0; pendingOuter=[]; return module.exports.ReleaseDraftForm({ course: { id: 'course:1', title: 'Course', description: 'A valid course description.' }, workbooks: [], release: { id: 'release:1', version: 3, status: 'draft', workbookIds: [], outcomes: [] },recoveryScope:scope }); };
  const renderAction = (outer: Node) => { slots = actionSlots; cursor = 0; pendingAction=[];const tree=(outer.type as (props: any) => Node)(outer.props);tree.props.ref.current={elements:[],querySelectorAll:()=>[]};for(const run of pendingAction)run();return tree; };
  const ready=async(outer:Node)=>{renderAction(outer);for(let i=0;i<10;i++)await Promise.resolve();return renderAction(outer);};
  function nodes(value: any, predicate: (node: Node) => boolean): Node[] { if (Array.isArray(value)) return value.flatMap((item) => nodes(item, predicate)); if (!value?.props) return []; return [...(predicate(value) ? [value] : []), ...nodes(value.props.children, predicate)]; }
  const actionDraft = () => {
    const matches = actionSlots.filter(slot => slot?.current?.key === JSON.stringify(['v1',scope.actorId,scope.organizationId,'release:release:1']) && slot.current.values instanceof Map);
    assert.equal(matches.length, 1, 'exactly one ActionForm draft snapshot is bound to this release');
    return matches[0].current as { key: string; values: Map<string, string> };
  };
  const flushEffects=()=>{for(const run of pendingOuter)run();pendingOuter=[];};
  const dispose=()=>{for(const entry of [...outerEffects.values(),...actionEffects.values()])entry.cleanup?.();for(const [name,descriptor]of originalGlobals){if(descriptor)Object.defineProperty(globalThis,name,descriptor);else delete (globalThis as any)[name];}};
  return { render, renderAction,ready,nodes,flushEffects,actionDraft,draftKey,dispose };
}

test('one or duplicate learning outcomes fail through ActionForm, focus the field, and preserve the local draft', async () => {
  const h = harness();
  const originalFetch = globalThis.fetch, OriginalFormData = globalThis.FormData;
  const originalWindow = (globalThis as any).window;
  const frames = new Map<number, () => void>(); let nextFrame = 0;
  (globalThis as any).window = { requestAnimationFrame(callback: () => void) { const id = ++nextFrame; frames.set(id, callback); return id; }, cancelAnimationFrame(id: number) { frames.delete(id); },addEventListener(){},removeEventListener(){},setTimeout(){return 1;},clearTimeout(){} };
  let posts = 0, focused = 0;
  globalThis.fetch = (async (_url,options) => { if(options?.method==='GET')return Response.json({ok:true,action:'verify-studio-mutation-context'});posts++; throw new Error('Unexpected POST'); }) as typeof fetch;
  try {
    for (const invalid of ['  One outcome  ', ' Same outcome \n Same outcome \n  ', ' Same outcome \n Same outcome \n  ', `${'x'.repeat(180)}first\n${'x'.repeat(180)}second`]) {
      const outer = h.render();
      assert.equal(outer.props.draftKey, 'release:release:1');
      const textarea = h.nodes(outer, (node) => node.type === 'textarea' && node.props.name === 'outcomes')[0];
      let disabledChecks = 0;
      textarea.props.ref.current = { matches: () => disabledChecks++ === 0, focus: () => { focused++; } };
      const draft = '{"outcomes":"Unsent device-local wording"}';
      const form = new OriginalFormData(); form.set('outcomes', invalid);
      form.set('expectedCourseId','course:1');form.set('expectedReleaseId','release:1');form.set('expectedVersion','3');
      globalThis.FormData = class { constructor() { return form; } } as typeof FormData;
      const action = await h.ready(outer);
      const draftKey = h.draftKey;
      h.actionDraft().values.set(draftKey, draft);
      await action.props.onSubmit({ preventDefault() {}, currentTarget: {} });
      assert.equal(posts, 0);
      assert.equal(h.actionDraft().values.get(draftKey), draft, 'validation failure leaves draft bytes alone');
      const rerendered = h.render();
      const invalidField = h.nodes(rerendered, (node) => node.type === 'textarea' && node.props.name === 'outcomes')[0];
      assert.equal(invalidField.props['aria-invalid'], true);
      assert.match(invalidField.props['aria-describedby'], /release-outcomes-error/);
      assert.equal(h.nodes(rerendered, (node) => node.props.role === 'alert' && node.props.id === 'release-outcomes-error').length, 1);
      assert.equal(h.nodes(h.renderAction(rerendered), (node) => node.props.role === 'alert').length >= 1, true);
      const focusBefore = focused;
      h.flushEffects();
      let frame = frames.get(nextFrame); assert(frame); frames.delete(nextFrame); frame();
      assert.equal(focused, focusBefore, 'disabled field does not take focus');
      frame = frames.get(nextFrame); assert(frame); frames.delete(nextFrame); frame();
      assert.equal(focused, focusBefore + 1);
    }
    assert.equal(focused, 4);
  } finally { globalThis.fetch = originalFetch; globalThis.FormData = OriginalFormData; (globalThis as any).window = originalWindow;h.dispose(); }
});

test('correcting to two distinct outcomes clears the field error and sends normalized outcomes once', async () => {
  const h = harness();
  const originalFetch = globalThis.fetch, originalWindow = (globalThis as any).window;
  (globalThis as any).window = { requestAnimationFrame: () => 1, cancelAnimationFrame() {},addEventListener(){},removeEventListener(){},setTimeout(){return 1;},clearTimeout(){} };
  const payloads: any[] = [];
  globalThis.fetch = (async (_url, options) => { if(options?.method==='GET')return Response.json({ok:true,action:'verify-studio-mutation-context'});payloads.push(JSON.parse(String(options?.body))); return { ok: true, json: async () => ({ok:true,action:'save-release',releaseId:'release:1'}) } as Response; }) as typeof fetch;
  try {
    let outer = h.render();
    const invalid = new FormData(); invalid.set('outcomes', '  Only one  \n  ');
    invalid.set('expectedCourseId','course:1');invalid.set('expectedReleaseId','release:1');invalid.set('expectedVersion','3');
    await assert.rejects(outer.props.onSubmit(invalid), /at least two distinct/);
    assert.equal(payloads.length, 0);
    outer = h.render();
    assert.equal(h.nodes(outer, (node) => node.type === 'textarea' && node.props.name === 'outcomes')[0].props['aria-invalid'], true);
    const field = h.nodes(outer, (node) => node.type === 'textarea' && node.props.name === 'outcomes')[0];
    field.props.onChange();
    outer = h.render();
    assert.equal(h.nodes(outer, (node) => node.type === 'textarea' && node.props.name === 'outcomes')[0].props['aria-invalid'], undefined);
    const form = new FormData(); form.set('outcomes', '  Identify the structure  \n\n  Explain its function  ');
    form.set('expectedCourseId','course:1');form.set('expectedReleaseId','release:1');form.set('expectedVersion','3');
    await outer.props.onSubmit(form,()=>true);
    assert.equal(payloads.length, 1);
    assert.deepEqual(payloads[0].outcomes, ['Identify the structure', 'Explain its function']);
    assert.equal(payloads[0].expectedVersion, 3);
  } finally { globalThis.fetch = originalFetch; (globalThis as any).window = originalWindow;h.dispose(); }
});

test('outcome overflow is rejected before POST without discarding the device draft', async () => {
  const h = harness();
  const originalFetch = globalThis.fetch;
  let posts = 0;
  globalThis.fetch = (async (_url,options) => { if(options?.method==='GET')return Response.json({ok:true,action:'verify-studio-mutation-context'});posts++; throw new Error('Unexpected POST'); }) as typeof fetch;
  try {
    const draftKey = h.draftKey;
    for (const outcomes of [
      Array.from({length: 9}, (_, index) => `Outcome ${index + 1}`).join('\n'),
      `${'x'.repeat(181)}\nSecond valid outcome`,
    ]) {
      const outer = h.render();
      const draft = JSON.stringify({outcomes});
      const form = new FormData(); form.set('outcomes', outcomes);
      form.set('expectedCourseId','course:1');form.set('expectedReleaseId','release:1');form.set('expectedVersion','3');
      await h.ready(outer);
      h.actionDraft().values.set(draftKey, draft);
      await assert.rejects(outer.props.onSubmit(form), /eight|180|limit|maximum/i);
      assert.equal(posts, 0);
      assert.equal(h.actionDraft().values.get(draftKey), draft);
      assert.equal(h.nodes(h.render(), node => node.type === 'textarea' && node.props.name === 'outcomes')[0].props['aria-invalid'], true);
    }
  } finally { h.dispose();globalThis.fetch = originalFetch; }
});
