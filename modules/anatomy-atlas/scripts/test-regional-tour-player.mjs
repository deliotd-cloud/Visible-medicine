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
  contents: "export { RegionalGuidedLearning } from './app/regional-guided-learning'; export { thoraxTour, chestWallTour, orbitalTour, intrinsicLarynxTour, cervicalSpineTour, celiacTour, forearmTour, thighTour, legTour, handTour, footTour, upperArmTour, larynxTour, malePelvisTour, regionalTourStructures, regionalTourFrame } from './lib/regional-tours'; export {bodyDisplayCatalog} from './lib/body-display-catalog'; export { allBodySystems } from './app/body-types'; export { initialInspection } from './lib/inspection-state';",
  loader: 'tsx', resolveDir: process.cwd(),
}, bundle: true, write: false, format: 'cjs', platform: 'node', loader: { '.css': 'empty' }, plugins: [{ name: 'gpu-boundary', setup(api) {
  api.onLoad({ filter: /[\\/]app[\\/]body-scene\.tsx$/ }, () => ({ loader: 'tsx', contents: 'if(globalThis.retryControl.importError)throw new Error("import failed"); export function BodyScene(){return null;} export function retryBodyAssets(urls,base){globalThis.retryControl.clear(urls,base);}' }));
} }] });
const nodes = tree => !tree || typeof tree !== 'object' ? [] : Array.isArray(tree) ? tree.flatMap(nodes) : [tree, ...nodes(tree.props?.children)];
const text = tree => tree == null ? '' : typeof tree === 'string' || typeof tree === 'number' ? String(tree) : Array.isArray(tree) ? tree.map(text).join('') : text(tree.props?.children);
const plain = value => JSON.parse(JSON.stringify(value));

function harness(source = catalog, tourName = 'thoraxTour', compact = false, missingDisplayId) {
  const slots = [], setters = [], timers = new Map(), listeners = new Map();
  let cursor = 0, pending = [], dirty = false, tree, serial = 0, exits = 0, mounted = true, lateUpdates = 0, autoReady = false, committedSceneKey;
  const retryControl={calls:[],importError:false,cacheError:false,clear(urls,base){this.calls.push({urls:plain(urls),base});if(this.cacheError)throw new Error('cache failed');}};
  const changed = (old, next) => !old || !next || old.length !== next.length || old.some((item, i) => !Object.is(item, next[i]));
  const shim = { ...React,
    useState(initial) { const i = cursor++; if (!(i in slots)) slots[i] = typeof initial === 'function' ? initial() : initial; setters[i] ??= value => { if(!mounted){lateUpdates++;return;} const next = typeof value === 'function' ? value(slots[i]) : value; if (!Object.is(next, slots[i])) { slots[i] = next; dirty = true; } }; return [slots[i], setters[i]]; },
    useRef(initial) { return slots[cursor++] ??= { current: initial }; },
    useMemo(fn, deps) { const i = cursor++; if (changed(slots[i]?.deps, deps)) slots[i] = { deps, value: fn() }; return slots[i].value; },
    useCallback(fn, deps) { return shim.useMemo(() => fn, deps); },
    useEffect(fn, deps) { const i = cursor++; if (changed(slots[i]?.deps, deps)) pending.push(() => { slots[i]?.cleanup?.(); slots[i] = { deps, cleanup: fn() }; }); },
  };
  const preference = { matches: false, addEventListener(_event, fn) { listeners.set('motion', fn); }, removeEventListener() { listeners.delete('motion'); } };
  const doc = { hidden: false, addEventListener(event, fn) { listeners.set(event, fn); }, removeEventListener(event) { listeners.delete(event); } };
  const win = { matchMedia: query => query.includes('max-width') ? {matches:compact} : preference, setTimeout(fn, delay) { const id = ++serial; timers.set(id, { fn, delay }); return id; }, clearTimeout(id) { timers.delete(id); } };
  const mod = { exports: {} };
  runInNewContext(built.outputFiles[0].text, { module: mod, exports: mod.exports, window: win, document: doc, structuredClone, retryControl,
    require(id) { if (id === 'react') return shim; if (id === 'next/dynamic') return () => 'BodyScene'; return require(id); } });
  const api = mod.exports, props = { catalog: api.bodyDisplayCatalog(source), tour: api[tourName], assetBase: '/atlas-runtime/head-neck', onExit() { exits++; } };
  if(missingDisplayId)props.catalog={...props.catalog,structures:props.catalog.structures.filter(s=>s.id!==missingDisplayId)};
  const tourBefore = JSON.stringify(props.tour);
  function render() { let count = 0; do { dirty = false; cursor = 0; pending = []; tree = api.RegionalGuidedLearning(props); assert(++count < 15); if(dirty)continue;
    const mountedScene=nodes(tree).find(n=>n.type==='BodyScene');
    if(autoReady&&mountedScene&&committedSceneKey!==mountedScene.key){committedSceneKey=mountedScene.key;for(const id of new Set(mountedScene.props.structures.map(s=>s.bundle)))mountedScene.props.onLoaded(id);mountedScene.props.onRendererHealth('ready');}
    for (const effect of pending) effect();
  } while (dirty); return tree; }
  function find(predicate) { const matches = nodes(tree).filter(predicate); assert.equal(matches.length, 1); return matches[0].props; }
  const scene = () => find(n => n.type === 'BodyScene');
  const button = label => find(n => n.props?.onClick && text(n) === label);
  const bundles = () => [...new Set(scene().structures.map(s => s.bundle))];
  function ready() { for (const id of bundles()) scene().onLoaded(id); scene().onRendererHealth('ready'); render(); }
  function click(label) { const control = button(label); assert(!control.disabled, `${label} enabled`); control.onClick(); render(); }
  function tick() { assert.equal(timers.size, 1); const [id, timer] = [...timers][0]; timers.delete(id); assert.equal(timer.delay, props.tour.steps[scene().reset].durationMs); timer.fn(); render(); }
  function unchanged() { assert.equal(JSON.stringify(catalog), catalogBefore, 'Source catalogue unchanged'); assert.equal(JSON.stringify(props.tour), tourBefore, 'Tour definition unchanged'); }
  function unmount(){for(const slot of slots)slot?.cleanup?.();mounted=false;}
  async function settle(){await new Promise(resolve=>setImmediate(resolve));if(mounted)render();}
  render();
  return { render, scene, button, bundles, ready, click, tick, timers, preference, listeners, doc, api, props, unchanged, unmount, settle, retryControl, mountReady(){autoReady=true;render();}, lateUpdates:()=>lateUpdates, tree: () => tree, exits: () => exits };
}

