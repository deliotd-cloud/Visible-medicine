import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
import {openRegionalMriPackage,loadRegionalMriSeries,loadRegionalMriAnnotation,type RegionalMriManifest,type RegionalAsset} from '../lib/regional-mri-package.ts';
import {regionalMri3dComparison,type Regional3dCatalogue,type Regional3dTarget} from '../lib/regional-mri-3d-comparison.ts';
import {kneeBodyReferenceId,kneeReferenceSpecs,kneeReferencePin} from '../lib/regional-knee-3d-mappings.ts';

const sha=async(bytes:ArrayBuffer)=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),n=>n.toString(16).padStart(2,'0')).join('');
const enc=new TextEncoder(),asset=(bytes:ArrayBuffer):RegionalAsset=>({size:bytes.byteLength,async arrayBuffer(){return bytes.slice(0)}});
const atlas='a'.repeat(40),mapping='b'.repeat(64);
async function fixture(){
 const image=enc.encode('AB').buffer as ArrayBuffer,sourceHash=await sha(image),grid={shape_kji:[1,1,2],ijk_to_ras:[[1,0,0,0],[0,1,0,0],[0,0,1,0],[0,0,0,1]]};
 const annotation=(id:string,anatomyId:string,status:'accepted-scoped'|'provisional')=>({id,anatomyId,label:id,seriesId:'sequence',sourceImageSha256:sourceHash,laterality:'left' as const,coverage:'partial' as const,review:{status,revision:'c'.repeat(64),scope:'Synthetic source only'},geometry:{kind:'points' as const,points_ras_mm:[[0,0,0]]}});
 const manifest:RegionalMriManifest={schema:'visible-medicine.regional-mri/1',version:'1.0.0',byteOrder:'little',region:'knee',laterality:'bilateral',coordinateSystem:'per-series-RAS-mm',registration:'none',release:'local-private-draft',series:[{id:'sequence',label:'Synthetic sequence',image:{...grid,file:'sequence/image.raw',sha256:sourceHash,dtype:'uint8'},annotations:[annotation('patella','anat.knee.bne.patella','accepted-scoped'),annotation('facet','anat.knee.bne.patellar_lateral_facet','accepted-scoped'),annotation('meniscus','anat.knee.men.medial_meniscus','accepted-scoped'),annotation('acl','anat.knee.lig.anterior_cruciate_ligament','provisional')]},{id:'other',label:'Other sequence',image:{...grid,file:'other/image.raw',sha256:sourceHash,dtype:'uint8'},annotations:[]}]};
 const bytes=enc.encode(JSON.stringify(manifest)).buffer as ArrayBuffer,revision=await sha(bytes),files=new Map([['manifest.json',asset(bytes)],['sequence/image.raw',asset(image)],['other/image.raw',asset(image)]]);
 const pkg=await openRegionalMriPackage(bytes,files,revision),study=await loadRegionalMriSeries(pkg,'sequence'),other=await loadRegionalMriSeries(pkg,'other');
 const overlays=[];for(const a of study.series.annotations)overlays.push(await loadRegionalMriAnnotation(pkg,study,a,undefined,a.review.status==='provisional'?{inspectProvisional:true}:undefined));
 const targets=(id:string):Regional3dTarget[]=>kneeReferenceSpecs.filter(s=>s.anatomyId===id).map(s=>{
  const pin=kneeReferencePin(s,'left');if(s.kind==='body'){const structure=kneeBodyReferenceId(s,'left')!;return {kind:'body',id:structure,label:pin.label,side:'left',region:s.region,sourceHash:pin.sourceHash,runtimeRevision:atlas,specimenRevision:null,relation:s.relation,href:'/atlas/3d?'+new URLSearchParams({region:s.region,study:'1',structure,side:'left',source:pin.sourceHash,atlasRevision:atlas})};}
  const targetId=`vm:reference:um-5t6tz7-v1-2:knee:${s.slug}`;return {kind:'specimen',id:targetId,label:pin.label,side:'right',region:'knee',sourceHash:pin.sourceHash,runtimeRevision:atlas,specimenRevision:pin.specimenRevision,relation:s.relation,href:'/atlas/lower-limb-3d?'+new URLSearchParams({specimen:'um-limb-1',specimenScope:'knee',specimenPart:targetId,specimenSource:pin.sourceHash,specimenRevision:pin.specimenRevision!,specimenView:'anterior',atlasRevision:atlas})};
 });
 const catalogue:Regional3dCatalogue={schema:'visible-medicine.regional-mri-3d/1',mriRevision:revision,atlasRevision:atlas,mappingRevision:mapping,entries:study.series.annotations.map(a=>({anatomyId:a.anatomyId,sourceSide:'left',targets:targets(a.anatomyId)}))};
 return {pkg,study,other,overlays,revision,catalogue};
}

