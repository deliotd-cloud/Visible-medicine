import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import ts from 'typescript';

// Execute the viewer's actual handler instead of copying its branching logic.
const source=readFileSync(new URL('../components/HeadAtlasViewer.tsx',import.meta.url),'utf8');
const tree=ts.createSourceFile('HeadAtlasViewer.tsx',source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
let retryDeclaration:ts.FunctionDeclaration|undefined;
function visit(node:ts.Node):void{
  if(ts.isFunctionDeclaration(node)&&node.name?.text==='retryStudy')retryDeclaration=node;
  ts.forEachChild(node,visit);
}
visit(tree);
assert(retryDeclaration,'retryStudy must remain a viewer handler');
const compiled=ts.transpileModule(`${retryDeclaration.getText(tree)}\nreturn retryStudy;`,{
  compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS},
});
type Package={source:'configured-local'|'folder'};
type HarnessOptions={source?:Package['source'];failed?:boolean;stalePackage?:boolean;staleModality?:boolean;study?:boolean;packageOpening?:boolean;quizActive?:boolean};
function harness(options:HarnessOptions={}){
  const pkg:Package={source:options.source??'configured-local'};
  const failedStudyRef:{current:{pkg:Package;modality:string}|null}={current:options.failed===false?null:{pkg:options.stalePackage?{...pkg}:pkg,modality:options.staleModality?'MRI':'CT'}};
  const events:string[]=[];
  let failed=true,error='old error',status='',attempt=0;
  const setStudyLoadFailed=(value:boolean)=>{failed=value;events.push(`failed:${value}`);};
  const setError=(value:string)=>{error=value;events.push(`error:${value}`);};
  const setStatus=(value:string)=>{status=value;events.push(`status:${value}`);};
  const setStudyLoadAttempt=(update:(value:number)=>number)=>{attempt=update(attempt);events.push(`attempt:${attempt}`);};
  let opens=0,focuses=0;
  const openConfiguredAtlas=()=>{opens++;events.push('open');};
  const openButtonRef={current:{focus(){focuses++;events.push('focus');}}};
  const make=new Function('failedStudyRef','pkg','modality','study','packageOpening','quizActive','setStudyLoadFailed','setError','setStatus','setStudyLoadAttempt','openConfiguredAtlas','openButtonRef',compiled.outputText) as (...args:any[])=>()=>void;
  const retry=make(failedStudyRef,pkg,'CT',options.study?{}:null,!!options.packageOpening,!!options.quizActive,setStudyLoadFailed,setError,setStatus,setStudyLoadAttempt,openConfiguredAtlas,openButtonRef);
  return {retry,failedStudyRef,events,get state(){return {failed,error,status,attempt,opens,focuses};}};
}

test('configured retry consumes the failure and opens a fresh package exactly once',()=>{
  const h=harness();h.retry();h.retry();
  assert.equal(h.failedStudyRef.current,null);
  assert.deepEqual(h.events.slice(0,3),['failed:false','error:','status:Opening CT native image…']);
  assert.equal(h.state.opens,1);
  assert.equal(h.state.attempt,0,'the dead configured package must not be reused');
  assert.equal(h.state.focuses,1);
});

test('folder package retry reuses its live package study loader',()=>{
  const h=harness({source:'folder'});h.retry();h.retry();
  assert.equal(h.state.opens,0);
  assert.equal(h.state.attempt,1);
  assert.equal(h.state.focuses,1);
  assert.equal(h.failedStudyRef.current,null);
});

test('retry refuses absent, stale, active and practice-state failures without changing state',()=>{
  for(const options of [
    {failed:false},{stalePackage:true},{staleModality:true},{study:true},{packageOpening:true},{quizActive:true},
  ]){
    const h=harness(options);const original=h.failedStudyRef.current;
    h.retry();
    assert.equal(h.failedStudyRef.current,original,JSON.stringify(options));
    assert.deepEqual(h.events,[],JSON.stringify(options));
    assert.deepEqual(h.state,{failed:true,error:'old error',status:'',attempt:0,opens:0,focuses:0});
  }
});
