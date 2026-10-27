import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

const require = createRequire(import.meta.url);
const ts = require('typescript');
const source = readFileSync(new URL('../components/StudioCourseEditor.tsx', import.meta.url), 'utf8');
const code = ts.transpileModule(source, { compilerOptions: {
  jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS,
  target: ts.ScriptTarget.ES2022, esModuleInterop: true,
} }).outputText;
const Link = ({ children, ...props }) => React.createElement('a', props, children);
const ReleaseDraftForm = ({ release }) => React.createElement('span', {
  'data-release-form-id': release?.id ?? 'none',
});
const mocks = {
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

function render(releases) {
  const html = renderToStaticMarkup(React.createElement(StudioCourseEditor, {
    course, workbooks: [workbook], releases,
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
});
