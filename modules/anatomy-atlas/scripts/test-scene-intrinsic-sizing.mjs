import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import postcss from 'postcss';

const styles = postcss.parse(['body-explorer.css', 'atlas-workspace.css']
  .map(name => readFileSync(new URL(`../app/${name}`, import.meta.url), 'utf8')).join('\n'));

// Bounded CSS cascade contract, not a substitute for live resize/GPU testing.
function declarations(selector, width, height) {
  const result = {};
  styles.walkRules(rule => {
    if (!rule.selectors.includes(selector)) return;
    for (let parent = rule.parent; parent; parent = parent.parent) {
      if (parent.type !== 'atrule') continue;
      if (parent.name !== 'media') return;
      const match = /^\((min|max)-(width|height): (\d+)px\)$/.exec(parent.params);
      if (!match) return;
      const size = match[2] === 'width' ? width : height;
      if (match[1] === 'max' ? size > +match[3] : size < +match[3]) return;
    }
    rule.walkDecls(declaration => { result[declaration.prop] = declaration.value; });
  });
  return result;
}

for (const [width, height] of [[1280, 720], [1024, 768], [390, 844], [320, 740], [320, 568], [844, 390]]) {
  test(`scene intrinsic isolation with accessible overflow at ${width}x${height}`, () => {
    const scene = declarations('.body-canvas > .body-scene', width, height);
    assert.equal(scene.contain, 'size', 'drawing-buffer dimensions cannot inflate the grid; no paint containment');
    assert.equal(scene['min-height'], '0');
    assert.equal(scene['grid-row'], '2');
    const canvas = declarations('.body-canvas', width, height);
    assert.equal(canvas['grid-template-rows'], 'auto minmax(160px, 1fr) auto auto auto');
    assert.equal(canvas['min-height'], 'min-content', 'wrapped controls still determine required space');
    assert.equal(declarations('.body-workspace', width, height)['overflow-y'], 'auto', 'short/enlarged views remain scrollable');
  });
}

test('intrinsic containment applies only to the root scene, never nested study dialogs', () => {
  const selectors = [];
  styles.walkDecls('contain', declaration => {
    if (declaration.value.split(/\s+/).includes('size')) selectors.push(declaration.parent.selector);
  });
  assert.deepEqual(selectors, ['.body-canvas > .body-scene']);
});
