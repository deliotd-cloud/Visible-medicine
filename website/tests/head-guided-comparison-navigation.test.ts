import assert from 'node:assert/strict';import test from 'node:test';import {readFileSync} from 'node:fs';import {createRequire} from 'node:module';import ts from 'typescript';
import * as comparison from '../lib/head-guided-comparison.ts';import * as learning from '../lib/head-atlas-learning.ts';import {HEAD_LINK_REVISION} from '../lib/head-atlas-links.ts';import {resolveHeadGuidedComparisonNavigation,type GuidedComparisonStepLink} from '../lib/head-guided-comparison-navigation.ts';
const query=(href:string)=>new URL(href,'https://visible.invalid').searchParams;

test('all real mapped activities link only their immediately adjacent authored steps',()=>{
  let checked=0;
  for(const sequence of learning.headLearningSequencesForModality())for(let i=0;i<sequence.concepts.length;i++){
    const activity=comparison.headGuidedComparisonForStep(sequence.id,sequence.concepts[i]);if(!activity)continue;
    const nav=resolveHeadGuidedComparisonNavigation(query(activity.activityHref));assert(nav);assert.equal(nav.atStart,i===0);assert.equal(nav.atEnd,i===sequence.concepts.length-1);
    for(const [key,index]of [['previous',i-1],['next',i+1]] as const){
      const expected=sequence.concepts[index]?comparison.headGuidedComparisonForStep(sequence.id,sequence.concepts[index]):null,actual:GuidedComparisonStepLink|null=nav[key];assert.equal(Boolean(actual),Boolean(expected));
      if(actual&&expected){assert.equal(actual.href,expected.activityHref);assert.equal(actual.label,expected.label);assert.equal(actual.step,index+1);assert.equal(actual.total,sequence.concepts.length);const params=query(actual.href);assert.equal(params.get('headRevision'),HEAD_LINK_REVISION);assert.deepEqual([...params.keys()],['concept','headTour','headStep','headRevision']);assert.equal(comparison.resolveHeadGuidedComparison(params)?.position.conceptId,sequence.concepts[index]);}
    }checked++;
  }
  assert.equal(checked,45,'Complete current mapped activity bank, including image-only and bone steps');
});

test('invalid or stale activity state cannot produce neighboring destinations',()=>{
  const activity=comparison.headGuidedComparisonForStep('brainstem','brainstem-pons');assert(activity);const original=query(activity.activityHref);
  for(const [key,value]of [['headRevision','stale'],['headTour','unknown'],['headStep','0'],['coordinates','1,2,3'],['answer','private']]){const bad=new URLSearchParams(original);bad.set(key,value);assert.equal(resolveHeadGuidedComparisonNavigation(bad),null);}
  const duplicated=new URLSearchParams(original);duplicated.append('concept','brainstem-pons');assert.equal(resolveHeadGuidedComparisonNavigation(duplicated),null);
});

test('a missing immediate mapping stays unavailable instead of skipping to another structure',()=>{
  const require=createRequire(import.meta.url),source=readFileSync(new URL('../lib/head-guided-comparison-navigation.ts',import.meta.url),'utf8'),code=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,mod={exports:{} as typeof import('../lib/head-guided-comparison-navigation.ts')},calls:string[]=[];
  new Function('require','module','exports',code)((id:string)=>{if(id==='./head-atlas-learning.ts')return learning;if(id==='./head-guided-comparison.ts')return {...comparison,headGuidedComparisonForStep:(sequenceId:string,conceptId:string)=>{calls.push(conceptId);return conceptId==='brainstem-pons'?null:comparison.headGuidedComparisonForStep(sequenceId,conceptId);}};return require(id);},mod,mod.exports);
  const activity=comparison.headGuidedComparisonForStep('brainstem','brainstem-midbrain');assert(activity);const nav=mod.exports.resolveHeadGuidedComparisonNavigation(query(activity.activityHref));assert(nav);assert.equal(nav.next,null);assert.equal(nav.atEnd,false);assert.deepEqual(calls,['brainstem-pons']);
});