test('Retry clears only failed required anatomy and preserves the paused step and teaching',async()=>{
  const h=harness(catalog,'forearmTour',true);h.ready();h.click('Start guided tour');h.click('Next');h.click('Play');
  const explanation=()=>nodes(h.tree()).find(n=>n.props?.className==='regional-tour-explanation').props;
  const before={caption:h.props.tour.steps[1].caption,selected:h.scene().selectedId,frame:plain(h.scene().presetBounds)};
  const failed='forearm-muscles',other='head-neck-skeleton';
  h.scene().onFailure(other);h.scene().onFailure('unknown-bundle');h.render();
  assert.equal(h.timers.size,1,'Unrequested failures do not affect the tour');
  h.scene().onFailure(failed);h.render();assert.equal(h.timers.size,0);
  const retry=h.button('Retry missing anatomy');retry.onClick();retry.onClick();h.render();
  assert.equal(h.button('Retrying…').disabled,true);assert.equal(h.button('Exit tour').disabled,undefined);
  await h.settle();
  assert.deepEqual(h.retryControl.calls,[{urls:[h.props.catalog.bundles.find(b=>b.id===failed).url],base:h.props.assetBase}]);
  assert.deepEqual(plain(h.scene().retries),{[failed]:1});
  assert.equal(h.button('Play').disabled,true,'Retry must wait for the actual new load');
  h.scene().onLoaded(failed);h.render();
  assert.equal(h.button('Play').disabled,false);assert.equal(h.button('Play')['aria-pressed'],false);assert.equal(h.timers.size,0);assert.equal(h.scene().transitionPaused,true);
  assert.equal(h.scene().reset,1);assert.equal(h.scene().selectedId,before.selected);assert.deepEqual(plain(h.scene().presetBounds),before.frame);
  assert.equal(explanation().open,false);assert.ok(text(h.tree()).includes(before.caption));h.unchanged();
  h.scene().onFailure(failed);h.render();h.click('Retry missing anatomy');await h.settle();
  assert.equal(h.scene().retries[failed],2);h.scene().onFailure(failed);h.render();
  assert.equal(h.button('Play').disabled,true);assert.equal(h.button('Retry missing anatomy').disabled,false);
  assert.match(text(h.tree()),/failed to load/);h.click('Exit tour');assert.equal(h.exits(),1);
});

