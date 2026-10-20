import {expectedStudioContext,comparisonResponse,isComparison,installComparisonFetch} from './lecture-context-fixture.mjs';
installComparisonFetch();
/* eslint-disable @typescript-eslint/no-explicit-any */
import assert from "node:assert/strict";
import test from "node:test";
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";
import {createLectureAnatomyReference} from '../lib/lecture-anatomy-reference.ts';
import {headAtlasConceptOptions,headConceptById} from '../lib/head-atlas-links.ts';
import {headImageHref,parseHeadImageNavigation} from '../lib/head-atlas-navigation.ts';
import {parseWorkbookRetirementReceipt} from '../lib/workbook-retirement-contract.ts';
import {lectureSavePresentation} from '../components/lecture-save-presentation.ts';

const require = createRequire(import.meta.url);
const lineageBoundary={WorkbookCorrectionLineage:()=>null,createWorkbookCorrectionLineageContext:()=>({begin:()=>Symbol('synthetic-lineage'),finish(){},invalidate(){}})};

function compile(path: string, react: typeof React, mocks: Record<string, unknown> = {}, loadedStyles?: Set<string>) {
  const source = readFileSync(new URL(path, import.meta.url), "utf8");
  const code = ts.transpileModule(source, { compilerOptions: {
    jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true,
  } }).outputText;
  const compiledModule = { exports: {} as Record<string, any> };
  new Function("require", "module", "exports", code)((name: string) => {
    if (name === "react") return react;
    if (name === "./lecture-save-presentation") return {lectureSavePresentation};
    if (name.endsWith(".css")) { loadedStyles?.add(name); return {}; }
    if (name in mocks) return mocks[name];
    return require(name);
  }, compiledModule, compiledModule.exports);
  return compiledModule.exports;
}

function components(react: typeof React = React) {
  const { LecturePlayer } = compile("../components/LecturePlayer.tsx", react);
  // The sibling owns its own request and confirmation lifecycle. Keep it as an
  // inert React boundary so these tests exercise only the lecture parent.
  function WorkbookRetirement() { return react.createElement('div', {'data-retirement-boundary': true}); }
  function WorkbookCorrection() { return react.createElement('div', {'data-correction-boundary': true}); }
  const { LectureEditor } = compile("../components/LectureEditor.tsx", react, {
    "./LecturePlayer": { LecturePlayer }, "./WorkbookRetirement": { WorkbookRetirement },
    "./WorkbookCorrection": { WorkbookCorrection },
    "./WorkbookCorrectionLineage": lineageBoundary,
  });
  return { LectureEditor, LecturePlayer, WorkbookRetirement, WorkbookCorrection };
}

const slide = { id: "slide-1", title: "Aortic arch", body: "Identify the three main branches.", referenceUrl: "https://example.org/reference" };
const initial = {
  id: "lecture / 1", title: "Thoracic anatomy", version: 4, status: "draft", courseId: "course-1", courseTitle: "Core anatomy",
  slides: [slide], canEdit: true, canReview: false, canPublish: false, reviews: [], published: null,
};
const outline = [{ id: "lecture / 1", title: "Thoracic anatomy" }, { id: "case-2", title: "Chest case" }];

test('image-only anatomy can be authored and saved without inventing a 3D target',async()=>{
 const hooks=hookHarness(),{LectureEditor}=components(hooks.react),props={initial,courseOutline:outline,expectedStudioContext};
 const originalFetch=globalThis.fetch,requests:any[]=[];
 globalThis.fetch=(async(_url:unknown,request:RequestInit)=>{
  const body=JSON.parse(String(request.body));requests.push(body);
  return new Response(JSON.stringify({...initial,title:body.title,slides:body.slides,version:body.expectedVersion+1}),{status:200});
 }) as typeof fetch;
 try{
  let tree=hooks.render(LectureEditor,props);
  const picker=()=>descendants(tree).find(node=>node.type==='select'&&node.props['aria-label']==='Head Atlas structure')!;
  assert(descendants(picker()).some(node=>node.type==='option'&&node.props.value==='cerebellum-vermis'));
  picker().props.onChange({target:{value:'cerebellum-vermis'}});tree=hooks.render(LectureEditor,props);
  assert.match(textOf(tree),/Cerebellar vermis: CT · MRI/);
  assert.match(textOf(tree),/No exact 3D part is mapped/);
  descendants(tree).find(node=>node.type==='button'&&textOf(node)==='Save')!.props.onClick();
  await new Promise(resolve=>setImmediate(resolve));
  assert.deepEqual(requests[0].slides[0].anatomyReference,createLectureAnatomyReference('cerebellum-vermis'));
  assert.equal(requests[0].slides[0].anatomyReference.kind,'head-image-concept-v1');
  assert.equal(Object.hasOwn(requests[0].slides[0].anatomyReference,'atlasTarget'),false);
 }finally{globalThis.fetch=originalFetch;}
});

