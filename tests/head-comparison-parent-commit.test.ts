import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
import {headImageConcept as headAtlasConcept,resolveHeadImageConcept as resolveHeadConcept} from '../lib/head-image-only-links.ts';
import type {HeadEntry} from '../lib/head-atlas-import.ts';

// Execute the viewer's actual comparison scope, publication effect, and reverse
// callback without loading scans or mounting its unrelated image controls.
const source=readFileSync(process.env.HEAD_COMPARISON_PARENT_BASELINE_SOURCE??new URL('../components/HeadAtlasViewer.tsx',import.meta.url),'utf8');
const ast=ts.createSourceFile('HeadAtlasViewer.tsx',source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
const viewer=ast.statements.find((node):node is ts.FunctionDeclaration=>ts.isFunctionDeclaration(node)&&node.name?.text==='HeadAtlasViewer');
assert(viewer?.body,'the parent viewer must exist');
const selected:ts.Statement[]=[];
for(const statement of viewer.body.statements){
  if(ts.isVariableStatement(statement)&&statement.declarationList.declarations.some(declaration=>ts.isIdentifier(declaration.name)&&
    ['comparisonScope','comparisonScopeRef','comparisonOpen'].includes(declaration.name.text)))selected.push(statement);
  else if(ts.isExpressionStatement(statement)&&(
    statement.getText(ast).startsWith('comparisonScopeRef.current=')||
    statement.getText(ast).startsWith('useLayoutEffect(')&&statement.getText(ast).includes('comparisonScopeRef.current')))
    selected.push(statement);
  else if(ts.isFunctionDeclaration(statement)&&statement.name?.text==='selectComparisonConcept')selected.push(statement);
}
for(const name of ['comparisonScope','comparisonScopeRef','comparisonOpen','selectComparisonConcept'])
  assert(selected.some(statement=>statement.getText(ast).includes(name)),`extract actual ${name}`);
const program=`return function execute(input, hooks, actions) {
  const {pkg,study,modality,quizActive,activeId,selected,inlineComparison,rightPanel,learningPosition}=input;
  const {useMemo,useRef,useLayoutEffect}=hooks;
  const importGeneration=actions.importGeneration;
  const practiceRef=actions.practiceRef;
  const showLearningEntry=actions.showLearningEntry,chooseStructure=actions.chooseStructure;
  const resolveHeadConcept=actions.resolveHeadConcept,headAtlasConcept=actions.headAtlasConcept;
  ${selected.map(statement=>statement.getText(ast)).join('\n')}
  return {selectComparisonConcept,comparisonOpen,comparisonScope};
}`;
const compiled=ts.transpileModule(program,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}}).outputText;
const execute=new Function(compiled)() as (input:Input,hooks:Hooks,actions:Actions)=>{selectComparisonConcept:(id:string)=>void;comparisonOpen:boolean;comparisonScope:unknown};
type Input={pkg:object;study:{definition:{entries:HeadEntry[]}};modality:'CT';quizActive:boolean;activeId:string;selected:{entry:HeadEntry}|null;
  inlineComparison:{pkg:object;study:Input['study'];modality:'CT'}|null;rightPanel:'guided'|'info';learningPosition:{sequenceId:string;conceptId:string|null}};
type Effect={create:()=>void|(()=>void);deps?:unknown[];cleanup?:()=>void};
type Hooks={useMemo:(create:()=>unknown,deps:unknown[])=>unknown;useRef:(initial:unknown)=>{current:any};useLayoutEffect:(create:Effect['create'],deps?:unknown[])=>void};
type Actions={importGeneration:{current:number};practiceRef:{current:{active:boolean}};showLearningEntry:(entry:HeadEntry)=>void;chooseStructure:(entry:HeadEntry)=>void;
  resolveHeadConcept:typeof resolveHeadConcept;headAtlasConcept:typeof headAtlasConcept};
const entry=(id:string,label:string):HeadEntry=>({id,label:`${label} — regional mask`,laterality:'midline_or_unpaired',representation:'partial-mask',family:'Brainstem',color:[1,0,0],opacity:{fill:0.3,outline:1}});
const pons=entry('cth.bst.pons','Pons'),midbrain=entry('cth.bst.midbrain','Midbrain');
assert.equal(headAtlasConcept(pons,'CT')?.conceptId,'brainstem-pons');
assert.equal(headAtlasConcept(midbrain,'CT')?.conceptId,'brainstem-midbrain');

