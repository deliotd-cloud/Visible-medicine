import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
import {HEAD_MANIFEST_SHA256,type HeadEntry,type LoadedStudy} from '../lib/head-atlas-import.ts';
import {HEAD_LINK_REVISION} from '../lib/head-atlas-links.ts';
import {headLearningSteps} from '../lib/head-atlas-learning.ts';
import {practiceEntries,type PracticeMode} from '../lib/head-atlas-practice.ts';

const source=readFileSync(new URL('../components/HeadAtlasViewer.tsx',import.meta.url),'utf8');
const ast=ts.createSourceFile('viewer.tsx',source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
const names=['canStartGuidedPractice','startGuidedPractice','startGuidedPracticeSequence'];
const declarations:string[]=[];
function visit(node:ts.Node){
  if(ts.isFunctionDeclaration(node)&&node.name&&names.includes(node.name.text))declarations.push(node.getText(ast));
  ts.forEachChild(node,visit);
}
visit(ast);assert.equal(declarations.length,3);
const code=ts.transpileModule(declarations.join('\n'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}}).outputText;

function harness(option='',modality:'CT'|'MRI'='CT'){
  const prefix=modality==='CT'?'cth':'mrb';
  const entries=['midbrain','pons','medulla_oblongata'].map((part,index)=>({id:`${prefix}.bst.${part}`,label:part==='pons'?'Pons — regional mask':part==='midbrain'?'Midbrain — regional mask':'Medulla oblongata — regional mask',representation:'partial-mask',laterality:'midline_or_unpaired',mask:{file:'synthetic.bin',sha256:String(index+1).repeat(64)}} as HeadEntry));
  const study={definition:{entries}} as LoadedStudy;
  // Use the real source resolver; fixtures do not manufacture tour membership.
  const expected=headLearningSteps(entries,'brainstem',modality,HEAD_MANIFEST_SHA256).flatMap(step=>step.entry?[step.entry]:[]);
  assert.deepEqual(expected,entries);
  const calls:Array<{kind:string;args:unknown[]}>=[];
  const guidedPracticeContext={generation:1,consumed:false};
  const guidedPracticeContextRef={current:option==='retired'||option==='unmounted'?null:guidedPracticeContext};
  const practiceRef={current:{active:option==='active'}};
  const importGeneration={current:option==='generation'?2:1};
  const start=(kind:string,...args:unknown[])=>{calls.push({kind,args});if(option==='reentrant')actions.single(entries[1]);return option!=='refused';};
  const scope={guidedPracticeContext,guidedPracticeContextRef,practiceRef,importGeneration,
    packageOpening:option==='opening',rightPanel:option==='panel'?'info':'guided',pkg:option==='package'?null:{},study:option==='study'?null:study,
    HEAD_LINK_REVISION:option==='revision'?'0'.repeat(64):HEAD_LINK_REVISION,HEAD_MANIFEST_SHA256,
    headLearningSteps,practiceEntries,modality,learningPosition:{sequenceId:option==='sequence'?'foreign':'brainstem',conceptId:option==='step'?'brainstem-medulla':'brainstem-pons'},
    practice:{startTarget:(...args:unknown[])=>start('single',...args),startTargets:(...args:unknown[])=>start('tour',...args)},
    writeNavigation:(...args:unknown[])=>calls.push({kind:'navigation',args}),setPracticeOrigin:(...args:unknown[])=>calls.push({kind:'origin',args}),setRightPanel:(...args:unknown[])=>calls.push({kind:'panel',args})};
  const actions=new Function(...Object.keys(scope),code+'\nreturn {single:startGuidedPractice,tour:startGuidedPracticeSequence};')(...Object.values(scope)) as {single:(entry:HeadEntry)=>void;tour:(entries:HeadEntry[],mode:PracticeMode)=>void};
  return {actions,entries,calls,guidedPracticeContext,guidedPracticeContextRef,practiceRef,importGeneration};
}

for(const modality of ['CT','MRI'] as const){
  test(`${modality} current exact guided target starts once and retains its learning origin`,()=>{
    const h=harness('',modality);h.actions.single(h.entries[1]);h.actions.single(h.entries[1]);h.actions.tour(h.entries,'label');
    assert.deepEqual(h.calls.map(call=>call.kind),['single','navigation','origin','panel']);
    assert.equal(h.calls[0].args[0],h.entries[1]);
    assert.deepEqual(h.calls[2].args,[{sequenceId:'brainstem',conceptId:'brainstem-pons'}]);
    assert.deepEqual(h.calls[3].args,['practice']);
  });
  for(const mode of ['locate','label','recall'] as const)test(`${modality} current ordered tour starts once in ${mode}`,()=>{
    const h=harness('',modality);h.actions.tour(h.entries,mode);h.actions.tour(h.entries,mode);h.actions.single(h.entries[1]);
    assert.deepEqual(h.calls.map(call=>call.kind),['tour','navigation','origin','panel']);
    assert.deepEqual(h.calls[0].args,[h.entries,mode]);
  });
}
for(const option of ['retired','unmounted','generation','active','opening','panel','package','study','revision','sequence'])test(`guided parent refuses ${option} callback before practice or navigation`,()=>{
  const h=harness(option);h.actions.single(h.entries[1]);h.actions.tour(h.entries,'locate');assert.deepEqual(h.calls,[]);
});
test('quick check rejects another step, cloned identity, points and absent target without consuming current launch',()=>{
  const h=harness('step');h.actions.single(h.entries[1]);h.actions.single({...h.entries[2]});h.actions.single(undefined as never);assert.deepEqual([...h.calls],[]);
  h.actions.single(h.entries[2]);assert.equal(h.calls[0].kind,'single');
  const point=harness();point.entries[1].representation='point' as never;point.entries[1].mask=undefined;point.actions.single(point.entries[1]);assert.deepEqual(point.calls,[]);
});
test('tour rejects changed order, subset, extra, duplicate, cloned target and unknown mode',()=>{
  const h=harness();
  for(const entries of [[...h.entries].reverse(),h.entries.slice(1),[...h.entries,h.entries[0]],[h.entries[0],h.entries[0],h.entries[2]],h.entries.map(entry=>({...entry}))])h.actions.tour(entries,'locate');
  h.actions.tour(h.entries,'foreign' as never);h.actions.tour(null as never,'locate');assert.deepEqual([...h.calls],[]);
  assert.equal(h.guidedPracticeContext.consumed,false);h.actions.tour(h.entries,'locate');assert.equal(h.calls[0].kind,'tour');
});
test('reservation precedes a reentrant practice callback and failed launch cannot navigate',()=>{
  const h=harness('reentrant');h.actions.single(h.entries[1]);assert.equal(h.calls.filter(call=>call.kind==='single').length,1);
  const refused=harness('refused');refused.actions.tour(refused.entries,'locate');refused.actions.single(refused.entries[1]);
  assert.deepEqual(refused.calls.map(call=>call.kind),['tour']);
});
test('actual guided props use guarded parent handlers and commit cleanup retires the context',()=>{
  assert.match(source,/onPracticeSequence=\{startGuidedPracticeSequence\} onPractice=\{startGuidedPractice\}/);
  assert.match(source,/useLayoutEffect\(\(\)=>\{\s*guidedPracticeContextRef.current=guidedPracticeContext;/);
  assert.match(source,/return\(\)=>\{if\(guidedPracticeContextRef.current===guidedPracticeContext\)guidedPracticeContextRef.current=null;/);
});