for(const conceptId of ['cerebellum-left-hemisphere','cerebellum-right-hemisphere','cerebellum-vermis'])test(`lecture player offers exact native links for ${conceptId}, never a fake 3D link`,()=>{
 const hooks=hookHarness(),{LecturePlayer}=components(hooks.react);
 const reference=createLectureAnatomyReference(conceptId)!;assert(reference);
 const tree=hooks.render(LecturePlayer,{title:'Lecture',slides:[{...slide,anatomyReference:reference}],version:2});
 const atlasLinks=descendants(tree).filter(node=>node.type==='a'&&String(node.props.href).startsWith('/atlas/'));
 assert.equal(atlasLinks.length,2);
 for(const modality of ['CT','MRI'] as const){
  const link=atlasLinks.find(node=>textOf(node)===modality);assert(link);
  assert.equal(link.props.href,headImageHref(modality,conceptId,null,reference.headRevision));
  assert.equal(link.props.target,'_blank');assert.equal(link.props.rel,'noopener noreferrer');
 }
 assert.match(textOf(tree),/No exact 3D part is mapped/);
 assert.match(textOf(tree),/This lecture does not unlock another product/);
 const stale=hooks.render(LecturePlayer,{title:'Lecture',slides:[{...slide,anatomyReference:{...reference,headRevision:'0'.repeat(64)}}],version:2});
 assert.match(textOf(stale),/source binding has changed/);
 assert.equal(descendants(stale).filter(node=>node.type==='a'&&String(node.props.href).startsWith('/atlas/')).length,0);
});

test('anatomy picker saves the exact optional pin and removal restores a legacy-shaped slide',async()=>{
  const hooks=hookHarness(),{LectureEditor}=components(hooks.react),props={initial,courseOutline:outline,expectedStudioContext};
  const originalFetch=globalThis.fetch,requests:any[]=[];
  globalThis.fetch=(async(_url:unknown,request:RequestInit)=>{
    const body=JSON.parse(String(request.body));requests.push(body);
    return new Response(JSON.stringify({...initial,title:body.title,slides:body.slides,version:body.expectedVersion+1}),{status:200});
  }) as typeof fetch;
  try{
    let tree=hooks.render(LectureEditor,props);
    const picker=()=>descendants(tree).find(node=>node.type==='select'&&node.props['aria-label']==='Head Atlas structure')!;
    assert.equal(picker().props.value,'');
    picker().props.onChange({target:{value:'brainstem-pons'}});tree=hooks.render(LectureEditor,props);
    assert.equal(picker().props.value,'brainstem-pons');
    const save=()=>descendants(tree).find(node=>node.type==='button'&&textOf(node)==='Save')!;
    save().props.onClick();await new Promise(resolve=>setImmediate(resolve));tree=hooks.render(LectureEditor,props);
    assert.deepEqual(requests[0].slides[0].anatomyReference,createLectureAnatomyReference('brainstem-pons'));
    assert.equal(requests[0].expectedVersion,4);
    picker().props.onChange({target:{value:''}});tree=hooks.render(LectureEditor,props);
    save().props.onClick();await new Promise(resolve=>setImmediate(resolve));tree=hooks.render(LectureEditor,props);
    assert.deepEqual(requests[1].slides,[slide]);assert.equal(requests[1].expectedVersion,5);
  }finally{globalThis.fetch=originalFetch;}
});