function harness(){
  const pkg={},study={definition:{entries:[pons,midbrain]}},importGeneration={current:0},navigated:HeadEntry[]=[],chosen:HeadEntry[]=[];
  const scopes:{current:any}[]=[],committed=new Map<number,Effect>();let cursor=0,pending=new Map<number,Effect>(),disposed=false;
  const hooks:Hooks={useMemo:create=>create(),useRef(initial){const index=cursor++;return scopes[index]??(scopes[index]={current:initial});},
    useLayoutEffect(create,deps){pending.set(cursor++,{create,deps});}};
  const actions:Actions={importGeneration,practiceRef:{current:{active:false}},showLearningEntry:entry=>navigated.push(entry),chooseStructure:entry=>chosen.push(entry),
    resolveHeadConcept,headAtlasConcept};
  function input(active:HeadEntry=pons,override:Partial<Input>={}):Input{
    return {pkg,study,modality:'CT',quizActive:false,activeId:active.id,selected:{entry:active},inlineComparison:{pkg,study,modality:'CT'},
      rightPanel:'guided',learningPosition:{sequenceId:'brainstem',conceptId:headAtlasConcept(active,'CT')!.conceptId},...override};
  }
  function commit(){for(const [index,next] of pending){const prior=committed.get(index);
    if(prior?.deps&&next.deps&&prior.deps.length===next.deps.length&&prior.deps.every((value,i)=>Object.is(value,next.deps![i])))continue;
    prior?.cleanup?.();const cleanup=next.create();committed.set(index,{...next,cleanup:typeof cleanup==='function'?cleanup:undefined});}}
  function render(next=input(),shouldCommit=true){assert(!disposed);cursor=0;pending=new Map();const result=execute(next,hooks,actions);if(shouldCommit)commit();return result;}
  function unmount(){if(disposed)return;for(const effect of committed.values())effect.cleanup?.();committed.clear();disposed=true;}
  return {input,render,commit,unmount,navigated,chosen,importGeneration,pkg,study};
}

test('abandoned B render cannot retire visible A reverse callback or make B actionable',()=>{
  const view=harness(),visible=view.render();assert.equal(visible.comparisonOpen,true);
  const speculative=view.render(view.input(midbrain),false);assert.equal(speculative.comparisonOpen,true);
  speculative.selectComparisonConcept('brainstem-pons');assert.deepEqual(view.navigated,[],'uncommitted B cannot navigate');
  visible.selectComparisonConcept('brainstem-midbrain');
  assert.deepEqual(view.navigated,[midbrain]);assert.deepEqual(view.chosen,[midbrain]);
  view.unmount();
});

test('visible A reverse stays actionable after abandoned B render',()=>{
  const view=harness(),visible=view.render();
  view.render(view.input(midbrain),false);
  visible.selectComparisonConcept('brainstem-midbrain');
  assert.deepEqual(view.navigated,[midbrain],'visible A remains committed while B is abandoned');
  assert.deepEqual(view.chosen,[midbrain]);view.unmount();
});

test('layout commit retires old A before passive effects; current B accepts exact current entry only',()=>{
  const view=harness(),visible=view.render(),next=view.input(midbrain);
  const speculative=view.render(next,false);view.commit();
  visible.selectComparisonConcept('brainstem-midbrain');assert.deepEqual(view.navigated,[],'old A retires in layout');
  speculative.selectComparisonConcept('brainstem-medulla');assert.deepEqual(view.navigated,[],'unmapped entry cannot navigate');
  speculative.selectComparisonConcept('brainstem-pons');assert.deepEqual(view.navigated,[pons]);assert.deepEqual(view.chosen,[pons]);
  view.unmount();
});

test('retained callback is inert after unmount and generation or comparison identity changes',()=>{
  const view=harness(),visible=view.render();view.unmount();
  visible.selectComparisonConcept('brainstem-midbrain');assert.deepEqual(view.navigated,[]);
  const next=harness(),current=next.render();next.importGeneration.current++;
  current.selectComparisonConcept('brainstem-midbrain');assert.deepEqual(next.navigated,[],'old folder generation cannot navigate');
  next.unmount();
  const closed=harness(),inactive=closed.render(closed.input(pons,{inlineComparison:null}));
  inactive.selectComparisonConcept('brainstem-midbrain');assert.deepEqual(closed.navigated,[],'closed comparison cannot navigate');
  closed.unmount();
});
