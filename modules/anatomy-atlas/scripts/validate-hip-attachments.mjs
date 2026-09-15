import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {runInNewContext} from 'node:vm';
import ts from 'typescript';
import {build} from './workspace-test-build.mjs';
import {build as componentBuild} from './workspace-component-test-build.mjs';
const built=await build({stdin:{contents:"export * from './lib/hip-attachments'; export * from './content/hip-attachments'; export * from './lib/thigh-curriculum'; export * from './lib/trunk-attachments'; export * from './lib/acral-attachments'; export * from './lib/leg-attachments'; export * from './lib/forearm-attachments'; export * from './lib/arm-attachments'; export * from './lib/thigh-attachments'; export * from './lib/neck-attachments'; export * from './app/dissection-data'; export * from './lib/study-links'; export {bodyDisplayCatalog} from './lib/body-display-catalog';",resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,platform:'node',format:'esm'});
const api=await import('data:text/javascript;base64,'+Buffer.from(built.outputFiles[0].text).toString('base64'));
const catalog=api.bodyDisplayCatalog(JSON.parse(await readFile('public/models/bodyparts3d/full-body/catalog.json'))),snapshot=JSON.stringify(catalog);
const pins=JSON.parse(await readFile('content/hip-attachment-pins.json'));
const muscles=pins.entries.filter(s=>s.system==='muscles');
assert.equal(muscles.length,36);assert.equal(pins.entries.length,43);assert.equal(pins.entries.filter(s=>s.system==='connective').length,2);
assert.equal(api.hipAttachments.length,18);
const existingThigh=catalog.structures.filter(s=>api.thighAttachmentInfo(catalog,'whole-body','both',s.id));
assert.deepEqual([...existingThigh.map(s=>s.fmaId),...muscles.filter(s=>s.regions.includes('thigh')).map(s=>s.fmaId)].sort(),api.thighMuscleLessons.flatMap(a=>a.fmaIds).sort());
assert(!muscles.some(s=>s.fmaId==='FMA19728'));
// Independent endpoint and laterality expectations, not inferred FMA arithmetic.
const left={FMA16586:'FMA16587',FMA24474:'FMA24475',FMA58776:'FMA58777'};
const expected={
 'adductor-brevis':[['FMA16586'],['FMA24474']],
 'adductor-longus':[['FMA16586'],['FMA24474']],
 'adductor-magnus':[['FMA16586'],['FMA24474']],
 'adductor-minimus':[['FMA16586'],['FMA24474']],
 'gemellus-inferior':[['FMA16586'],['FMA24474']],
 'gemellus-superior':[['FMA16586'],['FMA24474']],
 'gluteus-maximus':[['FMA16586','FMA16202'],['FMA58776','FMA24474']],
 'gluteus-medius':[['FMA16586'],['FMA24474']],
 'gluteus-minimus':[['FMA16586'],['FMA24474']],
 'iliacus':[['FMA16586'],['FMA24474']],
 'obturator-externus':[['FMA16586'],['FMA24474']],
 'obturator-internus':[['FMA16586'],['FMA24474']],
 'pectineus':[['FMA16586'],['FMA24474']],
 'piriformis':[['FMA16202'],['FMA24474']],
 'psoas-major':[[],['FMA24474']],
 'quadratus-femoris':[['FMA16586'],['FMA24474']],
 'tensor-fasciae-latae':[['FMA16586'],['FMA58776']],
 'coccygeus':[['FMA16586'],['FMA16202']],
};
assert.deepEqual(Object.keys(expected).sort(),api.hipAttachments.map(a=>a.key).sort());
const sorted=a=>[...a].sort(),byFma=f=>catalog.structures.find(s=>s.fmaId===f),inScope=(s,r)=>r==='whole-body'||s.regions.includes(r);
const expand=(f,side)=>left[f]?(side==='both'?[f,left[f]]:[side==='left'?left[f]:f]):[f];
let plans=0,links=0,rejections=0,renders=0,partnerClicks=0,handlers=0,hostLinks=0;
for(const a of api.hipAttachments)for(const fma of a.fmas){
 const s=byFma(fma),sides=s.laterality==='midline'?['both','left','right']:['both',s.laterality];
 for(const region of [...s.regions,'whole-body'])for(const side of sides){
  const args=[catalog,region,side,s.id],info=api.hipAttachmentInfo(...args),plan=api.hipAttachmentPlan(...args);assert(info&&plan);
  const target=s.laterality==='midline'?side:s.laterality,wanted=expected[a.key].map(row=>row.flatMap(f=>expand(f,target)));
  assert.deepEqual(info.rows.map(r=>sorted(r.structures.map(p=>p.structure.fmaId))),wanted.map(sorted));
  assert.equal(info.completeHere,wanted.flat().every(f=>inScope(byFma(f),region)));
  assert.equal(plan.hasAttachmentPartners,wanted.flat().length>0);
  assert.equal(plan.usesConnective,wanted.flat().some(f=>byFma(f).system==='connective'));
  for(const row of info.rows)for(const partner of row.structures)assert.equal(partner.availableHere,inScope(partner.structure,region));
  const keep=new Set([...a.fmas,...expected[a.key].flat().flatMap(f=>expand(f,'both'))]);
  const pool=catalog.structures.filter(x=>inScope(x,region)),visible=pool.filter(x=>!plan.action.hiddenIds.includes(x.id));
  assert.deepEqual(sorted(visible.map(x=>x.fmaId)),sorted(pool.filter(x=>keep.has(x.fmaId)).map(x=>x.fmaId)));
  if(!plan.hasAttachmentPartners)assert(visible.every(x=>x.system==='muscles'));
  const before=api.dissectionReducer(api.initialDissection,{type:'remove',id:s.id}),after=api.dissectionReducer(before,plan.action);
  assert.deepEqual(sorted(api.resolveDissection(pool,api.dissectionProfiles[region],after).visible.map(x=>x.id)),sorted(visible.map(x=>x.id)));
  const undo=api.dissectionReducer(after,{type:'undo'});assert.deepEqual(undo.removed,before.removed);assert.deepEqual(api.dissectionReducer(undo,{type:'redo'}),after);assert.deepEqual(api.dissectionReducer(after,plan.action),after);
  for(const f of a.fmas)assert(visible.some(x=>x.fmaId===f));
  assert.equal(api.hipAttachmentPlan(...args,true),null);
  if(!info.completeHere){const u=new URL(api.makeStudyLink(catalog,'whole-body',s.id,side),'https://example.invalid');const parsed=api.parseStudyLink(Object.fromEntries(u.searchParams));assert.equal(parsed.request.structureId,s.id);assert.equal(parsed.request.side,side);assert.equal(api.resolveStudyLink(catalog,'whole-body',parsed).status,'ready');links++;}
  plans++;
 }
 if(s.laterality!=='midline')assert.equal(api.hipAttachmentInfo(catalog,'whole-body',s.laterality==='right'?'left':'right',s.id),null);
 assert.equal(api.hipAttachmentInfo(catalog,'whole-body','invalid',s.id),null);
 for(const region of ['head-neck','leg','foot','hand','unknown',...['thigh','pelvis','spine','thorax','abdomen'].filter(r=>!s.regions.includes(r))])assert.equal(api.hipAttachmentInfo(catalog,region,'both',s.id),null);
}
// Critical distinctions: no direct TFL-to-tibia tendon, no coccyx substitute.
for(const [rightFma,leftFma] of Object.entries(left)){
 assert.equal(byFma(rightFma).laterality,'right');assert.equal(byFma(leftFma).laterality,'left');
}
assert.equal(byFma('FMA46444').laterality,'left');assert.equal(byFma('FMA46443').laterality,'right');
for(const key of ['gluteus-maximus','obturator-externus','obturator-internus','psoas-major','coccygeus']){
 assert.equal(api.hipAttachments.find(a=>a.key===key).mappingStatus,'partial');
}
assert(api.hipAttachments.find(a=>a.key==='tensor-fasciae-latae').note.includes('not a separately mapped tendon'));
assert(api.hipAttachments.find(a=>a.key==='adductor-minimus').note.includes('variable separation'));
for(const key of ['gemellus-inferior','gemellus-superior'])assert(api.hipAttachments.find(a=>a.key===key).endpoints[1].site.includes('shared obturator-internus tendon'));
const first=muscles[0];
for(const mutate of [c=>c.sourceVersion='foreign',c=>c.license='unknown',c=>c.coordinateSystem.unitsPerMillimetre=42,c=>c.structures.push({...c.structures.find(s=>s.id===first.id)}),c=>c.bundles.push({...c.bundles.find(b=>b.id===first.bundle)}),c=>c.bundles.find(b=>b.id===first.bundle).sha256='0'.repeat(64)]){
 const bad=structuredClone(catalog);mutate(bad);assert.equal(api.hipAttachmentPlan(bad,'whole-body','both',first.id),null);rejections++;
}
for(const p of pins.entries)for(const mutate of [s=>s.name+=' stale',s=>s.id+='-stale',s=>s.anchor[0]+=1,s=>s.laterality='unknown',s=>s.sources[0].sha256='0'.repeat(64),s=>s.regions.push('hand'),s=>s.nodeName+='-stale',s=>s.system='unknown']){
 const bad=structuredClone(catalog);mutate(bad.structures.find(s=>s.id===p.id));assert.equal(api.hipAttachmentInfo(bad,'whole-body','both',first.id),null);rejections++;
}
for(const s of catalog.structures.filter(s=>!muscles.some(m=>m.id===s.id)))assert.equal(api.hipAttachmentInfo(catalog,'whole-body','both',s.id),null);
const require=createRequire(import.meta.url),React=require('react'),actualLink=await import('vinext/shims/link');
const bridgeBuild=await componentBuild({entryPoints:['integration/head-neck/framework.tsx'],bundle:true,write:false,format:'cjs',platform:'node'}),bridge={exports:{}};
runInNewContext(bridgeBuild.outputFiles[0].text,{module:bridge,exports:bridge.exports,require,URL,URLSearchParams});
for(const s of muscles)for(const side of s.laterality==='midline'?['both','left','right']:[s.laterality]){
 const href=api.makeStudyLink(catalog,'whole-body',s.id,side),element=bridge.exports.Link({href,children:'Continue'});assert.equal(element.props.target,'_top');
 const hosted=new URL(element.props.href,'https://example.invalid');assert.equal(hosted.pathname,'/atlas/3d');
 const resolved=api.resolveStudyLink(catalog,'whole-body',api.parseStudyLink(Object.fromEntries(hosted.searchParams)));assert.equal(resolved.status,'ready');assert.equal(resolved.selected.id,s.id);assert.equal(hosted.searchParams.get('side'),side);hostLinks++;
}
let direct=false;const reactProxy={...React,useMemo:(fn,deps)=>direct?fn():React.useMemo(fn,deps)};
const builtUi=await componentBuild({entryPoints:['app/arm-attachments.tsx'],bundle:true,write:false,format:'cjs',platform:'node'}),mod={exports:{}};
runInNewContext(builtUi.outputFiles[0].text,{module:mod,exports:mod.exports,require:n=>n==='react'?reactProxy:n==='next/link'?{__esModule:true,...actualLink}:require(n),URL,URLSearchParams,console,process:{env:{NODE_ENV:'test'}}});
const render=props=>require('react-dom/server').renderToStaticMarkup(React.createElement(mod.exports.ArmAttachments,props));
const walk=(node,pred,out=[])=>{if(React.isValidElement(node)){if(pred(node))out.push(node);React.Children.forEach(node.props.children,c=>walk(c,pred,out));}return out;};
for(const s of muscles)for(const region of [...s.regions,'whole-body']){
 const clicks=[];let shows=0;const props={catalog,region,side:'both',selectedId:s.id,disabled:false,onSelect:id=>clicks.push(id),onShow:()=>shows++};
 const html=render(props),info=api.hipAttachmentInfo(catalog,region,'both',s.id),hasPartners=info.rows.some(r=>r.structures.length);renders++;
 assert(html.includes(s.name)&&html.includes('Muscle attachment relationships')&&html.includes('Specialist review pending')&&html.includes(info.reference.url));assert(!/<details[^>]*\bopen=/.test(html));
 assert.equal(html.includes('Open this muscle in whole body'),!info.completeHere);
 assert.equal(html.includes('not non-bony'),!hasPartners);assert(!html.includes('These attachments are non-bony'));
 assert.equal(html.includes('cannot split this muscle surface'),s.laterality==='midline');assert.equal(html.includes('Group-level relationships only'),info.relationship.representation==='group');
 assert.equal(render({...props,disabled:true}),'');
 direct=true;const tree=mod.exports.ArmAttachments(props);direct=false;
 for(const partner of info.rows.flatMap(r=>r.structures)){
  assert(html.includes(partner.structure.name));const buttons=walk(tree,n=>n.props.children===partner.structure.name&&typeof n.props.onClick==='function');assert.equal(buttons.length,partner.availableHere?1:0);
  if(partner.availableHere){buttons[0].props.onClick();assert.equal(clicks.at(-1),partner.structure.id);partnerClicks++;}
 }
 const buttons=walk(tree,n=>typeof n.props.onClick==='function'&&n.props.children===(hasPartners?'Show muscle with mapped attachment structures':'Show selected muscle'));assert.equal(buttons.length,1);buttons[0].props.onClick();assert.equal(shows,1);
}
const source=await readFile('app/body-explorer.tsx','utf8'),ast=ts.createSourceFile('body.tsx',source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);let handler,wiring;
function visit(n){if(ts.isFunctionDeclaration(n)&&n.name?.text==='showMuscleAttachments')handler=n.getText(ast);if(ts.isJsxSelfClosingElement(n)&&n.tagName.getText(ast)==='ArmAttachments')wiring=n.getText(ast);ts.forEachChild(n,visit);}visit(ast);
assert(wiring.includes('onShow={showMuscleAttachments}')&&wiring.includes('onSelect={select}')&&wiring.includes('disabled={exam}'));
for(const s of muscles)for(const exam of [false,true]){
 const calls=[],env={catalog,initialRegion:s.region,side:'both',selectedId:s.id,exam,initialInspection:{enabled:false},cameraRestore:{current:'old'},dispatch:v=>calls.push(['dispatch',v])};
 for(const name of ['arm','thigh','neck','forearm','leg','acral','trunk','hip'])env[name+'AttachmentPlan']=api[name+'AttachmentPlan'];
 for(const name of ['setSystems','setInspection','setExplode','setLayout','setPlate','setGhostRemoved','setFocus','setIsolated','setZoom','setSelectionNotice','setReset'])env[name]=v=>calls.push([name,v]);
 runInNewContext(ts.transpile(handler+';showMuscleAttachments();',{target:ts.ScriptTarget.ES2022}),env);handlers++;
 if(exam){assert.deepEqual(calls,[]);continue;}
 const plan=api.hipAttachmentPlan(catalog,s.region,'both',s.id),plain=x=>JSON.parse(JSON.stringify(x));
 assert.deepEqual(plain(calls.find(c=>c[0]==='dispatch')[1]),plan.action);
 const notice=calls.find(c=>c[0]==='setSelectionNotice')[1];assert.equal(notice.id,s.id);assert.equal(notice.message.includes('not non-bony'),!plan.hasAttachmentPartners);
 const toggles=calls.find(c=>c[0]==='setSystems')[1]({skeleton:false,muscles:false,connective:false,vessels:false});
 assert.deepEqual(plain(toggles),{skeleton:true,muscles:true,connective:plan.usesConnective,vessels:false});
 assert.equal(calls.find(c=>c[0]==='setExplode')[1],0);assert.equal(calls.find(c=>c[0]==='setLayout')[1],'spatial');assert.equal(env.cameraRestore.current,null);
}
const budgets={};for(const a of api.hipAttachments)for(const url of a.references)budgets[url]=(budgets[url]??0)+a.fmas.length*[a.note,...a.endpoints.map(e=>e.site)].join(' ').trim().split(/\s+/).length;
for(const [url,words]of Object.entries(budgets))assert(words<=200,url+' draft word budget '+words);
assert.equal(JSON.stringify(catalog),snapshot);
const report={muscles:36,bones:5,fasciae:2,relationships:18,plans,crossRegionLinks:links,hostContinuationLinks:hostLinks,rejectedCatalogs:rejections,componentSsr:renders,actualPartnerButtonClicks:partnerClicks,actualParentHandlers:handlers,referenceWords:budgets,sourceGeometryChanged:false,clinicalReview:'pending',browserAcceptance:'not-tested'};
await writeFile('docs/hip-attachments-validation.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