test('stale lecture anatomy is explicit and blocks review while published player does not substitute links',()=>{
  const current=createLectureAnatomyReference('brainstem-pons')!;
  const stale={...current,headRevision:'a'.repeat(64)};
  const hooks=hookHarness(),{LectureEditor,LecturePlayer}=components(hooks.react);
  const props={initial:{...initial,slides:[{...slide,anatomyReference:stale}]},courseOutline:outline,expectedStudioContext};
  let tree=hooks.render(LectureEditor,props);
  const picker=descendants(tree).find(node=>node.type==='select')!;
  assert.equal(picker.props.value,'unavailable');
  descendants(tree).find(node=>node.type==='button'&&textOf(node)==='Review')!.props.onClick();tree=hooks.render(LectureEditor,props);
  assert.equal(descendants(tree).find(node=>node.type==='button'&&textOf(node)==='Request review')!.props.disabled,true);
  assert.match(textOf(tree),/Reselect or remove outdated anatomy/);
  const playerHooks=hookHarness(),Player=components(playerHooks.react).LecturePlayer;
  const player=playerHooks.render(Player,{title:'Lecture',slides:props.initial.slides,version:2});
  assert.match(textOf(player),/source binding has changed/);
  assert.equal(descendants(player).filter(node=>node.type==='a'&&String(node.props.href).startsWith('/atlas/')).length,0);
});

test('lecture anatomy shows only mapped modalities, preserves the slide and warns about independent access',()=>{
  const cases=[['brainstem-pons',['3D Atlas','CT','MRI']],['commissure-corpus-callosum',['3D Atlas','MRI']]] as const;
  for(const [id,names] of cases){
    const hooks=hookHarness(),{LecturePlayer}=components(hooks.react);
    const tree=hooks.render(LecturePlayer,{title:'Lecture',slides:[{...slide,anatomyReference:createLectureAnatomyReference(id)}],version:2});
    const links=descendants(tree).filter(node=>node.type==='a'&&String(node.props.href).startsWith('/atlas/'));
    assert.deepEqual(links.map(textOf),[...names]);
    assert(links.every(node=>node.props.target==='_blank'&&node.props.rel==='noopener noreferrer'));
    assert.match(textOf(tree),/Atlas and imaging access are independent/);
    assert.equal(descendants(tree).find(node=>node.type==='details'&&node.props.className==='lecture-anatomy-links')!.props.open,undefined);
  }
});

