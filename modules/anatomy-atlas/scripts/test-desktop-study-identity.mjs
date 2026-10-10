import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import postcss from 'postcss';

// CSS/source contract; actual computed layout is checked separately in browser.
const css = postcss.parse(readFileSync('app/atlas-workspace.css', 'utf8'));
const prefix = '.body-layout > .body-info';
const expected = new Map([
  [`${prefix} .body-selection-notice`, {margin: '4px 0 8px', padding: '6px 8px'}],
  [`${prefix} .body-selection-heading`, {'margin-top': '10px'}],
  [`${prefix} h2[data-structure-study-heading]`, {
    'font-size': '1.25rem', 'line-height': '1.3', 'letter-spacing': '-0.015em',
    margin: '6px 0 10px', 'overflow-wrap': 'anywhere',
  }],
  [`${prefix} .body-selection-actions`, {'margin-bottom': '8px'}],
]);
for (const [selector, declarations] of expected) {
  const matches = [];
  css.walkRules(selector, rule => matches.push(rule));
  assert.equal(matches.length, 1, selector);
  const rule = matches[0];
  assert.equal(rule.parent.name, 'media');
  assert.equal(rule.parent.params, '(min-width: 701px)');
  assert.deepEqual(Object.fromEntries(rule.nodes.map(node => [node.prop, node.value])), declarations);
}
const explorer = readFileSync('app/body-explorer.tsx', 'utf8');
assert.match(explorer, /<h2 data-structure-study-heading tabIndex=\{-1\}>\{selected.name\}<\/h2>/);
assert.match(explorer, /\{bodySystems\[selected.system\].name\} · \{selected.fmaId\}/);
assert.match(explorer, /<ReviewStatus structureId=\{selected.id\} \/>/);
const notice = readFileSync('app/body-selection-notice.tsx', 'utf8');
assert.match(notice, /<output aria-live="polite" aria-atomic="true">/);
assert.match(notice, /\{message\}/);
console.log('PASS: compact desktop identity, complete heading/ID/review and live feedback retained.');
