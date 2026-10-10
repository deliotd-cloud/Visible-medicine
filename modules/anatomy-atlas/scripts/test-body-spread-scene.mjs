import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {runInNewContext} from 'node:vm';
import {transformSync} from 'esbuild';
import ts from 'typescript';
import {build} from './workspace-test-build.mjs';

const baseline='fa7dcf45efbad1dc908b02e6c699dcb02e6b3c06';
const source=await readFile('app/body-scene.tsx','utf8');
const previous=execFileSync('git',['show',baseline+':app/body-scene.tsx'],{encoding:'utf8',maxBuffer:8e6});
const built=await build({stdin:{contents:`export * from 'three'; export * from './lib/body-spread';
export * from './lib/body-arrangement'; export * from './lib/explode-layout.mjs';
export * from './lib/body-display-catalog'; export * from './lib/body-presentation-parts';
export * from './lib/anatomy-load-state'; export * from './lib/origin-guides';
export * from './lib/inspection-geometry'; export * from './lib/inspection-state';
export * from './lib/screen-label-layout'; export * from './app/body-types';`,resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,platform:'node',format:'esm'});
const a=await import('data:text/javascript;base64,'+Buffer.from(built.outputFiles[0].text).toString('base64'));
function renderer(text){
 const file=ts.createSourceFile('scene.tsx',text,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
 const fn=file.statements.find(n=>ts.isFunctionDeclaration(n)&&n.name?.text==='BodyScene');assert(fn?.body);
 const statements=[];
 for(const n of fn.body.statements){statements.push(n.getText(file));if(ts.isVariableStatement(n)&&n.declarationList.declarations.some(d=>d.name.getText(file)==='bounds'))break;}
 assert(statements.at(-1).includes('const bounds'));
 const code=transformSync(`function pipeline(props){${statements.join('\n')}
 return {rendered,frame,center,offsets,bounds,spreadScale:typeof spreadScale==='undefined'?null:spreadScale};}`,{loader:'ts',format:'cjs'}).code;
 let index=0;const slots=[];
 const pipe=runInNewContext(code+';pipeline',{...a,THREE:a,Map,useMemo(fn,deps){const slot=index++,p=slots[slot];if(p&&p.deps.length===deps.length&&deps.every((d,i)=>Object.is(d,p.deps[i])))return p.value;const value=fn();slots[slot]={deps,value};return value;}});
 return props=>{index=0;return pipe(props);};
}
const catalog=a.bodyDisplayCatalog(JSON.parse(await readFile('public/models/bodyparts3d/full-body/catalog.json','utf8'))),snapshot=JSON.stringify(catalog);
const systems=Object.fromEntries(Object.keys(a.bodySystems).map(k=>[k,true]));
let sceneCases=0,stableVisibilityCases=0,labelCases=0,clippingCases=0;
function equalOffsets(left,right){assert.deepEqual([...left.keys()],[...right.keys()]);for(const[id,v]of left)assert(v.distanceTo(right.get(id))<1e-10,id);}
for(const region of ['whole-body',...catalog.regions.map(r=>r.id)])for(const side of ['both','left','right']){
 const structures=catalog.structures.filter(s=>(region==='whole-body'||s.regions.includes(region))&&a.bodySideMatches(s,side)).map(s=>a.bodyPresentationStructure(s,side));
 assert(structures.length);const render=renderer(source),oldRender=renderer(previous);
 const base={structures,systems,selectedId:structures[0].id,hiddenIds:[],ghostRemoved:false,exam:false,focus:false,view:'anterior',layout:'spatial',explode:100,anchorSkeleton:false,inspection:a.initialInspection,showOrigins:false};
 const result=render({...base,adaptiveSpread:true}),expectedScale=a.bodySpreadScale(result.frame);
 assert(result.spreadScale.equals(expectedScale));
 const cut={...a.initialInspection,plane:'coronal',position:57},originalPlanes=a.sectionPlanes(result.frame,cut);
 assert(originalPlanes.length);
 for(const item of structures){const moved=result.offsets.get(item.id);assert(moved.equals(a.bodySpreadOffset(item.center,result.center,100,false,expectedScale)));assert(result.bounds.containsBox(a.translatedBox(item.bounds,moved)));
  const point=new a.Vector3(...item.center),displayPoint=point.clone().add(moved),displayPlanes=a.sectionPlanes(result.frame,cut,moved);
  assert.equal(displayPlanes.length,originalPlanes.length);
  originalPlanes.forEach((plane,i)=>assert(Math.abs(plane.distanceToPoint(point)-displayPlanes[i].distanceToPoint(displayPoint))<1e-9));clippingCases++;
 }
 // All previous callers, Tray and Extract retain exact prior offset/bounds behaviour.
 for(const layout of ['spatial','tray','extract'])for(const amount of [0,40,100]){
  const props={...base,layout,explode:amount};const legacy=oldRender(props),now=render({...props,adaptiveSpread:layout!=='spatial'});
  equalOffsets(now.offsets,legacy.offsets);assert(now.bounds.equals(legacy.bounds));sceneCases++;
 }
 for(const amount of [0,-1,NaN,Infinity])for(const exam of [false,true]){
  const assembled=render({...base,adaptiveSpread:true,explode:amount,exam});assert([...assembled.offsets.values()].every(v=>v.length()===0));sceneCases++;
 }
 const anchored=render({...base,adaptiveSpread:true,anchorSkeleton:true});for(const item of structures)if(item.system==='skeleton')assert.equal(anchored.offsets.get(item.id).length(),0);
 const stable=render({...base,adaptiveSpread:true});
 // Visibility, selected entry, focus and standard camera changes cannot move neighbours.
 for(const extra of [{hiddenIds:[base.selectedId]},{hiddenIds:[base.selectedId],ghostRemoved:true},{systems:{...systems,[structures[0].system]:false}},{selectedId:structures.at(-1).id},{focus:true},{view:'left'}]){
  const changed=render({...base,adaptiveSpread:true,...extra});assert(changed.spreadScale===stable.spreadScale);
  for(const[id,v]of changed.offsets)assert(v.equals(result.offsets.get(id)));stableVisibilityCases++;
 }
 for(const direction of [[0,0,1],[-1,0,0],[1,.5,1]]){
  const d=new a.Vector3(...direction).normalize(),fit=a.fitBounds(result.bounds,d,new a.Vector3(0,1,0),1.5,38,[.7,.9]);
  const camera=new a.PerspectiveCamera(38,1.5,.01,Math.max(150,fit.distance+result.bounds.getSize(new a.Vector3()).length()*4));camera.position.copy(fit.center).addScaledVector(d,fit.distance);camera.lookAt(fit.center);camera.updateMatrixWorld();
  const labels=structures.slice(0,8).map((item,i)=>{const anchor=a.projectLabelAnchor(new a.Vector3(...item.center).add(result.offsets.get(item.id)),camera,900,600);assert(anchor);return {id:item.id,...anchor,width:150,height:44,selected:i===0};});
  for(const label of a.layoutScreenLabels(labels,900,600))assert.equal(label.side,label.x<450?'left':'right');labelCases++;
 }
}
const app=await readFile('app/body-explorer.tsx','utf8'),ast=ts.createSourceFile('explorer.tsx',app,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);let optIns=0;
function visit(n){if(ts.isJsxSelfClosingElement(n)&&n.tagName.getText(ast)==='Scene'){const opt=n.attributes.properties.find(p=>ts.isJsxAttribute(p)&&p.name.text==='adaptiveSpread');assert(opt&&!opt.initializer,'Root explorer explicitly opts in');optIns++;}ts.forEachChild(n,visit);}visit(ast);assert.equal(optIns,1);
for(const path of ['app/eye-layers.tsx','app/ventricles.tsx','app/femoral-components.tsx','app/nested-practice.tsx','app/um-limb-learning.tsx','app/um-knee-study.tsx','app/regional-guided-learning.tsx'])assert(!(await readFile(path,'utf8')).includes('adaptiveSpread'),path+' keeps its independent layout');
assert.equal(JSON.stringify(catalog),snapshot);
const evidence={baseline,sceneCases,stableVisibilityCases,labelCases,clippingCases,scopes:36,displayEntries:catalog.structures.length,sceneSha256:createHash('sha256').update(source).digest('hex'),
 sourceGeometryModified:false,teachingModified:false,accessModified:false,independentLayoutsRetained:true,examAssembled:true,limitations:'CPU execution of actual scene memo pipeline and camera/label mathematics, not browser/GPU or clinical acceptance.'};
await mkdir('.local',{recursive:true});await writeFile('.local/body-spread-scene-test.json',JSON.stringify(evidence,null,2)+'\n');console.log(JSON.stringify(evidence));
