import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {fileURLToPath,pathToFileURL} from 'node:url';
import ts from 'typescript';

// Execute the proposed viewer's actual guard, destructive handlers and Link
// callback. The fixture supplies state and records effects; it does not copy
// the exit decision. No imaging data, browser, or native picker is involved.
const sourcePath=process.env.HEAD_PRACTICE_EXIT_SOURCE??fileURLToPath(new URL('../components/HeadAtlasViewer.tsx',import.meta.url));
const source=readFileSync(sourcePath,'utf8');
const policySource=readFileSync(new URL('../lib/head-practice-navigation.ts',pathToFileURL(sourcePath)),'utf8');
const policyExports={};
new Function('exports',ts.transpileModule(policySource,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}}).outputText)(policyExports);
const shouldConfirmHeadPracticeLink=policyExports.shouldConfirmHeadPracticeLink;
assert.equal(typeof shouldConfirmHeadPracticeLink,'function','execute the actual ordinary-link navigation policy');
const ast=ts.createSourceFile('HeadAtlasViewer.tsx',source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
const viewer=ast.statements.find(node=>ts.isFunctionDeclaration(node)&&node.name?.text==='HeadAtlasViewer');
assert(viewer?.body);
const declaration=name=>viewer.body.statements.find(node=>ts.isVariableStatement(node)&&node.declarationList.declarations.some(item=>ts.isIdentifier(item.name)&&item.name.text===name));
const method=name=>viewer.body.statements.find(node=>ts.isFunctionDeclaration(node)&&node.name?.text===name);
const scope=declaration('practiceExitScope'),scopeRef=declaration('practiceExitScopeRef'),practiceLinkRef=declaration('practiceNavigationLinkRef');
const commit=viewer.body.statements.find(node=>ts.isExpressionStatement(node)&&node.getText(ast).startsWith('useLayoutEffect(')&&node.getText(ast).includes('practiceExitScopeRef.current=practiceExitScope'));
const capture=viewer.body.statements.find(node=>ts.isExpressionStatement(node)&&node.getText(ast).startsWith('useLayoutEffect(')&&node.getText(ast).includes("document.addEventListener('click',capture,true)"));
const accepted=method('acceptedPracticeScope'),guard=method('canExitPractice');
const cancelReplacement=method('cancelReplacement'),choose=method('chooseFiles'),close=method('closeAtlas');
assert(scope&&scopeRef&&practiceLinkRef&&commit&&capture&&accepted&&guard&&cancelReplacement&&choose&&close,
  'extract the actual scope, admission, navigation capture, replacement lifecycle and handlers');
let linkClick;
function visit(node){
  if(ts.isJsxOpeningElement(node)&&node.tagName.getText(ast)==='Link'){
    const attribute=node.attributes.properties.find(item=>ts.isJsxAttribute(item)&&item.name.text==='onClick'&&item.initializer?.getText(ast).includes('canExitPractice'));
    if(attribute&&ts.isJsxExpression(attribute.initializer))linkClick=attribute.initializer.expression?.getText(ast);
  }
  ts.forEachChild(node,visit);
}
visit(viewer);
assert(linkClick,'extract the actual CT/MRI Link callback');
const names=['pkg','study','modality','practice','importGeneration','window','document','Element','HTMLAnchorElement','shouldConfirmHeadPracticeLink','useRef','useLayoutEffect','cancelPackageReads','headViewHistory','pendingHistoryRestoreRef','setLocalSourceState','headSourceAfterCancel','folderSession','failedStudyRef','setStudyLoadFailed','setPackageOpening','setPackage','setStudy','setSelected','setError','setStatus','openLocalHeadPackage','loadHeadStudy','headStudyLoadingMessage','initialWindow','committedModalityRef','committedRetentionRef','replacementGeneration','replacementRequestRef','prevalidatedStudyRef','setReplacementOpening','setReplacementStatus','setReplacementCancelScope','setReplacementError','setWindowing','HEAD_MANIFEST_SHA256','setRetainFolder','setActiveId','resetIndexDetails','setQuery','setFamily','setLinkedOnly','setExpanded','setCursor','setGroupLayers','setHiddenLayers','setLayerOpacity','setOverlayGroup','setGroupLabels','setOverlayOpacity','setOverlay','setRegionalCourse','setShowCrosshair','setPracticeOrigin','setLearningPosition','setRightPanel','urlNavigation','setOverlayStatus','setNavigationNotice','openButtonRef','rememberHistoryView'];
const program=`return function create(input){const {${names.join(',')}}=input;${scope.getText(ast)}\n${scopeRef.getText(ast)}\n${practiceLinkRef.getText(ast)}\n${commit.getText(ast)}\n${cancelReplacement.getText(ast)}\n${accepted.getText(ast)}\n${guard.getText(ast)}\n${capture.getText(ast)}\n${choose.getText(ast)}\n${close.getText(ast)}\nreturn {linkClick:${linkClick},chooseFiles,closeAtlas,scope:practiceExitScope,ref:practiceExitScopeRef,navigationRef:practiceNavigationLinkRef};}`;
const code=ts.transpileModule(program,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}}).outputText;
const create=new Function(code)();
class MockElement{constructor(anchor=null){this.anchor=anchor;}closest(){return this.anchor;}}
class MockAnchor extends MockElement{constructor(href,target=''){super();this.href=href;this.target=target;}closest(){return this;}hasAttribute(name){return false;}}

