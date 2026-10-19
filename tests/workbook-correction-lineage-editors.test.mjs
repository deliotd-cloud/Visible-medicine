import {expectedStudioContext,comparisonResponse,isComparison,installComparisonFetch} from './lecture-context-fixture.mjs';
installComparisonFetch();
import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),React=require('react'),ts=require('typescript');
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
function compileText(text,mocks={}){
 const code=ts.transpileModule(text,{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText,module={exports:{}};
 new Function('require','module','exports',code)(name=>Object.hasOwn(mocks,name)?mocks[name]:require(name),module,module.exports);
 return module.exports;
}
const contract=compileText(read('lib/workbook-correction-lineage-contract.ts'),{'./workbook-correction-contract.ts':compileText(read('lib/workbook-correction-contract.ts'))});
const lineage=compileText(read('components/WorkbookCorrectionLineage.tsx'),{'../lib/workbook-correction-lineage-contract.ts':contract,'./workbook-correction-lineage.css':{}});
const walk=(node,predicate)=>Array.isArray(node)?node.map(child=>walk(child,predicate)).find(Boolean):node?.props?(predicate(node)?node:walk(node.props.children,predicate)):null;
const words=node=>Array.isArray(node)?node.map(words).join(''):node?.props?words(node.props.children):typeof node==='string'||typeof node==='number'?String(node):'';
const tick=()=>new Promise(resolve=>setImmediate(resolve));
const deferred=()=>{let resolve;const promise=new Promise(done=>{resolve=done;});return{resolve,promise};};
console.log(JSON.stringify({scope:'Actual lecture component and TypeScript-AST extracted production runtime functions/authoring JSX; synthetic network, snapshot and React hook boundaries',pins:Object.fromEntries(['components/EducationRuntime.tsx','components/LectureEditor.tsx','components/WorkbookCorrectionLineage.tsx'].map(path=>[path,createHash('sha256').update(read(path)).digest('hex')]))}));

const initialLecture={id:'draft:lecture',title:'Synthetic lecture',version:1,status:'draft',courseId:'course:one',courseTitle:'Synthetic course',
 slides:[{id:'slide-one',title:'Slide title',body:'Synthetic teaching text',referenceUrl:''}],reviews:[],published:null,canEdit:true,canReview:false,canPublish:false};
function lectureFixture(patch={},commitInitial=true){
 const savedGlobals=new Map(['window','document','fetch'].map(name=>[name,Object.getOwnPropertyDescriptor(globalThis,name)]));
 Object.defineProperty(globalThis,'window',{configurable:true,value:{confirm:()=>true,addEventListener(){},removeEventListener(){}}});
 Object.defineProperty(globalThis,'document',{configurable:true,value:{addEventListener(){},removeEventListener(){}}});
 const values=[],effects=new Map(),calls=[];let index=0,tree,pending=[],reply=null,props={initial:{...structuredClone(initialLecture),...patch},courseOutline:[],authorityKey:'actor:org',expectedStudioContext};
 const hooks={...React,useMemo:create=>create(),useRef:value=>{const at=index++;return values[at]??={current:value};},
  useState:seed=>{const at=index++;if(!(at in values))values[at]=typeof seed==='function'?seed():seed;return[values[at],next=>{values[at]=typeof next==='function'?next(values[at]):next;}];},
  useEffect(create,deps){const at=index++,old=effects.get(at);if(!old||deps.length!==old.deps.length||deps.some((value,i)=>value!==old.deps[i]))pending.push(()=>{old?.cleanup?.();effects.set(at,{deps,cleanup:create()});});},
 };
 hooks.useLayoutEffect=hooks.useEffect;
 globalThis.fetch=async(url,options)=>{calls.push({url,options,body:options?.body?JSON.parse(options.body):null});if(reply instanceof Error)throw reply;return reply;};
 const component=compileText(read('components/LectureEditor.tsx'),{'react':hooks,'./LecturePlayer':{LecturePlayer:'player'},'./WorkbookRetirement':{WorkbookRetirement:'retirement'},'./WorkbookCorrection':{WorkbookCorrection:'correction'},
  './WorkbookCorrectionLineage':{...lineage,WorkbookCorrectionLineage:'lineage'},'./lecture-editor.css':{}}).LectureEditor;
 function render(next=props,commit=true){props=next;index=0;pending=[];const rendered=component(props);if(commit){tree=rendered;for(const effect of pending)effect();}return rendered;}
 const uncommittedTree=render(props,commitInitial);const context=walk(uncommittedTree,node=>node.type==='lineage').props.context;
 const find=predicate=>{const node=walk(tree,predicate);assert(node,'Expected production lecture node');return node;};
 const button=label=>find(node=>node.type==='button'&&words(node)===label);
 function unmount(){for(const effect of effects.values())effect.cleanup?.();}
 return{render,abandon:next=>render(next,false),context,calls,find,button,unmount,uncommittedTree,setReply:value=>{reply=value;},
  get props(){return props;},get tree(){return tree;},lineage:()=>find(node=>node.type==='lineage').props,
  editTitle(value){find(node=>node.type==='input'&&node.props.value===initialLecture.title).props.onChange({target:{value}});render();},
  dispose(){unmount();for(const[name,descriptor]of savedGlobals){if(descriptor)Object.defineProperty(globalThis,name,descriptor);else delete globalThis[name];}}
 };
}
const lectureModes=[
 ['save',{},h=>{h.editTitle('Unsaved local title');h.button('Save').props.onClick();}],
 ['request-review',{},h=>{h.button('Review').props.onClick();h.render();h.button('Request review').props.onClick();}],
 ['review',{status:'in-review',canReview:true},h=>{h.button('Review').props.onClick();h.render();h.find(node=>node.type==='form').props.onSubmit({preventDefault(){}});}],
 ['publish',{status:'approved',canPublish:true},h=>{h.button('Review').props.onClick();h.render();h.button('Publish approved version').props.onClick();}],
 ['reopen-anatomy',{status:'approved',canReopenAnatomy:true},h=>h.find(node=>node.type==='button'&&words(node).includes('Reopen')).props.onClick()],
 ['reload',{},h=>h.button('Reload saved version').props.onClick()],
];
for(const[action,patch,start]of lectureModes)for(const outcome of ['success','failure'])test(`lecture ${action} ${outcome}: invalidate before request and after settlement without automatic recheck`,async()=>{
 const h=lectureFixture(patch);try{
  const wait=deferred();h.setReply(wait.promise);const before=h.context.getSnapshot();start(h);
  assert.notEqual(h.context.getSnapshot(),before);assert.equal(h.context.getSnapshot().pending,true);await tick();assert.equal(h.calls.length,1);
  h.render();assert.equal(h.lineage().disabled,true);const during=h.context.getSnapshot();
  const next={...h.props.initial,version:2,status:action==='publish'?'published':action==='request-review'?'in-review':'draft',title:action==='save'?'Unsaved local title':initialLecture.title};
  wait.resolve(outcome==='success'?new Response(JSON.stringify(next)):new Response(JSON.stringify({error:'Synthetic refusal'}),{status:403}));
  await tick();h.render();assert.equal(h.context.getSnapshot().pending,false);assert.notEqual(h.context.getSnapshot(),during);
  assert.equal(h.lineage().version,outcome==='success'?2:1);assert.equal(h.lineage().status,outcome==='success'?next.status:h.props.initial.status);
  assert.equal(h.calls.length,1,'no lineage polling, retry, creation or publication beyond the explicit operation');
  if(action==='save'&&outcome==='failure')assert.match(words(h.tree),/Unsaved changes/);
  if(action==='save')assert.equal(h.calls[0].body.title,'Unsaved local title');
  if(action==='reload')assert.equal(h.calls[0].body,null);else assert.equal(h.calls[0].body.action,action);
 }finally{h.dispose();}
});
test('lecture duplicate and stale handlers cannot create requests after pending or unmount',async()=>{
 const h=lectureFixture();try{
  h.editTitle('Unsaved local title');const oldSave=h.button('Save'),wait=deferred();h.setReply(wait.promise);
  oldSave.props.onClick();oldSave.props.onClick();await tick();assert.equal(h.calls.length,1);
  h.unmount();const after=h.context.getSnapshot();assert.equal(after.pending,false);oldSave.props.onClick();assert.equal(h.calls.length,1);
  wait.resolve(new Response(JSON.stringify({...initialLecture,version:99})));await tick();assert.equal(h.context.getSnapshot(),after);
 }finally{h.dispose();}
});
test('uncommitted lecture render cannot begin a save or reload',()=>{
 const h=lectureFixture({},false);try{
  const before=h.context.getSnapshot();
  for(const label of ['Save','Reload saved version'])walk(h.uncommittedTree,node=>node.type==='button'&&words(node)===label).props.onClick();
  assert.equal(h.calls.length,0);assert.equal(h.context.getSnapshot(),before);
 }finally{h.dispose();}
});
test('lecture abandoned render leaves pending operation and committed lineage context intact',async()=>{
 const h=lectureFixture();try{
  h.editTitle('Unsaved local title');const wait=deferred();h.setReply(wait.promise);h.button('Save').props.onClick();await tick();
  const before=h.context.getSnapshot();h.abandon({...h.props,authorityKey:'abandoned-actor:org'});assert.equal(h.context.getSnapshot(),before);
  wait.resolve(new Response(JSON.stringify({...initialLecture,title:'Unsaved local title',version:2})));await tick();h.render({...h.props,authorityKey:'actor:org'});
  assert.equal(h.lineage().version,2);assert.equal(h.lineage().authorityKey,'actor:org');assert.equal(h.calls.length,1);
 }finally{h.dispose();}
});
test('lecture retirement invalidates before showing retired workflow state',()=>{
 const h=lectureFixture({status:'published'});try{
  h.button('Review').props.onClick();h.render();const before=h.context.getSnapshot();
  h.find(node=>node.type==='retirement').props.onRetired({disposition:'withdrawn'});
  assert.notEqual(h.context.getSnapshot(),before);h.render();assert.equal(h.lineage().status,'withdrawn');assert.equal(h.calls.length,0);
 }finally{h.dispose();}
});

const runtimeSource=read('components/EducationRuntime.tsx'),file=ts.createSourceFile('EducationRuntime.tsx',runtimeSource,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
const runtime=file.statements.find(node=>ts.isFunctionDeclaration(node)&&node.name?.text==='EducationDeliveryRuntime');assert(runtime);
const functions=['refresh','postAction','chooseWorkbook'].map(name=>{const node=runtime.body.statements.find(node=>ts.isFunctionDeclaration(node)&&node.name?.text===name);assert(node,name);return node.getText(file);}).join('\n');
let authoringExpression;
function visit(node){if(ts.isJsxExpression(node)&&node.expression?.getText(file).startsWith('view === "authoring" &&'))authoringExpression=node.expression.getText(file);ts.forEachChild(node,visit);}
visit(runtime);assert(authoringExpression);
const factory=compileText(`export function bind(seams:any){const {accessMode,lineageContext,requestedWorkbookId,initialWorkbookId,fetch,synchronizeServerClock,registerAnswerRevisions,currentWorkbookId,setData,setAnswers,setActiveCaseId,setExamPreflightPassed,setError,data,latestSnapshot,workbookWorkflowRequest,setBusy,pendingAnswersRef,setNotice,setTimeout,chooseCase,setView,dualDisplay,flushPendingAnswers,setIntroductionSlideIndex,window}=seams;${functions};return {refresh,postAction,chooseWorkbook};}`).bind;
const slot=compileText(`export function slot(seams:any){const {view,data,presentedData,accessMode,requestedWorkbookId,studioAuthorityKey,lineageContext,busy,WorkbookCorrectionLineage,WorkbookBuilder,postAction,refresh,returnTo,courseOutline}=seams;return (${authoringExpression});}`).slot;
const workflow=compileText(read('lib/workbook-workflow-request.ts'));
const workbook={id:'draft:case',title:'Synthetic workbook',version:1,status:'draft',mode:'teaching',workflow:{materialRevision:'a'.repeat(64),reviewRevision:1,submissionCurrent:true,approvalCurrent:true}};
const snapshot=()=>({serverTime:'2026-10-16T20:00:00.000Z',currentUser:{id:'actor:one',roles:['instructor']},course:{workbookId:workbook.id,workbookVersion:1},workbooks:[structuredClone(workbook)],cases:[],answers:[],attempt:{preflightPassedAt:null}});
function runtimeFixture(){
 const context=lineage.createWorkbookCorrectionLineageContext(),calls=[],presented=[];
 const state={data:snapshot(),reply:null,error:'',busy:false};
 const currentWorkbookId={current:workbook.id},latestSnapshot={current:state.data};
 const seams={accessMode:'authoring',lineageContext:context,requestedWorkbookId:workbook.id,initialWorkbookId:()=>workbook.id,
  fetch:async(url,options)=>{calls.push({url,options,body:options.body?JSON.parse(options.body):null});if(state.reply instanceof Error)throw state.reply;return state.reply;},
  synchronizeServerClock(){},registerAnswerRevisions(){},currentWorkbookId,setData(next){presented.push({next,pending:context.getSnapshot().pending,revision:context.getSnapshot().revision});state.data=next;},
  setAnswers(){},setActiveCaseId(){},setExamPreflightPassed(){},setError:value=>{state.error=value;},data:state.data,latestSnapshot,workbookWorkflowRequest:workflow.workbookWorkflowRequest,
  setBusy:value=>{state.busy=value;},pendingAnswersRef:{current:new Map()},setNotice(){},setTimeout(){},chooseCase(){},setView(){},dualDisplay:false,flushPendingAnswers:async()=>true,setIntroductionSlideIndex(){},window:{location:{href:'https://synthetic.invalid/studio'},history:{replaceState(){}}},
 };
 return{context,calls,presented,state,seams,functions:factory(seams)};
}
for(const method of ['save','request-review','publish','reload','workbook-change'])for(const outcome of ['success','failure'])test(`case ${method} ${outcome}: production request functions revoke before presentation and remain clear after settlement`,async()=>{
 const h=runtimeFixture(),wait=deferred();h.state.reply=wait.promise;
 if(method==='publish')h.seams.data.workbooks[0].status='approved';
 const before=h.context.getSnapshot();
 const promise=method==='reload'?h.functions.refresh():method==='workbook-change'?h.functions.chooseWorkbook('draft:two'):
  h.functions.postAction({action:method==='save'?'update-workbook-draft':method==='publish'?'publish-workbook':'request-workbook-review',id:workbook.id},'Synthetic success');
 await tick();assert.notEqual(h.context.getSnapshot(),before);assert.equal(h.context.getSnapshot().pending,true);await tick();assert.equal(h.calls.length,1);
 const next=snapshot();next.workbooks[0].version=2;next.workbooks[0].status=method==='publish'?'published':method==='request-review'?'in-review':'draft';
 if(method==='workbook-change')next.course.workbookId='draft:two';
 wait.resolve(outcome==='success'?new Response(JSON.stringify(next)):new Response(JSON.stringify({error:'Synthetic refusal'}),{status:403}));
 await promise;assert.equal(h.context.getSnapshot().pending,false);assert.equal(h.calls.length,1);
 if(outcome==='success'){assert.equal(h.presented.length,1);assert.equal(h.presented[0].pending,true,'invalidation remains active before new server state is shown');}
 else{assert.equal(h.presented.length,0);assert.equal(h.state.data.workbooks[0].version,1);assert.match(h.state.error,/Synthetic refusal/);}
});
test('case stale workflow closure refuses without a new mutation and still revokes provenance',async()=>{
 const h=runtimeFixture(),before=h.context.getSnapshot();h.seams.latestSnapshot.current=snapshot();h.seams.latestSnapshot.current.workbooks[0].version=9;
 assert.equal(await h.functions.postAction({action:'request-workbook-review',id:workbook.id},'wrong'),null);
 assert.notEqual(h.context.getSnapshot(),before);assert.equal(h.context.getSnapshot().pending,false);assert.equal(h.calls.length,0);
});
test('case late operation cannot unlock a newer in-flight operation',async()=>{
 const h=runtimeFixture(),old=deferred(),newer=deferred();h.state.reply=old.promise;const first=h.functions.refresh();h.state.reply=newer.promise;const second=h.functions.refresh();
 old.resolve(new Response(JSON.stringify(snapshot())));await first;assert.equal(h.context.getSnapshot().pending,true);
 newer.resolve(new Response(JSON.stringify(snapshot())));await second;assert.equal(h.context.getSnapshot().pending,false);assert.equal(h.calls.length,2);
});
test('runtime authoring JSX uses live workbook/actor state and keeps the existing retirement refresh path',async()=>{
 const h=runtimeFixture(),render=patch=>slot({view:'authoring',data:h.state.data,presentedData:h.state.data,accessMode:'authoring',requestedWorkbookId:workbook.id,studioAuthorityKey:'server-actor:institution',lineageContext:h.context,busy:false,
  WorkbookCorrectionLineage:'lineage',WorkbookBuilder:'builder',postAction:h.functions.postAction,refresh:h.functions.refresh,returnTo:'',courseOutline:[],...patch});
 let tree=render(),props=walk(tree,node=>node.type==='lineage').props;assert.equal(props.id,workbook.id);assert.equal(props.context,h.context);
 assert.equal(walk(render({studioAuthorityKey:''}),node=>node.type==='lineage').props.authorityKey,'','missing institution context cannot expose a check');
 h.state.data.workbooks[0].version=7;h.state.data.workbooks[0].status='published';h.state.data.currentUser.id='actor:two';
 tree=render({studioAuthorityKey:'server-actor:other-institution'});props=walk(tree,node=>node.type==='lineage').props;
 assert.equal(props.version,7);assert.equal(props.status,'published');assert.deepEqual(JSON.parse(props.authorityKey),['server-actor:other-institution','actor:two',['instructor']]);
 h.state.reply=Promise.resolve(new Response(JSON.stringify(snapshot())));walk(tree,node=>node.type==='builder').props.onRetired();assert.equal(h.context.getSnapshot().pending,true);
 await tick();assert.equal(h.context.getSnapshot().pending,false);
});
