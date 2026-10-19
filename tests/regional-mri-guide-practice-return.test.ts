import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import ts from 'typescript';

type CardNode={type:any;props:Record<string,any>};
const nodes=(v:any):CardNode[]=>Array.isArray(v)?v.flatMap(nodes):v?.props?[v,...nodes(v.props.children)]:[];
const text=(v:any):string=>Array.isArray(v)?v.map(text).join(''):v?.props?text(v.props.children):v==null?'':String(v);
const cardSource=readFileSync(new URL('../components/RegionalMriStructureCheck.tsx',import.meta.url),'utf8');
const cardCode=ts.transpileModule(cardSource,{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
function cardHarness(real?:{api:any;context:any}){
 let cursor=0,slots:any[]=[],pending=new Map<number,{kind:string;fn:()=>any}>(),effects=new Map<number,()=>void>(),tree:CardNode;
 const calls:string[]=[],owners=new WeakMap<object,any>();let closes=0,focuses=0,shownAnswers=0,nexts=0,headingFocuses=0;
 const hooks={useRef(value:any){const i=cursor++;return slots[i]??=( {current:value});},useState(value:any){const i=cursor++;if(!(i in slots))slots[i]=value;return[slots[i],(v:any)=>{slots[i]=typeof v==='function'?v(slots[i]):v;}];},useLayoutEffect(fn:()=>any){pending.set(cursor++,{kind:'layout',fn});},useEffect(fn:()=>any){pending.set(cursor++,{kind:'passive',fn});}};
 const runtime={jsx:(type:any,props:any)=>({type,props}),jsxs:(type:any,props:any)=>({type,props})};
 const valid=(c:any,p:any,s:any,o:any)=>{const a=owners.get(c);return a&&a.pkg===p&&a.study===s&&a.overlay===o;};
 const api={gradeRegionalMriStructureCheck(c:any,p:any,s:any,o:any,id:string){calls.push('grade');return real?real.api.gradeRegionalMriStructureCheck(c,p,s,o,id):!valid(c,p,s,o)||!c.options.some((x:any)=>x.id===id)?'unavailable':id==='right'?'correct':'incorrect';},
  revealRegionalMriStructureCheck(c:any,p:any,s:any,o:any){calls.push('reveal');return real?real.api.revealRegionalMriStructureCheck(c,p,s,o):valid(c,p,s,o)?c.options.find((x:any)=>x.id==='right'):null;},
  gradeRegionalMriLocationCheck(c:any,p:any,s:any,o:any,f:any,plane:string,slice:number,x:number,y:number){calls.push('location-grade');return real?real.api.gradeRegionalMriLocationCheck(c,p,s,o,f,plane,slice,x,y):!valid(c,p,s,o)||owners.get(c).frame!==f||plane!=='axial'||slice!==0?'unavailable':x===1&&y===1?'correct':'incorrect';},
  revealRegionalMriLocationCheck(c:any,p:any,s:any,o:any){calls.push('location-reveal');return real?real.api.revealRegionalMriLocationCheck(c,p,s,o):valid(c,p,s,o)?c.targetLabel:null;}};
 const module={exports:{} as any};new Function('require','module','exports',cardCode)((id:string)=>({'react':hooks,'react/jsx-runtime':runtime,'../lib/regional-mri-structure-check':api}[id]??assert.fail(id)),module,module.exports);
 function context(){const value={pkg:{},study:{},overlay:{},check:Object.freeze({key:Math.random().toString(),revision:'synthetic-question-v1',prompt:'Which saved annotation?',options:Object.freeze([{id:'wrong',label:'Distractor'},{id:'right',label:'Target structure'},{id:'other',label:'Another structure'}])})};owners.set(value.check,value);return value;}
 function locationContext(){const value:any={...context(),location:Object.freeze({key:'synthetic-location',revision:'synthetic-location-v1',prompt:'Locate saved target extent.',targetLabel:'Target structure'}),mode:'locate',frame:{width:3,height:3},plane:'axial',slice:0};owners.set(value.location,value);return value;}
 let props:any={...(real?.context??context()),retired:false,imageReady:true,annotationVisible:true,onClose:()=>closes++,onFocus:()=>focuses++,onShowAnswer:()=>shownAnswers++,onModeChange:(mode:string)=>{props={...props,mode,pick:null};}};
 function commit(kind?:string){for(const current of kind?[kind]:['layout','passive'])for(const[i,effect]of pending)if(effect.kind===current){effects.get(i)?.();effects.set(i,effect.fn());}}
 function render(next?:any,doCommit=true,passive=true){if(next)props={...props,...next};cursor=0;pending=new Map();const value=module.exports.RegionalMriStructureCheck(props);if(doCommit){tree=value;const heading=nodes(value).find(n=>n.type==='h3');if(heading)heading.props.ref.current={focus:(options:any)=>{assert.deepEqual(options,{preventScroll:true});headingFocuses++;}};commit('layout');if(passive)commit('passive');}return value;}
 function button(label:string,value=tree){const n=nodes(value).find(n=>n.type==='button'&&text(n)===label);assert(n,label);return n;}
 function unmount(){for(const fn of effects.values())fn?.();effects.clear();}
 return{render,button,unmount,context,locationContext,calls,text:()=>text(tree),props:()=>props,closes:()=>closes,focuses:()=>focuses,shownAnswers:()=>shownAnswers,nexts:()=>nexts,headingFocuses:()=>headingFocuses,addNext:()=>()=>nexts++,flushPassive:()=>commit('passive'),replay:()=>{unmount();commit();}};
}
test('generic card return is optional, has a generic label, navigates paused image views, and refuses stale ownership',()=>{
 const h=cardHarness();try{
 h.render();assert.doesNotMatch(h.text(),/Return to guided step/);let returns=0;const onReturnToGuide=()=>returns++;
 h.render({onReturnToGuide,imageReady:false,annotationVisible:false});assert.equal(h.button('Return to guided step').props.disabled,false);
 assert.equal(h.button('Return to guided step').props.title,undefined);assert.equal(text(h.button('Return to guided step')),'Return to guided step');
 h.button('Return to guided step').props.onClick();assert.equal(returns,1);assert.equal(h.calls.length,0);
 const stale=h.button('Return to guided step').props.onClick;const abandoned=h.render({...h.context()},false);
 h.button('Return to guided step',abandoned).props.onClick();assert.equal(returns,1);
 h.render({...h.context()});stale();assert.equal(returns,1);
 const retired=h.button('Return to guided step').props.onClick;h.render({retired:true});assert.equal(h.button('Return to guided step').props.disabled,true);
 retired();h.button('Return to guided step').props.onClick();assert.equal(returns,1);
 h.render({retired:false});const current=h.button('Return to guided step').props.onClick;h.unmount();current();assert.equal(returns,1);
 }finally{h.unmount();}
});

// Execute the actual viewer with synthetic local data. This is a connected-host
// hook contract, not browser, GPU, accessibility-tool or clinical acceptance.
const code=ts.transpileModule(readFileSync(new URL('../components/RegionalMriReviewViewer.tsx',import.meta.url),'utf8'),
  {compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
type Tree={type:any;props:Record<string,any>;key?:string|null};
const all=(value:any):Tree[]=>Array.isArray(value)?value.flatMap(all):value?.props?[value,...all(value.props.children)]:[];
const words=(value:any):string=>Array.isArray(value)?value.map(words).join(''):value?.props?words(value.props.children):value==null?'':String(value);
const flush=async()=>{await Promise.resolve();await Promise.resolve();};
const revision='a'.repeat(64),pin={revision,label:'Synthetic knee',region:'knee'};
const acl={id:'ACL',anatomyId:'anat.knee.lig.anterior_cruciate_ligament',label:'ACL',seriesId:'s1',sourceImageSha256:'b'.repeat(64),laterality:'left',coverage:'partial',review:{status:'accepted-scoped',revision:'c'.repeat(64),scope:'Synthetic only'},geometry:{kind:'points'}};
const pcl={...acl,id:'PCL',label:'PCL',anatomyId:'anat.knee.lig.posterior_cruciate_ligament'};
const withheld={...acl,id:'withheld',label:'Withheld',review:{...acl.review,status:'deferred'}};
const series={id:'s1',label:'Synthetic sequence',image:{shape_kji:[3,3,3],dtype:'uint8',sha256:acl.sourceImageSha256},annotations:[acl,pcl,withheld]};
const pkg={revision,manifest:{region:'knee',series:[series]}};
const study={series,range:[0,255],geometry:{views:{axial:{sliceCount:3},coronal:{sliceCount:3},sagittal:{sliceCount:3}}}};
const step=(title:string,candidates:any[])=>({title,caption:'Synthetic only',anatomyId:acl.anatomyId,source:{href:'https://example.org/synthetic',title:'Synthetic source'},candidates});
const guide={id:'cruciate',title:'Cruciate ligaments',revision:'synthetic-guide',sourceRevision:revision,sequenceId:'s1',imageSha256:acl.sourceImageSha256,
  steps:[step('ACL',[acl]),step('PCL',[pcl]),step('Missing',[]),step('Multiple',[acl,pcl]),step('Withheld',[withheld])]};
type Host={isConnected:boolean;label:string;focus:(options?:any)=>void;contains:(target:any)=>boolean;[key:string]:any};
type Hooks={cursor:number;slots:any[];effects:Map<number,any>;pending:Map<number,any>};
const context=():Hooks=>({cursor:0,slots:[],effects:new Map(),pending:new Map()});
const changed=(a:any[]|undefined,b:any[]|undefined)=>!a||!b||a.length!==b.length||b.some((value,index)=>!Object.is(value,a[index]));

function harness(){
  let originValid=true; const origins=new WeakMap<object,any>(); const captured:any[]=[];
  const createOrigin=(source:any,p:any,s:any,o:any,position:any)=>{if(source!==pin||p!==pkg||s!==study||!position||position.guide!==guide||position.guide.steps[position.index]?.candidates.includes(o.annotation)!==true)return null;const origin=Object.freeze({});origins.set(origin,{guide:position.guide,index:position.index,annotation:o.annotation});captured.push(origin);return origin;};
  const resolveOrigin=(origin:any,source:any,p:any,s:any,gs:any[])=>originValid&&source===pin&&p===pkg&&s===study&&gs.includes(guide)?origins.get(origin)??null:null;
  const parent=context(),session=context(),module={exports:{} as any};let current=parent,tree:Tree,dirty=false,mounted=true,paint=true,paintCount=0,sessionKey:any;
  const hosts=new Map<string,Host>(),refs=new Set<any>(),focuses:string[]=[],listeners=new Map<string,Set<(event:any)=>void>>();
  let active:Host|null=null;
  const document={get activeElement(){return active;},body:null as any,
    addEventListener(name:string,listener:any){if(!listeners.has(name))listeners.set(name,new Set());listeners.get(name)!.add(listener);},
    removeEventListener(name:string,listener:any){listeners.get(name)?.delete(listener);}};
  const focusIn=(target:Host)=>{active=target;for(const fn of listeners.get('focusin')??[])fn({target});};
  const host=(key:string,label=key)=>{let element=hosts.get(key);if(!element){element={isConnected:true,label,contains(target:any){return target===element;},focus(options:any){assert.equal(options?.preventScroll,true);if(element!.isConnected){focuses.push(element!.label);focusIn(element!);}}};hosts.set(key,element);}element.label=label;return element;};
  document.body=host('body');
  const loads:Array<{annotation:any;resolve:(value?:any)=>void;reject:(error:Error)=>void}>=[];
  const hooks={
    useState(initial:any){const owner=current,index=owner.cursor++;if(!(index in owner.slots))owner.slots[index]=typeof initial==='function'?initial():initial;
      return[owner.slots[index],(value:any)=>{const next=typeof value==='function'?value(owner.slots[index]):value;if(!Object.is(next,owner.slots[index])){owner.slots[index]=next;dirty=true;}}];},
    useRef(initial:any){const index=current.cursor++;return current.slots[index]??(current.slots[index]={current:initial});},
    useMemo(fn:()=>any,deps:any[]){const index=current.cursor++,previous=current.slots[index];if(!previous||changed(previous.deps,deps))current.slots[index]={deps,value:fn()};return current.slots[index].value;},
    useLayoutEffect(fn:any,deps:any[]){current.pending.set(current.cursor++,{kind:'layout',fn,deps});},
    useEffect(fn:any,deps:any[]){current.pending.set(current.cursor++,{kind:'passive',fn,deps});},
  };
  const target={id:'acl-ref',kind:'specimen',label:'ACL reference',side:'right',relation:'group-reference',oppositeSide:true,href:'/atlas/lower-limb-3d',modelFamily:'synthetic'};
  const imports:Record<string,any>={react:hooks,'react/jsx-runtime':{jsx:(type:any,props:any,key:any)=>({type,props,key}),jsxs:(type:any,props:any,key:any)=>({type,props,key})},
    '../lib/slice-wheel.mjs':{bindSliceWheel:()=>()=>{}},
    '../lib/regional-mri-package':{openLocalRegionalMriPackage:async()=>pkg,loadRegionalMriSeries:async()=>study,
      loadRegionalMriAnnotation:(_pkg:any,_study:any,annotation:any)=>new Promise((resolve,reject)=>loads.push({annotation,reject,resolve:(value)=>resolve(value??{annotation,purpose:'scoped-display',focus:[0,0,0]})}))},
    '../lib/regional-mri-render':{regionalMriFrame:()=>({width:3,height:3,displayAspect:1,pixels:new Uint8ClampedArray(36),labels:{left:'R',right:'L',top:'A',bottom:'P'},maskPixels:0,markers:[],segments:[],sampled:false,oblique:false}),regionalMriFocusSlice:()=>0},
    '../lib/regional-mri-3d-comparison':{regionalMri3dComparison:()=>({targets:[target],provisional:false})},
    '../lib/regional-mri-inline-inspection':{regionalMriInlineInspection:()=>({key:'acl-ref',target,proof:{modelFamily:'synthetic'}}),regionalMriInlineReferenceFamilyKey:()=> 'synthetic',regionalMriInlineCompatible:()=>true,regionalMriInlineContextCurrent:()=>true},
    '../lib/regional-mri-specimen-handoff':{regionalMriSpecimenHandoff:()=>null},'../lib/regional-mri-body-handoff':{regionalMriBodyHandoff:()=>null},'../lib/regional-mri-body-focus':{isCurrentRegionalMriBodySelection:()=>false},
    '../lib/regional-mri-guided-study':{regionalMriGuides:()=>[guide],regionalMriGuideAnnotation:(_pkg:any,_study:any,g:any,index:number,id:string)=>g===guide?g.steps[index]?.candidates.find((item:any)=>item.id===id&&item.review.status==='accepted-scoped')??null:null},
    '../lib/regional-mri-guide-practice-origin':{createRegionalMriGuidePracticeOrigin:createOrigin,resolveRegionalMriGuidePracticeOrigin:resolveOrigin},
    '../lib/regional-mri-structure-check':{createRegionalMriStructureCheck:(_p:any,_s:any,o:any)=>({key:o.annotation.id,prompt:'Identify annotation',options:[]}),createRegionalMriLocationCheck:(_p:any,_s:any,o:any)=>({key:o.annotation.id,targetLabel:o.annotation.label})},'../lib/regional-mri-practice-next':{regionalMriNextPracticeCandidates:(_p:any,_s:any,o:any)=>[o.annotation===acl?pcl:acl]},
    './RegionalMriGuidePlayback':{RegionalMriGuidePlayback:'test-playback'},
    './RegionalMriInlineInspection':{RegionalMriInlineInspection:'test-inline'},'./RegionalMriCorrectionPanel':{RegionalMriCorrectionPanel:'test-correction'},'./RegionalMriLearning':{RegionalMriLearning:'test-learning'},'./RegionalMriStructureCheck':{RegionalMriStructureCheck:'test-check'},'./RegionalMriPracticeFollowup':{RegionalMriPracticeFollowup:'test-followup'},'../lib/head-atlas-geometry.mjs':{},'./regional-mri-review.css':{},
  };
  new Function('require','module','exports','ResizeObserver','window','document','HTMLElement',code)((id:string)=>{assert(Object.hasOwn(imports,id),id);return imports[id];},module,module.exports,class{observe(){}disconnect(){}},{confirm:()=>false,document},document,Object);
  function effectCommit(owner:Hooks,kind:string){for(const [index,item] of owner.pending){if(item.kind!==kind)continue;const previous=owner.effects.get(index);if(!previous||changed(previous.deps,item.deps)){previous?.cleanup?.();owner.effects.set(index,{...item,cleanup:item.fn()});}}}
  function prepare(source:any=pin){assert(mounted);dirty=false;for(const owner of [parent,session]){owner.cursor=0;owner.pending=new Map();}current=parent;
    const outer=module.exports.RegionalMriReviewViewer({source,comparisons:null,correctionProjectionRevision:'d'.repeat(64)});
    if(typeof outer.type==='function'){if(sessionKey!==undefined&&sessionKey!==outer.key){cleanupContext(session);session.slots=[];}sessionKey=outer.key;current=session;tree=outer.type(outer.props);}else tree=outer;
    return()=>{
      if(typeof outer.type!=='function'&&sessionKey!==undefined){cleanupContext(session);session.slots=[];sessionKey=undefined;}
      const present=new Set<string>(['body','outside']);for(const ref of refs)typeof ref==='function'?ref(null):ref.current=null;refs.clear();
      for(const node of all(tree)){if(!node.props.ref)continue;let key=node.type==='h4'?'guide-heading':node.type==='h2'?'heading':node.type==='canvas'?'canvas':node.type==='details'?'details':node.props.type==='search'?'search':node.props.className?.includes('__viewport')?'viewport':`ref:${node.type}`;
        const element=host(key,node.type==='h4'?words(node):key);present.add(key);element.clientWidth=400;element.clientHeight=400;
        if(key==='canvas')element.getContext=()=>paint?{createImageData:()=>({data:new Uint8ClampedArray(36)}),putImageData(){paintCount++;},beginPath(){},moveTo(){},lineTo(){},stroke(){},arc(){},fill(){}}:null;
        element.querySelector=()=>null;const ref=node.props.ref;refs.add(ref);typeof ref==='function'?ref(element):ref.current=element;
      }
      for(const [key,element] of hosts)element.isConnected=present.has(key);
      // All host refs attach before layout effects; canvas paint schedules state
      // for a later render, so an earlier render cannot observe imageReady yet.
      for(const kind of ['layout','passive'])for(const owner of [parent,session])effectCommit(owner,kind);
      return tree;
    };
  }
  function render(source:any=pin){return prepare(source)();}
  function settle(source:any=pin){let count=0;do{render(source);assert(++count<20,'render loop');}while(dirty);return tree;}
  function find(type:string,name?:string){const node=all(tree).find(item=>item.type===type&&(!name||words(item)===name||item.props['aria-label']===name||(name==='Search structures'&&item.props.type==='search')));assert(node,`missing ${type} ${name??''}`);return node;}
  function button(name:string){return find('button',name);}
  function click(name:string){const node=button(name);assert(!node.props.disabled,`${name} disabled`);node.props.onClick({currentTarget:host(`button:${name}`)});}
  async function open(){settle();find('input').props.onChange({currentTarget:{files:[{name:'manifest.json'}]}});await flush();settle();find('select').props.onChange({currentTarget:{value:'s1'}});await flush();settle();assert.equal(focuses.length,0);}
  async function complete(){assert(loads.length);loads.shift()!.resolve();await flush();settle();}
  function cleanupContext(owner:Hooks){for(const effect of owner.effects.values())effect.cleanup?.();owner.effects.clear();}
  function cleanup(){if(!mounted)return;mounted=false;cleanupContext(parent);cleanupContext(session);for(const element of hosts.values())element.isConnected=false;}
  function replayLayouts(){for(const owner of [parent,session])for(const effect of owner.effects.values())if(effect.kind==='layout')effect.fn();}
  return{captured,invalidate:()=>{originValid=false;},prepare,render,settle,replayLayouts,find,button,click,open,complete,loads,focuses,host,cleanup,focusIn,active:()=>active,paint:(value:boolean)=>{paint=value;},paints:()=>paintCount,all:()=>all(tree)};
}

const check=(h:ReturnType<typeof harness>)=>h.find('test-check');
async function practice(h:ReturnType<typeof harness>,variant=false){
 await h.open();h.click('Cruciate ligaments');h.settle();await h.complete();
 if(variant){h.click('Next step');h.settle();await h.complete();h.click('Next step');h.settle();h.click('Next step');h.settle();h.click('Inspect PCL in this sequence');h.settle();await h.complete();}
 (h as any).dirtyCorrection=h.find('test-correction').props.onDirtyChange;
 h.click('Try structure check');h.settle();assert.equal(check(h).props.overlay.annotation,variant?pcl:acl);
}
async function advance(h:ReturnType<typeof harness>){check(h).props.onNext();h.settle();await h.complete();}
function returnGuide(h:ReturnType<typeof harness>){const fn=check(h).props.onReturnToGuide;assert.equal(typeof fn,'function','current guided-origin return callback');fn();}

test('guide origin survives mode switch and Next, hides teaching metadata, and ordinary inspection keeps the practiced annotation',async()=>{
 const h=harness();try{await practice(h);assert.equal(h.captured.length,1);const origin=h.captured[0];
 assert.equal(typeof check(h).props.onReturnToGuide,'function');assert.equal(h.all().some(n=>n.type==='h4'),false);
 assert.doesNotMatch(words(h.all()),/Synthetic only|Draft teaching source/);
 check(h).props.onModeChange('locate');h.settle();await advance(h);assert.equal(check(h).props.mode,'locate');assert.equal(check(h).props.overlay.annotation,pcl);
 assert.equal(h.captured.length,1);assert.equal(h.captured[0],origin);check(h).props.onClose();h.settle();
 assert.equal(h.loads.length,0);assert.equal(h.all().some(n=>n.props['aria-label']==='Current guided inspection step'),false);h.click('Try structure check');h.settle();assert.equal(check(h).props.overlay.annotation,pcl);assert.equal(check(h).props.onReturnToGuide,undefined);
 }finally{h.cleanup();}
});

test('explicit return reloads the exact selected variant, holds the question while loading, and focuses only after owned paint commit',async()=>{
 const h=harness();try{await practice(h,true);await advance(h);assert.equal(check(h).props.overlay.annotation,acl);
 const before=h.focuses.length;returnGuide(h);h.settle();assert.equal(check(h).props.retired,true);assert.equal(check(h).props.overlay.annotation,acl);
 assert.equal(h.loads.length,1);assert.equal(h.loads[0].annotation,pcl);assert.equal(h.focuses.length,before);
 h.loads.shift()!.resolve();await flush();const commit=h.prepare();assert.equal(h.focuses.length,before);commit();assert.equal(h.focuses.length,before);
 h.settle();assert.equal(h.all().some(n=>n.type==='test-check'),false);assert.deepEqual(h.focuses.slice(before),['Step 4 / 5 · Multiple']);
 assert.equal(h.loads.length,0);h.replayLayouts();h.settle();assert.equal(h.focuses.length,before+1);
 }finally{h.cleanup();}
});

test('return rejection retains its previous question, without fallback geometry or guide focus',async()=>{
 const h=harness();try{await practice(h);await advance(h);const held=check(h).props.overlay,before=h.focuses.length;
 returnGuide(h);h.settle();assert.equal(h.loads.length,1);h.loads.shift()!.reject(new Error('synthetic return unavailable'));await flush();h.settle();
 assert.equal(check(h).props.overlay,held);assert.equal(check(h).props.retired,false);assert.equal(h.loads.length,0);assert.equal(h.focuses.length,before);assert.equal(h.all().some(n=>n.type==='h4'),false);
 }finally{h.cleanup();}
});

test('return revalidates opaque origin at activation and preserves the dirty correction gate',async()=>{
 for(const reason of ['invalid','dirty']){const h=harness();try{await practice(h);const fn=check(h).props.onReturnToGuide;assert.equal(typeof fn,'function');
 if(reason==='invalid')h.invalidate();else (h as any).dirtyCorrection(true);
 h.settle();const before=h.focuses.length;fn();h.settle();assert.equal(h.loads.length,0,reason);assert.equal(h.focuses.length,before);assert(check(h));
 if(reason==='invalid')assert.equal(check(h).props.onReturnToGuide,undefined);
 }finally{h.cleanup();}}
});

test('stale, abandoned, retired and unmounted return callbacks cannot load or focus',async()=>{
 for(const reason of ['stale','abandoned','retired','unmounted']){const h=harness();try{await practice(h);let fn=check(h).props.onReturnToGuide;assert.equal(typeof fn,'function');
 if(reason==='stale'){check(h).props.onModeChange('locate');h.settle();}
 if(reason==='abandoned'){h.prepare();fn=check(h).props.onReturnToGuide;}
 if(reason==='retired')h.settle(null);
 if(reason==='unmounted')h.cleanup();
 const before=h.focuses.length;fn();assert.equal(h.loads.length,0,reason);assert.equal(h.focuses.length,before);
 }finally{h.cleanup();}}
});

test('late return load cannot restore retired source or unmounted viewer, and missing paint cannot focus',async()=>{
 for(const reason of ['retired','unmounted','paint']){const h=harness();try{await practice(h);await advance(h);returnGuide(h);h.settle();const pending=h.loads.shift()!,before=h.focuses.length;
 if(reason==='retired')h.settle(null);if(reason==='unmounted')h.cleanup();if(reason==='paint')h.paint(false);
 pending.resolve();await flush();if(reason!=='unmounted')h.settle(reason==='retired'?null:pin);assert.equal(h.focuses.length,before,reason);
 if(reason==='paint'){assert.equal(h.all().some(n=>n.type==='h4'&&words(n).includes('ACL')),false,'undrawn return cannot expose guided teaching');assert.equal(check(h).props.retired,true);}
 }finally{h.cleanup();}}
});

test('ordinary annotation practice has no origin or return callback',async()=>{
 const h=harness();try{await h.open();h.all().find(n=>n.type==='button'&&all(n).some(child=>child.type==='span'&&words(child)==='ACL'))!.props.onClick();h.settle();await h.complete();h.click('Try structure check');h.settle();assert.equal(h.captured.length,0);assert.equal(check(h).props.onReturnToGuide,undefined);}finally{h.cleanup();}
});

test('return rejects wrong annotation ownership and an origin invalidated during its load',async()=>{
 for(const reason of ['wrong annotation','invalidated origin']){const h=harness();try{await practice(h);await advance(h);const held=check(h).props.overlay,before=h.focuses.length;
 returnGuide(h);h.settle();const pending=h.loads.shift()!;
 if(reason==='invalidated origin')h.invalidate();
 pending.resolve(reason==='wrong annotation'?{annotation:pcl,purpose:'scoped-display',focus:[0,0,0]}:undefined);await flush();h.settle();
 assert.equal(check(h).props.overlay,held,reason);assert.equal(h.loads.length,0);assert.equal(h.focuses.length,before);assert.equal(h.all().some(n=>n.props['aria-label']==='Current guided inspection step'),false);
 }finally{h.cleanup();}}
});

test('cancel return preserves the practiced question and retires pending load or unpainted restoration',async()=>{
 for(const phase of ['loading','painting']){const h=harness();try{await practice(h);await advance(h);const held=check(h).props.overlay,before=h.focuses.length;
 assert.equal(h.all().some(n=>n.type==='button'&&words(n)==='Cancel return to guide'),false);
 returnGuide(h);h.settle();const pending=h.loads.shift()!;
 if(phase==='painting'){h.paint(false);pending.resolve();await flush();h.settle();}
 assert.equal(check(h).props.retired,true);h.click('Cancel return to guide');h.settle();assert.equal(check(h).props.overlay,held);assert.equal(check(h).props.retired,false);
 assert.equal(h.all().some(n=>n.type==='button'&&words(n)==='Cancel return to guide'),false);
 if(phase==='loading'){pending.resolve();await flush();h.settle();}
 h.paint(true);h.settle();assert.equal(check(h).props.overlay,held);assert.equal(h.focuses.length,before);assert.equal(h.loads.length,0);
 assert.equal(h.all().some(n=>n.props['aria-label']==='Current guided inspection step'),false);
 }finally{h.cleanup();}}
});

