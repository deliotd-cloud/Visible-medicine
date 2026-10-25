import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
import {registerLearningDraftGuard} from '../lib/learning-draft-navigation.ts';
import {lectureSavePresentation} from '../components/lecture-save-presentation.ts';
import * as lectureContent from '../lib/lecture-content.ts';
import * as anatomy from '../lib/lecture-anatomy-reference.ts';
import * as anatomyCollection from '../lib/lecture-anatomy-collection.ts';
import * as anatomyMatches from '../lib/lecture-anatomy-text-matches.ts';
import * as bodyAnatomy from '../lib/lecture-body-reference.ts';
import * as contextGuard from '../lib/studio-mutation-context.ts';

type Handler=(event:any)=>void;
class Events {
  listeners=new Map<string,Set<Handler>>();
  addEventListener(name:string,handler:Handler){(this.listeners.get(name)??this.listeners.set(name,new Set()).get(name)!).add(handler);}
  removeEventListener(name:string,handler:Handler){this.listeners.get(name)?.delete(handler);}
  fire(name:string,event:any){for(const handler of [...(this.listeners.get(name)??[])])handler(event);}
  count(name:string){return this.listeners.get(name)?.size??0;}
}
class Focusable {
  isConnected=true;
  hidden=false;
  inert=false;
  ancestorHidden=false;
  ancestorInert=false;
  disabled=false;
  rects=true;
  visibility='visible';
  focusNoop=false;
  focusThrows=false;
  focusCount=0;
  focusOptions:any[]=[];
  inside:Focusable|null=null;
  focus(options?:any){this.focusCount++;this.focusOptions.push(options);if(this.focusThrows)throw Error('Focus target unavailable');
    if(!this.focusNoop)(globalThis.document as any).activeElement=this;}
  getClientRects(){return this.rects?[{width:100,height:20}]:[];}
  hasAttribute(name:string){return name==='disabled'&&this.disabled;}
  matches(selector:string){return selector===':disabled'&&this.disabled;}
  closest(selector:string){return selector==='[hidden],[inert]'&&(this.hidden||this.inert||this.ancestorHidden||this.ancestorInert)?this:null;}
  contains(other:unknown){return other===this.inside;}
  querySelector(_selector:string):Focusable|null{return null;}
}
function nodes(value:any):any[]{
  if(!value||typeof value!=='object')return[];
  if(Array.isArray(value))return value.flatMap(nodes);
  return[value,...nodes(value.props?.children)];
}
const initial={id:'lecture-one',title:'Saved lecture',version:2,status:'draft',courseId:'course-one',courseTitle:'Synthetic course',
  slides:[{id:'slide-one',title:'Saved slide',body:'Saved content',referenceUrl:''}],canEdit:true,canReview:false,canPublish:false,reviews:[],published:null};
const context={actorId:'edu:one',organizationId:'org-one'};

