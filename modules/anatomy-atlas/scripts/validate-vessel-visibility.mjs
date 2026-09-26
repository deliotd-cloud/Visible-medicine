import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';
import * as frameworkLink from 'vinext/shims/link';
import { build } from './workspace-test-build.mjs';
import { build as componentBuild } from './workspace-component-test-build.mjs';
const bundled = await build({ stdin: { contents: "export * from './lib/vessel-visibility'; export * from './lib/anatomy-vessels'; export * from './app/dissection-data'; export {bodyDisplayCatalog} from './lib/body-display-catalog';", loader: 'ts', resolveDir: process.cwd() }, bundle: true, write: false, platform: 'node', format: 'esm' });
const api = await import('data:text/javascript;base64,' + Buffer.from(bundled.outputFiles[0].text).toString('base64'));
const catalog = api.bodyDisplayCatalog(JSON.parse(await readFile('public/models/bodyparts3d/full-body/catalog.json')));
const catalogBefore = JSON.stringify(catalog);
const gitShow=(commit,path)=>execFileSync('git',['show',`${commit}:${path}`],{maxBuffer:8e6});
const gitJson=(commit,path)=>JSON.parse(gitShow(commit,path).toString());
const controlParent='e5521766d4035044bd2b057818d6153783a4294e',controlCommit='f271f3f';
const historicalSourcePaths=[
  'public/models/bodyparts3d/brachial-veins/catalog.json',
  'public/models/bodyparts3d/deep-leg-veins/catalog.json',
  'public/models/bodyparts3d/portal-veins/catalog.json',
  'public/models/bodyparts3d/hepatic-veins/catalog.json',
  'public/models/bodyparts3d/cubital-veins/catalog.json',
  'public/models/bodyparts3d/genicular-arteries/catalog.json',
  'public/models/bodyparts3d/inferior-thyroid-arteries/catalog.json',
  'public/models/bodyparts3d/inferior-epigastric-vessels/catalog.json',
  'public/models/bodyparts3d/pelvic-veins/catalog.json',
];
const historicalVessels=[
  ...gitJson(controlCommit,'public/models/bodyparts3d/full-body/catalog.json').structures,
  ...historicalSourcePaths.flatMap(path=>gitJson(controlCommit,path).structures),
].filter(s=>s.system==='vessels');
const admittedEraSpecs=[
  {name:'subscapular',commit:'489c25f',path:'public/models/bodyparts3d/subscapular-arteries/catalog.json',count:2,auditSha256:'a598c4e0355de55da4fbdbe73a96f75ad1c0ae8e83641b982a0dbe3613f867e8'},
  {name:'circumflex-femoral',commit:'82ffc96',path:'public/models/bodyparts3d/circumflex-femoral/catalog.json',count:2,auditSha256:'2371bfb1d42d70621ad056059c70d734bba090171d104696e2af6acb05c19678'},
  {name:'cranial',commit:'8385c16',path:'public/models/bodyparts3d/cranial-arteries/catalog.json',count:5,auditSha256:'6af13b26ae304a52b20915ba2990fe1497d30f089944836dce712c279272cd9a'},
  {name:'elbow',commit:'bda1330',path:'public/models/bodyparts3d/elbow-arteries/catalog.json',count:14,auditSha256:'161f22c01b4667002d197e244ebefdb8eb1287405e354f1eb981a2c9345bba49'},
];
const admittedEras=await Promise.all(admittedEraSpecs.map(async spec=>({...spec,canonical:gitJson(spec.commit,spec.path),current:JSON.parse(await readFile(spec.path,'utf8'))})));
// Replay only these two recorded later changes; never replace the f271 baseline.
const celiacCommit='3305cb9a28206db86e7f9b0171323d88a3cfa01b';
const cardiacCommit='92d97d239e719bfb11fdecbede21b6101d0485f0';
const celiac=gitJson(celiacCommit,'content/celiac-display-transition.json');
const cardiac=gitJson(cardiacCommit,'content/anterior-cardiac-vein-transition.json');
const celiacSource=gitJson(celiacCommit,'public/models/bodyparts3d/celiac-display/display-correction.json');
const cardiacSource=gitJson(cardiacCommit,'public/models/bodyparts3d/anterior-cardiac-vein/catalog.json');
for(const [commit,path] of [
  [celiacCommit,'content/celiac-display-transition.json'],
  [celiacCommit,'public/models/bodyparts3d/celiac-display/display-correction.json'],
  [cardiacCommit,'content/anterior-cardiac-vein-transition.json'],
  [cardiacCommit,'public/models/bodyparts3d/anterior-cardiac-vein/catalog.json'],
]) assert.deepEqual(JSON.parse(await readFile(path,'utf8')),gitJson(commit,path),'Recorded transition/source changed: '+path);
assert.deepEqual(celiacSource.original,celiac.original);assert.deepEqual(celiacSource.replacement,celiac.replacement);
assert.deepEqual(cardiacSource.structures,[cardiac.structure]);
assert.equal(historicalVessels.filter(s=>s.id===celiac.original.id).length,1);
assert(!historicalVessels.some(s=>s.id===cardiac.structure.id));
const recordedVessels=[...historicalVessels.map(s=>{
  if(s.id!==celiac.original.id)return s;
  assert.deepEqual(s,celiac.original);return celiac.replacement;
}),cardiac.structure];
function verifyVesselSourceHistory(display,eras=admittedEras){
  const admittedIds=new Set();
  for(const era of eras){
    assert.equal(era.canonical.structures.length,era.count,`${era.name} historical count changed`);
    assert.equal(era.canonical.auditSha256,era.auditSha256,`${era.name} historical audit changed`);
    assert.deepEqual(era.current,era.canonical,`${era.name} source record differs from its admitted commit`);
    for(const source of era.canonical.structures){
      assert.equal(source.system,'vessels');assert.equal(api.vesselKind(source),'artery');
      assert(!admittedIds.has(source.id),`Duplicate admitted vessel ${source.id}`);admittedIds.add(source.id);
      const matches=display.structures.filter(candidate=>candidate.id===source.id);
      assert.equal(matches.length,1,`Missing or duplicate admitted vessel ${source.id}`);
      assert.deepEqual(matches[0],source,`Admitted vessel identity/source changed: ${source.id}`);
    }
  }
  const vesselRecords=display.structures.filter(s=>s.system==='vessels');
  assert.deepEqual(vesselRecords.filter(s=>!admittedIds.has(s.id)),recordedVessels,'Unknown vessel growth or recorded-source drift');
  for(const bundle of [celiacSource.bundle,...cardiacSource.bundles])
    assert.deepEqual(display.bundles.find(b=>b.id===bundle.id),bundle,'Recorded vessel bundle changed');
  const historicalGroups=api.vesselVisibilityGroups(historicalVessels,historicalVessels.map(s=>s.id));
  assert.deepEqual(historicalGroups.map(g=>[g.kind,g.total]),[['artery',175],['vein',98]]);
  const currentGroups=api.vesselVisibilityGroups(vesselRecords,vesselRecords.map(s=>s.id));
  assert.deepEqual(currentGroups.map(g=>[g.kind,g.total]),[['artery',198],['vein',99]]);
  return {historicalGroups,currentGroups,admittedIds};
}
const sourceHistory=verifyVesselSourceHistory(catalog);
let negativeMutations=0;
const unknownGrowth=structuredClone(catalog);unknownGrowth.structures.push({...historicalVessels[0],id:'vm:test:unknown-vessel-growth'});
assert.throws(()=>verifyVesselSourceHistory(unknownGrowth));negativeMutations++;
const changedIdentity=structuredClone(catalog);const admittedId=admittedEras[0].canonical.structures[0].id;changedIdentity.structures.find(s=>s.id===admittedId).sources[0].sha256='0'.repeat(64);
assert.throws(()=>verifyVesselSourceHistory(changedIdentity));negativeMutations++;
const changedAdmission=structuredClone(admittedEras);changedAdmission[0].current.structures[0].sourceName='unrecorded source identity';
assert.throws(()=>verifyVesselSourceHistory(catalog,changedAdmission));negativeMutations++;
const missingAdmission=structuredClone(catalog);missingAdmission.structures=missingAdmission.structures.filter(s=>s.id!==admittedId);
assert.throws(()=>verifyVesselSourceHistory(missingAdmission));negativeMutations++;
for(const id of [celiac.replacement.id,cardiac.structure.id]) for(const mutation of ['identity','missing','duplicate','bundle']) {
  const bad=structuredClone(catalog),index=bad.structures.findIndex(s=>s.id===id),structure=bad.structures[index];
  if(mutation==='identity')structure.sources[0].sha256='0'.repeat(64);
  else if(mutation==='missing')bad.structures.splice(index,1);
  else if(mutation==='duplicate')bad.structures.push(structuredClone(structure));
  else bad.bundles.find(b=>b.id===structure.bundle).sha256='0'.repeat(64);
  assert.throws(()=>verifyVesselSourceHistory(bad),'Reject recorded vessel drift: '+id+'/'+mutation);negativeMutations++;
}
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
assert.deepEqual(groups,sourceHistory.currentGroups);
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
// The app resolves next/link through Vinext; exercise that installed shim in
// this server-render harness rather than requiring an absent Next package.
runInNewContext(built.outputFiles[0].text,{module:mod,exports:mod.exports,require:id=>id==='next/link'?frameworkLink:require(id),console,process:{env:{NODE_ENV:'test'}}});
const render=(Component,props)=>require('react-dom/server').renderToStaticMarkup(React.createElement(Component,props));
const props={structures:catalog.structures,visibleIds:mixed,enabled:true,disabled:false,canUndo:true,canRedo:false,onVisibility(){},onEnabled(){},onUndo(){},onRedo(){}};
const closed=render(mod.exports.VesselSystemControl,props);
assert(closed.includes('aria-expanded="false"'));assert(closed.includes('Show Vessels'));
assert(!closed.includes('aria-label="Vessel visibility"'));
const expanded=render(mod.exports.VesselVisibilityOptions,props);
assert(expanded.startsWith('<fieldset class="vessel-system-options" aria-label="Vessel visibility">'));
assert(expanded.endsWith('</fieldset>'));
assert(expanded.includes('aria-checked="mixed"'));
assert(expanded.includes('Show arteries')&&expanded.includes('Show veins')&&expanded.includes('Undo'));
assert(!expanded.includes('Other vessels'));
assert(render(mod.exports.VesselVisibilityOptions,{...props,structures:[unknown],visibleIds:[]}).includes('Other vessels'));
const walk=(n,fn)=>{if(!n||typeof n!=='object')return;if(Array.isArray(n)){n.forEach(c=>walk(c,fn));return;}fn(n);walk(n.props?.children,fn);};
for(const disabled of [false,true]) for(const enabled of [false,true]) {
  const calls=[];
  const tree=mod.exports.VesselVisibilityOptions({...props,disabled,enabled,onVisibility:(...v)=>calls.push(v),onUndo:()=>calls.push('undo'),onRedo:()=>calls.push('redo')});
  assert.equal(tree.type,'fieldset');assert.equal(tree.props['aria-label'],'Vessel visibility');
  assert.equal(tree.props.tabIndex,undefined,'Group must not add a keyboard stop');
  walk(tree,n=>{if(n.props?.onCheckedChange){n.props.onCheckedChange(false);n.props.onCheckedChange(true);componentCallbacks+=2;}});
  assert.equal(calls.length,!disabled&&enabled?groups.length*2:0);
  const history=[];walk(tree,n=>{if(n.props?.onClick)history.push(n);});
  calls.length=0;history.forEach(n=>n.props.onClick());assert.deepEqual(calls,disabled?[]:['undo']);
}

