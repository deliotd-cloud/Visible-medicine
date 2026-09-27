/* oxlint-disable react-hooks/rules-of-hooks -- controlled hooks exercise production tour component */
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { runInNewContext } from 'node:vm';
import { test } from 'node:test';
import { build } from './workspace-component-test-build.mjs';

const require = createRequire(import.meta.url), React = require('react');
const catalog = JSON.parse(await readFile(new URL('../public/models/bodyparts3d/full-body/catalog.json', import.meta.url), 'utf8'));
const catalogBefore = JSON.stringify(catalog);
const built = await build({ stdin: {
  contents: "export { RegionalGuidedLearning } from './app/regional-guided-learning'; export { thoraxTour, cervicalSpineTour, celiacTour, regionalTourStructures, regionalTourFrame } from './lib/regional-tours'; export {bodyDisplayCatalog} from './lib/body-display-catalog'; export { allBodySystems } from './app/body-types'; export { initialInspection } from './lib/inspection-state';",
  loader: 'tsx', resolveDir: process.cwd(),
}, bundle: true, write: false, format: 'cjs', platform: 'node', loader: { '.css': 'empty' }, plugins: [{ name: 'gpu-boundary', setup(api) {
  api.onLoad({ filter: /[\\/]app[\\/]body-scene\.tsx$/ }, () => ({ loader: 'tsx', contents: 'export function BodyScene(){return null;}' }));
} }] });
const nodes = tree => !tree || typeof tree !== 'object' ? [] : Array.isArray(tree) ? tree.flatMap(nodes) : [tree, ...nodes(tree.props?.children)];
const text = tree => tree == null ? '' : typeof tree === 'string' || typeof tree === 'number' ? String(tree) : Array.isArray(tree) ? tree.map(text).join('') : text(tree.props?.children);
const plain = value => JSON.parse(JSON.stringify(value));

function harness(source = catalog, tourName = 'thoraxTour', compact = false) {
  const slots = [], setters = [], timers = new Map(), listeners = new Map();
  let cursor = 0, pending = [], dirty = false, tree, serial = 0, exits = 0;
  const changed = (old, next) => !old || !next || old.length !== next.length || old.some((item, i) => !Object.is(item, next[i]));
  const shim = { ...React,
    useState(initial) { const i = cursor++; if (!(i in slots)) slots[i] = typeof initial === 'function' ? initial() : initial; setters[i] ??= value => { const next = typeof value === 'function' ? value(slots[i]) : value; if (!Object.is(next, slots[i])) { slots[i] = next; dirty = true; } }; return [slots[i], setters[i]]; },
    useRef(initial) { return slots[cursor++] ??= { current: initial }; },
    useMemo(fn, deps) { const i = cursor++; if (changed(slots[i]?.deps, deps)) slots[i] = { deps, value: fn() }; return slots[i].value; },
    useCallback(fn, deps) { return shim.useMemo(() => fn, deps); },
    useEffect(fn, deps) { const i = cursor++; if (changed(slots[i]?.deps, deps)) pending.push(() => { slots[i]?.cleanup?.(); slots[i] = { deps, cleanup: fn() }; }); },
  };
  const preference = { matches: false, addEventListener(_event, fn) { listeners.set('motion', fn); }, removeEventListener() { listeners.delete('motion'); } };
  const doc = { hidden: false, addEventListener(event, fn) { listeners.set(event, fn); }, removeEventListener(event) { listeners.delete(event); } };
  const win = { matchMedia: query => query.includes('max-width') ? {matches:compact} : preference, setTimeout(fn, delay) { const id = ++serial; timers.set(id, { fn, delay }); return id; }, clearTimeout(id) { timers.delete(id); } };
  const mod = { exports: {} };
  runInNewContext(built.outputFiles[0].text, { module: mod, exports: mod.exports, window: win, document: doc, structuredClone,
    require(id) { if (id === 'react') return shim; if (id === 'next/dynamic') return () => 'BodyScene'; return require(id); } });
  const api = mod.exports, props = { catalog: api.bodyDisplayCatalog(source), tour: api[tourName], assetBase: '/atlas-runtime/head-neck', onExit() { exits++; } };
  const tourBefore = JSON.stringify(props.tour);
  function render() { let count = 0; do { dirty = false; cursor = 0; pending = []; tree = api.RegionalGuidedLearning(props); for (const effect of pending) effect(); assert(++count < 15); } while (dirty); return tree; }
  function find(predicate) { const matches = nodes(tree).filter(predicate); assert.equal(matches.length, 1); return matches[0].props; }
  const scene = () => find(n => n.type === 'BodyScene');
  const button = label => find(n => n.props?.onClick && text(n) === label);
  const bundles = () => [...new Set(scene().structures.map(s => s.bundle))];
  function ready() { for (const id of bundles()) scene().onLoaded(id); scene().onRendererHealth('ready'); render(); }
  function click(label) { const control = button(label); assert(!control.disabled, `${label} enabled`); control.onClick(); render(); }
  function tick() { assert.equal(timers.size, 1); const [id, timer] = [...timers][0]; timers.delete(id); assert.equal(timer.delay, props.tour.steps[scene().reset].durationMs); timer.fn(); render(); }
  function unchanged() { assert.equal(JSON.stringify(catalog), catalogBefore, 'Source catalogue unchanged'); assert.equal(JSON.stringify(props.tour), tourBefore, 'Tour definition unchanged'); }
  render();
  return { render, scene, button, bundles, ready, click, tick, timers, preference, listeners, doc, api, props, unchanged, tree: () => tree, exits: () => exits };
}

