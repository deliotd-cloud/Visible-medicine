import assert from 'node:assert/strict';
import test from 'node:test';
import {HEAD_MANIFEST_SHA256 as revision,type HeadEntry,type LoadedStudy} from '../lib/head-atlas-import.ts';
import {appendHeadReviewStudySet} from '../lib/head-review-study-set.ts';
import {headStudySetEntries,type HeadStudySet} from '../lib/head-study-set.ts';
import type {HeadPracticeReviewItem} from '../lib/head-atlas-practice.ts';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
import {createRequire} from 'node:module';
import {practiceEntries} from '../lib/head-atlas-practice.ts';
const affine=[[1,0,0,0],[0,1,0,0],[0,0,1,0],[0,0,0,1]];
function entry(id:string):HeadEntry{return {id,label:id,family:'synthetic',representation:'partial_mask',color:[1,0,0],opacity:{fill:.2,outline:1},mask:{file:id+'.bin',sha256:id.padEnd(64,'a'),dtype:'uint8',shape_kji:[1,1,1],offset_kji:[0,0,0],native_shape_kji:[2,2,2],ijk_to_ras:affine}};}
const a=entry('a'),b=entry('b'),c=entry('c'),correct=entry('correct'),unreviewed=entry('unreviewed');
const study={definition:{entries:[a,b,c,correct,unreviewed]}} as LoadedStudy;
const results:HeadPracticeReviewItem[]=[{entry:a,outcome:'incorrect'},{entry:b,outcome:'revealed'},{entry:c,outcome:'unanswered'},{entry:correct,outcome:'correct'}];
test('filtered review appends only requested misses in order, preserving prior set and results',()=>{
 const before:HeadStudySet={study,revision,entries:[unreviewed]};const snapshot=JSON.stringify(results);
 const added=appendHeadReviewStudySet(before,study,revision,results,[c,a]);assert(added);
 assert.equal(added.added,2);assert.deepEqual(headStudySetEntries(added.state,study,revision),[unreviewed,c,a]);
 assert.deepEqual(before.entries,[unreviewed]);assert.equal(JSON.stringify(results),snapshot);
 const again=appendHeadReviewStudySet(added.state,study,revision,results,[c,a]);assert(again);assert.equal(again.added,0);
});
test('reject a mixed or stale request atomically rather than accepting a valid prefix',()=>{
 for(const targets of [[a,correct],[a,unreviewed],[a,{...b}],[a,a],[]])assert.equal(appendHeadReviewStudySet(null,study,revision,results,targets),null);
 assert.equal(appendHeadReviewStudySet(null,study,'old',results,[a]),null);
 assert.equal(appendHeadReviewStudySet(null,null,revision,results,[a]),null);
 const other={definition:{entries:[{...a}]}} as LoadedStudy;
 assert.equal(appendHeadReviewStudySet({study,revision,entries:[a]},other,revision,results,[other.definition.entries[0]]),null);
 assert.equal(appendHeadReviewStudySet({study,revision,entries:[{...a}]},study,revision,results,[b]),null);
 assert.equal(appendHeadReviewStudySet(null,study,revision,[results[1]],[a]),null,'original and follow-up reviews are not interchangeable');
});
test('capacity preserves all existing entries and adds only the first fitting filtered masks',()=>{
 const entries=Array.from({length:53},(_,i)=>entry(`cap${i}`));const current={definition:{entries}} as LoadedStudy;
 const before={study:current,revision,entries:entries.slice(0,49)};
 const review=entries.slice(49).map(entry=>({entry,outcome:'incorrect' as const}));
 const added=appendHeadReviewStudySet(before,current,revision,review,[entries[52],entries[50],entries[49]]);assert(added);
 assert.equal(added.added,1);assert.deepEqual(added.state!.entries,[...entries.slice(0,49),entries[52]]);
 assert.equal(appendHeadReviewStudySet(added.state,current,revision,review,[entries[50]])?.added,0);
});

