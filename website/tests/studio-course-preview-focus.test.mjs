import { loadOutlineHelper } from './studio-outline-helper-loader.mjs';
import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { registerStudioNavigationGuard } from '../lib/studio-navigation-guard.ts';

const require = createRequire(import.meta.url);
const ts = require('typescript');
const source = readFileSync(new URL('../components/StudioCourseEditor.tsx', import.meta.url), 'utf8');
const outlineHelper = loadOutlineHelper(ts, new URL('../components/StudioCourseEditor.tsx', import.meta.url));
const code = ts.transpileModule(source, { compilerOptions: {
  jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS,
  target: ts.ScriptTarget.ES2022, esModuleInterop: true,
} }).outputText;
const Link = ({ children, ...props }) => React.createElement('a', props, children);
const ReleaseDraftForm = ({ release }) => React.createElement('span', {
  'data-release-form-id': release?.id ?? 'none',
});
const mocks = {'../lib/studio-outline-navigation.ts': outlineHelper,
  react: React,
  'react/jsx-runtime': require('react/jsx-runtime'),
  'next/link': Link,
  'next/navigation': { useSearchParams: () => new URLSearchParams('pane=preview') },
  './StudioForms': {
    CreateWorkbookForm: () => null,
    DuplicateCourseButton: () => null,
    EditCourseDetailsForm: () => null,
    ReleaseDraftForm,
  },
};
const loaded = { exports: {} };
new Function('require', 'module', 'exports', code)(name => {
  assert(Object.hasOwn(mocks, name), `Unexpected import: ${name}`);
  return mocks[name];
}, loaded, loaded.exports);
const { StudioCourseEditor } = loaded.exports;
const course = { id: 'course/one', title: 'Synthetic course' };
const workbook = { id: 'workbook-one', courseId: course.id, title: 'Synthetic lesson', mode: 'lecture', status: 'draft', caseCount: 0 };
const release = (id, version, status = 'published', courseId = course.id) => ({
  id, courseId, version, status, title: `Release ${id}`, workbookIds: [workbook.id],
});

function render(releases, workbooks = [workbook]) {
  const html = renderToStaticMarkup(React.createElement(StudioCourseEditor, {
    course, workbooks, releases,
    recoveryScope: { actorId: 'synthetic', organizationId: 'synthetic' },
  }));
  const start = html.indexOf('<section id="course-preview"');
  const end = html.indexOf('<section id="course-review"');
  assert(start >= 0 && end > start, 'real editor renders both panes');
  return { preview: html.slice(start, end), html };
}

function link(id, version, status) {
  return `<a href="/studio/releases/${encodeURIComponent(id)}/preview">Release ${id} — preview ${status} version ${version}</a>`;
}

test('editable draft is featured even below the largest version; other exact release links start collapsed', () => {
  const older = release('old?published', 2);
  const draft = release('draft/active', 3, 'draft');
  const newer = release('new#published', 9);
  const foreign = release('foreign/hidden', 99, 'draft', 'another-course');
  const { preview, html } = render([older, draft, foreign, newer]);
  assert.match(preview, /Editable release draft preview:/);
  assert(preview.indexOf(link(draft.id, 3, 'draft')) < preview.indexOf('<details>'));
  assert.match(preview, /<details><summary>Other release versions \(2\)<\/summary>/);
  assert.doesNotMatch(preview, /<details open/);
  assert(preview.indexOf(link(older.id, 2, 'published')) > preview.indexOf('<details>'));
  assert(preview.indexOf(link(newer.id, 9, 'published')) > preview.indexOf('<details>'));
  assert(!html.includes(encodeURIComponent(foreign.id)));
  assert.match(html, /data-release-form-id="draft\/active"/);
});

test('changes-requested remains the editable form and featured preview', () => {
  const current = release('needs?changes', 4, 'changes-requested');
  const { preview, html } = render([release('later', 7), current]);
  assert(preview.indexOf(link(current.id, 4, 'changes-requested')) < preview.indexOf('<details>'));
  assert.match(preview, /Other release versions \(1\)/);
  assert.match(html, /data-release-form-id="needs\?changes"/);
});

test('without an editable draft the highest numeric version is featured, with stable ties', () => {
  const first = release('first/tie', 12, 'withdrawn');
  const tied = release('second/tie', 12, 'published');
  const lower = release('lower', 3, 'in-review');
  const { preview, html } = render([lower, first, tied]);
  assert.match(preview, /No editable release draft\. Showing the highest saved version for this course:/);
  assert(preview.indexOf(link(first.id, 12, 'withdrawn')) < preview.indexOf('<details>'));
  assert(preview.indexOf(link(lower.id, 3, 'in-review')) > preview.indexOf('<details>'));
  assert(preview.indexOf(link(tied.id, 12, 'published')) > preview.indexOf('<details>'));
  assert.match(preview, /Other release versions \(2\)/);
  assert.match(html, /data-release-form-id="none"/);
});