test('Compact tours retain complete teaching on demand and pause while reading', () => {
  for (const compact of [true,false]) {
    const h=harness(catalog,'celiacTour',compact);
    const explanation=()=>nodes(h.tree()).find(n=>n.props?.className==='regional-tour-explanation').props;
    assert.equal(explanation().open,!compact);
    assert.match(text(h.tree()),/Branching patterns vary/,'Complete limitations are retained');
    h.ready();h.click('Start guided tour');h.click('Play');
    explanation().onToggle({currentTarget:{open:true}});h.render();
    assert.equal(explanation().open,true);assert.equal(h.timers.size,0);
    assert.equal(h.scene().transitionPaused,true);
    explanation().onToggle({currentTarget:{open:false}});h.render();
    assert.equal(explanation().open,false);assert.equal(h.timers.size,0,'Closing never resumes playback');
    h.click('Next');assert.equal(h.scene().reset,1);h.click('Exit tour');assert.equal(h.exits(),1);
  }
});

test('Cervical tour runs all five exact steps with fixed framing and its own limits', () => {
  const h=harness(catalog,'cervicalSpineTour');
  assert.equal(h.button('Start guided tour').disabled,true);
  assert.match(text(h.tree()),/discs, ligaments, spinal cord and nerve roots are not shown/);
  assert.doesNotMatch(text(h.tree()),/bronchial tree/);
  h.ready();h.click('Start guided tour');
  const frame=plain(h.scene().presetBounds);
  assert.equal(h.scene().structures.length,8);assert.deepEqual(h.bundles(),['spine-skeleton']);
  for(let i=0;i<5;i++){
    assert.equal(h.scene().selectedId,h.props.tour.steps[i].selectedId);
    assert.deepEqual(plain(h.scene().presetBounds),frame);
    assert.equal(h.scene().transitionMs,1800);assert.equal(h.scene().explode,0);
    if(i<4)h.click('Next');
  }
  h.click('Back');assert.equal(h.scene().selectedId,h.props.tour.steps[3].selectedId);
  h.click('Play');h.tick();h.tick();assert.equal(h.timers.size,0);
  h.click('Finish');assert.equal(h.exits(),1);h.unchanged();
});

