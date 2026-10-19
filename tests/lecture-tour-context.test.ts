import assert from 'node:assert/strict';
import test from 'node:test';
import {HEAD_LINK_REVISION} from '../lib/head-atlas-links.ts';
import {headLearningLinks} from '../lib/head-atlas-learning.ts';
import {
  appendLectureTourContext,
  createLectureTourContext,
  lectureTourContextMatches,
  lectureTourReturn,
  parseLectureTourContext,
} from '../lib/lecture-tour-context.ts';

const revision=HEAD_LINK_REVISION;
const pons={sequenceId:'brainstem',conceptId:'brainstem-pons'};
const absent={kind:'none'} as const;
const invalid={kind:'invalid'} as const;
const fields=['returnTour','returnStep','returnConcept','returnRevision','returnView'] as const;

function query(context:ReturnType<typeof createLectureTourContext>){
  const href=appendLectureTourContext('/learn/related-anatomy?concept=brainstem-pons',context);
  assert(href);
  return new URL(href,'https://visible.invalid').searchParams;
}

test('each authored CT, MRI and 3D step returns to its own canonical destination',()=>{
  for(const view of ['CT','MRI','3D'] as const){
    const context=createLectureTourContext(pons,view,revision);
    assert.deepEqual(context,{kind:'ready',...pons,headRevision:revision,view});
    const params=query(context);
    assert.deepEqual(fields.filter(field=>params.has(field)),[...fields]);
    assert.deepEqual(parseLectureTourContext(params),context);
    assert.deepEqual(parseLectureTourContext(Object.fromEntries(params)),context);
    assert.equal(lectureTourContextMatches(context,params),true);
    const destination=lectureTourReturn(context);
    assert(destination);
    const canonical=headLearningLinks(pons);
    assert(canonical);
    assert.equal(destination.href,view==='CT'?canonical.ctHref:view==='MRI'?canonical.mriHref:canonical.atlasHref);
    assert.equal(destination.step,2);
    assert.equal(destination.total,3);
    assert.equal(destination.view,view);
    assert.match(destination.label,/Brainstem orientation/);
    assert.equal(new URL(destination.href,'https://visible.invalid').searchParams.get('headStep'),'1');
  }
});

test('an image-only guided step keeps CT and MRI destinations but has no invented 3D destination',()=>{
  const position={sequenceId:'cerebellar-orientation',conceptId:'cerebellum-left-hemisphere'};
  for(const view of ['CT','MRI'] as const){
    const context=createLectureTourContext(position,view,revision);
    assert.equal(context.kind,'ready');
    const destination=lectureTourReturn(context);
    assert(destination);
    assert.equal(destination.step,1);
    assert.equal(destination.total,3);
    assert.equal(destination.href,view==='CT'?headLearningLinks(position)?.ctHref:headLearningLinks(position)?.mriHref);
  }
  const unsupported=createLectureTourContext(position,'3D',revision);
  assert.notEqual(unsupported.kind,'ready');
  assert.equal(lectureTourReturn(unsupported),null);
});

test('missing context remains absent; every partial, duplicate or array field is invalid',()=>{
  assert.deepEqual(parseLectureTourContext({}),absent);
  assert.deepEqual(parseLectureTourContext(new URLSearchParams('concept=brainstem-pons')),absent);
  assert.deepEqual(parseLectureTourContext([] as never),invalid);
  const complete=query(createLectureTourContext(pons,'CT',revision));
  const inherited=Object.assign(Object.create({returnTour:'brainstem'}),Object.fromEntries(complete));
  assert.deepEqual(parseLectureTourContext(inherited),invalid);
  for(const field of fields){
    const partial=new URLSearchParams(complete);
    partial.delete(field);
    assert.deepEqual(parseLectureTourContext(partial),invalid,field);
    const duplicate=new URLSearchParams(complete);
    duplicate.append(field,complete.get(field)!);
    assert.deepEqual(parseLectureTourContext(duplicate),invalid,field);
    const array={...Object.fromEntries(complete),[field]:[complete.get(field)!]};
    assert.deepEqual(parseLectureTourContext(array),invalid,field);
  }
});

