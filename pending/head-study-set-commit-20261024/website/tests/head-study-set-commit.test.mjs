import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {HEAD_MANIFEST_SHA256} from '../lib/head-atlas-import.ts';
import {headStudySetEntries,toggleHeadStudySet} from '../lib/head-study-set.ts';
import {appendHeadReviewStudySet} from '../lib/head-review-study-set.ts';

const require=createRequire(import.meta.url);
const ts=require('typescript');
const sourcePath=process.env.HEAD_STUDY_SET_SOURCE||new URL('../components/HeadAtlasViewer.tsx',import.meta.url);
const source=readFileSync(sourcePath,'utf8');
const tree=ts.createSourceFile('HeadAtlasViewer.tsx',source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
const names=new Set(['canUseStudySet','toggleStudyEntry','addReviewedStudyEntries']);
const functions=new Map();
function visit(node){
  if(ts.isFunctionDeclaration(node)&&names.has(node.name?.text))functions.set(node.name.text,node.getText(tree));
  ts.forEachChild(node,visit);
}
visit(tree);
for(const name of names)assert(functions.has(name),`missing actual ${name}`);
function between(start,end){
  const from=source.indexOf(start),to=source.indexOf(end,from+start.length);
  assert(from>=0&&to>from,`missing actual source block ${start}`);
  return source.slice(from,to);
}
const state=between('const [studySet,setStudySet]=useState<HeadStudySet>(null);','const studySetRef=');
const setRef=between('const studySetRef=','useEffect(()=>{setStudySet(null);},[study,pkg,modality]);');
const reviewRef=between('const reviewContext=','// Stable for the wheel listener');
const compiled=ts.transpileModule([state,setRef,reviewRef,...[...names].map(name=>functions.get(name)),
  'return {canUseStudySet,toggleStudyEntry,addReviewedStudyEntries,reviewContext,studySet,studySetRef,reviewContextRef};'].join('\n'),
  {reportDiagnostics:true,compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.None}});
assert.equal(compiled.diagnostics?.filter(item=>item.category===ts.DiagnosticCategory.Error).length,0);
const scope=['useState','useRef','useMemo','useLayoutEffect','pkg','study','modality','practice','importGeneration','practiceRef','packageOpening',
  'toggleHeadStudySet','appendHeadReviewStudySet','HEAD_MANIFEST_SHA256'];
const actualRender=new Function(...scope,compiled.outputText);
const affine=[[1,0,0,0],[0,1,0,0],[0,0,1,0],[0,0,0,1]];
function entry(id){return {id,label:id,family:'synthetic',representation:'partial_mask',color:[1,0,0],opacity:{fill:.2,outline:.8},
  mask:{file:`${id}.bin`,sha256:(id.includes('pons')?'a':'c').repeat(64),dtype:'uint8',shape_kji:[1,1,1],offset_kji:[0,0,0],native_shape_kji:[2,2,2],ijk_to_ras:affine}};}
function harness(){
  const a=entry('cth.bst.pons'),b=entry('cth.bst.medulla');
  const study={definition:{image:{file:'synthetic.bin',sha256:'b'.repeat(64),dtype:'uint8',shape_kji:[2,2,2],ijk_to_ras:affine},entries:[a,b]}};
  const pkg={manifest:{version:'synthetic'}};
  const importGeneration={current:1},practiceRef={current:{active:false,finished:false,results:[],originalResults:[]}};
  let currentSet=null,refCursor=0,effects=[],refs=[],installed=[];
  function render({set=currentSet,results=[],active=false,finished=false,opening=false}={}){
    refCursor=0;effects=[];
    const practice={results,originalResults:[],active,finished};
    const useState=()=>[set,update=>{currentSet=typeof update==='function'?update(currentSet):update;}];
    const useRef=initial=>{const index=refCursor++;return refs[index]??(refs[index]={current:initial});};
    const useMemo=make=>make();
    const useLayoutEffect=(effect,deps)=>effects.push({effect,deps});
    const args={useState,useRef,useMemo,useLayoutEffect,pkg,study,modality:'CT',practice,importGeneration,practiceRef,
      packageOpening:opening,toggleHeadStudySet,appendHeadReviewStudySet,HEAD_MANIFEST_SHA256};
    const actions=actualRender(...scope.map(key=>args[key]));
    return {...actions,effects:[...effects]};
  }
  function commit(view){
    view.effects.forEach((next,index)=>{
      const old=installed[index];
      if(old&&old.deps.length===next.deps.length&&old.deps.every((value,i)=>Object.is(value,next.deps[i])))return;
      old?.cleanup?.();
      installed[index]={...next,cleanup:next.effect()};
    });
  }
  function unmount(){for(const old of installed)old.cleanup?.();installed=[];}
  function strictReplay(view){for(const old of installed)old.cleanup?.();installed=view.effects.map(next=>({...next,cleanup:next.effect()}));}
  return {a,b,study,render,commit,unmount,strictReplay,importGeneration,practiceRef,getSet:()=>currentSet,setSet:value=>{currentSet=value;}};
}

