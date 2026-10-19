import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';

const requireSite = createRequire(new URL('../package.json', import.meta.url));
const React = requireSite('react');
const {renderToStaticMarkup} = requireSite('react-dom/server');
const ts = requireSite('typescript');
const source = readFileSync(new URL('../app/studio/courses/page.tsx', import.meta.url), 'utf8');
const courses = [
  {id: 'first/one?x=1', title: 'Chest Basics', code: 'RAD-101', description: 'Learn chest anatomy', workbookCount: 1},
  {id: 'second & two', title: 'Brain MRI', code: 'NEU-202', description: 'Cross-sectional learning', workbookCount: 2},
  {id: 'third', title: 'Abdomen', code: 'ABD-303', description: 'Chest comparison and review', workbookCount: 3},
];
const identity = {userId: 'synthetic-author', email: 'synthetic@example.invalid', displayName: 'Synthetic'};
const snapshot = items => ({organization: {id: 'synthetic-org'}, courses: items, workbooks: [], releases: []});

function compile(mocks) {
  const code = ts.transpileModule(source, {compilerOptions: {
    jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022,
  }}).outputText;
  const module = {exports: {}};
  new Function('require', 'module', 'exports', code)(name => {
    assert(Object.hasOwn(mocks, name), `Unexpected import ${name}`);
    return mocks[name];
  }, module, module.exports);
  return module.exports.default;
}

function harness(items = courses, authFailure = false) {
  const calls = [];
  const Page = compile({
    'react/jsx-runtime': requireSite('react/jsx-runtime'),
    'next/link': {default: ({children, ...props}) => React.createElement('a', props, children)},
    '../../chatgpt-auth': {requireChatGPTUser: async path => {
      calls.push({kind: 'auth', path});
      if (authFailure) throw Error('Authentication required');
      return identity;
    }},
    '@/components/StudioForms': {
      CreateCourseForm: ({recoveryScope}) => React.createElement('div', {'data-form': 'create', 'data-scope': JSON.stringify(recoveryScope)}),
      CreateCourseFromTemplateForm: ({recoveryScope}) => React.createElement('div', {'data-form': 'template', 'data-scope': JSON.stringify(recoveryScope)}),
    },
    '@/components/StudioShell': {StudioShell: ({children, actions, ...props}) => React.createElement('main', {'data-title': props.title}, actions, children)},
    '@/lib/education-platform': {getStudioSnapshot: async actor => {calls.push({kind: 'snapshot', actor}); return snapshot(items);}},
  });
  return {calls, async page(params) {
    const tree = await Page({searchParams: Promise.resolve(params)});
    return {tree, html: renderToStaticMarkup(tree)};
  }};
}

test('list search is a labelled native GET form with explicit submit and count', async () => {
  const {html} = await harness().page({});
  const form = html.match(/<form\b[^>]*>/)?.[0];
  assert(form?.includes('role="search"') && form.includes('method="get"') && form.includes('action="/studio/courses"'));
  assert.match(html, /<label for="studio-course-search-input">Search courses<\/label>/);
  const input = html.match(/<input\b[^>]*id="studio-course-search-input"[^>]*>/)?.[0];
  assert(input?.includes('type="search"') && input.includes('name="q"') && input.includes('maxLength="80"'));
  assert.match(html, /<button type="submit">Search<\/button>/);
  assert.match(html, /<p role="status">3 courses<\/p>/);
  assert.doesNotMatch(html, /Clear search/);
  assert(html.indexOf('Chest Basics') < html.indexOf('Brain MRI') && html.indexOf('Brain MRI') < html.indexOf('Abdomen'));
});

test('title, code and description match without changing snapshot order', async () => {
  const h = harness();
  for (const [q, expected] of [['brain', ['Brain MRI']], ['neu-202', ['Brain MRI']], ['CHEST', ['Chest Basics', 'Abdomen']]]) {
    const {html} = await h.page({q});
    assert.match(html, new RegExp(`<p role="status">${expected.length} of 3 courses<\\/p>`));
    const rendered = courses.filter(course => html.includes(`<h2>${course.title}</h2>`)).map(course => course.title);
    assert.deepEqual(rendered, expected);
    if (expected.length > 1) assert(html.indexOf(expected[0]) < html.indexOf(expected[1]));
    assert.match(html, /href="\/studio\/courses">Clear search<\/a>/);
  }
});

