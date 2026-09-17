import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {runInNewContext} from 'node:vm';
import ts from 'typescript';
import {build} from './workspace-test-build.mjs';
import {build as componentBuild} from './workspace-component-test-build.mjs';
const out=await build({stdin:{contents:"export * from './lib/bowel-components'; export * from './app/dissection-data'; export * from './lib/study-links'; export {bodyDisplayCatalog} from './lib/body-display-catalog';",resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,format:'esm',platform:'node'});
const api=await import('data:text/javascript;base64,'+Buffer.from(out.outputFiles[0].text).toString('base64'));
const catalog=api.bodyDisplayCatalog(JSON.parse(await readFile('public/models/bodyparts3d/full-body/catalog.json'))),before=JSON.stringify(catalog);
const entries=JSON.parse(await readFile('content/bowel-component-pins.json')).entries;
const expected={small:['FMA7200','FMA11338'],large:['FMA7201','FMA14544','FMA11338']};
let plans=0,links=0,rejections=0,renders=0,clicks=0,handlers=0;
const sameSet=(a,b)=>assert.deepEqual([...a].sort(),[...b].sort());
for(const s of entries)for(const region of [...s.regions,'whole-body'])for(const side of ['both','left','right']){
 const args=[catalog,region,side,s.id],info=api.bowelComponentInfo(...args);assert(info);
 assert.equal(info.groups.length,s.fmaId==='FMA11338'?2:1);
 for(const g of info.groups){
  assert.deepEqual(g.rows.map(r=>r.structure.fmaId),expected[g.key]);
  const wanted=g.rows.filter(r=>region==='whole-body'||r.structure.regions.includes(region)).map(r=>r.structure.id);
  assert.equal(g.completeHere,wanted.length===expected[g.key].length);
  const plan=api.bowelComponentPlan(...args,g.key);assert.equal(plan.selectedId,s.id);assert(wanted.includes(s.id));
  const scope=catalog.structures.filter(s=>region==='whole-body'||s.regions.includes(region));
  sameSet(scope.filter(x=>!plan.action.hiddenIds.includes(x.id)).map(x=>x.id),wanted);
  const prior=api.dissectionReducer(api.initialDissection,{type:'remove',id:s.id});
  const shown=api.dissectionReducer(prior,plan.action),resolved=api.resolveDissection(scope,api.dissectionProfiles[region],shown);
  sameSet(resolved.visible.map(x=>x.id),wanted);
  assert.deepEqual(api.dissectionReducer(shown,{type:'undo'}).removed,prior.removed);plans++;
 }
 const href=api.makeStudyLink(catalog,'whole-body',s.id,side);assert(href);
 const url=new URL(href,'http://atlas.test');const parsed=api.parseStudyLink(Object.fromEntries(url.searchParams));
 const resolved=api.resolveStudyLink(catalog,'whole-body',parsed);assert.equal(resolved.status,'ready');links++;
 assert.equal(api.bowelComponentInfo(...args,true),null);assert.equal(api.bowelComponentPlan(...args,'invented'),null);
 for(const invalid of ['thorax','hand','not-a-region'])assert.equal(api.bowelComponentInfo(catalog,invalid,side,s.id),null);
 for(const invalid of ['unpaired','midline','invalid'])assert.equal(api.bowelComponentInfo(catalog,region,invalid,s.id),null);
}
for(const s of entries){
 for(const mutate of [
  c=>{c.sourceVersion='3.0';},c=>{c.license='CC0';},c=>{c.coordinateSystem.unitsPerMillimetre=1;},
  c=>{c.structures=c.structures.filter(x=>x.id!==s.id);},c=>{c.structures.push(structuredClone(c.structures.find(x=>x.id===s.id)));},
  c=>{const x=structuredClone(c.structures.find(x=>x.id===s.id));x.id+=':alias';c.structures.push(x);},
  ...['name','sourceTree','laterality','region','bundle','nodeName','category','system'].map(key=>c=>{c.structures.find(x=>x.id===s.id)[key]='changed';}),
  c=>{c.structures.find(x=>x.id===s.id).sources[0].sha256='0'.repeat(64);},
  c=>{c.structures.find(x=>x.id===s.id).sources.reverse();if(s.sources.length===1)c.structures.find(x=>x.id===s.id).sources=[];},
  c=>{c.structures.find(x=>x.id===s.id).regions.push('hand');},
  c=>{c.bundles.find(b=>b.id===s.bundle).sha256='0'.repeat(64);},
  c=>{c.bundles.push(structuredClone(c.bundles.find(b=>b.id===s.bundle)));},
 ]){const c=structuredClone(catalog);mutate(c);assert.equal(api.bowelComponentInfo(c,'whole-body','both',s.id),null);rejections++;}
}
const require=createRequire(import.meta.url),React=require('react'),actualLink=await import('vinext/shims/link');let direct=false;
const proxy=new Proxy(React,{get:(o,k)=>k==='useMemo'?(fn,deps)=>direct?fn():React.useMemo(fn,deps):o[k]});
const ui=await componentBuild({entryPoints:['app/bowel-components.tsx'],bundle:true,write:false,format:'cjs',platform:'node'}),mod={exports:{}};
runInNewContext(ui.outputFiles[0].text,{module:mod,exports:mod.exports,require:n=>n==='react'?proxy:n==='next/link'?{__esModule:true,...actualLink}:require(n),URL,URLSearchParams,console,process:{env:{NODE_ENV:'test'}}});
const walk=(node,pred,found=[])=>{if(React.isValidElement(node)){if(pred(node))found.push(node);React.Children.forEach(node.props.children,c=>walk(c,pred,found));}return found;};
for(const s of entries)for(const region of [...s.regions,'whole-body']){
 const actions=[],props={catalog,region,side:'both',selectedId:s.id,disabled:false,onSelect:id=>actions.push(['select',id]),onShow:key=>actions.push(['show',key])};
 const render=p=>require('react-dom/server').renderToStaticMarkup(React.createElement(mod.exports.BowelComponents,p));
 const html=render(props),info=api.bowelComponentInfo(catalog,region,'both',s.id);renders++;
 assert(html.includes('Bowel components')&&html.includes('Radiologist review pending'));assert(!/<details[^>]*\bopen=/.test(html));
 assert.equal(html.includes('descending/sigmoid boundary needs review'),info.groups.some(g=>g.key==='large'));
 assert.equal(html.includes('Open this selection in whole body'),info.groups.some(g=>!g.completeHere));assert.equal(render({...props,disabled:true}),'');
 direct=true;const tree=mod.exports.BowelComponents(props);direct=false;
 for(const g of info.groups)for(const r of g.rows){
  const buttons=walk(tree,n=>n.props.children===r.structure.name&&typeof n.props.onClick==='function');
  assert.equal(buttons.length,r.availableHere?(s.fmaId==='FMA11338'&&r.structure.fmaId==='FMA11338'?2:1):0);
  if(r.availableHere){buttons[0].props.onClick();assert.deepEqual(actions.at(-1),['select',r.structure.id]);clicks++;}
 }
 const show=walk(tree,n=>Array.isArray(n.props.children)&&n.props.children[0]==='Show '&&typeof n.props.onClick==='function');assert.equal(show.length,info.groups.length);
 show.forEach((b,i)=>{b.props.onClick();assert.deepEqual(actions.at(-1),['show',info.groups[i].key]);});
}
const source=await readFile('app/body-explorer.tsx','utf8'),ast=ts.createSourceFile('body.tsx',source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);let handler,wiring;
function visit(n){if(ts.isFunctionDeclaration(n)&&n.name?.text==='showBowelComponents')handler=n.getText(ast);if(ts.isJsxSelfClosingElement(n)&&n.tagName.getText(ast)==='BowelComponents')wiring=n.getText(ast);ts.forEachChild(n,visit);}visit(ast);
assert(wiring.includes('onShow={showBowelComponents}')&&wiring.includes('disabled={exam}')&&wiring.includes('onSelect={select}'));
for(const s of entries)for(const exam of [false,true]){
 const key=s.fmaId==='FMA7200'?'small':'large',calls=[],env={catalog,initialRegion:s.region,side:'both',selectedId:s.id,exam,bowelComponentPlan:api.bowelComponentPlan,initialInspection:{enabled:false},cameraRestore:{current:'old'},dispatch:v=>calls.push(['dispatch',v])};
 for(const n of ['setSystems','setView','setInspection','setExplode','setLayout','setPlate','setGhostRemoved','setFocus','setIsolated','setZoom','setSelectionNotice','setReset'])env[n]=v=>calls.push([n,v]);
 runInNewContext(ts.transpile(handler+`;showBowelComponents('${key}');`,{target:ts.ScriptTarget.ES2022}),env);handlers++;
 if(exam){assert.deepEqual(calls,[]);continue;}
 assert.equal(calls.find(c=>c[0]==='setSelectionNotice')[1].id,s.id);
 assert.equal(calls.find(c=>c[0]==='setView')[1],'anterior');assert.equal(calls.find(c=>c[0]==='setExplode')[1],0);assert.equal(env.cameraRestore.current,null);
 const toggles=calls.find(c=>c[0]==='setSystems')[1]({organs:false,muscles:false,vessels:false});assert.deepEqual(JSON.parse(JSON.stringify(toggles)),{organs:true,muscles:false,vessels:false});
 assert.deepEqual(JSON.parse(JSON.stringify(calls.find(c=>c[0]==='dispatch')[1])),api.bowelComponentPlan(catalog,s.region,'both',s.id,key).action);
}
assert.equal(JSON.stringify(catalog),before);
const report={plans,links,rejections,renders,partnerClicks:clicks,actualParentHandlers:handlers,sourceGeometryChanged:false,clinicalApproval:false,browserAcceptance:false};
await writeFile('docs/bowel-components-validation.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
