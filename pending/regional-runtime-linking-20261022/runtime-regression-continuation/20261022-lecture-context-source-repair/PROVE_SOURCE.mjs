import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';

const stage=resolve(import.meta.dirname);
const website=resolve('F:/VisibleMedicine/staging/20261022-reviewed-regression-runtime-linking/website');
const successor=resolve('F:/VisibleMedicine/staging/20261022-review-loading-bound-successor/website');
const read=path=>readFileSync(path,'utf8');
const sha=content=>createHash('sha256').update(content).digest('hex');
const previous=read(resolve(website,'tests/fixtures/body-lecture-links/lib__lecture-repository.ts.raw'));
const savedPrevious=read('F:/VisibleMedicine/staging/20261021-body-lecture-links-proposal/preimages/lib/lecture-repository.ts');
assert.equal(sha(previous),'21b4b3ae6dffffc367205a973e6cbc8a27222e30a9c2311f5a874e7fec2e27b8');
assert.equal(previous,savedPrevious,'the already saved full preimage is byte identical');

const addition="import {lectureSlideBodyReferences,resolveLectureBodyReference} from './lecture-body-reference.ts';\n\nfunction hasStaleAnatomy(slide:LectureSlide){\n  return lectureSlideAnatomyReferences(slide).some(reference=>!resolveLectureAnatomyReference(reference))||\n    lectureSlideBodyReferences(slide).some(reference=>!resolveLectureBodyReference(reference));\n}\n";
const oldCheck='.some(slide=>lectureSlideAnatomyReferences(slide).some(reference=>!resolveLectureAnatomyReference(reference)))';
const newCheck='.some(hasStaleAnatomy)';
const inverse=source=>{
  assert.equal(source.split(addition).length,2,'complete extension occurs once');
  assert.equal(source.split(newCheck).length,4,'three freshness gates remain extended');
  return source.replace(addition,'').replaceAll(newCheck,oldCheck);
};
const verify=source=>assert.equal(inverse(source),previous,'full earlier repository is byte exact after declared inverse');
for(const path of [website,successor]){
  const current=read(resolve(path,'lib/lecture-repository.ts'));
  assert.equal(sha(current),'3903af27466fbf6a99b6a48b6fdb50126ef967262b6b0c2c807a5258d9d0e79d');
  verify(current);
  assert(current.includes('reviewer_id<>? LIMIT 1'));
  assert(current.includes('canAccessPublishedWorkbook(auth.userId,[],identifier(id))'));
  assert(current.includes('if(expected!==Number(row.version))'));
  for(const [name,mutated] of [
    ['independent review',current.replace('reviewer_id<>? LIMIT 1','reviewer_id=? LIMIT 1')],
    ['lecture allocation',current.replace('canAccessPublishedWorkbook(auth.userId,[],identifier(id))','true')],
    ['version',current.replace('if(expected!==Number(row.version))','if(false)')],
  ]){
    assert.notEqual(mutated,current,name+' mutation applied');
    assert.throws(()=>verify(mutated),/full earlier repository/,name+' mutation refused');
  }
  assert.throws(()=>inverse(current.replace(newCheck,oldCheck)),/three freshness gates/,'missing body gate refused');
}
const raw=read(resolve(stage,'RAW/tests/lecture-context-route.test.mjs'));
const code=read(resolve(stage,'CODE/tests/lecture-context-route.test.mjs'));
assert.equal(raw,read(resolve(website,'tests/lecture-context-route.test.mjs')),'RAW is the exact frozen V6 test');
const originalLast=raw.lastIndexOf("test('actual canonical context helpers");
const proposedLast=code.lastIndexOf("test('actual canonical context helpers");
assert(originalLast>0&&proposedLast>0);
assert.equal(code.slice(0,proposedLast),raw.slice(0,originalLast),'all earlier route assertions remain byte exact');
for(const phrase of ['STUDIO_CONTEXT_CHANGED','STUDIO_CONTEXT_UNAVAILABLE','foreign.test','Independent review is required before publication','canAccessPublishedWorkbook','reviewer_id<>? LIMIT 1']) assert(code.includes(phrase)||previous.includes(phrase),phrase);
console.log(JSON.stringify({ok:true,previousSha256:sha(previous),currentSha256:'3903af27466fbf6a99b6a48b6fdb50126ef967262b6b0c2c807a5258d9d0e79d',negativeCases:4,productChanged:false,readyForMainNativeCheck:true}));
