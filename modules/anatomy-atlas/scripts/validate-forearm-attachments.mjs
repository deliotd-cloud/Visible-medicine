import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {runInNewContext} from 'node:vm';
import ts from 'typescript';
import {build} from './workspace-test-build.mjs';
import {build as componentBuild} from './workspace-component-test-build.mjs';
const built=await build({stdin:{contents:"export * from './lib/forearm-attachments'; export * from './lib/arm-attachments'; export * from './lib/thigh-attachments'; export * from './lib/neck-attachments'; export * from './content/forearm-attachments'; export * from './app/dissection-data'; export * from './lib/study-links'; export {bodyDisplayCatalog} from './lib/body-display-catalog';",resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,platform:'node',format:'esm'});
const api=await import('data:text/javascript;base64,'+Buffer.from(built.outputFiles[0].text).toString('base64'));
const catalog=api.bodyDisplayCatalog(JSON.parse(await readFile('public/models/bodyparts3d/full-body/catalog.json'))),snapshot=JSON.stringify(catalog);
const pins=JSON.parse(await readFile('content/forearm-attachment-pins.json'));
const muscles=pins.entries.filter(s=>s.system==='muscles');assert.equal(muscles.length,42);assert.equal(pins.entries.length,80);
// Independent endpoint assertions, including named midline versus paired bones.
const expected={
  "extensor-carpi-ulnaris": [
    [
      "FMA23130",
      "FMA23467"
    ],
    [
      "FMA24472"
    ]
  ],
  "flexor-digitorum-superficialis": [
    [
      "FMA23130",
      "FMA23467",
      "FMA23464"
    ],
    [
      "FMA24455",
      "FMA24456",
      "FMA24457",
      "FMA24458"
    ]
  ],
  "abductor-pollicis-longus": [
    [
      "FMA23464",
      "FMA23467"
    ],
    [
      "FMA24464"
    ]
  ],
  "brachioradialis": [
    [
      "FMA23130"
    ],
    [
      "FMA23464"
    ]
  ],
  "extensor-carpi-radialis-brevis": [
    [
      "FMA23130"
    ],
    [
      "FMA24468"
    ]
  ],
  "extensor-carpi-radialis-longus": [
    [
      "FMA23130"
    ],
    [
      "FMA24466"
    ]
  ],
  "extensor-digiti-minimi": [
    [
      "FMA23130"
    ],
    [
      "FMA24458",
      "FMA24463"
    ]
  ],
  "extensor-digitorum": [
    [
      "FMA23130"
    ],
    [
      "FMA24455",
      "FMA24456",
      "FMA24457",
      "FMA24458",
      "FMA24460",
      "FMA24461",
      "FMA24462",
      "FMA24463"
    ]
  ],
  "extensor-indicis": [
    [
      "FMA23467"
    ],
    [
      "FMA24455",
      "FMA24460"
    ]
  ],
  "extensor-pollicis-brevis": [
    [
      "FMA23464"
    ],
    [
      "FMA24450"
    ]
  ],
  "extensor-pollicis-longus": [
    [
      "FMA23467"
    ],
    [
      "FMA24459"
    ]
  ],
  "flexor-carpi-radialis": [
    [
      "FMA23130"
    ],
    [
      "FMA24466",
      "FMA24468"
    ]
  ],
  "flexor-digitorum-profundus": [
    [
      "FMA23467"
    ],
    [
      "FMA24460",
      "FMA24461",
      "FMA24462",
      "FMA24463"
    ]
  ],
  "flexor-pollicis-longus": [
    [
      "FMA23464"
    ],
    [
      "FMA24459"
    ]
  ],
  "palmaris-longus": [
    [
      "FMA23130"
    ],
    []
  ],
  "pronator-quadratus": [
    [
      "FMA23467"
    ],
    [
      "FMA23464"
    ]
  ],
  "supinator": [
    [
      "FMA23130",
      "FMA23467"
    ],
    [
      "FMA23464"
    ]
  ],
  "pronator-teres-humeral-head": [
    [
      "FMA23130"
    ],
    [
      "FMA23464"
    ]
  ],
  "pronator-teres-ulnar-head": [
    [
      "FMA23467"
    ],
    [
      "FMA23464"
    ]
  ],
  "flexor-carpi-ulnaris-humeral-head": [
    [
      "FMA23130"
    ],
    [
      "FMA24441",
      "FMA24448",
      "FMA24472"
    ]
  ],
  "flexor-carpi-ulnaris-ulnar-head": [
    [
      "FMA23467"
    ],
    [
      "FMA24441",
      "FMA24448",
      "FMA24472"
    ]
  ]
};
const leftBones={"FMA23130":"FMA23131","FMA23467":"FMA23468","FMA23464":"FMA23465","FMA24472":"FMA24473","FMA24455":"FMA23938","FMA24456":"FMA23940","FMA24457":"FMA23942","FMA24458":"FMA23944","FMA24464":"FMA24465","FMA24468":"FMA24469","FMA24466":"FMA24467","FMA24463":"FMA23959","FMA24460":"FMA23953","FMA24461":"FMA23955","FMA24462":"FMA23957","FMA24450":"FMA65470","FMA24459":"FMA23951","FMA24441":"FMA24442","FMA24448":"FMA24449"};
const inScope=(s,r)=>r==='whole-body'||s.regions.includes(r);
const byFma=fma=>catalog.structures.find(s=>s.fmaId===fma);
let plans=0,links=0,rejections=0,renders=0,handlers=0,boneClicks=0;
for(const a of api.forearmAttachments)for(const [sideIndex,fma]of a.fmas.entries()){
  const selected=byFma(fma),boneRows=expected[a.key].map(row=>row.map(id=>sideIndex===1?leftBones[id]:id));
  for(const region of [selected.region,'whole-body'])for(const side of ['both',selected.laterality]){
    const args=[catalog,region,side,selected.id],info=api.forearmAttachmentInfo(...args),plan=api.forearmAttachmentPlan(...args);assert(info&&plan);
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
    assert.equal(api.forearmAttachmentInfo(...args,true),null);assert.equal(api.forearmAttachmentPlan(...args,true),null);
    if(!info.completeHere){const u=new URL(api.makeStudyLink(catalog,'whole-body',selected.id,side),'https://example.invalid');const parsed=api.parseStudyLink(Object.fromEntries(u.searchParams));assert.equal(parsed.request.structureId,selected.id);assert.equal(parsed.request.side,side);assert.equal(api.resolveStudyLink(catalog,'whole-body',parsed).status,'ready');links++;}
    plans++;
  }
}
const first=muscles[0];
for(const mutate of [c=>c.sourceVersion='foreign',c=>c.license='unknown',c=>c.coordinateSystem.unitsPerMillimetre=42,c=>c.structures.push({...c.structures.find(s=>s.id===first.id)}),c=>c.bundles.push({...c.bundles.find(b=>b.id===first.bundle)}),c=>c.bundles.find(b=>b.id===first.bundle).sha256='0'.repeat(64)]){
  const bad=structuredClone(catalog);mutate(bad);assert.equal(api.forearmAttachmentPlan(bad,'whole-body','both',first.id),null);rejections++;
}
for(const p of pins.entries)for(const mutate of [s=>s.name+=' stale',s=>s.id+='-stale',s=>s.anchor[0]+=1,s=>s.laterality='unknown',s=>s.sources[0].sha256='0'.repeat(64),s=>s.regions.push('foot'),s=>s.nodeName+='-stale']){
  const bad=structuredClone(catalog);mutate(bad.structures.find(s=>s.id===p.id));assert.equal(api.forearmAttachmentInfo(bad,'whole-body','both',first.id),null);rejections++;
}
for(const s of muscles){assert.equal(api.forearmAttachmentInfo(catalog,'whole-body',s.laterality==='right'?'left':'right',s.id),null);assert.equal(api.forearmAttachmentInfo(catalog,'whole-body','invalid',s.id),null);for(const r of ['head-neck','pelvis','foot','unknown'])assert.equal(api.forearmAttachmentInfo(catalog,r,'both',s.id),null);}
for(const s of catalog.structures.filter(s=>!muscles.some(m=>m.id===s.id)))assert.equal(api.forearmAttachmentInfo(catalog,'whole-body','both',s.id),null);
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
  const html=render(props),info=api.forearmAttachmentInfo(catalog,region,'both',s.id);renders++;
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
  const calls=[],env={catalog,initialRegion:s.region,side:'both',selectedId:s.id,exam,armAttachmentPlan:api.armAttachmentPlan,thighAttachmentPlan:api.thighAttachmentPlan,neckAttachmentPlan:api.neckAttachmentPlan,forearmAttachmentPlan:api.forearmAttachmentPlan,initialInspection:{enabled:false},cameraRestore:{current:'old'},dispatch:v=>calls.push(['dispatch',v])};
  for(const name of ['setSystems','setInspection','setExplode','setLayout','setPlate','setGhostRemoved','setFocus','setIsolated','setZoom','setSelectionNotice','setReset'])env[name]=v=>calls.push([name,v]);
  runInNewContext(ts.transpile(handler+';showMuscleAttachments();',{target:ts.ScriptTarget.ES2022}),env);handlers++;
  if(exam){assert.deepEqual(calls,[]);continue;}
  assert.equal(calls.filter(c=>c[0]==='dispatch').length,1);assert.deepEqual(JSON.parse(JSON.stringify(calls.find(c=>c[0]==='dispatch')[1])),api.forearmAttachmentPlan(catalog,s.region,'both',s.id).action);
  assert.equal(calls.find(c=>c[0]==='setSelectionNotice')[1].id,s.id);assert.equal(calls.find(c=>c[0]==='setExplode')[1],0);assert.equal(calls.find(c=>c[0]==='setLayout')[1],'spatial');assert.equal(env.cameraRestore.current,null);
  assert.deepEqual(JSON.parse(JSON.stringify(calls.find(c=>c[0]==='setSystems')[1]({skeleton:false,muscles:false,vessels:false}))),{skeleton:true,muscles:true,vessels:false});
}
// Count both sided placements, not only each shared authored text.
const budgets={};for(const a of api.forearmAttachments)for(const url of a.references){budgets[url]=(budgets[url]??0)+a.fmas.length*[a.note,...a.endpoints.map(e=>e.site)].join(' ').trim().split(/\s+/).length;}
for(const [url,words]of Object.entries(budgets))assert(words<=200,url+' draft word budget '+words);
const byKey=k=>api.forearmAttachments.find(a=>a.key===k);
assert.equal(byKey('palmaris-longus').endpoints[1].bones.length,0);
assert.match(byKey('palmaris-longus').endpoints[1].site,/aponeurosis/);
for(const k of ['extensor-digitorum','extensor-digiti-minimi','extensor-indicis'])assert.match(byKey(k).endpoints[1].label,/via extensor apparatus/);
for(const k of ['flexor-carpi-ulnaris-humeral-head','flexor-carpi-ulnaris-ulnar-head'])assert.match(byKey(k).endpoints[1].label,/ligament continuations/);
assert.equal(JSON.stringify(catalog),snapshot);
const report={muscles:42,bones:38,relationships:21,plans,crossRegionLinks:links,hostContinuationLinks:muscles.length,rejectedCatalogs:rejections,componentSsr:renders,actualBoneButtonClicks:boneClicks,actualParentHandlers:handlers,referenceWords:budgets,sourceGeometryChanged:false,clinicalReview:'pending',browserAcceptance:'not-tested'};
await writeFile('docs/forearm-attachments-validation.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
