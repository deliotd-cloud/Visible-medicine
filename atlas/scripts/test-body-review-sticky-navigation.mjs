import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runInNewContext } from 'node:vm';

const proposalRoot = fileURLToPath(new URL('../', import.meta.url));
const sourceRoot = process.env.VM_ATLAS_ROOT || proposalRoot;
const require = createRequire(resolve(sourceRoot, 'package.json'));
const React = require('react');
const { transformSync } = require('esbuild');
const source = readFileSync(resolve(proposalRoot, 'app/review/body/review-dashboard.tsx'), 'utf8');
const css = readFileSync(resolve(sourceRoot, 'app/review/body/body-review.css'), 'utf8');
const { code } = transformSync(source, { loader: 'tsx', format: 'cjs', jsx: 'automatic', target: 'es2022' });
const headingModule = { exports: {} };
const { code: headingCode } = transformSync(readFileSync(resolve(sourceRoot, 'lib/teaching-heading.ts'), 'utf8'),
  { loader: 'ts', format: 'cjs', target: 'es2022' });
runInNewContext(headingCode, { module: headingModule, exports: headingModule.exports });
const component = name => function Component() { throw Error(`Unexpected render: ${name}`); };
const ui = names => Object.fromEntries(names.map(name => [name, component(name)]));
const systems = { skeleton: { name: 'Bones' }, muscles: { name: 'Muscles' } };
const mocks = {
  'next/link': { default: component('Link') },
  '@/components/review-sign-in-link': { ReviewSignInLink: component('ReviewSignInLink') },
  '../../brand': { Brand: component('Brand') },
  '@/components/ui/button': { Button: component('Button') },
  '@/components/ui/input': { Input: component('Input') },
  '@/components/ui/select': ui(['Select', 'SelectTrigger', 'SelectValue', 'SelectContent', 'SelectItem']),
  '@/components/ui/alert-dialog': ui(['AlertDialog', 'AlertDialogAction', 'AlertDialogCancel',
    'AlertDialogContent', 'AlertDialogDescription', 'AlertDialogFooter', 'AlertDialogHeader', 'AlertDialogTitle']),
  '../../body-types': { bodySystems: systems },
  '@/lib/body-review-search': { bodyReviewQueue(rows, region, system, query) {
    return rows.filter(row => (region === 'all' || row.regions.includes(region)) &&
      (system === 'all' || row.system === system) && row.name.toLowerCase().includes(query.toLowerCase()));
  } },
  '@/lib/body-review-response': { async parseBodyReviewResponse(data) { return data; } },
  '@/lib/teaching-heading': headingModule.exports,
  './body-decision-editor': { BodyDecisionEditor: component('BodyDecisionEditor') },
  '../review-model-preview': { ReviewModelPreview: component('ReviewModelPreview') },
};
let slots, cursor;
const hook = {
  ...React,
  useState(initial) {
    const i = cursor++;
    if (!(i in slots)) slots[i] = typeof initial === 'function' ? initial() : initial;
    return [slots[i], value => { slots[i] = typeof value === 'function' ? value(slots[i]) : value; }];
  },
  useRef(initial) {
    const i = cursor++;
    if (!(i in slots)) slots[i] = { current: initial };
    return slots[i];
  },
  useMemo(fn) { return fn(); },
  useEffect() {},
  useLayoutEffect() {},
};
const page = new URL('https://local.test/review/body?structure=bone&qa=1');
const scope = { exports: {} };
runInNewContext(code, {
  module: scope, exports: scope.exports, AbortController, URL,
  window: { location: page, history: { state: {}, replaceState() {} } },
  require(name) {
    if (name === 'react') return hook;
    if (name === 'react/jsx-runtime') return require(name);
    if (name in mocks) return mocks[name];
    throw Error(`Unexpected dependency ${name}`);
  },
});
const walk = (node, predicate, found = []) => {
  if (React.isValidElement(node)) {
    if (predicate(node)) found.push(node);
    React.Children.forEach(node.props.children, child => walk(child, predicate, found));
  }
  return found;
};
const text = node => typeof node === 'string' || typeof node === 'number' ? String(node)
  : !node ? '' : Array.isArray(node) ? node.map(text).join('') : text(node.props?.children);
const rows = [
  { id: 'bone', name: 'Bone', fmaId: 'FMA1', laterality: 'right', system: 'skeleton', regions: ['forearm'] },
  { id: 'muscle', name: 'Muscle', fmaId: 'FMA2', laterality: 'right', system: 'muscles', regions: ['forearm'] },
];
function render() {
  cursor = 0;
  return scope.exports.BodyReviewDashboard({ rows, initialId: 'bone', initialRegion: 'forearm',
    regions: [{ id: 'forearm', name: 'Forearm' }] });
}

test('closed filters show friendly labels and retained system choices', () => {
  slots = [];
  const trigger = label => walk(render(), node => node.props['aria-labelledby'] === label)[0];
  assert.equal(text(trigger('body-review-region-label')), 'Forearm');
  assert.equal(text(trigger('body-review-system-label')), 'All systems');
  const selects = walk(render(), node => typeof node.props.onValueChange === 'function');
  selects[1].props.onValueChange('muscles');
  assert.equal(text(trigger('body-review-system-label')), 'Muscles');
  assert.equal(text(trigger('body-review-region-label')), 'Forearm');
  assert.equal(walk(render(), node => node.props['aria-label'] === 'Structures in the filtered review queue').length, 1);
});

test('desktop worksheet navigation aligns with the queue inside the panel and below dialogs', () => {
  const base = css.slice(css.indexOf('.body-review-structure-navigation {'), css.indexOf('.body-review-paper details {'));
  const sticky = base.match(/@media \(min-width: 851px\) \{\s*\.body-review-structure-navigation \{([^}]+)\}/)?.[1];
  assert(sticky, 'Only desktop widths receive the sticky strip');
  assert.match(sticky, /position:\s*sticky;/);
  assert.match(sticky, /top:\s*1rem;/);
  assert.match(sticky, /z-index:\s*2;/);
  assert.match(sticky, /background:\s*white;/);
  assert.match(base, /flex-wrap:\s*wrap;/);
  assert.match(base, /min-height:\s*44px;/);
  assert.match(base, /min-width:\s*44px;/);
  assert.match(base, /:focus-visible/);
  assert.doesNotMatch(base, /position:\s*fixed/);
});
