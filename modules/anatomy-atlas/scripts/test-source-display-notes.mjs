import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { test } from 'node:test';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';
import { build } from './workspace-component-test-build.mjs';

const require = createRequire(import.meta.url);
const { renderToStaticMarkup } = require('react-dom/server');
const built = await build({
  stdin: {
    contents: "export { splitSourceDisplayNotes } from './lib/source-display-notes'; export { SourceDisplayNotes } from './app/source-display-notes';",
    resolveDir: process.cwd(),
    loader: 'tsx',
  },
  bundle: true,
  platform: 'node',
  format: 'cjs',
  write: false,
});
const scope = { exports: {} };
runInNewContext(built.outputFiles[0].text, {
  module: scope,
  exports: scope.exports,
  require,
});
const { splitSourceDisplayNotes, SourceDisplayNotes } = scope.exports;
const sentence = (name) =>
  `Display aggregate excludes the separately selectable ${name} surface. Source coordinates are unchanged.`;
const warnings = 'Independent anatomical and clinical review pending. Segment boundaries and clinical accuracy are unvalidated.';
const names = ['hepatic artery proper', 'right hepatic vein', 'left hepatic vein', 'adjacent branch', 'small vessel'];
const technical = names.map(sentence).join(' ');
const plain = (note) => ({ visibleNote: note, sourceDetails: '', excludedCount: 0 });

test('only a complete repeated technical suffix is separated', () => {
  for (const note of ['', warnings, sentence(names[0]), `${warnings} ${sentence(names[0])}`]) {
    assert.deepEqual({ ...splitSourceDisplayNotes(note) }, plain(note));
  }
  for (const count of [2, 5]) {
    const suffix = names.slice(0, count).map(sentence).join(' ');
    for (const prefix of ['', warnings]) {
      const note = prefix ? `${prefix} ${suffix}` : suffix;
      const result = splitSourceDisplayNotes(note);
      assert.deepEqual({ ...result }, {
        visibleNote: prefix,
        sourceDetails: suffix,
        excludedCount: count,
      });
      assert.equal(
        [result.visibleNote, result.sourceDetails].filter(Boolean).join(' '),
        note,
        'The split reconstructs the exact source note',
      );
    }
  }
});

test('mixed or altered source text stays fully visible', () => {
  const first = sentence(names[0]);
  const second = sentence(names[1]);
  for (const note of [
    `${warnings} ${first} Clinical warning between technical sentences. ${second}`,
    `${warnings} ${first} ${second} Clinical warning after the suffix.`,
    `${warnings} ${first} ${second.replace('Source coordinates are unchanged.', 'Source coordinates may have changed.')}`,
    `${warnings} ${first}  ${second}`,
    `${warnings}${first} ${second}`,
    `${warnings} ${first}\n${second}`,
  ]) {
    assert.deepEqual({ ...splitSourceDisplayNotes(note) }, plain(note));
  }
});

test('native disclosure preserves warnings and escapes source names', () => {
  const hostile = '<script>alert("source")</script> & adjacent';
  const note = `${warnings} ${sentence(hostile)} ${sentence('other <surface> & vein')}`;
  const html = renderToStaticMarkup(require('react').createElement(SourceDisplayNotes, { note }));
  assert.match(html, /<details\b/);
  assert.doesNotMatch(html, /<details[^>]*\bopen\b/);
  assert.match(html, /<summary>Source representation · 2 separated structures<\/summary>/);
  assert.ok(html.indexOf(warnings) < html.indexOf('<details'), 'Warnings precede the disclosure');
  const details = html.slice(html.indexOf('<details'));
  assert.doesNotMatch(details, /Independent anatomical and clinical review pending/);
  assert.doesNotMatch(html, /<script>|<surface>/);
  assert.match(details, /&lt;script&gt;alert\(&quot;source&quot;\)&lt;\/script&gt; &amp; adjacent/);
  assert.match(details, /other &lt;surface&gt; &amp; vein/);
  assert.equal((details.match(/Source coordinates are unchanged\./g) || []).length, 2);

  const ordinary = renderToStaticMarkup(require('react').createElement(SourceDisplayNotes, { note: warnings }));
  assert.match(ordinary, /Independent anatomical and clinical review pending/);
  assert.doesNotMatch(ordinary, /<details\b/);
  const one = renderToStaticMarkup(require('react').createElement(SourceDisplayNotes, { note: sentence(names[0]) }));
  assert.doesNotMatch(one, /<details\b/);
});

test('actual three-structure liver suffix renders while its warning remains visible', () => {
  const result = splitSourceDisplayNotes(`${warnings} ${technical}`);
  assert.equal(result.excludedCount, 5);
  const source = require('node:fs').readFileSync(new URL('../lib/organ-anatomy-curriculum.ts', import.meta.url), 'utf8');
  const match = source.match(/const liverSourceCoverageNote =\s*'([^']+)';/);
  assert.ok(match, 'The current liver coverage note remains present');
  assert.equal(splitSourceDisplayNotes(`${warnings} ${match[1]}`).excludedCount, 3);
});

test('Body Explorer passes the actual content note to the component', async () => {
  const source = await readFile(new URL('../app/body-explorer.tsx', import.meta.url), 'utf8');
  const ast = ts.createSourceFile('body-explorer.tsx', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  let importFound = false;
  let callFound = false;
  const visit = (node) => {
    if (ts.isImportDeclaration(node) && node.moduleSpecifier.text === './source-display-notes') {
      importFound = node.importClause?.namedBindings?.elements?.some((item) => item.name.text === 'SourceDisplayNotes') || false;
    }
    if (ts.isJsxSelfClosingElement(node) && node.tagName.getText(ast) === 'SourceDisplayNotes') {
      callFound = node.attributes.properties.some((item) =>
        ts.isJsxAttribute(item) &&
        item.name.text === 'note' &&
        item.initializer?.expression?.getText(ast) === 'content.note');
    }
    ts.forEachChild(node, visit);
  };
  visit(ast);
  assert.ok(importFound, 'Body Explorer imports the rendered component');
  assert.ok(callFound, 'Body Explorer passes the current selected content note');
});