// Execute the real parent handler; do not substitute a matching test implementation.
const vesselCss=require('postcss').parse(await readFile('app/vessel-system-control.css','utf8'));
let groupCss;
vesselCss.walkRules('.anatomy-control-rail .body-vessel-system .vessel-system-options',rule=>{
  assert.equal(groupCss,undefined);
  groupCss=Object.fromEntries(rule.nodes.filter(n=>n.type==='decl').map(n=>[n.prop,n.value]));
});
assert(groupCss);
for(const [property,value] of Object.entries({'min-width':'0','min-inline-size':'0','margin':'0','padding':'6px 0 0','border':'0'}))
  assert.equal(groupCss[property],value,'Native control group retains compact layout: '+property);
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
// The UI pass changed no teaching. Check that statement inside the immutable
// e552 -> f271 era; later source-bound lessons are intentionally out of scope.
const historicalPreserved=['app/body-scene.tsx','app/body-content.ts','lib/anatomy-vessels.ts','package-lock.json','public/models/bodyparts3d/full-body/catalog.json','content/abdominal-organ-imaging.ts'];
for(const path of historicalPreserved)assert.deepEqual(gitShow(controlCommit,path),gitShow(controlParent,path),`${path} changed in the accepted UI-control era`);
const currentPreserved=['lib/anatomy-vessels.ts','public/models/bodyparts3d/full-body/catalog.json','content/abdominal-organ-imaging.ts'];
for(const path of currentPreserved)assert.deepEqual(await readFile(path),gitShow(controlParent,path),`${path} drifted after the accepted UI-control era`);
// Two independently committed direct-dependency promotions happened later.
// Reconstruct their exact three-field delta; neither changes package versions.
const bvhCommit='94fa489683ac7817b678bdfcf0b9df4f12c1cf66';
const harnessCommit='23b8f3bcc0b03e71d966e50358eb33cc8930f6de';
const recordedLock=gitJson(controlParent,'package-lock.json');
assert.equal(recordedLock.packages['node_modules/three-mesh-bvh'].version,'0.8.3');
recordedLock.packages[''].dependencies['three-mesh-bvh']='0.8.3';
assert.deepEqual(recordedLock,gitJson(bvhCommit,'package-lock.json'));
assert.equal(recordedLock.packages['node_modules/tsx'].version,'4.23.13');
assert.equal(recordedLock.packages['node_modules/tsx'].devOptional,true);
recordedLock.packages[''].devDependencies.tsx='4.23.13';
delete recordedLock.packages['node_modules/tsx'].devOptional;
recordedLock.packages['node_modules/tsx'].dev=true;
assert.deepEqual(recordedLock,gitJson(harnessCommit,'package-lock.json'));
const verifyLock=bytes=>{
  assert.deepEqual(JSON.parse(bytes),recordedLock,'Unrecorded dependency/lock change');
  assert.deepEqual(bytes,gitShow(harnessCommit,'package-lock.json'),'Exact recorded lock bytes');
};
const lockBytes=await readFile('package-lock.json');verifyLock(lockBytes);
const mutatedLock=JSON.parse(lockBytes);mutatedLock.packages[''].dependencies['three-mesh-bvh']='foreign';
assert.throws(()=>verifyLock(Buffer.from(JSON.stringify(mutatedLock))));negativeMutations++;
assert.deepEqual(await readFile('lib/vessel-visibility.ts'),gitShow(controlCommit,'lib/vessel-visibility.ts'));
const badHistorical=historicalPreserved.map(path=>[path,gitShow(controlCommit,path)]);badHistorical.find(([path])=>path==='app/body-content.ts')[1]=Buffer.from('mutated lesson');
assert.throws(()=>{for(const [path,bytes] of badHistorical)assert.deepEqual(bytes,gitShow(controlParent,path),`${path} changed`);});negativeMutations++;
const sourceEras=admittedEras.map(({name,commit,count,auditSha256,canonical})=>({name,commit,count,auditSha256,ids:canonical.structures.map(s=>s.id)}));
const report={scopes,plans,groups,componentCallbacks,parentCallbacks,defaultCollapsed:true,nativeNamedGroups:true,currentRuntimeCovered:true,currentRawCatalogPreserved:true,historicalControlEra:{parent:controlParent,commit:controlCommit,lessonAndFileBytesPreserved:true,groups:sourceHistory.historicalGroups},sourceEras,recordedDisplayChanges:{celiacCommit,cardiacCommit,ids:[celiac.replacement.id,cardiac.structure.id]},recordedDependencyPromotions:{bvhCommit,harnessCommit},negativeMutations,clinicalApproval:false,browserTesting:false};
await writeFile('docs/vessel-visibility-validation.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report));
