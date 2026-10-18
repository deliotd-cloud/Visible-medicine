import assert from 'node:assert/strict';
import test from 'node:test';
import {headLearningLinks,headLearningSequencesForModality} from '../lib/head-atlas-learning.ts';
import {headGuidedDestination,headFocusResult,headGuidedMatches,HEAD_FOCUS_PROTOCOL} from '../lib/head-guided-focus.ts';
import type {LiveHeadSelection} from '../lib/head-live-selection.ts';
import {headConceptById} from '../lib/head-atlas-links.ts';

const first=headLearningLinks({sequenceId:'brainstem',conceptId:'brainstem-pons'})?.atlasHref;assert(first);
const destination=headGuidedDestination(first)!;

test('every authored tour destination round-trips to a source-bound root or nested focus target',()=>{
  let count=0,roots=0,nested=0;
  for(const sequence of headLearningSequencesForModality())for(const conceptId of sequence.concepts){
    const position={sequenceId:sequence.id,conceptId};
    const href=headLearningLinks(position)?.atlasHref;
    if(!href){assert.equal(sequence.id,'cerebellar-orientation');continue;}
    const result=headGuidedDestination(href);assert(result,href);count++;
    assert.deepEqual(result.position,position);assert.equal(result.href,href);
    const query=new URL(href,'https://example.invalid').searchParams;
    const runtime=new URL(result.src,'https://example.invalid');
    assert.equal(runtime.pathname,'/atlas-runtime/head-neck/index.html');
    assert.equal(runtime.searchParams.get('region'),'head-neck');
    for(const key of ['study','structure','side','source','focus','detail','part','partSource'])
      assert.equal(runtime.searchParams.get(key),query.get(key),`${conceptId}: ${key}`);
    assert.equal(runtime.searchParams.has('concept'),false);
    assert.equal(runtime.searchParams.has('headTour'),false);
    assert.equal(runtime.searchParams.has('headStep'),false);
    assert.equal(runtime.searchParams.has('headRevision'),false);
    const target=result.target;assert.equal(target.laterality,target.id.split(':')[4]);
    if(query.get('study')==='2'){
      nested++;assert.equal(target.kind,'nested');
      assert.deepEqual(target,{kind:'nested',id:query.get('part'),source:query.get('partSource'),
        laterality:query.get('part')!.split(':')[4],parentId:query.get('structure'),
        parentSource:query.get('source'),study:query.get('detail')});
    }else{
      roots++;assert.equal(target.kind,'root');
      assert.deepEqual(target,{kind:'root',id:query.get('structure'),source:query.get('source'),
        laterality:query.get('structure')!.split(':')[4]});
    }
  }
  assert(count>25);assert(roots>0);assert(nested>0);
});

test('foreign, widened, duplicate, fragment and noncanonical encodings are refused',()=>{
  const url=new URL(first,'https://example.invalid');
  const query=url.searchParams;
  const variants=[
    'https://example.invalid'+first,'//example.invalid'+first,first.replace('/atlas/head-neck-3d','/atlas/ct-head'),
    first+'#focus',first+'&patientId=private',first+'&redirect=https%3A%2F%2Fexample.invalid',
    first+'&quizAnswer=1',first+'&source='+query.get('source'),
    first.replace('headStep=1','headStep=01'),first.replace('study=2','study=1'),
    first.replace('concept=brainstem-pons','concept=brainstem%2Dpons'),
    first.replace('study=2&structure=','structure=').replace('&side=','&study=2&side='),
    first.replace('source='+query.get('source'),'source='+('0'.repeat(64))),
  ];
  for(const href of variants)assert.equal(headGuidedDestination(href),null,href);
  for(const key of query.keys())assert.equal(headGuidedDestination(first+'&'+key+'='+encodeURIComponent(query.get(key)!)),null,key);
});

test('focus result requires exact current revision, session and command with no payload',()=>{
  const revision='a'.repeat(40),session='session_123456789';
  const base={type:HEAD_FOCUS_PROTOCOL+'-result',version:1,revision,session,command:7,status:'accepted'};
  assert.equal(headFocusResult(base,revision,session,7),'accepted');
  assert.equal(headFocusResult({...base,status:'refused'},revision,session,7),'refused');
  for(const value of [null,[],{}, {...base,status:'other'},{...base,version:2},
    {...base,type:'other'},{...base,revision:'b'.repeat(40)},{...base,session:'session_987654321'},
    {...base,command:6},{...base,command:8},{...base,coordinates:[1,2,3]},
    {...base,target:destination.target},{...base,patient:'private'}])
    assert.equal(headFocusResult(value,revision,session,7),null);
  assert.equal(headFocusResult(base,revision,session,6),null,'a later command cannot consume a prior result');
  for(const [badRevision,badSession,badCommand] of [['A'.repeat(40),session,7],
    [revision,'short',7],[revision,session,0],[revision,session,1.5],[revision,session,Number.MAX_SAFE_INTEGER+1]] as const)
    assert.equal(headFocusResult(base,badRevision,badSession,badCommand),null);
});

test('only a subsequent selected snapshot for the exact concept confirms guided focus',()=>{
  const concept=headConceptById(destination.position.conceptId!)!;
  const selected:LiveHeadSelection={sequence:3,status:'selected',concept};
  assert.equal(headGuidedMatches(selected,destination),true);
  assert.equal(headGuidedMatches({...selected,concept:headConceptById('brainstem-midbrain')},destination),false);
  assert.equal(headGuidedMatches({...selected,concept:null},destination),false);
  assert.equal(headGuidedMatches({...selected,status:'empty'},destination),false);
  assert.equal(headGuidedMatches({...selected,status:'blocked',reason:'guided'},destination),false);
});
