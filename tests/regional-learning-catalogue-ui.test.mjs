import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { runInNewContext } from 'node:vm';
import { test } from 'node:test';
import { build } from 'esbuild';

const require = createRequire(import.meta.url);
const React = require('react');
let slots = [], cursor = 0, focuses = 0, fetches = 0;
const shim = { ...React,
  useState(initial) { const i = cursor++; if (!(i in slots)) slots[i] = typeof initial === 'function' ? initial() : initial;
    return [slots[i], value => { slots[i] = typeof value === 'function' ? value(slots[i]) : value; }]; },
  useRef() { const i = cursor++; if (!(i in slots)) slots[i] = { current: { focus() { focuses++; } } }; return slots[i]; },
};
const built = await build({ stdin: { contents: "export { RegionalLearningCatalogue } from './components/RegionalLearningCatalogue';", resolveDir: process.cwd(), loader: 'tsx' },
  bundle: true, write: false, platform: 'node', format: 'cjs', packages: 'external', alias: { '@': process.cwd() }, loader: { '.css': 'empty' } });
const scope = { exports: {} };
runInNewContext(built.outputFiles[0].text, { module: scope, exports: scope.exports,
  fetch() { fetches++; throw new Error('No fetch expected'); }, require: name => name === 'react' ? shim : require(name) });
const { RegionalLearningCatalogue } = scope.exports;
const walk = (node, predicate, out = []) => { if (React.isValidElement(node)) { if (predicate(node)) out.push(node); React.Children.forEach(node.props.children, child => walk(child, predicate, out)); } return out; };
const words = node => typeof node === 'string' || typeof node === 'number' ? String(node) : !node ? '' : Array.isArray(node) ? node.map(words).join('') : words(node.props?.children);
const tour = (i, overrides = {}) => ({ id:`tour-${i}`, title:`Tour ${i}`, description:`Overview ${i}`, revision:`revision-${i}`, regionId:i % 2 ? 'forearm':'head-neck', regionLabel:i % 2 ? 'Forearm':'Head and neck', href:i % 2 ? '/atlas/3d?region=forearm':'/atlas/head-neck-3d', limitations:`Limit ${i}`, steps:[{title:`Step ${i}`,structureName:`Structure ${i}`}], ...overrides });
const data = (overrides = {}) => ({ available:true, sourceRevision:'source-a', unavailableTours:0, regions:[{id:'forearm',label:'Forearm'},{id:'head-neck',label:'Head and neck'}], tours:Array.from({length:8},(_,i)=>tour(i+1)), ...overrides });
const render = (catalogue, initialQuery = '') => { cursor = 0; return RegionalLearningCatalogue({ catalogue, initialQuery }); };
const reset = () => { slots = []; cursor = 0; focuses = 0; fetches = 0; };
const nodes = (tree, type) => walk(tree, n => n.type === type);
const rows = tree => walk(tree, n => n.type === 'ol' && n.props.className === 'regional-learning-catalogue-list').flatMap(list => nodes(list, 'li').filter(n => words(n).startsWith('Tour')));
const links = tree => nodes(tree, 'a');
const control = (tree, type) => nodes(tree, type)[0];
const click = (tree, label) => { const button = nodes(tree, 'button').find(n => words(n) === label); assert(button, label); button.props.onClick(); };
const search = (tree, query) => control(tree, 'input').props.onChange({ target: { value: query } });
const region = (tree, value) => control(tree, 'select').props.onChange({ target: { value } });

test('ordered compact rows, native region links, closed disclosures and no auto action', () => {
  reset(); const catalogue = data(); const tree = render(catalogue);
  assert.equal(rows(tree).length, 6);
  assert.deepEqual(rows(tree).map(row => words(nodes(row, 'h3')[0])), catalogue.tours.slice(0,6).map(tour => tour.title));
  assert.deepEqual(links(tree).map(link => link.props.href), catalogue.tours.slice(0,6).map(tour => tour.href));
  assert(links(tree).every(link => link.props.onClick === undefined && !link.props.href.includes('tour=')));
  assert(words(tree).includes('choose Guided learning') || words(tree).includes('Choose Guided learning'));
  assert(words(tree).includes('press Start'));
  assert(words(tree).includes('does not grant access, registration, clinical approval'));
  const details = nodes(rows(tree)[0], 'details'); assert.equal(details.length, 3);
  assert(details.every(item => item.props.open === undefined));
  assert.deepEqual(nodes(details[0], 'li').map(item => words(item)), ['Step 1 · Structure 1']);
  assert.equal(fetches, 0);
});