test('stale and altered sequence metadata refuses instead of finding another step or revision',()=>{
  const complete=query(createLectureTourContext(pons,'CT',revision));
  const changes:Record<string,string[]>={
    returnTour:['unknown','ventricles','brainstem%2Fother'],
    returnStep:['0','2','01','-1','999','1.0'],
    returnConcept:['brainstem-midbrain','unknown','brainstem-pons/other'],
    returnRevision:['a'.repeat(64),'OLD',revision.toUpperCase()],
    returnView:['ct','MRI/CT','Xray','https://evil.invalid'],
  };
  for(const [field,values] of Object.entries(changes))for(const value of values){
    const altered=new URLSearchParams(complete);
    altered.set(field,value);
    assert.deepEqual(parseLectureTourContext(altered),invalid,`${field}=${value}`);
    assert.equal(lectureTourContextMatches(createLectureTourContext(pons,'CT',revision),altered),false);
  }
  assert.equal(lectureTourReturn({kind:'ready',sequenceId:'unknown',conceptId:pons.conceptId,headRevision:revision,view:'CT'}),null);
  assert.equal(lectureTourReturn({kind:'ready',sequenceId:pons.sequenceId,conceptId:'brainstem-midbrain',headRevision:revision,view:'CT'})?.step,1);
});

test('only verified first-party lecture paths receive context and unsafe callers cannot forge a return URL',()=>{
  const ready=createLectureTourContext(pons,'MRI',revision);
  assert.equal(appendLectureTourContext('/learn/lectures/workbook%3A1?lectureSlide=intro&lectureRevision='+ 'b'.repeat(64),absent),'/learn/lectures/workbook%3A1?lectureSlide=intro&lectureRevision='+ 'b'.repeat(64));
  const invalidHref=appendLectureTourContext('/learn/lectures/workbook%3A1',invalid);
  assert(invalidHref);
  assert.deepEqual(parseLectureTourContext(new URL(invalidHref,'https://visible.invalid').searchParams),invalid);
  const forged={...ready,returnUrl:'https://evil.invalid/atlas/head-neck-3d'} as unknown as typeof ready;
  assert.equal(appendLectureTourContext('/learn/lectures/workbook%3A1',forged),null);
  assert.equal(lectureTourReturn(forged),null);
  let getterCalls=0;
  const accessor={...ready};
  Object.defineProperty(accessor,'sequenceId',{enumerable:true,get(){getterCalls++;throw new Error('accessor ran');}});
  assert.equal(appendLectureTourContext('/learn/lectures/workbook%3A1',accessor),null);
  assert.equal(lectureTourReturn(accessor),null);
  const params=Object.fromEntries(query(ready));
  Object.defineProperty(params,'returnTour',{enumerable:true,get(){getterCalls++;throw new Error('query accessor ran');}});
  assert.deepEqual(parseLectureTourContext(params),invalid);
  assert.equal(getterCalls,0);
  for(const href of ['https://evil.invalid/learn/lectures/x','//evil.invalid/path','javascript:alert(1)','/my-learning','/learn/lectures/x?returnTour=evil','/learn/lectures/x#fragment',
    '/learn/lectures/a%2Fb','/learn/lectures/a%5Cb','/learn/lectures/a%ZZ','/learn/lectures/%25ZZ']){
    assert.equal(appendLectureTourContext(href,ready),null,href);
  }
  const href=appendLectureTourContext('/learn/lectures/workbook%3A1?lectureSlide=intro&lectureRevision='+ 'b'.repeat(64),ready);
  assert(href);
  const url=new URL(href,'https://visible.invalid');
  assert.equal(url.pathname,'/learn/lectures/workbook%3A1');
  assert.equal(url.searchParams.get('lectureSlide'),'intro');
  assert.deepEqual(parseLectureTourContext(url.searchParams),ready);
  assert.equal(lectureTourContextMatches(ready,new URLSearchParams()),false);
});
