import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';

const css = readFileSync(new URL('../app/atlas-workspace.css', import.meta.url), 'utf8');
const bodyCss = readFileSync(new URL('../app/body-explorer.css', import.meta.url), 'utf8');
const root = css.slice(css.indexOf('/* A website-sized desktop iframe'));
const rule = (selector) => {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return root.match(new RegExp(`${escaped}\\s*\\{([^}]*)\\}`))?.[1] ?? '';
};

test('desktop density is limited to the embedded root viewer', () => {
  assert.match(root, /@media \(min-width: 1101px\) and \(min-height: 600px\)/);
  assert.match(root, /\.body-app\[data-presentation='panel'\]/);
  assert.match(root, /\.body-topbar\[data-shared-header='true'\]/);
  assert.ok(!root.includes('display: none'));
  assert.ok(!root.includes('position: absolute'));
  assert.ok(!root.includes('position: fixed'));
});

test('caption and source credit share a wrapping grid row while the model retains its own track', () => {
  const canvas = rule(".body-app[data-presentation='panel'] .body-workspace .body-canvas");
  const caption = rule(".body-app[data-presentation='panel'] .body-workspace .body-canvas > .body-canvas-caption");
  const credit = rule(".body-app[data-presentation='panel'] .body-workspace .body-canvas > .model-credit");
  assert.match(canvas, /grid-template-rows:\s*auto minmax\(max\(160px, 12rem\), 1fr\) auto auto/);
  assert.match(canvas, /grid-template-columns:\s*minmax\(0, 1fr\) auto/);
  assert.match(caption, /grid-row:\s*4/);
  assert.match(caption, /grid-column:\s*1/);
  assert.match(credit, /grid-row:\s*4/);
  assert.match(credit, /grid-column:\s*2/);
  assert.match(credit, /white-space:\s*normal/);
  assert.match(bodyCss, /\.body-workspace\s*\{\s*overflow-y:\s*auto;\s*\}/,
    'the centre pane itself must scroll when text grows, not an unrelated dialog');
  assert.match(bodyCss, /\.body-canvas\s*\{[^}]*min-height:\s*min-content;/,
    'the canvas must grow with its model and control rows rather than clip them');
});

test('large desktop text grows the model floor and keeps toolbar actions reachable', () => {
  const canvas = rule(".body-app[data-presentation='panel'] .body-workspace .body-canvas");
  const toolbar = rule(".body-app[data-presentation='panel'] .body-workspace .body-canvas > .body-toolbar");
  assert.match(canvas, /minmax\(max\(160px, 12rem\), 1fr\)/);
  assert.match(toolbar, /flex-wrap:\s*wrap/);
  assert.match(toolbar, /max-width:\s*calc\(100% - 12px\)/);
  const systemText = rule(".body-app[data-presentation='panel'] .anatomy-control-rail .body-system-bar span");
  assert.match(systemText, /min-width:\s*0/);
  assert.match(systemText, /overflow-wrap:\s*anywhere/);
  const thumb = rule(".body-app[data-presentation='panel'] .anatomy-control-rail [data-slot='switch'][data-size='default'] [data-slot='switch-thumb']");
  assert.match(thumb, /width:\s*16px/);
  assert.match(thumb, /height:\s*16px/);
  const hitArea = rule(".body-app[data-presentation='panel'] .anatomy-control-rail [data-slot='switch']::after");
  assert.match(hitArea, /inset-inline:\s*-6px/);
  assert.match(hitArea, /inset-block:\s*-13px/);
  assert.ok(32 + 2 * 6 >= 44 && 18.4 + 2 * 13 >= 44,
    'fixed switch hit area must remain at least 44px in both axes');
});

test('expanded display and inspection controls wrap rather than spill outside the rail', () => {
  const rows = rule(".body-app[data-presentation='panel'] .anatomy-control-rail :is(button, .vm-inspection-scale, .vm-opacity > div:first-child, .vm-inspection-options label)");
  assert.match(rows, /min-width:\s*0/);
  assert.match(rows, /max-width:\s*100%/);
  assert.match(rows, /flex-wrap:\s*wrap/);
  assert.match(rows, /overflow-wrap:\s*anywhere/);
  assert.match(rows, /white-space:\s*normal/);
  const slider = rule(".body-app[data-presentation='panel'] .anatomy-control-rail .vm-inspection-grid [data-slot='slider']");
  assert.match(slider, /width:\s*calc\(100% - 56px\)/);
  assert.match(slider, /margin-inline:\s*28px/);
  const sliderHitArea = rule(".body-app[data-presentation='panel'] .anatomy-control-rail .vm-inspection-grid [data-slot='slider-thumb']::after");
  assert.match(sliderHitArea, /inset:\s*-16px/);
  assert.match(sliderHitArea, /min-width:\s*44px/);
  assert.match(sliderHitArea, /min-height:\s*44px/);
});

test('embedded desktop tour places reading beside the model and keeps both scrollable', () => {
  const tour = rule(".body-app[data-presentation='panel'] .regional-tour");
  assert.match(tour, /display:\s*grid/);
  assert.match(tour, /grid-template-columns:\s*minmax\(280px, 24%\) minmax\(0, 1fr\)/);
  assert.match(tour, /grid-template-rows:\s*minmax\(max\(300px, 18rem\), 1fr\) auto/);
  assert.match(tour, /min-height:\s*0/);
  assert.match(tour, /overflow:\s*auto/);

  const panel = rule(".body-app[data-presentation='panel'] .regional-tour-panel");
  assert.match(panel, /grid-column:\s*1/);
  assert.match(panel, /grid-row:\s*1\s*\/\s*-1/);
  assert.match(panel, /display:\s*flex/);
  assert.match(panel, /flex-direction:\s*column/);
  assert.match(panel, /min-height:\s*0/);

  const canvas = rule(".body-app[data-presentation='panel'] .regional-tour-canvas");
  assert.match(canvas, /grid-column:\s*2/);
  assert.match(canvas, /grid-row:\s*1/);
  assert.match(canvas, /min-height:\s*max\(300px, 18rem\)/);
  const credit = rule(".body-app[data-presentation='panel'] .regional-tour-credit");
  assert.match(credit, /grid-column:\s*2/);
  assert.match(credit, /grid-row:\s*2/);
});

test('embedded desktop tour keeps explanation and controls reachable at large text sizes', () => {
  const explanation = rule(".body-app[data-presentation='panel'] .regional-tour-explanation");
  assert.match(explanation, /flex:\s*0 0 auto/);
  assert.match(explanation, /min-height:\s*44px/);
  assert.match(explanation, /max-height:\s*none/);
  assert.match(explanation, /overflow:\s*visible/);

  const heading = rule(".body-app[data-presentation='panel'] .regional-tour-heading");
  const output = rule(".body-app[data-presentation='panel'] .regional-tour-panel > output");
  const controls = rule(".body-app[data-presentation='panel'] .regional-tour-controls");
  assert.match(heading, /flex-shrink:\s*0/);
  assert.match(output, /flex-shrink:\s*0/);
  assert.match(controls, /flex-shrink:\s*0/);
  assert.match(controls, /flex-wrap:\s*wrap/);
  const button = rule(".body-app[data-presentation='panel'] .regional-tour-controls button");
  assert.match(button, /min-height:\s*44px/);
  assert.match(button, /max-width:\s*100%/);
  assert.match(button, /white-space:\s*normal/);
});
