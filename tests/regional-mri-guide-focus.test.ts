import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import ts from 'typescript';

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

function harness(visibleGeometry=false){
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
    '../lib/regional-mri-render':{regionalMriFrame:()=>({width:3,height:3,displayAspect:1,pixels:new Uint8ClampedArray(36),labels:{left:'R',right:'L',top:'A',bottom:'P'},maskPixels:visibleGeometry?1:0,markers:[],segments:[],sampled:false,oblique:false}),regionalMriFocusSlice:()=>0},
    '../lib/regional-mri-3d-comparison':{regionalMri3dComparison:()=>({targets:[target],provisional:false})},
    '../lib/regional-mri-inline-inspection':{regionalMriInlineInspection:()=>({key:'acl-ref',target,proof:{modelFamily:'synthetic'}}),regionalMriInlineReferenceFamilyKey:()=> 'synthetic',regionalMriInlineCompatible:()=>true,regionalMriInlineContextCurrent:()=>true},
    '../lib/regional-mri-specimen-handoff':{regionalMriSpecimenHandoff:()=>null},'../lib/regional-mri-body-handoff':{regionalMriBodyHandoff:()=>null},'../lib/regional-mri-body-focus':{isCurrentRegionalMriBodySelection:()=>false},
    '../lib/regional-mri-guided-study':{regionalMriGuides:()=>[guide],regionalMriGuideAnnotation:(_pkg:any,_study:any,g:any,index:number,id:string)=>g===guide?g.steps[index]?.candidates.find((item:any)=>item.id===id&&item.review.status==='accepted-scoped')??null:null},
    '../lib/regional-mri-structure-check':{createRegionalMriStructureCheck:()=>null,createRegionalMriLocationCheck:()=>null},'../lib/regional-mri-practice-next':{regionalMriNextPracticeCandidates:()=>[]},
    '../lib/regional-mri-guide-practice-origin':{createRegionalMriGuidePracticeOrigin:()=>null,resolveRegionalMriGuidePracticeOrigin:()=>null},
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
  return{prepare,render,settle,replayLayouts,find,button,click,open,complete,loads,focuses,host,cleanup,focusIn,active:()=>active,paint:(value:boolean)=>{paint=value;},paints:()=>paintCount,all:()=>all(tree)};
}

test('start, next and previous announce their own committed heading once after successful load and imageReady',async()=>{
  const h=harness();try{await h.open();for(const [action,title,index] of [['Cruciate ligaments','ACL',1],['Next step','PCL',2],['Previous step','ACL',1]] as const){
    const before=h.focuses.length;h.click(action);const commit=h.prepare();assert.equal(h.focuses.length,before,'render alone cannot focus');commit();
    assert.equal(h.focuses.length,before,'pending geometry cannot focus');h.loads.shift()!.resolve();await flush();
    const loadedCommit=h.prepare();assert.equal(h.focuses.length,before,'resolved promise before commit cannot focus');loadedCommit();
    assert.equal(h.focuses.length,before,'canvas paint state needs a fresh imageReady render');h.settle();
    assert.deepEqual(h.focuses.slice(before),[`Step ${index} / 5 · ${title}`]);assert.equal(h.active(),h.host('guide-heading',`Step ${index} / 5 · ${title}`));h.replayLayouts();h.settle();assert.equal(h.focuses.length,before+1,'consumed request survives repeated layout setup');
  }}finally{h.cleanup();}
});

test('missing, multiple and withheld steps focus immediately on commit without substitute geometry',async()=>{
  const h=harness();try{await h.open();h.click('Cruciate ligaments');h.settle();await h.complete();h.click('Next step');h.settle();await h.complete();
    for(const [title,index] of [['Missing',3],['Multiple',4],['Withheld',5]] as const){const before=h.focuses.length;h.click('Next step');const commit=h.prepare();assert.equal(h.focuses.length,before);commit();
      assert.deepEqual(h.focuses.slice(before),[`Step ${index} / 5 · ${title}`]);assert.equal(h.loads.length,0,'no nearby or automatic variant load');
      assert(h.all().some(node=>node.props.role==='status'&&words(node).includes(title==='Missing'?'Missing':title==='Multiple'?'Multiple':'withheld')));h.settle();assert.equal(h.focuses.length,before+1);
    }
  }finally{h.cleanup();}
});