test('Coeliac tour uses the corrected display and waits for both exact bundles', () => {
  const h=harness(catalog,'celiacTour');
  assert.equal(h.scene().structures.length,6);
  assert.equal(h.scene().structures.find(s=>s.id===h.props.tour.steps[0].selectedId).bundle,'celiac-display-corrected');
  assert.match(text(h.tree()),/Branching patterns vary/);
  h.scene().onRendererHealth('ready');h.scene().onLoaded('abdomen-vessels-recovery');h.render();
  assert.equal(h.button('Start guided tour').disabled,true,'Archived vascular bundle does not satisfy corrected display');
  h.scene().onLoaded('celiac-display-corrected');h.render();h.click('Start guided tour');
  const frame=plain(h.scene().presetBounds),overview=h.api.regionalTourFrame(h.props.catalog,h.props.tour);
  assert(frame.max[0]-frame.min[0]<(overview.max[0]-overview.min[0])/2,'Small origin gets a materially closer frame');
  for(let i=0;i<5;i++){
    assert.equal(h.scene().selectedId,h.props.tour.steps[i].selectedId);
    assert.deepEqual(plain(h.scene().presetBounds),plain(h.api.regionalTourFrame(h.props.catalog,h.props.tour,i)));
    assert.equal(h.scene().transitionMs,1800);assert.equal(h.scene().explode,0);
    if(i<4)h.click('Next');
  }
  assert.notDeepEqual(plain(h.scene().presetBounds),frame,'Hepatic stops use their own close-up');
  h.click('Finish');assert.equal(h.exits(),1);h.unchanged();
});

test('All actual tour bundles and ready renderer are required; entry remains manual and canonical', () => {
  const h = harness();
  assert.equal(h.button('Start guided tour').disabled, true); assert.equal(h.timers.size, 0);
  h.scene().onRendererHealth('ready'); h.render(); assert.equal(h.button('Start guided tour').disabled, true);
  const bundles = h.bundles(); assert(bundles.length > 1, 'Actual tour spans multiple source bundles');
  for (const id of bundles.slice(0, -1)) { h.scene().onLoaded(id); h.render(); assert.equal(h.button('Start guided tour').disabled, true, 'Missing any bundle blocks start'); }
  h.scene().onLoaded('unknown-bundle'); h.render(); assert.equal(h.button('Start guided tour').disabled, true);
  h.scene().onLoaded(bundles.at(-1)); h.render(); assert.equal(h.button('Start guided tour').disabled, false);
  h.scene().onLoaded(bundles.at(-1)); h.render(); assert.equal(h.timers.size, 0, 'Readiness never autostarts');
  h.click('Start guided tour'); assert.equal(h.button('Play')['aria-pressed'], false); assert.equal(h.timers.size, 0);
  const scene = h.scene(), expected = h.api.regionalTourStructures(catalog, h.props.tour);
  assert.deepEqual(plain(scene.structures), plain(expected));
  assert.equal(scene.structures.length, 8, 'Only six exact targets plus two lung contexts');
  assert.deepEqual(plain(scene.presetBounds), plain(h.api.regionalTourFrame(catalog, h.props.tour)));
  assert.deepEqual(plain(scene.systems), plain(h.api.allBodySystems));
  assert.deepEqual(plain(scene.inspection), plain(h.api.initialInspection));
  for (const key of ['explode', 'reset']) assert.equal(scene[key], 0);
  for (const key of ['ghostRemoved', 'anchorSkeleton', 'showOrigins', 'focus', 'exam', 'plate']) assert.equal(scene[key], false);
  assert.equal(scene.layout, 'spatial'); assert.equal(scene.zoom, 1); assert.equal(scene.labels, true); assert.equal(scene.tourLocked, true);
  assert.deepEqual(plain(scene.hiddenIds), []); assert.deepEqual(plain(scene.landmarks), []);
  const selected = scene.selectedId; scene.onSelect(h.props.tour.steps[5].selectedId); h.render(); assert.equal(h.scene().selectedId, selected, 'Scene clicks cannot introduce another selection');
  h.unchanged();
});

test('Opening step-bound imaging notes pauses motion and autoplay; next step gets fresh notes',()=>{
  const h=harness();h.ready();h.click('Start guided tour');h.click('Play');
  const notes=()=>nodes(h.tree()).find(n=>n.type?.name==='TourImagingNotes');
  assert.equal(notes().key,h.props.tour.steps[0].id);
  assert.equal(notes().props.structureName,'Trachea');assert.equal(notes().props.lessons.length,4);
  notes().props.onOpen();h.render();
  assert.equal(h.timers.size,0);assert.equal(h.button('Play')['aria-pressed'],false);assert.equal(h.scene().transitionPaused,true);
  h.click('Next');assert.equal(notes().key,h.props.tour.steps[1].id);assert.equal(h.timers.size,0);
  assert.equal(notes().props.structureName,'Right main bronchus');h.unchanged();
});

