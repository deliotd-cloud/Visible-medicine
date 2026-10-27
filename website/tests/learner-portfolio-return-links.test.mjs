import {portfolioPagination} from './learner-portfolio-pagination-loader.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildSync } from 'esbuild';

const site = fileURLToPath(new URL('../', import.meta.url));
const require = createRequire(resolve(site, 'package.json'));
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const ts = require('typescript');
const helper = buildSync({ entryPoints: [resolve(site, 'lib/atlas-learning-resources.ts')], bundle: true, platform: 'node', format: 'cjs', write: false });
const helperModule = { exports: {} };
new Function('module', 'exports', 'require', helper.outputFiles[0].text)(helperModule, helperModule.exports, require);
const source = readFileSync(resolve(site, 'components/LearnerPortfolio.tsx'), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
const componentModule = { exports: {} };
new Function('module', 'exports', 'require', compiled)(componentModule, componentModule.exports,
  id => id === '../lib/learner-portfolio-pagination' ? portfolioPagination : id === '../lib/learning-draft-navigation.ts' ? { registerLearningDraftGuard: () => () => {} } : require(id));

const choices = (progress = [], enrolments = []) => helperModule.exports.atlasLearningResources(progress, enrolments);
const find = (resources, type, id) => resources.find(row => row.resourceType === type && row.resourceId === id);
const note = (resourceType, resourceId, title) => ({ id: title, resourceType, resourceId, title, body: 'Private educational observation', updatedAt: '2026-10-27' });
const review = (resourceType, resourceId, title) => ({ id: title, resourceType, resourceId, title, prompt: 'Recall anatomy', dueAt: '2026-10-28', intervalDays: 7, status: 'due', updatedAt: '2026-10-27' });
function render(portfolio, resources) {
  return renderToStaticMarkup(React.createElement(componentModule.exports.LearnerPortfolio, { initialPortfolio: portfolio, resources }));
}
function card(html, title) {
  return [...html.matchAll(/<article\b[^>]*>(.*?)<\/article>/gs)].find(([, content]) => content.includes(`<h4>${title}</h4>`))?.[1];
}

test('actual choices carry canonical available Atlas and course returns', () => {
  const resources = choices(
    [{ resourceType: 'atlas', resourceSlug: 'mr-knee' }, { resourceType: 'atlas', resourceSlug: 'unknown-atlas' }, { resourceType: 'course', resourceSlug: 'foundations-ct-head' }],
    [{ slug: 'course-release', title: 'Course release', resumeWorkbookId: 'wb_01:part-2', firstWorkbookId: 'wb-first' },
      { slug: 'first-only', title: 'First only', resumeWorkbookId: '../bad', firstWorkbookId: 'wb-first' },
      { slug: 'details-only', title: 'Details only', resumeWorkbookId: null, firstWorkbookId: null },
      { slug: 'evil/route', title: 'Invalid route', resumeWorkbookId: 'wb-first' }],
  );
  assert.equal(find(resources, 'atlas', 'ct-head').href, '/atlas/ct-head');
  assert.equal(find(resources, 'atlas', 'mri-head').href, '/atlas/mri-head');
  assert.equal(find(resources, 'atlas', '3d:foot').href, '/atlas/3d?region=foot');
  assert.equal(find(resources, 'atlas', 'head-neck-3d').href, '/atlas/head-neck-3d');
  assert.equal(find(resources, 'atlas', 'mr-knee').href, undefined, 'preview has no direct return');
  assert.equal(find(resources, 'atlas', 'unknown-atlas').href, undefined);
  assert.equal(find(resources, 'course', 'foundations-ct-head').href, '/courses/foundations-ct-head');
  assert.equal(find(resources, 'course', 'course-release').href, '/learn/course-release/wb_01%3Apart-2');
  assert.equal(find(resources, 'course', 'first-only').href, '/learn/first-only/wb-first');
  assert.equal(find(resources, 'course', 'details-only').href, '/courses/details-only');
  assert.equal(find(resources, 'course', 'evil/route').href, undefined);
});

test('actual portfolio links only exact known resource matches and leaves input unchanged', () => {
  const resources = choices([{ resourceType: 'atlas', resourceSlug: 'mr-knee' }],
    [{ slug: 'course-release', title: 'Course release', resumeWorkbookId: 'wb_01', firstWorkbookId: 'wb-first' }]);
  const portfolio = {
    notes: [note('atlas', 'mri-head', 'MRI note'), note('atlas', '3d:foot', 'Foot note'),
      note('atlas', 'course-release', 'Wrong type'), note('atlas', 'mr-knee', 'Preview note'),
      note('atlas', 'javascript:alert(1)', 'Malicious ID'), note('case', 'mri-head', 'Unknown case')],
    reviews: [review('course', 'course-release', 'Course review'), review('atlas', 'mri-head', 'MRI review'),
      review('course', 'mri-head', 'Wrong course type'), review('atlas', '../head', 'Unknown review')],
    completions: [],
  };
  const original = JSON.stringify(portfolio);
  const html = render(portfolio, resources);
  assert.match(card(html, 'MRI note'), /Atlas · MRI head/);
  assert.match(card(html, 'MRI note'), /href="\/atlas\/mri-head"[^>]*>Open resource/);
  assert.match(card(html, 'Foot note'), /href="\/atlas\/3d\?region=foot"[^>]*>Open resource/);
  assert.match(card(html, 'Course review'), /href="\/learn\/course-release\/wb_01"[^>]*>Open resource/);
  assert.match(card(html, 'MRI review'), /href="\/atlas\/mri-head"[^>]*>Open resource/);
  for (const title of ['Wrong type', 'Preview note', 'Malicious ID', 'Unknown case', 'Wrong course type', 'Unknown review']) {
    assert.doesNotMatch(card(html, title), /Open resource|href=/, title);
  }
  assert.match(card(html, 'Malicious ID'), /atlas · javascript:alert\(1\)/);
  assert.equal(JSON.stringify(portfolio), original);
});