const viewer=readFileSync(new URL('../components/HeadAtlasViewer.tsx',import.meta.url),'utf8');
const syntax=ts.createSourceFile('viewer.tsx',viewer,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX),functions:string[]=[];
function visit(node:ts.Node){if(ts.isFunctionDeclaration(node)&&node.name&&['canUseStudySet','addReviewedStudyEntries'].includes(node.name.text))functions.push(node.getText(syntax));ts.forEachChild(node,visit);}visit(syntax);
assert.equal(functions.length,2);
function host(options:{active?:boolean;opening?:boolean;retired?:boolean;generation?:boolean;setChanged?:boolean;finished?:boolean;resultsChanged?:boolean}={}){
 const set:HeadStudySet={study,revision,entries:[unreviewed]},context={generation:1,results,originalResults:[results[1]]};
 const writes:HeadStudySet[]=[];
 const scope={study,studySet:set,studySetRef:{current:options.setChanged?null:set},reviewContext:context,reviewContextRef:{current:options.retired?{}:context},importGeneration:{current:options.generation?2:1},
  practiceRef:{current:{active:!!options.active,finished:options.finished!==false,results:options.resultsChanged?[...results]:results,originalResults:context.originalResults}},packageOpening:!!options.opening,
  HEAD_MANIFEST_SHA256:revision,appendHeadReviewStudySet,setStudySet:(value:HeadStudySet)=>writes.push(value)};
 const code=ts.transpileModule(functions.join('\n'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}}).outputText;
 const add=new Function(...Object.keys(scope),code+';return addReviewedStudyEntries;')(...Object.values(scope)) as (entries:HeadEntry[],source:'current'|'original')=>number|false;
 return {add,writes};
}
test('actual viewer callback blocks retired study/import/results, active questions and stale double clicks',()=>{
 for(const options of [{active:true},{opening:true},{retired:true},{generation:true},{setChanged:true},{finished:false},{resultsChanged:true}]){const h=host(options);assert.equal(h.add([a],'current'),false);assert.equal(h.writes.length,0);}
 const h=host();assert.equal(h.add([a,c],'current'),2);assert.deepEqual(h.writes[0]?.entries,[unreviewed,a,c]);
 assert.equal(h.add([b],'current'),false,'old callback cannot overwrite its queued set update');assert.equal(h.writes.length,1);
 const original=host();assert.equal(original.add([a],'original'),false);assert.equal(original.add([b],'original'),1);
 assert.match(viewer,/reviewStudySet:\{entries:studySetEntries,onAdd:addReviewedStudyEntries\}/);
});

test('actual practice panel binds current and original review actions separately, with revision gating',()=>{
 const source=readFileSync(new URL('../components/HeadAtlasPractice.tsx',import.meta.url),'utf8');
 const ast=ts.createSourceFile('practice.tsx',source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
 const declaration=ast.statements.find(node=>ts.isFunctionDeclaration(node)&&node.name?.text==='HeadAtlasPractice');assert(declaration);
 const code=ts.transpileModule(declaration.getText(ast).replace(/^export /,''),{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 const Review=()=>null,calls:unknown[]=[];
 const scope={useEffect:()=>{},practiceEntries,HEAD_LINK_REVISION:revision,HeadAtlasPracticeReview:Review,HeadPracticeSummaryDownload:()=>null};
 const panel=new Function('require','exports',...Object.keys(scope),code+';return HeadAtlasPractice;')(createRequire(import.meta.url),{},...Object.values(scope));
 const score={correct:0,attempted:1,revealed:1,remaining:0};
 const p={finished:true,active:false,headingRef:{current:null},score,originalScore:score,total:1,results,originalResults:[results[1]],end:()=>{}};
 const context={modality:'CT',revision,onSelect:()=>{},reviewStudySet:{entries:[],onAdd:(targets:HeadEntry[],source:string)=>{calls.push([targets,source]);return targets.length;}}};
 const nodes=(v:any):any[]=>Array.isArray(v)?v.flatMap(nodes):v?.props?[v,...nodes(v.props.children)]:[];
 const reviews=nodes(panel({practice:p,study,familyNames:{},reviewContext:context})).filter(n=>n.type===Review);
 assert.equal(reviews.length,2);assert.equal(reviews[0].props.studySet.onAdd([a]),1);assert.equal(reviews[1].props.studySet.onAdd([b]),1);
 assert.deepEqual(calls,[[[a],'current'],[[b],'original']]);
 for(const node of nodes(panel({practice:p,study,familyNames:{},reviewContext:{...context,revision:'stale'}})).filter(n=>n.type===Review))assert.equal(node.props.studySet,undefined);
});