type ElementNode = React.ReactElement<Record<string, any>>;
test('all lecture scan destinations retain the saved reference revision and exact concept',()=>{
  const hooks=hookHarness(),{LecturePlayer}=components(hooks.react);
  for(const {conceptId} of headAtlasConceptOptions()){
    const reference=createLectureAnatomyReference(conceptId)!;
    const original=JSON.stringify(reference),concept=headConceptById(conceptId)!;
    const tree=hooks.render(LecturePlayer,{title:'Lecture',slides:[{...slide,anatomyReference:reference}],version:2});
    const links=descendants(tree).filter(node=>node.type==='a'&&/^\/atlas\/(ct|mri)-head\?/.test(String(node.props.href)));
    assert.equal(links.length,Number(!!concept.ctHref)+Number(!!concept.mriHref));
    for(const link of links){
      const url=new URL(link.props.href,'http://example.test'),modality=url.pathname==='/atlas/ct-head'?'CT':'MRI';
      assert.equal(link.props.href,headImageHref(modality,conceptId,null,reference.headRevision));
      assert.deepEqual([...url.searchParams.keys()],['concept','headRevision']);
      assert.deepEqual(parseHeadImageNavigation(url.searchParams,reference.headRevision,modality),{conceptId,position:null,invalid:false});
    }
    assert.equal(JSON.stringify(reference),original,'display does not rewrite the saved lecture reference');
  }
});
test('anatomy correction requires an explicit confirmation and preserves the revision contract',async()=>{
  const stale={...createLectureAnatomyReference('brainstem-pons')!,headRevision:'a'.repeat(64)};
  const submitted={...initial,status:'approved',canEdit:false,canPublish:true,canReopenAnatomy:true,slides:[{...slide,anatomyReference:stale}]};
  const props={initial:submitted,courseOutline:outline,expectedStudioContext};
  const hooks=hookHarness(),{LectureEditor}=components(hooks.react);
  const oldFetch=globalThis.fetch,oldWindow=Object.getOwnPropertyDescriptor(globalThis,'window'),requests:any[]=[];
  let consent=false;
  Object.defineProperty(globalThis,'window',{configurable:true,value:{confirm:()=>consent}});
  globalThis.fetch=(async(_url:unknown,request:RequestInit)=>{
    requests.push(JSON.parse(String(request.body)));
    return new Response(JSON.stringify({...submitted,status:'draft',version:5,canEdit:true,canPublish:false,canReopenAnatomy:false}),{status:200});
  }) as typeof fetch;
  try{
    let tree=hooks.render(LectureEditor,props);
    const reopen=()=>descendants(tree).find(node=>node.type==='button'&&textOf(node)==='Reopen to update anatomy');
    assert.ok(reopen());reopen()!.props.onClick();assert.equal(requests.length,0);
    consent=true;reopen()!.props.onClick();await new Promise(resolve=>setImmediate(resolve));
    assert.deepEqual(requests,[{action:'reopen-anatomy',id:initial.id,expectedVersion:4,expectedStudioContext}]);
    tree=hooks.render(LectureEditor,props);assert.equal(reopen(),undefined);
    assert.match(textOf(tree),/request fresh independent review/);
    assert.equal(descendants(tree).find(node=>node.type==='select'&&node.props['aria-label']==='Head Atlas structure')!.props.disabled,false);
    for(const other of [{...submitted,canReopenAnatomy:false},{...submitted,status:'published'}]){
      const otherHooks=hookHarness(),Editor=components(otherHooks.react).LectureEditor;
      assert(!descendants(otherHooks.render(Editor,{initial:other,courseOutline:outline,expectedStudioContext})).some(node=>node.type==='button'&&textOf(node)==='Reopen to update anatomy'));
    }
  }finally{
    globalThis.fetch=oldFetch;
    if(oldWindow)Object.defineProperty(globalThis,'window',oldWindow);else Reflect.deleteProperty(globalThis,'window');
  }
});

function childrenOf(node: unknown): unknown[] {
  if (!React.isValidElement(node)) return [];
  return React.Children.toArray((node as ElementNode).props.children);
}
function descendants(node: unknown): ElementNode[] {
  if (!React.isValidElement(node)) return [];
  const element = node as ElementNode;
  return [element, ...childrenOf(element).flatMap(descendants)];
}
function textOf(node: unknown): string {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (!React.isValidElement(node)) return "";
  return childrenOf(node).map(textOf).join("");
}

function hookHarness() {
  const values: unknown[] = [];
  let stateIndex = 0;
  const pending: Array<()=>void> = [];
  const react = {
    ...React,
    useEffect: () => undefined,
    useLayoutEffect: (create:()=>void|(()=>void), dependencies:unknown[]) => {
      const index=stateIndex++;
      const previous=values[index] as {dependencies:unknown[];cleanup?:()=>void}|undefined;
      if(!previous||dependencies.length!==previous.dependencies.length||dependencies.some((value,position)=>!Object.is(value,previous.dependencies[position])))
        pending.push(()=>{previous?.cleanup?.();const cleanup=create();values[index]={dependencies,cleanup:typeof cleanup==='function'?cleanup:undefined};});
    },
    useMemo: (factory: () => unknown, dependencies: unknown[]) => {
      const index = stateIndex++;
      const previous = values[index] as {dependencies: unknown[]; value: unknown} | undefined;
      if (!previous || dependencies.length !== previous.dependencies.length || dependencies.some((value, position) => !Object.is(value, previous.dependencies[position])))
        values[index] = {dependencies, value: factory()};
      return (values[index] as {value: unknown}).value;
    },
    useRef: (initial: unknown) => {
      const index = stateIndex++;
      if (!(index in values)) values[index] = { current: initial };
      return values[index];
    },
    useState: (value: unknown) => {
      const index = stateIndex++;
      if (!(index in values)) values[index] = typeof value === "function" ? (value as () => unknown)() : value;
      return [values[index], (next: unknown) => { values[index] = typeof next === "function" ? (next as (current: unknown) => unknown)(values[index]) : next; }];
    },
  } as unknown as typeof React;
  return { react, render(Component: any, props: any) { stateIndex = 0; pending.length=0; const tree=Component(props) as ElementNode; for(const effect of pending)effect(); return tree; } };
}

