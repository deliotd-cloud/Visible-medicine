import assert from 'node:assert/strict';
import test from 'node:test';
import {headAtlasConceptOptions, headConceptById} from '../lib/head-atlas-links.ts';
import {headLinksCurrent} from '../lib/head-link-availability.ts';
import {headImageConceptById,headImageOnlyComparisonPacket} from '../lib/head-image-only-links.ts';
import {HEAD_IMAGE_ONLY_COMPARISON_REVISION} from '../lib/head-image-only-comparison-review.ts';
import {headImageHref} from '../lib/head-atlas-navigation.ts';
import {createLectureAnatomyReference, resolveLectureAnatomyReference,
  validateLectureAnatomyReference,lectureAnatomyOptions} from '../lib/lecture-anatomy-reference.ts';

test('every current head concept creates an exact canonical publication reference', () => {
  assert.equal(headLinksCurrent(), true);
  const options = headAtlasConceptOptions();
  assert(options.length > 0);
  assert(options.some(({conceptId}) => headConceptById(conceptId)?.ctHref && !headConceptById(conceptId)?.mriHref));
  assert(options.some(({conceptId}) => headConceptById(conceptId)?.mriHref && !headConceptById(conceptId)?.ctHref));
  for (const {conceptId} of options) {
    const link = headConceptById(conceptId); assert(link);
    const reference = createLectureAnatomyReference(conceptId); assert(reference);
    assert.deepEqual(Object.keys(reference), ['kind', 'conceptId', 'headRevision', 'atlasTarget']);
    assert.deepEqual(reference, {kind: 'head-concept-v1', conceptId,
      headRevision: link.headRevision, atlasTarget: link.atlasHref});
    assert.deepEqual(validateLectureAnatomyReference(reference), reference);
    assert.deepEqual(resolveLectureAnatomyReference(reference), link);
  }
});

test('validation is structural while resolution requires an exact current binding', () => {
  const current = createLectureAnatomyReference('brainstem-pons'); assert(current?.kind==='head-concept-v1');
  const stale = {...current, headRevision: 'a'.repeat(64)};
  assert.deepEqual(validateLectureAnatomyReference(stale), stale);
  assert.equal(resolveLectureAnatomyReference(stale), null);
  const unknown = {...current, conceptId: 'unknown-safe-concept'};
  assert.deepEqual(validateLectureAnatomyReference(unknown), unknown);
  assert.equal(resolveLectureAnatomyReference(unknown), null);
  const forged = {...current, atlasTarget: '/atlas/head-neck-3d?concept=other'};
  assert.deepEqual(validateLectureAnatomyReference(forged), forged);
  assert.equal(resolveLectureAnatomyReference(forged), null);
  assert.equal(createLectureAnatomyReference('unknown-safe-concept'), null);
});

test('invalid shape, accessors, identifiers and destinations are rejected', () => {
  const current = createLectureAnatomyReference('brainstem-pons'); assert(current?.kind==='head-concept-v1');
  let getterCalled = false;
  const accessor = Object.defineProperty({...current}, 'atlasTarget', {enumerable: true, get() {
    getterCalled = true; return current.atlasTarget;
  }});
  const invalid: unknown[] = [null, [], new Date(),
    {...current, extra: true}, {...current, kind: 'head-concept-v2'},
    {...current, conceptId: '../evil'}, {...current, conceptId: 'x'.repeat(129)},
    {...current, headRevision: current.headRevision.toUpperCase()},
    {...current, headRevision: 'a'.repeat(63)}, accessor,
    {...current, atlasTarget: 'https://example.invalid/atlas/head-neck-3d?concept=x'},
    {...current, atlasTarget: '//example.invalid/atlas/head-neck-3d?concept=x'},
    {...current, atlasTarget: '/atlas/ct-head?concept=x'},
    {...current, atlasTarget: '/atlas/head-neck-3d?concept=x\n'},
    {...current, atlasTarget: '/atlas/head-neck-3d?concept=x#fragment'},
    {...current, atlasTarget: '/atlas/head-neck-3d?concept=x\\evil'},
  ];
  for (const candidate of invalid) {
    assert.throws(() => validateLectureAnatomyReference(candidate));
    assert.equal(resolveLectureAnatomyReference(candidate), null);
  }
  assert.equal(getterCalled, false);
  assert.equal(createLectureAnatomyReference('../evil'), null);
});

