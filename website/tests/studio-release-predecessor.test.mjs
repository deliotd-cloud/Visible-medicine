import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';

const require=createRequire(new URL('../package.json',import.meta.url)),ts=require('typescript');
const helperSource=readFileSync(new URL('../lib/studio-release-predecessor.ts',import.meta.url),'utf8');
const helperCode=ts.transpileModule(helperSource,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const helperModule={exports:{}};
new Function('module','exports',helperCode)(helperModule,helperModule.exports);
const {matchesReleasePredecessor,readOptionalPredecessor,selectReleaseDraft}=helperModule.exports;
const binding={courseId:'course-one',releaseId:'release-created-one',version:3,availableWorkbookIds:['workbook-one','workbook-two']};
const draft=(overrides={})=>JSON.stringify({
  expectedCourseId:binding.courseId,expectedReleaseId:binding.releaseId,expectedVersion:'1',
  title:'Synthetic unsent edit',slug:'synthetic-release',summary:'A complete synthetic summary for a private release.',
  level:'Intermediate',duration:'Self-paced',outcomes:'First synthetic outcome\nSecond synthetic outcome',
  workbookIds:['workbook-one'],publisherName:'Synthetic education',publisherKind:'institution',
  visibility:'private',accessModel:'invitation',enrolmentOpen:'false',...overrides
});

test('a bounded, exactly bound predecessor at or below the saved version is eligible',()=>{
  assert.equal(matchesReleasePredecessor(draft(),binding),true);
  assert.equal(matchesReleasePredecessor(draft({expectedVersion:'3'}),binding),true);
  assert.equal(matchesReleasePredecessor(draft({title:'',summary:'',outcomes:'',workbookIds:'false'}),binding),true,'incomplete text can still be recovered for editing');
});

test('foreign, future, new and malformed predecessors are never eligible',()=>{
  for(const raw of [
    draft({expectedCourseId:'course-two'}),draft({expectedReleaseId:'release-other'}),
    draft({expectedVersion:'4'}),draft({expectedVersion:'new'}),draft({expectedVersion:'0'}),
    draft({expectedVersion:'01'}),draft({expectedVersion:1}),'{broken',JSON.stringify([]),
    draft({title:undefined}),draft({summary:undefined}),draft({workbookIds:undefined}),
    draft({outcomes:['not a textarea value']}),draft({workbookIds:[4]}),draft({workbookIds:['foreign-workbook']}),
    draft({workbookIds:['workbook-one','workbook-one']}),draft({unknownField:'foreign'}),
    draft({accessModel:'paid'}),draft({enrolmentOpen:'not-a-checkbox-value'}),
    'x'.repeat(512*1024+1)
  ])assert.equal(matchesReleasePredecessor(raw,binding),false,raw.slice(0,70));
  assert.equal(matchesReleasePredecessor(draft(),{...binding,version:0}),false);
  assert.equal(matchesReleasePredecessor(draft(),{...binding,releaseId:''}),false);
});

test('a current-key draft wins races against valid, malformed and foreign predecessors',()=>{
  const primary=draft({title:'Current-key edit'});
  for(const predecessor of [draft(),'{broken',draft({expectedReleaseId:'foreign-release'})]){
    let reads=0;
    const selected=selectReleaseDraft(null,()=>{reads++;return primary;},()=>predecessor,binding);
    assert.equal(selected.source,'primary');assert.equal(selected.raw,primary);assert.equal(reads,1);
  }
  // The primary can also arrive while validation of an eligible predecessor runs.
  let reads=0;
  const later=selectReleaseDraft(null,()=>++reads===1?null:primary,()=>draft(),binding);
  assert.equal(later.source,'primary');assert.equal(later.raw,primary);
  reads=0;
  const malformedLater=selectReleaseDraft(null,()=>++reads===1?null:primary,()=>'{broken',binding);
  assert.equal(malformedLater.source,'primary');assert.equal(malformedLater.raw,primary);
  // A malformed current key is still authoritative and must not fall back.
  let predecessorReads=0;
  const malformed=selectReleaseDraft('{broken',()=>null,()=>{predecessorReads++;return draft();},binding);
  assert.equal(malformed.source,'primary');assert.equal(malformed.raw,'{broken');assert.equal(predecessorReads,0);
  const alreadyCurrent=selectReleaseDraft(primary,()=>null,()=>{throw new Error('old-key read must not run');},binding);
  assert.equal(alreadyCurrent.source,'primary');
  const afterReadFailure=selectReleaseDraft(null,()=>primary,()=>{throw new Error('old-key denied');},binding);
  assert.equal(afterReadFailure.source,'primary');assert.equal(afterReadFailure.raw,primary);assert.equal(afterReadFailure.predecessorUnavailable,true);
  assert.throws(()=>selectReleaseDraft(null,()=>null,()=>{throw new Error('old-key denied');},binding),/could not be inspected/);
});

test('an unmatched predecessor stays unmatched when no current key arrives',()=>{
  const selected=selectReleaseDraft(null,()=>null,()=>draft({expectedVersion:'4'}),binding);
  assert.equal(selected.source,'unmatched');assert.equal(selected.raw,null);
});

test('optional predecessor read failure is attention data and cannot veto a primary',()=>{
  assert.deepEqual(readOptionalPredecessor(()=>{throw new Error('synthetic old-key read failure');}),{raw:null,unavailable:true});
  assert.deepEqual(readOptionalPredecessor(()=>draft()),{raw:draft(),unavailable:false});
});

test('the form wires the predecessor only for an existing release; ActionForm keeps primary-first and byte-matched cleanup',()=>{
  const source=readFileSync(new URL('../components/StudioForms.tsx',import.meta.url),'utf8');
  assert.match(source,/predecessor=\{release&&\["draft","changes-requested"\]\.includes\(release\.status\)\?\{draftKey:`release:\$\{course\.id\}`/);
  assert.match(source,/if\(raw===null\)\{[\s\S]*?selectReleaseDraft\(raw,/);
  assert.match(source,/lockStudioDraft\(submittedPredecessor\.scopedKey/);
  assert.match(source,/current!==submittedPredecessor\.raw/);
  assert.match(source,/if\(unavailable\)predecessorReadFailed=true/);
  assert.match(source,/revision\.current===submittedRevision/);
});
