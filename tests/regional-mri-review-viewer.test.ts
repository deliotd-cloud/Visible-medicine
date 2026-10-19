import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import ts from 'typescript';
import {build} from 'esbuild';
import {createHash} from 'node:crypto';

const require=createRequire(import.meta.url);
const source=readFileSync(new URL('../components/RegionalMriReviewViewer.tsx',import.meta.url),'utf8');
const code=ts.transpileModule(source,{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
type Node={type:any;props:Record<string,any>;key?:string|null};
type Deferred<T>={promise:Promise<T>;resolve:(value:T)=>void;reject:(error:Error)=>void};
function deferred<T>():Deferred<T>{let resolve!:Deferred<T>['resolve'],reject!:Deferred<T>['reject'];const promise=new Promise<T>((a,b)=>{resolve=a;reject=b;});return{promise,resolve,reject};}
const revision='a'.repeat(64),sourcePin={revision,label:'Knee source',region:'knee'};
const accepted={id:'a1',anatomyId:'knee.a',label:'Meniscus',seriesId:'s1',sourceImageSha256:'b'.repeat(64),laterality:'left',coverage:'partial',review:{status:'accepted-scoped',revision:'c'.repeat(64),scope:'Only the acquired source sequence'},geometry:{kind:'mask',gridKind:'source-native',mappingRevision:'d'.repeat(64)}};
const provisional={...accepted,id:'p1',label:'Ligament provisional',review:{...accepted.review,status:'provisional'},geometry:{kind:'mask',gridKind:'derived-source-ras',mappingRevision:'e'.repeat(64)}};
const deferredAnnotation={...accepted,id:'d1',label:'Deferred anatomy',review:{...accepted.review,status:'deferred'},geometry:{kind:'none'}};
const s1={id:'s1',label:'Axial T2',image:{shape_kji:[3,4,5],dtype:'uint16'},annotations:[accepted,provisional,deferredAnnotation]};
const s2={id:'s2',label:'Sagittal PD',image:{shape_kji:[4,3,2],dtype:'uint16'},annotations:[]};
const pkg={manifest:{region:'knee',series:[s1,s2]},revision};
const view={sliceCount:3};
const study=(series:any)=>({series,range:[0,100],geometry:{views:{axial:view,coronal:{sliceCount:4},sagittal:{sliceCount:5}}}});
const guideAnatomy=['anat.knee.lig.anterior_cruciate_ligament','anat.knee.lig.posterior_cruciate_ligament',
  'anat.knee.lig.medial_collateral_ligament','anat.knee.lig.lateral_collateral_ligament'];
const guideCandidate=(id:string,anatomyId:string,status:'accepted-scoped'|'provisional'|'deferred'='accepted-scoped')=>({
  ...accepted,id,anatomyId,label:id,review:{...accepted.review,status},geometry:status==='deferred'?{kind:'none'}:accepted.geometry,
});
const guidedSeries={...s1,annotations:[guideCandidate('ACL accepted',guideAnatomy[0]),guideCandidate('PCL provisional',guideAnatomy[1],'provisional'),
  guideCandidate('MCL first',guideAnatomy[2]),guideCandidate('MCL second',guideAnatomy[2]),guideCandidate('LCL deferred',guideAnatomy[3],'deferred')]};
const guidedOtherSeries={...s2,annotations:[guideCandidate('PCL other sequence',guideAnatomy[1]),guideCandidate('LCL other sequence',guideAnatomy[3])]};
const guidedPkg={...pkg,manifest:{...pkg.manifest,series:[guidedSeries,guidedOtherSeries]}};
const syntheticGuideOwners=new WeakMap<object,{pkg:any;study:any}>();
const syntheticGuideCache=new WeakMap<object,readonly any[]>();
const guideDefinitions=[{id:'cruciate-ligaments',title:'Cruciate ligaments',indexes:[0,1]},
  {id:'collateral-ligaments',title:'Collateral ligaments',indexes:[2,3]}];
function syntheticGuides(ownerPkg:any,ownerStudy:any){
  if(ownerPkg!==guidedPkg&&!ownerPkg?.syntheticGuideFixture||ownerPkg.manifest.region!=='knee')return Object.freeze([]);
  const cached=syntheticGuideCache.get(ownerStudy);if(cached)return cached;
  const guides=Object.freeze(guideDefinitions.map(definition=>{
    const guide=Object.freeze({id:definition.id,title:definition.title,revision:'synthetic-guide-v1',sourceRevision:ownerPkg.revision,
      sequenceId:ownerStudy.series.id,imageSha256:ownerStudy.series.image.sha256,
      steps:Object.freeze(definition.indexes.map(index=>Object.freeze({anatomyId:guideAnatomy[index],
        title:['Anterior cruciate ligament','Posterior cruciate ligament','Medial collateral ligament','Lateral collateral ligament'][index],
        caption:'Original synthetic teaching draft; no approval claim.',source:Object.freeze({title:'Synthetic primary source',href:'https://pubmed.ncbi.nlm.nih.gov/8600743/'}),
        candidates:Object.freeze(ownerStudy.series.annotations.filter((annotation:any)=>annotation.anatomyId===guideAnatomy[index]))}))),
    });syntheticGuideOwners.set(guide,{pkg:ownerPkg,study:ownerStudy});return guide;
  }));syntheticGuideCache.set(ownerStudy,guides);return guides;
}
function syntheticGuideAnnotation(ownerPkg:any,ownerStudy:any,guide:any,index:number,id:string){
  const owner=syntheticGuideOwners.get(guide);
  const annotation=owner&&owner.pkg===ownerPkg&&owner.study===ownerStudy&&Number.isSafeInteger(index)?guide.steps[index]?.candidates.find((candidate:any)=>candidate.id===id):null;
  return annotation?.review.status==='accepted-scoped'&&annotation.geometry.kind!=='none'?annotation:null;
}
const flush=async()=>{await Promise.resolve();await Promise.resolve();};
function nodes(value:any):Node[]{return Array.isArray(value)?value.flatMap(nodes):value?.props?[value,...nodes(value.props.children)]:[];}
function words(value:any):string{return Array.isArray(value)?value.map(words).join(''):value?.props?words(value.props.children):value==null?'':String(value);}
function harness(comparisonResult:any=null,correctionProjectionRevision:string|null=null,confirmChange=()=>true,checkFactory:((...args:any[])=>any)|null=null,locationFactory:((...args:any[])=>any)|null=null,memoize=false,
  handoffFactory:(...args:any[])=>any=()=>null,contextCurrent:(...args:any[])=>boolean=()=>true,
  bodyHandoffFactory:(...args:any[])=>any=()=>null,bodySelectionGuard:(value:unknown)=>boolean=()=>false,
  nextCandidatesFactory:(...args:any[])=>any[]=()=>[]){
  let maskVisible=true;
  const openCalls:any[]=[],seriesCalls:any[]=[],annotationCalls:any[]=[],wheelCalls:any[]=[],frameCalls:any[]=[];
  const opens:Deferred<any>[]=[],seriesLoads:Deferred<any>[]=[],annotationLoads:Deferred<any>[]=[];
  const module={exports:{} as any};let cursor=0,tree:Node,session:any,outerKey:any,slots:any[]=[],pending=new Map<number,any>(),effects=new Map<number,any>();
  const observers:Array<{measure:()=>void;disconnect:()=>void;disconnected:boolean}>=[];
  const hooks={
    useState(initial:any){const index=cursor++;if(!(index in slots))slots[index]=typeof initial==='function'?initial():initial;return[slots[index],(value:any)=>{slots[index]=typeof value==='function'?value(slots[index]):value;}];},
    useRef(initial:any){const index=cursor++;if(!(index in slots))slots[index]={current:initial};return slots[index];},
    useMemo(fn:()=>any,deps:any[]){const index=cursor++;if(!memoize)return fn();const old=slots[index];if(!old?.memo||!deps||deps.length!==old.deps.length||deps.some((dep,i)=>!Object.is(dep,old.deps[i])))slots[index]={memo:true,deps,value:fn()};return slots[index].value;},
    useLayoutEffect(fn:()=>any,deps:any[]){pending.set(cursor++,{kind:'layout',fn,deps});},
    useEffect(fn:()=>any,deps:any[]){pending.set(cursor++,{kind:'passive',fn,deps});},
  };
  const imports:Record<string,any>={react:hooks,'react/jsx-runtime':{jsx:(type:any,props:any,key:any)=>({type,props,key}),jsxs:(type:any,props:any,key:any)=>({type,props,key})},
    '../lib/slice-wheel.mjs':{bindSliceWheel:(element:any,options:any)=>{wheelCalls.push({element,options});return()=>wheelCalls.push('unbind');}},
    '../lib/regional-mri-package':{
      openLocalRegionalMriPackage:(files:any,pin:any,signal:any)=>{openCalls.push({files,pin,signal});const d=deferred<any>();opens.push(d);return d.promise;},
      loadRegionalMriSeries:(pkg:any,id:any,signal:any)=>{seriesCalls.push({pkg,id,signal});const d=deferred<any>();seriesLoads.push(d);return d.promise;},
      loadRegionalMriAnnotation:(pkg:any,study:any,annotation:any,signal:any,options:any)=>{annotationCalls.push({pkg,study,annotation,signal,options});const d=deferred<any>();annotationLoads.push(d);return d.promise;},
    },
    '../lib/regional-mri-render':{
      regionalMriFrame:(...args:any[])=>{frameCalls.push(args);return{width:2,height:2,displayAspect:2,pixels:new Uint8ClampedArray(16),labels:{left:'R',right:'L',top:'A',bottom:'P'},maskPixels:args[1]&&maskVisible?1:0,markers:maskVisible?[{x:1,y:1}]:[],segments:maskVisible?[[{x:0,y:0},{x:1,y:1}]]:[],sampled:false,oblique:false};},
      regionalMriFocusSlice:(_study:any,loaded:any,plane:string)=>loaded?.syntheticNoFocus?null:loaded?.annotation?.id==='ACL accepted'?(plane==='sagittal'?4:2):1,
    },
    '../lib/regional-mri-3d-comparison':{regionalMri3dComparison:(_source:any,_catalogue:any,_pkg:any,_study:any,overlay:any)=>
      typeof comparisonResult==='function'?comparisonResult(overlay):comparisonResult},
    '../lib/regional-mri-specimen-handoff':{regionalMriSpecimenHandoff:handoffFactory},
    '../lib/regional-mri-body-handoff':{regionalMriBodyHandoff:bodyHandoffFactory},
    '../lib/regional-mri-body-focus':{isCurrentRegionalMriBodySelection:bodySelectionGuard},
    '../lib/regional-mri-guided-study':{regionalMriGuides:syntheticGuides,regionalMriGuideAnnotation:syntheticGuideAnnotation},
    '../lib/regional-mri-structure-check':{createRegionalMriStructureCheck:(...args:any[])=>checkFactory?.(...args)??null,createRegionalMriLocationCheck:(...args:any[])=>locationFactory?.(...args)??null},
    '../lib/regional-mri-practice-next':{regionalMriNextPracticeCandidates:nextCandidatesFactory},
    '../lib/regional-mri-guide-practice-origin':{createRegionalMriGuidePracticeOrigin:()=>null,resolveRegionalMriGuidePracticeOrigin:()=>null},
    '../lib/regional-mri-inline-inspection':{
      regionalMriInlineContextCurrent:contextCurrent,
      regionalMriInlineInspection:(_source:any,_catalogue:any,ownerPkg:any,ownerStudy:any,overlay:any,targetId:string)=>{
        const comparison=typeof comparisonResult==='function'?comparisonResult(overlay):comparisonResult;
        const matches=comparison?.targets.filter((t:any)=>t.id===targetId)??[];
        if(matches.length!==1)return null;
        const target=matches[0];
        return{key:JSON.stringify([ownerPkg.revision,ownerStudy.series.id,overlay.annotation.id,target.id]),target,
          proof:{runtimeRegion:target.kind==='body'?'head-neck':'independent-right-lower-limb',atlasRevision:comparison.atlasRevision,mappingRevision:comparison.mappingRevision,
            modelFamily:target.modelFamily??target.href?.split('specimenPart=')[0],sourceHash:target.sourceHash,
            specimenRevision:target.specimenRevision,side:target.side,relation:target.relation,
            mriRevision:ownerPkg.revision,seriesId:ownerStudy.series.id,imageSha256:ownerStudy.series.image.sha256,
            mriSide:overlay.annotation.laterality,provisional:comparison.provisional}};
      },
      regionalMriInlineFamilyKey:(inspection:any)=>inspection?.target.kind==='specimen'&&inspection.proof?.modelFamily?
        JSON.stringify(inspection.proof):null,
      regionalMriInlineReferenceFamilyKey:(inspection:any)=>inspection?.proof?.modelFamily&&
        (inspection.target.kind==='specimen'||inspection.target.modelFamily?.startsWith('body:'))?
        JSON.stringify(inspection.target.kind==='body'?{...inspection.proof,sourceHash:null}:inspection.proof):null,
      regionalMriInlineCompatible:(a:any,b:any)=>!!a&&!!b&&a.target.kind==='specimen'&&b.target.kind==='specimen'&&
        !!a.proof?.modelFamily&&JSON.stringify(a.proof)===JSON.stringify(b.proof)||
        !!a&&!!b&&a.target.kind==='body'&&b.target.kind==='body'&&a.target.modelFamily?.startsWith('body:')&&
        JSON.stringify({...a.proof,sourceHash:null})===JSON.stringify({...b.proof,sourceHash:null}),
    },
    './RegionalMriInlineInspection':{RegionalMriInlineInspection:'test-inline-inspection'},
    './RegionalMriCorrectionPanel':{RegionalMriCorrectionPanel:'test-correction-panel'},
    './RegionalMriGuidePlayback':{RegionalMriGuidePlayback:'test-playback'},
    './RegionalMriLearning':{RegionalMriLearning:'test-reference-learning'},
    './RegionalMriStructureCheck':{RegionalMriStructureCheck:'test-structure-check'},
    './RegionalMriPracticeFollowup':{RegionalMriPracticeFollowup:'test-practice-followup'},
    '../lib/head-atlas-geometry.mjs':{},'./regional-mri-review.css':{},
  };
  class ResizeObserverStub{
    record={measure:()=>{},disconnect:()=>{this.record.disconnected=true;},disconnected:false};
    constructor(measure:()=>void){this.record.measure=measure;observers.push(this.record);}
    observe(){}disconnect(){this.record.disconnect();}
  }
  new Function('require','module','exports','ResizeObserver','window',code)((id:string)=>{assert(Object.hasOwn(imports,id),id);return imports[id];},module,module.exports,ResizeObserverStub,{confirm:confirmChange});
  function commit(){for(const kind of ['layout','passive'])for(const[index,item]of pending){if(item.kind!==kind)continue;const previous=effects.get(index);if(!previous||!item.deps||item.deps.some((dep:any,i:number)=>!Object.is(dep,previous.deps[i]))){previous?.cleanup?.();const cleanup=item.fn();effects.set(index,{...item,cleanup});}}}
  function render(pin:any=sourcePin,shouldCommit=true){pending=new Map();cursor=0;const outer=module.exports.RegionalMriReviewViewer({source:pin,comparisons:comparisonResult?.learning?comparisonResult:null,correctionProjectionRevision});outerKey=outer.key;
    if(outer.type===module.exports.RegionalMriReviewViewer||typeof outer.type!=='function'){if(shouldCommit)tree=outer;return outer;}
    session=outer.type;const rendered=session(outer.props);
    if(shouldCommit){tree=rendered;const area=nodes(tree).find(n=>n.type==='div'&&String(n.props.className).includes('__viewport'));
      if(area&&!area.props.ref.current)area.props.ref.current={clientWidth:400,clientHeight:400};
      const raster=nodes(tree).find(n=>n.type==='canvas');if(raster&&!raster.props.ref.current)raster.props.ref.current={getContext:()=>({createImageData:(w:number,h:number)=>({data:new Uint8ClampedArray(w*h*4)}),putImageData(){},beginPath(){},moveTo(){},lineTo(){},stroke(){},arc(){},fill(){}})};
      commit();}
    return rendered;}
  function find(type:string,predicate:(node:Node)=>boolean=()=>true){const item=nodes(tree).find(node=>node.type===type&&predicate(node));assert(item,`missing ${type}`);return item;}
  function select(id:string){find('select').props.onChange({currentTarget:{value:id}});}
  function folder(){find('input',node=>node.props.type==='file').props.onChange({currentTarget:{files:[{name:'manifest.json'}]}});}
  function button(name:string){return find('button',node=>words(node)===name);}
  function annotation(name:string){return find('button',node=>words(node).includes(name));}
  function cleanup(){for(const item of effects.values())item.cleanup?.();effects.clear();}
  function replay(){for(const item of effects.values())item.cleanup?.();for(const kind of ['layout','passive'])for(const item of effects.values())if(item.kind===kind)item.cleanup=item.fn();}
  return{render,find,folder,select,button,annotation,cleanup,replay,opens,seriesLoads,annotationLoads,openCalls,seriesCalls,annotationCalls,wheelCalls,frameCalls,observers,tree:()=>tree,outerKey:()=>outerKey,setMaskVisible:(value:boolean)=>{maskVisible=value;}};
}
async function loadedGuide(h:ReturnType<typeof harness>,ownerPkg:any=guidedPkg,ownerSeries:any=guidedSeries){
 h.render();h.folder();h.opens[0].resolve(ownerPkg);await flush();h.render();h.select('s1');
 h.seriesLoads[0].resolve(study(ownerSeries));await flush();h.render();
}

test('missing or malformed trusted source never exposes local loading',()=>{
  const h=harness();for(const invalid of [null,{...sourcePin,revision:'bad'},{...sourcePin,revision:new String(revision)},{...sourcePin,region:''}]){
    h.render(invalid);assert.match(words(h.tree()),/loading is disabled/);assert.equal(nodes(h.tree()).filter(n=>n.type==='input').length,0);
  }
});

test('exact independent pin and region gate precede explicit sequence choice',async()=>{
  const h=harness();h.render();h.folder();assert.equal(h.openCalls[0].pin,revision);
  h.opens[0].resolve({...pkg,manifest:{...pkg.manifest,region:'shoulder'}});await flush();h.render();assert.match(words(h.tree()),/differs from the bound source/);
  h.folder();h.opens[1].resolve(pkg);await flush();h.render();assert.equal(h.seriesCalls.length,0);
  assert.match(words(h.tree()),/Choose a sequence/);h.select('s1');assert.equal(h.seriesCalls[0].id,'s1');
});

test('old package and sequence completions cannot replace a newer selection',async()=>{
  const h=harness();h.render();h.folder();h.render();h.folder();assert(h.openCalls[0].signal.aborted);
  h.opens[1].resolve(pkg);await flush();h.render();h.opens[0].resolve(pkg);await flush();h.render();h.select('s1');h.render();h.select('s2');
  assert(h.seriesCalls[0].signal.aborted);h.seriesLoads[1].resolve(study(s2));await flush();h.render();h.seriesLoads[0].resolve(study(s1));await flush();h.render();
  assert.match(words(h.tree()),/Sagittal PD/);assert.equal(h.find('select').props.value,'s2');assert.equal(h.frameCalls.at(-1)?.[0].series,s2);
  h.button('Close and reset').props.onClick();h.render();assert.equal(h.find('input',n=>n.props.type==='file').props.type,'file');assert.equal(nodes(h.tree()).filter(n=>n.type==='select').length,0);
});

test('empty and unknown sequence choices clear busy display without falling back',async()=>{
  const h=harness();h.render();h.folder();h.opens[0].resolve(pkg);await flush();h.render();h.select('s1');h.render();
  assert.match(words(h.tree()),/Verifying Axial T2/);
  h.select('');assert(h.seriesCalls[0].signal.aborted);h.render();
  assert.equal(h.find('select').props.value,'');assert.doesNotMatch(words(h.tree()),/Verifying|Native axial slice/);
  h.seriesLoads[0].resolve(study(s1));await flush();h.render();assert.equal(nodes(h.tree()).filter(n=>n.type==='canvas').length,0);
  h.select('unknown');h.render();assert.equal(h.find('select').props.value,'unknown');assert.doesNotMatch(words(h.tree()),/Verifying/);
  assert.equal(h.seriesCalls.length,1,'no fallback source sequence loads');
});

test('provisional withheld by default; explicit inspection option and selection retirement',async()=>{
  const h=harness();h.render();h.folder();h.opens[0].resolve(pkg);await flush();h.render();h.select('s1');h.seriesLoads[0].resolve(study(s1));await flush();h.render();
  assert.equal(h.annotation('Ligament provisional').props.disabled,true);assert.equal(h.annotation('Deferred anatomy').props.disabled,true);
  h.annotation('Meniscus').props.onClick();h.render();assert.equal(h.annotationCalls[0].options,undefined);
  const inspectLabel=h.find('label',n=>words(n).includes('Inspect provisional geometry'));
  const inspect=nodes(inspectLabel).find(n=>n.type==='input'&&n.props.type==='checkbox');assert(inspect);
  inspect.props.onChange({currentTarget:{checked:true}});h.render();assert(h.annotationCalls[0].signal.aborted);
  h.annotation('Ligament provisional').props.onClick();assert.deepEqual(h.annotationCalls[1].options,{inspectProvisional:true});
  h.annotationLoads[1].resolve({annotation:provisional,purpose:'provisional-inspection'});await flush();h.render();
  assert.match(words(h.tree()),/INSPECTION ONLY/);assert.equal(h.frameCalls.at(-1)?.[1]?.annotation,provisional);
  h.annotationLoads[0].resolve({annotation:accepted,purpose:'scoped-display'});await flush();h.render();assert.equal(h.frameCalls.at(-1)?.[1]?.annotation,provisional);
  h.cleanup();
});

test('native controls, wheel binding, canvas pixels and source-scope limits',async()=>{
  const h=harness();h.render();h.folder();h.opens[0].resolve(pkg);await flush();h.render();h.select('s1');h.seriesLoads[0].resolve(study(s1));await flush();h.render();
  assert.match(words(h.tree()),/Only the acquired source sequence|Source-scoped structures/);
  const next=h.button('+');next.props.onClick();h.render();assert.equal(h.find('input',n=>n.props.type==='range'&&n.props['aria-label']==='Native slice').props.value,2);
  const viewport=h.find('div',n=>String(n.props.className).includes('__viewport'));let prevented=false;
  viewport.props.onKeyDown({key:'ArrowLeft',preventDefault(){prevented=true;},stopPropagation(){}});h.render();assert(prevented);
  const canvas=h.find('canvas');assert.equal(canvas.props.style.aspectRatio,'2');
  const draws:any[]=[];canvas.props.ref.current={width:0,height:0,getContext:()=>({createImageData:()=>({data:new Uint8ClampedArray(16)}),putImageData:()=>draws.push('pixels'),beginPath:()=>{},moveTo:()=>{},lineTo:()=>{},stroke:()=>draws.push('line'),arc:()=>{},fill:()=>draws.push('marker')})};
  h.render();assert.deepEqual(draws,['pixels','line','marker']);assert.match(words(h.tree()),/no cross-sequence overlay or patient-space registration/);
  assert(h.wheelCalls.some(call=>call.options?.sliceCount===3));h.cleanup();
});

test('source key changes and close or unmount retire pending annotation loads',async()=>{
  const h=harness();h.render();h.folder();h.opens[0].resolve(pkg);await flush();h.render();h.select('s1');h.seriesLoads[0].resolve(study(s1));await flush();h.render();
  const oldSelection=h.annotation('Meniscus').props.onClick;
  h.annotation('Meniscus').props.onClick();assert.equal(h.annotationCalls[0].signal.aborted,false);h.render();
  h.button('Close and reset').props.onClick();assert.equal(h.annotationCalls[0].signal.aborted,true);
  oldSelection();assert.equal(h.annotationCalls.length,1,'retired selection cannot reopen a closed package');
  h.render();assert.equal(h.frameCalls.at(-1)?.[1],null);
  const first=harness();first.render();const firstKey=first.outerKey();
  const changed=harness();changed.render({...sourcePin,revision:'f'.repeat(64)});const changedKey=changed.outerKey();
  assert.notEqual(firstKey,changedKey,'React remounts a session on bound-source revision change');
  h.cleanup();oldSelection();assert.equal(h.annotationCalls.length,1,'unmounted callback cannot reopen local data');
});

test('retired display controls cannot mutate a later selection; live wheel follows committed slice',async()=>{
  const h=harness();h.render();h.folder();h.opens[0].resolve(pkg);await flush();h.render();h.select('s1');h.seriesLoads[0].resolve(study(s1));await flush();h.render();
  const oldNext=h.button('+').props.onClick;
  const oldPlane=h.find('button',n=>words(n)==='sagittal').props.onClick;
  const oldKey=h.find('div',n=>String(n.props.className).includes('__viewport')).props.onKeyDown;
  const oldSearch=h.find('input',n=>n.props.type==='search').props.onChange;
  const oldLevel=h.find('input',n=>n.props.type==='number'&&n.props.step==='any').props.onChange;
  const oldOpacity=h.find('input',n=>n.props.type==='range'&&n.props['aria-label']!=='Native slice').props.onChange;
  const oldVisibility=h.find('label',n=>words(n).includes('Show selected geometry'));
  const oldCheckbox=nodes(oldVisibility).find(n=>n.type==='input')!.props.onChange;
  const wheel=h.wheelCalls.find(call=>call.options?.sliceCount===3).options;
  h.annotation('Meniscus').props.onClick();
  oldNext();oldPlane();oldKey({key:'End',preventDefault(){},stopPropagation(){}});
  oldSearch({currentTarget:{value:'nothing'}});oldLevel({currentTarget:{value:'900'}});
  oldOpacity({currentTarget:{value:'0'}});oldCheckbox({currentTarget:{checked:false}});wheel.onSlice(2);
  h.render();
  assert.equal(h.find('input',n=>n.props['aria-label']==='Native slice').props.value,1);
  assert.equal(h.find('input',n=>n.props.type==='search').props.value,'');
  assert.equal(h.find('input',n=>n.props.type==='number'&&n.props.step==='any').props.value,50);
  assert.equal(h.find('button',n=>words(n)==='axial').props['aria-pressed'],true);
  assert.equal(h.frameCalls.at(-1)?.[1],null,'stale visibility cannot change the active frame');
  wheel.onSlice(2);h.render();assert.equal(h.find('input',n=>n.props['aria-label']==='Native slice').props.value,2,'wheel remains live after the committed selection rerender');
  h.button('−').props.onClick();h.render();assert.equal(wheel.getSlice(),1,'wheel reads committed slice, not a stale render closure');
});

test('abandoned render cannot change committed wheel state or activate speculative controls',async()=>{
  const h=harness();h.render();h.folder();h.opens[0].resolve(pkg);await flush();h.render();h.select('s1');h.seriesLoads[0].resolve(study(s1));await flush();h.render();
  const wheel=h.wheelCalls.find(call=>call.options?.sliceCount===3).options;
  const current=h.button('+').props.onClick;
  const speculative=h.render(sourcePin,false);
  const speculativePlus=nodes(speculative).find(n=>n.type==='button'&&words(n)==='+');assert(speculativePlus);
  speculativePlus.props.onClick();assert.equal(wheel.getSlice(),1);
  current();h.render();assert.equal(wheel.getSlice(),2);
});

test('StrictMode effect replay keeps controls usable while aborting old loads',async()=>{
  const h=harness();h.render();h.replay();h.folder();assert.equal(h.openCalls.length,1);
  h.replay();assert(h.openCalls[0].signal.aborted);h.opens[0].resolve(pkg);await flush();h.render();
  assert.equal(nodes(h.tree()).filter(n=>n.type==='select').length,0,'aborted load stays retired');
  h.folder();h.opens[1].resolve(pkg);await flush();h.render();h.select('s1');assert.equal(h.seriesCalls.length,1);
});

test('canvas uses explicit physical size and responds to measured viewport resize',async()=>{
  const h=harness();h.render();h.folder();h.opens[0].resolve(pkg);await flush();h.render();h.select('s1');h.seriesLoads[0].resolve(study(s1));await flush();h.render();h.render();
  let canvas=h.find('canvas');let cssWidth=parseFloat(canvas.props.style.width),cssHeight=parseFloat(canvas.props.style.height);
  assert.equal(cssWidth/cssHeight,2);assert.equal(cssWidth,344);assert.equal(cssHeight,172);
  const area=h.find('div',n=>String(n.props.className).includes('__viewport')).props.ref.current;
  area.clientWidth=260;area.clientHeight=360;h.observers.at(-1)!.measure();h.render();
  canvas=h.find('canvas');cssWidth=parseFloat(canvas.props.style.width);cssHeight=parseFloat(canvas.props.style.height);
  assert.equal(cssWidth,204);assert.equal(cssHeight,102);assert.equal(cssWidth/cssHeight,2);
  h.cleanup();assert(h.observers.at(-1)?.disconnected);
});

const comparisonFixture={atlasRevision:'1'.repeat(40),mappingRevision:'2'.repeat(64),provisional:false,targets:[
 {id:'body-ref',kind:'body',label:'Left femur',side:'left',oppositeSide:false,relation:'parent-reference',href:'/atlas/3d?synthetic=1'},
 {id:'group-ref',kind:'specimen',label:'Knee meniscus (source group)',side:'right',oppositeSide:true,relation:'group-reference',href:'/atlas/lower-limb-3d?synthetic=1'},
]};
async function loadedComparison(h:ReturnType<typeof harness>){
 h.render();h.folder();h.opens[0].resolve(pkg);await flush();h.render();h.select('s1');h.seriesLoads[0].resolve(study(s1));await flush();h.render();
 h.annotation('Meniscus').props.onClick();h.render();
}
test('reference links wait for verified overlay and stay collapsed with side and scope warnings',async()=>{
 const h=harness(comparisonFixture);await loadedComparison(h);
 assert.equal(nodes(h.tree()).filter(n=>n.type==='details').length,0,'No comparison while annotation loading');
 h.annotationLoads[0].resolve({annotation:accepted,purpose:'scoped-display'});await flush();h.render();
 const details=h.find('details');assert.equal(details.props.open,undefined);
 assert.match(words(details),/Same-side body reference · left side/);assert.match(words(details),/opposite side to this MRI; not mirrored/);
 assert.match(words(details),/Whole parent structure only/);assert.match(words(details),/Grouped surface only/);
 assert.match(words(details),/not spatially registered/);assert.match(words(details),/No scan, mask, coordinate or MRI identifier/);
 for(const a of nodes(details).filter(n=>n.type==='a')){assert.equal(a.props.target,'_blank');assert.equal(a.props.rel,'noopener noreferrer');}
 h.cleanup();
});
test('missing current mapping explains refusal without a nearby substitute or hidden link',async()=>{
 const h=harness();await loadedComparison(h);h.annotationLoads[0].resolve({annotation:accepted,purpose:'scoped-display'});await flush();h.render();
 const details=h.find('details');assert.match(words(details),/No current source-bound 3D reference/);assert.match(words(details),/No nearby structure is substituted/);
 assert.equal(nodes(details).filter(n=>n.type==='a').length,0);h.cleanup();
});
test('provisional reference badge remains inspection-only and retired link cannot navigate',async()=>{
 const h=harness({...comparisonFixture,provisional:true});await loadedComparison(h);
 h.annotationLoads[0].resolve({annotation:accepted,purpose:'scoped-display'});await flush();h.render();
 assert.match(words(h.find('details')),/Provisional MRI source · private reference inspection only/);
 const anchor=h.find('a');let prevented=false;anchor.props.onClick({preventDefault(){prevented=true;}});assert.equal(prevented,false);
 h.button('Close and reset').props.onClick();anchor.props.onClick({preventDefault(){prevented=true;}});assert.equal(prevented,true);
 h.render();assert.equal(nodes(h.tree()).filter(n=>n.type==='details').length,0);h.cleanup();
});

test('inline reference preserves MRI slice controls and closes without discarding the loaded source',async()=>{
 const h=harness(comparisonFixture);await loadedComparison(h);h.annotationLoads[0].resolve({annotation:accepted,purpose:'scoped-display'});await flush();h.render();
 const launch=h.button('Inspect Left femur beside MRI');let focuses=0;
  launch.props.onClick({currentTarget:{isConnected:true,focus(options:any){assert.equal(options.preventScroll,true);focuses++;}}});h.render();
 let panel=h.find('test-inline-inspection');assert.equal(panel.props.inspection.target.id,'body-ref');
 assert.match(h.find('div',n=>String(n.props.className).includes('__layout')).props.className,/--comparing/);
 h.button('+').props.onClick();h.render();panel=h.find('test-inline-inspection');
 assert.equal(h.find('input',n=>n.props['aria-label']==='Native slice').props.value,2);assert.equal(h.openCalls.length,1);assert.equal(h.seriesCalls.length,1);
 panel.props.onClose();h.render();assert.equal(nodes(h.tree()).filter(n=>n.type==='test-inline-inspection').length,0);assert.equal(focuses,1);
 assert.equal(h.find('select').props.value,'s1');assert.equal(h.find('input',n=>n.props['aria-label']==='Native slice').props.value,2);h.cleanup();
});
test('new MRI annotation or source sequence retires inline inspection and old launch/close controls',async()=>{
 const h=harness(comparisonFixture);await loadedComparison(h);h.annotationLoads[0].resolve({annotation:accepted,purpose:'scoped-display'});await flush();h.render();
 const launch=h.button('Inspect Left femur beside MRI').props.onClick;launch({currentTarget:{focus(){}}});h.render();
 const close=h.find('test-inline-inspection').props.onClose;
 h.annotation('Meniscus').props.onClick();launch({currentTarget:{focus(){throw Error('retired focus');}}});close();h.render();
 assert.equal(nodes(h.tree()).filter(n=>n.type==='test-inline-inspection').length,0,'Pending overlay never keeps previous model');
 h.annotationLoads[1].resolve({annotation:accepted,purpose:'scoped-display'});await flush();h.render();
 h.button('Inspect Knee meniscus (source group) beside MRI').props.onClick({currentTarget:{focus(){}}});h.render();
 assert.equal(h.find('test-inline-inspection').props.inspection.target.side,'right');h.select('s2');h.render();
 assert.equal(nodes(h.tree()).filter(n=>n.type==='test-inline-inspection').length,0);h.cleanup();
});

test('correction disclosure is available only after verified overlay and independent projection',async()=>{
 const h=harness(null,'b'.repeat(64));await loadedComparison(h);
 assert.equal(nodes(h.tree()).filter(n=>n.type==='test-correction-panel').length,0);
 h.annotationLoads[0].resolve({annotation:accepted,purpose:'scoped-display'});await flush();h.render();
 const panel=h.find('test-correction-panel');assert.equal(panel.props.sourceRevision,revision);assert.equal(panel.props.projectionRevision,'b'.repeat(64));
 assert.equal(panel.props.sequenceId,'s1');assert.equal(panel.props.annotationId,'a1');h.cleanup();
 const invalid=harness(null,'not-a-pin');await loadedComparison(invalid);invalid.annotationLoads[0].resolve({annotation:accepted,purpose:'scoped-display'});await flush();invalid.render();
 assert.equal(nodes(invalid.tree()).filter(n=>n.type==='test-correction-panel').length,0);invalid.cleanup();
});

test('unsaved corrections guard source changes and rejected discard leaves MRI and draft mounted',async()=>{
 let confirmed=false,prompts=0;const h=harness(null,'b'.repeat(64),()=>{prompts++;return confirmed;});await loadedComparison(h);
 h.annotationLoads[0].resolve({annotation:accepted,purpose:'scoped-display'});await flush();h.render();
 const old=h.find('test-correction-panel').props.onDirtyChange;old(true);
 h.select('s2');h.button('Close and reset').props.onClick();h.folder();h.annotation('Meniscus').props.onClick();h.render();
 assert.equal(prompts,4);assert.equal(h.seriesCalls.length,1);assert.equal(h.openCalls.length,1);assert.equal(h.annotationCalls.length,1);
 assert.equal(h.find('test-correction-panel').props.annotationId,'a1');assert.equal(h.find('select').props.value,'s1');
 confirmed=true;h.select('s2');old(true);h.render();assert.equal(prompts,5);assert.equal(nodes(h.tree()).filter(n=>n.type==='test-correction-panel').length,0);
 h.button('Close and reset').props.onClick();h.render();assert.equal(prompts,5,'retired dirty callback cannot contaminate the next selection');h.cleanup();
});

test('uncommitted correction callbacks cannot introduce a dirty state',async()=>{
 let prompts=0;const h=harness(null,'b'.repeat(64),()=>{prompts++;return false;});await loadedComparison(h);
 h.annotationLoads[0].resolve({annotation:accepted,purpose:'scoped-display'});await flush();h.render();
 const speculative=h.render(sourcePin,false),panel=nodes(speculative).find(n=>n.type==='test-correction-panel');assert(panel);panel.props.onDirtyChange(true);
 h.button('Close and reset').props.onClick();h.render();assert.equal(prompts,0);assert.equal(nodes(h.tree()).filter(n=>n.type==='test-correction-panel').length,0);h.cleanup();
});

test('soft source refresh retains dirty draft owner read-only until explicit discard',async()=>{
 const h=harness(null,'b'.repeat(64));await loadedComparison(h);h.annotationLoads[0].resolve({annotation:accepted,purpose:'scoped-display'});await flush();h.render();
 const original=h.outerKey();h.find('test-correction-panel').props.onDirtyChange(true);h.render();
 const replacement={...sourcePin,revision:'2'.repeat(64),label:'Replacement source'};h.render(replacement);
 assert.equal(h.outerKey(),original);assert.equal(h.find('test-correction-panel').props.sourceRevision,revision);assert.equal(h.find('test-correction-panel').props.sourceRetired,true);
 assert.match(words(h.tree()),/previous source and unsaved correction are retained read-only/);
 const calls=h.seriesCalls.length;h.select('s2');h.render(replacement);assert.equal(h.seriesCalls.length,calls,'retired source cannot load another sequence');
 const speculative=h.render({...replacement,revision:'3'.repeat(64)},false),button=nodes(speculative).find(n=>n.type==='button'&&words(n)==='Discard retained edits and open current source');assert(button);
 button.props.onClick();h.render(replacement);assert.equal(h.outerKey(),original,'uncommitted discard callback is inert');
 h.button('Discard retained edits and open current source').props.onClick();h.render(replacement);assert.notEqual(h.outerKey(),original);h.cleanup();
});

test('guided paths stay collapsed, use fixed source slots and never borrow a candidate from another sequence',async()=>{
 const h=harness();await loadedGuide(h);
 const disclosure=h.find('details',node=>words(node).includes('Guided learning'));
 assert.equal(disclosure.props.open,undefined);
 h.button('Cruciate ligaments').props.onClick();h.render();
 assert.match(words(h.tree()),/Anterior cruciate ligament/);
 assert.equal(h.annotationCalls.length,1,'sole accepted candidate loads after explicit path choice');
 assert.equal(h.annotationCalls[0].annotation.id,'ACL accepted');
 h.annotationLoads[0].resolve({annotation:guidedSeries.annotations[0],purpose:'scoped-display',focus:[1,2,3]});await flush();h.render();
 assert.equal(h.frameCalls.at(-1)?.[1]?.annotation.id,'ACL accepted');
 assert.equal(h.find('input',node=>node.props['aria-label']==='Native slice').props.value,2,'verified guide geometry moves native focus');
 assert(h.button('Show this step’s 3D reference options'));
 h.button('Next step').props.onClick();h.render();
 assert.match(words(h.tree()),/Posterior cruciate ligament/);
 assert.equal(h.frameCalls.at(-1)?.[1],null,'unavailable next slot clears old geometry');
 assert.equal(h.annotationCalls.length,1,'provisional and other-sequence PCL are withheld');
 assert.doesNotMatch(words(h.tree()),/Inspect PCL other sequence in this sequence/);
 assert.equal(h.button('Inspect PCL provisional in this sequence').props.disabled,true);
 assert.equal(nodes(h.tree()).filter(n=>n.type==='button'&&words(n)==='Show this step’s 3D reference options').length,0);
 h.button('Collateral ligaments').props.onClick();h.render();
 assert.match(words(h.tree()),/Medial collateral ligament/);
 assert.equal(h.annotationCalls.length,1,'duplicate slot requires an explicit choice');
 h.button('Inspect MCL second in this sequence').props.onClick();
 assert.equal(h.annotationCalls.at(-1).annotation.id,'MCL second');
 h.render();assert.equal(h.button('Next step').props.disabled,true,'pending verification blocks step navigation');
 h.annotationLoads.at(-1)!.resolve({annotation:guidedSeries.annotations[3],purpose:'scoped-display'});await flush();h.render();
 h.button('Next step').props.onClick();h.render();
 assert.equal(h.frameCalls.at(-1)?.[1],null);
 assert.doesNotMatch(words(h.tree()),/Inspect LCL other sequence in this sequence/);
 assert.equal(h.button('Inspect LCL deferred in this sequence').props.disabled,true);
 assert.equal(h.annotationCalls.length,2);h.cleanup();
});

test('manual annotation selection and sequence changes retire the guide and its pending load',async()=>{
 const h=harness();await loadedGuide(h);
 h.button('Cruciate ligaments').props.onClick();h.render();
 const stale=h.annotationLoads[0];
 h.select('s2');h.render();
 assert.equal(h.annotationCalls[0].signal.aborted,true);
 stale.resolve({annotation:guidedSeries.annotations[0],purpose:'scoped-display'});await flush();h.render();
 assert.notEqual(h.frameCalls.at(-1)?.[1]?.annotation.id,'ACL accepted');
 h.seriesLoads[1].resolve(study(guidedOtherSeries));await flush();h.render();
 assert.equal(h.find('select').props.value,'s2');assert.equal(h.frameCalls.at(-1)?.[1],null);
 assert.doesNotMatch(words(h.tree()),/Inspect ACL accepted in this sequence/);
 h.button('Cruciate ligaments').props.onClick();h.render();
 assert.match(words(h.tree()),/Anterior cruciate ligament/);
 assert.equal(h.annotationCalls.length,1,'missing slot in new sequence does not load');h.cleanup();
});

test('dirty correction refusal preserves guided step, source and geometry until discard is accepted',async()=>{
 let allow=false,prompts=0;const h=harness(null,'b'.repeat(64),()=>{prompts++;return allow;});await loadedGuide(h);
 h.button('Cruciate ligaments').props.onClick();h.render();
 h.annotationLoads[0].resolve({annotation:guidedSeries.annotations[0],purpose:'scoped-display'});await flush();h.render();
 h.find('test-correction-panel').props.onDirtyChange(true);h.render();
 h.button('Next step').props.onClick();h.render();
 assert.equal(prompts,1);assert.match(words(h.tree()),/Anterior cruciate ligament/);
 assert.equal(h.frameCalls.at(-1)?.[1]?.annotation.id,'ACL accepted');
 assert.equal(h.find('select').props.value,'s1');
 allow=true;h.button('Next step').props.onClick();h.render();
 assert.equal(prompts,2);assert.match(words(h.tree()),/Posterior cruciate ligament/);
 assert.equal(h.frameCalls.at(-1)?.[1],null);h.cleanup();
});

test('leaving a pending guide and choosing a manual annotation retire guided state',async()=>{
 const h=harness();await loadedGuide(h);h.button('Cruciate ligaments').props.onClick();h.render();
 const pending=h.annotationLoads[0];h.button('Leave guide').props.onClick();h.render();
 assert.equal(h.annotationCalls[0].signal.aborted,true);
 assert.equal(nodes(h.tree()).filter(node=>node.type==='section'&&node.props['aria-label']==='Current guided inspection step').length,0);
 pending.resolve({annotation:guidedSeries.annotations[0],purpose:'scoped-display'});await flush();h.render();
 assert.equal(h.frameCalls.at(-1)?.[1],null);
 h.button('Collateral ligaments').props.onClick();h.render();
 assert.match(words(h.tree()),/Medial collateral ligament/);
 h.find('button',node=>nodes(node).some(child=>child.type==='span'&&words(child)==='MCL first')).props.onClick();h.render();
 assert.equal(nodes(h.tree()).filter(node=>node.type==='section'&&node.props['aria-label']==='Current guided inspection step').length,0);
 assert.equal(h.annotationCalls.at(-1).annotation.id,'MCL first');h.cleanup();
});

test('guided focus uses the committed current plane after an in-flight plane switch',async()=>{
 const h=harness();await loadedGuide(h);h.button('Cruciate ligaments').props.onClick();h.render();
 h.button('sagittal').props.onClick();h.render();
 h.annotationLoads[0].resolve({annotation:guidedSeries.annotations[0],purpose:'scoped-display'});await flush();h.render();
 assert.equal(h.frameCalls.at(-1)?.[2],'sagittal');assert.equal(h.frameCalls.at(-1)?.[3],4);
 assert.equal(h.find('input',node=>node.props['aria-label']==='Native slice').props.value,4);
 assert.doesNotMatch(words(h.tree()),/Invalid native view/);h.cleanup();
});

test('post-load guided plane switches retain the exact saved focus in every native plane',async()=>{
 const h=harness();await loadedGuide(h);h.button('Cruciate ligaments').props.onClick();h.render();
 h.annotationLoads[0].resolve({annotation:guidedSeries.annotations[0],purpose:'scoped-display'});await flush();h.render();
 const slice=()=>h.find('input',node=>node.props['aria-label']==='Native slice').props.value;
 assert.equal(slice(),2,'the accepted ACL starts at its axial saved focus');
 for(const [plane,focus] of [['coronal',2],['sagittal',4],['axial',2]] as const){
  h.button(plane).props.onClick();h.render();
  assert.equal(h.frameCalls.at(-1)?.[2],plane);
  assert.equal(h.frameCalls.at(-1)?.[1]?.annotation.id,'ACL accepted');
  assert.equal(slice(),focus,`${plane} must use the accepted annotation focus after the plane changes`);
 }
 h.cleanup();
});

test('reselecting the active native plane preserves a manually chosen slice',async()=>{
 const h=harness();await loadedGuide(h);h.button('Cruciate ligaments').props.onClick();h.render();
 h.annotationLoads[0].resolve({annotation:guidedSeries.annotations[0],purpose:'scoped-display'});await flush();h.render();
 const slider=h.find('input',node=>node.props['aria-label']==='Native slice');
 slider.props.onChange({currentTarget:{value:'0'}});h.render();
 assert.equal(h.find('input',node=>node.props['aria-label']==='Native slice').props.value,0);
 h.button('axial').props.onClick();h.render();
 assert.equal(h.find('input',node=>node.props['aria-label']==='Native slice').props.value,0,
  'the selected plane is unchanged, so keep the learner’s deliberate slice');
 h.cleanup();
});

test('ordinary accepted selection uses the plane midpoint even if the same geometry has a guided focus',async()=>{
 const h=harness();await loadedGuide(h);h.annotation('ACL accepted').props.onClick();h.render();
 h.annotationLoads[0].resolve({annotation:guidedSeries.annotations[0],purpose:'scoped-display'});await flush();h.render();
 assert.equal(nodes(h.tree()).filter(node=>node.type==='section'&&node.props['aria-label']==='Current guided inspection step').length,0);
 h.button('sagittal').props.onClick();h.render();
 assert.equal(h.frameCalls.at(-1)?.[1]?.annotation.id,'ACL accepted');
 assert.equal(h.find('input',node=>node.props['aria-label']==='Native slice').props.value,2,
  'ordinary browsing does not inherit the guided answer location at slice 4');
 h.cleanup();
});

test('retired plane controls cannot move a different source sequence',async()=>{
 const h=harness();await loadedGuide(h);h.button('Cruciate ligaments').props.onClick();h.render();
 h.annotationLoads[0].resolve({annotation:guidedSeries.annotations[0],purpose:'scoped-display'});await flush();h.render();
 const oldPlane=h.button('sagittal').props.onClick;
 h.select('s2');h.render();oldPlane();h.render();
 assert.equal(nodes(h.tree()).filter(node=>node.type==='button'&&words(node)==='sagittal').length,0,
  'native plane controls are absent while the new sequence verifies');
 h.seriesLoads[1].resolve(study(guidedOtherSeries));await flush();h.render();
 oldPlane();h.render();assert.equal(h.find('button',node=>words(node)==='axial').props['aria-pressed'],true);
 h.cleanup();
});

test('a pending or absent guided annotation cannot supply a plane focus; source consent survives plane changes',async()=>{
 let prompts=0;const h=harness(null,'b'.repeat(64),()=>{prompts++;return false;});await loadedGuide(h);
 const slice=()=>h.find('input',node=>node.props['aria-label']==='Native slice').props.value;
 h.button('sagittal').props.onClick();h.render();
 assert.equal(slice(),2,'without a selected annotation the sagittal midpoint remains the default');
 h.button('Cruciate ligaments').props.onClick();h.render();
 assert.equal(h.frameCalls.at(-1)?.[1],null,'pending geometry is not reused');
 h.button('axial').props.onClick();h.render();assert.equal(slice(),1,'pending geometry keeps the axial midpoint');
 h.annotationLoads[0].resolve({annotation:guidedSeries.annotations[0],purpose:'scoped-display'});await flush();h.render();
 assert.equal(slice(),2,'verified geometry may then supply the axial focus');
 h.find('test-correction-panel').props.onDirtyChange(true);h.render();
 h.button('sagittal').props.onClick();h.render();
 assert.equal(prompts,0,'a plane change does not discard the correction or request source-change consent');
 assert.equal(h.find('test-correction-panel').props.annotationId,'ACL accepted');
 h.button('Next step').props.onClick();h.render();
 assert.equal(prompts,1,'the unsaved correction still guards the next source selection');
 assert.equal(h.frameCalls.at(-1)?.[1]?.annotation.id,'ACL accepted');
 h.cleanup();
});

test('guided 3D options expose the existing disclosure only after exact geometry and retire with an unavailable step',async()=>{
 const h=harness(comparisonFixture);await loadedGuide(h);h.button('Cruciate ligaments').props.onClick();h.render();
 h.annotationLoads[0].resolve({annotation:guidedSeries.annotations[0],purpose:'scoped-display'});await flush();h.render();
 let focused=0;const options=h.find('details',node=>words(node).startsWith('Compare in 3D'));
 const element={open:false,querySelector:(selector:string)=>{assert.equal(selector,'summary');return{focus(){focused++;}};}};
 options.props.ref.current=element;
 const open=h.button('Show this step’s 3D reference options').props.onClick;open();
 assert.equal(element.open,true);assert.equal(focused,1);
 h.button('Inspect Left femur beside MRI').props.onClick({currentTarget:{focus(){}}});h.render();
 assert.equal(h.find('test-inline-inspection').props.inspection.target.id,'body-ref');
 h.button('Next step').props.onClick();h.render();open();
 assert.equal(focused,1,'retired option callback is inert');
 assert.equal(nodes(h.tree()).filter(node=>node.type==='test-inline-inspection').length,0);
 assert.equal(h.frameCalls.at(-1)?.[1],null);h.cleanup();
});

// These public, synthetic targets carry distinct reference identities. The
// comparison mock can only retain a specimen when its entire family proof matches.
const retainedPcl=guideCandidate('PCL accepted',guideAnatomy[1]);
const retainedSeries={...guidedSeries,annotations:[guidedSeries.annotations[0],retainedPcl,...guidedSeries.annotations.slice(2)]};
const retainedPkg={...guidedPkg,syntheticGuideFixture:true,manifest:{...guidedPkg.manifest,series:[retainedSeries,guidedOtherSeries]}};
const specimen=(id:string,part:string,changes:Record<string,any>={})=>({
  id,kind:'specimen',label:id,side:'right',oppositeSide:true,relation:'group-reference',
  href:`/atlas/lower-limb-3d?synthetic=1&specimenPart=${part}`,
  modelFamily:'/atlas-runtime/lower-limb/index.html?synthetic=1',sourceHash:'3'.repeat(64),specimenRevision:'4'.repeat(64),...changes,
});
const parentSpecimen=specimen('ACL parent specimen','acl');
const childSpecimen=specimen('PCL child specimen','pcl');
function retainedComparison(overlay:any){
  return{atlasRevision:'1'.repeat(40),mappingRevision:'2'.repeat(64),provisional:false,
    targets:overlay.annotation.id==='ACL accepted'?[parentSpecimen]:overlay.annotation.id==='PCL accepted'?[childSpecimen]:[]};
}
async function loadedSpecimenParent(h:ReturnType<typeof harness>){
  await loadedGuide(h,retainedPkg,retainedSeries);
  h.button('Cruciate ligaments').props.onClick();h.render();
  h.annotationLoads[0].resolve({annotation:retainedSeries.annotations[0],purpose:'scoped-display'});await flush();h.render();
  h.button('Inspect ACL parent specimen beside MRI').props.onClick({currentTarget:{focus(){}}});h.render();
  const panel=h.find('test-inline-inspection');assert.equal(panel.props.inspection.target.id,'ACL parent specimen');
  assert.equal(panel.props.suspended,false);return panel;
}

test('guided compatible specimen keeps one mounted family through pending MRI and switches only after verification',async()=>{
  const h=harness(retainedComparison);const parent=await loadedSpecimenParent(h);
  const parentKey=parent.key;assert(parentKey,'specimen must have a stable family key');
  h.button('Next step').props.onClick();h.render();
  assert.equal(h.annotationCalls.length,2);assert.equal(h.annotationCalls[1].annotation.id,'PCL accepted');
  let panel=h.find('test-inline-inspection');assert.equal(panel.key,parentKey);
  assert.equal(panel.props.inspection.target.id,'ACL parent specimen');assert.equal(panel.props.suspended,true);
  assert.equal(h.frameCalls.at(-1)?.[1],null,'pending child geometry is withheld');
  h.annotationLoads[1].resolve({annotation:retainedPcl,purpose:'scoped-display'});await flush();h.render();
  panel=h.find('test-inline-inspection');assert.equal(panel.key,parentKey,'compatible specimen frame keeps its React identity');
  assert.equal(panel.props.inspection.target.id,'PCL child specimen');assert.equal(panel.props.suspended,false);
  assert.equal(h.frameCalls.at(-1)?.[1]?.annotation,retainedPcl);h.cleanup();
});

test('closing a specimen during guided verification cannot reopen it from the pending completion',async()=>{
  const h=harness(retainedComparison);await loadedSpecimenParent(h);
  h.button('Next step').props.onClick();h.render();
  h.find('test-inline-inspection').props.onClose();h.render();
  assert.equal(nodes(h.tree()).filter(n=>n.type==='test-inline-inspection').length,0);
  h.annotationLoads[1].resolve({annotation:retainedPcl,purpose:'scoped-display'});await flush();h.render();
  assert.equal(nodes(h.tree()).filter(n=>n.type==='test-inline-inspection').length,0);
  assert.equal(h.frameCalls.at(-1)?.[1]?.annotation,retainedPcl);h.cleanup();
});

test('failed or missing guided geometry retires a held specimen without choosing a substitute',async()=>{
  const failed=harness(retainedComparison);await loadedSpecimenParent(failed);
  failed.button('Next step').props.onClick();failed.render();
  failed.annotationLoads[1].reject(new Error('Synthetic verification failure'));await flush();failed.render();
  assert.equal(nodes(failed.tree()).filter(n=>n.type==='test-inline-inspection').length,0);
  assert.match(words(failed.tree()),/Synthetic verification failure/);failed.cleanup();

  const missing=harness((overlay:any)=>({...retainedComparison(overlay),targets:overlay.annotation.id==='PCL accepted'?[]:retainedComparison(overlay).targets}));
  await loadedSpecimenParent(missing);missing.button('Next step').props.onClick();missing.render();
  missing.annotationLoads[1].resolve({annotation:retainedPcl,purpose:'scoped-display'});await flush();missing.render();
  assert.equal(nodes(missing.tree()).filter(n=>n.type==='test-inline-inspection').length,0);missing.cleanup();
});

test('ambiguous or different-family guided references retire the held specimen',async()=>{
  for(const targets of [[childSpecimen,specimen('second matching specimen','other')],
    [specimen('different model','pcl',{sourceHash:'5'.repeat(64)})]]){
    const h=harness((overlay:any)=>({...retainedComparison(overlay),
      targets:overlay.annotation.id==='PCL accepted'?targets:retainedComparison(overlay).targets}));
    await loadedSpecimenParent(h);h.button('Next step').props.onClick();h.render();
    h.annotationLoads[1].resolve({annotation:retainedPcl,purpose:'scoped-display'});await flush();h.render();
    assert.equal(nodes(h.tree()).filter(n=>n.type==='test-inline-inspection').length,0);
    assert.equal(h.frameCalls.at(-1)?.[1]?.annotation,retainedPcl);h.cleanup();
  }
});

test('manual selection and source sequence changes retire specimen retention',async()=>{
  const manual=harness(retainedComparison);await loadedSpecimenParent(manual);
  nodes(manual.find('li',node=>words(node).includes('ACL accepted'))).find(node=>node.type==='button')!.props.onClick();manual.render();
  assert.equal(nodes(manual.tree()).filter(n=>n.type==='test-inline-inspection').length,0);
  assert.equal(manual.annotationCalls.at(-1).annotation.id,'ACL accepted');manual.cleanup();

  const sequence=harness(retainedComparison);await loadedSpecimenParent(sequence);
  sequence.select('s2');sequence.render();
  assert.equal(nodes(sequence.tree()).filter(n=>n.type==='test-inline-inspection').length,0);
  assert.equal(sequence.find('select').props.value,'s2');sequence.cleanup();
});

test('dirty refusal keeps the specimen and retired source suspends it for recovery',async()=>{
  let allow=false,prompts=0;const h=harness(retainedComparison,'b'.repeat(64),()=>{prompts++;return allow;});
  const parent=await loadedSpecimenParent(h);
  h.find('test-correction-panel').props.onDirtyChange(true);h.render();
  h.button('Next step').props.onClick();h.render();
  assert.equal(prompts,1);assert.equal(h.annotationCalls.length,1);
  assert.equal(h.find('test-inline-inspection').key,parent.key);
  assert.equal(h.find('test-inline-inspection').props.suspended,false);
  const replacement={...sourcePin,revision:'f'.repeat(64),label:'Replacement source'};
  h.render(replacement);
  assert.equal(h.find('test-inline-inspection').key,parent.key);
  assert.equal(h.find('test-inline-inspection').props.suspended,true);
  assert.equal(h.find('test-correction-panel').props.sourceRetired,true);
  const heldKey=h.outerKey();
  allow=true;h.button('Discard retained edits and open current source').props.onClick();h.render(replacement);
  assert.notEqual(h.outerKey(),heldKey,'React receives a new session key for the replacement source');h.cleanup();
});

test('reference learning receives only verified current geometry and retires during a new selection',async()=>{
 const comparison={...comparisonFixture,learning:{schema:'synthetic-reference-learning'}};
 const h=harness(comparison);h.render();h.folder();h.opens[0].resolve(pkg);await flush();h.render();h.select('s1');
 h.seriesLoads[0].resolve(study(s1));await flush();h.render();
 assert.equal(nodes(h.tree()).filter(n=>n.type==='test-reference-learning').length,0);
 h.annotation('Meniscus').props.onClick();h.render();assert.equal(nodes(h.tree()).filter(n=>n.type==='test-reference-learning').length,0);
 const verified={annotation:accepted,purpose:'scoped-display'};h.annotationLoads[0].resolve(verified);await flush();h.render();
 const panel=h.find('test-reference-learning');assert.strictEqual(panel.props.overlay,verified);assert.strictEqual(panel.props.catalogue,comparison);
 assert.strictEqual(panel.props.pkg,pkg);assert.strictEqual(panel.props.study.series,s1);
 h.annotation('Meniscus').props.onClick();h.render();assert.equal(nodes(h.tree()).filter(n=>n.type==='test-reference-learning').length,0);
 h.cleanup();
});

test('reference learning stays withheld for provisional geometry and retired dirty source',async()=>{
 const comparison={...comparisonFixture,learning:{schema:'synthetic-reference-learning'}};
 const provisionalView=harness(comparison);provisionalView.render();provisionalView.folder();provisionalView.opens[0].resolve(pkg);await flush();provisionalView.render();provisionalView.select('s1');
 provisionalView.seriesLoads[0].resolve(study(s1));await flush();provisionalView.render();
 nodes(provisionalView.find('label',n=>words(n).includes('Inspect provisional geometry'))).find(n=>n.type==='input')!.props.onChange({currentTarget:{checked:true}});provisionalView.render();
 provisionalView.annotation('Ligament provisional').props.onClick();provisionalView.annotationLoads[0].resolve({annotation:provisional,purpose:'provisional-inspection'});await flush();provisionalView.render();
 assert.equal(nodes(provisionalView.tree()).filter(n=>n.type==='test-reference-learning').length,0);provisionalView.cleanup();
 const held=harness(comparison,'b'.repeat(64));held.render();held.folder();held.opens[0].resolve(pkg);await flush();held.render();held.select('s1');held.seriesLoads[0].resolve(study(s1));await flush();held.render();
 held.annotation('Meniscus').props.onClick();held.annotationLoads[0].resolve({annotation:accepted,purpose:'scoped-display'});await flush();held.render();assert(held.find('test-reference-learning'));
 held.find('test-correction-panel').props.onDirtyChange(true);held.render();held.render({...sourcePin,revision:'f'.repeat(64)});
 assert.equal(nodes(held.tree()).filter(n=>n.type==='test-reference-learning').length,0);assert.equal(held.find('test-correction-panel').props.sourceRetired,true);held.cleanup();
});

const syntheticCheckFactory=(ownerPkg:any,ownerStudy:any,overlay:any)=>overlay?.purpose==='scoped-display'&&overlay.annotation.review.status==='accepted-scoped'?
 {key:JSON.stringify([ownerPkg.revision,ownerStudy.series.id,overlay.annotation.id]),revision:'synthetic-question-v1',prompt:'Identify saved annotation',options:[{id:'1',label:'First'},{id:'2',label:'Second'},{id:'3',label:'Third'}]}:null;
async function loadedCheck(h:ReturnType<typeof harness>){
 h.render();h.folder();h.opens[0].resolve(pkg);await flush();h.render();h.select('s1');h.seriesLoads[0].resolve(study(s1));await flush();h.render();
 h.annotation('Meniscus').props.onClick();h.annotationLoads[0].resolve({annotation:accepted,purpose:'scoped-display'});await flush();h.render();
}
test('structure check replaces inventory, focuses verified overlay and restores inspection without source writes',async()=>{
 const h=harness(null,null,()=>true,syntheticCheckFactory);await loadedCheck(h);
 const visibility=nodes(h.find('label',n=>words(n).includes('Show selected geometry'))).find(n=>n.type==='input')!;
 visibility.props.onChange({currentTarget:{checked:false}});h.render();assert.equal(h.frameCalls.at(-1)[1],null);
 h.button('Try structure check').props.onClick();h.render();h.render();const panel=h.find('test-structure-check');
 assert.strictEqual(panel.props.pkg,pkg);assert.strictEqual(panel.props.overlay.annotation,accepted);assert.equal(panel.props.imageReady,true);
 assert.equal(nodes(h.tree()).filter(n=>n.type==='test-correction-panel').length,0);assert.doesNotMatch(words(h.tree()),/Source-scoped structures/);
 assert.doesNotMatch(h.find('canvas').props['aria-label'],/Meniscus/);assert.match(h.find('canvas').props['aria-label'],/highlighted saved annotation/);
 assert.equal(h.find('input',n=>n.props.type==='checkbox').props.disabled,true);assert.strictEqual(h.frameCalls.at(-1)[1].annotation,accepted);
 panel.props.onClose();h.render();assert.match(words(h.tree()),/Source-scoped structures/);assert.equal(h.annotationCalls.length,1);h.cleanup();
});

function nextHarness(checkFactory:((...args:any[])=>any)|null=syntheticCheckFactory,locationFactory:((...args:any[])=>any)|null=null){
 const next={...accepted,id:'next-target',anatomyId:'knee.next',label:'Hidden next target'};
 const candidates=(_pkg:any,_study:any,overlay:any)=>overlay.annotation===accepted?[next]:[];
 const h=harness(null,null,()=>true,checkFactory,locationFactory,false,()=>null,()=>true,()=>null,()=>false,candidates);
 return {h,next};
}
test('next practice loads exactly one same-sequence target without revealing it while pending',async()=>{
 const {h,next}=nextHarness();await loadedCheck(h);h.button('Try structure check').props.onClick();h.render();h.render();
 const previous=h.find('test-structure-check');assert.equal(previous.props.nextAvailable,true);
 previous.props.onNext();previous.props.onNext();h.render();
 assert.equal(h.annotationCalls.length,2,'double activation does not start a second load');
 assert.strictEqual(h.annotationCalls[1].annotation,next);assert.strictEqual(h.annotationCalls[1].pkg,pkg);
 assert.strictEqual(h.annotationCalls[1].study,h.annotationCalls[0].study);assert.equal(h.annotationCalls[1].options,undefined);
 assert.equal(h.find('test-structure-check').props.retired,true);assert.strictEqual(h.find('test-structure-check').props.overlay.annotation,accepted);
 h.find('test-structure-check').props.onClose();h.render();assert(h.find('test-structure-check'),'pending question cannot be closed by an inactive card callback');
 assert.doesNotMatch(words(h.tree()),/Hidden next target|Source-scoped structures/);
 const loaded={annotation:next,purpose:'scoped-display'};h.annotationLoads[1].resolve(loaded);await flush();h.render();h.render();
 const current=h.find('test-structure-check');assert.strictEqual(current.props.overlay,loaded);assert.equal(current.props.mode,'name');
 assert.equal(current.props.nextAvailable,false);assert.equal(current.props.retired,false);assert.equal(current.props.imageReady,true);
 assert.doesNotMatch(h.find('canvas').props['aria-label'],/Hidden next target/);
 current.props.onNext();assert.equal(h.annotationCalls.length,2);h.cleanup();previous.props.onNext();assert.equal(h.annotationCalls.length,2);
});
test('failed next practice verification retains the previous question and never falls back',async()=>{
 for(const failure of ['load','question','identity','focus']){
  const factory=(p:any,s:any,o:any)=>failure==='question'&&o.annotation.id==='next-target'?null:syntheticCheckFactory(p,s,o);
  const {h,next}=nextHarness(factory);await loadedCheck(h);h.button('Try structure check').props.onClick();h.render();h.render();
  h.find('test-structure-check').props.onNext();h.render();
  if(failure==='load')h.annotationLoads[1].reject(new Error('Hidden next target is corrupt'));
  else h.annotationLoads[1].resolve({annotation:failure==='identity'?{...next}:next,purpose:'scoped-display',syntheticNoFocus:failure==='focus'});
  await flush();h.render();h.render();
  assert.strictEqual(h.find('test-structure-check').props.overlay.annotation,accepted);assert.equal(h.find('test-structure-check').props.retired,false);
  assert.match(words(h.tree()),/previous question is retained/);assert.doesNotMatch(words(h.tree()),/Hidden next target|is corrupt/);
  assert.equal(h.annotationCalls.length,2,'no second candidate or other sequence is substituted');h.cleanup();
 }
});
test('next locate practice resets the old answer tint and pending mode changes stay inert',async()=>{
 const {h,next}=nextHarness(syntheticCheckFactory,syntheticLocationFactory);await loadedCheck(h);
 h.button('Try structure check').props.onClick();h.render();h.render();h.find('test-structure-check').props.onModeChange('locate');h.render();h.render();
 h.find('test-structure-check').props.onShowAnswer();h.render();h.render();assert.equal(h.find('input',n=>n.props.type==='checkbox').props.checked,true);
 h.find('test-structure-check').props.onNext();h.render();h.find('test-structure-check').props.onModeChange('name');h.render();
 assert.equal(h.find('test-structure-check').props.mode,'locate','inert pending callback cannot switch activity');
 const loaded={annotation:next,purpose:'scoped-display'};h.annotationLoads[1].resolve(loaded);await flush();h.render();h.render();
 assert.strictEqual(h.find('test-structure-check').props.overlay,loaded);assert.equal(h.find('test-structure-check').props.mode,'locate');
 assert.equal(h.find('test-structure-check').props.pick,null);assert.equal(h.find('input',n=>n.props.type==='checkbox').props.checked,false);
 assert.equal(h.frameCalls.at(-1)[4].opacity,0,'new target is not revealed by the preceding answer');h.cleanup();
});
test('source selection and unmount retire a pending next-practice load and its old callbacks',async()=>{
 const {h,next}=nextHarness();await loadedCheck(h);h.button('Try structure check').props.onClick();h.render();h.render();
 const old=h.find('test-structure-check').props.onNext;old();h.render();h.select('s2');h.render();
 assert(h.annotationCalls[1].signal.aborted);old();assert.equal(h.annotationCalls.length,2);
 h.annotationLoads[1].resolve({annotation:next,purpose:'scoped-display'});await flush();h.render();
 assert.equal(nodes(h.tree()).filter(n=>n.type==='test-structure-check').length,0);assert.equal(h.find('select').props.value,'s2');h.cleanup();
 const pending=nextHarness();await loadedCheck(pending.h);pending.h.button('Try structure check').props.onClick();pending.h.render();pending.h.render();
 pending.h.find('test-structure-check').props.onNext();pending.h.cleanup();assert(pending.h.annotationCalls[1].signal.aborted);
 pending.h.annotationLoads[1].resolve({annotation:pending.next,purpose:'scoped-display'});await flush();
 assert.equal(pending.h.annotationCalls.length,2);
});
test('real loader and candidate API drive next-question ownership through the viewer boundary',async()=>{
 const built=await build({stdin:{contents:"export * from './lib/regional-mri-package';export * from './lib/regional-mri-structure-check';export * from './lib/regional-mri-practice-next';",resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,format:'esm',platform:'node'});
 const api=await import('data:text/javascript;base64,'+Buffer.from(built.outputFiles[0].contents).toString('base64'));
 const sha=(bytes:Uint8Array)=>createHash('sha256').update(bytes).digest('hex'),image=new Uint8Array(27),hash=sha(image);
 const annotations=['Alpha','Beta','Gamma'].map((label,index)=>({id:'synthetic-'+index,anatomyId:'synthetic:concept:'+index,label,seriesId:'s1',sourceImageSha256:hash,laterality:'left',coverage:'partial',review:{status:'accepted-scoped',revision:'a'.repeat(64),scope:'Synthetic saved extent'},geometry:{kind:'points',points_ras_mm:[[1,1,1]]}}));
 const manifest={schema:'visible-medicine.regional-mri/1',version:'1.0.0',byteOrder:'little',region:'knee',laterality:'left',coordinateSystem:'per-series-RAS-mm',registration:'none',release:'local-private-draft',series:[{id:'s1',label:'Synthetic MRI',image:{file:'image.raw',sha256:hash,dtype:'uint8',shape_kji:[3,3,3],ijk_to_ras:[[1,0,0,0],[0,1,0,0],[0,0,1,0],[0,0,0,1]]},annotations}]};
 const bytes=new TextEncoder().encode(JSON.stringify(manifest)),asset=(data:Uint8Array)=>({size:data.length,async arrayBuffer(){return data.slice().buffer;}});
 const realPkg=await api.openRegionalMriPackage(bytes.buffer,new Map([['manifest.json',asset(bytes)],['image.raw',asset(image)]]),sha(bytes));
 const realStudy=await api.loadRegionalMriSeries(realPkg,'s1'),alpha=await api.loadRegionalMriAnnotation(realPkg,realStudy,realStudy.series.annotations[0]);
 const h=harness(null,null,()=>true,api.createRegionalMriStructureCheck,api.createRegionalMriLocationCheck,false,()=>null,()=>true,()=>null,()=>false,api.regionalMriNextPracticeCandidates);
 h.render();h.folder();h.opens[0].resolve(realPkg);await flush();h.render();h.select('s1');h.seriesLoads[0].resolve(realStudy);await flush();h.render();
 h.annotation('Alpha').props.onClick();h.annotationLoads[0].resolve(alpha);await flush();h.render();h.button('Try structure check').props.onClick();h.render();h.render();
 const first=h.find('test-structure-check');first.props.onNext();h.render();
 assert.strictEqual(h.annotationCalls[1].annotation,realStudy.series.annotations[1]);assert.doesNotMatch(words(h.tree()),/Beta/);
 const beta=await api.loadRegionalMriAnnotation(realPkg,realStudy,h.annotationCalls[1].annotation);h.annotationLoads[1].resolve(beta);await flush();h.render();h.render();
 const next=h.find('test-structure-check');assert.strictEqual(next.props.overlay,beta);
 const answer=api.revealRegionalMriStructureCheck(next.props.check,realPkg,realStudy,beta);assert.equal(answer.label,'Beta');
 assert.equal(api.gradeRegionalMriStructureCheck(next.props.check,realPkg,realStudy,alpha,answer.id),'unavailable');
 assert.equal(api.gradeRegionalMriStructureCheck(next.props.check,realPkg,realStudy,beta,answer.id),'correct');h.cleanup();
});
test('structure check respects dirty refusal and source retirement; stale starts cannot reopen during selection',async()=>{
 let allow=false,prompts=0;const h=harness(null,'b'.repeat(64),()=>{prompts++;return allow;},syntheticCheckFactory);await loadedCheck(h);
 h.find('test-correction-panel').props.onDirtyChange(true);h.render();h.button('Try structure check').props.onClick();h.render();
 assert.equal(prompts,1);assert.equal(nodes(h.tree()).filter(n=>n.type==='test-structure-check').length,0);assert(h.find('test-correction-panel'));
 allow=true;h.button('Try structure check').props.onClick();h.render();h.render();const oldStart=h.button('Close and reset').props.onClick;
 const panel=h.find('test-structure-check');panel.props.onClose();h.render();const start=h.button('Try structure check').props.onClick;
 h.select('s2');h.render();start();h.render();assert.equal(nodes(h.tree()).filter(n=>n.type==='test-structure-check').length,0);
 oldStart();h.render();assert.equal(h.seriesCalls.length,2);h.cleanup();
});
test('provisional display never offers a structure check and changing a source retires an open question',async()=>{
 const h=harness(null,null,()=>true,syntheticCheckFactory);await loadedCheck(h);h.button('Try structure check').props.onClick();h.render();h.render();
 const stale=h.find('test-structure-check').props.onClose;h.select('s2');h.render();assert.equal(nodes(h.tree()).filter(n=>n.type==='test-structure-check').length,0);stale();h.render();assert.equal(h.find('select').props.value,'s2');h.cleanup();
 const p=harness(null,null,()=>true,syntheticCheckFactory);p.render();p.folder();p.opens[0].resolve(pkg);await flush();p.render();p.select('s1');p.seriesLoads[0].resolve(study(s1));await flush();p.render();
 nodes(p.find('label',n=>words(n).includes('Inspect provisional geometry'))).find(n=>n.type==='input')!.props.onChange({currentTarget:{checked:true}});p.render();
 p.annotation('Ligament provisional').props.onClick();p.annotationLoads[0].resolve({annotation:provisional,purpose:'provisional-inspection'});await flush();p.render();
 assert.equal(nodes(p.tree()).filter(n=>n.type==='button'&&words(n)==='Try structure check').length,0);p.cleanup();
});
test('a painted off-annotation slice pauses the question without disabling native navigation or return to focus',async()=>{
 const h=harness(null,null,()=>true,syntheticCheckFactory);await loadedCheck(h);h.button('Try structure check').props.onClick();h.render();h.render();
 assert.equal(h.find('test-structure-check').props.annotationVisible,true);h.setMaskVisible(false);h.find('button',n=>n.props['aria-label']==='Next slice').props.onClick();h.render();h.render();
 const off=h.find('test-structure-check');assert.equal(off.props.imageReady,true);assert.equal(off.props.annotationVisible,false);
 assert.match(h.find('canvas').props['aria-label'],/no saved annotation visible on this slice/);assert.doesNotMatch(h.find('canvas').props['aria-label'],/highlighted saved annotation/);
 off.props.onFocus();h.setMaskVisible(true);h.render();h.render();assert.equal(h.find('test-structure-check').props.annotationVisible,true);
 assert.equal(h.annotationCalls.length,1);assert.strictEqual(h.frameCalls.at(-1)[1].annotation,accepted);h.cleanup();
});

const syntheticLocationFactory=(ownerPkg:any,ownerStudy:any,overlay:any)=>overlay?.purpose==='scoped-display'&&overlay.annotation.review.status==='accepted-scoped'&&overlay.annotation.geometry.kind==='mask'?
 {key:JSON.stringify([ownerPkg.revision,ownerStudy.series.id,overlay.annotation.id,'location']),revision:'synthetic-location-v1',prompt:'Locate the saved extent',targetLabel:overlay.annotation.label}:null;
async function locationCheck(h:ReturnType<typeof harness>){await loadedCheck(h);h.button('Try structure check').props.onClick();h.render();h.render();return h.find('test-structure-check');}
const mouse=(x:number,y:number,rect={left:100,top:50,width:400,height:200})=>({clientX:x,clientY:y,currentTarget:{getBoundingClientRect:()=>rect}});
function keyEvent(key:string,shiftKey=false){const event={key,shiftKey,prevented:0,stopped:0,preventDefault(){this.prevented++;},stopPropagation(){this.stopped++;}};return event;}

test('name and location practice keep the native plane midpoint rather than auto-jumping to the guided answer',async()=>{
 for(const [mode,checkFactory,locationFactory] of [
  ['name',syntheticCheckFactory,null],['locate',null,syntheticLocationFactory],
 ] as const){
  const h=harness(null,null,()=>true,checkFactory,locationFactory);
  await loadedGuide(h);h.button('Cruciate ligaments').props.onClick();h.render();
  h.annotationLoads[0].resolve({annotation:guidedSeries.annotations[0],purpose:'scoped-display'});await flush();h.render();
  h.button('Try structure check').props.onClick();h.render();h.render();
  assert.equal(h.find('test-structure-check').props.mode,mode);
  h.button('sagittal').props.onClick();h.render();
  assert.equal(h.frameCalls.at(-1)?.[1]?.annotation.id,'ACL accepted');
  assert.equal(h.find('input',node=>node.props['aria-label']==='Native slice').props.value,2,
   `${mode} practice must not reveal the guided ACL focus at sagittal slice 4`);
  h.cleanup();
 }
});

test('location-only practice hides the answer in the native frame and keeps inventory replaced',async()=>{
 const h=harness(null,null,()=>true,null,syntheticLocationFactory,true),panel=await locationCheck(h);
 assert.equal(panel.props.check,null);assert(panel.props.location);assert.equal(panel.props.mode,'locate');assert.equal(panel.props.imageReady,true);
 const canvas=h.find('canvas');assert.equal(canvas.props.role,'button');assert.equal(canvas.props.tabIndex,0);
 assert.match(canvas.props['aria-label'],/answer overlay hidden; keyboard pointer/);assert.doesNotMatch(canvas.props['aria-label'],/Meniscus|mask display pixels/);
 assert.equal(h.frameCalls.at(-1)[4].opacity,0,'the selected overlay stays bound but its answer tint is hidden');
 assert.strictEqual(h.frameCalls.at(-1)[1].annotation,accepted);assert.doesNotMatch(words(h.tree()),/Source-scoped structures|Compare in 3D/);
 assert.equal(nodes(h.tree()).filter(n=>n.type==='test-correction-panel').length,0);h.cleanup();
});

test('location clicks map CSS-scaled canvas bounds to exact integer display pixels and reject outside bounds',async()=>{
 const h=harness(null,null,()=>true,null,syntheticLocationFactory,true);await locationCheck(h);
 h.find('canvas').props.onClick(mouse(499,249));h.render();h.render();
 const panel=h.find('test-structure-check'),pick=panel.props.pick;
 assert.equal(pick.x,1);assert.equal(pick.y,1);assert.strictEqual(pick.frame,panel.props.frame);assert.strictEqual(pick.check,panel.props.location);
 assert.equal(pick.plane,'axial');assert.equal(pick.slice,1);
 for(const event of [mouse(99,100),mouse(500,100),mouse(200,250),mouse(NaN,100),mouse(200,100,{left:100,top:50,width:0,height:200}),mouse(200,100,{left:100,top:50,width:400,height:NaN})]){
  h.find('canvas').props.onClick(event);h.render();assert.strictEqual(h.find('test-structure-check').props.pick,pick);
 }
 h.find('canvas').props.onClick(mouse(100,50));h.render();h.render();const first=h.find('test-structure-check').props.pick;
 assert.equal(first.x,0);assert.equal(first.y,0);assert(first.nonce>pick.nonce);h.cleanup();
});

test('location keyboard pointer clamps, submits and consumes arrows instead of changing the native slice',async()=>{
 const h=harness(null,null,()=>true,null,syntheticLocationFactory,true);await locationCheck(h);
 for(const key of ['ArrowLeft','ArrowUp']){const e=keyEvent(key,true);h.find('canvas').props.onKeyDown(e);h.render();assert.equal(e.prevented,1);assert.equal(e.stopped,1);}
 assert.match(h.find('canvas').props['aria-label'],/column 1, row 1/);
 const submit=keyEvent('Enter');h.find('canvas').props.onKeyDown(submit);h.render();h.render();
 assert.equal(submit.prevented,1);let pick=h.find('test-structure-check').props.pick;assert.equal(pick.x,0);assert.equal(pick.y,0);assert.equal(pick.slice,1);
 for(const key of ['ArrowRight','ArrowDown']){const e=keyEvent(key,true);h.find('canvas').props.onKeyDown(e);h.render();}
 h.find('canvas').props.onKeyDown(keyEvent(' '));h.render();h.render();pick=h.find('test-structure-check').props.pick;
 assert.equal(pick.x,1);assert.equal(pick.y,1);assert.equal(pick.slice,1);
 const unrelated=keyEvent('Escape');h.find('canvas').props.onKeyDown(unrelated);assert.equal(unrelated.prevented,0);assert.equal(unrelated.stopped,0);h.cleanup();
});

test('answer reveal stops location input and mode switches reset the old click and hidden-answer state',async()=>{
 const h=harness(null,null,()=>true,syntheticCheckFactory,syntheticLocationFactory,true);let panel=await locationCheck(h);
 assert.equal(panel.props.mode,'name');panel.props.onModeChange('locate');h.render();h.render();panel=h.find('test-structure-check');const locateKey=panel.key;
 h.find('canvas').props.onClick(mouse(200,100));h.render();h.render();panel=h.find('test-structure-check');const pick=panel.props.pick;
 panel.props.onShowAnswer();h.render();h.render();assert.equal(h.find('canvas').props.role,'img');assert.equal(h.frameCalls.at(-1)[4].opacity,.55);
 h.find('canvas').props.onClick(mouse(300,150));h.find('canvas').props.onKeyDown(keyEvent('Enter'));h.render();assert.strictEqual(h.find('test-structure-check').props.pick,pick);
 h.find('test-structure-check').props.onModeChange('name');h.render();h.render();panel=h.find('test-structure-check');assert.equal(panel.props.pick,null);assert.notEqual(panel.key,locateKey);
 panel.props.onModeChange('locate');h.render();h.render();assert.equal(h.find('test-structure-check').props.pick,null);assert.equal(h.frameCalls.at(-1)[4].opacity,0);
 assert.equal(h.annotationCalls.length,1);h.cleanup();
});

test('location picks pause off the saved extent and stale mode, reveal and click callbacks cannot revive a retired source',async()=>{
 const h=harness(null,null,()=>true,null,syntheticLocationFactory,true);let panel=await locationCheck(h);
 const staleClick=h.find('canvas').props.onClick,staleReveal=panel.props.onShowAnswer,staleMode=panel.props.onModeChange;
 h.setMaskVisible(false);h.find('button',n=>n.props['aria-label']==='Next slice').props.onClick();h.render();h.render();panel=h.find('test-structure-check');
 assert.equal(panel.props.imageReady,true);assert.equal(panel.props.annotationVisible,false);h.find('canvas').props.onClick(mouse(200,100));h.render();assert.equal(h.find('test-structure-check').props.pick,null);
 h.find('test-structure-check').props.onFocus();h.setMaskVisible(true);h.render();h.render();assert.equal(h.find('test-structure-check').props.annotationVisible,true);
 h.select('s2');h.render();staleClick(mouse(200,100));staleReveal();staleMode('locate');h.render();
 assert.equal(nodes(h.tree()).filter(n=>n.type==='test-structure-check').length,0);assert.equal(h.find('select').props.value,'s2');h.cleanup();
});

test('answer study uses the current practice context and opens an explicit reference without losing the question',async()=>{
 const target={id:'body-reference',label:'Same-side body reference',kind:'body',side:'left',relation:'same-structure',sourceHash:'1'.repeat(64),specimenRevision:null,href:'/atlas/3d?study=1'};
 const comparison={learning:{},provisional:false,atlasRevision:'2'.repeat(40),mappingRevision:'3'.repeat(64),targets:[target]};
 const h=harness(comparison,null,()=>true,syntheticCheckFactory,syntheticLocationFactory,true);await loadedCheck(h);
 h.button('Try structure check').props.onClick();h.render();h.render();
 let panel=h.find('test-structure-check');const originalKey=panel.key,check=panel.props.check;
 const followup=panel.props.followup;assert.equal(followup.type,'test-practice-followup');assert.strictEqual(followup.props.pkg,pkg);
 assert.strictEqual(followup.props.study,panel.props.study);assert.strictEqual(followup.props.overlay,panel.props.overlay);assert.strictEqual(followup.props.catalogue,comparison);
  assert.equal(followup.props.retired,false);let focused=0;const launcher={isConnected:true,focus:()=>focused++};
 followup.props.onInspect('unknown',launcher);h.render();assert.equal(nodes(h.tree()).filter(n=>n.type==='test-inline-inspection').length,0);
 h.find('test-structure-check').props.followup.props.onInspect(target.id,launcher);h.render();h.render();
 assert.equal(h.find('test-inline-inspection').props.inspection.target.id,target.id);panel=h.find('test-structure-check');
 assert.equal(panel.key,originalKey);assert.strictEqual(panel.props.check,check);assert.equal(h.annotationCalls.length,1);assert.equal(h.seriesCalls.length,1);
 h.find('test-inline-inspection').props.onClose();h.render();assert.equal(focused,1);assert.equal(h.find('test-structure-check').key,originalKey);
 h.find('test-structure-check').props.followup.props.onInspect(target.id,launcher);h.render();h.render();
 const stale=h.find('test-structure-check').props.followup.props.onInspect;
 h.find('test-structure-check').props.onModeChange('locate');h.render();h.render();assert.equal(h.find('test-structure-check').props.mode,'locate');
 assert.equal(nodes(h.tree()).filter(n=>n.type==='test-inline-inspection').length,0,'switching to an unanswered activity closes answer references');
 stale(target.id,launcher);h.render();assert.equal(nodes(h.tree()).filter(n=>n.type==='test-inline-inspection').length,0);
 h.cleanup();
});

test('answer study callbacks cannot inspect an off-target image, another sequence, retired source or unmounted viewer',async()=>{
 const target={id:'answer-reference',label:'Reference',kind:'body',side:'left',relation:'same-structure',sourceHash:'1'.repeat(64),specimenRevision:null,href:'/atlas/3d?study=1'};
 const comparison={learning:{},provisional:false,atlasRevision:'2'.repeat(40),mappingRevision:'3'.repeat(64),targets:[target]};
 const h=harness(comparison,null,()=>true,syntheticCheckFactory,syntheticLocationFactory,true);await locationCheck(h);
 const stale=h.find('test-structure-check').props.followup.props.onInspect;
 h.setMaskVisible(false);h.find('button',n=>n.props['aria-label']==='Next slice').props.onClick();h.render();h.render();
 const off=h.find('test-structure-check').props.followup;assert.equal(off.props.retired,true);off.props.onInspect(target.id,{focus(){}});stale(target.id,{focus(){}});h.render();
 assert.equal(nodes(h.tree()).filter(n=>n.type==='test-inline-inspection').length,0);
 h.select('s2');h.render();stale(target.id,{focus(){}});h.render();assert.equal(nodes(h.tree()).filter(n=>n.type==='test-inline-inspection').length,0);
 h.cleanup();stale(target.id,{focus(){}});assert.equal(h.annotationCalls.length,1);
 const retired=harness(comparison,'4'.repeat(64),()=>true,syntheticCheckFactory);await loadedCheck(retired);
 retired.button('Try structure check').props.onClick();retired.render();retired.render();const previous=retired.find('test-structure-check').props.followup.props.onInspect;
 retired.find('test-structure-check').props.onClose();retired.render();retired.find('test-correction-panel').props.onDirtyChange(true);retired.render();
 retired.render({...sourcePin,revision:'5'.repeat(64)});previous(target.id,{focus(){}});retired.render({...sourcePin,revision:'5'.repeat(64)});
 assert.equal(nodes(retired.tree()).filter(n=>n.type==='test-inline-inspection').length,0);retired.cleanup();
});

test('reselecting completed location activity preserves the answer overlay, pointer and open reference',async()=>{
 const target={id:'location-answer-reference',label:'Reference',kind:'body',side:'left',relation:'same-structure',sourceHash:'1'.repeat(64),specimenRevision:null,href:'/atlas/3d?study=1'};
 const comparison={learning:{},provisional:false,atlasRevision:'2'.repeat(40),mappingRevision:'3'.repeat(64),targets:[target]};
 const h=harness(comparison,null,()=>true,syntheticCheckFactory,syntheticLocationFactory,true);await locationCheck(h);
 h.find('test-structure-check').props.onModeChange('locate');h.render();h.render();
 h.find('canvas').props.onClick(mouse(200,100));h.render();h.render();h.find('test-structure-check').props.onShowAnswer();h.render();h.render();
 h.find('test-structure-check').props.followup.props.onInspect(target.id,{focus(){}});h.render();h.render();
 const panel=h.find('test-structure-check'),key=panel.key,pick=panel.props.pick,inspection=h.find('test-inline-inspection').props.inspection;
 assert.equal(h.frameCalls.at(-1)[4].opacity,.55);panel.props.onModeChange('locate');h.render();h.render();
 assert.equal(h.frameCalls.at(-1)[4].opacity,.55,'an already active activity must not hide a completed answer');
 assert.strictEqual(h.find('test-structure-check').props.pick,pick);assert.equal(h.find('test-structure-check').key,key);
 assert.equal(h.find('test-inline-inspection').props.inspection.key,inspection.key);assert.equal(h.annotationCalls.length,1);
 h.find('test-structure-check').props.onModeChange('name');h.render();h.render();assert.equal(nodes(h.tree()).filter(n=>n.type==='test-inline-inspection').length,0);
 h.find('test-structure-check').props.onModeChange('locate');h.render();h.render();assert.equal(h.frameCalls.at(-1)[4].opacity,0,'a genuinely new unanswered activity hides the answer');
 assert.equal(h.find('test-structure-check').props.pick,null);h.cleanup();
});

test('reselecting naming activity preserves its question and 3D answer reference until an actual activity change',async()=>{
 const target={id:'name-answer-reference',label:'Reference',kind:'body',side:'left',relation:'same-structure',sourceHash:'1'.repeat(64),specimenRevision:null,href:'/atlas/3d?study=1'};
 const comparison={learning:{},provisional:false,atlasRevision:'2'.repeat(40),mappingRevision:'3'.repeat(64),targets:[target]};
 const h=harness(comparison,null,()=>true,syntheticCheckFactory,syntheticLocationFactory,true);await locationCheck(h);
 const question=h.find('test-structure-check').props.check,key=h.find('test-structure-check').key;
 h.find('test-structure-check').props.followup.props.onInspect(target.id,{focus(){}});h.render();h.render();
 const inspection=h.find('test-inline-inspection').props.inspection;
 h.find('test-structure-check').props.onModeChange('name');h.render();h.render();assert.equal(h.find('test-inline-inspection').props.inspection.key,inspection.key);
 assert.strictEqual(h.find('test-structure-check').props.check,question);assert.equal(h.find('test-structure-check').key,key);
 h.find('test-structure-check').props.onModeChange('locate');h.render();h.render();assert.equal(nodes(h.tree()).filter(n=>n.type==='test-inline-inspection').length,0);
 assert.notEqual(h.find('test-structure-check').key,key);assert.equal(h.frameCalls.at(-1)[4].opacity,0);assert.equal(h.annotationCalls.length,1);h.cleanup();
});

// Parent lifecycle fixtures use an explicit synthetic resolver. The separate
// specimen-handoff suite exercises actual loader/channel/mapping ownership.
test('explicit model-to-MRI choice verifies the current sequence annotation, focuses its native plane and retains the model',async()=>{
 const selection={},resolve=(...args:any[])=>args[6]===selection?{annotation:retainedPcl,label:retainedPcl.label,targetId:childSpecimen.id}:null;
 const h=harness(retainedComparison,null,()=>true,null,null,true,resolve);await loadedSpecimenParent(h);h.render();h.render();
 const panel=h.find('test-inline-inspection'),key=panel.key;
 assert.equal(h.annotationCalls.length,1);assert.equal(panel.props.getMriSelectionLabel(selection),retainedPcl.label);
 assert.equal(h.annotationCalls.length,1,'resolving availability does not read another annotation');
 panel.props.onSelectMri(selection);h.render();assert.equal(h.annotationCalls.length,2);
 assert.strictEqual(h.annotationCalls[1].annotation,retainedPcl);assert.equal(h.seriesCalls.length,1);
 assert.equal(h.find('test-inline-inspection').key,key);assert.equal(h.find('test-inline-inspection').props.suspended,true);
 h.button('sagittal').props.onClick();h.render();
 h.annotationLoads[1].resolve({annotation:retainedPcl,purpose:'scoped-display'});await flush();h.render();h.render();
 assert.equal(h.find('test-inline-inspection').key,key);assert.equal(h.find('test-inline-inspection').props.inspection.target.id,childSpecimen.id);
 assert.equal(h.frameCalls.at(-1)[2],'sagittal');assert.equal(h.frameCalls.at(-1)[3],1);
 assert.match(words(h.tree()),/not patient-space registration/);assert.equal(h.seriesCalls.length,1);
 assert.equal(nodes(h.tree()).filter(node=>node.props['aria-label']==='Current guided inspection step').length,0,'explicit alternate choice leaves the old guided step');h.cleanup();
});

test('model-to-MRI action refuses a fresh resolver rejection, copied token and retired sequence callback',async()=>{
 const selection={};let allow=true;
 const h=harness(retainedComparison,null,()=>true,null,null,true,(...args:any[])=>allow&&args[6]===selection?{annotation:retainedPcl,label:'PCL',targetId:childSpecimen.id}:null);
 await loadedSpecimenParent(h);h.render();h.render();let panel=h.find('test-inline-inspection');
 panel.props.onSelectMri({...selection});assert.equal(h.annotationCalls.length,1);
 const stale=panel.props.onSelectMri;allow=false;stale(selection);assert.equal(h.annotationCalls.length,1);
 allow=true;h.select('s2');h.render();stale(selection);assert.equal(h.annotationCalls.length,1);
 h.cleanup();stale(selection);assert.equal(h.annotationCalls.length,1);
});

test('model handoff respects dirty correction refusal and does not reopen a reference closed during verification',async()=>{
 const selection={};let allow=false,prompts=0;
 const h=harness(retainedComparison,'b'.repeat(64),()=>{prompts++;return allow;},null,null,true,
  (...args:any[])=>args[6]===selection?{annotation:retainedPcl,label:'PCL',targetId:childSpecimen.id}:null);
 await loadedSpecimenParent(h);h.render();h.render();h.find('test-correction-panel').props.onDirtyChange(true);h.render();h.render();
 h.find('test-inline-inspection').props.onSelectMri(selection);h.render();assert.equal(prompts,1);assert.equal(h.annotationCalls.length,1);
 assert.strictEqual(h.frameCalls.at(-1)[1].annotation,retainedSeries.annotations[0]);
 allow=true;h.find('test-inline-inspection').props.onSelectMri(selection);h.render();assert.equal(h.annotationCalls.length,2);
 h.find('test-inline-inspection').props.onClose();h.render();h.annotationLoads[1].resolve({annotation:retainedPcl,purpose:'scoped-display'});await flush();h.render();h.render();
 assert.equal(nodes(h.tree()).filter(node=>node.type==='test-inline-inspection').length,0);
 assert.strictEqual(h.frameCalls.at(-1)[1].annotation,retainedPcl);h.cleanup();
});

test('changed mapping context while a model handoff loads cannot commit its MRI geometry',async()=>{
 const selection={};let mappingCurrent=true;
 const h=harness(retainedComparison,null,()=>true,null,null,true,
  (...args:any[])=>args[6]===selection?{annotation:retainedPcl,label:'PCL',targetId:childSpecimen.id}:null,()=>mappingCurrent);
 await loadedSpecimenParent(h);h.render();h.render();h.find('test-inline-inspection').props.onSelectMri(selection);h.render();
 mappingCurrent=false;h.annotationLoads[1].resolve({annotation:retainedPcl,purpose:'scoped-display'});await flush();h.render();h.render();
 assert.equal(h.frameCalls.at(-1)[1],null);assert.doesNotMatch(words(h.tree()),/Showing the saved annotation for this named model selection/);h.cleanup();
});

test('practice answer references cannot use a model selection to replace the question annotation',async()=>{
 const selection={},comparison={...comparisonFixture,learning:{},targets:[parentSpecimen]};
 const h=harness(comparison,null,()=>true,syntheticCheckFactory,syntheticLocationFactory,true,
  ()=>({annotation:retainedPcl,label:'PCL',targetId:childSpecimen.id}));await locationCheck(h);
 h.find('test-structure-check').props.followup.props.onInspect(parentSpecimen.id,{focus(){}});h.render();h.render();
 const panel=h.find('test-inline-inspection');assert.equal(panel.props.getMriSelectionLabel(selection),null);
 panel.props.onSelectMri(selection);h.render();assert.equal(h.annotationCalls.length,1);assert.strictEqual(h.find('test-structure-check').props.overlay.annotation,accepted);h.cleanup();
});

// Synthetic parent-lifecycle references only. The actual authored body/MRI
// mapping, source pins and loader ownership are exercised in body-handoff tests.
const rootParent={...parentSpecimen,id:'Synthetic body parent',kind:'body',label:'Synthetic body parent',side:'left',oppositeSide:false,
 relation:'same-structure',specimenRevision:null,modelFamily:'body:leg',href:'/atlas/3d?synthetic=1',sourceHash:'5'.repeat(64)};
const rootNext={...rootParent,id:'Synthetic body next',label:'Synthetic body next',sourceHash:'6'.repeat(64)};
const rootComparison=(overlay:any)=>({...retainedComparison(overlay),targets:overlay.annotation.id==='ACL accepted'?[rootParent]:overlay.annotation.id==='PCL accepted'?[rootNext]:[]});
async function loadedRootParent(h:ReturnType<typeof harness>){
 await loadedGuide(h,retainedPkg,retainedSeries);h.button('Cruciate ligaments').props.onClick();h.render();
 h.annotationLoads[0].resolve({annotation:retainedSeries.annotations[0],purpose:'scoped-display'});await flush();h.render();
 h.button('Inspect Synthetic body parent beside MRI').props.onClick({currentTarget:{focus(){}}});h.render();h.render();return h.find('test-inline-inspection');
}

test('explicit root-body handoff retains the compatible family across bundles and uses the committed native plane',async()=>{
 const proof={},owned=new WeakSet([proof]);let specimenCalls=0;
 const body=(...args:any[])=>args[6]===proof?{annotation:retainedPcl,label:'Synthetic next',targetId:rootNext.id}:null;
 const h=harness(rootComparison,null,()=>true,null,null,true,()=>{specimenCalls++;return null},()=>true,body,v=>!!v&&typeof v==='object'&&owned.has(v));
 try{const panel=await loadedRootParent(h),key=panel.key;assert.equal(panel.props.getMriSelectionLabel(proof),'Synthetic next');assert.equal(h.annotationCalls.length,1);
  panel.props.onSelectMri(proof);h.render();assert.equal(h.annotationCalls.length,2);assert.strictEqual(h.annotationCalls[1].annotation,retainedPcl);assert.equal(h.find('test-inline-inspection').key,key);assert.equal(h.find('test-inline-inspection').props.suspended,true);
  h.button('coronal').props.onClick();h.render();h.annotationLoads[1].resolve({annotation:retainedPcl,purpose:'scoped-display'});await flush();h.render();h.render();
  assert.equal(h.find('test-inline-inspection').key,key);assert.equal(h.find('test-inline-inspection').props.inspection.target.id,rootNext.id);assert.equal(h.seriesCalls.length,1);assert.equal(specimenCalls,0);
  assert.equal(h.frameCalls.at(-1)[2],'coronal');assert.equal(h.frameCalls.at(-1)[3],1);assert.match(words(h.tree()),/not patient-space registration/);
  assert.equal(nodes(h.tree()).filter(n=>n.props['aria-label']==='Current guided inspection step').length,0);
 }finally{h.cleanup();}
});

test('root-body callbacks refuse copied or no-longer-eligible selections and retired sequences',async()=>{
 const proof={},owned=new WeakSet([proof]);let allow=true;
 const h=harness(rootComparison,null,()=>true,null,null,true,()=>null,()=>true,
  (...args:any[])=>allow&&args[6]===proof?{annotation:retainedPcl,label:'Synthetic next',targetId:rootNext.id}:null,v=>!!v&&typeof v==='object'&&owned.has(v));
 try{const panel=await loadedRootParent(h);panel.props.onSelectMri({...proof});assert.equal(h.annotationCalls.length,1);
  const stale=panel.props.onSelectMri;allow=false;stale(proof);assert.equal(h.annotationCalls.length,1);allow=true;
  h.select('s2');h.render();stale(proof);assert.equal(h.annotationCalls.length,1);h.cleanup();stale(proof);assert.equal(h.annotationCalls.length,1);
 }finally{h.cleanup();}
});

test('root-body handoff preserves dirty correction refusal and a close during verification',async()=>{
 const proof={};let allow=false,prompts=0;
 const h=harness(rootComparison,'b'.repeat(64),()=>{prompts++;return allow},null,null,true,()=>null,()=>true,
  (...args:any[])=>args[6]===proof?{annotation:retainedPcl,label:'Synthetic next',targetId:rootNext.id}:null,v=>v===proof);
 try{await loadedRootParent(h);h.find('test-correction-panel').props.onDirtyChange(true);h.render();h.render();
  h.find('test-inline-inspection').props.onSelectMri(proof);h.render();assert.equal(prompts,1);assert.equal(h.annotationCalls.length,1);assert.strictEqual(h.frameCalls.at(-1)[1].annotation,retainedSeries.annotations[0]);
  allow=true;h.find('test-inline-inspection').props.onSelectMri(proof);h.render();assert.equal(h.annotationCalls.length,2);
  h.find('test-inline-inspection').props.onClose();h.render();h.annotationLoads[1].resolve({annotation:retainedPcl,purpose:'scoped-display'});await flush();h.render();h.render();
  assert.equal(nodes(h.tree()).filter(n=>n.type==='test-inline-inspection').length,0);assert.strictEqual(h.frameCalls.at(-1)[1].annotation,retainedPcl);
 }finally{h.cleanup();}
});

test('root-body mapping changes while loading cannot commit a stale annotation',async()=>{
 const proof={};let mappingCurrent=true;
 const h=harness(rootComparison,null,()=>true,null,null,true,()=>null,()=>mappingCurrent,
  (...args:any[])=>args[6]===proof?{annotation:retainedPcl,label:'Synthetic next',targetId:rootNext.id}:null,v=>v===proof);
 try{await loadedRootParent(h);h.find('test-inline-inspection').props.onSelectMri(proof);h.render();mappingCurrent=false;
  h.annotationLoads[1].resolve({annotation:retainedPcl,purpose:'scoped-display'});await flush();h.render();h.render();assert.equal(h.frameCalls.at(-1)[1],null);assert.doesNotMatch(words(h.tree()),/Showing the saved annotation/);
 }finally{h.cleanup();}
});

test('root-body answer inspection cannot replace an active practice question',async()=>{
 const proof={},comparison={...comparisonFixture,learning:{},targets:[rootParent]};let mappingCalls=0;
 const h=harness(comparison,null,()=>true,syntheticCheckFactory,syntheticLocationFactory,true,()=>null,()=>true,
  ()=>{mappingCalls++;return{annotation:retainedPcl,label:'Synthetic next',targetId:rootNext.id}},v=>v===proof);
 try{await locationCheck(h);h.find('test-structure-check').props.followup.props.onInspect(rootParent.id,{focus(){}});h.render();h.render();
  const panel=h.find('test-inline-inspection');assert.equal(panel.props.getMriSelectionLabel(proof),null);panel.props.onSelectMri(proof);h.render();
  assert.equal(mappingCalls,0);assert.equal(h.annotationCalls.length,1);assert.strictEqual(h.find('test-structure-check').props.overlay.annotation,accepted);
 }finally{h.cleanup();}
});
