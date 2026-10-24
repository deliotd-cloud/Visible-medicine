import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { runInNewContext } from 'node:vm';
import { test } from 'node:test';
import { build } from 'esbuild';

const require = createRequire(import.meta.url);
const React = require('react');
let slots = [], cursor = 0, focusCalls = 0;
const document = { activeElement: null };
const shim = { ...React,
  useState(initial) { const i = cursor++; if (!(i in slots)) slots[i] = typeof initial === 'function' ? initial() : initial;
    return [slots[i], value => { slots[i] = typeof value === 'function' ? value(slots[i]) : value; }]; },
  useRef(initial) { const i = cursor++; if (!(i in slots)) slots[i] = { current: initial }; return slots[i]; },
};
const built = await build({ stdin: { contents: "export { RegionalLearningCatalogue } from './components/RegionalLearningCatalogue';", resolveDir: process.cwd(), loader: 'tsx' },
  bundle: true, write: false, platform: 'node', format: 'cjs', packages: 'external', alias: { '@': process.cwd() }, loader: { '.css': 'empty' } });
const scope = { exports: {} };
runInNewContext(built.outputFiles[0].text, { module: scope, exports: scope.exports, document, URLSearchParams, require: name => name === 'react' ? shim : require(name) });
const { RegionalLearningCatalogue } = scope.exports;
const walk = (node, predicate, out = []) => { if (React.isValidElement(node)) { if (predicate(node)) out.push(node); React.Children.forEach(node.props.children, child => walk(child, predicate, out)); } return out; };
const nodes = (tree, type) => walk(tree, node => node.type === type);
const words = node => typeof node === 'string' || typeof node === 'number' ? String(node) : !node ? '' : Array.isArray(node) ? node.map(words).join('') : words(node.props?.children);
const result = tree => walk(tree, node => node.props?.className === 'regional-learning-catalogue-results')[0];
const rows = tree => walk(tree, node => node.type === 'ol' && node.props.className === 'regional-learning-catalogue-list')[0]?.props.children ?? [];
const rowArray = tree => React.Children.toArray(rows(tree));
const button = (tree, label) => nodes(tree, 'button').find(node => words(node) === label);
const tour = (i, changes = {}) => ({ id:`tour-${i}`, title:`Tour ${i}`, description:`Overview ${i}`, revision:`rev-${i}`, regionId:'forearm', regionLabel:'Forearm', href:'/atlas/3d?region=forearm', limitations:`Limit ${i}`, steps:[{title:`Step ${i}`,structureName:`Structure ${i}`}], ...changes });
const data = (changes = {}) => ({ available:true, sourceRevision:'a'.repeat(40), unavailableTours:0, regions:[{id:'forearm',label:'Forearm'}], tours:Array.from({length:8},(_,i)=>tour(i+1)), ...changes });
const render = (source, props = {}) => { cursor = 0; return RegionalLearningCatalogue({ catalogue:source, ...props }); };
const reset = () => { slots = []; cursor = 0; focusCalls = 0; document.activeElement = null; };
const query = (tree, value) => nodes(tree, 'input')[0].props.onChange({ target:{ value } });
const region = (tree, value) => nodes(tree, 'select')[0].props.onChange({ target:{ value } });
const commit = tree => result(tree).props.ref({ focus() { focusCalls++; } });

test('pager precedes grid and focuses committed status only while its button owns focus', () => {
  reset(); const source = data(); let tree = render(source);
  const children = React.Children.toArray(tree.props.children).flatMap(node => React.isValidElement(node) && node.type === React.Fragment ? React.Children.toArray(node.props.children) : [node]);
  assert(children.findIndex(node => node.props?.className === 'regional-learning-catalogue-pages') < children.findIndex(node => node.props?.className === 'regional-learning-catalogue-list'));
  const next = button(tree, 'Next'); assert.match(next.props['aria-label'], /Next regional tour page, page 2 of 2/);
  const owner = {}; document.activeElement = owner; next.props.onClick({ currentTarget:owner });
  tree = render(source); assert.equal(result(tree).props.tabIndex, -1); commit(tree); assert.equal(focusCalls, 1);
  const previous = button(tree, 'Previous'); assert.match(previous.props['aria-label'], /Previous regional tour page, page 1 of 2/);
  previous.props.onClick({ currentTarget:owner }); document.activeElement = {};
  tree = render(source); commit(tree); assert.equal(focusCalls, 1);
  next.props.onClick({ currentTarget:owner }); query(render(source), 'Tour 1');
  tree = render(source); document.activeElement = owner; commit(tree); assert.equal(focusCalls, 1);
  assert.equal(rowArray(tree).length, 1);
  const newer = data({ sourceRevision:'b'.repeat(40), tours:[tour(20)] });
  next.props.onClick({ currentTarget:owner }); tree = render(newer); commit(tree); assert.equal(focusCalls, 1);
});

