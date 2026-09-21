import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ts from 'typescript';

const require = createRequire(import.meta.url);
const Link = ({ children, ...props }: any) => React.createElement('a', props, children);

function compileWorkbookBuilder(react: typeof React = React) {
  const source = readFileSync(new URL('../components/EducationRuntime.tsx', import.meta.url), 'utf8')
    .replace('function WorkbookBuilder({', 'export function WorkbookBuilder({');
  const code = ts.transpileModule(source, { compilerOptions: {
    jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true,
  } }).outputText;
  const module = { exports: {} as Record<string, any> };
  const mocks: Record<string, unknown> = {
    react,
    'next/link': Link,
    'next/dynamic': () => () => null,
    '@/components/BrandLockup': { BrandLockup: () => React.createElement('span', null, 'Visible Medicine') },
    '@/lib/teaching-content': { introductoryTeachingSlides: () => [], keyPointsFromBody: () => [] },
    '@/lib/attempt-policy': { remainingAttemptSeconds: () => 0 },
    '@/lib/live-refresh-policy': { liveRefreshDelay: () => 1000 },
    '@/lib/latest-view-request': { createLatestViewRequest: () => ({ begin: () => ({ finish: () => true }) }) },
  };
  new Function('require', 'module', 'exports', code)(
    (name: string) => name in mocks ? mocks[name] : require(name), module, module.exports,
  );
  assert.equal(typeof module.exports.WorkbookBuilder, 'function', 'transpile-only export exposes the actual component');
  return module.exports.WorkbookBuilder;
}

const educationCase = {
  id: 'case-1', position: 1, title: 'Chest teaching case', description: 'Cleared chest imaging case.', classification: 'radiology',
  version: 3, maxMarks: 5, questions: [{ id: 'question-1', prompt: 'Describe the finding.' }],
};
const draftWorkbook = {
  id: 'workbook-1', title: 'Focused chest workbook', mode: 'teaching', status: 'draft', durationMinutes: 60,
  dualDisplayAllowed: true, caseIds: [educationCase.id], version: 2, authorId: 'author-1', integrityHash: '1234567890abcdef',
  latestReviewDecision: null, latestReviewComment: null, latestReviewerName: null,
};

function snapshot(workbook = draftWorkbook) {
  return {
    currentUser: { id: 'author-1', roles: ['instructor'] },
    workbooks: [workbook],
    draftWorkbookDetails: [],
    cases: [educationCase],
    teachingNotes: [{ caseId: educationCase.id }],
    recoveryComparisons: [],
    accessibleWorkbooks: [],
    learners: [],
    workbookAssignments: [],
    cohorts: [],
  } as any;
}

test('focused editor defaults to the mounted case picker with other panels hidden', () => {
  const WorkbookBuilder = compileWorkbookBuilder();
  const html = renderToStaticMarkup(React.createElement(WorkbookBuilder, {
    data: snapshot(), busy: false, postAction: async () => null, focusWorkbookId: draftWorkbook.id,
  }));
  assert.match(html, /class="management-page builder-page focused-course-editor" data-editor-panel="cases"/);
  assert.match(html, /<section class="management-card case-picker">/);
  assert.match(html, /<section class="management-card builder-form" hidden="">/);
  assert.match(html, /class="teaching-design-disclosure builder-teaching-step" hidden=""/);
  assert.match(html, /<aside class="management-card publish-preview" hidden="">/);
  assert.match(html, /class="editor-version-history" hidden=""/);
  assert.ok(html.includes('Chest teaching case'));
  assert.ok(html.includes('<h3>Focused chest workbook</h3>'), 'preview content remains mounted while hidden');
  assert.ok(html.includes('No unsaved changes'));
  assert.ok(!html.includes('All changes saved'));
});

test('title, case and readiness state gate the shared save action', () => {
  const WorkbookBuilder = compileWorkbookBuilder();
  const focused = renderToStaticMarkup(React.createElement(WorkbookBuilder, {
    data: snapshot(), busy: false, postAction: async () => null, focusWorkbookId: draftWorkbook.id,
  }));
  assert.ok(focused.includes('value="Focused chest workbook"'));
  assert.match(focused, /type="checkbox" checked=""/);
  assert.match(focused, /<button type="button">Save draft<\/button>/);

  const untitled = renderToStaticMarkup(React.createElement(WorkbookBuilder, {
    data: { ...snapshot(), currentUser: { id: 'learner-1', roles: ['learner'] }, workbooks: [], draftWorkbookDetails: [] }, busy: false, postAction: async () => null,
  }));
  assert.match(untitled, /<button type="button" disabled="">Save draft<\/button>/);
  assert.ok(untitled.includes('Workbook title added'));

  const busy = renderToStaticMarkup(React.createElement(WorkbookBuilder, {
    data: snapshot(), busy: true, postAction: async () => null, focusWorkbookId: draftWorkbook.id,
  }));
  assert.match(busy, /<fieldset class="editor-busy-guard" disabled="">/);
  assert.match(busy, /<button type="button" disabled="">Saving…<\/button>/);
});