test('multiword search uses title, description, step and structure and resets pagination', () => {
  reset(); const catalogue = data(); click(render(catalogue), 'Next');
  assert(words(render(catalogue)).includes('Page 2 of 2'));
  search(render(catalogue), 'structure 3'); let tree = render(catalogue);
  assert.deepEqual(rows(tree).map(row => words(nodes(row, 'h3')[0])), ['Tour 3']);
  assert(words(tree).includes('1 matching tour'));
  assert(!words(tree).includes('Page 2 of 2'));
  search(tree, 'OVERVIEW 4'); tree = render(catalogue);
  assert.deepEqual(rows(tree).map(row => words(nodes(row, 'h3')[0])), ['Tour 4']);
  search(tree, 'Step 5 Structure'); tree = render(catalogue);
  assert.deepEqual(rows(tree).map(row => words(nodes(row, 'h3')[0])), ['Tour 5']);
  search(tree, 'Structure 3 nonsense'); assert.equal(rows(render(catalogue)).length, 0);
});

test('region selection, pagination, empty state and clear search focus', () => {
  reset(); const catalogue = data(); let tree = render(catalogue);
  assert.equal(control(tree, 'input').props.type, 'search');
  assert.equal(control(tree, 'select').props.value, 'all');
  assert(words(nodes(tree, 'label')[0]).includes('Search regional tours'));
  click(tree, 'Next'); tree = render(catalogue);
  assert.deepEqual(rows(tree).map(row => words(nodes(row, 'h3')[0])), ['Tour 7','Tour 8']);
  region(tree, 'forearm'); tree = render(catalogue);
  assert.equal(rows(tree).length, 4); assert(words(tree).includes('4 matching tours'));
  assert(!words(tree).includes('Page 2 of 2'));
  region(tree, 'invalid'); assert.equal(control(render(catalogue), 'select').props.value, 'forearm');
  search(render(catalogue), 'absent'); tree = render(catalogue);
  assert.equal(rows(tree).length, 0); assert(words(tree).includes('No regional tours match'));
  click(tree, 'Clear filters'); tree = render(catalogue);
  assert.equal(focuses, 1); assert.equal(rows(tree).length, 6);
  assert.equal(control(tree, 'input').props.value, ''); assert.equal(control(tree, 'select').props.value, 'all');
});

test('unavailable source exposes no tour links and partial counts stay distinct', () => {
  reset(); const unavailable = data({ available:false, unavailableTours:8 }); const tree = render(unavailable);
  assert.equal(links(tree).length, 0); assert.equal(rows(tree).length, 0);
  assert(words(tree).includes('8 tours are unavailable')); assert(words(tree).includes('No tour links are available'));
  reset(); const partial = data({ unavailableTours:2 });
  const partialTree = render(partial); assert(words(partialTree).includes('8 matching tours'));
  assert(words(partialTree).includes('2 tours are unavailable'));
  assert.equal(links(partialTree).length, 6);
});

test('new catalogue snapshot resets filters and page without stale links', () => {
  reset(); const first = data(); click(render(first), 'Next'); search(render(first), 'Tour 7');
  assert.deepEqual(links(render(first)).map(link => link.props.href), ['/atlas/3d?region=forearm']);
  const second = data({ sourceRevision:'source-b', tours:[tour(20,{title:'Replacement',href:'/atlas/head-neck-3d'})] });
  const tree = render(second);
  assert.equal(control(tree, 'input').props.value, ''); assert.equal(control(tree, 'select').props.value, 'all');
  assert.deepEqual(links(tree).map(link => link.props.href), ['/atlas/head-neck-3d']);
  assert(words(tree).includes('1 matching tour'));
  assert.equal(fetches, 0);
});