test('Recovered retry restores keyboard focus without stealing another control',async()=>{
  for(const moved of [false,true]){
    const h=harness();h.ready();h.click('Start guided tour');
    const failed=h.bundles()[0];h.scene().onFailure(failed);h.render();
    let focused=0;
    nodes(h.tree()).find(n=>n.props?.className==='regional-tour-controls').props.ref.current={querySelector(selector){assert.equal(selector,'[data-tour-resume]');return {focus(){focused++;}};}};
    const button={};h.doc.body={};h.doc.activeElement=button;
    h.button('Retry missing anatomy').onClick({currentTarget:button});await h.settle();
    h.doc.activeElement=moved?{}:h.doc.body;
    h.scene().onLoaded(failed);h.render();assert.equal(focused,moved?0:1);
    assert.equal(h.button('Play')['aria-pressed'],false);
  }
});

test('Import and cache-clear failures retain failure state and allow another retry',async()=>{
  for(const cause of ['importError','cacheError']){
    const h=harness(catalog,'forearmTour');h.mountReady();h.click('Start guided tour');
    const failed=h.bundles()[0];h.scene().onFailure(failed);h.render();h.retryControl[cause]=true;
    h.click('Retry missing anatomy');await h.settle();
    assert.match(text(h.tree()),/retry could not start/);assert.deepEqual(plain(h.scene().retries),{});
    assert.equal(h.button('Play').disabled,true);assert.equal(h.button('Retry missing anatomy').disabled,false);
    h.retryControl[cause]=false;h.click('Retry missing anatomy');await h.settle();
    if(cause==='importError'){
      // Like a cached rejected browser module, esbuild's failed initializer cannot recover here.
      assert.match(text(h.tree()),/retry could not start/);assert.deepEqual(plain(h.scene().retries),{});
      assert.equal(h.button('Play').disabled,true);assert.equal(h.button('Retry missing anatomy').disabled,false);
      h.click('Exit tour');assert.equal(h.exits(),1);h.unchanged();continue;
    }
    assert.equal(h.scene().retries[failed],1);h.scene().onLoaded(failed);h.render();
    assert.equal(h.button('Play').disabled,false);assert.equal(h.timers.size,0);h.unchanged();
  }
});

test('Late retry imports cannot clear caches or update an unmounted or changed tour',async()=>{
  for(const change of ['unmount','tour','assetBase']){
    const h=harness(catalog,'forearmTour');h.mountReady();h.click('Start guided tour');
    const stale=h.scene();stale.onFailure(h.bundles()[0]);h.render();h.click('Retry missing anatomy');
    if(change==='unmount')h.unmount();
    else {if(change==='tour')h.props.tour=h.api.legTour;else h.props.assetBase='/atlas-runtime/another-source';h.render();}
    await h.settle();assert.deepEqual(h.retryControl.calls,[]);assert.equal(h.lateUpdates(),0);
    if(change!=='unmount'){
      stale.onFailure('forearm-muscles');stale.onLoaded('forearm-muscles');h.render();
      assert.deepEqual(plain(h.scene().retries),{});assert.equal(h.button('Start guided tour').disabled,false,'New scene mount callbacks survive source change');
      assert.doesNotMatch(text(h.tree()),/failed to load/);h.click('Start guided tour');assert.equal(h.timers.size,0);
    }
  }
});

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

test('Source-bound quick checks pause playback, remount per step and disappear on renderer failure',()=>{
  const h=harness(catalog,'thoraxTour',true);
  const check=()=>nodes(h.tree()).find(n=>n.props?.lesson&&n.props?.onOpen);
  assert.equal(check(),undefined);
  h.ready();assert.equal(check(),undefined,'No attempt before Start');
  h.click('Start guided tour');const initial=check();assert.ok(initial.props.lesson.correctAnswer);
  const disclosureKeys=nodes(h.tree()).filter(n=>n.props?.onOpen).map(n=>n.key);
  assert.equal(new Set(disclosureKeys).size,disclosureKeys.length,'Sibling disclosures require unique keys to prevent retained duplicate panels');
  h.click('Play');assert.equal(h.timers.size,1);
  initial.props.onOpen();h.render();assert.equal(h.timers.size,0);assert.equal(h.scene().transitionPaused,true);
  h.click('Next');assert.notEqual(check().key,initial.key,'Each step resets its check');
  assert.notEqual(check().props.lesson.body,initial.props.lesson.body);
  h.scene().onRendererHealth('lost');h.render();assert.equal(check(),undefined,'No answering without available anatomy');
  h.click('Exit tour');assert.equal(h.exits(),1);h.unchanged();
});