test('failed geometry and unavailable canvas paint never announce a successful guided image',async()=>{
  for(const failure of ['load','paint']){const h=harness();try{await h.open();h.click('Cruciate ligaments');h.settle();
    if(failure==='load')h.loads.shift()!.reject(new Error('Synthetic failure'));else{h.paint(false);h.loads.shift()!.resolve();}await flush();h.settle();assert.equal(h.focuses.length,0,failure);
  }finally{h.cleanup();}}
});

test('ordinary slice, plane, window, search and reference actions never repeat consumed guide focus',async()=>{
  const h=harness();try{await h.open();h.click('Cruciate ligaments');h.settle();await h.complete();assert.equal(h.focuses.length,1);
    h.click('Next slice');h.settle();h.click('coronal');h.settle();h.all().find(node=>node.type==='input'&&node.props.type==='number')!.props.onChange({currentTarget:{value:'120'}});h.settle();
    h.find('input','Search structures').props.onChange({currentTarget:{value:'ACL'}});h.settle();h.click('Inspect ACL reference beside MRI');h.settle();assert.equal(h.focuses.length,1);
  }finally{h.cleanup();}
});

test('explicit viewer interaction or another real focus target cancels pending focus before late completion',async()=>{
  for(const interaction of ['slice','plane','window','search','external focus']){const h=harness();try{await h.open();h.click('Cruciate ligaments');h.settle();
    if(interaction==='slice')h.click('Next slice');
    if(interaction==='plane')h.click('coronal');
    if(interaction==='window')h.all().find(node=>node.type==='input'&&node.props.type==='number')!.props.onChange({currentTarget:{value:'120'}});
    if(interaction==='search')h.find('input','Search structures').props.onChange({currentTarget:{value:'ACL'}});
    if(interaction==='external focus')h.focusIn(h.host('outside'));
    h.settle();await h.complete();assert.equal(h.focuses.length,0,interaction);
  }finally{h.cleanup();}}
});

test('cancelled, reset, source-retired and unmounted transitions cannot steal focus from stale completion',async()=>{
  for(const action of ['Leave guide','Close and reset','retire','unmount']){const h=harness();try{await h.open();h.click('Cruciate ligaments');h.settle();const pending=h.loads.shift()!;
    if(action==='unmount')h.cleanup();else if(action==='retire')h.settle(null);else{h.click(action);h.settle();}
    pending.resolve();await flush();if(action!=='unmount')h.settle(action==='retire'?null:pin);assert.equal(h.focuses.length,0,action);
  }finally{h.cleanup();}}
});

test('abandoned renders do not announce, and late retired loads cannot announce a replacement guide step',async()=>{
  const h=harness();try{await h.open();h.click('Cruciate ligaments');h.settle();const stale=h.loads.shift()!;h.click('Leave guide');h.settle();h.click('Cruciate ligaments');h.settle();
    stale.resolve();await flush();h.settle();assert.equal(h.focuses.length,0,'retired load');
    h.loads.shift()!.resolve();await flush();h.prepare();assert.equal(h.focuses.length,0,'abandoned settled-load render cannot focus');
    h.settle();assert.deepEqual(h.focuses,['Step 1 / 5 · ACL']);
  }finally{h.cleanup();}
});

test('independent source and dirty correction gates survive guide focus behavior',async()=>{
  const h=harness();try{h.settle(null);assert.equal(h.all().some(node=>node.type==='input'&&node.props.type==='file'),false);await h.open();h.click('Cruciate ligaments');h.settle();await h.complete();
    h.find('test-correction').props.onDirtyChange(true);h.settle();const before=h.focuses.length;h.click('Next step');h.settle();assert.equal(h.loads.length,0);assert.equal(h.focuses.length,before);
    assert.equal(words(h.find('h4')),'Step 1 / 5 · ACL');
  }finally{h.cleanup();}
});