function harness(active=true,decision=true,options={}){
  const effects=[],questions={active,index:2,draft:'my answer',outcomes:{first:'correct'}};
  const practice={active,finish:false,end(){effects.push('end');questions.active=false;questions.index=0;questions.draft='';questions.outcomes={};}};
  const input={pkg:{id:'current'},study:{id:'current study'},modality:'CT',practice,importGeneration:{current:4},
    window:{location:{hostname:'localhost',href:'https://example.test/atlas/ct-head'},confirm:()=>{effects.push('confirm');return typeof decision==='function'?decision(input):decision;}},
    document:{addEventListener:(name,listener,capture)=>{assert.equal(name,'click');assert.equal(capture,true);input.capture=listener;},removeEventListener:()=>{}},
    Element:MockElement,HTMLAnchorElement:MockAnchor,shouldConfirmHeadPracticeLink,
    useRef:value=>({current:value}),useLayoutEffect:effect=>{input.cleanup=effect();},
    cancelPackageReads:()=>effects.push('abort'),headViewHistory:{clear:()=>effects.push('history-clear')},
    pendingHistoryRestoreRef:{current:{id:'view'}},headSourceAfterCancel:value=>value,folderSession:{clear:()=>effects.push('folder-clear')},
    failedStudyRef:{current:{id:'failed'}},openLocalHeadPackage:async files=>{effects.push(`open:${files.length}`);return{id:'replacement'};},
    loadHeadStudy:async()=>{effects.push('load-candidate');return{geometry:{shapeKJI:[8,10,12]},range:[0,100]};},
    headStudyLoadingMessage:()=> 'Checking candidate',initialWindow:()=>[40,80],
    committedModalityRef:{current:'CT'},committedRetentionRef:{current:false},
    replacementGeneration:{current:0},replacementRequestRef:{current:null},prevalidatedStudyRef:{current:null},
    HEAD_MANIFEST_SHA256:'revision',urlNavigation:{position:null,invalid:false},
    resetIndexDetails:()=>effects.push('reset-index'),openButtonRef:{current:{focus:()=>effects.push('focus-open')}},
    rememberHistoryView:()=>effects.push('remember-view'),
  };
  Object.assign(input,options);
  for(const name of names.filter(name=>name.startsWith('set')))input[name]=()=>effects.push(name);
  const controls=create(input);
  const link=overrides=>({button:0,defaultPrevented:false,metaKey:false,ctrlKey:false,shiftKey:false,altKey:false,currentTarget:{target:''},preventDefault(){this.defaultPrevented=true;},...overrides});
  const picker=files=>({target:{files,value:files.length?'selected-folder':' '}});
  return {input,effects,questions,controls,link,picker};
}