test("lecture editor renders compact course, slide and content columns without a case dependency", () => {
  const { LectureEditor } = components();
  const html = renderToStaticMarkup(React.createElement(LectureEditor, { initial, courseOutline: outline, expectedStudioContext }));
  assert.match(html, /class="lecture-editor-grid"/);
  assert.match(html, /aria-label="Course lesson outline"/);
  assert.match(html, /aria-label="Slide outline"/);
  assert.ok(html.includes("Aortic arch"));
  assert.ok(html.includes("Advanced · source reference"));
  assert.ok(html.includes("/studio/workbooks/lecture%20%2F%201/builder"));
  assert.ok(!html.toLowerCase().includes("case required"));
});

test("standalone learner player loads its presentation styles", () => {
  const loadedStyles = new Set<string>();
  const player = compile("../components/LecturePlayer.tsx", React, {}, loadedStyles);
  assert.equal(typeof player.LecturePlayer, "function");
  assert.ok(loadedStyles.has("./lecture-editor.css"));
});

test("panel changes retain edits and saving sends the expected revision-bound payload", async () => {
  const hooks = hookHarness();
  const { LectureEditor } = components(hooks.react);
  const originalFetch = globalThis.fetch;
  const requests: Array<{ url: string; init?: RequestInit }> = [];
  globalThis.fetch = (async (url: string | URL | Request, init?: RequestInit) => {
    requests.push({ url: String(url), init });
    return new Response(JSON.stringify({ ...initial, title: "Edited lecture", version: 5 }), { status: 200, headers: { "Content-Type": "application/json" } });
  }) as typeof fetch;
  try {
    const props = { initial, courseOutline: outline, expectedStudioContext };
    let tree = hooks.render(LectureEditor, props);
    const title = descendants(tree).find((node) => node.type === "input" && node.props.value === initial.title);
    assert.ok(title); title.props.onChange({ target: { value: "Edited lecture" } });
    tree = hooks.render(LectureEditor, props);
    assert.ok(descendants(tree).some((node) => node.props.role === "status" && textOf(node) === "Unsaved changes"));
    const preview = descendants(tree).find((node) => node.type === "button" && textOf(node) === "Preview");
    assert.ok(preview); preview.props.onClick();
    tree = hooks.render(LectureEditor, props);
    assert.equal(tree.props["data-editor-panel"], "preview");
    const content = descendants(tree).find((node) => node.type === "button" && textOf(node) === "Content");
    assert.ok(content); content.props.onClick();
    tree = hooks.render(LectureEditor, props);
    assert.ok(descendants(tree).some((node) => node.type === "input" && node.props.value === "Edited lecture"));
    const save = descendants(tree).find((node) => node.type === "button" && textOf(node) === "Save");
    assert.ok(save); assert.equal(save.props.disabled, false); save.props.onClick();
    await new Promise((resolve) => setImmediate(resolve));
    assert.equal(requests[0].url, "/api/studio/workbooks/lecture%20%2F%201/lecture");
    assert.deepEqual(JSON.parse(String(requests[0].init?.body)), { action: "save", id: initial.id, expectedVersion: 4, expectedStudioContext, title: "Edited lecture", slides: [slide] });
    tree = hooks.render(LectureEditor, props);
    assert.ok(descendants(tree).some((node) => node.props.role === "status" && textOf(node) === "Saved version 5"));
  } finally { globalThis.fetch = originalFetch; }
});