test('course links retain exact encoded IDs and existing list metadata', async () => {
  const {html} = await harness().page({q: 'brain'});
  assert.match(html, /href="\/studio\/courses\/second%20%26%20two"/);
  assert.match(html, /2 content items · NEU-202/);
  assert.doesNotMatch(html, /href="\/studio\/courses\/first\/one\?x=1"/);
});

test('whitespace is normalized, bounded, and escaped in the search field', async () => {
  const h = harness();
  const normalized = await h.page({q: '  bRaIn \t MRI  '});
  assert.match(normalized.html, /value="bRaIn MRI"/);
  assert.match(normalized.html, /1 of 3 courses/);
  const unsafe = await h.page({q: '<img src=x onerror="boom">'});
  assert.doesNotMatch(unsafe.html, /<img src=x/);
  assert.match(unsafe.html, /&lt;img src=x onerror=&quot;boom&quot;&gt;/);
  const long = await h.page({q: 'x'.repeat(400)});
  assert.match(long.html, new RegExp(`value="${'x'.repeat(80)}"`));
  assert.doesNotMatch(long.html, new RegExp(`value="${'x'.repeat(81)}`));
});

test('non-string and repeated q values fall back to the full authorized list', async () => {
  const h = harness();
  for (const q of [null, 42, {value: 'brain'}, ['brain', 'chest'], ['brain']]) {
    const {html} = await h.page({q});
    assert.match(html, /<p role="status">3 courses<\/p>/);
    assert(html.includes('Chest Basics') && html.includes('Brain MRI') && html.includes('Abdomen'));
    assert.doesNotMatch(html, /Clear search/);
  }
});

test('no courses and no matches are distinct honest states with a clear path', async () => {
  const empty = await harness([]).page({q: 'brain'});
  assert.match(empty.html, /No courses yet\. Select New course to begin\./);
  assert.doesNotMatch(empty.html, /No courses match this search/);
  const missing = await harness().page({q: 'unmatched'});
  assert.match(missing.html, /0 of 3 courses/);
  assert.match(missing.html, /No courses match this search/);
  assert.match(missing.html, /href="\/studio\/courses">Clear search<\/a>/);
  assert.doesNotMatch(missing.html, /No courses yet/);
});

test('authentication and snapshot scope are unchanged and precede filtering', async () => {
  const h = harness();
  await h.page({q: 'brain'});
  assert.deepEqual(h.calls, [
    {kind: 'auth', path: '/studio/courses'},
    {kind: 'snapshot', actor: {userId: 'edu:synthetic-author', externalSubject: 'sites:synthetic-author', email: 'synthetic@example.invalid', displayName: 'Synthetic'}},
  ]);
  const denied = harness(courses, true);
  await assert.rejects(denied.page({q: 'brain'}), /Authentication required/);
  assert.deepEqual(denied.calls, [{kind: 'auth', path: '/studio/courses'}]);
});

test('new1 creation keeps its notice, form scopes and template choice without search', async () => {
  const h = harness();
  const {html} = await h.page({new: '1', q: 'brain'});
  assert.match(html, /Your course stays private until its release is reviewed and explicitly published/);
  assert.match(html, /data-form="create"/);
  assert.match(html, /data-form="template"/);
  assert.equal((html.match(/data-scope=/g) ?? []).length, 2);
  assert.match(html, /edu:synthetic-author/);
  assert.match(html, /synthetic-org/);
  assert.doesNotMatch(html, /studio-course-search|Search courses|role="search"/);
  assert.match(html, /href="\/studio\/courses">Back to courses<\/a>/);
  assert.deepEqual(h.calls.map(call => call.kind), ['auth', 'snapshot']);
});
