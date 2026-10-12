import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {runInNewContext} from 'node:vm';
import {build} from './workspace-component-test-build.mjs';
const require=createRequire(import.meta.url),React=require('react');
const pins=JSON.parse(readFileSync('content/limb-nerve-quiz-pins.json','utf8'));
const compiled=await build({stdin:{contents:
  "export {QuizNotes} from './app/atlas-workspace';export {TourQuickCheck} from './app/tour-quick-check';export {limbNerveQuizChecks} from './lib/limb-nerve-quiz';",
  resolveDir:process.cwd(),loader:'tsx'},bundle:true,platform:'node',format:'cjs',write:false});
let exam=false,opened=false;
const shim={...React,useContext:()=>({exam}),useState:()=>[opened,value=>{opened=value;} ]};
const scope={exports:{}};
runInNewContext(compiled.outputFiles[0].text,{module:scope,exports:scope.exports,structuredClone,URL,console,
  require:id=>id==='react'?shim:id==='next/link'?()=>{throw Error('Unrelated Next Link must not render');}:require(id)});
const api=scope.exports;
const nodes=(node,out=[])=>{
  if(React.isValidElement(node)){out.push(node);React.Children.forEach(node.props.children,child=>nodes(child,out));}
  return out;
};
const ofType=(tree,name)=>nodes(tree).find(node=>typeof node.type==='function'&&node.type.name===name);
const supplementalKeys=[];
for(const row of pins.entries){
  const checks=api.limbNerveQuizChecks(row.identity);
  const lesson={...row.previous,additionalChecks:checks};
  opened=false;exam=false;
  let notes=api.QuizNotes({structure:row.identity});
  assert.equal(notes.type,'details');assert.equal(notes.props.open,undefined);
  assert.equal(ofType(notes,'LazyBodyTeaching').props.enabled,false,'No teaching import until disclosure opens');
  notes.props.onToggle({currentTarget:{open:true}});
  notes=api.QuizNotes({structure:row.identity});
  const loader=ofType(notes,'LazyBodyTeaching');assert(loader.props.enabled);
  const loaded=loader.props.children({bodyContent:()=>lesson});
  const primary=ofType(loaded,'StructureQuickCheck'),additional=ofType(loaded,'SupplementalQuizChecks');
  assert.deepEqual(JSON.parse(JSON.stringify(primary.props)),{
    question:row.previous.body,choices:row.previous.bullets,
    correctAnswer:row.previous.correctAnswer,explanation:row.previous.explanation,
  });
  assert.deepEqual(additional.props.checks,checks);
  assert.equal(additional.key,row.identity.id,'Bilateral selections reset even when question prose is identical');
  supplementalKeys.push(additional.key);
  const legacy=loader.props.children({bodyContent:()=>row.previous});
  assert.equal(ofType(legacy,'SupplementalQuizChecks'),undefined,'Optional checks do not alter existing-only lessons');
  let pauses=0;
  const tour=api.TourQuickCheck({lesson,onOpen(){pauses++;}});
  assert.equal(tour.props.open,undefined);
  assert.deepEqual(ofType(tour,'SupplementalQuizChecks').props.checks,checks);
  tour.props.onToggle({currentTarget:{open:true}});
  tour.props.onToggle({currentTarget:{open:false}});assert.equal(pauses,1,'Close never resumes tour');
  exam=true;assert.equal(api.QuizNotes({structure:row.identity}),null,'No primary or supplemental quiz notes in exam');
}
assert.equal(supplementalKeys.length,18);assert.equal(new Set(supplementalKeys).size,18);
console.log(JSON.stringify({passed:true,discovered:18,selectionKeys:18,primaryPreserved:true,examConcealment:true,tourPauseOnly:true}));
