import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import ts from 'typescript';
import {HEAD_LINK_REVISION} from '../lib/head-atlas-links.ts';
import * as learning from '../lib/head-atlas-learning.ts';
import * as conceptLinks from '../lib/head-image-only-links.ts';
import * as revision from '../lib/head-atlas-links.ts';
import * as availability from '../lib/head-link-availability.ts';
import {headGuidedComparisonForStep,resolveHeadGuidedComparison} from '../lib/head-guided-comparison.ts';

const {headLearningLinks,headLearningSequencesForModality}=learning;
const {headLinksCurrent}=availability;
const query=(href:string)=>new URL(href,'https://visible.invalid').searchParams;
const require=createRequire(import.meta.url);
const resolverSource=readFileSync(new URL('../lib/head-guided-comparison.ts',import.meta.url),'utf8');
const resolverCode=ts.transpileModule(resolverSource,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
function resolverWith({current=true,links}:{current?:boolean;links?:ReturnType<typeof headLearningLinks>|null}){
  const mod={exports:{} as typeof import('../lib/head-guided-comparison.ts')};
  new Function('require','module','exports',resolverCode)((id:string)=>{
    if(id==='./head-atlas-learning.ts')return links===undefined?learning:{...learning,headLearningLinks:()=>links};
    if(id==='./head-image-only-links.ts')return conceptLinks;
    if(id==='./head-atlas-links.ts')return revision;
    if(id==='./head-link-availability.ts')return {...availability,headLinksCurrent:()=>current};
    return require(id);
  },mod,mod.exports);
  return mod.exports;
}

test('current Pons opens the three exact revision-bound destinations',()=>{
  assert(headLinksCurrent());
  const activity=headGuidedComparisonForStep('brainstem','brainstem-pons');assert(activity);
  assert.equal(activity.label,'Pons');assert.equal(activity.position.index,1);
  assert.equal(activity.sourceRevision,HEAD_LINK_REVISION);
  const source=headLearningLinks({sequenceId:'brainstem',conceptId:'brainstem-pons'});assert(source);
  assert.deepEqual(activity.availableViews.map(view=>view.href),[source.atlasHref,source.ctHref,source.mriHref]);
  assert.deepEqual([...query(activity.activityHref).keys()],['concept','headTour','headStep','headRevision']);
  assert.deepEqual(resolveHeadGuidedComparison(query(activity.activityHref)),activity);
});

test('all mapped tour steps offer only real views, including image-only and bone paths',()=>{
  for(const sequence of headLearningSequencesForModality())for(const conceptId of sequence.concepts){
    const links=headLearningLinks({sequenceId:sequence.id,conceptId});
    const activity=headGuidedComparisonForStep(sequence.id,conceptId);
    const count=[links?.atlasHref,links?.ctHref,links?.mriHref].filter(Boolean).length;
    assert.equal(Boolean(activity),count>=2,`${sequence.id}/${conceptId}`);
    if(activity){
      assert.equal(activity.availableViews.length,count);
      assert.equal(activity.availableViews.some(view=>view.name==='3D Atlas'),Boolean(links?.atlasHref));
      assert(activity.availableViews.every(view=>view.href.startsWith('/atlas/')));
    }
  }
  const cerebellar=headGuidedComparisonForStep('cerebellar-orientation','cerebellum-left-hemisphere');
  assert(cerebellar);assert.deepEqual(cerebellar.availableViews.map(view=>view.name),['CT','MRI']);
  const bone=headLearningSequencesForModality().flatMap(sequence=>sequence.concepts.map(conceptId=>headGuidedComparisonForStep(sequence.id,conceptId))).find(item=>item?.availableViews.some(view=>view.name==='3D Atlas')&&item.availableViews.some(view=>view.name==='CT')&&!item.availableViews.some(view=>view.name==='MRI'));
  assert(bone,'a CT-only bone or facial step must have 3D and CT only');
});

test('stale, duplicated, missing, unknown, mismatched and extraneous query fields refuse',()=>{
  const valid=headGuidedComparisonForStep('brainstem','brainstem-pons');assert(valid);
  const original=query(valid.activityHref);
  for(const key of ['concept','headTour','headStep','headRevision']){
    const missing=new URLSearchParams(original);missing.delete(key);assert.equal(resolveHeadGuidedComparison(missing),null);
    const duplicate=new URLSearchParams(original);duplicate.append(key,original.get(key)!);assert.equal(resolveHeadGuidedComparison(duplicate),null);
  }
  for(const [key,value] of [['headRevision','stale'],['headTour','unknown'],['headStep','0'],['headStep','01'],['headStep','-1'],['concept','unknown'],['redirect','https://other.invalid'],['score','100'],['answer','x'],['coordinates','1,2,3'],['handle','private']]){
    const bad=new URLSearchParams(original);bad.set(key,value);assert.equal(resolveHeadGuidedComparison(bad),null);
  }
  assert.equal(headGuidedComparisonForStep('unknown','brainstem-pons'),null);
  assert.equal(headGuidedComparisonForStep('brainstem','cerebellum-vermis'),null);
  assert.equal(resolveHeadGuidedComparison({...Object.fromEntries(original),headStep:['1','1']}),null);
  assert.equal(resolveHeadGuidedComparison({...Object.fromEntries(original),concept:['brainstem-pons','brainstem-pons']}),null);
});

test('actual resolver refuses unavailable global binding and one-view or absent mappings',()=>{
  const valid=headGuidedComparisonForStep('brainstem','brainstem-pons');assert(valid);
  const params=query(valid.activityHref);
  assert.equal(resolverWith({current:false}).resolveHeadGuidedComparison(params),null);
  assert.equal(resolverWith({links:{atlasHref:undefined,ctHref:'/atlas/ct-head?concept=brainstem-pons',mriHref:undefined}}).resolveHeadGuidedComparison(params),null);
  assert.equal(resolverWith({links:null}).resolveHeadGuidedComparison(params),null);
});
