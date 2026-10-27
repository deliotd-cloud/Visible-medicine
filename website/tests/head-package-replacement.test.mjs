import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import ts from 'typescript';

// Execute the viewer's real picker/Close callbacks with controlled native reads.
const source=readFileSync(process.env.HEAD_REPLACEMENT_SOURCE??new URL('../components/HeadAtlasViewer.tsx',import.meta.url),'utf8');
const ast=ts.createSourceFile('HeadAtlasViewer.tsx',source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
const viewer=ast.statements.find(node=>ts.isFunctionDeclaration(node)&&node.name?.text==='HeadAtlasViewer');
assert(viewer?.body);
const method=name=>viewer.body.statements.find(node=>ts.isFunctionDeclaration(node)&&node.name?.text===name);
const names=['cancelReplacement','acceptedPracticeScope','canExitPractice','chooseFiles','closeAtlas'];
const methods=names.map(method);assert(methods.every(Boolean),'actual viewer callbacks available');
const parameters=['pkg','study','modality','committedModalityRef','committedRetentionRef','practiceExitScope','practiceExitScopeRef','importGeneration','replacementGeneration','replacementRequestRef','prevalidatedStudyRef','openLocalHeadPackage','loadHeadStudy','headStudyLoadingMessage','initialWindow','cancelPackageReads','headViewHistory','pendingHistoryRestoreRef','headSourceAfterCancel','folderSession','failedStudyRef','HEAD_MANIFEST_SHA256','window','practice','urlNavigation','openButtonRef',
  'setReplacementOpening','setReplacementStatus','setReplacementError','setReplacementCancelScope','setPackageOpening','setPackage','setStudy','setSelected','setError','setStatus','setLocalSourceState','setStudyLoadFailed','setRetainFolder','setActiveId','resetIndexDetails','setQuery','setFamily','setLinkedOnly','setExpanded','setCursor','setWindowing','setGroupLayers','setHiddenLayers','setLayerOpacity','setOverlayGroup','setGroupLabels','setOverlayOpacity','setOverlay','setRegionalCourse','setShowCrosshair','setPracticeOrigin','setLearningPosition','setRightPanel','setOverlayStatus','setNavigationNotice'];
const code=ts.transpileModule(`return function create(input){const {${parameters.join(',')}}=input;${methods.map(node=>node.getText(ast)).join('\n')}return {chooseFiles,closeAtlas,cancelReplacement};}`,
  {compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}}).outputText;
const create=new Function(code)();
const deferred=()=>{let resolve,reject;const promise=new Promise((yes,no)=>{resolve=yes;reject=no;});return {promise,resolve,reject};};
const tick=()=>new Promise(resolve=>setImmediate(resolve));

