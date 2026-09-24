import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ts from 'typescript';

const require = createRequire(import.meta.url);

function compile(path: string, mocks: Record<string, unknown>) {
  const source = readFileSync(new URL('../' + path, import.meta.url), 'utf8');
  const code = ts.transpileModule(source, { compilerOptions: {
    jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true,
  } }).outputText;
  const loadedModule = { exports: {} as Record<string, unknown> };
  new Function('require', 'module', 'exports', code)(
    (name: string) => name in mocks ? mocks[name] : require(name), loadedModule, loadedModule.exports,
  );
  return loadedModule.exports as Record<string, (props: Record<string, unknown>) => React.ReactElement>;
}

const Link = ({ children, ...props }: React.PropsWithChildren<React.AnchorHTMLAttributes<HTMLAnchorElement>>) => React.createElement('a', props, children);
const router = { pushes: [] as string[], push(value: string) { this.pushes.push(value); }, refresh() {} };
const templates = [{ id: 'blank', name: 'Blank course' }];

function formModule(react: typeof React = React) {
  return compile('components/StudioForms.tsx', {
    react,
    'next/navigation': { useRouter: () => router },
    '@/lib/studio-templates': { STUDIO_COURSE_TEMPLATES: templates },
  });
}

const course = {
  id: 'course/with ? symbols', code: 'RAD-101', title: 'Chest imaging', description: 'A sufficiently detailed educational description.',
  status: 'draft', moduleId: 'module-1', workbookCount: 1, releaseCount: 1, enrolledLearners: 0,
};
const workbook = {
  id: 'workbook/with ? symbols', courseId: course.id, moduleId: 'module-1', courseTitle: course.title, moduleTitle: 'Module',
  title: 'Chest cases', mode: 'assessment', status: 'draft', version: 1, durationMinutes: 60, caseCount: 2,
};
const release = {
  id: 'release/with ? symbols', courseId: course.id, organizationId: 'org-1', code: course.code, slug: 'chest-imaging', title: course.title,
  summary: course.description, level: 'Intermediate', duration: 'Self-paced', outcomes: ['Review chest imaging'], publisher: 'Fixture institution',
  publisherKind: 'institution', visibility: 'private', accessModel: 'invitation', priceMinor: 0, currency: 'GBP', enrolmentOpen: true,
  status: 'draft', version: 2, publishedAt: null, workbookCount: 1, firstWorkbookId: workbook.id, resumeWorkbookId: null,
  liveWorkbookId: null, liveStartedAt: null, enrolled: false, createdBy: 'educator-1', reviewedBy: null, reviewNotes: '',
  updatedAt: '2026-09-21T12:00:00.000Z', workbookIds: [workbook.id],
};

test('course editor opens on Content with Preview and Review hidden', () => {
  const forms = formModule();
  const { StudioCourseEditor } = compile('components/StudioCourseEditor.tsx', {
    'next/link': Link,
    './StudioForms': forms,
  });
  const html = renderToStaticMarkup(React.createElement(StudioCourseEditor, { course, workbooks: [workbook], releases: [release] }));
  assert.match(html, /<button type="button" aria-pressed="true" aria-controls="course-content">Content<\/button>/);
  assert.match(html, /<div id="course-content">/);
  assert.match(html, /<section id="course-preview" class="course-editor-panel" hidden="">/);
  assert.match(html, /<section id="course-review" class="course-editor-panel" hidden="">/);
});

test('outline and release preview links encode exact identifiers', () => {
  const forms = formModule();
  const { StudioCourseEditor } = compile('components/StudioCourseEditor.tsx', {
    'next/link': Link,
    './StudioForms': forms,
  });
  const html = renderToStaticMarkup(React.createElement(StudioCourseEditor, { course, workbooks: [workbook], releases: [release] }));
  assert.ok(html.includes(`href="/studio/workbooks/${encodeURIComponent(workbook.id)}/builder"`));
  assert.ok(html.includes(`href="/studio/releases/${encodeURIComponent(release.id)}/preview"`));
});

test('an empty course cannot render release settings', () => {
  const forms = formModule();
  const { StudioCourseEditor } = compile('components/StudioCourseEditor.tsx', {
    'next/link': Link,
    './StudioForms': forms,
  });
  const html = renderToStaticMarkup(React.createElement(StudioCourseEditor, { course: { ...course, workbookCount: 0 }, workbooks: [], releases: [] }));
  assert.ok(html.includes('Add course content first.'));
  assert.ok(!html.includes('class="course-release-settings"'));
  assert.ok(!html.includes('Catalogue title'));
});

function statefulReact(replacements: Record<string, unknown>) {
  return {
    ...React,
    useEffect: () => undefined,
    useRef: (value: unknown) => ({ current: value }),
    useState: (initial: unknown) => [Object.hasOwn(replacements, String(initial)) ? replacements[String(initial)] : initial, () => undefined],
  } as unknown as typeof React;
}