test('legacy 3D reference JSON remains byte-for-byte stable',()=>{
  const link=headConceptById('brainstem-pons');assert(link);
  const ref=createLectureAnatomyReference(link.conceptId);assert(ref);
  assert.equal(JSON.stringify(ref),JSON.stringify({kind:'head-concept-v1',conceptId:link.conceptId,
    headRevision:link.headRevision,atlasTarget:link.atlasHref}));
  assert.deepEqual(validateLectureAnatomyReference(JSON.parse(JSON.stringify(ref))),ref);
});

test('all and only packet image-only concepts receive pinned CT/MRI lecture references',()=>{
  const packet=headImageOnlyComparisonPacket();
  const legacy=headAtlasConceptOptions();
  const options=lectureAnatomyOptions();
  assert.deepEqual(options.slice(0,legacy.length),legacy);
  assert.deepEqual(options.slice(legacy.length).map(item=>item.conceptId),packet.bindings.map(item=>item.conceptId));
  for(const item of packet.bindings){
    const link=headImageConceptById(item.conceptId);assert(link);
    assert.equal(link.atlasHref,undefined);
    assert.equal(options.find(option=>option.conceptId===item.conceptId)?.label,link.label);
    const ref=createLectureAnatomyReference(item.conceptId);assert(ref);
    assert.deepEqual(ref,{kind:'head-image-concept-v1',conceptId:item.conceptId,
      headRevision:link.headRevision,
      ctTarget:headImageHref('CT',item.conceptId,null,link.headRevision),
      mriTarget:headImageHref('MRI',item.conceptId,null,link.headRevision),
      comparisonRevision:HEAD_IMAGE_ONLY_COMPARISON_REVISION});
    assert.deepEqual(validateLectureAnatomyReference(JSON.parse(JSON.stringify(ref))),ref);
    assert.deepEqual(resolveLectureAnatomyReference(ref),link);
  }
});

test('image-only references remain readable when stale but cannot navigate forged targets',()=>{
  const left=createLectureAnatomyReference('cerebellum-left-hemisphere');
  const right=createLectureAnatomyReference('cerebellum-right-hemisphere');
  assert(left?.kind==='head-image-concept-v1'&&right?.kind==='head-image-concept-v1');
  const structuralButUnresolved=[
    {...left,headRevision:'a'.repeat(64)},
    {...left,comparisonRevision:'a'.repeat(64)},
    {...left,conceptId:'unknown-safe-concept'},
    {...left,conceptId:right.conceptId},
    {...left,ctTarget:right.ctTarget},
    {...left,mriTarget:right.mriTarget},
    {...left,ctTarget:left.ctTarget+'&untrusted=1'},
    {...left,mriTarget:left.mriTarget.replace('headRevision=','headRevision=stale')},
  ];
  for(const candidate of structuralButUnresolved){
    assert.deepEqual(validateLectureAnatomyReference(candidate),candidate);
    assert.equal(resolveLectureAnatomyReference(candidate),null);
  }
  assert.equal(createLectureAnatomyReference('unknown-safe-concept'),null);
});

test('image-only reference rejects extra fields, wrong kind, unsafe targets and getters without invoking them',()=>{
  const current=createLectureAnatomyReference('cerebellum-vermis');
  assert(current?.kind==='head-image-concept-v1');
  let getterCalled=false;
  const accessor=Object.defineProperty({...current},'ctTarget',{enumerable:true,get(){getterCalled=true;return current.ctTarget;}});
  const kindGetter=Object.defineProperty({...current},'kind',{enumerable:true,get(){getterCalled=true;return current.kind;}});
  const invalid:unknown[]=[
    {...current,atlasHref:'/atlas/head-neck-3d'},
    {...current,atlasTarget:'/atlas/head-neck-3d?concept=x'},
    {...current,extra:true},
    {...current,kind:'head-concept-v1'},
    {...current,ctTarget:'https://example.invalid/atlas/ct-head?concept=x'},
    {...current,ctTarget:'//example.invalid/atlas/ct-head?concept=x'},
    {...current,ctTarget:'/atlas/mri-head?concept=x'},
    {...current,mriTarget:'/atlas/ct-head?concept=x'},
    {...current,ctTarget:current.ctTarget+'#fragment'},
    {...current,mriTarget:current.mriTarget+'\\evil'},
    {...current,comparisonRevision:'A'.repeat(64)},
    accessor,kindGetter,
  ];
  for(const candidate of invalid){
    assert.throws(()=>validateLectureAnatomyReference(candidate));
    assert.equal(resolveLectureAnatomyReference(candidate),null);
  }
  assert.equal(getterCalled,false);
});
