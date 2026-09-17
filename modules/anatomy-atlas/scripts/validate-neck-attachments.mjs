import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {runInNewContext} from 'node:vm';
import ts from 'typescript';
import {build} from './workspace-test-build.mjs';
import {build as componentBuild} from './workspace-component-test-build.mjs';
const built=await build({stdin:{contents:"export * from './lib/neck-attachments'; export * from './lib/arm-attachments'; export * from './lib/thigh-attachments'; export * from './content/neck-attachments'; export * from './content/longus-colli-attachments'; export * from './app/dissection-data'; export * from './lib/study-links'; export {bodyDisplayCatalog} from './lib/body-display-catalog';",resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,platform:'node',format:'esm'});
const api=await import('data:text/javascript;base64,'+Buffer.from(built.outputFiles[0].text).toString('base64'));
const catalog=api.bodyDisplayCatalog(JSON.parse(await readFile('public/models/bodyparts3d/full-body/catalog.json'))),snapshot=JSON.stringify(catalog);
const pins=JSON.parse(await readFile('content/neck-attachment-pins.json'));
const pairedMuscles=pins.entries.filter(s=>s.system==='muscles');assert.equal(pairedMuscles.length,18);assert.equal(pins.entries.length,31);
const longusSource=JSON.parse(await readFile('public/models/bodyparts3d/longus-colli/catalog.json'));
assert.deepEqual(longusSource.structures.map(s=>[s.fmaId,s.laterality]),[['FMA46284','left'],['FMA46286','left'],['FMA46288','left']]);
const muscles=[...pairedMuscles,...longusSource.structures];
const relationships=[...api.neckAttachments,...api.longusColliAttachments];
assert.equal(relationships.length,12);assert.equal(muscles.length,21);
const regionsFor=s=>[...new Set([...s.regions.filter(r=>['head-neck','spine','shoulder-arm'].includes(r)),'whole-body'])];
// Independent endpoint assertions, including named midline versus paired bones.
const expected={
  'rectus-capitis-anterior':[['FMA12519'],['FMA52735']],
  'rectus-capitis-lateralis':[['FMA12519'],['FMA52735']],
  'rectus-capitis-posterior-major':[['FMA12520'],['FMA52735']],
  'rectus-capitis-posterior-minor':[['FMA12519'],['FMA52735']],
  'obliquus-capitis-superior':[['FMA12519'],['FMA52735']],
  'obliquus-capitis-inferior':[['FMA12520'],['FMA12519']],
  'longus-capitis':[['FMA12521','FMA12522','FMA12523','FMA12524'],['FMA52735']],
  'splenius-cervicis':[['FMA9209','FMA9248','FMA9922','FMA9945'],['FMA12519','FMA12520','FMA12521']],
  'levator-scapulae':[['FMA12519','FMA12520','FMA12521','FMA12522'],['FMA13395']],
  'longus-colli-superior-oblique':[['FMA12521','FMA12522','FMA12523'],['FMA12519']],
  'longus-colli-vertical':[['FMA12523','FMA12524','FMA12525','FMA9165','FMA9187','FMA9209'],['FMA12520','FMA12521','FMA12522']],
  'longus-colli-inferior-oblique':[['FMA9165','FMA9187','FMA9209'],['FMA12523','FMA12524']],
};
const inScope=(s,r)=>r==='whole-body'||s.regions.includes(r);
const byFma=fma=>catalog.structures.find(s=>s.fmaId===fma);
let plans=0,links=0,rejections=0,renders=0,handlers=0,boneClicks=0;
for(const a of relationships)for(const [sideIndex,fma]of a.fmas.entries()){
  const selected=byFma(fma),boneRows=expected[a.key].map(row=>row.map(id=>id==='FMA13395'&&sideIndex===1?'FMA13396':id));
  for(const region of regionsFor(selected))for(const side of ['both',selected.laterality]){
    const args=[catalog,region,side,selected.id],info=api.neckAttachmentInfo(...args),plan=api.neckAttachmentPlan(...args);assert(info&&plan);
    assert.deepEqual(info.rows.map(r=>r.structures.map(x=>x.structure.fmaId)),boneRows);
    for(const r of info.rows)for(const x of r.structures){assert(['midline',selected.laterality].includes(x.structure.laterality));assert.equal(x.availableHere,inScope(x.structure,region));}
    assert.equal(info.completeHere,boneRows.flat().every(f=>inScope(byFma(f),region)));
    assert.equal(plan.selectedId,selected.id);assert.equal(plan.completeHere,info.completeHere);
    assert.equal(plan.view,a.key.startsWith('longus-colli-')?'anterior':undefined);
    const allBones=expected[a.key].flat();if(allBones.includes('FMA13395'))allBones.push('FMA13396');
    const keep=new Set([...a.fmas,...allBones]),pool=catalog.structures.filter(s=>inScope(s,region));
    const visible=pool.filter(s=>!plan.action.hiddenIds.includes(s.id));
    assert.deepEqual(visible.map(s=>s.fmaId).sort(),pool.filter(s=>keep.has(s.fmaId)).map(s=>s.fmaId).sort());
    const before=api.dissectionReducer(api.initialDissection,{type:'remove',id:selected.id}),after=api.dissectionReducer(before,plan.action);
    assert.deepEqual(api.resolveDissection(pool,api.dissectionProfiles[region],after).visible.map(s=>s.id).sort(),visible.map(s=>s.id).sort());
    const undo=api.dissectionReducer(after,{type:'undo'});assert.deepEqual(undo.removed,before.removed);assert.deepEqual(api.dissectionReducer(undo,{type:'redo'}),after);assert.deepEqual(api.dissectionReducer(after,plan.action),after);
    assert.deepEqual(visible.filter(x=>x.system==='muscles').map(s=>s.fmaId).sort(),[...a.fmas].sort(),'Only admitted muscle identities: no generated mirror or adjacent part');
    assert.equal(api.neckAttachmentInfo(...args,true),null);assert.equal(api.neckAttachmentPlan(...args,true),null);
    if(!info.completeHere){const u=new URL(api.makeStudyLink(catalog,'whole-body',selected.id,side),'https://example.invalid');const parsed=api.parseStudyLink(Object.fromEntries(u.searchParams));assert.equal(parsed.request.structureId,selected.id);assert.equal(parsed.request.side,side);assert.equal(api.resolveStudyLink(catalog,'whole-body',parsed).status,'ready');links++;}
    plans++;
  }
}
const first=muscles[0];
for(const mutate of [c=>c.sourceVersion='foreign',c=>c.license='unknown',c=>c.coordinateSystem.unitsPerMillimetre=42,c=>c.structures.push({...c.structures.find(s=>s.id===first.id)}),c=>c.bundles.push({...c.bundles.find(b=>b.id===first.bundle)}),c=>c.bundles.find(b=>b.id===first.bundle).sha256='0'.repeat(64)]){
  const bad=structuredClone(catalog);mutate(bad);assert.equal(api.neckAttachmentPlan(bad,'whole-body','both',first.id),null);rejections++;
}
for(const p of pins.entries)for(const mutate of [s=>s.name+=' stale',s=>s.id+='-stale',s=>s.anchor[0]+=1,s=>s.laterality='unknown',s=>s.sources[0].sha256='0'.repeat(64),s=>s.regions.push('foot'),s=>s.nodeName+='-stale']){
  const bad=structuredClone(catalog);mutate(bad.structures.find(s=>s.id===p.id));assert.equal(api.neckAttachmentInfo(bad,'whole-body','both',first.id),null);rejections++;
}
for(const s of muscles){assert.equal(api.neckAttachmentInfo(catalog,'whole-body',s.laterality==='right'?'left':'right',s.id),null);assert.equal(api.neckAttachmentInfo(catalog,'whole-body','invalid',s.id),null);for(const r of ['head-neck','spine','shoulder-arm','pelvis','foot','unknown'].filter(r=>!regionsFor(s).includes(r)))assert.equal(api.neckAttachmentInfo(catalog,r,'both',s.id),null);}
for(const s of catalog.structures.filter(s=>!muscles.some(m=>m.id===s.id)))assert.equal(api.neckAttachmentInfo(catalog,'whole-body','both',s.id),null);
// The independent left-only source remains atomic, including all context, not only the chosen bones.
let longusRejections=0;
const rejectLongus=mutate=>{const bad=structuredClone(catalog);mutate(bad);for(const s of longusSource.structures){assert.equal(api.neckAttachmentInfo(bad,'whole-body','both',s.id),null);assert.equal(api.neckAttachmentPlan(bad,'head-neck','left',s.id),null);longusRejections++;}};
for(const mutate of [c=>c.sourceVersion='foreign',c=>c.license='unknown',c=>c.coordinateSystem.unitsPerMillimetre=42])rejectLongus(mutate);
for(const p of [...longusSource.structures,...longusSource.contextRecords]){
  rejectLongus(c=>c.structures=c.structures.filter(s=>s.id!==p.id));
  rejectLongus(c=>c.structures.push({...c.structures.find(s=>s.id===p.id)}));
  rejectLongus(c=>c.structures.push({...c.structures.find(s=>s.id===p.id),id:p.id+'-alias'}));
  for(const mutate of [s=>s.name+=' stale',s=>s.anchor[0]+=1,s=>s.laterality='right',s=>s.sources[0].sha256='0'.repeat(64),s=>s.regions.push('foot'),s=>s.nodeName+='-stale'])rejectLongus(c=>mutate(c.structures.find(s=>s.id===p.id)));
}
for(const b of [...longusSource.bundles,...longusSource.contextBundles]){
  rejectLongus(c=>c.bundles=c.bundles.filter(x=>x.id!==b.id));
  rejectLongus(c=>c.bundles.push({...c.bundles.find(x=>x.id===b.id)}));
  rejectLongus(c=>c.bundles.find(x=>x.id===b.id).sha256='0'.repeat(64));
}
const require=createRequire(import.meta.url),React=require('react'),actualLink=await import('vinext/shims/link');
const bridgeBuild=await componentBuild({entryPoints:['integration/head-neck/framework.tsx'],bundle:true,write:false,format:'cjs',platform:'node'}),bridge={exports:{}};
runInNewContext(bridgeBuild.outputFiles[0].text,{module:bridge,exports:bridge.exports,require,URL,URLSearchParams});
for(const s of muscles){
  const href=api.makeStudyLink(catalog,'whole-body',s.id,s.laterality),element=bridge.exports.Link({href,children:'Continue'});
  assert.equal(element.props.target,'_top');
  const hosted=new URL(element.props.href,'https://example.invalid');assert.equal(hosted.pathname,'/atlas/3d');
  const resolved=api.resolveStudyLink(catalog,'whole-body',api.parseStudyLink(Object.fromEntries(hosted.searchParams)));
  assert.equal(resolved.status,'ready');assert.equal(resolved.selected.id,s.id);assert.equal(hosted.searchParams.get('side'),s.laterality);
}
let direct=false;
const reactProxy={...React,useMemo:(fn,deps)=>direct?fn():React.useMemo(fn,deps)};
const builtUi=await componentBuild({entryPoints:['app/arm-attachments.tsx'],bundle:true,write:false,format:'cjs',platform:'node'}),mod={exports:{}};
runInNewContext(builtUi.outputFiles[0].text,{module:mod,exports:mod.exports,require:n=>n==='react'?reactProxy:n==='next/link'?{__esModule:true,...actualLink}:require(n),URL,URLSearchParams,console,process:{env:{NODE_ENV:'test'}}});
const render=props=>require('react-dom/server').renderToStaticMarkup(React.createElement(mod.exports.ArmAttachments,props));
const walk=(node,pred,out=[])=>{if(React.isValidElement(node)){if(pred(node))out.push(node);React.Children.forEach(node.props.children,c=>walk(c,pred,out));}return out;};
for(const s of muscles)for(const region of regionsFor(s)){
  const clicks=[];let shows=0;
  const props={catalog,region,side:'both',selectedId:s.id,disabled:false,onSelect:id=>clicks.push(id),onShow:()=>shows++};
  const html=render(props),info=api.neckAttachmentInfo(catalog,region,'both',s.id);renders++;
  assert(html.includes(s.name)&&html.includes('Muscle attachment relationships')&&html.includes('Specialist review pending')&&html.includes(info.reference.url));assert(!/<details[^>]*\bopen=/.test(html));
  assert.equal((html.match(/bony partners/g)||[]).length,2);
  for(const row of info.rows)for(const p of row.structures)assert(html.includes(p.structure.name));
  assert.equal(html.includes('Open this muscle in whole body'),!info.completeHere);assert.equal(render({...props,disabled:true}),'');
  direct=true;const tree=mod.exports.ArmAttachments(props);direct=false;
  for(const p of info.rows.flatMap(r=>r.structures)){
    const button=walk(tree,n=>n.props.children===p.structure.name&&typeof n.props.onClick==='function');assert.equal(button.length,p.availableHere?1:0);
    if(p.availableHere){button[0].props.onClick();assert.equal(clicks.at(-1),p.structure.id);boneClicks++;}
  }
  const show=walk(tree,n=>typeof n.props.onClick==='function'&&n.props.children===(info.completeHere?'Show muscle with attachment bones':'Show muscle with available attachment bones'));assert.equal(show.length,1);show[0].props.onClick();assert.equal(shows,1);
}
const source=await readFile('app/body-explorer.tsx','utf8'),ast=ts.createSourceFile('body.tsx',source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);let handler,wiring;
function visit(n){if(ts.isFunctionDeclaration(n)&&n.name?.text==='showMuscleAttachments')handler=n.getText(ast);if(ts.isJsxSelfClosingElement(n)&&n.tagName.getText(ast)==='ArmAttachments')wiring=n.getText(ast);ts.forEachChild(n,visit);}visit(ast);
assert(wiring.includes('onShow={showMuscleAttachments}')&&wiring.includes('onSelect={select}')&&wiring.includes('disabled={exam}'));
for(const s of muscles)for(const exam of [false,true]){
  const calls=[],env={catalog,initialRegion:s.region,side:'both',selectedId:s.id,exam,armAttachmentPlan:api.armAttachmentPlan,thighAttachmentPlan:api.thighAttachmentPlan,neckAttachmentPlan:api.neckAttachmentPlan,initialInspection:{enabled:false},cameraRestore:{current:'old'},dispatch:v=>calls.push(['dispatch',v])};
  for(const name of ['setSystems','setInspection','setExplode','setLayout','setPlate','setGhostRemoved','setFocus','setIsolated','setZoom','setSelectionNotice','setReset','setView'])env[name]=v=>calls.push([name,v]);
  runInNewContext(ts.transpile(handler+';showMuscleAttachments();',{target:ts.ScriptTarget.ES2022}),env);handlers++;
  if(exam){assert.deepEqual(calls,[]);continue;}
  assert.equal(calls.filter(c=>c[0]==='dispatch').length,1);assert.deepEqual(JSON.parse(JSON.stringify(calls.find(c=>c[0]==='dispatch')[1])),api.neckAttachmentPlan(catalog,s.region,'both',s.id).action);
  assert.equal(calls.find(c=>c[0]==='setSelectionNotice')[1].id,s.id);assert.equal(calls.find(c=>c[0]==='setExplode')[1],0);assert.equal(calls.find(c=>c[0]==='setLayout')[1],'spatial');assert.equal(env.cameraRestore.current,null);
  assert.deepEqual(calls.filter(c=>c[0]==='setView'),s.bundle==='longus-colli'?[['setView','anterior']]:[]);
  assert.deepEqual(JSON.parse(JSON.stringify(calls.find(c=>c[0]==='setSystems')[1]({skeleton:false,muscles:false,vessels:false}))),{skeleton:true,muscles:true,vessels:false});
}
const budgets={};for(const key of Object.keys(api.neckAttachmentReferences)){const unique=new Set(api.neckAttachments.filter(a=>a.reference===key).flatMap(a=>[a.note,...a.endpoints.map(e=>e.site)]));budgets[key]=[...unique].join(' ').split(/\s+/).length;assert(budgets[key]<=200);}
budgets.longusColli=[api.longusColliAttachmentNote,...api.longusColliAttachments.flatMap(a=>a.endpoints.map(e=>e.site))].join(' ').split(/\s+/).length;assert(budgets.longusColli<=200);
assert.equal(JSON.stringify(catalog),snapshot);
const report={muscles:21,bones:16,relationships:12,plans,crossRegionLinks:links,hostContinuationLinks:muscles.length,rejectedCatalogs:rejections,longusSourceRejections:longusRejections,componentSsr:renders,actualBoneButtonClicks:boneClicks,actualParentHandlers:handlers,referenceWords:budgets,sourceGeometryChanged:false,clinicalReview:'pending',browserAcceptance:'not-tested'};
await writeFile('docs/neck-attachments-validation.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