function fixture(supportsNavigation=true){
  const original={window:Object.getOwnPropertyDescriptor(globalThis,'window'),document:Object.getOwnPropertyDescriptor(globalThis,'document'),HTMLElement:Object.getOwnPropertyDescriptor(globalThis,'HTMLElement')};
  const documentEvents=new Events(),navigationEvents=new Events(),windowEvents=new Events();
  const root=new Focusable(),toolbar=new Focusable(),inside=new Focusable();root.inside=inside;root.querySelector=()=>toolbar;
  const document=Object.assign(documentEvents,{location:{href:'https://synthetic.invalid/studio/workbooks/lecture-one/builder'},activeElement:new Focusable()});
  const prompts:string[]=[];let confirm=false;
  const window=Object.assign(windowEvents,{document,...(supportsNavigation?{navigation:navigationEvents}:{}),
    confirm(message:string){prompts.push(message);return confirm;},
    getComputedStyle(target:Focusable){return{visibility:target.visibility};},
    setTimeout(callback:()=>void){void callback;return 1;},clearTimeout(_id:number){},
  });
  Object.defineProperty(globalThis,'window',{value:window,configurable:true,writable:true});
  Object.defineProperty(globalThis,'document',{value:document,configurable:true,writable:true});
  Object.defineProperty(globalThis,'HTMLElement',{value:Focusable,configurable:true,writable:true});
  const slots:any[]=[],effects=new Map<number,{deps:unknown[];cleanup?:()=>void}>();let cursor=0,tree:any;
  const react={
    useState(value:any){const index=cursor++;if(!(index in slots))slots[index]=typeof value==='function'?value():value;
      return[slots[index],(next:any)=>{slots[index]=typeof next==='function'?next(slots[index]):next;}];},
    useRef(value:any){const index=cursor++;return slots[index]??=( {current:value} );},
    useMemo(factory:()=>any,deps:unknown[]){const index=cursor++,old=slots[index];if(!old||deps.some((v,i)=>!Object.is(v,old.deps[i])))slots[index]={deps,value:factory()};return slots[index].value;},
    useEffect(_effect:()=>void,_deps:unknown[]){cursor++;},
    useLayoutEffect(effect:()=>void|(()=>void),deps:unknown[]){const index=cursor++,old=effects.get(index);
      if(!old||deps.some((v,i)=>!Object.is(v,old.deps[i])))pending.push(()=>{old?.cleanup?.();const cleanup=effect();effects.set(index,{deps,cleanup:typeof cleanup==='function'?cleanup:undefined});});},
  };
  let pending:Array<()=>void>=[];
  const jsx=(type:any,props:any)=>({type,props});
  const source=readFileSync(process.env.LECTURE_DRAFT_EDITOR_SOURCE??new URL('../components/LectureEditor.tsx',import.meta.url),'utf8');
  const code=ts.transpileModule(source,{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText;
  const module={exports:{} as Record<string,any>};
  const lineage={WorkbookCorrectionLineage:()=>null,createWorkbookCorrectionLineageContext:()=>({begin:()=>Symbol('lineage'),finish(){},invalidate(){}})};
  const actualDependencies:Record<string,unknown>={
    '../lib/lecture-content.ts':lectureContent,
    '../lib/lecture-anatomy-reference.ts':anatomy,
    '../lib/lecture-anatomy-collection.ts':anatomyCollection,
    '../lib/lecture-anatomy-text-matches.ts':anatomyMatches,
    '../lib/lecture-body-reference.ts':bodyAnatomy,
    '../lib/studio-mutation-context.ts':contextGuard,
  };
  new Function('require','module','exports',code)((id:string)=>{
    if(id==='react')return react;
    if(id==='react/jsx-runtime')return{jsx,jsxs:jsx};
    if(id==='../lib/learning-draft-navigation.ts')return{registerLearningDraftGuard};
    if(id==='./lecture-save-presentation')return{lectureSavePresentation};
    if(id==='./WorkbookCorrectionLineage')return lineage;
    if(['./LecturePlayer','./WorkbookCorrection','./WorkbookRetirement'].includes(id))
      return{[id==='./LecturePlayer'?'LecturePlayer':id.slice(2)]:()=>null};
    if(id.endsWith('.css'))return{};
    assert(Object.hasOwn(actualDependencies,id),'Unexpected LectureEditor dependency: '+id);
    return actualDependencies[id];
  },module,module.exports);
  const editor=module.exports.LectureEditor;
  const render=()=>{cursor=0;pending=[];tree=editor({initial,courseOutline:[],expectedStudioContext:context});
    if(tree.props.ref)tree.props.ref.current=root;for(const run of pending)run();return tree;};
  render();
  const input=(value:string)=>nodes(tree).find(node=>node.type==='input'&&node.props?.value===value);
  const body=()=>nodes(tree).find(node=>node.type==='textarea'&&node.props?.value==='Saved content');
  const traverse=(options:Record<string,unknown>={})=>{
    const event={isTrusted:true,cancelable:true,defaultPrevented:false,navigationType:'traverse',
      destination:{url:'https://synthetic.invalid/studio/courses/course-one',sameDocument:true},signal:{aborted:false},
      prevented:false,stopped:false,immediatelyStopped:false,
      preventDefault(){this.prevented=true;this.defaultPrevented=true;},stopPropagation(){this.stopped=true;},stopImmediatePropagation(){this.immediatelyStopped=true;},...options};
    navigationEvents.fire('navigate',event);return event;
  };
  const click=()=>{
    const event={target:{closest:()=>({href:'https://synthetic.invalid/studio/courses/course-one',target:'',hasAttribute:()=>false})},
      button:0,ctrlKey:false,metaKey:false,shiftKey:false,altKey:false,defaultPrevented:false,prevented:false,
      preventDefault(){this.prevented=true;this.defaultPrevented=true;},stopPropagation(){},stopImmediatePropagation(){}};
    documentEvents.fire('click',event);return event;
  };
  const unload=()=>{const event={prevented:false,returnValue:'',preventDefault(){this.prevented=true;}};windowEvents.fire('beforeunload',event);return event;};
  return{render,input,body,traverse,click,unload,prompts,root,toolbar,inside,document,documentEvents,navigationEvents,windowEvents,
    setConfirm(value:boolean){confirm=value;},setFocusOnCancel(value:boolean){root.isConnected=value;},
    dispose(){for(const entry of effects.values())entry.cleanup?.();for(const [name,descriptor]of Object.entries(original)){
      if(descriptor)Object.defineProperty(globalThis,name,descriptor);else delete (globalThis as any)[name];
    }},
  };
}

test('actual lecture handlers protect immediate dirty title and slide edits on trusted traversal',()=>{
  const f=fixture();try{
    const title=f.input('Saved lecture');assert(title);title.props.onChange({target:{value:'Unsent lecture title'}});
    const slide=f.body();assert(slide);slide.props.onChange({target:{value:'Unsent slide body'}});
    const rejected=f.traverse();assert.equal(rejected.prevented,true);assert.equal(rejected.immediatelyStopped,true);
    assert.deepEqual(f.prompts,['You have unsaved lecture changes. Leave without saving?']);
    assert.equal(f.toolbar.focusCount,1);
    assert.deepEqual(f.toolbar.focusOptions,[{preventScroll:true}]);
    const tree=f.render();assert(nodes(tree).some(node=>node.type==='input'&&node.props.value==='Unsent lecture title'));
    assert(nodes(tree).some(node=>node.type==='textarea'&&node.props.value==='Unsent slide body'));
    f.setConfirm(true);const accepted=f.traverse();assert.equal(accepted.prevented,false);assert.equal(f.toolbar.focusCount,1);
  }finally{f.dispose();}
});

test('clean lecture traverses without warning or focus; unsupported and non-cancellable history retain their escape hatch',()=>{
  const f=fixture();try{assert.equal(f.traverse().prevented,false);assert.equal(f.prompts.length,0);
    assert.equal(f.toolbar.focusCount,0);assert.equal(f.root.focusCount,0);}finally{f.dispose();}
  const legacy=fixture(false);try{
    const title=legacy.input('Saved lecture');assert(title);title.props.onChange({target:{value:'Unsent'}});
    assert.equal(legacy.traverse().prevented,false);assert.equal(legacy.click().prevented,true);
    assert.equal(legacy.unload().prevented,true);assert.equal(legacy.unload().returnValue,'Unsaved lecture changes');
  }finally{legacy.dispose();}
  const noncancellable=fixture();try{
    const title=noncancellable.input('Saved lecture');assert(title);title.props.onChange({target:{value:'Unsent'}});
    assert.equal(noncancellable.traverse({cancelable:false}).prevented,false);assert.equal(noncancellable.prompts.length,0);
  }finally{noncancellable.dispose();}
});

test('rejected history focuses only a connected editor; cleanup removes all navigation protection',()=>{
  const f=fixture();try{
    const title=f.input('Saved lecture');assert(title);title.props.onChange({target:{value:'Unsent'}});
    f.setFocusOnCancel(false);assert.equal(f.traverse().prevented,true);assert.equal(f.toolbar.focusCount,0);
    assert.equal(f.navigationEvents.count('navigate'),1);assert.equal(f.documentEvents.count('click'),1);
  }finally{f.dispose();}
  assert.equal(f.navigationEvents.count('navigate'),0);assert.equal(f.documentEvents.count('click'),0);assert.equal(f.windowEvents.count('beforeunload'),0);
});

test('rejected history restores a visible active control without scrolling',()=>{
  const f=fixture();try{
    const title=f.input('Saved lecture');assert(title);title.props.onChange({target:{value:'Unsent'}});
    f.document.activeElement=f.inside;
    assert.equal(f.traverse().prevented,true);
    assert.equal(f.inside.focusCount,1);assert.deepEqual(f.inside.focusOptions,[{preventScroll:true}]);
    assert.equal(f.toolbar.focusCount,0);assert.equal(f.root.focusCount,0);
  }finally{f.dispose();}
});

test('unavailable active controls fall back to the toolbar, then to the named editor region',()=>{
  const states:Array<[string,(target:Focusable)=>void]>=[
    ['disabled',target=>{target.disabled=true;}],
    ['hidden',target=>{target.hidden=true;}],
    ['inert',target=>{target.inert=true;}],
    ['hidden ancestor',target=>{target.ancestorHidden=true;}],
    ['inert ancestor',target=>{target.ancestorInert=true;}],
    ['zero rects',target=>{target.rects=false;}],
    ['CSS hidden',target=>{target.visibility='hidden';}],
    ['focus no-op',target=>{target.focusNoop=true;}],
  ];
  for(const [label,change] of states){
    const f=fixture();try{
      const title=f.input('Saved lecture');assert(title);title.props.onChange({target:{value:'Unsent'}});
      f.document.activeElement=f.inside;change(f.inside);
      assert.equal(f.traverse().prevented,true,label);
      if(label==='focus no-op'){assert.equal(f.inside.focusCount,1,label);assert.equal(f.toolbar.focusCount,0,label);}
      else{assert.equal(f.toolbar.focusCount,1,label);assert.deepEqual(f.toolbar.focusOptions,[{preventScroll:true}],label);}
      assert.equal(f.root.focusCount,0,label);
    }finally{f.dispose();}
    const g=fixture();try{
      const title=g.input('Saved lecture');assert(title);title.props.onChange({target:{value:'Unsent'}});
      change(g.toolbar);
      assert.equal(g.traverse().prevented,true,label);
      assert.equal(g.root.focusCount,1,label);assert.deepEqual(g.root.focusOptions,[{preventScroll:true}],label);
      assert.equal(g.render().props['aria-label'],'Lecture editor',label);
    }finally{g.dispose();}
  }
});

test('hidden, inert, zero-rect and detached editor roots receive no focus',()=>{
  const states:Array<[string,(target:Focusable)=>void]>=[
    ['detached',target=>{target.isConnected=false;}],
    ['hidden',target=>{target.hidden=true;}],
    ['inert',target=>{target.inert=true;}],
    ['hidden ancestor',target=>{target.ancestorHidden=true;}],
    ['inert ancestor',target=>{target.ancestorInert=true;}],
    ['disabled',target=>{target.disabled=true;}],
    ['zero rects',target=>{target.rects=false;}],
    ['CSS hidden',target=>{target.visibility='hidden';}],
  ];
  for(const [label,change] of states){
    const f=fixture();try{
      const title=f.input('Saved lecture');assert(title);title.props.onChange({target:{value:'Unsent'}});
      change(f.root);assert.equal(f.traverse().prevented,true,label);
      assert.equal(f.inside.focusCount,0,label);assert.equal(f.toolbar.focusCount,0,label);assert.equal(f.root.focusCount,0,label);
    }finally{f.dispose();}
  }
});

test('focus recovery failure cannot escape after traversal was cancelled',()=>{
  const f=fixture();try{
    const title=f.input('Saved lecture');assert(title);title.props.onChange({target:{value:'Unsent'}});
    f.toolbar.focusThrows=true;
    assert.equal(f.traverse().prevented,true);
    assert.equal(f.prompts.length,1);
    assert.equal(f.root.focusCount,1);assert.deepEqual(f.root.focusOptions,[{preventScroll:true}]);
  }finally{f.dispose();}
});

test('shared two-argument default warning and unload text remain My Learning specific',()=>{
  const f=fixture(false);try{
    const guard=registerLearningDraftGuard(globalThis.window,()=>true);
    assert.equal(f.click().prevented,true);
    assert.equal(f.prompts.at(-1),'Your My Learning draft has unsaved changes. Leave this page and discard them?');
    assert.equal(f.unload().returnValue,'Unsaved learning edits');guard();
  }finally{f.dispose();}
});
