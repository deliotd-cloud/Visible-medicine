import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';
import { build } from './workspace-test-build.mjs';
import { build as componentBuild } from './workspace-component-test-build.mjs';
import { preDeferentDuctProfiles } from './deferent-duct-study-history.mjs';
const compiled=await build({stdin:{contents:`export * from './lib/body-display-catalog'; export * from './lib/deferent-ducts'; export * from './content/deferent-duct-study'; export * from './app/dissection-data'; export * from './lib/study-links'; export * from './lib/study-library'; export * from './lib/limb-vascular-studies'; export * from './lib/longus-colli';`,resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,platform:'node',format:'esm'});
const a=await import('data:text/javascript;base64,'+Buffer.from(compiled.outputFiles[0].text).toString('base64'));
const raw=JSON.parse(await readFile('public/models/bodyparts3d/full-body/catalog.json')),catalog=a.bodyDisplayCatalog(raw),original=JSON.stringify(catalog);
const id='pelvis-deferent-ducts', expected=['FMA19236','FMA19235','FMA15900','FMA9600','FMA19387','FMA19388','FMA7211','FMA7212','FMA15571','FMA15572'];
const pins=JSON.parse(await readFile('public/models/bodyparts3d/deferent-ducts/catalog.json'));
assert.equal(createHash('sha256').update(JSON.stringify(preDeferentDuctProfiles(a.dissectionProfiles))).digest('hex'),'90643b1e4dc8d14e46f333235363ec6f9003aebeecf2925398e4e4f8b8ca3983');
const altered=structuredClone(a.dissectionProfiles);altered.pelvis.title='changed';assert.notEqual(createHash('sha256').update(JSON.stringify(preDeferentDuctProfiles(altered))).digest('hex'),'90643b1e4dc8d14e46f333235363ec6f9003aebeecf2925398e4e4f8b8ca3983');
assert.equal(a.deferentDuctStudyReady(raw,'pelvis',id),false);assert.equal(a.deferentDuctStudyReady(catalog,'abdomen',id),false);
let scopes=0,links=0,rejections=0,handlers=0,renders=0;
for(const region of ['pelvis','whole-body']) for(const side of ['both','left','right']) {
 const scope=a.bodyStudyScope(catalog,region,side), profile=a.dissectionProfiles[region];
 const state=a.dissectionReducer(a.initialDissection,{type:'focus',id}), visible=a.resolveDissection(scope,profile,state).visible;
 assert.equal(visible.length,side==='both'?10:6);assert.deepEqual(visible.map(s=>s.fmaId).sort(),scope.filter(s=>expected.includes(s.fmaId)).map(s=>s.fmaId).sort());
 const card=a.studyLibrary(scope,profile).find(c=>c.key==='focus:'+id);assert(card);assert.deepEqual(a.studyLibraryAction(scope,profile,card.key,false),{kind:'focus',id});assert.equal(a.studyLibraryAction(scope,profile,card.key,true),null);
 for(const s of visible) {
  const href=a.makeStudyLink(catalog,region,s.id,side,id);assert(href);const link=a.parseStudyLink(Object.fromEntries(new URL(href,'https://atlas.invalid').searchParams));
  assert.equal(a.resolveStudyLink(catalog,region,link).status,'ready');links++;
 }
 const duct=visible.find(s=>s.fmaId==='FMA19235'||s.fmaId==='FMA19236');
 const removed=a.dissectionReducer(state,{type:'remove',id:duct.id});assert(!a.resolveDissection(scope,profile,removed).visible.some(s=>s.id===duct.id));
 const undone=a.dissectionReducer(removed,{type:'undo'});assert.deepEqual(a.resolveDissection(scope,profile,undone).visible.map(s=>s.id),visible.map(s=>s.id));scopes++;
}
const selected=pins.structures[0],href=a.makeStudyLink(catalog,'pelvis',selected.id,'both',id),link=a.parseStudyLink(Object.fromEntries(new URL(href,'https://atlas.invalid').searchParams));
for(const pin of [...pins.structures,...pins.contextRecords]) for(const change of [c=>{c.structures=c.structures.filter(s=>s.id!==pin.id);},c=>{c.structures.find(s=>s.id===pin.id).sources[0].sha256='changed';}]) {
 const bad=structuredClone(catalog);change(bad);assert.equal(a.deferentDuctStudyReady(bad,'pelvis',id),false);assert.equal(a.limbVascularStudyReady(bad,'pelvis',id),false);assert.equal(a.resolveStudyLink(bad,'pelvis',link).status,'rejected');rejections++;
}
const source=await readFile('app/body-explorer.tsx','utf8'),ast=ts.createSourceFile('body.tsx',source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);let action;
function visit(n){if(ts.isFunctionDeclaration(n)&&n.name?.text==='changeFocus')action=ts.transpile(n.getText(ast),{target:ts.ScriptTarget.ES2022});ts.forEachChild(n,visit);}visit(ast);assert(action);
for(const region of ['pelvis','whole-body']) for(const mode of ['ready','exam','changed']) {
 const calls=[],cameraRestore={current:{pending:true}},bad=structuredClone(catalog);if(mode==='changed')bad.structures=bad.structures.filter(s=>s.id!==selected.id);
 const env={catalog:bad,initialRegion:region,side:'both',profile:a.dissectionProfiles[region],exam:mode==='exam',layout:'tray',cameraRestore,initialInspection:{plane:'off'},allBodySystems:{},limbVascularStudyReady:a.limbVascularStudyReady,longusColliStudyReady:a.longusColliStudyReady};
 for(const name of ['dispatch','setInspection','setPlate','setLayout','setSystems','setSelectedId','setFocus','setIsolated','setExplode','setZoom','setView','setReset'])env[name]=v=>calls.push([name,typeof v==='function'?v(0):v]);
 assert.equal(runInNewContext(action+`;changeFocus('${id}')`,env),mode==='ready');
 if(mode==='ready'){assert.equal(cameraRestore.current,null);assert.equal(calls.find(c=>c[0]==='setView')[1],'posterior');assert.equal(calls.find(c=>c[0]==='setExplode')[1],0);}else assert.deepEqual(calls,[]);handlers++;
}
const require=createRequire(import.meta.url),React=require('react'),component=await componentBuild({entryPoints:['app/study-library.tsx'],bundle:true,write:false,format:'cjs',platform:'node'}),mod={exports:{}};
runInNewContext(component.outputFiles[0].text,{module:mod,exports:mod.exports,require,console,process:{env:{NODE_ENV:'test'}}});
for(const region of ['pelvis','whole-body']) for(const side of ['both','left','right']) for(const disabled of [false,true]) {
 const scope=a.bodyStudyScope(catalog,region,side),html=require('react-dom/server').renderToStaticMarkup(React.createElement(mod.exports.StudyLibrary,{profile:a.dissectionProfiles[region],state:a.initialDissection,structures:scope,visibleIds:scope.map(s=>s.id),loaded:[],failed:[],disabled,onStage(){},onFocus(){}}));
 assert(html.includes(disabled?'End practice':'Male pelvis: deferent ducts'));renders++;
}
assert.equal(JSON.stringify(catalog),original);
console.log(JSON.stringify({passed:true,sourceSelections:2,studySelections:10,scopes,links,rejections,actualParentHandlers:handlers,actualMenus:renders,previousRecipesUnchanged:true,browserTesting:false,clinicalApproval:false}));
