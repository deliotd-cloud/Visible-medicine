import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import ts from 'typescript';

// Actual viewer component with synthetic loader and handoff boundary stubs.
// The small host reconciler models connected DOM nodes and post-commit refs.
const source=readFileSync(new URL('../components/RegionalMriReviewViewer.tsx',import.meta.url),'utf8');
const code=ts.transpileModule(source,{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
type Tree={type:any;props:Record<string,any>;key?:string|null};
const all=(value:any):Tree[]=>Array.isArray(value)?value.flatMap(all):value?.props?[value,...all(value.props.children)]:[];
const words=(value:any):string=>Array.isArray(value)?value.map(words).join(''):value?.props?words(value.props.children):value==null?'':String(value);
const flush=async()=>{await Promise.resolve();await Promise.resolve();};
const revision='a'.repeat(64),pin={revision,label:'Synthetic knee',region:'knee'};
const acl={id:'ACL',anatomyId:'anat.knee.lig.anterior_cruciate_ligament',label:'ACL',seriesId:'s1',sourceImageSha256:'b'.repeat(64),laterality:'left',coverage:'partial',review:{status:'accepted-scoped',revision:'c'.repeat(64),scope:'Synthetic sequence only'},geometry:{kind:'points'}};
const pcl={...acl,id:'PCL',label:'PCL',anatomyId:'anat.knee.lig.posterior_cruciate_ligament'};
const series={id:'s1',label:'Synthetic sequence',image:{shape_kji:[2,2,2],dtype:'uint8',sha256:acl.sourceImageSha256},annotations:[acl,pcl]};
const pkg={revision,manifest:{region:'knee',series:[series]}};
const study={series,range:[0,255],geometry:{views:{axial:{sliceCount:2},coronal:{sliceCount:2},sagittal:{sliceCount:2}}}};
const guide={id:'cruciate',title:'Cruciate ligaments',revision:'synthetic-guide',sourceRevision:revision,sequenceId:'s1',imageSha256:acl.sourceImageSha256,
  steps:[{title:'ACL',caption:'Synthetic only',anatomyId:acl.anatomyId,source:{href:'https://pubmed.ncbi.nlm.nih.gov/8600743/',title:'Synthetic source'},candidates:[acl]},
    {title:'PCL',caption:'Synthetic only',anatomyId:pcl.anatomyId,source:{href:'https://pubmed.ncbi.nlm.nih.gov/8600743/',title:'Synthetic source'},candidates:[pcl]}]};
const targets={ACL:{id:'acl-ref',kind:'specimen',label:'ACL reference',side:'right',relation:'group-reference',oppositeSide:true,href:'/atlas/lower-limb-3d?specimenPart=acl',modelFamily:'specimen-family'},
  PCL:{id:'pcl-ref',kind:'specimen',label:'PCL reference',side:'right',relation:'group-reference',oppositeSide:true,href:'/atlas/lower-limb-3d?specimenPart=pcl',modelFamily:'specimen-family'}};
type Host={isConnected:boolean;focus:(options?:any)=>void;open?:boolean;contains?:(node:Host)=>boolean;querySelector?:(selector:string)=>Host|null;clientWidth?:number;clientHeight?:number;getContext?:()=>any};

function harness(){
  const module={exports:{} as any},pendingLoads:Array<(value:any)=>void>=[];
  let cursor=0,slots:any[]=[],effects=new Map<number,any>(),pending=new Map<number,any>(),tree:Tree,active:Host|null=null,focuses:Host[]=[];
  const hosts=new Map<string,Host>();
  const host=(key:string)=>{let element=hosts.get(key);if(!element){element={isConnected:true,focus(options?:any){assert.equal(options?.preventScroll,true);if(element?.isConnected){active=element;focuses.push(element);}}};hosts.set(key,element);}return element;};
  const hooks={
    useState(initial:any){const index=cursor++;if(!(index in slots))slots[index]=typeof initial==='function'?initial():initial;return[slots[index],(value:any)=>{slots[index]=typeof value==='function'?value(slots[index]):value;}];},
    useRef(initial:any){const index=cursor++;if(!(index in slots))slots[index]={current:initial};return slots[index];},
    useMemo(fn:()=>any,_deps:any[]){cursor++;return fn();},
    useLayoutEffect(fn:()=>any,deps:any[]){pending.set(cursor++,{kind:'layout',fn,deps});},
    useEffect(fn:()=>any,deps:any[]){pending.set(cursor++,{kind:'passive',fn,deps});},
  };
  const comparison=(overlay:any)=>({atlasRevision:'1'.repeat(40),mappingRevision:'2'.repeat(64),provisional:false,targets:[targets[overlay.annotation.id as 'ACL'|'PCL']]});
  const inspection=(_source:any,_catalogue:any,_pkg:any,_study:any,overlay:any,targetId:string)=>{
    const target=comparison(overlay).targets.find(item=>item.id===targetId);return target?{key:targetId,target,proof:{modelFamily:'specimen-family',mriRevision:revision,seriesId:'s1'}}:null;
  };
  const imports:Record<string,any>={react:hooks,'react/jsx-runtime':{jsx:(type:any,props:any,key:any)=>({type,props,key}),jsxs:(type:any,props:any,key:any)=>({type,props,key})},
    '../lib/slice-wheel.mjs':{bindSliceWheel:()=>()=>{}},
    '../lib/regional-mri-package':{openLocalRegionalMriPackage:async()=>pkg,loadRegionalMriSeries:async()=>study,
      loadRegionalMriAnnotation:(_pkg:any,_study:any,annotation:any)=>new Promise(resolve=>pendingLoads.push(value=>resolve(value??{annotation,purpose:'scoped-display',focus:[0,0,0]})))},
    '../lib/regional-mri-render':{regionalMriFrame:()=>({width:2,height:2,displayAspect:1,pixels:new Uint8ClampedArray(16),labels:{left:'R',right:'L',top:'A',bottom:'P'},maskPixels:0,markers:[],segments:[],sampled:false,oblique:false}),regionalMriFocusSlice:()=>0},
    '../lib/regional-mri-3d-comparison':{regionalMri3dComparison:(_source:any,_catalogue:any,_pkg:any,_study:any,overlay:any)=>comparison(overlay)},
    '../lib/regional-mri-inline-inspection':{regionalMriInlineInspection:inspection,regionalMriInlineReferenceFamilyKey:()=> 'same-specimen-family',regionalMriInlineCompatible:(a:any,b:any)=>a?.proof.modelFamily===b?.proof.modelFamily,regionalMriInlineContextCurrent:()=>true},
    '../lib/regional-mri-specimen-handoff':{regionalMriSpecimenHandoff:(_source:any,_catalogue:any,_pkg:any,_study:any,_overlay:any,_inspection:any,selection:any)=>selection===ownedSelection?{annotation:pcl,label:'PCL',targetId:targets.PCL.id}:null},
    '../lib/regional-mri-body-handoff':{regionalMriBodyHandoff:()=>null},'../lib/regional-mri-body-focus':{isCurrentRegionalMriBodySelection:()=>false},
    '../lib/regional-mri-guided-study':{regionalMriGuides:()=>[guide],regionalMriGuideAnnotation:(_pkg:any,_study:any,g:any,index:number,id:string)=>g===guide?g.steps[index]?.candidates.find((item:any)=>item.id===id)??null:null},
    '../lib/regional-mri-structure-check':{createRegionalMriStructureCheck:()=>null,createRegionalMriLocationCheck:()=>null},
    '../lib/regional-mri-practice-next':{regionalMriNextPracticeCandidates:()=>[]},
    '../lib/regional-mri-guide-practice-origin':{createRegionalMriGuidePracticeOrigin:()=>null,resolveRegionalMriGuidePracticeOrigin:()=>null},
    './RegionalMriInlineInspection':{RegionalMriInlineInspection:'test-inline'},'./RegionalMriCorrectionPanel':{RegionalMriCorrectionPanel:'test-correction'},
    './RegionalMriGuidePlayback':{RegionalMriGuidePlayback:'test-playback'},
    './RegionalMriLearning':{RegionalMriLearning:'test-learning'},'./RegionalMriStructureCheck':{RegionalMriStructureCheck:'test-check'},
    './RegionalMriPracticeFollowup':{RegionalMriPracticeFollowup:'test-followup'},'../lib/head-atlas-geometry.mjs':{},'./regional-mri-review.css':{},
  };
  new Function('require','module','exports','ResizeObserver','window',code)((id:string)=>{assert(Object.hasOwn(imports,id),id);return imports[id];},module,module.exports,class{observe(){}disconnect(){}},{confirm:()=>true});
  function commit(){for(const kind of ['layout','passive'])for(const [index,item] of pending){if(item.kind!==kind)continue;const previous=effects.get(index);if(!previous||!item.deps||item.deps.some((dep:any,i:number)=>!Object.is(dep,previous.deps[i]))){previous?.cleanup?.();effects.set(index,{...item,cleanup:item.fn()});}}}
  function render(input:any=pin){pending=new Map();cursor=0;const outer=module.exports.RegionalMriReviewViewer({source:input,comparisons:null});
    tree=typeof outer.type==='function'?outer.type(outer.props):outer;
    const present=new Set<string>();
    const found=all(tree);const selected=found.find(n=>n.type==='details'&&words(n).startsWith('Compare in 3D'));
    const detailsKey=selected?`details:${selected.key}`:null;
    if(selected&&detailsKey){const detail=host(detailsKey);const summary=host(`${detailsKey}:summary`);detail.open=detail.open??false;detail.querySelector=()=>summary;
      detail.contains=(node:Host)=>[...hosts].some(([key,item])=>key.startsWith(`launcher:${selected.key}:`)&&item===node);
      selected.props.ref.current=detail;present.add(detailsKey);present.add(`${detailsKey}:summary`);}
    for(const n of found){if(n.type==='h2'&&n.props.ref){n.props.ref.current=host('heading');present.add('heading');}
      if(n.type==='input'&&n.props.type==='search'&&n.props.ref){n.props.ref.current=host('search');present.add('search');}
      if(n.type==='div'&&n.props.ref&&String(n.props.className).includes('__viewport')){const item=host('viewport');item.clientWidth=400;item.clientHeight=400;n.props.ref.current=item;present.add('viewport');}
      if(n.type==='canvas'&&n.props.ref){const item=host('canvas');item.getContext=()=>({createImageData:()=>({data:new Uint8ClampedArray(16)}),putImageData(){},beginPath(){},moveTo(){},lineTo(){},stroke(){},arc(){},fill(){}});n.props.ref.current=item;present.add('canvas');}
      if(n.type==='button'&&words(n).startsWith('Inspect ')&&words(n).endsWith(' beside MRI')){present.add(`launcher:${selected?.key}:${words(n)}`);}
    }
    for(const [key,item] of hosts)item.isConnected=present.has(key);
    commit();return tree;
  }
  function find(type:string,name?:string){const node=all(tree).find(item=>item.type===type&&(!name||words(item)===name));assert(node,`missing ${type} ${name??''}`);return node;}
  function button(name:string){return find('button',name);}
  function launch(name:string){const key=`launcher:${all(tree).find(n=>n.type==='details'&&words(n).startsWith('Compare in 3D'))?.key}:${name}`;
    const element=host(key);assert(element.isConnected);button(name).props.onClick({currentTarget:element});return element;}
  async function load(){render();find('input').props.onChange({currentTarget:{files:[{name:'manifest.json'}]}});await flush();render();find('select').props.onChange({currentTarget:{value:'s1'}});await flush();render();button('Cruciate ligaments').props.onClick();render();pendingLoads.shift()?.(undefined);await flush();render();}
  function cleanup(){for(const item of effects.values())item.cleanup?.();effects.clear();for(const item of hosts.values())item.isConnected=false;}
  return{render,find,button,launch,load,pendingLoads,active:()=>active,focuses,host,cleanup,all:()=>all(tree)};
}
const ownedSelection={};

test('ordinary Close restores the connected launcher only after the inline pane is removed',async()=>{
  const h=harness();try{await h.load();const launcher=h.launch('Inspect ACL reference beside MRI');h.render();const close=h.find('test-inline').props.onClose;
    assert.equal(h.active(),null);close();assert.equal(h.active(),null,'Close cannot focus before removal commits');h.render();
    assert.equal(h.active(),launcher);assert.equal(h.all().some(n=>n.type==='test-inline'),false);
  }finally{h.cleanup();}
});

test('ordinary Close reopens a collapsed current comparison before focusing its connected launcher',async()=>{
  const h=harness();try{await h.load();const launcher=h.launch('Inspect ACL reference beside MRI');h.render();
    const details=h.all().find(n=>n.type==='details'&&words(n).startsWith('Compare in 3D'));assert(details);
    details.props.ref.current.open=false;h.find('test-inline').props.onClose();h.render();
    assert.equal(details.props.ref.current.open,true);assert.equal(h.active(),launcher);
  }finally{h.cleanup();}
});

test('compatible ACL→PCL guide and reverse handoff close into the current comparison, never the detached ACL launcher',async()=>{
  for(const reverse of [false,true]){const h=harness();try{await h.load();const old=h.launch('Inspect ACL reference beside MRI');h.render();
      if(reverse)h.find('test-inline').props.onSelectMri(ownedSelection);else h.button('Next step').props.onClick();
      h.render();assert.equal(h.find('test-inline').props.suspended,true);h.pendingLoads.shift()?.(undefined);await flush();h.render();
      assert.equal(old.isConnected,false);assert.equal(h.find('test-inline').props.inspection.target.id,'pcl-ref');
      const current=h.all().find(n=>n.type==='details'&&words(n).startsWith('Compare in 3D'));assert(current);
      const summary=current.props.ref.current.querySelector('summary');const close=h.find('test-inline').props.onClose;
      close();assert.equal(h.active(),null);h.render();assert.equal(h.active(),summary);assert.equal(current.props.ref.current.open,true);
      assert.equal(h.all().some(n=>n.type==='test-inline'),false);assert.equal(h.focuses.includes(old),false);
    }finally{h.cleanup();}}
});

test('missing current comparison falls back to connected search, and retired or unmounted Close cannot focus',async()=>{
  const h=harness();try{await h.load();h.launch('Inspect ACL reference beside MRI');h.render();const retiredClose=h.find('test-inline').props.onClose;
    h.button('Next step').props.onClick();h.render();
    retiredClose();h.render();assert.equal(h.active(),null,'retired close cannot act');
    h.find('test-inline').props.onClose();h.render();assert.equal(h.active(),h.host('search'));
    h.pendingLoads.shift()?.(undefined);await flush();h.render();h.find('select').props.onChange({currentTarget:{value:''}});h.render();const before=h.focuses.length;retiredClose();h.render();assert.equal(h.focuses.length,before);
    h.cleanup();retiredClose();assert.equal(h.focuses.length,before);
  }finally{h.cleanup();}
});