test('discarded fresh-result render cannot retire committed CT Add or activate speculative Add',()=>{
  const h=harness(),visible=h.render();h.commit(visible);
  assert.equal(visible.canUseStudySet(),true);
  const speculative=h.render({results:[]}); // new arrays match the real hook's render behavior
  assert.notEqual(speculative.reviewContext,visible.reviewContext);
  assert.equal(visible.canUseStudySet(),true);
  assert.equal(speculative.canUseStudySet(),false);
  speculative.toggleStudyEntry(h.a);
  assert.deepEqual(headStudySetEntries(h.getSet(),h.study,HEAD_MANIFEST_SHA256),[]);
  visible.toggleStudyEntry(h.a);
  assert.deepEqual(headStudySetEntries(h.getSet(),h.study,HEAD_MANIFEST_SHA256),[h.a]);
});

test('discarded study-set replacement cannot retire committed Add; committed replacement retires old controls',()=>{
  const h=harness(),visible=h.render();h.commit(visible);
  const replacement=toggleHeadStudySet(null,h.study,HEAD_MANIFEST_SHA256,h.b);
  const speculative=h.render({set:replacement});
  assert.equal(visible.canUseStudySet(),true);
  assert.equal(speculative.canUseStudySet(),false);
  speculative.toggleStudyEntry(h.a);
  assert.equal(h.getSet(),null);
  h.setSet(replacement);const next=h.render();h.commit(next);
  assert.equal(visible.canUseStudySet(),false);
  assert.equal(next.canUseStudySet(),true);
  visible.toggleStudyEntry(h.a);
  assert.deepEqual(headStudySetEntries(h.getSet(),h.study,HEAD_MANIFEST_SHA256),[h.b]);
  next.toggleStudyEntry(h.a);
  assert.deepEqual(headStudySetEntries(h.getSet(),h.study,HEAD_MANIFEST_SHA256),[h.b,h.a]);
});

test('active practice, changed generation, package opening and changed set stay refused',()=>{
  const h=harness(),visible=h.render();h.commit(visible);
  h.practiceRef.current.active=true;assert.equal(visible.canUseStudySet(),false);
  h.practiceRef.current.active=false;h.importGeneration.current=2;assert.equal(visible.canUseStudySet(),false);
  h.importGeneration.current=1;h.commit(h.render({opening:true}));
  const opening=h.render({opening:true});assert.equal(opening.canUseStudySet(),false);
  visible.studySetRef.current=toggleHeadStudySet(null,h.study,HEAD_MANIFEST_SHA256,h.b);
  assert.equal(visible.canUseStudySet(),false);
});

test('unmount and StrictMode effect replay retire then restore only the current control',()=>{
  const h=harness(),visible=h.render();h.commit(visible);
  assert.equal(visible.canUseStudySet(),true);
  h.unmount();assert.equal(visible.canUseStudySet(),false);
  h.commit(visible);assert.equal(visible.canUseStudySet(),true);
  h.strictReplay(visible);assert.equal(visible.canUseStudySet(),true);
  h.unmount();assert.equal(visible.canUseStudySet(),false);
});

test('review add reserves the new set synchronously against duplicate old callbacks',()=>{
  const h=harness(),results=[{entry:h.a,outcome:'incorrect'}];
  const visible=h.render({results,finished:true});h.commit(visible);
  h.practiceRef.current={active:false,finished:true,results,originalResults:visible.reviewContext.originalResults};
  assert.equal(visible.addReviewedStudyEntries([h.a],'current'),1);
  assert.deepEqual(headStudySetEntries(h.getSet(),h.study,HEAD_MANIFEST_SHA256),[h.a]);
  assert.equal(visible.addReviewedStudyEntries([h.a],'current'),false);
  const next=h.render({set:h.getSet(),results,finished:true});h.commit(next);
  assert.equal(next.canUseStudySet(),true);
});