test('Forearm tour requires both bundles and runs five exact right-sided close-ups with bounded finish', () => {
  const h=harness(catalog,'forearmTour');
  const heading=()=>nodes(h.tree()).find(n=>n.props?.className==='regional-tour-heading');
  assert.equal(heading().props['aria-live'],'polite');assert.equal(heading().props['aria-atomic'],'true');
  assert.equal(h.scene().structures.length,7);assert.deepEqual(h.bundles().sort(),['forearm-muscles','forearm-skeleton']);
  assert(h.scene().structures.every(s=>s.laterality==='right'));
  assert(h.scene().structures.every(s=>!s.id.includes(':nerve:')));
  assert.match(text(h.tree()),/nerve/i);assert.match(text(h.tree()),/registration/i);assert.match(text(h.tree()),/Draft pending radiologist review/);
  assert.equal(h.button('Start guided tour').disabled,true);
  h.scene().onLoaded('forearm-muscles');h.scene().onLoaded('unknown-bundle');h.render();
  assert.equal(h.button('Start guided tour').disabled,true);
  h.scene().onRendererHealth('ready');h.render();assert.equal(h.button('Start guided tour').disabled,true);
  h.scene().onLoaded('forearm-skeleton');h.render();assert.equal(h.button('Start guided tour').disabled,false);
  assert.equal(h.timers.size,0);h.click('Start guided tour');
  assert.equal(h.button('Back').disabled,true);h.button('Back').onClick();h.render();assert.equal(h.scene().reset,0);
  const names=['right-brachioradialis','right-extensor-digitorum','right-flexor-carpi-radialis','right-flexor-digitorum-superficialis','right-pronator-quadratus'];
  const views=['right','posterior','anterior','anterior','anterior'];
  const frames=[];
  for(let i=0;i<5;i++){
    const id=`vm:anatomy:body:forearm:right:muscle:${names[i]}`;
    assert.equal(h.scene().selectedId,id);assert.equal(h.scene().view,views[i]);
    assert.deepEqual(plain(h.props.tour.steps[i].frameIds),[id]);
    assert.deepEqual(plain(h.scene().presetBounds),plain(h.api.regionalTourFrame(h.props.catalog,h.props.tour,i)));
    assert.equal(h.scene().transitionMs,1800);assert.equal(h.scene().explode,0);assert.equal(h.scene().isolated,true);
    assert.match(text(heading()),new RegExp(`Step ${i+1} of 5`));assert.match(text(heading()),new RegExp(h.props.tour.steps[i].title.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')));
    frames.push(plain(h.scene().presetBounds));if(i<4)h.click('Next');
  }
  assert.notDeepEqual(frames[0],frames[4],'Different muscle stops use distinct source bounds');
  h.click('Back');assert.equal(h.scene().reset,3);h.click('Play');h.tick();h.tick();
  assert.equal(h.scene().reset,4);assert.equal(h.timers.size,0);assert.equal(h.button('Play')['aria-pressed'],false);assert.equal(h.exits(),0);
  h.click('Finish');assert.equal(h.exits(),1);assert.equal(h.scene().reset,4);h.unchanged();
});

const limbCases = [
  {region:'thigh',names:['right-rectus-femoris','right-vastus-lateralis','right-adductor-longus','long-head-of-right-biceps-femoris','right-semitendinosus'],views:['anterior','right','left','posterior','posterior'],bones:['right-femur'],bundles:['thigh-muscles','thigh-muscles-dissection','thigh-skeleton']},
  {region:'leg',names:['right-tibialis-anterior','right-extensor-digitorum-longus','right-fibularis-longus','right-soleus','right-tibialis-posterior'],views:['anterior','anterior','right','posterior','posterior'],bones:['right-tibia','right-fibula'],bundles:['leg-muscles','leg-skeleton']},
  {region:'hand',names:['right-abductor-pollicis-brevis','right-opponens-pollicis','abductor-digiti-minimi-of-right-hand','flexor-digiti-minimi-brevis-of-right-hand','opponens-digiti-minimi-of-right-hand'],views:Array(5).fill('anterior'),bones:['right-first-metacarpal-bone','right-fifth-metacarpal-bone'],bundles:['hand-muscles','hand-skeleton']},
  {region:'foot',names:['right-extensor-hallucis-brevis','right-abductor-hallucis','right-flexor-digitorum-brevis','abductor-digiti-minimi-of-right-foot','right-flexor-accessorius'],views:['superior','inferior','inferior','inferior','inferior'],bones:['right-calcaneus','right-first-metatarsal-bone','right-fifth-metatarsal-bone'],bundles:['foot-muscles','foot-skeleton']},
  {region:'shoulder-arm',exportName:'upperArmTour',id:'right-upper-arm-muscle-orientation',bonePrefix:'vm:anatomy:upper-limb:shoulder:right:bone:',names:['long-head-of-right-biceps-brachii','short-head-of-right-biceps-brachii','right-brachialis','long-head-of-right-triceps-brachii','lateral-head-of-right-triceps-brachii','medial-head-of-right-triceps-brachii'],views:['anterior','anterior','anterior','posterior','posterior','posterior'],bones:['humerus','scapula'],bundles:['shoulder-arm-muscles','shoulder-arm-muscles-dissection','shoulder-arm-skeleton']},
];
for(const spec of limbCases){
  test(`${spec.region} tour requires every source bundle and runs all exact stops without looping`,()=>{
    const h=harness(catalog,spec.exportName??`${spec.region}Tour`),ids=spec.names.map(name=>`vm:anatomy:body:${spec.region}:right:muscle:${name}`);
    const contexts=spec.bones.map(name=>(spec.bonePrefix??`vm:anatomy:body:${spec.region}:right:bone:`)+name);
    assert.deepEqual(h.bundles().sort(),spec.bundles);
    assert.deepEqual(plain(h.scene().structures.map(s=>s.id)).sort(),[...ids,...contexts].sort());
    assert(h.scene().structures.every(s=>s.laterality==='right'));
    assert.match(text(h.tree()),/Draft pending radiologist review/);
    h.scene().onRendererHealth('ready');h.scene().onLoaded('unknown-bundle');h.render();
    for(const bundle of spec.bundles){assert.equal(h.button('Start guided tour').disabled,true);h.scene().onLoaded(bundle);h.render();}
    assert.equal(h.button('Start guided tour').disabled,false);assert.equal(h.timers.size,0);
    h.click('Start guided tour');assert.equal(h.button('Back').disabled,true);
    h.button('Back').onClick();h.render();assert.equal(h.scene().reset,0);
    const frames=[],last=ids.length-1;
    for(let i=0;i<ids.length;i++){
      assert.equal(h.scene().selectedId,ids[i]);assert.equal(h.scene().view,spec.views[i]);
      assert.deepEqual(plain(h.props.tour.steps[i].frameIds),[ids[i]]);
      assert.equal(h.props.tour.steps[i].durationMs,14000);assert.equal(h.props.tour.steps[i].fadeOthers,true);
      assert.deepEqual(plain(h.scene().presetBounds),plain(h.api.regionalTourFrame(h.props.catalog,h.props.tour,i)));
      assert.equal(h.scene().transitionMs,1800);assert.equal(h.scene().explode,0);assert.equal(h.scene().isolated,true);
      frames.push(plain(h.scene().presetBounds));if(i<last)h.click('Next');
    }
    assert.notDeepEqual(frames[0],frames[last]);
    h.click('Back');h.click('Play');h.tick();h.tick();
    assert.equal(h.scene().reset,last);assert.equal(h.scene().selectedId,ids[last]);
    assert.equal(h.timers.size,0);assert.equal(h.button('Play')['aria-pressed'],false);assert.equal(h.exits(),0);
    h.click('Finish');assert.equal(h.exits(),1);assert.equal(h.scene().reset,last);h.unchanged();
  });
  test(`${spec.region} missing muscle or bone fails closed and Exit stays usable`,()=>{
    for(const [kind,names] of [['muscle',spec.names],['bone',spec.bones]])for(const name of names){
      const id=kind==='bone'?(spec.bonePrefix??`vm:anatomy:body:${spec.region}:right:bone:`)+name:`vm:anatomy:body:${spec.region}:right:muscle:${name}`;
      const h=harness(catalog,spec.exportName??`${spec.region}Tour`,false,id);
      assert.equal(nodes(h.tree()).filter(n=>n.type==='BodyScene').length,0);
      assert.equal(h.button('Start guided tour').disabled,true);assert.equal(h.timers.size,0);
      assert.match(text(h.tree()),/unavailable for the current anatomy source/);
      h.click('Exit tour');assert.equal(h.exits(),1);h.unchanged();
    }
  });
}

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
  assert.equal(notes().key,`imaging:${h.props.tour.steps[0].id}`);
  assert.equal(notes().props.structureName,'Trachea');assert.equal(notes().props.lessons.length,4);
  notes().props.onOpen();h.render();
  assert.equal(h.timers.size,0);assert.equal(h.button('Play')['aria-pressed'],false);assert.equal(h.scene().transitionPaused,true);
  h.click('Next');assert.equal(notes().key,`imaging:${h.props.tour.steps[1].id}`);assert.equal(h.timers.size,0);
  assert.equal(notes().props.structureName,'Right main bronchus');h.unchanged();
});