test('dirty retained source retires a settled load before its imageReady focus commit',async()=>{
  const h=harness();try{await h.open();h.click('Cruciate ligaments');h.settle();h.loads.shift()!.resolve();await flush();
    h.render();assert.equal(h.focuses.length,0,'paint commit precedes imageReady commit');h.find('test-correction').props.onDirtyChange(true);
    h.settle({...pin,revision:'e'.repeat(64)});assert.equal(h.focuses.length,0);assert(h.all().some(node=>node.type==='button'&&words(node)==='Discard retained edits and open current source'));
    h.settle({...pin,revision:'e'.repeat(64)});assert.equal(h.focuses.length,0,'retained display is not permission to announce old work');
  }finally{h.cleanup();}
});

test('closing an inline reference during the next guide load preserves restored search focus after late completion',async()=>{
  const h=harness();try{await h.open();h.click('Cruciate ligaments');h.settle();await h.complete();h.click('Inspect ACL reference beside MRI');h.settle();
    h.click('Next step');h.settle();assert.equal(h.find('test-inline').props.suspended,true);const before=h.focuses.length;
    h.find('test-inline').props.onClose();assert.equal(h.focuses.length,before,'Close restores only after removal commits');h.settle();
    assert.deepEqual(h.focuses.slice(before),['search']);assert.equal(h.active(),h.host('search'));assert.equal(h.all().some(node=>node.type==='test-inline'),false);
    await h.complete();assert.deepEqual(h.focuses.slice(before),['search'],'late PCL success cannot steal restored focus');assert.equal(h.active(),h.host('search'));
    assert.equal(h.all().some(node=>node.type==='test-inline'),false,'late completion cannot reopen reference');
  }finally{h.cleanup();}
});

test('body focusin during disabled guide loading preserves eligible current heading focus',async()=>{
  const h=harness();try{await h.open();h.click('Cruciate ligaments');h.settle();assert.equal(h.button('Cruciate ligaments').props.disabled,true);
    h.focusIn(h.host('body'));assert.equal(h.focuses.length,0);await h.complete();assert.deepEqual(h.focuses,['Step 1 / 5 · ACL']);
  }finally{h.cleanup();}
});

test('explicit multiple-variant selection announces the same step again only after its selected owned image paints',async()=>{
  const h=harness();try{await h.open();h.click('Cruciate ligaments');h.settle();await h.complete();h.click('Next step');h.settle();await h.complete();
    h.click('Next step');h.settle();h.click('Next step');h.settle();assert.equal(h.focuses.at(-1),'Step 4 / 5 · Multiple');assert.equal(h.loads.length,0);
    const before=h.focuses.length;h.click('Inspect PCL in this sequence');h.settle();assert.equal(h.loads.length,1);assert.equal(h.loads[0].annotation,pcl,'explicit variant only');assert.equal(h.focuses.length,before);
    h.loads.shift()!.resolve();await flush();h.render();assert.equal(h.focuses.length,before,'selected variant waits for imageReady commit');h.settle();
    assert.deepEqual(h.focuses.slice(before),['Step 4 / 5 · Multiple']);h.replayLayouts();h.settle();assert.equal(h.focuses.length,before+1);
  }finally{h.cleanup();}
});