test('inactive same-tab Link bypasses confirmation; keyboard activation uses the same callback',()=>{
  const h=harness(false,false),event=h.link({detail:0});h.controls.linkClick(event);
  assert.equal(event.defaultPrevented,false);assert.deepEqual(h.effects,['remember-view']);
});
test('active same-tab Link Cancel preserves the exact question and blocks navigation',()=>{
  const h=harness(true,false),before=structuredClone(h.questions),event=h.link({detail:0});h.controls.linkClick(event);
  assert.equal(event.defaultPrevented,true);assert.deepEqual(h.questions,before);assert.deepEqual(h.effects,['confirm']);
});
test('active same-tab Link Continue permits navigation without consuming the scope',()=>{
  const h=harness(),first=h.link();h.controls.linkClick(first);assert.equal(first.defaultPrevented,false);
  assert.equal(h.controls.scope.consumed,false);assert.deepEqual(h.effects,['confirm','remember-view']);
});
test('accepted Link followed by outer preventDefault can prompt and navigate on retry',()=>{
  const h=harness(),first=h.link();h.controls.linkClick(first);first.preventDefault();
  assert.equal(h.controls.scope.consumed,false);
  const retry=h.link({detail:0});h.controls.linkClick(retry);
  assert.equal(retry.defaultPrevented,false);assert.deepEqual(h.effects,['confirm','remember-view','confirm','remember-view']);
});
test('accepted Link leaves an actual Close action available and one-shot',()=>{
  const h=harness(),event=h.link();h.controls.linkClick(event);event.preventDefault();
  h.controls.closeAtlas();h.controls.closeAtlas();
  assert.equal(h.effects.filter(value=>value==='confirm').length,2);
  assert.equal(h.effects.filter(value=>value==='end').length,1);
});
test('modified or separate-tab Link keeps normal anchor behavior and the current set',()=>{
  for(const overrides of [{ctrlKey:true},{metaKey:true},{shiftKey:true},{altKey:true},{button:1},{currentTarget:{target:'_blank'}}]){
    const h=harness(true,false),before=structuredClone(h.questions),event=h.link(overrides);h.controls.linkClick(event);
    assert.equal(event.defaultPrevented,false);assert.deepEqual(h.effects,[]);assert.deepEqual(h.questions,before);
  }
});
test('ordinary same-tab navigation is captured before it can discard an unsaved set',()=>{
  const h=harness(true,false),before=structuredClone(h.questions);
  const anchor=new MockAnchor('https://example.test/atlas/shoulder-3d');
  const event=h.link({target:new MockElement(anchor)});h.input.capture(event);
  assert.equal(event.defaultPrevented,true);assert.deepEqual(h.effects,['confirm']);
  assert.deepEqual(h.questions,before);assert.equal(h.controls.scope.consumed,false);
});
test('accepted ordinary navigation remains retryable if a later handler cancels it',()=>{
  const h=harness(),anchor=new MockAnchor('https://example.test/atlas/mri-head');
  const first=h.link({target:new MockElement(anchor)});h.input.capture(first);first.preventDefault();
  const retry=h.link({target:new MockElement(anchor)});h.input.capture(retry);
  assert.equal(retry.defaultPrevented,false);assert.equal(h.effects.filter(value=>value==='confirm').length,2);
  assert.equal(h.controls.scope.consumed,false);
});
test('dedicated comparison link is excluded from capture and uses its own guard',()=>{
  const h=harness(true,false),anchor=new MockAnchor('https://example.test/atlas/mri-head');
  h.controls.navigationRef.current=anchor;
  const event=h.link({target:new MockElement(anchor)});h.input.capture(event);
  assert.equal(event.defaultPrevented,false);assert.deepEqual(h.effects,[]);
  h.controls.linkClick(event);assert.equal(event.defaultPrevented,true);assert.deepEqual(h.effects,['confirm']);
});
test('Close atlas Cancel leaves the package, generation, question and draft untouched',()=>{
  const h=harness(true,false),before=structuredClone(h.questions);h.controls.closeAtlas();
  assert.deepEqual(h.effects,['confirm']);assert.equal(h.input.importGeneration.current,4);
  assert.deepEqual(h.questions,before);assert.equal(h.input.pkg.id,'current');
});
test('Close atlas bypasses confirmation outside an active set',()=>{
  const h=harness(false,false);h.controls.closeAtlas();
  assert.equal(h.effects.includes('confirm'),false);assert.equal(h.effects.filter(value=>value==='end').length,1);
});
test('Close atlas Continue runs the original destructive body once',()=>{
  const h=harness();h.controls.closeAtlas();h.controls.closeAtlas();
  assert.equal(h.input.importGeneration.current,5);assert.equal(h.effects.filter(value=>value==='confirm').length,1);
  assert.equal(h.effects.filter(value=>value==='end').length,1);assert.equal(h.effects.filter(value=>value==='abort').length,1);
});
test('empty picker does not prompt or mutate practice',async()=>{
  const h=harness(true,false),before=structuredClone(h.questions);await h.controls.chooseFiles(h.picker([]));
  assert.deepEqual(h.effects,[]);assert.deepEqual(h.questions,before);assert.equal(h.input.importGeneration.current,4);
});
test('selected folder Cancel clears only the abandoned input value',async()=>{
  const h=harness(true,false),before=structuredClone(h.questions),event=h.picker([{name:'approved'}]);
  await h.controls.chooseFiles(event);assert.equal(event.target.value,'');
  assert.equal(h.effects.filter(value=>value==='open:1').length,1,'candidate package checked before confirmation');
  assert.equal(h.effects.filter(value=>value==='load-candidate').length,1,'native image checked before confirmation');
  assert.equal(h.effects.filter(value=>value==='confirm').length,1);
  assert.equal(h.effects.includes('abort'),false);assert.equal(h.effects.includes('end'),false);
  assert.deepEqual(h.questions,before);assert.equal(h.input.importGeneration.current,4);assert.equal(h.input.pkg.id,'current');
});
test('selected folder Continue runs the original replacement path once',async()=>{
  const h=harness(),event=h.picker([{name:'approved'}]);await h.controls.chooseFiles(event);
  assert.equal(event.target.value,'');assert.equal(h.input.importGeneration.current,5);
  assert.equal(h.effects.filter(value=>value==='confirm').length,1);
  assert.equal(h.effects.filter(value=>value==='abort').length,1);
  assert.equal(h.effects.filter(value=>value==='open:1').length,1);
});
test('selected folder bypasses confirmation outside an active set',async()=>{
  const h=harness(false,false);await h.controls.chooseFiles(h.picker([{name:'approved'}]));
  assert.equal(h.effects.includes('confirm'),false);assert.equal(h.effects.filter(value=>value==='open:1').length,1);
});
test('retained callbacks are inert after scope retirement or package generation change',async()=>{
  for(const retire of [h=>{h.controls.ref.current=null;},h=>{h.input.importGeneration.current++;}]){
    const h=harness();retire(h);const event=h.link();h.controls.linkClick(event);
    assert.equal(event.defaultPrevented,true);h.controls.closeAtlas();const picker=h.picker([{name:'approved'}]);await h.controls.chooseFiles(picker);
    assert.equal(picker.target.value,'');assert.deepEqual(h.effects,[]);
  }
});
test('a scope change inside native confirmation retires the requested action',async()=>{
  for(const kind of ['link','close','picker']){
    const h=harness(true,input=>{input.importGeneration.current++;return true;});
    if(kind==='link'){const event=h.link();h.controls.linkClick(event);assert.equal(event.defaultPrevented,true);}
    if(kind==='close')h.controls.closeAtlas();
    if(kind==='picker'){const event=h.picker([{name:'approved'}]);await h.controls.chooseFiles(event);assert.equal(event.target.value,'');}
    assert.equal(h.effects.filter(value=>value==='confirm').length,1);
    assert.equal(h.effects.includes('abort'),false);assert.equal(h.effects.includes('end'),false);
    assert.equal(h.questions.draft,'my answer');
  }
});
test('a replacement committed scope inside confirmation retires the old callback',()=>{
  const h=harness(true,input=>{input.exitRef.current={newer:true};return true;});
  h.input.exitRef=h.controls.ref;
  const event=h.link();h.controls.linkClick(event);
  assert.equal(event.defaultPrevented,true);assert.deepEqual(h.effects,['confirm']);
  assert.equal(h.questions.draft,'my answer');
});
test('throwing native confirmation fails closed and leaves the scope retryable',async()=>{
  for(const kind of ['link','close','picker']){
    let attempts=0;const h=harness(true,()=>{if(++attempts===1)throw Error('dialog unavailable');return true;});
    if(kind==='link'){
      const first=h.link();h.controls.linkClick(first);assert.equal(first.defaultPrevented,true);
      const retry=h.link();h.controls.linkClick(retry);assert.equal(retry.defaultPrevented,false);
    }else if(kind==='close'){
      h.controls.closeAtlas();assert.equal(h.effects.includes('end'),false);h.controls.closeAtlas();
      assert.equal(h.effects.filter(value=>value==='end').length,1);
    }else{
      const first=h.picker([{name:'approved'}]);await h.controls.chooseFiles(first);assert.equal(first.target.value,'');
      await h.controls.chooseFiles(h.picker([{name:'approved'}]));
      assert.equal(h.effects.filter(value=>value==='open:1').length,2,'each retry verifies its candidate first');
      assert.equal(h.effects.filter(value=>value==='abort').length,1);
    }
    assert.equal(h.controls.scope.pending,false);assert.equal(attempts,2);
  }
});
test('unavailable native confirmation fails closed without consuming the scope',()=>{
  const h=harness();h.input.window.confirm=undefined;const first=h.link();h.controls.linkClick(first);
  assert.equal(first.defaultPrevented,true);assert.equal(h.controls.scope.pending,false);assert.equal(h.controls.scope.consumed,false);
  h.input.window.confirm=()=>true;const retry=h.link();h.controls.linkClick(retry);assert.equal(retry.defaultPrevented,false);
});
test('invalid replacement candidate never asks to discard the current practice',async()=>{
  let inspected=0;
  const h=harness(true,true,{openLocalHeadPackage:async()=>{inspected++;throw Error('invalid candidate');}});
  const before=structuredClone(h.questions),event=h.picker([{name:'invalid'}]);
  await h.controls.chooseFiles(event);
  assert.equal(inspected,1);assert.equal(event.target.value,'');
  assert.equal(h.effects.includes('confirm'),false);assert.equal(h.effects.includes('abort'),false);
  assert.equal(h.effects.includes('end'),false);assert.equal(h.input.importGeneration.current,4);
  assert.deepEqual(h.questions,before);assert.equal(h.input.pkg.id,'current');
});
test('modality change during candidate validation retires replacement without a practice prompt',async()=>{
  let finish;
  const candidate=new Promise(resolve=>{finish=resolve;});
  const h=harness(true,true,{loadHeadStudy:()=>candidate});
  const before=structuredClone(h.questions),event=h.picker([{name:'approved'}]);
  const pending=h.controls.chooseFiles(event);
  await Promise.resolve();await Promise.resolve();
  h.input.committedModalityRef.current='MRI';
  finish({geometry:{shapeKJI:[8,10,12]},range:[0,100]});
  await pending;
  assert.equal(event.target.value,'');assert.equal(h.effects.includes('confirm'),false);
  assert.equal(h.effects.includes('abort'),false);assert.equal(h.effects.includes('end'),false);
  assert.deepEqual(h.questions,before);assert.equal(h.input.importGeneration.current,4);
});
test('candidate validation prompts the latest committed practice scope',async()=>{
  let finish;
  const candidate=new Promise(resolve=>{finish=resolve;});
  const h=harness(true,false,{loadHeadStudy:()=>candidate});
  const before=structuredClone(h.questions),pending=h.controls.chooseFiles(h.picker([{name:'approved'}]));
  await Promise.resolve();await Promise.resolve();
  const newer={...h.controls.scope,practice:{...h.input.practice,active:true},pending:false,consumed:false};
  h.controls.ref.current=newer;
  finish({geometry:{shapeKJI:[8,10,12]},range:[0,100]});
  await pending;
  assert.equal(h.effects.filter(value=>value==='confirm').length,1);
  assert.equal(h.effects.includes('abort'),false);assert.equal(h.effects.includes('end'),false);
  assert.deepEqual(h.questions,before);assert.equal(h.input.importGeneration.current,4);
});
