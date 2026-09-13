import assert from 'node:assert/strict';
import { readFile, readdir, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';
import { build } from './workspace-component-test-build.mjs';

const require = createRequire(import.meta.url);
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const compiled = await build({
  stdin: {
    contents: `export { Slider } from './components/ui/slider';
      export { InspectionControls } from './app/inspection-controls';
      export { CutawayControls } from './app/cutaway-controls';
      export { initialInspection } from './lib/inspection-state';`,
    resolveDir: process.cwd(), loader: 'tsx',
  }, bundle: true, platform: 'node', format: 'cjs', write: false,
});
const module = { exports: {} };
runInNewContext(compiled.outputFiles[0].text, { module, exports: module.exports, require, console });
const api = module.exports;
let checks = 0;
const check = (condition, message) => { checks++; assert(condition, message); };
const equal = (actual, expected, message) => { checks++; assert.deepEqual(actual, expected, message); };
const render = (component, props) => renderToStaticMarkup(React.createElement(component, props));
const inputs = html => [...html.matchAll(/<input\b[^>]*\btype="range"[^>]*>/g)].map(m => m[0]);
const attribute = (html, name) => html.match(new RegExp(`\\b${name}="([^"]*)"`))?.[1];

for (const [props, expected] of [
  [{ value: [35] }, [35]],
  [{ value: 35 }, [35]],
  [{ defaultValue: [35] }, [35]],
  [{ defaultValue: 35 }, [35]],
  [{ min: 5 }, [5]],
  [{ value: [0, 100] }, [0, 100]],
]) {
  const html = render(api.Slider, { ...props, 'aria-label': 'Tissue separation', 'aria-valuetext': '35%', 'aria-describedby': 'help' });
  const ranges = inputs(html);
  equal(ranges.length, expected.length, 'One input per scalar/range value');
  equal(ranges.map(r => Number(attribute(r, 'value'))), expected);
  for (const range of ranges) {
    equal(attribute(range, 'aria-label'), 'Tissue separation');
    equal(attribute(range, 'aria-valuetext'), '35%');
    equal(attribute(range, 'aria-describedby'), 'help');
  }
  check(!/<div\b[^>]*aria-valuetext=/.test(html), 'Value text belongs to the input, not its surrounding group');
  check(!/visibility:hidden/.test(html), 'Default thumbs do not wait for measurements of a collapsed panel');
}

const labelled = inputs(render(api.Slider, { value: [40], 'aria-labelledby': 'visible-label', disabled: true }))[0];
equal(attribute(labelled, 'aria-labelledby'), 'visible-label');
check(/\bdisabled(?:="")?/.test(labelled), 'Disabled slider cannot be manipulated');
const labelledRange = inputs(render(api.Slider, {
  value: [20, 80],
  getAriaLabel: index => index ? 'Upper value' : 'Lower value',
  getAriaValueText: (_formatted, value, index) => `${index ? 'Upper' : 'Lower'} ${value}%`,
}));
equal(labelledRange.map(r => attribute(r, 'aria-label')), ['Lower value', 'Upper value']);
equal(labelledRange.map(r => attribute(r, 'aria-valuetext')), ['Lower 20%', 'Upper 80%']);

const systems = [
  { id: 'bones', name: 'Bones', enabled: true },
  { id: 'muscles', name: 'Muscles', enabled: false },
];
for (const disabled of [false, true]) {
  const ranges = inputs(render(api.InspectionControls, {
    value: { ...api.initialInspection, plane: 'axial', position: 40, opacity: { bones: 50, muscles: 25 } },
    onChange() {}, systems, plate: false, onPlate() {}, disabled,
  }));
  equal(ranges.map(r => attribute(r, 'aria-label')), ['axial cutaway position', 'Bones opacity', 'Muscles opacity']);
  equal(attribute(ranges[1], 'aria-valuetext'), '50%');
  equal(attribute(ranges[2], 'aria-valuetext'), '25%');
  check(attribute(ranges[0], 'aria-valuetext')?.startsWith('40% from '));
  equal(ranges.map(r => /\bdisabled(?:="")?/.test(r)), [disabled, disabled, true]);
}
const cut = inputs(render(api.CutawayControls, {
  value: { ...api.initialInspection, plane: 'sagittal', position: 65 },
  onChange() {}, subject: 'Brain', positionId: 'test-cut',
}))[0];
equal(attribute(cut, 'aria-label'), 'Brain cutaway position');
check(attribute(cut, 'aria-valuetext')?.startsWith('65% from '));

// Every current app use must supply its purpose and units/context. This source
// check complements real SSR input checks; it does not prove browser behaviour.
const consumers = [];
for (const file of await readdir('app')) {
  if (!file.endsWith('.tsx')) continue;
  const source = await readFile('app/' + file, 'utf8');
  if (!source.includes("@/components/ui/slider")) continue;
  const ast = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const visit = node => {
    if ((ts.isJsxSelfClosingElement(node) || ts.isJsxOpeningElement(node)) && node.tagName.getText(ast) === 'Slider') {
      const names = node.attributes.properties.filter(ts.isJsxAttribute).map(p => p.name.getText(ast));
      check(names.includes('aria-label') || names.includes('aria-labelledby') || names.includes('getAriaLabel'), file + ': label');
      check(names.includes('aria-valuetext') || names.includes('getAriaValueText'), file + ': value context');
      consumers.push({ file, line: ast.getLineAndCharacterOfPosition(node.getStart(ast)).line + 1 });
    }
    ts.forEachChild(node, visit);
  };
  visit(ast);
}
check(consumers.length > 0);
const report = { passed: true, checks, consumers, actualBaseUiInputs: true, browserOrScreenReaderAcceptance: false, clinicalApproval: false };
await writeFile('docs/slider-accessibility-validation.json', JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report));
