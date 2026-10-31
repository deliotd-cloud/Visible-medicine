import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {beforeSmallCardiacImaging} from './small-cardiac-imaging-history.mjs';

const source=readFileSync(process.argv[2], 'utf8');
assert.equal(createHash('sha256').update(source).digest('hex'),'58450129c96996aade485026fe8ff2eea88474ad4cf78de4f0c0ec00dc12e0b6');
const cases=[['xray','smallCardiacVenographyCase'],['ultrasound','smallCardiacEchoCase']];
const sections={},references={older:{title:'older',url:'https://example.invalid'}};
for(const [tab,key] of cases){
  const section=source.match(new RegExp(`^      ${tab}: draft\\(("(?:[^"\\\\]|\\\\.)*"), '${key}'\\),$`,'m'));
  assert(section,`${tab} source`);
  sections[tab]={body:JSON.parse(section[1]),references:[key],readiness:'draft'};
  const ref=source.match(new RegExp(`^  ${key}: \\{\\r?\\n    title: '([^']+)',\\r?\\n    url: '([^']+)',\\r?\\n    scopedToConcept: true,\\r?\\n  \\},$`,'m'));
  assert(ref,`${key} source`);
  references[key]={title:ref[1],url:ref[2],scopedToConcept:true};
}
const concepts=[{id:'coronary-sinus',study:'coronary-venous',fmaIds:['FMA4706']},{id:'small-cardiac-vein',study:'coronary-venous',fmaIds:['FMA4714'],imaging:sections}];
const clone=v=>JSON.parse(JSON.stringify(v));
const prior=beforeSmallCardiacImaging(concepts,references);
assert.deepEqual(prior.concepts,[concepts[0],{...concepts[1],imaging:{}}]);
assert.deepEqual(prior.references,{older:references.older});
assert.deepEqual(concepts[1].imaging,sections,'Inverse must not mutate input');
for(const edit of [
  v=>{v.concepts[1].imaging.xray.body+=' changed';},
  v=>{v.concepts[1].imaging.ultrasound.body+=' changed';},
  v=>{v.concepts[1].imaging.xray.readiness='approved';},
  v=>{v.concepts[1].imaging.ultrasound.references=['older'];},
  v=>{v.references.smallCardiacVenographyCase.title+=' changed';},
  v=>{v.references.smallCardiacEchoCase.url='https://example.invalid';},
  v=>{v.concepts[1].imaging.xray.extra=true;},
  v=>{v.concepts[1].id='other';},
]){
  const v={concepts:clone(concepts),references:clone(references)};edit(v);
  assert.throws(()=>beforeSmallCardiacImaging(v.concepts,v.references));
}
console.log(JSON.stringify({passed:true,sourcePinned:true,exactAdditions:2,mutationsRejected:8,priorPreserved:true}));