function harness({active=false,accept=true,initial=false}={}){
  const oldPkg={id:'old'},oldStudy={id:'old-native'},candidatePkg={id:'candidate'},candidateStudy={id:'candidate-native',geometry:{shapeKJI:[10,20,30]},range:[0,100]};
  const state={pkg:initial?null:oldPkg,study:initial?null:oldStudy,selected:{id:'old-selection'},cursor:[17,18,19],practice:{active,answer:'draft',end(){this.active=false;this.answer='';effects.push('end-practice');}},history:'old',folder:'old',replacementOpening:false,replacementStatus:'',replacementError:'',packageOpening:false,error:'',status:''};
  const effects=[],packages=[],studies=[];
  let packageRead=deferred(),studyRead=deferred(),nativeCalls=0,confirmed=0,abortedOld=0;
  const scope={practice:state.practice,generation:4,pending:false,consumed:false};
  const input={pkg:state.pkg,study:state.study,modality:'CT',committedModalityRef:{current:'CT'},committedRetentionRef:{current:true},practiceExitScope:scope,practiceExitScopeRef:{current:scope},importGeneration:{current:4},replacementGeneration:{current:0},replacementRequestRef:{current:null},prevalidatedStudyRef:{current:null},
    openLocalHeadPackage:async()=>packageRead.promise,
    loadHeadStudy:(_pkg,_modality,signal)=>{nativeCalls++;studies.push(signal);return studyRead.promise;},headStudyLoadingMessage:()=> 'Native image progress',initialWindow:()=>[40,80],
    cancelPackageReads:()=>{abortedOld++;effects.push('abort-old');},headViewHistory:{clear:()=>{state.history=null;effects.push('clear-history');}},pendingHistoryRestoreRef:{current:{id:'old-view'}},headSourceAfterCancel:value=>value,
    folderSession:{clear:()=>{state.folder=null;effects.push('clear-folder');},keep:()=>effects.push('keep-folder')},failedStudyRef:{current:null},HEAD_MANIFEST_SHA256:'revision',
    window:{location:{hostname:'example.test'},confirm:()=>{confirmed++;return accept;}},practice:state.practice,urlNavigation:{position:null,invalid:false},openButtonRef:{current:{focus:()=>effects.push('focus')}},
    resetIndexDetails:()=>{},setQuery:()=>{},setFamily:()=>{},setLinkedOnly:()=>{},setExpanded:()=>{},setGroupLayers:()=>{},setHiddenLayers:()=>{},setLayerOpacity:()=>{},setOverlayGroup:()=>{},setGroupLabels:()=>{},setOverlayOpacity:()=>{},setOverlay:()=>{},setRegionalCourse:()=>{},setShowCrosshair:()=>{},setPracticeOrigin:()=>{},setLearningPosition:()=>{},setRightPanel:()=>{},setOverlayStatus:()=>{},setNavigationNotice:()=>{},setStudyLoadFailed:()=>{},setRetainFolder:()=>{},setActiveId:()=>{},
    setReplacementOpening:v=>state.replacementOpening=v,setReplacementStatus:v=>state.replacementStatus=v,setReplacementError:v=>state.replacementError=v,setReplacementCancelScope:v=>state.replacementCancelScope=v,
    setPackageOpening:v=>state.packageOpening=v,setPackage:v=>state.pkg=v,setStudy:v=>state.study=v,setSelected:v=>state.selected=v,setError:v=>state.error=v,setStatus:v=>state.status=v,
    setLocalSourceState:v=>{},setCursor:v=>state.cursor=v,setWindowing:v=>state.windowing=v};
  const controls=create(input);
  const choose=()=>controls.chooseFiles({target:{files:[{name:'candidate'}],value:'candidate'}});
  const switchRead=()=>{const old={packageRead,studyRead};packageRead=deferred();studyRead=deferred();return old;};
  return {state,effects,packages,studies,input,controls,choose,switchRead,oldPkg,oldStudy,candidatePkg,candidateStudy,
    packageOK:()=>packageRead.resolve(candidatePkg),packageFail:()=>packageRead.reject(Error('bad package')),
    studyOK:()=>studyRead.resolve(candidateStudy),studyFail:()=>studyRead.reject(Error('bad native image')),
    get nativeCalls(){return nativeCalls;},get confirmed(){return confirmed;},get abortedOld(){return abortedOld;}};
}
function retained(h){assert.equal(h.state.pkg,h.oldPkg);assert.equal(h.state.study,h.oldStudy);assert.deepEqual(h.state.selected,{id:'old-selection'});assert.deepEqual(h.state.cursor,[17,18,19]);assert.equal(h.state.history,'old');assert.equal(h.state.folder,'old');assert.equal(h.abortedOld,0);}

