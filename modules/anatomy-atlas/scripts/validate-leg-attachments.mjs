import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {runInNewContext} from 'node:vm';
import ts from 'typescript';
import {build} from './workspace-test-build.mjs';
import {build as componentBuild} from './workspace-component-test-build.mjs';
const built=await build({stdin:{contents:"export * from './lib/leg-attachments'; export * from './lib/forearm-attachments'; export * from './lib/arm-attachments'; export * from './lib/thigh-attachments'; export * from './lib/neck-attachments'; export * from './content/leg-attachments'; export * from './app/dissection-data'; export * from './lib/study-links'; export {bodyDisplayCatalog} from './lib/body-display-catalog';",resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,platform:'node',format:'esm'});
const api=await import('data:text/javascript;base64,'+Buffer.from(built.outputFiles[0].text).toString('base64'));
const catalog=api.bodyDisplayCatalog(JSON.parse(await readFile('public/models/bodyparts3d/full-body/catalog.json'))),snapshot=JSON.stringify(catalog);
const pins=JSON.parse(await readFile('content/leg-attachment-pins.json'));
const muscles=pins.entries.filter(s=>s.system==='muscles');assert.equal(muscles.length,28);assert.equal(pins.entries.length,74);
assert.deepEqual(muscles.map(s=>s.id).sort(),catalog.structures.filter(s=>s.system==='muscles'&&s.region==='leg').map(s=>s.id).sort());
// Independent endpoint assertions, including named midline versus paired bones.
const expected={
 "extensor-digitorum-longus": [
  [
   "FMA24477",
   "FMA24480"
  ],
  [
   "FMA32642",
   "FMA32644",
   "FMA32646",
   "FMA230986",
   "FMA32652",
   "FMA32654",
   "FMA32656",
   "FMA32658"
  ]
 ],
 "extensor-hallucis-longus": [
  [
   "FMA24480"
  ],
  [
   "FMA32650"
  ]
 ],
 "fibularis-brevis": [
  [
   "FMA24480"
  ],
  [
   "FMA24515"
  ]
 ],
 "fibularis-longus": [
  [
   "FMA24480"
  ],
  [
   "FMA24507",
   "FMA24521"
  ]
 ],
 "fibularis-tertius": [
  [
   "FMA24480"
  ],
  [
   "FMA24515"
  ]
 ],
 "flexor-digitorum-longus": [
  [
   "FMA24477"
  ],
  [
   "FMA32652",
   "FMA32654",
   "FMA32656",
   "FMA32658"
  ]
 ],
 "flexor-hallucis-longus": [
  [
   "FMA24480"
  ],
  [
   "FMA32650"
  ]
 ],
 "plantaris": [
  [
   "FMA24474"
  ],
  [
   "FMA24497"
  ]
 ],
 "popliteus": [
  [
   "FMA24474"
  ],
  [
   "FMA24477"
  ]
 ],
 "soleus": [
  [
   "FMA24480",
   "FMA24477"
  ],
  [
   "FMA24497"
  ]
 ],
 "tibialis-anterior": [
  [
   "FMA24477"
  ],
  [
   "FMA24521",
   "FMA24507"
  ]
 ],
 "tibialis-posterior": [
  [
   "FMA24477",
   "FMA24480"
  ],
  [
   "FMA24500"
  ],
  [
   "FMA24521",
   "FMA24523",
   "FMA24525",
   "FMA24528",
   "FMA24497",
   "FMA24507",
   "FMA24509",
   "FMA24511",
   "FMA24513",
   "FMA24515"
  ]
 ],
 "gastrocnemius-medial-head": [
  [
   "FMA24474"
  ],
  [
   "FMA24497"
  ]
 ],
 "gastrocnemius-lateral-head": [
  [
   "FMA24474"
  ],
  [
   "FMA24497"
  ]
 ]
};
const leftBones={"FMA24474":"FMA24475","FMA24477":"FMA24478","FMA24480":"FMA24481","FMA24497":"FMA24498","FMA24500":"FMA24501","FMA24521":"FMA24522","FMA24523":"FMA24524","FMA24525":"FMA24526","FMA24528":"FMA24529","FMA24507":"FMA24508","FMA24509":"FMA24510","FMA24511":"FMA24512","FMA24513":"FMA24514","FMA24515":"FMA24516","FMA32650":"FMA32651","FMA32652":"FMA32653","FMA32654":"FMA32655","FMA32656":"FMA32657","FMA32658":"FMA32659","FMA32642":"FMA32643","FMA32644":"FMA32645","FMA32646":"FMA32647","FMA230986":"FMA230988"};
const inScope=(s,r)=>r==='whole-body'||s.regions.includes(r);
const byFma=fma=>catalog.structures.find(s=>s.fmaId===fma);
let plans=0,links=0,rejections=0,renders=0,handlers=0,boneClicks=0;
for(const a of api.legAttachments)for(const [sideIndex,fma]of a.fmas.entries()){
  const selected=byFma(fma),boneRows=expected[a.key].map(row=>row.map(id=>sideIndex===1?leftBones[id]:id));
  for(const region of [selected.region,'whole-body'])for(const side of ['both',selected.laterality]){
    const args=[catalog,region,side,selected.id],info=api.legAttachmentInfo(...args),plan=api.legAttachmentPlan(...args);assert(info&&plan);
    assert.deepEqual(info.rows.map(r=>r.structures.map(x=>x.structure.fmaId)),boneRows);
    for(const r of info.rows)for(const x of r.structures){assert(['midline',selected.laterality].includes(x.structure.laterality));assert.equal(x.availableHere,inScope(x.structure,region));}
    assert.equal(info.completeHere,boneRows.flat().every(f=>inScope(byFma(f),region)));
    assert.equal(plan.selectedId,selected.id);assert.equal(plan.completeHere,info.completeHere);
    const allBones=expected[a.key].flatMap(row=>row.flatMap(id=>[id,leftBones[id]]));
    const keep=new Set([...a.fmas,...allBones]),pool=catalog.structures.filter(s=>inScope(s,region));
    const visible=pool.filter(s=>!plan.action.hiddenIds.includes(s.id));
    assert.deepEqual(visible.map(s=>s.fmaId).sort(),pool.filter(s=>keep.has(s.fmaId)).map(s=>s.fmaId).sort());
    const before=api.dissectionReducer(api.initialDissection,{type:'remove',id:selected.id}),after=api.dissectionReducer(before,plan.action);
    assert.deepEqual(api.resolveDissection(pool,api.dissectionProfiles[region],after).visible.map(s=>s.id).sort(),visible.map(s=>s.id).sort());
    const undo=api.dissectionReducer(after,{type:'undo'});assert.deepEqual(undo.removed,before.removed);assert.deepEqual(api.dissectionReducer(undo,{type:'redo'}),after);assert.deepEqual(api.dissectionReducer(after,plan.action),after);
    for(const s of ['left','right'])assert(visible.some(x=>x.system==='muscles'&&x.laterality===s));
    assert.equal(api.legAttachmentInfo(...args,true),null);assert.equal(api.legAttachmentPlan(...args,true),null);
    if(!info.completeHere){const u=new URL(api.makeStudyLink(catalog,'whole-body',selected.id,side),'https://example.invalid');const parsed=api.parseStudyLink(Object.fromEntries(u.searchParams));assert.equal(parsed.request.structureId,selected.id);assert.equal(parsed.request.side,side);assert.equal(api.resolveStudyLink(catalog,'whole-body',parsed).status,'ready');links++;}
    plans++;
  }
}
const first=muscles[0];
for(const mutate of [c=>c.sourceVersion='foreign',c=>c.license='unknown',c=>c.coordinateSystem.unitsPerMillimetre=42,c=>c.structures.push({...c.structures.find(s=>s.id===first.id)}),c=>c.bundles.push({...c.bundles.find(b=>b.id===first.bundle)}),c=>c.bundles.find(b=>b.id===first.bundle).sha256='0'.repeat(64)]){
  const bad=structuredClone(catalog);mutate(bad);assert.equal(api.legAttachmentPlan(bad,'whole-body','both',first.id),null);rejections++;
}
for(const p of pins.entries)for(const mutate of [s=>s.name+=' stale',s=>s.id+='-stale',s=>s.anchor[0]+=1,s=>s.laterality='unknown',s=>s.sources[0].sha256='0'.repeat(64),s=>s.regions.push('foot'),s=>s.nodeName+='-stale']){
  const bad=structuredClone(catalog);mutate(bad.structures.find(s=>s.id===p.id));assert.equal(api.legAttachmentInfo(bad,'whole-body','both',first.id),null);rejections++;
}
for(const s of muscles){assert.equal(api.legAttachmentInfo(catalog,'whole-body',s.laterality==='right'?'left':'right',s.id),null);assert.equal(api.legAttachmentInfo(catalog,'whole-body','invalid',s.id),null);for(const r of ['head-neck','pelvis','foot','unknown'])assert.equal(api.legAttachmentInfo(catalog,r,'both',s.id),null);}
for(const s of catalog.structures.filter(s=>!muscles.some(m=>m.id===s.id)))assert.equal(api.legAttachmentInfo(catalog,'whole-body','both',s.id),null);
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
for(const s of muscles)for(const region of [s.region,'whole-body']){
  const clicks=[];let shows=0;
  const props={catalog,region,side:'both',selectedId:s.id,disabled:false,onSelect:id=>clicks.push(id),onShow:()=>shows++};
  const html=render(props),info=api.legAttachmentInfo(catalog,region,'both',s.id);renders++;
  assert(html.includes(s.name)&&html.includes('Muscle attachment relationships')&&html.includes('Specialist review pending')&&html.includes(info.reference.url));assert(!/<details[^>]*\bopen=/.test(html));
  assert(html.includes('Origin · bony partners'));for(const row of info.rows)assert(html.includes(row.label.replaceAll('&','&amp;')));
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
  const calls=[],env={catalog,initialRegion:s.region,side:'both',selectedId:s.id,exam,armAttachmentPlan:api.armAttachmentPlan,thighAttachmentPlan:api.thighAttachmentPlan,neckAttachmentPlan:api.neckAttachmentPlan,legAttachmentPlan:api.legAttachmentPlan,forearmAttachmentPlan:api.forearmAttachmentPlan,initialInspection:{enabled:false},cameraRestore:{current:'old'},dispatch:v=>calls.push(['dispatch',v])};
  for(const name of ['setSystems','setInspection','setExplode','setLayout','setPlate','setGhostRemoved','setFocus','setIsolated','setZoom','setSelectionNotice','setReset'])env[name]=v=>calls.push([name,v]);
  runInNewContext(ts.transpile(handler+';showMuscleAttachments();',{target:ts.ScriptTarget.ES2022}),env);handlers++;
  if(exam){assert.deepEqual(calls,[]);continue;}
  assert.equal(calls.filter(c=>c[0]==='dispatch').length,1);assert.deepEqual(JSON.parse(JSON.stringify(calls.find(c=>c[0]==='dispatch')[1])),api.legAttachmentPlan(catalog,s.region,'both',s.id).action);
  assert.equal(calls.find(c=>c[0]==='setSelectionNotice')[1].id,s.id);assert.equal(calls.find(c=>c[0]==='setExplode')[1],0);assert.equal(calls.find(c=>c[0]==='setLayout')[1],'spatial');assert.equal(env.cameraRestore.current,null);
  assert.deepEqual(JSON.parse(JSON.stringify(calls.find(c=>c[0]==='setSystems')[1]({skeleton:false,muscles:false,vessels:false}))),{skeleton:true,muscles:true,vessels:false});
}
// Count both sided placements, not only each shared authored text.
const budgets={};for(const a of api.legAttachments)for(const url of a.references){budgets[url]=(budgets[url]??0)+a.fmas.length*[a.note,...a.endpoints.map(e=>e.site)].join(' ').trim().split(/\s+/).length;}
for(const [url,words]of Object.entries(budgets))assert(words<=200,url+' draft word budget '+words);
const byKey=k=>api.legAttachments.find(a=>a.key===k);
assert.deepEqual(Object.keys(expected).sort(),api.legAttachments.map(a=>a.key).sort());
for(const a of api.legAttachments)assert.equal(new Set(a.endpoints.map(e=>e.role)).size,a.endpoints.length);
assert.equal(byKey('tibialis-posterior').endpoints.length,3);
assert.match(byKey('tibialis-posterior').endpoints[2].site,/not one specimen or a universal pattern/);
assert.match(byKey('extensor-digitorum-longus').endpoints[1].label,/via extensor apparatus/);
assert.match(byKey('plantaris').endpoints[1].label,/variable/);
for(const k of ['soleus','gastrocnemius-medial-head','gastrocnemius-lateral-head'])assert.match(byKey(k).endpoints[1].label,/Achilles/);
assert.notEqual(byKey('gastrocnemius-medial-head').endpoints[0].site,byKey('gastrocnemius-lateral-head').endpoints[0].site);
assert.equal(JSON.stringify(catalog),snapshot);
const report={muscles:28,bones:46,relationships:14,plans,crossRegionLinks:links,hostContinuationLinks:muscles.length,rejectedCatalogs:rejections,componentSsr:renders,actualBoneButtonClicks:boneClicks,actualParentHandlers:handlers,referenceWords:budgets,sourceGeometryChanged:false,clinicalReview:'pending',browserAcceptance:'not-tested'};
await writeFile('docs/leg-attachments-validation.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