const visceralCases=[
  {name:'larynxTour',region:'head-neck',prefix:'vm:anatomy:body:head-neck:',targets:['midline:cartilage:thyroid-cartilage','midline:cartilage:cricoid-cartilage','right:cartilage:right-arytenoid-cartilage','left:cartilage:left-arytenoid-cartilage','unpaired:organ:epiglottis'],context:['vm:anatomy:body:head-neck:midline:bone:hyoid-bone'],bundles:['head-neck-connective-recovery','head-neck-organs-visceral-detail','head-neck-skeleton']},
  {name:'malePelvisTour',region:'pelvis',prefix:'vm:anatomy:body:pelvis:',targets:['unpaired:organ:urinary-bladder','unpaired:organ:prostate','right:organ:right-seminal-vesicle','left:organ:left-seminal-vesicle','unpaired:organ:rectum'],context:['vm:anatomy:body:pelvis:right:bone:right-hip-bone','vm:anatomy:body:pelvis:left:bone:left-hip-bone','vm:anatomy:body:spine:midline:bone:sacrum'],bundles:['pelvis-organs','pelvis-organs-recovery','pelvis-skeleton','spine-skeleton']},
];
for(const spec of visceralCases){
  test(`${spec.name}: exact five stops, all bundles, frames and final hold`,()=>{
    const h=harness(catalog,spec.name),ids=spec.targets.map(id=>spec.prefix+id);
    assert.deepEqual(plain(h.props.tour.contextIds),spec.context);
    assert.deepEqual(h.bundles().sort(),spec.bundles);
    assert.equal(h.props.tour.region,spec.region);
    assert.equal(h.button('Start guided tour').disabled,true);
    h.scene().onRendererHealth('ready');h.render();
    for(const bundle of spec.bundles){assert.equal(h.button('Start guided tour').disabled,true);h.scene().onLoaded(bundle);h.render();}
    h.click('Start guided tour');h.click('Play');
    for(let i=0;i<5;i++){
      assert.equal(h.scene().selectedId,ids[i]);
      assert.equal(h.scene().view,['anterior','right','posterior','posterior','left'][i]);
      assert.deepEqual(plain(h.props.tour.steps[i].frameIds),[ids[i]]);
      assert.deepEqual(plain(h.scene().presetBounds),plain(h.api.regionalTourFrame(h.props.catalog,h.props.tour,i)));
      assert.equal(h.scene().transitionMs,1800);assert.equal(h.scene().explode,0);
      assert.equal(h.scene().isolated,true);h.tick();
    }
    assert.equal(h.scene().reset,4);assert.equal(h.timers.size,0);assert.equal(h.exits(),0);
    h.click('Finish');assert.equal(h.exits(),1);h.unchanged();
  });
  test(`${spec.name}: missing selected or context source fails closed`,()=>{
    for(const id of [...spec.targets.map(id=>spec.prefix+id),...spec.context]){
      const h=harness(catalog,spec.name,false,id);
      assert.equal(nodes(h.tree()).filter(n=>n.type==='BodyScene').length,0);
      assert.equal(h.button('Start guided tour').disabled,true);
      assert.match(text(h.tree()),/unavailable for the current anatomy source/);
      h.click('Exit tour');assert.equal(h.exits(),1);h.unchanged();
    }
  });
}

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

