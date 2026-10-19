import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(resolve(root, 'package.json'));
const { build } = require('esbuild');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');

// Compile the current page and real enrolment control/policy. Only auth,
// database-backed reads, onboarding, and Next render boundaries are synthetic.
const fixture = { user: null, course: null, profile: null, profileCalls: 0, courseCalls: 0 };
globalThis.__invitationPageHoldFixture = fixture;
const stubs = {
  auth: `export async function getChatGPTUser(){return globalThis.__invitationPageHoldFixture.user;} export function chatGPTSignInPath(path){return '/sign-in?returnTo='+encodeURIComponent(path);}`,
  platform: `export async function getInvitationCourse(){globalThis.__invitationPageHoldFixture.courseCalls++;return globalThis.__invitationPageHoldFixture.course;} export async function getLearnerProfile(){globalThis.__invitationPageHoldFixture.profileCalls++;return globalThis.__invitationPageHoldFixture.profile;}`,
  navigation: `export function notFound(){throw Error('Unexpected notFound');}`,
  link: `import React from 'react';export default function Link(props){return React.createElement('a',props,props.children);}`,
  onboarding: `export function LearnerOnboardingForm(){throw Error('Held invitation must not render onboarding');}`,
};
const bundle = await build({
  entryPoints: [resolve(root, 'app/join/[code]/page.tsx')], bundle: true, write: false,
  platform: 'node', format: 'cjs', jsx: 'automatic', tsconfigRaw: {},
  external: ['react', 'react/jsx-runtime'],
  plugins: [{ name: 'synthetic-page-boundaries', setup(plugin) {
    plugin.onResolve({ filter: /^\.\.\/\.\.\/chatgpt-auth$/ }, () => ({ path: 'auth', namespace: 'stub' }));
    plugin.onResolve({ filter: /^@\/lib\/education-platform$/ }, () => ({ path: 'platform', namespace: 'stub' }));
    plugin.onResolve({ filter: /^next\/navigation$/ }, () => ({ path: 'navigation', namespace: 'stub' }));
    plugin.onResolve({ filter: /^next\/link$/ }, () => ({ path: 'link', namespace: 'stub' }));
    plugin.onResolve({ filter: /^@\/components\/LearnerOnboardingForm$/ }, () => ({ path: 'onboarding', namespace: 'stub' }));
    plugin.onResolve({ filter: /^@\/components\/CourseEnrolmentControl$/ }, () => ({ path: resolve(root, 'components/CourseEnrolmentControl.tsx') }));
    plugin.onResolve({ filter: /^@\/lib\/course-enrolment-policy$/ }, () => ({ path: resolve(root, 'lib/course-enrolment-policy.ts') }));
    plugin.onLoad({ filter: /.*/, namespace: 'stub' }, args => ({ contents: stubs[args.path], loader: 'js' }));
  } }],
});
const scope = { exports: {} };
new Function('module', 'exports', 'require', bundle.outputFiles[0].text)(scope, scope.exports, require);
const Page = scope.exports.default;
const code = 'ELV-ABCDEF123456';
const baseCourse = { id: 'release', title: 'Synthetic course', summary: 'Synthetic summary', publisher: 'Synthetic publisher', level: 'Introductory', duration: '1 hour', workbookCount: 1, slug: 'synthetic-course', firstWorkbookId: 'workbook', enrolmentOpen: true };
const user = { userId: 'synthetic-user', email: 'learner@example.invalid', displayName: 'Synthetic Learner' };

async function render({ currentUser = null, enrolled = false, profile = null }) {
  fixture.user = currentUser;
  fixture.course = { ...baseCourse, enrolled };
  fixture.profile = profile;
  fixture.profileCalls = 0;
  fixture.courseCalls = 0;
  const element = await Page({ params: Promise.resolve({ code }) });
  return renderToStaticMarkup(element);
}

function assertHeld(html) {
  assert.match(html, /Invitation enrolment unavailable/);
  assert.match(html, /temporarily unavailable during private evaluation/);
  assert.match(html, /href="\/my-learning"/);
  assert.doesNotMatch(html, /Sign in to accept|Sign in to continue|Complete your profile|Ready to join|Accept invitation|<input|ELV-ABCDEF123456/);
  assert.equal(fixture.profileCalls, 0);
  assert.equal(fixture.courseCalls, 1);
}

test('signed-out visitor sees hold before any sign-in prompt or profile read', async () => {
  assertHeld(await render({}));
});

test('signed-in visitor with incomplete profile sees hold before onboarding', async () => {
  assertHeld(await render({ currentUser: user, profile: { onboardingStatus: 'not-started' } }));
});

test('signed-in visitor with complete profile still cannot enter held invitation', async () => {
  assertHeld(await render({ currentUser: user, profile: { onboardingStatus: 'complete' } }));
});

test('enrolled learner retains Continue course', async () => {
  const html = await render({ currentUser: user, enrolled: true, profile: { onboardingStatus: 'complete' } });
  assert.match(html, /Continue course/);
  assert.match(html, /href="\/learn\/synthetic-course\/workbook"/);
  assert.doesNotMatch(html, /Invitation enrolment unavailable/);
  assert.equal(fixture.profileCalls, 1);
  assert.equal(fixture.courseCalls, 1);
});
