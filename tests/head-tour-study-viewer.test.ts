import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
import {HEAD_MANIFEST_SHA256,type HeadEntry,type LoadedStudy} from '../lib/head-atlas-import.ts';
import {appendHeadStudySet,type HeadStudySet} from '../lib/head-study-set.ts';
import {headTourStudyAdditions} from '../lib/head-tour-study-set.ts';
const source=readFileSync(new URL('../components/HeadAtlasViewer.tsx',import.meta.url),'utf8');
const ast=ts.createSourceFile('viewer.tsx',source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
const declarations:string[]=[];
function visit(n:ts.Node){if(ts.isFunctionDeclaration(n)&&n.name&&['canUseStudySet','addTourStudyEntries'].includes(n.name.text))declarations.push(n.getText(ast));ts.forEachChild(n,visit);}visit(ast);
assert.equal(declarations.length,2);
const executable=ts.transpileModule(declarations.join('\n'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}}).outputText;
function harness(option=''){
 const entry={id:'cth.bst.pons',label:'Pons — regional mask',representation:'partial-mask',laterality:'midline_or_unpaired',mask:{file:'synthetic.bin',sha256:'a'.repeat(64)}} as HeadEntry;
 const study={definition:{entries:[entry]}} as LoadedStudy;
 let state:HeadStudySet=null,calls=0;
 const reviewContext={study,generation:1},tourStudyContext={};
 const scope={study,studySet:state,studySetRef:{current:option==='set'?{}:state},practiceRef:{current:{active:option==='practice'}},packageOpening:option==='opening',reviewContext,reviewContextRef:{current:option==='review'?{}:reviewContext},importGeneration:{current:option==='generation'?2:1},rightPanel:option==='panel'?'info':'guided',tourStudyContext,tourStudyContextRef:{current:option==='tour'?{}:tourStudyContext},HEAD_MANIFEST_SHA256,modality:'CT',learningPosition:{sequenceId:option==='unknown'?'unknown':'brainstem',conceptId:null},headTourStudyAdditions,appendHeadStudySet,setStudySet:(fn:(s:HeadStudySet)=>HeadStudySet)=>{calls++;state=fn(state);}};
 const action=new Function(...Object.keys(scope),executable+'\nreturn addTourStudyEntries;')(...Object.values(scope));
 return {action,entry,get calls(){return calls;},get state(){return state;}};
}
test('actual viewer handler adds exact tour masks without navigation, practice or persistence',()=>{
 const h=harness();h.action();assert.equal(h.calls,1);assert.deepEqual(h.state?.entries,[h.entry]);
 h.action();assert.deepEqual(h.state?.entries,[h.entry]);
 assert(!/startTarget|writeNavigation|setRightPanel|localStorage|sessionStorage|fetch/.test(declarations.find(d=>d.includes('function addTourStudyEntries'))!));
});
test('actual viewer refuses stale tour, study and inactive or unknown contexts',()=>{
 for(const option of ['set','practice','opening','review','generation','panel','tour','unknown']){const h=harness(option);h.action();assert.equal(h.calls,0,option);assert.equal(h.state,null,option);}
});
test('guided view receives current count, total and guarded handler',()=>{
 assert.match(source,/studySetAdd=\{\{count:tourStudyAdditions.targets.length,total:tourStudyAdditions.entries.length,onAdd:addTourStudyEntries\}\}/);
 assert.match(source,/tourStudyContextRef.current=tourStudyContext/);
});