test('Chest-wall tour uses six exact sources, smooth per-step frames and final hold',()=>{
  const h=harness(catalog,'chestWallTour',true);
  assert.equal(h.props.tour.steps.length,6);assert(h.button('Start guided tour').disabled);
  h.ready();h.click('Start guided tour');h.click('Play');
  for(let i=0;i<6;i++){
    const step=h.props.tour.steps[i],scene=h.scene();
    assert.equal(scene.selectedId,step.selectedId);assert.equal(scene.explode,0);
    assert.equal(scene.transitionMs,1800);assert.equal(scene.isolated,true);
    assert.deepEqual(plain(scene.presetBounds),plain(h.api.regionalTourFrame(h.props.catalog,h.props.tour,i)));
    h.tick();
  }
  assert.equal(h.timers.size,0);assert.equal(h.scene().reset,5);
  h.click('Finish');assert.equal(h.exits(),1);h.unchanged();
});

test('Chest-wall tour rejects every missing target or context source',()=>{
  const initial=harness(catalog,'chestWallTour');
  for(const id of [...initial.props.tour.contextIds,...initial.props.tour.steps.map(s=>s.selectedId)]){
    const h=harness(catalog,'chestWallTour',true,id);
    assert.equal(nodes(h.tree()).filter(n=>n.type==='BodyScene').length,0);
    assert(h.button('Start guided tour').disabled);h.click('Exit tour');assert.equal(h.exits(),1);
  }
});

