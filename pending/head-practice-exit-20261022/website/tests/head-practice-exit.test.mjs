import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import ts from 'typescript';

// Execute the proposed viewer's actual guard, destructive handlers and Link
// callback. The fixture supplies state and records effects; it does not copy
// the exit decision. No imaging data, browser, or native picker is involved.
const source=readFileSync(process.env.HEAD_PRACTICE_EXIT_SOURCE??new URL('../components/HeadAtlasViewer.tsx',import.meta.url),'utf8');
const ast=ts.createSourceFile('HeadAtlasViewer.tsx',source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
const viewer=ast.statements.find(node=>ts.isFunctionDeclaration(node)&&node.name?.text==='HeadAtlasViewer');
assert(viewer?.body);
const declaration=name=>viewer.body.statements.find(node=>ts.isVariableStatement(node)&&node.declarationList.declarations.some(item=>ts.isIdentifier(item.name)&&item.name.text===name));
const method=name=>viewer.body.statements.find(node=>ts.isFunctionDeclaration(node)&&node.name?.text===name);
const scope=declaration('practiceExitScope'),scopeRef=declaration('practiceExitScopeRef');
const commit=viewer.body.statements.find(node=>ts.isExpressionStatement(node)&&node.getText(ast).startsWith('useLayoutEffect(')&&node.getText(ast).includes('practiceExitScopeRef.current=practiceExitScope'));
const guard=method('canExitPractice'),choose=method('chooseFiles'),close=method('closeAtlas');
assert(scope&&scopeRef&&commit&&guard&&choose&&close,'extract the actual scope, commit and handlers');
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
const names=['pkg','study','modality','practice','importGeneration','window','useRef','useLayoutEffect','cancelPackageReads','headViewHistory','pendingHistoryRestoreRef','setLocalSourceState','headSourceAfterCancel','folderSession','failedStudyRef','setStudyLoadFailed','setPackageOpening','setPackage','setStudy','setSelected','setError','setStatus','openLocalHeadPackage','retainFolder','HEAD_MANIFEST_SHA256','setRetainFolder','setActiveId','resetIndexDetails','setQuery','setFamily','setLinkedOnly','setExpanded','setCursor','setGroupLayers','setHiddenLayers','setLayerOpacity','setOverlayGroup','setGroupLabels','setOverlayOpacity','setOverlay','setRegionalCourse','setShowCrosshair','setPracticeOrigin','setLearningPosition','setRightPanel','urlNavigation','setOverlayStatus','setNavigationNotice','openButtonRef','rememberHistoryView'];
const program=`return function create(input){const {${names.join(',')}}=input;${scope.getText(ast)}\n${scopeRef.getText(ast)}\n${commit.getText(ast)}\n${guard.getText(ast)}\n${choose.getText(ast)}\n${close.getText(ast)}\nreturn {linkClick:${linkClick},chooseFiles,closeAtlas,scope:practiceExitScope,ref:practiceExitScopeRef};}`;
const code=ts.transpileModule(program,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}}).outputText;
const create=new Function(code)();

function harness(active=true,decision=true){
  const effects=[],questions={active,index:2,draft:'my answer',outcomes:{first:'correct'}};
  const practice={active,finish:false,end(){effects.push('end');questions.active=false;questions.index=0;questions.draft='';questions.outcomes={};}};
  const input={pkg:{id:'current'},study:{id:'current study'},modality:'CT',practice,importGeneration:{current:4},
    window:{location:{hostname:'localhost'},confirm:()=>{effects.push('confirm');return typeof decision==='function'?decision(input):decision;}},
    useRef:value=>({current:value}),useLayoutEffect:effect=>{input.cleanup=effect();},
    cancelPackageReads:()=>effects.push('abort'),headViewHistory:{clear:()=>effects.push('history-clear')},
    pendingHistoryRestoreRef:{current:{id:'view'}},headSourceAfterCancel:value=>value,folderSession:{clear:()=>effects.push('folder-clear')},
    failedStudyRef:{current:{id:'failed'}},openLocalHeadPackage:async files=>{effects.push(`open:${files.length}`);return{id:'replacement'};},
    retainFolder:false,HEAD_MANIFEST_SHA256:'revision',urlNavigation:{position:null,invalid:false},
    resetIndexDetails:()=>effects.push('reset-index'),openButtonRef:{current:{focus:()=>effects.push('focus-open')}},
    rememberHistoryView:()=>effects.push('remember-view'),
  };
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
  await h.controls.chooseFiles(event);assert.equal(event.target.value,'');assert.deepEqual(h.effects,['confirm']);
  assert.deepEqual(h.questions,before);assert.equal(h.input.importGeneration.current,4);
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
    assert.deepEqual(h.effects,['confirm']);assert.equal(h.questions.draft,'my answer');
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
      await h.controls.chooseFiles(h.picker([{name:'approved'}]));assert.equal(h.effects.filter(value=>value==='open:1').length,1);
    }
    assert.equal(h.controls.scope.pending,false);assert.equal(attempts,2);
  }
});
test('unavailable native confirmation fails closed without consuming the scope',()=>{
  const h=harness();h.input.window.confirm=undefined;const first=h.link();h.controls.linkClick(first);
  assert.equal(first.defaultPrevented,true);assert.equal(h.controls.scope.pending,false);assert.equal(h.controls.scope.consumed,false);
  h.input.window.confirm=()=>true;const retry=h.link();h.controls.linkClick(retry);assert.equal(retry.defaultPrevented,false);
});