test("saving preserves the selected second slide", async () => {
  const hooks = hookHarness();
  const { LectureEditor } = components(hooks.react);
  const second = { ...slide, id: "slide-2", title: "Descending aorta", body: "Follow the vessel inferiorly." };
  const twoSlideView = { ...initial, slides: [slide, second] };
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async () => new Response(JSON.stringify({ ...twoSlideView, title: "Edited lecture", version: 5 }), { status: 200, headers: { "Content-Type": "application/json" } })) as typeof fetch;
  try {
    const props = { initial: twoSlideView, courseOutline: outline, expectedStudioContext };
    let tree = hooks.render(LectureEditor, props);
    const secondOutline = descendants(tree).find((node) => node.type === "button" && textOf(node).includes("Descending aorta"));
    assert.ok(secondOutline); secondOutline.props.onClick();
    tree = hooks.render(LectureEditor, props);
    const lectureTitle = descendants(tree).find((node) => node.type === "input" && node.props.value === initial.title);
    assert.ok(lectureTitle); lectureTitle.props.onChange({ target: { value: "Edited lecture" } });
    tree = hooks.render(LectureEditor, props);
    const save = descendants(tree).find((node) => node.type === "button" && textOf(node) === "Save");
    assert.ok(save); save.props.onClick(); await new Promise((resolve) => setImmediate(resolve));
    tree = hooks.render(LectureEditor, props);
    assert.ok(descendants(tree).some((node) => node.type === "input" && node.props.value === "Descending aorta"));
    assert.ok(descendants(tree).some((node) => node.type === "button" && node.props["aria-current"] === "step" && textOf(node).includes("Descending aorta")));
  } finally { globalThis.fetch = originalFetch; }
});

test("a conflict preserves dirty content and exposes an explicit reload", async () => {
  const hooks = hookHarness();
  const { LectureEditor } = components(hooks.react);
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async () => new Response(JSON.stringify({ error: "Version conflict. Reload the saved lecture." }), { status: 409, headers: { "Content-Type": "application/json" } })) as typeof fetch;
  try {
    const props = { initial, courseOutline: outline, expectedStudioContext };
    let tree = hooks.render(LectureEditor, props);
    const body = descendants(tree).find((node) => node.type === "textarea" && node.props.value === slide.body);
    assert.ok(body); body.props.onChange({ target: { value: "Unsaved corrected content" } });
    tree = hooks.render(LectureEditor, props);
    const save = descendants(tree).find((node) => node.type === "button" && textOf(node) === "Save");
    assert.ok(save); save.props.onClick(); await new Promise((resolve) => setImmediate(resolve));
    tree = hooks.render(LectureEditor, props);
    assert.ok(descendants(tree).some((node) => node.type === "textarea" && node.props.value === "Unsaved corrected content"));
    assert.ok(descendants(tree).some((node) => node.props.role === "alert" && textOf(node).includes("Version conflict")));
    assert.ok(descendants(tree).some((node) => node.type === "button" && textOf(node) === "Reload saved version"));
  } finally { globalThis.fetch = originalFetch; }
});

test("incomplete slides remain draft-saveable and malformed success responses do not clear edits", async () => {
  const hooks = hookHarness();
  const { LectureEditor } = components(hooks.react);
  const draft = { ...initial, slides: [{ ...slide, body: "" }] };
  const originalFetch = globalThis.fetch;
  const requests: Array<{ init?: RequestInit }> = [];
  globalThis.fetch = (async (_url: string | URL | Request, init?: RequestInit) => {
    requests.push({ init });
    return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { "Content-Type": "application/json" } });
  }) as typeof fetch;
  try {
    const props = { initial: draft, courseOutline: outline, expectedStudioContext };
    let tree = hooks.render(LectureEditor, props);
    const title = descendants(tree).find((node) => node.type === "input" && node.props.value === initial.title);
    assert.ok(title); title.props.onChange({ target: { value: "  Edited draft title  " } });
    tree = hooks.render(LectureEditor, props);
    assert.ok(descendants(tree).some((node) => textOf(node).includes("Incomplete slides can be saved as a draft")));
    const save = descendants(tree).find((node) => node.type === "button" && textOf(node) === "Save");
    assert.ok(save); assert.equal(save.props.disabled, false); save.props.onClick();
    await new Promise((resolve) => setImmediate(resolve));
    assert.deepEqual(JSON.parse(String(requests[0].init?.body)), { action: "save", id: initial.id, expectedVersion: 4, expectedStudioContext, title: "Edited draft title", slides: [{ ...slide, body: "" }] });
    tree = hooks.render(LectureEditor, props);
    assert.ok(descendants(tree).some((node) => node.props.role === "alert" && textOf(node) === "The lecture service returned an invalid response."));
    assert.ok(descendants(tree).some((node) => node.props.role === "status" && textOf(node) === "Unsaved changes"));
  } finally { globalThis.fetch = originalFetch; }
});

