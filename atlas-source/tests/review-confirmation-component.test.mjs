import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { test } from 'node:test';
import { runInNewContext } from 'node:vm';
import { build } from '../scripts/workspace-component-test-build.mjs';

const result = await build({
  entryPoints: ['app/review/body/body-decision-editor.tsx'],
  bundle: true, platform: 'node', format: 'cjs', write: false,
});
const require = createRequire(import.meta.url);
const module = { exports: {} };
runInNewContext(result.outputFiles[0].text, {
  module, exports: module.exports, require,
  process: { env: { NODE_ENV: 'test' } },
  URL, TextEncoder, AbortController, console,
});
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');

test('body worksheet renders all criteria and only one confirmation checkbox', () => {
  const checklist = [
    { id: 'one', label: 'Exact source geometry' },
    { id: 'two', label: 'Revision-bound teaching copy' },
  ];
  const draft = {
    status: 'draft', reviewer: '', qualification: '', scope: '', notes: '',
    checks: { one: false, two: false }, evidence: [], issues: [], attested: false,
  };
  const html = renderToStaticMarkup(React.createElement(
    module.exports.BodyDecisionFields,
    { draft, checklist, disabled: false, change() {} },
  ));
  assert.match(html, /Exact source geometry/);
  assert.match(html, /Revision-bound teaching copy/);
  assert.match(html, /Review all 2 criteria/);
  assert.match(html, /I personally performed the stated review/);
  assert.equal((html.match(/type="checkbox"/g) ?? []).length, 1);
});
