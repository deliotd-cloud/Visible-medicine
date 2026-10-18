import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
import {HEAD_MANIFEST_SHA256,type HeadEntry} from '../lib/head-atlas-import.ts';
import {headRelatedLearning} from '../lib/head-related-learning.ts';
import {resolveHeadConcept} from '../lib/head-atlas-links.ts';
import type {HeadLearningPosition} from '../lib/head-atlas-learning.ts';

// Execute the component's real local functions with controlled render closures.
// Parsing declarations keeps this test sensitive to the actual callback guards.
const source=readFileSync(new URL('../components/HeadAtlasViewer.tsx',import.meta.url),'utf8');
const tree=ts.createSourceFile('HeadAtlasViewer.tsx',source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
const names=['canReviewPracticeEntry','reviewPracticeEntry','reviewPracticeGuide','returnToLearning'];
const found=new Map<string,ts.FunctionDeclaration>();
function visit(node:ts.Node):void {
  if(ts.isFunctionDeclaration(node)&&node.name&&names.includes(node.name.text))found.set(node.name.text,node);
  ts.forEachChild(node,visit);
}
visit(tree);
for(const name of names.slice(1))assert(found.has(name),`${name} must remain an executable component handler`);
const declarations=names.flatMap(name=>found.get(name)?[found.get(name)!.getText(tree)]:[]).join('\n');
const compiled=ts.transpileModule(declarations,{reportDiagnostics:true,compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.None}});
assert.equal(compiled.diagnostics?.filter(item=>item.category===ts.DiagnosticCategory.Error).length,0);

type Practice={active:boolean;finished:boolean;results:Array<{entry:HeadEntry;outcome:string}>;originalResults:Array<{entry:HeadEntry;outcome:string}>};
function entry(id='cth.bst.pons'):HeadEntry {
  return {id,label:'Pons — regional mask',family:'bst',laterality:'midline_or_unpaired',representation:'partial-mask',color:[1,0,0],opacity:{fill:.2,outline:.8}};
}
const currentEntry=entry();
const otherEntry=entry('cth.bst.other');
const guide=headRelatedLearning([currentEntry],currentEntry,'CT',HEAD_MANIFEST_SHA256)[0];
assert(guide,'fixture must have an actual mapped guided-learning step');

function harness(options:{original?:boolean;entry?:HeadEntry;studyEntries?:HeadEntry[];active?:boolean;finished?:boolean;closed?:boolean}={}){
  const selectedEntry=options.entry??currentEntry;
  const items=[{entry:selectedEntry,outcome:'incorrect'}];
  const practice:Practice={active:options.active??false,finished:options.finished??true,
    results:options.original?[]:items,originalResults:options.original?items:[]};
  const study=options.closed?null:{definition:{entries:options.studyEntries??[selectedEntry]}};
  const reviewContext={generation:0};
  const reviewContextRef={current:reviewContext};
  const importGeneration={current:0};
  const practiceRef={current:practice};
  const calls:string[]=[];
  const scope={practice,study,reviewContext,reviewContextRef,importGeneration,practiceRef,
    modality:'CT',HEAD_MANIFEST_SHA256,headRelatedLearning,resolveHeadConcept,selected:null,practiceOrigin:guide.position,
    chooseStructure:()=>calls.push('choose'),setPracticeOrigin:()=>calls.push('origin'),
    showLearningEntry:()=>calls.push('entry'),setLinkedOnly:()=>calls.push('linked'),
    setRightPanel:()=>calls.push('panel'),changeLearningPosition:()=>calls.push('position'),
    selectionFocusRef:{current:false},setCursor:()=>calls.push('cursor'),focusIJK:()=>[0,0,0]};
  const keys=Object.keys(scope);
  const handlers=new Function(...keys,`${compiled.outputText}\nreturn {reviewPracticeEntry,reviewPracticeGuide,returnToLearning};`)(...Object.values(scope)) as {
    reviewPracticeEntry:(value:HeadEntry)=>void;
    reviewPracticeGuide:(position:HeadLearningPosition,value:HeadEntry)=>void;
    returnToLearning:()=>void;
  };
  return {handlers,calls,practice,practiceRef,reviewContextRef,reviewContext,importGeneration,study};
}

test('return to the originating guide preserves completed scores without resetting practice',()=>{
  const h=harness();const before=JSON.stringify(h.practice);
  h.handlers.returnToLearning();
  assert.deepEqual(h.calls,['panel','position','entry']);
  assert.equal(JSON.stringify(h.practice),before);
});

test('a retired tour-return callback cannot navigate a replacement or active session',()=>{
  const cases:Array<(h:ReturnType<typeof harness>)=>void>=[
    h=>{h.reviewContextRef.current={generation:0};},
    h=>{h.importGeneration.current++;},
    h=>{h.practiceRef.current={...h.practice,active:true};},
    h=>{h.practiceRef.current={...h.practice,finished:false};},
  ];
  for(const retire of cases){
    const h=harness();retire(h);h.handlers.returnToLearning();assert.deepEqual(h.calls,[]);
  }
  const closed=harness({closed:true});closed.handlers.returnToLearning();assert.deepEqual(closed.calls,[]);
});
function invoke(h:ReturnType<typeof harness>,kind:'entry'|'guide',value=currentEntry,position=guide.position){
  if(kind==='entry')h.handlers.reviewPracticeEntry(value);
  else h.handlers.reviewPracticeGuide(position,value);
}

for(const kind of ['entry','guide'] as const){
  test(`${kind} accepts an exact current result or original result without changing outcomes`,()=>{
    for(const original of [false,true]){
      const h=harness({original});
      const before=JSON.stringify(h.practice);
      invoke(h,kind);
      assert(h.calls.length>0,`${kind} should navigate from ${original?'original':'current'} results`);
      assert.equal(JSON.stringify(h.practice),before);
    }
  });

  test(`${kind} refuses a cloned identity, active or unfinished practice`,()=>{
    const clone=harness();invoke(clone,kind,{...currentEntry});assert.deepEqual(clone.calls,[]);
    for(const h of [harness({active:true}),harness({finished:false}),harness({closed:true}),harness({studyEntries:[]})]){
      invoke(h,kind);
      assert.deepEqual(h.calls,[]);
    }
  });

  for(const [reason,retire] of [
    ['folder, modality, study or result context replacement',(h:ReturnType<typeof harness>)=>{h.reviewContextRef.current={generation:0};}],
    ['synchronous import invalidation before rerender',(h:ReturnType<typeof harness>)=>{h.importGeneration.current++;}],
    ['removal from current results despite old closure',(h:ReturnType<typeof harness>)=>{h.practiceRef.current={...h.practice,results:[],originalResults:[]};}],
    ['active current practice despite finished old closure',(h:ReturnType<typeof harness>)=>{h.practiceRef.current={...h.practice,active:true};}],
    ['unfinished current practice despite finished old closure',(h:ReturnType<typeof harness>)=>{h.practiceRef.current={...h.practice,finished:false};}],
  ] as const){
    test(`${kind} refuses ${reason}`,()=>{
      const h=harness();retire(h);invoke(h,kind);
      assert.deepEqual(h.calls,[]);
    });
  }
}

test('guide refuses a different or absent current mapped step',()=>{
  for(const position of [{...guide.position,sequenceId:'other'},
    {...guide.position,conceptId:'other'}]){
    const h=harness();invoke(h,'guide',currentEntry,position);assert.deepEqual(h.calls,[]);
  }
  const h=harness({studyEntries:[currentEntry,otherEntry]});
  invoke(h,'guide',otherEntry);assert.deepEqual(h.calls,[]);
});