test("review is gated by complete saved slides and reviewer controls follow server permissions", () => {
  const hooks = hookHarness();
  const { LectureEditor } = components(hooks.react);
  let tree = hooks.render(LectureEditor, { initial: { ...initial, slides: [{ ...slide, body: "" }] }, courseOutline: outline, expectedStudioContext });
  let reviewTab = descendants(tree).find((node) => node.type === "button" && textOf(node) === "Review");
  assert.ok(reviewTab); reviewTab.props.onClick(); tree = hooks.render(LectureEditor, { initial: { ...initial, slides: [{ ...slide, body: "" }] }, courseOutline: outline, expectedStudioContext });
  const request = descendants(tree).find((node) => node.type === "button" && textOf(node) === "Request review");
  assert.ok(request); assert.equal(request.props.disabled, true);
  assert.ok(descendants(tree).some((node) => textOf(node).includes("Every slide must have both a title and content before review")));

  const reviewerHooks = hookHarness();
  const reviewer = components(reviewerHooks.react).LectureEditor;
  tree = reviewerHooks.render(reviewer, { initial: { ...initial, status: "in-review", canEdit: false, canReview: true }, courseOutline: outline, expectedStudioContext });
  reviewTab = descendants(tree).find((node) => node.type === "button" && textOf(node) === "Review");
  assert.ok(reviewTab); reviewTab.props.onClick(); tree = reviewerHooks.render(reviewer, { initial: { ...initial, status: "in-review", canEdit: false, canReview: true }, courseOutline: outline, expectedStudioContext });
  assert.ok(descendants(tree).some((node) => node.type === "button" && textOf(node) === "Record review"));
  assert.ok(!descendants(tree).some((node) => node.type === "button" && textOf(node) === "Request review"));
  const comment = descendants(tree).find((node) => node.type === "textarea");
  assert.ok(comment); assert.equal(comment.props.maxLength, 2_000);
});

test("published lecture Review offers retirement and a verified receipt leaves history read-only", () => {
  const hooks = hookHarness();
  const {LectureEditor, WorkbookRetirement, WorkbookCorrection} = components(hooks.react);
  const published = {
    ...initial, status: 'published', canEdit: true, canReview: true, canPublish: true, canReopenAnatomy: true,
    reviews: [{reviewerName:'Independent reviewer',decision:'approved',comment:'Evidence reviewed for this exact lecture.',version:4,createdAt:'2026-10-15T10:00:00.000Z'}],
    published: {version:4,integrityHash:'b'.repeat(64),publishedAt:'2026-10-15T11:00:00.000Z'},
  };
  const props = {initial:published,courseOutline:outline,expectedStudioContext};
  let tree = hooks.render(LectureEditor,props);
  const reviewTab = descendants(tree).find(node=>node.type==='button'&&textOf(node)==='Review');
  assert.ok(reviewTab);reviewTab.props.onClick();tree=hooks.render(LectureEditor,props);
  const retirement = descendants(tree).find(node=>node.type===WorkbookRetirement);
  assert.ok(retirement,'published Review renders the retirement control');
  const correction = descendants(tree).find(node=>node.type===WorkbookCorrection);
  assert.ok(correction,'published Review offers a separate correction draft without editing the original');
  assert.deepEqual({id:correction.props.id,version:correction.props.version,mode:correction.props.mode,disabled:correction.props.disabled},
    {id:published.id,version:4,mode:'lecture',disabled:false});
  assert.deepEqual({id:retirement.props.id,title:retirement.props.title,version:retirement.props.version,disabled:retirement.props.disabled},
    {id:published.id,title:published.title,version:4,disabled:false});
  const receipt=parseWorkbookRetirementReceipt({
    ok:true,action:'retire-published-workbook',workbookId:published.id,workbookVersion:4,disposition:'withdrawn',
    auditId:'12345678-1234-1234-1234-123456789abc',auditHash:'a'.repeat(64),retiredAt:'2026-10-16T10:00:00.000Z',
  },{id:published.id,expectedVersion:4,disposition:'withdrawn'});
  assert.ok(receipt,'receipt satisfies the production parser');
  retirement.props.onRetired(receipt);
  tree=hooks.render(LectureEditor,props);
  assert.equal(descendants(tree).find(node=>node.type===WorkbookRetirement),undefined);
  assert.equal(descendants(tree).find(node=>node.type===WorkbookCorrection),undefined);
  assert.match(textOf(tree),/This revision is retired/);
  assert.match(textOf(tree),/published manifest and review history are preserved/);
  assert.match(textOf(tree),/Historical published version 4/);
  assert.match(textOf(tree),/Evidence reviewed for this exact lecture/);
  assert.match(textOf(tree),/Workbook withdrawn\. Published evidence and review history were preserved/);
  const save=descendants(tree).find(node=>node.type==='button'&&textOf(node)==='Save');
  assert.ok(save);assert.equal(save.props.disabled,true);
  for(const action of ['Request review','Record review','Publish approved version','Reopen to update anatomy'])
    assert.equal(descendants(tree).find(node=>node.type==='button'&&textOf(node)===action),undefined,`${action} remains unavailable`);
  const contentTab=descendants(tree).find(node=>node.type==='button'&&textOf(node)==='Content');
  assert.ok(contentTab);contentTab.props.onClick();tree=hooks.render(LectureEditor,props);
  assert.equal(descendants(tree).find(node=>node.type==='input'&&node.props.value===published.title)?.props.disabled,true);
});