test('search context separates one complete step from terms distributed across steps or tour details', () => {
  reset(); const source = data({ tours:[tour(1,{ title:'Upper limb route', description:'Vascular lesson', steps:[
    {title:'Find radial artery',structureName:'Forearm'}, {title:'Trace ulnar vein',structureName:'Wrist'}, {title:'Inspect radial artery',structureName:'Hand'},
  ]})] });
  query(render(source), 'radial artery'); let tree = render(source);
  assert.match(words(tree), /All search terms match within steps: step 1: Find radial artery · Forearm; step 3: Inspect radial artery · Hand/);
  query(tree, 'radial vein'); tree = render(source);
  assert.equal(rowArray(tree).length, 1);
  assert.match(words(tree), /related steps: step 1: Find radial artery · Forearm; step 2: Trace ulnar vein · Wrist · \+1 more\. No single step contains all terms/);
  assert.doesNotMatch(words(tree), /All search terms match within/);
  query(tree, 'vascular lesson'); tree = render(source);
  assert.match(words(tree), /Search terms match tour details; no single step contains all terms/);
  query(tree, 'radial absent'); assert.equal(rowArray(render(source)).length, 0);
});

test('stale result refs cannot consume new page focus; disabled-owner body fallback and bounds are explicit', () => {
  reset(); const source=data(); let tree=render(source),oldRef=result(tree).props.ref;
  const owner={disabled:false}; document.body={}; document.activeElement=owner;
  button(tree,'Next').props.onClick({currentTarget:owner});
  oldRef({focus(){focusCalls++;}}); assert.equal(focusCalls,0);
  tree=render(source); owner.disabled=true; document.activeElement=document.body;
  let options; result(tree).props.ref({focus(value){focusCalls++;options=value;}});
  assert.equal(focusCalls,1); assert.equal(options.preventScroll,true);
  button(tree,'Next').props.onClick({currentTarget:owner}); tree=render(source);
  assert.match(words(tree),/Page 2 of 2/); commit(tree); assert.equal(focusCalls,1);
  oldRef({focus(){focusCalls++;}}); assert.equal(focusCalls,1);
});

test('source, region and fixed filters reset page without focus transfer', () => {
  reset(); const source = data(); let tree = render(source);
  button(tree, 'Next').props.onClick(); tree = render(source); assert.match(words(tree), /Page 2 of 2/);
  region(tree, 'forearm'); tree = render(source); assert.match(words(tree), /Page 1 of 2/);
  query(tree, 'Tour 8'); tree = render(source); assert.equal(rowArray(tree).length, 1);
  assert.equal(focusCalls, 0);
  reset(); tree = render(source, {initialQuery:'Tour',fixedQuery:true,initialRegion:'forearm',fixedRegion:true});
  assert.equal(nodes(tree, 'input').length, 0); assert.equal(nodes(tree, 'select').length, 0);
  button(tree, 'Next').props.onClick(); tree = render(source, {initialQuery:'Tour',fixedQuery:true,initialRegion:'forearm',fixedRegion:true});
  assert.match(words(tree), /Page 2 of 2/);
  const newer = data({sourceRevision:'c'.repeat(40), tours:[tour(30)]});
  tree = render(newer, {initialQuery:'Tour',fixedQuery:true,initialRegion:'forearm',fixedRegion:true});
  assert.equal(rowArray(tree).length, 1); assert.equal(focusCalls, 0);
});

test('unavailable and invalid destinations never link; one disclosure closes on Escape', () => {
  reset(); const unavailable = render(data({available:false})); assert.equal(nodes(unavailable, 'a').length, 0);
  const source = data({tours:[tour(1,{regionId:'invalid',href:'/invented'}), tour(2,{id:'bad id'}), tour(3)]});
  const tree = render(source); const cards = rowArray(tree);
  assert.equal(nodes(cards[0], 'a').length, 0);
  assert.equal(nodes(cards[1], 'a').length, 1); assert.equal(nodes(cards[1], 'a')[0].props.href, '/atlas/3d?region=forearm');
  assert.equal(nodes(cards[2], 'a').length, 1);
  assert(cards.every(card => nodes(card, 'details').length === 1));
  const disclosure = nodes(cards[2], 'details')[0]; assert.match(words(disclosure), /Limit 3.*Tour revision:/);
  let summaryFocused = 0, prevented = 0, stopped = 0;
  const target = {open:true, querySelector:() => ({focus(){summaryFocused++;}})};
  disclosure.props.onKeyDown({key:'Escape',currentTarget:target,preventDefault(){prevented++;},stopPropagation(){stopped++;}});
  assert.equal(target.open, false); assert.equal(summaryFocused, 1); assert.equal(prevented, 1); assert.equal(stopped, 1);
});

test('native continuous playback hint has no autoplay action', () => {
  reset(); const tree = render(data({tours:[tour(1)]}));
  assert.match(words(tree), /Play full tour.*continuous playback/);
  assert.match(words(tree), /Start guided tour.*step-by-step/);
  assert.match(words(tree), /Playback never starts automatically/);
  assert(nodes(tree, 'a').every(link => link.props.onClick === undefined));
  assert.equal(nodes(tree, 'audio').length + nodes(tree, 'video').length, 0);
});
