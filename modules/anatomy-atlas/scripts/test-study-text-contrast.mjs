import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import postcss from 'postcss';

// Source guard, not a substitute for computed-style/browser acceptance.
const css = postcss.parse(readFileSync(new URL('../app/body-explorer.css', import.meta.url), 'utf8'));
const palette = readFileSync(new URL('../app/globals.css', import.meta.url), 'utf8');
const token = name => palette.match(new RegExp(`${name}:\\s*(#[a-f0-9]{6})`, 'i'))?.[1];
const luminance = hex => {
  const values = hex.slice(1).match(/../g).map(value => parseInt(value, 16) / 255)
    .map(value => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
  return values[0] * 0.2126 + values[1] * 0.7152 + values[2] * 0.0722;
};
const ratio = (a, b) => (Math.max(luminance(a), luminance(b)) + 0.05) / (Math.min(luminance(a), luminance(b)) + 0.05);
function declarations(selector, property) {
  const values = [];
  css.walkRules(selector, rule => rule.walkDecls(property, declaration => values.push(declaration.value)));
  assert(values.length, `Missing ${selector} ${property}`);
  return values;
}
const targets = [
  ['.body-system-bar > div', '--vm-ink'],
  ['.body-selection-heading', '--vm-muted'],
  ['.body-content-tabs .eyebrow', '--vm-muted'],
  ['.body-content-tabs ul', '--vm-ink'],
  ['.body-structure-browser summary', '--vm-muted'],
];
for (const [selector, name] of targets) {
  assert(declarations(selector, 'color').every(value => value === `var(${name})`), selector);
  for (const background of ['#ffffff', '#f9fbf7', token('--vm-ivory')]) {
    assert(ratio(token(name), background) >= 4.5, `${selector} on ${background}`);
  }
}
assert(declarations('.body-content-tabs .eyebrow', 'font-size').every(value => value === '0.75rem'));
assert(declarations('.body-content-tabs ul', 'font-size').every(value => value === '0.875rem'));
assert.equal(ratio('#000000', '#ffffff'), 21);
assert.equal(ratio('#ffffff', '#ffffff'), 1);
for (const old of ['#87917e', '#84947a', '#8e9b81', '#7c8b72', '#769063']) {
  assert(ratio(old, '#ffffff') < 4.5, `Former failing colour ${old}`);
}
console.log(JSON.stringify({selectors: targets.length, backgrounds: 3, oldColourNegatives: 5,
  inkOnWhite: ratio(token('--vm-ink'), '#ffffff'), mutedOnWhite: ratio(token('--vm-muted'), '#ffffff')}));