test('Orbital tour uses corrected globe context, six close-up targets and safe finish',()=>{
 const h=harness(catalog,'orbitalTour',true);assert.equal(h.props.tour.steps.length,6);
 assert.equal(h.scene().structures.length,7);h.ready();h.click('Start guided tour');
 for(let i=0;i<6;i++){
  assert.equal(h.scene().selectedId,h.props.tour.steps[i].selectedId);
  assert.deepEqual(h.scene().presetBounds,h.api.regionalTourFrame(h.props.catalog,h.props.tour,i));
  assert.equal(h.scene().transitionMs,1800);assert.equal(h.scene().explode,0);
  assert.equal(h.scene().structures.find(s=>s.id===h.props.tour.contextIds[0]).bundle,'eye-corrected-parent');
  if(i<5)h.click('Next');
 }
 h.click('Finish');assert.equal(h.exits(),1);h.unchanged();
 const missing=harness(catalog,'orbitalTour',true,h.props.tour.contextIds[0]);
 assert.equal(nodes(missing.tree()).filter(n=>n.type==='BodyScene').length,0);
 assert(missing.button('Start guided tour').disabled);missing.click('Exit tour');assert.equal(missing.exits(),1);
});

test('Intrinsic larynx tours seven muscles with exact cartilage context and reversible exit',()=>{
 const h=harness(catalog,'intrinsicLarynxTour',true);assert.equal(h.props.tour.steps.length,7);
 assert.equal(h.scene().structures.length,10);h.ready();h.click('Start guided tour');
 for(let i=0;i<7;i++){
  assert.equal(h.scene().selectedId,h.props.tour.steps[i].selectedId);
  assert.deepEqual(h.scene().presetBounds,h.api.regionalTourFrame(h.props.catalog,h.props.tour,i));
  assert.equal(h.scene().transitionMs,1800);assert.equal(h.scene().explode,0);
  assert.equal(h.scene().structures.filter(s=>h.props.tour.contextIds.includes(s.id)).length,3);
  if(i<6)h.click('Next');
 }
 h.click('Back');assert.equal(h.scene().reset,5);h.click('Next');h.click('Finish');assert.equal(h.exits(),1);h.unchanged();
 for(const id of [...h.props.tour.contextIds,...h.props.tour.steps.map(s=>s.selectedId)]){
  const missing=harness(catalog,'intrinsicLarynxTour',true,id);
  assert.equal(nodes(missing.tree()).filter(n=>n.type==='BodyScene').length,0);
  assert(missing.button('Start guided tour').disabled);missing.click('Exit tour');assert.equal(missing.exits(),1);
 }
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
