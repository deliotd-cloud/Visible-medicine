import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { build } from './workspace-test-build.mjs';
import { build as componentBuild } from './workspace-component-test-build.mjs';
import { preGenicularStudyProfiles } from './genicular-study-history.mjs';
const compiled = await build({ stdin: { contents: `
export * from './content/genicular-study'; export * from './lib/genicular-study';
export * from './lib/body-display-catalog'; export * from './lib/study-links';
export * from './lib/study-library'; export * from './app/dissection-data';
export * from './lib/close-up-labels'; export * from './lib/limb-vascular-studies';
export * from './lib/longus-colli';`, resolveDir: process.cwd(), loader: 'ts' },
bundle: true, write: false, platform: 'node', format: 'esm' });
const a = await import('data:text/javascript;base64,' + Buffer.from(compiled.outputFiles[0].text).toString('base64'));
const raw = JSON.parse(await readFile('public/models/bodyparts3d/full-body/catalog.json'));
const catalog = a.bodyDisplayCatalog(raw), before = JSON.stringify(catalog);
const pins = JSON.parse(await readFile('content/genicular-study-pins.json'));
const hash = (v) => createHash('sha256').update(v).digest('hex');
assert.equal(hash(JSON.stringify(preGenicularStudyProfiles(a.dissectionProfiles))), 'afba80ef8e232d6dd21f9b4c00b73284db7dcb7a8778c520fd4096d9990e9176');
const changed = structuredClone(a.dissectionProfiles);
changed.hand.title = 'changed';
assert.throws(() => preGenicularStudyProfiles(changed), /Unrecorded/, 'Foreign profile edits must fail exact historical replay');
const id = 'knee-genicular-arteries', ids = (items) => items.map((s) => s.id).sort();
let scopes = 0, links = 0, rejections = 0, labels = 0, handlers = 0, renders = 0;
const expected = ['FMA22562','FMA22563','FMA22586','FMA22587','FMA22588','FMA22589','FMA43890','FMA43891','FMA43892','FMA43893','FMA77380','FMA77381','FMA24474','FMA24475','FMA24477','FMA24478','FMA24480','FMA24481','FMA24486','FMA24487','FMA22591','FMA22592'];
assert.deepEqual([...a.genicularStudySourceIds].sort(), expected.sort());
assert.equal(a.genicularStudyReady(raw, 'leg', id), false);
assert.equal(a.genicularStudyReady(catalog, 'thigh', id), false);
assert.equal(a.genicularStudyReady(null, 'leg', id), false);
assert.equal(a.genicularStudyReady(null, 'leg', 'unrelated-recipe'), true);
const scenes = new Map();
for (const b of pins.bundles) {
  const bytes = await readFile('public' + b.url.split('?')[0]);
  assert.equal(hash(bytes), b.sha256);
  scenes.set(b.id, (await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), '')).scene);
}
for (const region of ['leg', 'whole-body']) for (const side of ['both', 'left', 'right']) {
  scopes++;
  const scope = a.bodyStudyScope(catalog, region, side), profile = a.dissectionProfiles[region];
  const state = a.dissectionReducer(a.initialDissection, { type: 'focus', id });
  const visible = a.resolveDissection(scope, profile, state).visible;
  assert.equal(visible.length, side === 'both' ? 22 : 11);
  assert.deepEqual(ids(visible), ids(scope.filter((s) => expected.includes(s.fmaId))));
  assert(!profile.stages.some((s) => s.id === id));
  const card = a.studyLibrary(scope, profile).find((c) => c.key === 'focus:' + id);
  assert.equal(card.recipes.length, 1);
  assert.equal(card.recipes[0].targets.length, side === 'both' ? 12 : 6);
  assert(a.filterStudyLibrary([card], 'genicular', 'vessels').length === 1);
  assert.deepEqual(a.studyLibraryAction(scope, profile, card.key, false), { kind: 'focus', id });
  assert.equal(a.studyLibraryAction(scope, profile, card.key, true), null);
  const input = { catalog, region, recipeId: id, structures: scope, visibleIds: ids(visible), enabled: true };
  const roi = a.genicularStudyBounds(input);
  assert(roi);
  const inside = (p) => p.every((v, axis) => v >= roi.min[axis] && v <= roi.max[axis]);
  for (const s of visible) {
    if (s.system !== 'skeleton') assert(inside(s.bounds.min) && inside(s.bounds.max), 'All retained vascular and muscle envelopes fit');
    const geometry = scenes.get(s.bundle).getObjectByName(s.nodeName).geometry;
    const point = a.closeUpLabelAnchor(geometry, s.anchor, roi);
    assert(point && inside(point), `${s.name} has a real in-frame label anchor`);
    if (!inside(s.anchor)) {
      const positions = geometry.getAttribute('position');
      let found = false;
      for (let i = 0; i < positions.count; i++) if ([positions.getX(i), positions.getY(i), positions.getZ(i)].every((v, axis) => v === point[axis])) { found = true; break; }
      assert(found, 'No clamped or fabricated anchor');
    }
    labels++;
    const url = a.makeStudyLink(catalog, region, s.id, side, id);
    assert(url);
    const link = a.parseStudyLink(Object.fromEntries(new URL(url, 'https://atlas.invalid').searchParams));
    const resolved = a.resolveStudyLink(catalog, region, link);
    assert.equal(resolved.status, 'ready');
    assert.deepEqual([...resolved.visibleIds].sort(), ids(visible));
    if (side !== 'both') assert.equal(a.makeStudyLink(catalog, region, s.id, side === 'left' ? 'right' : 'left', id), null);
    links++;
  }
  const muscle = visible.find((s) => s.system === 'muscles');
  const removed = a.dissectionReducer(state, { type: 'remove', id: muscle.id });
  const after = a.resolveDissection(scope, profile, removed).visible;
  assert(!after.includes(muscle));
  assert.deepEqual(a.genicularStudyBounds({ ...input, visibleIds: ids(after) }), roi, 'Hiding tissue does not jump the camera');
  assert.deepEqual(ids(a.resolveDissection(scope, profile, a.dissectionReducer(removed, { type: 'undo' })).visible), ids(visible));
  assert.deepEqual(ids(a.resolveDissection(scope, profile, a.dissectionReducer(a.dissectionReducer(removed, { type: 'undo' }), { type: 'redo' })).visible), ids(after));
  assert.deepEqual(ids(a.resolveDissection(scope, profile, a.dissectionReducer(state, { type: 'undo' })).visible), ids(scope));
  for (const patch of [{enabled:false}, {visibleIds:[]}, {visibleIds:[...input.visibleIds,input.visibleIds[0]]}, {recipeId:'assembled'}, {visibleIds:[...input.visibleIds,'unknown']}, {visibleIds:[...input.visibleIds,scope.find((s) => !expected.includes(s.fmaId)).id]}]) assert.equal(a.genicularStudyBounds({...input,...patch}),null);
}
const selected = pins.entries.find((s) => s.fmaId === 'FMA22562');
const link = a.parseStudyLink(Object.fromEntries(new URL(a.makeStudyLink(catalog,'leg',selected.id,'right',id),'https://atlas.invalid').searchParams));
const reject = (mutate) => {
  const bad = structuredClone(catalog); mutate(bad);
  assert.equal(a.genicularStudyReady(bad,'leg',id),false);
  assert.equal(a.limbVascularStudyReady(bad,'leg',id),false);
  assert.equal(a.resolveStudyLink(bad,'leg',link).status,'rejected'); rejections++;
};
for (const p of pins.entries) {
  reject((c) => { c.structures = c.structures.filter((s) => s.id !== p.id); });
  reject((c) => c.structures.push({...structuredClone(p),id:p.id+'-alias'}));
  for (const change of [(s)=>s.anchor[0]+=0.01,(s)=>s.laterality='wrong',(s)=>s.sources[0].sha256='changed',(s)=>s.nodeName='wrong',(s)=>s.bundle='wrong']) reject((c)=>change(c.structures.find((s)=>s.id===p.id)));
}
for (const p of pins.bundles) {
  reject((c)=>{c.bundles=c.bundles.filter((b)=>b.id!==p.id);});
  reject((c)=>c.bundles.find((b)=>b.id===p.id).sha256='changed');
  reject((c)=>c.bundles.push({...structuredClone(p),id:p.id+'-alias',url:p.url.split('?')[0]+'?alias=1'}));
}
for (const field of ['license','sourceVersion','coordinateSystem']) reject((c)=>c[field]='changed');
const source = await readFile('app/body-explorer.tsx','utf8');
const ast = ts.createSourceFile('body.tsx',source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
let action;
function visit(n) { if(ts.isFunctionDeclaration(n)&&n.name?.text==='changeFocus') action=ts.transpile(n.getText(ast),{target:ts.ScriptTarget.ES2022}); ts.forEachChild(n,visit); } visit(ast);
for (const region of ['leg','whole-body']) for(const mode of ['ready','exam','changed']) {
  const calls=[], cameraRestore={current:{pending:true}}, bad=structuredClone(catalog);
  if(mode==='changed') bad.structures=bad.structures.filter((s)=>s.id!==selected.id);
  const env={catalog:bad,initialRegion:region,side:'both',profile:a.dissectionProfiles[region],exam:mode==='exam',layout:'tray',cameraRestore,initialInspection:{plane:'off'},allBodySystems:{},limbVascularStudyReady:a.limbVascularStudyReady,longusColliStudyReady:a.longusColliStudyReady};
  for(const name of ['dispatch','setInspection','setPlate','setLayout','setSystems','setSelectedId','setFocus','setIsolated','setExplode','setZoom','setView','setReset']) env[name]=(v)=>calls.push([name,typeof v==='function'?v(0):v]);
  assert.equal(runInNewContext(action+`;changeFocus('${id}')`,env),mode==='ready'); handlers++;
  if(mode==='ready') {assert.equal(cameraRestore.current,null);assert.equal(calls.find((c)=>c[0]==='setExplode')[1],0);assert.equal(calls.find((c)=>c[0]==='setView')[1],'posterior');assert.deepEqual(JSON.parse(JSON.stringify(calls.find((c)=>c[0]==='dispatch')[1])),{type:'focus',id});}
  else {assert.deepEqual(calls,[]);assert.deepEqual(cameraRestore.current,{pending:true});}
}
const require=createRequire(import.meta.url), React=require('react');
const component=await componentBuild({entryPoints:['app/study-library.tsx'],bundle:true,write:false,format:'cjs',platform:'node'}), mod={exports:{}};
runInNewContext(component.outputFiles[0].text,{module:mod,exports:mod.exports,require,console,process:{env:{NODE_ENV:'test'}}});
for(const region of ['leg','whole-body']) for(const side of ['both','left','right']) for(const disabled of [false,true]) {
  const scope=a.bodyStudyScope(catalog,region,side);
  const html=require('react-dom/server').renderToStaticMarkup(React.createElement(mod.exports.StudyLibrary,{profile:a.dissectionProfiles[region],state:a.initialDissection,structures:scope,visibleIds:ids(scope),loaded:[],failed:[],disabled,onStage(){},onFocus(){}}));
  assert(html.includes(disabled?'End practice':'Knee: genicular arteries')); renders++;
}
assert.equal(JSON.stringify(catalog),before);
console.log(JSON.stringify({studies:1,sourceSelections:22,scopes,links,realLabelAnchors:labels,rejections,actualParentHandlers:handlers,actualComponentRenders:renders,previousRecipesUnchanged:true,geometryChanged:false,browserTesting:false,clinicalApproval:false}));
