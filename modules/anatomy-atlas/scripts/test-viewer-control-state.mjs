import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import {createRequire} from 'node:module';
import ts from 'typescript';
import {transformSync} from 'esbuild';

const require = createRequire(import.meta.url);
const source = readFileSync('app/body-explorer.tsx', 'utf8');
const ast = ts.createSourceFile('body-explorer.tsx', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
const elements = [];
function visit(node) {
  if (ts.isJsxElement(node) || ts.isJsxSelfClosingElement(node)) elements.push(node);
  ts.forEachChild(node, visit);
}
visit(ast);
const opening = node => ts.isJsxElement(node) ? node.openingElement : node;
function attribute(node, name) {
  return opening(node).attributes.properties.find(p => ts.isJsxAttribute(p) && p.name.getText(ast) === name);
}
function find(predicate) {
  const matched = elements.filter(predicate);
  assert.equal(matched.length, 1, 'Exactly one production control matched');
  return matched[0];
}
function render(node, state) {
  // Execute the production JSX and event closures; only leaf UI/GPU icons are
  // replaced. This is source-level state evidence, not browser/AT acceptance.
  const code = transformSync(`exports.tree = (${node.getText(ast)});`, {
    loader: 'tsx', jsx: 'automatic', format: 'cjs',
  }).code;
  const context = {exports: {}, require, Button: 'button', Slider: 'slider', ExplodeStyleSelect: 'select',
    Tags: () => null, Eye: () => null, Focus: () => null, ...state};
  runInNewContext(code, context);
  return context.exports.tree;
}

const slider = find(node => opening(node).tagName.getText(ast) === 'Slider' && attribute(node, 'aria-valuetext'));
const selector = find(node => opening(node).tagName.getText(ast) === 'ExplodeStyleSelect');
for (const layout of ['spatial', 'extract', 'tray']) {
  for (const exam of [false, true]) for (const count of [0, 1, 15]) {
    test(`${layout}: exam=${exam}, visible=${count} synchronizes separation controls`, () => {
      let explode = 42;
      const state = {layout, exam, available: Array(count).fill({}), explode,
        setExplode: value => {explode = value;}, changeLayout: () => {}};
      const tree = render(slider, state);
      const disabled = exam || count === 0;
      assert.equal(tree.props.disabled, disabled);
      assert.equal(render(selector, state).props.disabled, disabled);
      assert.equal(tree.props['aria-valuetext'], '42%');
      assert.equal(tree.props['aria-label'], layout === 'tray' ? 'Arranged separation' :
        layout === 'extract' ? 'Selected structure separation' : 'Exploded separation');
      for (const input of [[0], [50], [100], 25]) {
        tree.props.onValueChange(input);
        assert.equal(explode, disabled ? 42 : Array.isArray(input) ? input[0] : input);
      }
      // Re-enabling a system retains the saved position, then permits changes.
      if (!exam && count === 0) {
        const restored = render(slider, {...state, available: [{}], explode});
        assert.equal(restored.props.value[0], 42);
        assert.equal(restored.props.disabled, false);
        restored.props.onValueChange([70]);
        assert.equal(explode, 70);
      }
    });
  }
}
for (const [name, variable] of [
  ['Toggle stage and selected labels', 'labels'],
  ['Fade other structures', 'isolated'],
  ['Frame selected structure', 'focus'],
]) {
  test(`${name} exposes its current state and updates after activation`, () => {
    const node = find(node => attribute(node, 'aria-label')?.initializer?.text === name);
    for (const initial of [false, true]) {
      let value = initial;
      const setter = update => {value = typeof update === 'function' ? update(value) : update;};
      const state = {labels: false, isolated: false, focus: false, selected: {}, exam: false,
        [variable]: value, setLabels: setter, setIsolated: setter, setFocus: setter, setZoom: () => {}};
      const tree = render(node, state);
      assert.equal(tree.props['aria-pressed'], initial);
      tree.props.onClick();
      const updated = render(node, {...state, [variable]: value});
      assert.equal(updated.props['aria-pressed'], !initial);
      assert.equal(updated.props['aria-label'], name, 'Toggle name stays stable');
      const html = require('react-dom/server').renderToStaticMarkup(updated);
      assert(html.includes(`aria-pressed="${!initial}"`));
      assert.equal(render(node, {...state, exam: true}).props.disabled, true);
    }
  });
}
