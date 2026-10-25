import test from 'node:test';
import assert from 'node:assert/strict';
import {headLearningLinks} from '../lib/head-atlas-learning.ts';
import {loadHeadSeparateComparisonLink,separateComparisonAwareRequire} from './head-separate-comparison-test-source.ts';

test('the real mapped link keeps exact CT/MRI revision, step and separate-tab safeguards',()=>{
  const links=headLearningLinks({sequenceId:'brainstem',conceptId:'brainstem-pons'});assert(links);
  const source=loadHeadSeparateComparisonLink();
  for(const modality of ['CT','MRI'] as const){
    const href:string|undefined=modality==='CT'?links.ctHref:links.mriHref;assert(href);
    const node=source.HeadSeparateComparisonLink({href,modality});assert(node);
    assert.equal(node.type,'a');assert.equal(node.props.href,href);
    assert.equal(node.props.target,'_blank');assert.equal(node.props.rel,'noopener noreferrer');
    assert.match(node.props['aria-label'],/new tab; keep this scan open/);
    assert.match(node.props.href,/headRevision=/);assert.match(node.props.href,/headStep=1/);
  }
});
test('the real component refuses foreign, cross-modality, duplicate and stale destinations',()=>{
  const links=headLearningLinks({sequenceId:'brainstem',conceptId:'brainstem-pons'});assert(links?.ctHref&&links.mriHref);
  const {HeadSeparateComparisonLink:Link}=loadHeadSeparateComparisonLink();
  for(const href of [null,undefined,'https://other.test/atlas/mri-head',links.ctHref,
    links.mriHref+'#foreign',links.mriHref+'&headRevision=duplicate',
    links.mriHref.replace(/headRevision=[^&]+/,'headRevision='+'0'.repeat(64))])
    assert.equal(Link({href,modality:'MRI'}),null);
});
test('unrelated fixture imports retain their original fallback, not a permissive link mock',()=>{
  const marker={unhandled:true},calls:string[]=[];
  const read=separateComparisonAwareRequire(name=>{calls.push(name);return marker;});
  assert.equal(read('./not-the-link'),marker);assert.deepEqual(calls,['./not-the-link']);
});
