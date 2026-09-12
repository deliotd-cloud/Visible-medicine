import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';
import { build } from './workspace-test-build.mjs';
import { build as componentBuild } from './workspace-component-test-build.mjs';
const bundled = await build({ stdin: { contents: "export * from './lib/vessel-visibility'; export * from './lib/anatomy-vessels'; export * from './app/dissection-data'; export {bodyDisplayCatalog} from './lib/body-display-catalog';", loader: 'ts', resolveDir: process.cwd() }, bundle: true, write: false, platform: 'node', format: 'esm' });
const api = await import('data:text/javascript;base64,' + Buffer.from(bundled.outputFiles[0].text).toString('base64'));
const catalog = api.bodyDisplayCatalog(JSON.parse(await readFile('public/models/bodyparts3d/full-body/catalog.json')));
const catalogBefore = JSON.stringify(catalog);
const {dissectionReducer: reduce, resolveDissection: resolve, initialDissection: initial} = api;
const snap = ({stageId,focusId,removed,restored}) => ({stageId,focusId,removed,restored});
let scopes=0, plans=0, componentCallbacks=0, parentCallbacks=0;
for (const [region, profile] of Object.entries(api.dissectionProfiles)) for (const side of ['both','left','right']) {
  const scope=catalog.structures.filter(s=>(region==='whole-body'||s.regions.includes(region))&&(side==='both'||s.laterality===side||['midline','unpaired','unspecified'].includes(s.laterality)));
  scopes++;
  for (const recipe of [...profile.stages.map(s=>({type:'stage',id:s.id})),...profile.focuses.map(s=>({type:'focus',id:s.id}))]) {
    let before=reduce(initial,recipe);
    const other=scope.find(s=>s.system!=='vessels');
    if(other) before=reduce(before,{type:'remove',id:other.id});
    const visible=resolve(scope,profile,before).visible.map(s=>s.id);
    const beforeJson=JSON.stringify(before);
    for(const kind of ['artery','vein','unclassified']) for(const show of [false,true]) {
      const action=api.vesselVisibilityAction(scope,visible,kind,show,false);
      const targets=scope.filter(s=>s.system==='vessels'&&api.vesselKind(s)===kind);
      const expected=targets.filter(s=>visible.includes(s.id)!==show).map(s=>s.id);
      assert.equal(api.vesselVisibilityAction(scope,visible,kind,show,true),null);
      if(!expected.length) {assert.equal(action,null);continue;}
      assert.deepEqual(action,{type:show?'restore-many':'remove-many',ids:expected});
      const after=reduce(before,action), actual=resolve(scope,profile,after).visible.map(s=>s.id);
      assert.equal(after.stageId,before.stageId);assert.equal(after.focusId,before.focusId);
      assert.equal(after.history.length,Math.min(40,before.history.length+1));
      for(const s of scope) assert.equal(actual.includes(s.id),targets.includes(s)?show:visible.includes(s.id));
      assert.deepEqual(snap(reduce(after,{type:'undo'})),snap(before));
      assert.deepEqual(reduce(reduce(after,{type:'undo'}),{type:'redo'}),after);
      assert.equal(api.vesselVisibilityAction(scope,actual,kind,show,false),null);
      assert.equal(reduce(after,action),after);
      assert.equal(JSON.stringify(before),beforeJson);
      plans++;
    }
  }
}
assert.equal(JSON.stringify(catalog),catalogBefore);
const all=catalog.structures.map(s=>s.id), groups=api.vesselVisibilityGroups(catalog.structures,all);
assert.deepEqual(groups.map(g=>[g.kind,g.total]),[['artery',184],['vein',98]]);
assert(groups.every(g=>g.shown===g.total));
assert.deepEqual(groups.map(g=>g.kind),['artery','vein']);
const artery=catalog.structures.find(s=>s.system==='vessels'&&api.vesselKind(s)==='artery');
const mixed=all.filter(id=>id!==artery.id);
assert.equal(api.vesselVisibilityGroups(catalog.structures,mixed)[0].shown,groups[0].total-1);
const unknown={...artery,id:'unclassified-fixture',sourceName:'unknown vessel',fmaId:'FMA0'};
const unknownGroups=api.vesselVisibilityGroups([unknown],[]);
assert.deepEqual(unknownGroups,[{kind:'unclassified',label:'Other vessels',total:1,shown:0}]);
assert.equal(api.vesselVisibilityAction(catalog.structures,all,'invalid',true,false),null);
assert.equal(api.vesselVisibilityAction(catalog.structures,all,'artery','yes',false),null);
assert.equal(api.vesselVisibilityAction([],all,'artery',true,false),null);
assert.equal(reduce(initial,{type:'remove-many',ids:[]}),initial);
const duplicate=reduce(initial,{type:'remove-many',ids:[artery.id,artery.id]});
assert.deepEqual(duplicate.removed,[artery.id]);
const restored=reduce(initial,{type:'restore',id:artery.id});
assert.deepEqual(reduce(restored,{type:'remove-many',ids:[artery.id]}).restored,[]);

