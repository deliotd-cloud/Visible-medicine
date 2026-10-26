import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {join, resolve} from 'node:path';
import {pathToFileURL, fileURLToPath} from 'node:url';

const site=process.env.WORKBOOK_SITE_ROOT??fileURLToPath(new URL('../',import.meta.url));
const requireSite=createRequire(join(site,'package.json'));
const ts=requireSite('typescript');
const React=requireSite('react');
const {registerLearningDraftGuard}=await import(pathToFileURL(join(site,'lib/learning-draft-navigation.ts')).href);
const {isStudioPageLeavingClick}=await import(pathToFileURL(join(site,'lib/studio-navigation-guard.ts')).href);
const sourcePath=resolve(process.env.WORKBOOK_EDITOR_SOURCE??join(site,'components/EducationRuntime.tsx'));
const source=readFileSync(sourcePath,'utf8').replace('function WorkbookBuilder({','export function WorkbookBuilder({');
const code=ts.transpileModule(source,{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText;

const educationCase={id:'case-1',position:1,title:'Synthetic teaching case',description:'Synthetic cleared case',classification:'radiology',version:3,maxMarks:5,questions:[]};
const workbook={id:'workbook-1',title:'Saved workbook',mode:'teaching',status:'draft',durationMinutes:60,dualDisplayAllowed:true,caseIds:['case-1'],version:2,authorId:'author-1',integrityHash:'1234567890abcdef',latestReviewDecision:null,latestReviewComment:null,latestReviewerName:null};
const data={currentUser:{id:'author-1',roles:['instructor']},workbooks:[workbook],draftWorkbookDetails:[],cases:[educationCase],teachingNotes:[{caseId:'case-1'}],recoveryComparisons:[],accessibleWorkbooks:[],learners:[],workbookAssignments:[],cohorts:[]};
function nodes(value){if(!value||typeof value!=='object')return[];if(Array.isArray(value))return value.flatMap(nodes);return[value,...nodes(value.props?.children)];}
class Events {listeners=new Map();addEventListener(name,fn){(this.listeners.get(name)??this.listeners.set(name,new Set()).get(name)).add(fn);}removeEventListener(name,fn){this.listeners.get(name)?.delete(fn);}fire(name,event){for(const fn of [...(this.listeners.get(name)??[])])fn(event);}count(name){return this.listeners.get(name)?.size??0;}}
function fixture({native=true,assessment=false}={}){
  const prior={window:Object.getOwnPropertyDescriptor(globalThis,'window'),document:Object.getOwnPropertyDescriptor(globalThis,'document'),Element:Object.getOwnPropertyDescriptor(globalThis,'Element'),HTMLAnchorElement:Object.getOwnPropertyDescriptor(globalThis,'HTMLAnchorElement')};
  const workingData=assessment?{...data,workbooks:[{...workbook,mode:'assessment'}],cases:[{...educationCase,questions:[{id:'question-1',prompt:'Saved prompt'}]}]}:data;
  const documentEvents=new Events(),windowEvents=new Events(),navigationEvents=new Events();
  const href='https://example.test/studio/workbooks/workbook-1/builder';
  const document=Object.assign(documentEvents,{location:{href},activeElement:null});
  let confirmReturn=false;const prompts=[];
  const window=Object.assign(windowEvents,{document,...(native?{navigation:navigationEvents}:{}),confirm(message){prompts.push(message);return confirmReturn;},setTimeout(){return 1;},clearTimeout(){}});
  class LinkTarget{constructor(url){this.href=url;this.target='';}closest(){return this;}hasAttribute(){return false;}}
  for(const [name,value] of Object.entries({window,document,Element:LinkTarget,HTMLAnchorElement:LinkTarget}))Object.defineProperty(globalThis,name,{value,writable:true,configurable:true});
  const slots=[],effects=new Map();let cursor=0,pending=[],tree;
  const hooks={...React,
    useState(initial){const at=cursor++;if(!(at in slots))slots[at]=typeof initial==='function'?initial():initial;return[slots[at],next=>{slots[at]=typeof next==='function'?next(slots[at]):next;}];},
    useRef(initial){const at=cursor++;return slots[at]??={current:initial};},
    useMemo(factory,deps){const at=cursor++,old=slots[at];if(!old||deps.some((v,i)=>!Object.is(v,old.deps[i])))slots[at]={deps,value:factory()};return slots[at].value;},
    useCallback(fn){cursor++;return fn;},
    useEffect(fn,deps){effect(fn,deps);},useLayoutEffect(fn,deps){effect(fn,deps);},
  };
  function effect(fn,deps){const at=cursor++,old=effects.get(at);if(!old||deps.some((v,i)=>!Object.is(v,old.deps[i])))pending.push(()=>{old?.cleanup?.();const cleanup=fn();effects.set(at,{deps,cleanup:typeof cleanup==='function'?cleanup:null});});}
  const mocks={
    react:hooks,'react/jsx-runtime':requireSite('react/jsx-runtime'),
    './EducationQuestionResponse':{EducationQuestionResponse:()=>null},'./WorkbookRetirement':{WorkbookRetirement:()=>null},'./WorkbookCorrection':{WorkbookCorrection:()=>null},
    './WorkbookCorrectionLineage':{WorkbookCorrectionLineage:()=>null,createWorkbookCorrectionLineageContext:()=>({begin:()=>Symbol(),finish(){},invalidate(){}})},
    './FractureEducationWorkspace':{FractureEducationWorkspace:()=>null},'next/link':({children,...props})=>React.createElement('a',props,children),'next/dynamic':()=>()=>null,
    '@/components/BrandLockup':{BrandLockup:()=>null},'@/lib/teaching-content':{introductoryTeachingSlides:()=>[],keyPointsFromBody:()=>[]},
    '@/lib/attempt-policy':{remainingAttemptSeconds:()=>0},'@/lib/live-refresh-policy':{liveRefreshDelay:()=>1000},'@/lib/latest-view-request':{createLatestViewRequest:()=>({begin:()=>({finish:()=>true})})},
    '@/lib/workbook-workflow-request':{hasWorkbookWorkflowBinding:()=>false,workbookWorkflowRequest:()=>null},
    '../lib/learning-draft-navigation.ts':{registerLearningDraftGuard},'../lib/studio-navigation-guard.ts':{isStudioPageLeavingClick},
  };
  const module={exports:{}};
  new Function('require','module','exports',code)(name=>name in mocks?mocks[name]:requireSite(name),module,module.exports);
  const WorkbookBuilder=module.exports.WorkbookBuilder;
  function render(){cursor=0;pending=[];tree=WorkbookBuilder({data:workingData,busy:false,postAction:async()=>workingData,focusWorkbookId:workbook.id,returnTo:'/studio/courses/course-1',courseOutline:{title:'Course',items:[{id:workbook.id,title:workbook.title}]}});for(const run of pending)run();return tree;}
  function editTitle(value){const field=nodes(render()).find(node=>node.type==='input'&&node.props?.value==='Saved workbook');assert(field,'mounted title field');field.props.onChange({target:{value}});render();}
  function editQuestion(){const field=nodes(render()).find(node=>node.type==='textarea'&&node.props?.value==='Saved prompt');assert(field,'mounted assessment question');field.props.onChange({target:{value:'Unsent prompt'}});render();}
  function traverse(options={}){const event={isTrusted:true,cancelable:true,defaultPrevented:false,navigationType:'traverse',destination:{url:'https://example.test/studio/courses/course-1',sameDocument:true},signal:{aborted:false},prevented:false,preventDefault(){this.prevented=true;this.defaultPrevented=true;},stopPropagation(){},stopImmediatePropagation(){},...options};navigationEvents.fire('navigate',event);return event;}
  function click(){const event={target:new LinkTarget('https://example.test/studio/courses/course-1'),button:0,ctrlKey:false,metaKey:false,shiftKey:false,altKey:false,defaultPrevented:false,prevented:false,preventDefault(){this.prevented=true;this.defaultPrevented=true;},stopPropagation(){},stopImmediatePropagation(){}};documentEvents.fire('click',event);return event;}
  function clickExternal(){const event={target:new LinkTarget('https://outside.test/'),button:0,ctrlKey:false,metaKey:false,shiftKey:false,altKey:false,defaultPrevented:false,prevented:false,preventDefault(){this.prevented=true;this.defaultPrevented=true;},stopPropagation(){},stopImmediatePropagation(){}};documentEvents.fire('click',event);return event;}
  function unload(){const event={prevented:false,returnValue:'',preventDefault(){this.prevented=true;}};windowEvents.fire('beforeunload',event);return event;}
  render();
  return{render,editTitle,editQuestion,traverse,click,clickExternal,unload,prompts,documentEvents,windowEvents,navigationEvents,async saveDraft(){const button=nodes(render()).find(node=>node.type==='button'&&node.props?.className==='primary-button'&&node.props?.ref);assert(button,'mounted save control');button.props.onClick();await Promise.resolve();await Promise.resolve();render();},setConfirm(value){confirmReturn=value;},dispose(){for(const value of effects.values())value.cleanup?.();for(const [name,descriptor]of Object.entries(prior)){if(descriptor)Object.defineProperty(globalThis,name,descriptor);else delete globalThis[name];}}};
}

test('whole workbook builder cancels rejected dirty Back and permits approved Back',()=>{const f=fixture();try{assert.equal(f.traverse().prevented,false);f.editTitle('Unsent title');assert.equal(f.traverse().prevented,true);assert.deepEqual(f.prompts,['You have unsaved content changes. Leave without saving?']);assert(nodes(f.render()).some(node=>node.type==='input'&&node.props?.value==='Unsent title'));f.setConfirm(true);assert.equal(f.traverse().prevented,false);}finally{f.dispose();}});
test('dirty workbook keeps original link and unload protection; clean state has no unload warning',()=>{const f=fixture();try{assert.equal(f.unload().prevented,false);f.editTitle('Unsent title');assert.equal(f.click().prevented,true);assert.equal(f.prompts.length,1);assert.equal(f.clickExternal().prevented,true);assert.equal(f.prompts.length,2);assert.equal(f.unload().prevented,true);assert.equal(f.unload().returnValue,'');}finally{f.dispose();}assert.equal(f.documentEvents.count('click'),0);assert.equal(f.windowEvents.count('beforeunload'),0);assert.equal(f.navigationEvents.count('navigate'),0);});
test('unsupported or noncancellable history retains fallback link/unload protection',()=>{const old=fixture({native:false});try{old.editTitle('Unsent title');assert.equal(old.traverse().prevented,false);assert.equal(old.click().prevented,true);assert.equal(old.unload().prevented,true);}finally{old.dispose();}const f=fixture();try{f.editTitle('Unsent title');assert.equal(f.traverse({cancelable:false}).prevented,false);assert.equal(f.prompts.length,0);}finally{f.dispose();}});

test('clean, edit, save and unmount update the whole builder guard lifecycle',async()=>{const f=fixture();try{assert.equal(f.traverse().prevented,false);assert.equal(f.windowEvents.count('beforeunload'),0);f.editTitle('Unsent title');assert.equal(f.traverse().prevented,true);await f.saveDraft();assert.equal(f.traverse().prevented,false);assert.equal(f.windowEvents.count('beforeunload'),0);}finally{f.dispose();}assert.equal(f.documentEvents.count('click'),0);assert.equal(f.navigationEvents.count('navigate'),0);});

test('assessment question edit is protected by the same whole builder history guard',()=>{const f=fixture({assessment:true});try{f.editQuestion();assert.equal(f.traverse().prevented,true);assert(nodes(f.render()).some(node=>node.type==='textarea'&&node.props?.value==='Unsent prompt'));}finally{f.dispose();}});