test('assessment duration is conditional on assessment content type', () => {
  const teachingForms = formModule();
  const teaching = renderToStaticMarkup(React.createElement(teachingForms.CreateWorkbookForm, { course }));
  assert.match(teaching, /<label hidden=""><span>Assessment duration \(minutes\)<\/span><input[^>]*disabled=""/);

  const assessmentForms = formModule(statefulReact({ teaching: 'assessment' }));
  const assessment = renderToStaticMarkup(React.createElement(assessmentForms.CreateWorkbookForm, { course }));
  assert.match(assessment, /<label><span>Assessment duration \(minutes\)<\/span><input/);
  assert.ok(!assessment.match(/name="durationMinutes"[^>]*disabled/));
});

test('release defaults stay private and invitation-only while price is paid-only', () => {
  const invitationForms = formModule();
  const invitation = renderToStaticMarkup(React.createElement(invitationForms.ReleaseDraftForm, { course, workbooks: [workbook] }));
  assert.match(invitation, /<option value="private" selected="">Private<\/option>/);
  assert.match(invitation, /<option value="invitation" selected="">Invitation<\/option>/);
  assert.match(invitation, /<div class="two-fields" hidden=""><label><span>Price<\/span><input[^>]*disabled=""/);

  const paidForms = formModule(statefulReact({ invitation: 'paid' }));
  const paid = renderToStaticMarkup(React.createElement(paidForms.ReleaseDraftForm, { course, workbooks: [workbook] }));
  assert.match(paid, /<div class="two-fields"><label><span>Price<\/span><input/);
  assert.ok(!paid.match(/name="price"[^>]*disabled/));
  assert.ok(!paid.match(/name="currency"[^>]*disabled/));
});

test('course and content creation navigate straight to their editors with encoded ids', async () => {
  router.pushes.length = 0;
  const hookReact = statefulReact({});
  const forms = formModule(hookReact);
  const originalFetch = globalThis.fetch;
  const OriginalFormData = globalThis.FormData;
  const responses = [
    { courseId: 'new/course ? id' },
    { workbookId: 'new/workbook ? id' },
  ];
  class FixtureFormData {
    get(name: string) { return name === 'mode' ? 'teaching' : name === 'durationMinutes' ? '60' : 'Fixture'; }
    getAll() { return []; }
    keys() { return [][Symbol.iterator](); }
  }
  globalThis.FormData = FixtureFormData as unknown as typeof FormData;
  globalThis.fetch = (async () => ({ ok: true, json: async () => responses.shift() })) as unknown as typeof fetch;
  try {
    for (const element of [forms.CreateCourseForm({}), forms.CreateWorkbookForm({ course })]) {
      const renderedForm = (element.type as (props: Record<string, unknown>) => React.ReactElement<{ onSubmit: (event: { preventDefault: () => void; currentTarget: Record<string, never> }) => Promise<void> }>)(element.props as Record<string, unknown>);
      await renderedForm.props.onSubmit({ preventDefault() {}, currentTarget: {} });
    }
  } finally {
    globalThis.fetch = originalFetch;
    globalThis.FormData = OriginalFormData;
  }
  assert.deepEqual(router.pushes, [
    `/studio/courses/${encodeURIComponent('new/course ? id')}`,
    `/studio/workbooks/${encodeURIComponent('new/workbook ? id')}/builder`,
  ]);
});

test('release preview SSR authenticates the exact encoded path and performs no mutation', async () => {
  const requested: string[] = [];
  const snapshots: unknown[] = [];
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async () => { throw new Error('Preview SSR must not mutate through fetch'); }) as typeof fetch;
  const { default: ReleasePreviewPage } = compile('app/studio/releases/[releaseId]/preview/page.tsx', {
    'next/link': Link,
    'next/navigation': { notFound: () => { throw new Error('unexpected notFound'); } },
    '../../../../chatgpt-auth': { requireChatGPTUser: async (path: string) => { requested.push(path); return { userId: 'user-1', email: '', displayName: '' }; } },
    '@/lib/education-platform': { getStudioSnapshot: async (auth: unknown) => { snapshots.push(auth); return { releases: [release] }; } },
    '@/lib/pilot-readiness': { releaseReadiness: () => ({ complete: 0, checks: [] }) },
  });
  try {
    const tree = await ReleasePreviewPage({ params: Promise.resolve({ releaseId: encodeURIComponent(release.id) }) });
    const html = renderToStaticMarkup(tree);
    assert.deepEqual(requested, [`/studio/releases/${encodeURIComponent(release.id)}/preview`]);
    assert.equal(snapshots.length, 1);
    assert.match(html, /<button class="primary-button" disabled="">Preview only<\/button>/);
    assert.ok(!html.includes('<form'));
  } finally {
    globalThis.fetch = originalFetch;
  }
});