const require=createRequire(import.meta.url), React=require('react');
const built=await componentBuild({entryPoints:['app/vessel-system-control.tsx'],bundle:true,write:false,format:'cjs',platform:'node'});
const mod={exports:{}};
runInNewContext(built.outputFiles[0].text,{module:mod,exports:mod.exports,require,console,process:{env:{NODE_ENV:'test'}}});
const render=(Component,props)=>require('react-dom/server').renderToStaticMarkup(React.createElement(Component,props));
const props={structures:catalog.structures,visibleIds:mixed,enabled:true,disabled:false,canUndo:true,canRedo:false,onVisibility(){},onEnabled(){},onUndo(){},onRedo(){}};
const closed=render(mod.exports.VesselSystemControl,props);
assert(closed.includes('aria-expanded="false"'));assert(closed.includes('Show Vessels'));
assert(!closed.includes('aria-label="Vessel visibility"'));
const expanded=render(mod.exports.VesselVisibilityOptions,props);
assert(expanded.includes('aria-checked="mixed"'));
assert(expanded.includes('Show arteries')&&expanded.includes('Show veins')&&expanded.includes('Undo'));
assert(!expanded.includes('Other vessels'));
assert(render(mod.exports.VesselVisibilityOptions,{...props,structures:[unknown],visibleIds:[]}).includes('Other vessels'));
const walk=(n,fn)=>{if(!n||typeof n!=='object')return;if(Array.isArray(n)){n.forEach(c=>walk(c,fn));return;}fn(n);walk(n.props?.children,fn);};
for(const disabled of [false,true]) for(const enabled of [false,true]) {
  const calls=[];
  const tree=mod.exports.VesselVisibilityOptions({...props,disabled,enabled,onVisibility:(...v)=>calls.push(v),onUndo:()=>calls.push('undo'),onRedo:()=>calls.push('redo')});
  walk(tree,n=>{if(n.props?.onCheckedChange){n.props.onCheckedChange(false);n.props.onCheckedChange(true);componentCallbacks+=2;}});
  assert.equal(calls.length,!disabled&&enabled?groups.length*2:0);
  const history=[];walk(tree,n=>{if(n.props?.onClick)history.push(n);});
  calls.length=0;history.forEach(n=>n.props.onClick());assert.deepEqual(calls,disabled?[]:['undo']);
}