test('Manual step bounds, autoplay pause/resume and final hold use actual callbacks', () => {
  const h = harness(); h.ready(); h.click('Start guided tour');
  assert.equal(h.button('Back').disabled, true);
  h.button('Back').onClick(); h.render(); assert.equal(h.scene().reset, 0, 'Actual lower-bound guard rejects negative step');
  h.click('Next'); assert.equal(h.scene().reset, 1); h.click('Back'); assert.equal(h.scene().reset, 0);
  h.click('Play'); assert.equal(h.timers.size, 1); h.click('Pause'); assert.equal(h.timers.size, 0); assert.equal(h.scene().transitionPaused, true);
  h.click('Play'); assert.equal(h.scene().transitionPaused, false);
  while (h.scene().reset < h.props.tour.steps.length - 1) h.tick();
  const final = h.scene().selectedId; h.tick();
  assert.equal(h.button('Play')['aria-pressed'], false); assert.equal(h.timers.size, 0); assert.equal(h.scene().selectedId, final, 'Final source holds instead of looping');
  assert.equal(h.scene().reset, 5); assert.equal(h.exits(), 0, 'Autoplay never exits automatically');
  h.click('Finish'); assert.equal(h.exits(), 1); assert.equal(h.scene().selectedId, final, 'Finish does not advance beyond sequence');
  h.unchanged();
});

test('Hidden tabs and renderer/load failure pause, never auto-resume, and keep Exit enabled', () => {
  for (const cause of ['hidden', 'lost', 'failed', 'bundle-failed']) {
    const h = harness(); h.ready(); h.click('Start guided tour'); h.click('Play');
    if (cause === 'hidden') { h.doc.hidden = true; h.listeners.get('visibilitychange')(); }
    else if (cause === 'bundle-failed') h.scene().onFailure(h.bundles()[0]);
    else h.scene().onRendererHealth(cause);
    h.render(); assert.equal(h.timers.size, 0); assert.equal(h.button('Play')['aria-pressed'], false); assert.equal(h.scene().transitionPaused, true);
    if (cause !== 'hidden') for (const label of ['Back', 'Play', 'Next']) assert.equal(h.button(label).disabled, true);
    h.doc.hidden = false; h.scene().onRendererHealth('ready'); h.render();
    assert.equal(h.timers.size, 0, `${cause}: no automatic recovery playback`);
    assert.equal(h.button('Play')['aria-pressed'], false);
    if (cause === 'bundle-failed') { assert.equal(h.button('Play').disabled, true); assert.match(text(h.tree()), /failed to load/); }
    h.click('Exit tour'); assert.equal(h.exits(), 1); h.unchanged();
  }
});

test('Reduced motion switches active camera duration between 1800 and zero; Exit works before readiness', () => {
  const h = harness(); assert.equal(h.scene().transitionMs, 0); h.click('Exit tour'); assert.equal(h.exits(), 1);
  h.ready(); h.click('Start guided tour'); assert.equal(h.scene().transitionMs, 1800);
  h.preference.matches = true; h.listeners.get('motion')(); h.render(); assert.equal(h.scene().transitionMs, 0);
  h.click('Next'); assert.equal(h.scene().transitionMs, 0);
  h.preference.matches = false; h.listeners.get('motion')(); h.render(); assert.equal(h.scene().transitionMs, 1800);
  h.unchanged();
});

test('Missing exact source fails closed with no replacement scene and usable Exit', () => {
  const source = structuredClone(catalog); source.structures = source.structures.filter(s => !s.id.endsWith(':trachea'));
  const h = harness(source);
  assert.equal(nodes(h.tree()).filter(n => n.type === 'BodyScene').length, 0);
  assert.equal(h.button('Start guided tour').disabled, true); assert.match(text(h.tree()), /unavailable for the current anatomy source/);
  assert.equal(h.timers.size, 0); h.click('Exit tour'); assert.equal(h.exits(), 1); h.unchanged();
});
