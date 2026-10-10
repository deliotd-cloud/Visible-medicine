import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {test} from 'node:test';

const require = createRequire(import.meta.url);
const postcss = require('postcss');
const css = postcss.parse(await readFile(new URL('../app/study-surface.css', import.meta.url), 'utf8'));
const short = ".body-app[data-presentation='panel'][data-panel-short='true']";
const surface = `${short} > [data-study-surface='inline'].eye-layers-dialog`;
const workbench = `${short} .atlas-inline-study .eye-layer-workbench`;
const controls = `${short} .atlas-inline-study .eye-layer-controls`;

function declarations(selector, media) {
  const found = [];
  css.walkRules(selector, rule => {
    if (rule.selector !== selector) return;
    const parent = rule.parent;
    if (media === null ? parent.type !== 'root' : parent.type !== 'atrule' || parent.name !== 'media' || parent.params.replaceAll(' ', '') !== media) return;
    found.push(Object.fromEntries(rule.nodes.filter(node => node.type === 'decl').map(node => [node.prop, node.value])));
  });
  assert(found.length > 0, `${selector} must have a ${media ?? 'unscoped'} rule`);
  return Object.assign({}, ...found);
}

test('short desktop study keeps a bounded side-by-side model and independently scrolling controls', () => {
  const desktop = '(min-width:701px)';
  const body = declarations(`${short}:has(> .atlas-inline-study:not([hidden]))`, desktop);
  const study = declarations(surface, desktop);
  const grid = declarations(workbench, desktop);
  const rail = declarations(controls, desktop);

  assert.equal(body['overflow-y'], 'hidden');
  assert.equal(study.flex, '1 1 0');
  assert.match(study['grid-template-rows'], /^auto minmax\(max\(18rem,calc\(200px \+ 10rem\)\),1fr\)$/);
  assert.equal(study['overflow-y'], 'auto', 'tiny hosts and enlarged desktop text must remain scrollable');
  assert.equal(grid['grid-template-columns'], 'minmax(0,1fr) 260px');
  assert.equal(grid['grid-template-rows'], 'minmax(0,1fr)');
  assert.equal(rail['overflow-y'], 'auto');
  assert.equal(rail['min-height'], '0');
  for (const selector of [surface, workbench, controls]) {
    const unscoped = [];
    css.walkRules(selector, rule => { if (rule.selector === selector && rule.parent.type === 'root') unscoped.push(rule); });
    assert.equal(unscoped.length, 0, `${selector} must not override desktop from an unscoped short-panel rule`);
  }
});

test('narrow study remains in document flow with a stable canvas after text enlargement', () => {
  const mobile = '(max-width:700px)';
  const study = declarations('.body-app > [data-study-surface=\'inline\'].eye-layers-dialog', mobile);
  const grid = declarations('.atlas-inline-study .eye-layer-workbench', mobile);
  const viewport = declarations('.atlas-inline-study .eye-layer-viewport', mobile);
  const rail = declarations('.atlas-inline-study .eye-layer-controls', mobile);

  assert.equal(study.flex, '1 0 auto');
  assert.equal(study.overflow, 'visible');
  assert.equal(grid['grid-template-columns'], 'minmax(0,1fr)');
  assert.equal(grid['grid-template-rows'], 'auto auto');
  assert.match(viewport['grid-template-rows'], /^auto max\(calc\(200px \+ 2rem\),14\.5rem\) auto$/);
  assert.equal(rail.overflow, 'visible');
});
