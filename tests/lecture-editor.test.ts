/* eslint-disable @typescript-eslint/no-explicit-any */
import assert from "node:assert/strict";
import test from "node:test";
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";

const require = createRequire(import.meta.url);

function compile(path: string, react: typeof React, mocks: Record<string, unknown> = {}, loadedStyles?: Set<string>) {
  const source = readFileSync(new URL(path, import.meta.url), "utf8");
  const code = ts.transpileModule(source, { compilerOptions: {
    jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true,
  } }).outputText;
  const compiledModule = { exports: {} as Record<string, any> };
  new Function("require", "module", "exports", code)((name: string) => {
    if (name === "react") return react;
    if (name.endsWith(".css")) { loadedStyles?.add(name); return {}; }
    if (name in mocks) return mocks[name];
    return require(name);
  }, compiledModule, compiledModule.exports);
  return compiledModule.exports;
}

function components(react: typeof React = React) {
  const { LecturePlayer } = compile("../components/LecturePlayer.tsx", react);
  const { LectureEditor } = compile("../components/LectureEditor.tsx", react, { "./LecturePlayer": { LecturePlayer } });
  return { LectureEditor, LecturePlayer };
}

const slide = { id: "slide-1", title: "Aortic arch", body: "Identify the three main branches.", referenceUrl: "https://example.org/reference" };
const initial = {
  id: "lecture / 1", title: "Thoracic anatomy", version: 4, status: "draft", courseId: "course-1", courseTitle: "Core anatomy",
  slides: [slide], canEdit: true, canReview: false, canPublish: false, reviews: [], published: null,
};
const outline = [{ id: "lecture / 1", title: "Thoracic anatomy" }, { id: "case-2", title: "Chest case" }];

type ElementNode = React.ReactElement<Record<string, any>>;
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
  const react = {
    ...React,
    useEffect: () => undefined,
    useLayoutEffect: () => undefined,
    useMemo: (factory: () => unknown) => factory(),
    useState: (value: unknown) => {
      const index = stateIndex++;
      if (!(index in values)) values[index] = typeof value === "function" ? (value as () => unknown)() : value;
      return [values[index], (next: unknown) => { values[index] = typeof next === "function" ? (next as (current: unknown) => unknown)(values[index]) : next; }];
    },
  } as unknown as typeof React;
  return { react, render(Component: any, props: any) { stateIndex = 0; return Component(props) as ElementNode; } };
}

test("lecture editor renders compact course, slide and content columns without a case dependency", () => {
  const { LectureEditor } = components();
  const html = renderToStaticMarkup(React.createElement(LectureEditor, { initial, courseOutline: outline }));
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
    const props = { initial, courseOutline: outline };
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
    assert.deepEqual(JSON.parse(String(requests[0].init?.body)), { action: "save", id: initial.id, expectedVersion: 4, title: "Edited lecture", slides: [slide] });
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
    const props = { initial: twoSlideView, courseOutline: outline };
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
    const props = { initial, courseOutline: outline };
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
    const props = { initial: draft, courseOutline: outline };
    let tree = hooks.render(LectureEditor, props);
    const title = descendants(tree).find((node) => node.type === "input" && node.props.value === initial.title);
    assert.ok(title); title.props.onChange({ target: { value: "  Edited draft title  " } });
    tree = hooks.render(LectureEditor, props);
    assert.ok(descendants(tree).some((node) => textOf(node).includes("Incomplete slides can be saved as a draft")));
    const save = descendants(tree).find((node) => node.type === "button" && textOf(node) === "Save");
    assert.ok(save); assert.equal(save.props.disabled, false); save.props.onClick();
    await new Promise((resolve) => setImmediate(resolve));
    assert.deepEqual(JSON.parse(String(requests[0].init?.body)), { action: "save", id: initial.id, expectedVersion: 4, title: "Edited draft title", slides: [{ ...slide, body: "" }] });
    tree = hooks.render(LectureEditor, props);
    assert.ok(descendants(tree).some((node) => node.props.role === "alert" && textOf(node) === "The lecture service returned an invalid response."));
    assert.ok(descendants(tree).some((node) => node.props.role === "status" && textOf(node) === "Unsaved changes"));
  } finally { globalThis.fetch = originalFetch; }
});

test("review is gated by complete saved slides and reviewer controls follow server permissions", () => {
  const hooks = hookHarness();
  const { LectureEditor } = components(hooks.react);
  let tree = hooks.render(LectureEditor, { initial: { ...initial, slides: [{ ...slide, body: "" }] }, courseOutline: outline });
  let reviewTab = descendants(tree).find((node) => node.type === "button" && textOf(node) === "Review");
  assert.ok(reviewTab); reviewTab.props.onClick(); tree = hooks.render(LectureEditor, { initial: { ...initial, slides: [{ ...slide, body: "" }] }, courseOutline: outline });
  const request = descendants(tree).find((node) => node.type === "button" && textOf(node) === "Request review");
  assert.ok(request); assert.equal(request.props.disabled, true);
  assert.ok(descendants(tree).some((node) => textOf(node).includes("Every slide must have both a title and content before review")));

  const reviewerHooks = hookHarness();
  const reviewer = components(reviewerHooks.react).LectureEditor;
  tree = reviewerHooks.render(reviewer, { initial: { ...initial, status: "in-review", canEdit: false, canReview: true }, courseOutline: outline });
  reviewTab = descendants(tree).find((node) => node.type === "button" && textOf(node) === "Review");
  assert.ok(reviewTab); reviewTab.props.onClick(); tree = reviewerHooks.render(reviewer, { initial: { ...initial, status: "in-review", canEdit: false, canReview: true }, courseOutline: outline });
  assert.ok(descendants(tree).some((node) => node.type === "button" && textOf(node) === "Record review"));
  assert.ok(!descendants(tree).some((node) => node.type === "button" && textOf(node) === "Request review"));
  const comment = descendants(tree).find((node) => node.type === "textarea");
  assert.ok(comment); assert.equal(comment.props.maxLength, 2_000);
});

test("saved but unpublished editor preview remains explicitly labelled draft", () => {
  const hooks = hookHarness();
  const { LectureEditor } = components(hooks.react);
  const props = { initial, courseOutline: outline };
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