test('automatic guide advance waits for current painted geometry and never steals focus at the next step',async()=>{
 const h=harness(true);try{await h.open();h.click('Cruciate ligaments');h.settle();let player=h.find('test-playback');
  assert.equal(player.props.ready,false);assert.equal(player.props.onAdvance(1),false);assert.equal(h.loads.length,1);
  await h.complete();player=h.find('test-playback');assert.equal(player.props.ready,true);assert.equal(player.props.context,guide);
  for(const invalid of [0,2,NaN,99])assert.equal(player.props.onAdvance(invalid),false);
  assert.equal(player.props.onAdvance(1),true);assert.equal(player.props.onAdvance(1),false,'retired action cannot duplicate a load');
  h.settle();assert.equal(h.find('test-playback').props.ready,false);assert.equal(h.loads.length,1);assert.equal(h.loads[0].annotation,pcl);
  await h.complete();assert.equal(h.find('test-playback').props.ready,true);assert.deepEqual(h.focuses,['Step 1 / 5 · ACL']);
  assert.equal(h.find('test-playback').props.onAdvance(2),false,'missing next step is not skipped');assert.equal(h.loads.length,0);
  assert.equal(words(h.find('h4')),'Step 2 / 5 · PCL');
 }finally{h.cleanup();}
});

test('automatic guide playback refuses ambiguous/withheld targets, dirty edits and unpainted or retired source',async()=>{
 const h=harness(true);try{await h.open();h.click('Cruciate ligaments');h.settle();await h.complete();
  const old=h.find('test-playback').props.onAdvance;h.find('test-correction').props.onDirtyChange(true);
  assert.equal(old(1),false,'synchronous dirty gate precedes a parent render');h.settle();assert.equal(h.find('test-playback').props.blocked,true);assert.equal(h.loads.length,0);
  h.find('test-correction').props.onDirtyChange(false);h.settle();h.click('Next step');h.settle();await h.complete();
  h.click('Next step');h.settle();assert.equal(h.find('test-playback').props.blocked,true);h.click('Next step');h.settle();
  assert.equal(h.find('test-playback').props.blocked,true);assert.equal(h.loads.length,0,'no source variant automatically selected');
  h.click('Inspect ACL in this sequence');h.settle();await h.complete();assert.equal(h.find('test-playback').props.ready,true);
  assert.equal(h.find('test-playback').props.onAdvance(4),false,'deferred next geometry never loaded');assert.equal(h.loads.length,0);
  h.settle(null);assert.equal(old(1),false);assert.equal(h.loads.length,0);
 }finally{h.cleanup();}
 const undrawn=harness(true);try{await undrawn.open();undrawn.paint(false);undrawn.click('Cruciate ligaments');undrawn.settle();await undrawn.complete();assert.equal(undrawn.find('test-playback').props.ready,false);assert.equal(undrawn.find('test-playback').props.onAdvance(1),false);}finally{undrawn.cleanup();}
});

test('manual pointer, keyboard, wheel, focus and assistive click/change pause without intercepting playback controls',async()=>{
 const h=harness(true);try{await h.open();h.click('Cruciate ligaments');h.settle();await h.complete();let pauses=0;
  h.find('test-playback').props.pauseRef.current=()=>pauses++;
  const root=h.find('section','Regional MRI private review');
  for(const name of ['onPointerDownCapture','onKeyDownCapture','onWheelCapture','onFocusCapture','onClickCapture','onChangeCapture']){
   root.props[name]({target:{closest:()=>null}});root.props[name]({target:{closest:(selector:string)=>selector==='[data-regional-guide-playback]'?{}:null}});
  }
  assert.equal(pauses,6);assert.equal(h.loads.length,0);assert.deepEqual(h.focuses,['Step 1 / 5 · ACL']);
 }finally{h.cleanup();}
});

test('speculative and stale automatic callbacks cannot load an annotation after a newer commit or unmount',async()=>{
 const h=harness(true);try{await h.open();h.click('Cruciate ligaments');h.settle();await h.complete();const old=h.find('test-playback').props.onAdvance;
  h.prepare();assert.equal(h.find('test-playback').props.onAdvance(1),false,'not committed');h.settle();assert.equal(old(1),false,'old render callback');
  const current=h.find('test-playback').props.onAdvance;h.cleanup();assert.equal(current(1),false);assert.equal(h.loads.length,0);
 }finally{h.cleanup();}
});
