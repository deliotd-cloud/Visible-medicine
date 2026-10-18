import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import ts from 'typescript';
import {headLearningLinks,headLearningSequencesForModality} from '../lib/head-atlas-learning.ts';
import {headGuidedDestination} from '../lib/head-guided-focus.ts';
import {headGuidedPlaybackPlan} from '../lib/head-guided-playback.ts';

test('the standalone model preserves every canonical position in all mapped sequences',()=>{
  let mappedSequences=0,mappedStops=0;
  for(const sequence of headLearningSequencesForModality()){
    const first=headLearningLinks({sequenceId:sequence.id,conceptId:sequence.concepts[0]})?.atlasHref;
    if(!first||!headGuidedDestination(first))continue;
    mappedSequences++;
    for(const [index,conceptId] of sequence.concepts.entries()){
      const current=headLearningLinks({sequenceId:sequence.id,conceptId})?.atlasHref;
      assert(current,`${sequence.id}/${conceptId} has an authored link`);
      const destination=headGuidedDestination(current);
      assert(destination,`${sequence.id}/${conceptId} has an exact model target`);
      const plan=headGuidedPlaybackPlan(destination.position);
      assert(plan,`${sequence.id}/${conceptId} has a playback plan`);
      assert.equal(plan.index,index);
      assert.equal(plan.total,sequence.concepts.length);
      assert.equal(plan.nextId,sequence.concepts[index+1]??null);
      assert.equal(plan.nextHref,sequence.concepts[index+1]
        ?headLearningLinks({sequenceId:sequence.id,conceptId:sequence.concepts[index+1]})?.atlasHref:null);
      assert.equal(plan.gap,false);
      mappedStops++;
    }
  }
  assert.equal(mappedSequences,12);
  assert.equal(mappedStops,42);
});

test('image-only cerebellar positions never fabricate a model plan',()=>{
  const sequence=headLearningSequencesForModality().find(item=>item.id==='cerebellar-orientation');
  assert(sequence);assert.equal(sequence.concepts.length,3);
  for(const [index,conceptId] of sequence.concepts.entries()){
    const position:{sequenceId:string;conceptId:string}={sequenceId:sequence.id,conceptId};
    assert.equal(headLearningLinks(position)?.atlasHref,undefined);
    assert.equal(headGuidedPlaybackPlan(position),null,`cerebellar slot ${index} stays image-only`);
  }
});

test('unknown and malformed positions cannot produce a playable model plan',()=>{
  for(const position of [
    {sequenceId:'missing',conceptId:'brainstem-pons'},
    {sequenceId:'brainstem',conceptId:null},
    {sequenceId:'brainstem',conceptId:'missing'},
    {sequenceId:'brainstem',conceptId:'cortex-left-frontal-lobe'},
  ])assert.equal(headGuidedPlaybackPlan(position),null);
});

test('a future unmapped middle slot is an explicit gap, never a jump or Finish',()=>{
  const require=createRequire(import.meta.url);
  const source=readFileSync(new URL('../lib/head-guided-playback.ts',import.meta.url),'utf8');
  const code=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
  const mod={exports:{} as {headGuidedPlaybackPlan:typeof headGuidedPlaybackPlan}};
  new Function('require','module','exports',code)((name:string)=>name==='./head-atlas-learning.ts'?{headLearningSequencesForModality,headLearningLinks:(position:Parameters<typeof headLearningLinks>[0])=>position.conceptId==='brainstem-pons'?null:headLearningLinks(position)}:name==='./head-guided-focus.ts'?{headGuidedDestination}:require(name),mod,mod.exports);
  const plan=mod.exports.headGuidedPlaybackPlan({sequenceId:'brainstem',conceptId:'brainstem-midbrain'});
  assert.deepEqual(plan,{index:0,total:3,nextId:'brainstem-pons',nextHref:null,gap:true});
});
