import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const source = readFileSync(new URL('../components/LearnerPortfolio.tsx', import.meta.url), 'utf8');
const page = readFileSync(new URL('../app/my-learning/page.tsx', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
const module = { exports: {} };
new Function('require', 'module', 'exports', compiled)(name => require(name), module, module.exports);

test('learning sections expose separate anchor targets while retaining the existing record anchor', () => {
  const html = renderToStaticMarkup(React.createElement(module.exports.LearnerPortfolio, {
    initialPortfolio: { notes: [], reviews: [], completions: [] },
    resources: [{ resourceType: 'atlas', resourceId: 'ct-head', label: 'Atlas · CT head' }],
  }));
  for (const id of ['learning-record', 'notes', 'revision', 'completions']) {
    assert.match(html, new RegExp(`id="${id}"`));
    if (id !== 'learning-record') assert.match(page, new RegExp(`href="#${id}"`));
  }
  assert.equal((html.match(/<details\b/g) ?? []).length, 2);
  assert.equal((html.match(/<form\b/g) ?? []).length, 2, 'closed native details must retain mounted draft forms');
  assert.match(html, /Write a note/);
  assert.match(html, /Schedule revision/);
  assert.doesNotMatch(html, /Patient identifiers are blocked/);
  assert.match(html, /Keep patient names, identifiers and clinical details out/);
  assert.match(page, /savedLearningHref\(item,/);
  assert.doesNotMatch(page, /Last position \{item\.lastPosition\}/);
});
