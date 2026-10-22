// Evaluate only the pure reconstruction functions from staged witnesses.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';

const site='F:/VisibleMedicine/staging/20261022-reviewed-regression-runtime-linking/website/tests/';
const stage='F:/VisibleMedicine/staging/20261022-laryngeal-hand-elbow-runtime-followup/CODE/tests/';
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const lf=value=>value.replace(/\r\n/g,'\n');
function pureSource(name,start,end,result){
 const file=readFileSync(stage+name,'utf8');
 const a=file.indexOf(start),b=file.indexOf(end);
 assert(a>=0&&b>a&&file.indexOf(start,a+1)===-1&&file.indexOf(end,b+1)===-1,name+': unique pure source boundaries');
 return Function('assert',file.slice(a,b)+'\nreturn '+result+';')(assert);
}
const five=pureSource('next-five-admission-contract.test.mjs','const originalSha={','for(const [name,hash]of Object.entries(originalSha))test',
 '{originalSha,reconstruct}');
const six=pureSource('next-six-admission-contract.test.mjs','const names=[','for(const name of names)test',
 '{originalSha256,reconstruct}');
for(const [name,witness,fixture] of [
 ['clinical-review-cranial-teaching-batch.test.ts',five,'next-five-admissions'],
 ['clinical-review-elbow-arterial-ultrasound.test.ts',five,'next-five-admissions'],
 ['clinical-review-dorsal-hand-ultrasound.test.ts',six,'next-six-admissions'],
 ['clinical-review-foot-variant-quiz.test.ts',six,'next-six-admissions'],
 ['clinical-review-foot-venous-arch-imaging.test.ts',six,'next-six-admissions'],
]){
 const original=readFileSync(site+'fixtures/'+fixture+'/'+name+'.raw');
 const expected=witness.originalSha?.[name]??witness.originalSha256?.[name];
 assert.equal(sha(original),expected,name+': exact original fixture');
 const code=readFileSync(stage+name,'utf8');
 assert.equal(witness.reconstruct(name,code),lf(original.toString('utf8')),name+': entire original theorem');
 const seam='assert.equal(manifest.sourceCommit,deliveryPin.runtimeSources[module],module);';
 assert.equal(code.split(seam).length,2,name+': one runtime-family seam');
 for(const mutant of [code.replace(seam,''),code+seam,
  code.replace(seam,'assert.equal(manifest.sourceCommit,currentRevision,module);')])
  assert.throws(()=>witness.reconstruct(name,mutant),name+': runtime-family mutation refused');
 console.log(name+': exact original full-source theorem and runtime mutation refusals OK');
}