test('retains current CT while candidate is verified, then commits one loaded native study',async()=>{
  const h=harness(),pending=h.choose();retained(h);assert.equal(h.state.replacementOpening,true);
  h.packageOK();await tick();retained(h);assert.equal(h.nativeCalls,1);
  h.studyOK();await pending;assert.equal(h.state.pkg,h.candidatePkg);assert.equal(h.input.prevalidatedStudyRef.current.study,h.candidateStudy);
  assert.equal(h.state.study,null,'verified study is handed to the package effect before linked selection');assert.equal(h.nativeCalls,1);assert.equal(h.abortedOld,1);assert.equal(h.state.history,null);
});
test('first manual package still opens without a prior scan',async()=>{
  const h=harness({initial:true}),pending=h.choose();h.packageOK();await tick();h.studyOK();await pending;
  assert.equal(h.state.pkg,h.candidatePkg);assert.equal(h.input.prevalidatedStudyRef.current.study,h.candidateStudy);
  assert.equal(h.nativeCalls,1);assert.equal(h.confirmed,0);
});
test('package rejection and native rejection keep old scan, selection and view',async()=>{
  for(const failure of ['package','native']){
    const h=harness(),pending=h.choose();
    if(failure==='package')h.packageFail();else{h.packageOK();await tick();h.studyFail();}
    await pending;retained(h);assert.match(h.state.replacementError,/bad (package|native image)/);
  }
});
test('Cancel aborts candidate and refuses late successful package and native completions',async()=>{
  for(const stage of ['package','native']){
    const h=harness(),pending=h.choose();if(stage==='native'){h.packageOK();await tick();}
    h.controls.cancelReplacement();retained(h);assert.equal(h.state.replacementOpening,false);
    if(stage==='package')h.packageOK();else h.studyOK();await pending;retained(h);
  }
});
test('new selection supersedes an older candidate',async()=>{
  const h=harness(),first=h.choose(),old=h.switchRead();const second=h.choose();
  old.packageRead.resolve({id:'stale'});await tick();h.packageOK();await tick();h.studyOK();await second;await first;
  assert.equal(h.state.pkg,h.candidatePkg);assert.equal(h.nativeCalls,1);
});
test('modality change, Close and unmount each refuse late candidate',async()=>{
  for(const action of ['modality','close','unmount']){
    const h=harness(),pending=h.choose();h.packageOK();await tick();
    if(action==='modality')h.input.committedModalityRef.current='MRI';
    else if(action==='close')h.controls.closeAtlas();
    else h.controls.cancelReplacement();
    h.studyOK();await pending;
    if(action==='modality'||action==='unmount')retained(h);else assert.equal(h.state.pkg,null);
  }
});
test('declined practice exit preserves the current question and scan',async()=>{
  const h=harness({active:true,accept:false}),pending=h.choose();h.packageOK();await tick();h.studyOK();await pending;
  retained(h);assert.equal(h.state.practice.answer,'draft');assert.equal(h.confirmed,1);
});
test('successful switch ends exactly the accepted committed practice scope',async()=>{
  const h=harness({active:true}),pending=h.choose();h.packageOK();await tick();h.studyOK();await pending;
  assert.equal(h.confirmed,1);assert.deepEqual(h.effects.filter(item=>item==='end-practice'),['end-practice']);
  assert.equal(h.state.pkg,h.candidatePkg);
});
test('current folder-sharing choice controls retention after asynchronous validation',async()=>{
  const h=harness(),pending=h.choose();h.packageOK();await tick();h.input.committedRetentionRef.current=false;
  h.studyOK();await pending;assert.equal(h.state.pkg,h.candidatePkg);
  assert.equal(h.effects.includes('keep-folder'),false);
});
test('stale Cancel scope cannot abort a newer candidate',async()=>{
  const h=harness(),first=h.choose(),oldScope=h.state.replacementCancelScope,old=h.switchRead(),second=h.choose();
  h.controls.cancelReplacement(oldScope);assert.equal(h.state.replacementOpening,true);
  old.packageRead.resolve({id:'stale'});h.packageOK();await tick();h.studyOK();await first;await second;
  assert.equal(h.state.pkg,h.candidatePkg);
});

test('retired picker cannot start file reads or alter a newer request',async()=>{
  for(const retire of [h=>{h.input.practiceExitScopeRef.current=null;},h=>{h.input.importGeneration.current++;}]){
    const h=harness();let reads=0;h.input.openLocalHeadPackage=async()=>{reads++;return h.candidatePkg;};
    const controls=create(h.input);retire(h);const event={target:{files:[{name:'old'}],value:'old'}};
    await controls.chooseFiles(event);assert.equal(event.target.value,'');assert.equal(reads,0);
    assert.equal(h.state.replacementOpening,false);retained(h);
  }
});
