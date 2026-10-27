import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {getStudioCourseDirectory, normalizeStudioCourseQuery, studioCourseDirectoryUrl} from '../lib/studio-course-directory.ts';

const requireSite = createRequire(new URL('../package.json', import.meta.url));
const React = requireSite('react');
const {renderToStaticMarkup} = requireSite('react-dom/server');
const ts = requireSite('typescript');
const pageSource = readFileSync(new URL('../app/studio/courses/page.tsx', import.meta.url), 'utf8');
const courses = Array.from({length: 25}, (_, index) => ({id: `course/${index + 1}`, title: `Course ${index + 1}`, code: `CODE-${index + 1}`, description: `Topic ${index + 1}`, workbookCount: index + 1}));

function renderPage(items, params, authFailure = false) {
  const calls = [];
  const code = ts.transpileModule(pageSource, {compilerOptions: {jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022}}).outputText;
  const module = {exports: {}};
  const mocks = {
    'react/jsx-runtime': requireSite('react/jsx-runtime'),
    'next/link': {default: ({children, ...props}) => React.createElement('a', props, children)},
    '../../chatgpt-auth': {requireChatGPTUser: async path => {calls.push(['auth', path]); if (authFailure) throw Error('Authentication required'); return {userId: 'author', email: 'author@example.invalid', displayName: 'Author'};}},
    '@/components/StudioForms': {CreateCourseForm: () => React.createElement('div', {'data-form': 'create'}), CreateCourseFromTemplateForm: () => React.createElement('div', {'data-form': 'template'})},
    '@/components/StudioShell': {StudioShell: ({children, actions}) => React.createElement('main', null, actions, children)},
    '@/lib/education-platform': {getStudioSnapshot: async actor => {calls.push(['snapshot', actor]); return {organization: {id: 'org'}, courses: items};}},
    '@/lib/studio-course-directory': {getStudioCourseDirectory},
  };
  new Function('require', 'module', 'exports', code)(name => {assert(Object.hasOwn(mocks, name), `Unexpected import ${name}`); return mocks[name];}, module, module.exports);
  return {calls, async html() {return renderToStaticMarkup(await module.exports.default({searchParams: Promise.resolve(params)}));}};
}

test('directory keeps snapshot order, returns 12 items, and never mutates source', () => {
  const before = courses.map(course => course.id);
  const first = getStudioCourseDirectory(courses, '', undefined);
  const second = getStudioCourseDirectory(courses, '', '2');
  assert.deepEqual(first.pageCourses.map(course => course.id), before.slice(0, 12));
  assert.deepEqual(second.pageCourses.map(course => course.id), before.slice(12, 24));
  assert.equal(first.firstItem, 1);
  assert.equal(second.lastItem, 24);
  assert.equal(second.pageCount, 3);
  assert.deepEqual(courses.map(course => course.id), before);
});

test('page values must be canonical strings; stale pages cap to the final page', () => {
  for (const raw of [0, 2, null, ['2'], ['2', '3'], '0', '02', '+2', ' 2', '2 ', '2.0', '-2', 'not-a-page']) {
    assert.equal(getStudioCourseDirectory(courses, '', raw).page, 1, String(raw));
  }
  assert.equal(getStudioCourseDirectory(courses, '', '999999999999999999999999999').page, 3);
  assert.deepEqual(getStudioCourseDirectory(courses, 'absent', '9').pageCourses, []);
  assert.equal(getStudioCourseDirectory(courses, 'absent', '9').pageCount, 0);
});

test('query matches title, code and description; URLs encode normalized query', () => {
  assert.equal(normalizeStudioCourseQuery('  Topic\t 1 & <x>  '), 'Topic 1 & <x>');
  assert.equal(studioCourseDirectoryUrl('Topic 1 & <x>', 2), '/studio/courses?q=Topic+1+%26+%3Cx%3E&page=2');
  assert.equal(studioCourseDirectoryUrl('Topic 1 & <x>', 1), '/studio/courses?q=Topic+1+%26+%3Cx%3E');
  assert.deepEqual(getStudioCourseDirectory(courses, 'CODE-2', null).pageCourses.map(course => course.id), ['course/2', 'course/20', 'course/21', 'course/22', 'course/23', 'course/24', 'course/25']);
  assert.deepEqual(getStudioCourseDirectory(courses, 'Topic 1', null).pageCourses.map(course => course.id), courses.filter(course => course.description.includes('Topic 1')).slice(0, 12).map(course => course.id));
});

test('render uses native links and concise range; search and creation clear paging', async () => {
  const second = renderPage(courses, {page: '2'});
  const html = await second.html();
  assert.match(html, /Showing 13–24 of 25 courses/);
  assert.match(html, /Page 2 of 3/);
  assert(html.indexOf('aria-label="Course pages"') < html.indexOf('class="course-list"'), 'page controls are reachable without scrolling through all courses');
  assert.match(html, /href="\/studio\/courses">Previous<\/a>/);
  assert.match(html, /href="\/studio\/courses\?page=3">Next<\/a>/);
  assert.equal((html.match(/class="course-list-item"/g) ?? []).length, 12);
  assert.doesNotMatch(html, /<h2>Course 1<\/h2>|<h2>Course 25<\/h2>/);
  assert.match(html, /action="\/studio\/courses"/);
  assert.match(html, /href="\/studio\/courses\?new=1">New course<\/a>/);
  assert.deepEqual(second.calls.map(call => call[0]), ['auth', 'snapshot']);
  const creating = await renderPage(courses, {new: '1', page: '2'}).html();
  assert.doesNotMatch(creating, /Course pages|Search courses/);
  assert.match(creating, /data-form="create"/);
});

test('filtered pagination preserves query and no-match state has no phantom page', async () => {
  const filtered = await renderPage(courses, {q: 'course', page: '3'}).html();
  assert.match(filtered, /Showing 25–25 of 25 matching courses \(25 total\)/);
  assert.match(filtered, /href="\/studio\/courses\?q=course&amp;page=2">Previous<\/a>/);
  assert.doesNotMatch(filtered, />Next<\/a>/);
  const missing = await renderPage(courses, {q: 'absent', page: '3'}).html();
  assert.match(missing, /No courses match this search/);
  assert.doesNotMatch(missing, /Page 1 of 0|Course pages/);
  const denied = renderPage(courses, {page: '2'}, true);
  await assert.rejects(denied.html(), /Authentication required/);
  assert.deepEqual(denied.calls, [['auth', '/studio/courses']]);
});