type Node={type:any;props:Record<string,any>};
const nodes=(value:any):Node[]=>Array.isArray(value)?value.flatMap(nodes):value?.props?[value,...nodes(value.props.children)]:[];
const words=(value:any):string=>Array.isArray(value)?value.map(words).join(''):value?.props?words(value.props.children):value==null?'':String(value);
const source=readFileSync(new URL('../components/RegionalMriPracticeFollowup.tsx',import.meta.url),'utf8');
const code=ts.transpileModule(source,{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
function harness(initial:any,compare=regionalMri3dComparison){
 let props={...initial,retired:false,onInspect:(_id:string,_launcher:any)=>{}},cursor=0,slots:any[]=[],renders=new Map<number,()=>any>(),effects=new Map<number,()=>void>(),tree:any,committed=true;
 const calls:Array<{id:string;launcher:any}>=[];props.onInspect=(id:string,launcher:any)=>calls.push({id,launcher});
 const hooks={useState(value:any){const i=cursor++;if(!(i in slots))slots[i]=value;return [slots[i],(next:any)=>{slots[i]=next;}];},useRef(value:any){const i=cursor++;if(!(i in slots))slots[i]={current:value};return slots[i];},useLayoutEffect(fn:()=>any){renders.set(cursor++,fn);}};
 const learningComponent=()=>null;
 const runtime={jsx:(type:any,p:any)=>({type,props:p}),jsxs:(type:any,p:any)=>({type,props:p})},mod={exports:{} as any};
 new Function('require','module','exports',code)((id:string)=>({'react':hooks,'react/jsx-runtime':runtime,'../lib/regional-mri-3d-comparison':{regionalMri3dComparison:compare},'./RegionalMriLearning':{RegionalMriLearning:learningComponent}} as any)[id]??assert.fail(id),mod,mod.exports);
 function render(next?:any,commit=true){if(next)props={...props,...next};cursor=0;renders=new Map();const value=mod.exports.RegionalMriPracticeFollowup(props);if(commit){for(const cleanup of effects.values())cleanup();effects=new Map();for(const [i,fn] of renders)effects.set(i,fn());tree=value;committed=true;}return value;}
 function find(type:string,part:string){const n=nodes(tree).find(n=>n.type===type&&words(n).includes(part));assert(n,`missing ${type} ${part}`);return n;}
 function open(){find('details','Study this answer').props.onToggle({currentTarget:{open:true}});render();}
 function close(){find('details','Study this answer').props.onToggle({currentTarget:{open:false}});render();}
 function strictReplay(between:()=>void){for(const cleanup of effects.values())cleanup();between();effects=new Map();for(const [i,fn] of renders)effects.set(i,fn());}
 function unmount(){for(const cleanup of effects.values())cleanup();effects.clear();committed=false;}
 return {render,find,open,close,strictReplay,unmount,calls,text:()=>words(tree),nodes:()=>nodes(tree),learningNodes:()=>nodes(tree).filter(n=>n.type===learningComponent),get committed(){return committed;}};
}

test('actual loader and pinned catalogue gate scope, source ownership and malformed targets',async()=>{
 const f=await fixture(),base={source:{revision:f.revision,region:'knee'},catalogue:f.catalogue,pkg:f.pkg,study:f.study,overlay:f.overlays[0]};
 assert(regionalMri3dComparison(base.source,base.catalogue,base.pkg,base.study,base.overlay));
 const h=harness(base);h.render();assert.match(h.text(),/Study this answer/);assert.equal(h.nodes().filter(n=>n.type==='button').length,0);h.open();assert.match(h.text(),/separate public anatomical references/);assert.match(h.text(),/revision-bound radiologist review/);
 for(const next of [{retired:true},{overlay:f.overlays[3]},{study:f.other},{overlay:{...f.overlays[0]}},{pkg:{...f.pkg}},{source:{revision:'0'.repeat(64),region:'knee'}},{catalogue:{...f.catalogue,mappingRevision:'bad'}}]){h.render({...base,...next});assert.equal(h.text(),'');}
 const bad=structuredClone(f.catalogue);bad.entries[0].targets[0].href+='&scan=private';h.render({...base,catalogue:bad});assert.equal(h.text(),'');h.unmount();
});

test('same side, whole parent and opposite unmirrored group are explicit; inspect dispatch is chosen only',async()=>{
 const f=await fixture(),base={source:{revision:f.revision,region:'knee'},catalogue:f.catalogue,pkg:f.pkg,study:f.study,overlay:f.overlays[0]};
 const h=harness(base);h.render();h.open();assert.match(h.text(),/same structure/);assert.match(h.text(),/left source side/);assert.equal(h.calls.length,0);
 const button=h.find('button','Inspect Left patella');const launcher={} as HTMLButtonElement;button.props.onClick({currentTarget:launcher});assert.deepEqual(h.calls,[{id:f.catalogue.entries[0].targets[0].id,launcher}]);
 const link=h.find('a','Open Left patella');assert.match(link.props['aria-label'],/opens in a new tab/);assert.equal(link.props.target,'_blank');assert.equal(link.props.rel,'noopener noreferrer');
 h.render({...base,overlay:f.overlays[1]});h.open();assert.match(h.text(),/whole parent reference/);assert.match(h.text(),/MRI subregion has no separate 3D selection/);
 h.render({...base,overlay:f.overlays[2]});h.open();assert.match(h.text(),/opposite source side; not mirrored/);assert.match(h.text(),/group reference/);assert.match(h.text(),/MRI component has no separate 3D selection/);h.unmount();
});

test('stale, speculative, changed-target, retired, StrictMode and unmounted actions refuse',async()=>{
 const f=await fixture(),base={source:{revision:f.revision,region:'knee'},catalogue:f.catalogue,pkg:f.pkg,study:f.study,overlay:f.overlays[0]};
 const h=harness(base);h.render();h.open();const old=h.find('button','Inspect').props.onClick,link=h.find('a','Open').props.onClick;
 const speculative=h.render({...base,overlay:f.overlays[1]},false);assert(speculative);const speculativeButton=nodes(speculative).find(n=>n.type==='button');assert(speculativeButton);speculativeButton.props.onClick({currentTarget:{}});assert.equal(h.calls.length,0);
 old({currentTarget:{}});assert.equal(h.calls.length,1); // the last committed context remains active
 h.render({...base,overlay:f.overlays[1]});old({currentTarget:{}});assert.equal(h.calls.length,1);
 h.render(base);h.open();const current=h.find('button','Inspect').props.onClick;
 const originalLabel=f.catalogue.entries[0].targets[0].label;f.catalogue.entries[0].targets[0].label='Changed in place';current({currentTarget:{}});assert.equal(h.calls.length,1);
 const event={prevented:false,preventDefault(){this.prevented=true;}};link(event);assert.equal(event.prevented,true);
 f.catalogue.entries[0].targets[0].label=originalLabel;
 h.render({retired:true});current({currentTarget:{}});assert.equal(h.calls.length,1);
 h.render({...base,retired:false});h.open();const replay=h.find('button','Inspect').props.onClick;h.strictReplay(()=>{replay({currentTarget:{}});assert.equal(h.calls.length,1);});replay({currentTarget:{}});assert.equal(h.calls.length,2);h.unmount();h.find('button','Inspect').props.onClick({currentTarget:{}});assert.equal(h.calls.length,2);
});

test('draft learning mounts only after opening with exact current objects, and closes without loading',async()=>{
 const f=await fixture(),source={revision:f.revision,region:'knee'},catalogue={...f.catalogue,learning:{} as NonNullable<Regional3dCatalogue['learning']>};
 const base={source,catalogue,pkg:f.pkg,study:f.study,overlay:f.overlays[0]},h=harness(base);
 h.render();assert.equal(h.learningNodes().length,0);h.open();assert.equal(h.learningNodes().length,1);
 const p=h.learningNodes()[0].props;assert.equal(p.source,source);assert.equal(p.catalogue,catalogue);assert.equal(p.pkg,f.pkg);assert.equal(p.study,f.study);assert.equal(p.overlay,f.overlays[0]);
 h.close();assert.equal(h.learningNodes().length,0);
 h.render({...base,catalogue:f.catalogue});h.open();assert.equal(h.learningNodes().length,0);h.unmount();
});