test('no release in this course retains preparation guidance', () => {
  for (const releases of [[], [release('foreign', 5, 'draft', 'other')]]) {
    const { preview } = render(releases);
    assert.match(preview, /No course release has been prepared yet/);
    assert.doesNotMatch(preview, /Other release versions/);
    assert.doesNotMatch(preview, /\/studio\/releases\//);
  }
});

test('a single editable version needs no history disclosure', () => {
  const current = release('only', 1, 'draft');
  const {preview} = render([current]);
  assert(preview.includes(link(current.id, 1, 'draft')));
  assert.doesNotMatch(preview, /Other release versions|<details/);
  assert.doesNotMatch(preview, /Open builder|Preview individual items/);
});

test('saved items have encoded builder links without leaking foreign items or claiming a learner order', () => {
  const items = ['lecture', 'teaching', 'assessment'].map((mode, i) => ({
    ...workbook, id: `item/${mode}?one#two`, title: `${mode} <draft>`, mode,
    status: ['draft', 'archived', 'withdrawn'][i],
  }));
  const foreign = {...workbook, id: 'foreign-secret', courseId: 'another-course', title: 'Foreign content'};
  const {preview} = render([], [foreign, ...items, items[0]]);
  assert.match(preview, /Open an item&#x27;s builder, then choose Preview/);
  assert.match(preview, /Save a private release draft to preview the combined learner order/);
  assert.match(preview, /<ul class="course-outline" aria-label="Items available to preview in their builders">/);
  for (const item of items) {
    const href = `/studio/workbooks/${encodeURIComponent(item.id)}/builder`;
    assert.equal(preview.split(`href="${href}"`).length - 1, 1);
    assert(preview.includes(`aria-label="Open ${item.mode} &lt;draft&gt; in builder to preview"`));
    assert(preview.includes(`· ${item.status}`));
  }
  assert.match(preview, /Lecture \/ presentation/);
  assert.match(preview, /Imaging teaching/);
  assert.match(preview, /Assessment/);
  assert.equal(preview.split('unavailable to learners').length - 1, 2);
  assert.doesNotMatch(preview, /foreign-secret|Foreign content|\/studio\/releases\/|<ol/);
});

test('empty and foreign-only courses direct authors to Content without item links', () => {
  for (const items of [[], [{...workbook, courseId: 'other-course'}]]) {
    const {preview} = render([], items);
    assert.match(preview, /Add your first item in Content to start previewing/);
    assert.doesNotMatch(preview, /\/builder|Preview individual items/);
  }
});

test('rendered Preview builder links retain one shared unsaved-details/release confirmation', () => {
  const {preview} = render([]);
  const href = /href="([^"]+\/builder)"/.exec(preview)?.[1];
  assert(href, 'use the actual rendered Preview link');
  const listeners = new Set();
  const originals = ['Element', 'window'].map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)]);
  let detailsDirty = true, releaseDirty = true, confirmations = 0, allow = false;
  class Target { closest() { return {href, target: '', hasAttribute: () => false}; } }
  Object.defineProperty(globalThis, 'Element', {value: Target, configurable: true});
  Object.defineProperty(globalThis, 'window', {value: {confirm() {confirmations++; return allow;}}, configurable: true});
  const document = {
    location: {href: `https://example.test/studio/courses/${encodeURIComponent(course.id)}?pane=preview`},
    addEventListener(name, callback, capture) {assert.equal(name, 'click'); assert(capture); listeners.add(callback);},
    removeEventListener(name, callback, capture) {assert.equal(name, 'click'); assert(capture); listeners.delete(callback);},
  };
  const cleanups = [];
  try {
    cleanups.push(registerStudioNavigationGuard(document, () => detailsDirty));
    cleanups.push(registerStudioNavigationGuard(document, () => releaseDirty));
    const click = () => {
      const event = {button: 0, target: new Target(), defaultPrevented: false, preventDefault() {this.defaultPrevented = true;}};
      for (const listener of listeners) listener(event);
      return event.defaultPrevented;
    };
    assert.equal(listeners.size, 1);
    assert(click()); assert.equal(confirmations, 1);
    detailsDirty = false;
    assert(click()); assert.equal(confirmations, 2, 'hidden release form still protects its draft');
    allow = true;
    assert(!click()); assert.equal(confirmations, 3, 'explicit confirmation allows navigation');
    releaseDirty = false;
    assert(!click()); assert.equal(confirmations, 3, 'saved forms do not prompt');
  } finally {
    cleanups.forEach(cleanup => cleanup());
    for (const [key, original] of originals) {
      if (original) Object.defineProperty(globalThis, key, original);
      else delete globalThis[key];
    }
  }
  assert.equal(listeners.size, 0);
});
