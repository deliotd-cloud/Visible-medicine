import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {runInNewContext} from 'node:vm';
import ts from 'typescript';
import {build} from './workspace-test-build.mjs';
import {build as componentBuild} from './workspace-component-test-build.mjs';
const built=await build({stdin:{contents:"export * from './lib/trunk-attachments'; export * from './content/trunk-attachments'; export * from './lib/trunk-curriculum'; export * from './lib/acral-attachments'; export * from './lib/leg-attachments'; export * from './lib/forearm-attachments'; export * from './lib/arm-attachments'; export * from './lib/thigh-attachments'; export * from './lib/neck-attachments'; export * from './app/dissection-data'; export * from './lib/study-links'; export {bodyDisplayCatalog} from './lib/body-display-catalog';",resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,platform:'node',format:'esm'});
const api=await import('data:text/javascript;base64,'+Buffer.from(built.outputFiles[0].text).toString('base64'));
const catalog=api.bodyDisplayCatalog(JSON.parse(await readFile('public/models/bodyparts3d/full-body/catalog.json'))),snapshot=JSON.stringify(catalog);
const pins=JSON.parse(await readFile('content/trunk-attachment-pins.json'));
const muscles=pins.entries.filter(s=>s.system==='muscles');
assert.equal(muscles.length,38);assert.equal(pins.entries.length,106);assert.equal(pins.entries.filter(s=>s.system==='connective').length,14);
assert.deepEqual(muscles.map(s=>s.fmaId).sort(),api.trunkMuscleLessons.flatMap(a=>a.fmaIds).sort());
// Independent expected FMA sets. Order is not inferred from the curriculum's left-first muscle pairs.
const rib=['FMA7857','FMA7882','FMA7909','FMA7957','FMA8066','FMA8175','FMA8229','FMA8283','FMA8364','FMA8445','FMA8531','FMA8533'];
const cartilage=['FMA7875','FMA7886','FMA7913','FMA7976','FMA8070','FMA8194','FMA8248'];
const thoracic=['FMA9165','FMA9187','FMA9209','FMA9248','FMA9922','FMA9945','FMA9968','FMA9991','FMA10014','FMA10037','FMA10059','FMA10081'];
const left={
 FMA7857:'FMA7987',FMA7882:'FMA8012',FMA7909:'FMA8039',FMA7957:'FMA8148',FMA8066:'FMA8093',FMA8175:'FMA8202',
 FMA8229:'FMA8256',FMA8283:'FMA8310',FMA8364:'FMA8391',FMA8445:'FMA8472',FMA8531:'FMA8532',FMA8533:'FMA8534',
 FMA7875:'FMA8005',FMA7886:'FMA8031',FMA7913:'FMA8058',FMA7976:'FMA8167',FMA8070:'FMA8112',FMA8194:'FMA8221',FMA8248:'FMA8275',
 FMA16586:'FMA16587',FMA13322:'FMA13323',FMA13395:'FMA13396',FMA23130:'FMA23131',
};
const expected={
 'external-intercostal':[[],[]],'internal-intercostal':[[],[]],'innermost-intercostal':[[],[]],
 'external-oblique':[rib.slice(4),['FMA16586']],
 'pectoralis-minor':[rib.slice(2,5),['FMA13395']],
 'pectoralis-major':[['FMA7486','FMA7487',...cartilage],['FMA23130']],
 'transversus-thoracis':[['FMA7487','FMA7488'],cartilage.slice(1,6)],
 'diaphragm':[['FMA7488',...rib.slice(6),'FMA13072','FMA13073','FMA13074'],[]],
 'trapezius-ascending':[thoracic.slice(3),['FMA13395']],
 'trapezius-transverse':[[],['FMA13395']],
 'trapezius-descending':[['FMA52735'],['FMA13322']],
 'lumbar-rotator':[[],[]],'thoracic-rotator':[[],[]],
 'iliocostalis-lumborum':[['FMA16202','FMA16586'],[]],
 'iliocostalis-thoracis':[rib.slice(6),[...rib.slice(0,6),'FMA12525']],
 'longissimus-thoracis':[['FMA16202','FMA16586'],[]],
 'semispinalis-thoracis':[thoracic.slice(5,10),['FMA12524','FMA12525',...thoracic.slice(0,4)]],
 'serratus-posterior-inferior':[[...thoracic.slice(10),'FMA13072','FMA13073'],rib.slice(8)],
 'serratus-posterior-superior':[['FMA12525',...thoracic.slice(0,3)],rib.slice(1,5)],
 'spinalis':[[],[]],'lateral-lumbar-intertransversarius':[[],[]],'medial-lumbar-intertransversarius':[[],[]],'interspinalis-thoracis':[[],[]],
};
assert.deepEqual(Object.keys(expected).sort(),api.trunkAttachments.map(a=>a.key).sort());
const sorted=a=>[...a].sort(),byFma=f=>catalog.structures.find(s=>s.fmaId===f),inScope=(s,r)=>r==='whole-body'||s.regions.includes(r);
const expand=(f,side)=>left[f]?(side==='both'?[f,left[f]]:[side==='left'?left[f]:f]):[f];
let plans=0,links=0,rejections=0,renders=0,partnerClicks=0,handlers=0,hostLinks=0;
for(const a of api.trunkAttachments)for(const fma of a.fmas){
 const s=byFma(fma),sides=s.laterality==='midline'?['both','left','right']:['both',s.laterality];
 for(const region of [...s.regions,'whole-body'])for(const side of sides){
  const args=[catalog,region,side,s.id],info=api.trunkAttachmentInfo(...args),plan=api.trunkAttachmentPlan(...args);assert(info&&plan);
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
  assert.equal(api.trunkAttachmentPlan(...args,true),null);
  if(!info.completeHere){const u=new URL(api.makeStudyLink(catalog,'whole-body',s.id,side),'https://example.invalid');const parsed=api.parseStudyLink(Object.fromEntries(u.searchParams));assert.equal(parsed.request.structureId,s.id);assert.equal(parsed.request.side,side);assert.equal(api.resolveStudyLink(catalog,'whole-body',parsed).status,'ready');links++;}
  plans++;
 }
 if(s.laterality!=='midline')assert.equal(api.trunkAttachmentInfo(catalog,'whole-body',s.laterality==='right'?'left':'right',s.id),null);
 assert.equal(api.trunkAttachmentInfo(catalog,'whole-body','invalid',s.id),null);
 for(const region of ['head-neck','leg','foot','hand','unknown',...['thorax','spine','abdomen'].filter(r=>!s.regions.includes(r))])assert.equal(api.trunkAttachmentInfo(catalog,region,'both',s.id),null);
}
const first=muscles[0];
for(const mutate of [c=>c.sourceVersion='foreign',c=>c.license='unknown',c=>c.coordinateSystem.unitsPerMillimetre=42,c=>c.structures.push({...c.structures.find(s=>s.id===first.id)}),c=>c.bundles.push({...c.bundles.find(b=>b.id===first.bundle)}),c=>c.bundles.find(b=>b.id===first.bundle).sha256='0'.repeat(64)]){
 const bad=structuredClone(catalog);mutate(bad);assert.equal(api.trunkAttachmentPlan(bad,'whole-body','both',first.id),null);rejections++;
}
for(const p of pins.entries)for(const mutate of [s=>s.name+=' stale',s=>s.id+='-stale',s=>s.anchor[0]+=1,s=>s.laterality='unknown',s=>s.sources[0].sha256='0'.repeat(64),s=>s.regions.push('hand'),s=>s.nodeName+='-stale',s=>s.system='unknown']){
 const bad=structuredClone(catalog);mutate(bad.structures.find(s=>s.id===p.id));assert.equal(api.trunkAttachmentInfo(bad,'whole-body','both',first.id),null);rejections++;
}
for(const s of catalog.structures.filter(s=>!muscles.some(m=>m.id===s.id)))assert.equal(api.trunkAttachmentInfo(catalog,'whole-body','both',s.id),null);
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
 const html=render(props),info=api.trunkAttachmentInfo(catalog,region,'both',s.id),hasPartners=info.rows.some(r=>r.structures.length);renders++;
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
 for(const name of ['arm','thigh','neck','forearm','leg','acral','trunk'])env[name+'AttachmentPlan']=api[name+'AttachmentPlan'];
 for(const name of ['setSystems','setInspection','setExplode','setLayout','setPlate','setGhostRemoved','setFocus','setIsolated','setZoom','setSelectionNotice','setReset'])env[name]=v=>calls.push([name,v]);
 runInNewContext(ts.transpile(handler+';showMuscleAttachments();',{target:ts.ScriptTarget.ES2022}),env);handlers++;
 if(exam){assert.deepEqual(calls,[]);continue;}
 const plan=api.trunkAttachmentPlan(catalog,s.region,'both',s.id),plain=x=>JSON.parse(JSON.stringify(x));
 assert.deepEqual(plain(calls.find(c=>c[0]==='dispatch')[1]),plan.action);
 const notice=calls.find(c=>c[0]==='setSelectionNotice')[1];assert.equal(notice.id,s.id);assert.equal(notice.message.includes('not non-bony'),!plan.hasAttachmentPartners);
 const toggles=calls.find(c=>c[0]==='setSystems')[1]({skeleton:false,muscles:false,connective:false,vessels:false});
 assert.deepEqual(plain(toggles),{skeleton:true,muscles:true,connective:plan.usesConnective,vessels:false});
 assert.equal(calls.find(c=>c[0]==='setExplode')[1],0);assert.equal(calls.find(c=>c[0]==='setLayout')[1],'spatial');assert.equal(env.cameraRestore.current,null);
}
const budgets={};for(const a of api.trunkAttachments)for(const url of a.references)budgets[url]=(budgets[url]??0)+a.fmas.length*[a.note,...a.endpoints.map(e=>e.site)].join(' ').trim().split(/\s+/).length;
for(const [url,words]of Object.entries(budgets))assert(words<=200,url+' draft word budget '+words);
assert.equal(JSON.stringify(catalog),snapshot);
const report={muscles:38,bones:54,cartilages:14,relationships:23,plans,crossRegionLinks:links,hostContinuationLinks:hostLinks,rejectedCatalogs:rejections,componentSsr:renders,actualPartnerButtonClicks:partnerClicks,actualParentHandlers:handlers,referenceWords:budgets,sourceGeometryChanged:false,clinicalReview:'pending',browserAcceptance:'not-tested'};
await writeFile('docs/trunk-attachments-validation.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