test('a focused published workbook is read-only and exposes no editor controls', () => {
  const WorkbookBuilder = compileWorkbookBuilder();
  const published = { ...draftWorkbook, status: 'published', version: 7 };
  const html = renderToStaticMarkup(React.createElement(WorkbookBuilder, {
    data: snapshot(published), busy: false, postAction: async () => null, focusWorkbookId: published.id,
    returnTo: '/studio/courses/course-1',
  }));
  assert.ok(html.includes('This governed workbook state is read-only.'));
  assert.ok(html.includes('Version 7 · 1 cases'));
  assert.ok(html.includes('href="/studio/courses/course-1"'));
  assert.ok(!html.includes('focused-course-editor'));
  assert.ok(!html.includes('aria-label="Content editor"'));
  assert.ok(!html.includes('<input'));
  assert.ok(!html.includes('<textarea'));
});

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
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (!React.isValidElement(node)) return '';
  return childrenOf(node).map(textOf).join('');
}

function hookHarness() {
  const values: unknown[] = [];
  const refs: Array<{ current: unknown }> = [];
  let stateIndex = 0;
  let refIndex = 0;
  const react = {
    ...React,
    useEffect: () => undefined,
    useLayoutEffect: () => undefined,
    useMemo: (factory: () => unknown) => factory(),
    useRef: (initial: unknown) => {
      const index = refIndex++;
      return refs[index] ?? (refs[index] = { current: initial });
    },
    useState: (initial: unknown) => {
      const index = stateIndex++;
      if (!(index in values)) values[index] = typeof initial === 'function' ? (initial as () => unknown)() : initial;
      return [values[index], (next: unknown) => { values[index] = typeof next === 'function' ? (next as (value: unknown) => unknown)(values[index]) : next; }];
    },
  } as unknown as typeof React;
  return {
    react,
    refs,
    render(Component: any, props: any) { stateIndex = 0; refIndex = 0; return Component(props) as ElementNode; },
  };
}

test('tab navigation retains edits, performs no write and marks the draft dirty', () => {
  const hooks = hookHarness();
  const WorkbookBuilder = compileWorkbookBuilder(hooks.react);
  const writes: unknown[] = [];
  const props = { data: snapshot(), busy: false, postAction: async (...args: unknown[]) => { writes.push(args); return null; }, focusWorkbookId: draftWorkbook.id };
  let tree = hooks.render(WorkbookBuilder, props);
  const title = descendants(tree).find((node) => node.type === 'input' && node.props.value === draftWorkbook.title);
  assert.ok(title);
  title.props.onChange({ target: { value: 'Edited title retained' } });

  tree = hooks.render(WorkbookBuilder, props);
  assert.ok(descendants(tree).some((node) => node.props.role === 'status' && textOf(node) === 'Unsaved changes'));
  const requestReview = descendants(tree).find((node) => node.type === 'button' && textOf(node) === 'Request review');
  assert.ok(requestReview);
  assert.equal(requestReview.props.disabled, true);
  assert.equal(requestReview.props.title, 'Save your changes before requesting review');
  const preview = descendants(tree).find((node) => node.type === 'button' && textOf(node) === 'Preview');
  assert.ok(preview);
  preview.props.onClick();
  tree = hooks.render(WorkbookBuilder, props);
  assert.equal(tree.props['data-editor-panel'], 'preview');
  assert.ok(descendants(tree).some((node) => node.type === 'h3' && textOf(node) === 'Edited title retained'));

  const details = descendants(tree).find((node) => node.type === 'button' && textOf(node) === 'Title & settings');
  assert.ok(details);
  details.props.onClick();
  tree = hooks.render(WorkbookBuilder, props);
  assert.equal(tree.props['data-editor-panel'], 'details');
  assert.ok(descendants(tree).some((node) => node.type === 'input' && node.props.value === 'Edited title retained'));
  assert.equal(writes.length, 0, 'panel navigation does not save or mutate');
});

test('header Save draft delegates to the mounted primary save control', () => {
  const hooks = hookHarness();
  const WorkbookBuilder = compileWorkbookBuilder(hooks.react);
  const props = { data: snapshot(), busy: false, postAction: async () => null, focusWorkbookId: draftWorkbook.id };
  const tree = hooks.render(WorkbookBuilder, props);
  let clicks = 0;
  assert.ok(hooks.refs[0], 'first component ref is the shared primary save button');
  hooks.refs[0].current = { click: () => { clicks++; } };
  const save = descendants(tree).find((node) => node.type === 'button' && textOf(node) === 'Save draft');
  assert.ok(save);
  save.props.onClick();
  assert.equal(clicks, 1);
});