// Execute the real parent handler; do not substitute a matching test implementation.
const parent=await readFile('app/body-explorer.tsx','utf8');
const ast=ts.createSourceFile('body.tsx',parent,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
let handler,wiring;
function visit(n){if(ts.isFunctionDeclaration(n)&&n.name?.text==='changeVesselVisibility')handler=n.getText(ast);if(ts.isJsxSelfClosingElement(n)&&n.tagName.getText(ast)==='VesselSystemControl')wiring=n.getText(ast);ts.forEachChild(n,visit);}visit(ast);
assert(handler&&wiring);assert(wiring.includes('onVisibility={changeVesselVisibility}')&&wiring.includes('disabled={exam}'));
assert(wiring.includes('onUndo={undoDissection}')&&wiring.includes('onRedo={redoDissection}'));
const handlerJS=ts.transpileModule(handler,{compilerOptions:{target:ts.ScriptTarget.ES2022}}).outputText;
for(const exam of [false,true])for(const enabled of [false,true]) {
  const actions=[];
  runInNewContext(handlerJS+';changeVesselVisibility("artery",false);',{regionStructures:catalog.structures,resolved:{visible:catalog.structures},exam,systems:{vessels:enabled},vesselVisibilityAction:api.vesselVisibilityAction,dispatch:v=>actions.push(v)});
  assert.equal(actions.length,!exam&&enabled?1:0);parentCallbacks++;
  if(actions.length)assert.deepEqual(actions[0].ids,api.vesselVisibilityAction(catalog.structures,all,'artery',false,false).ids);
}
// Preserve the UI-pass baseline, permitting only the subsequent source-bound lesson extension.
const normalize=text=>text.replaceAll('\r\n','\n');
const previousLessons=normalize(execFileSync('git',['show','e5521766d4035044bd2b057818d6153783a4294e:app/body-content.ts'],{maxBuffer:8e6}).toString());
const expectedLessons=previousLessons
  .replace("import { inferiorThyroidLesson } from '../lib/inferior-thyroid-arteries';", "import { inferiorThyroidLesson } from '../lib/inferior-thyroid-arteries';\nimport { subscapularArteryLesson } from '../lib/subscapular-arteries';")
  .replace('export function bodyLesson(s: BodyStructure, tab: ContentTab): ContentLesson {', 'export function bodyLesson(s: BodyStructure, tab: ContentTab): ContentLesson {\n  const subscapular = subscapularArteryLesson(s, tab);\n  if (subscapular) return subscapular;');
const expectedWithCircumflex=expectedLessons
  .replace("import { subscapularArteryLesson } from '../lib/subscapular-arteries';", "import { subscapularArteryLesson } from '../lib/subscapular-arteries';\nimport { circumflexFemoralLesson } from '../lib/circumflex-femoral';")
  .replace('export function bodyLesson(s: BodyStructure, tab: ContentTab): ContentLesson {', 'export function bodyLesson(s: BodyStructure, tab: ContentTab): ContentLesson {\n  const circumflex = circumflexFemoralLesson(s, tab);\n  if (circumflex) return circumflex;');
assert.notEqual(expectedLessons,previousLessons);
assert.notEqual(expectedWithCircumflex,expectedLessons);
const expectedWithCranial=expectedWithCircumflex
  .replace("import { circumflexFemoralLesson } from '../lib/circumflex-femoral';", "import { circumflexFemoralLesson } from '../lib/circumflex-femoral';\nimport { cranialArteryLesson } from '../lib/cranial-arteries';")
  .replace('export function bodyLesson(s: BodyStructure, tab: ContentTab): ContentLesson {', 'export function bodyLesson(s: BodyStructure, tab: ContentTab): ContentLesson {\n  const cranial = cranialArteryLesson(s, tab);\n  if (cranial) return cranial;');
assert.notEqual(expectedWithCranial,expectedWithCircumflex);
assert.equal(normalize(await readFile('app/body-content.ts','utf8')),expectedWithCranial);
for(const path of ['app/body-scene.tsx','lib/anatomy-vessels.ts','package-lock.json','public/models/bodyparts3d/full-body/catalog.json','content/abdominal-organ-imaging.ts'])
  assert.deepEqual(await readFile(path),execFileSync('git',['show','e5521766d4035044bd2b057818d6153783a4294e:'+path],{maxBuffer:8e6}));
const report={scopes,plans,groups,componentCallbacks,parentCallbacks,defaultCollapsed:true,sourcePreserved:true,clinicalApproval:false,browserTesting:false};
await writeFile('docs/vessel-visibility-validation.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report));
