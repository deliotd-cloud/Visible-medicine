import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {runInNewContext} from 'node:vm';
import ts from 'typescript';
import {build} from './workspace-test-build.mjs';

const compiled=await build({stdin:{contents:`export * from './lib/root-education-api';export * from './lib/imaging-sync';export * from './lib/nested-education-binding';export * from './lib/nested-learning-anatomy';export * from './lib/nested-anatomy';export * from './lib/body-display-catalog';`,resolveDir:process.cwd(),loader:'ts'},bundle:true,platform:'node',format:'esm',write:false});
const api=await import('data:text/javascript;base64,'+Buffer.from(compiled.outputFiles[0].text).toString('base64'));
const catalog=JSON.parse(await readFile('public/models/bodyparts3d/full-body/catalog.json','utf8'));
const display=api.bodyDisplayCatalog(catalog);
for(const study of ['ventricles','eye','femoral-components','cranial-artery-components']){
const target=api.nestedStudyTargets(display).find(t=>t.study===study);
assert(target);
const parent=display.structures.find(s=>s.id===target.parentId);
const layers=api.nestedPartsFor(parent,study);
const binding=api.nestedEducationBinding(catalog,parent,study,layers);
assert(binding.records.length>0);
assert.equal(binding.records.length,binding.entries.length);
assert.deepEqual(api.nestedEducationBinding(display,parent,study,layers),binding,'Raw and admitted display catalogues resolve the same identities');
assert.equal(api.nestedEducationBinding(catalog,{...parent,bundle:'untrusted-parent-bundle'},study,layers).records.length,0);
assert.equal(api.nestedEducationBinding(undefined,parent,study,layers).records.length,0);
const stale=structuredClone(parent);stale.sources[0].sha256='a'.repeat(64);
assert.equal(api.nestedEducationBinding(catalog,stale,study,layers).records.length,0);
assert.equal(api.nestedEducationBinding(catalog,parent,'cardiac',layers).records.length,0);
const staleLayers=structuredClone(layers);staleLayers.forEach(s=>s.sources[0].sha256='b'.repeat(64));
assert.equal(api.nestedEducationBinding(catalog,parent,study,staleLayers).records.length,0);
const context={...layers[0],id:'vm:anatomy:context-only'};
assert.equal(api.nestedEducationBinding(catalog,parent,study,[context]).records.length,0);

// Execute the actual hooks with a small deterministic lifecycle runtime. No DOM
// or React renderer acceptance is inferred from this state/effect test.
function runtime(){
  const slots=[],pending=[];let cursor=0;
  const same=(a,b)=>a&&b&&a.length===b.length&&a.every((v,i)=>Object.is(v,b[i]));
  const react={
    useRef(v){const i=cursor++;return slots[i]??= {current:v};},
    useState(v){const i=cursor++;if(!slots[i])slots[i]={value:typeof v==='function'?v():v};return [slots[i].value,v=>{slots[i].value=typeof v==='function'?v(slots[i].value):v;}];},
    useMemo(fn,deps){const i=cursor++;if(!slots[i]||!same(slots[i].deps,deps))slots[i]={deps,value:fn()};return slots[i].value;},
    useCallback(fn,deps){return react.useMemo(()=>fn,deps);},
  };
  const effect=(fn,deps)=>{const i=cursor++;if(!slots[i]||!same(slots[i].deps,deps))pending.push(()=>{slots[i]?.cleanup?.();slots[i]={deps,cleanup:fn()};});};
  react.useEffect=effect;react.useLayoutEffect=effect;
  return {react,render(fn){cursor=0;const result=fn();while(pending.length)pending.shift()();return result;},unmount(){for(const slot of slots)slot?.cleanup?.();}};
}
async function loadHook(path,imports,window){
  const source=await readFile(path,'utf8');
  const exports={};
  runInNewContext(ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.React}}).outputText,{exports,require:name=>{if(name.endsWith('.css'))return {};assert(name in imports,name);return imports[name];},window,Set,Object,JSON});
  return exports;
}
const tick=()=>new Promise(r=>setTimeout(r,0));
const hash='c'.repeat(64);
for(const kind of ['ct','mri']){
  const r=runtime(),events=new Map(),window={addEventListener:(n,f)=>events.set(n,f),removeEventListener:(n,f)=>{if(events.get(n)===f)events.delete(n);}};
  const imaging=await loadHook('app/imaging-link.tsx',{'react':r.react,'@/lib/imaging-sync':api,'@/lib/anatomy-link-registry':{}},window);
  const learning=await build({stdin:{contents:`export {learningAnatomyBindingKey} from './lib/learning-resources';`,resolveDir:process.cwd(),loader:'ts'},bundle:true,platform:'node',format:'esm',write:false});
  const keys=await import('data:text/javascript;base64,'+Buffer.from(learning.outputFiles[0].text).toString('base64'));
  const hook=await loadHook('app/nested-education-link.ts',{'react':r.react,'../lib/learning-resources':keys,'../lib/nested-education-binding':api,'../lib/imaging-sync':api,'../lib/root-education-api':api,'./imaging-link':imaging},window);
  const selected=[];let props={catalog,parent,study,layers,allowedIds:[binding.records[0].structureId],disabled:false,onSelect:id=>selected.push(id)};
  const render=()=>r.render(()=>hook.useNestedEducationLink(props));
  let link=render();link=render();
  const root=api.imagingBridge.registerAdapter({id:'root-test',label:'Independent root',modality:'CT',onAtlasSelection:()=>{}});
  const detachRoot=api.imagingBridge.attachAtlas(request=>({messageId:request.messageId,status:'selected'}));
  const facade=window.visibleMedicineNestedEducation;assert(facade);
  let incoming,pending=null;const revealed=[],guards=[];
  const resource={id:'vm:resource:synthetic-nested',revision:1,kind,title:'Synthetic nested fixture',ageGroup:'adult',laterality:parent.laterality,regionIds:parent.regions,material:{sha256:hash,origin:'synthetic'},anchors:[{type:'volume',id:'anchor',seriesId:'series',frameId:'frame',annotationId:'label',geometry:'point'}]};
  const links=binding.records.map((anatomy,i)=>({id:'vm:link:nested-'+i,revision:1,anatomy,resourceId:resource.id,resourceRevision:1,materialSha256:hash,anchorId:'anchor',relation:'exact'}));
  const document={schemaVersion:2,resources:[resource],links};
  const policy={canNavigate:()=>true,canAccessAnatomy:()=>true,canAccess:()=>true,resourceCleared:()=>true,correspondenceCleared:()=>true};
  const viewer={getStudy:()=>({resourceId:resource.id,revision:1,materialSha256:hash}),canNavigate:()=>true,async reveal(match,guard){guards.push(guard);if(pending)await pending;if(guard.isCurrent())revealed.push(match);},subscribeSelection:fn=>{incoming=fn;return()=>{};},subscribeContext:()=>()=>{}};
  const locator=i=>({version:1,linkId:links[i].id,linkRevision:1,resourceId:resource.id,resourceRevision:1,anchorId:'anchor'});
  let connection=facade.connect({document,policy,viewer});
  link=render();assert(link.adapter);
  connection.setEnabled(true);link.setEnabled(true);link=render();
  assert.equal(incoming({messageId:'select',locator:locator(0)}).status,'selected');assert.equal(selected.at(-1),links[0].anatomy.structureId);
  assert.equal(revealed.length,0,'Remote selection does not echo');
  link.publish(links[0].anatomy.structureId);await tick();assert.equal(revealed.length,1);assert.equal('reference' in revealed[0],false);
  // Rerender with new callback/arrays but equal sources and scope retains opt-in.
  props={...props,parent:{...parent},layers:[...layers],allowedIds:[...props.allowedIds],onSelect:id=>selected.push(id)};link=render();
  assert.equal(link.enabled,true);assert.equal(incoming({messageId:'ordinary-rerender',locator:locator(0)}).status,'selected');
  if(links.length>1)assert.equal(incoming({messageId:'hidden',locator:locator(1)}).status,'paused');
  let release;pending=new Promise(resolve=>{release=resolve;});link.publish(links[0].anatomy.structureId);
  props={...props,disabled:true};link=render();assert.equal(guards.at(-1).signal.aborted,true);release();await tick();assert.equal(revealed.length,1);
  props={...props,disabled:false};link=render();assert.equal(link.enabled,false);assert.equal(incoming({messageId:'after-practice',locator:locator(0)}).status,'paused');
  events.get('pagehide')();assert.equal(Object.hasOwn(window,'visibleMedicineNestedEducation'),false);assert.throws(()=>facade.connect({document,policy,viewer}),/removed/);
  events.get('pageshow')();assert(window.visibleMedicineNestedEducation);assert.notEqual(window.visibleMedicineNestedEducation,facade);
  connection=window.visibleMedicineNestedEducation.connect({document,policy,viewer});link=render();assert.equal(link.enabled,false);assert.equal(incoming({messageId:'after-page',locator:locator(0)}).status,'paused');
  connection.dispose();const bad=structuredClone(document);bad.links[0].anatomy.nested.parentBundleSha256='d'.repeat(64);assert.throws(()=>window.visibleMedicineNestedEducation.connect({document:bad,policy,viewer}),/Invalid|Unknown|source/);
  connection=window.visibleMedicineNestedEducation.connect({document,policy,viewer});
  props={...props,parent:stale};link=render();assert.equal(Object.hasOwn(window,'visibleMedicineNestedEducation'),false);
  assert.equal(api.imagingBridge.getAdapter().id,'root-test');assert.equal(root.selectStructure({version:1,origin:'imaging',messageId:'root-during-nested',structureId:'vm:anatomy:root'}).status,'selected');
  r.unmount();assert.equal(api.imagingBridge.getAdapter().id,'root-test');detachRoot();root.dispose();
}
console.log('Nested Education '+study+': current-source binding, isolated CT/MRI selection, lifecycle pause/replacement and pending-reveal cancellation passed (synthetic only).');
}