test("saved but unpublished editor preview remains explicitly labelled draft", () => {
  const hooks = hookHarness();
  const { LectureEditor } = components(hooks.react);
  const props = { initial, courseOutline: outline, expectedStudioContext };
  let tree = hooks.render(LectureEditor, props);
  const preview = descendants(tree).find((node) => node.type === "button" && textOf(node) === "Preview");
  assert.ok(preview); preview.props.onClick(); tree = hooks.render(LectureEditor, props);
  const playerNode = descendants(tree).find((node) => typeof node.type === "function" && (node.type as unknown as { name?: string }).name === "LecturePlayer");
  assert.ok(playerNode); assert.equal(playerNode.props.version, undefined);
  const player = components().LecturePlayer;
  const html = renderToStaticMarkup(React.createElement(player, playerNode.props));
  assert.ok(html.includes("Draft preview"));
  assert.ok(!html.includes("Version 4"));
});

test("lecture player supports buttons, keyboard navigation and a selectable outline", () => {
  const hooks = hookHarness();
  const { LecturePlayer } = components(hooks.react);
  const slides = [slide, { ...slide, id: "slide-2", title: "Descending aorta", body: "Follow the vessel inferiorly." }];
  let tree = hooks.render(LecturePlayer, { title: initial.title, slides, version: 4 });
  assert.ok(descendants(tree).some((node) => node.type === "h3" && textOf(node) === "Aortic arch"));
  tree.props.onKeyDown({ key: "ArrowRight", preventDefault() {} });
  tree = hooks.render(LecturePlayer, { title: initial.title, slides, version: 4 });
  assert.ok(descendants(tree).some((node) => node.type === "h3" && textOf(node) === "Descending aorta"));
  const previous = descendants(tree).find((node) => node.type === "button" && textOf(node) === "Previous");
  assert.ok(previous); previous.props.onClick(); tree = hooks.render(LecturePlayer, { title: initial.title, slides, version: 4 });
  assert.ok(descendants(tree).some((node) => node.type === "h3" && textOf(node) === "Aortic arch"));
  assert.ok(descendants(tree).some((node) => node.type === "summary" && textOf(node) === "Slide outline"));
});

test("lecture player never links an unsafe reference and marks an unversioned preview as draft", () => {
  const { LecturePlayer } = components();
  const unsafe = { ...slide, referenceUrl: "https://reader:secret@example.org/reference" };
  const html = renderToStaticMarkup(React.createElement(LecturePlayer, { title: initial.title, slides: [unsafe] }));
  assert.ok(html.includes("Draft preview"));
  assert.ok(!html.includes("reader:secret"));
  assert.ok(!html.includes("Open source reference"));
});
