import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {restoreFrozenCandidate} from './proposal/tests/clinical-orbital-neonatal-composition.mjs';

const root=new URL('.',import.meta.url).pathname.replace(/^\/(?:[A-Za-z]:)/,match=>match.slice(1));
const website='F:/VisibleMedicine/staging/20261022-review-recovery-website-candidate/website/tests/';
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const cases=[
 {
  name:'clinical-review-orbital-sensory-mri.test.ts',
  witness:'clinical-epoch-batch-d-preservation.test.mjs',
  seams:[
   ["import {restoreFrozenCandidate} from './clinical-orbital-neonatal-composition.mjs';\n",''],
   [" const delivered=readFileSync(new URL('./'+entry.name,import.meta.url));\n const proposed=entry.name==='clinical-review-orbital-sensory-mri.test.ts'\n  ?restoreFrozenCandidate(entry.name,delivered,readFileSync(new URL('./fixtures/orbital-neonatal-frozen/'+entry.name+'.raw',import.meta.url)))\n  :delivered;",
    " const proposed=readFileSync(new URL('./'+entry.name,import.meta.url));"],
  ],
 },
 {
  name:'clinical-review-short-ciliary-quiz.test.ts',
  witness:'clinical-question-role-preservation-20261021.test.mjs',
  seams:[
   ["import {restoreFrozenCandidate} from './clinical-orbital-neonatal-composition.mjs';\n",''],
   ["  const delivered=readFileSync(join(here,name));\n  const proposed=name==='clinical-review-short-ciliary-quiz.test.ts'\n   ?restoreFrozenCandidate(name,delivered,readFileSync(join(here,'fixtures/orbital-neonatal-frozen',name+'.raw')))\n   :delivered;\n  assert.deepEqual(proposed,Buffer.from(expected),name+' unknown assertion or behavior edit');",
    "  assert.deepEqual(readFileSync(join(here,name)),Buffer.from(expected),name+' unknown assertion or behavior edit');"],
  ],
 },
];

export function restoreWitnessSource(source,seams,expectedHash){
 let text=source;
 for(const [now,before] of seams){
  assert.equal(text.split(now).length,2,'unique complete witness inverse seam');
  text=text.replace(now,before);
 }
 const bytes=Buffer.from(text);
 assert.equal(sha(bytes),expectedHash,'complete original witness SHA-256');
 return bytes;
}

const hashes=[];
for(const item of cases){
 const original=readFileSync(`${root}original/tests/${item.witness}`);
 const proposed=readFileSync(`${root}proposal/tests/${item.witness}`);
 assert.deepEqual(original,readFileSync(website+item.witness),`${item.witness}: authentic complete frozen witness`);
 assert.deepEqual(restoreWitnessSource(proposed.toString('utf8'),item.seams,sha(original)),original);
 assert.throws(()=>restoreWitnessSource(proposed.toString('utf8')+'FOREIGN',item.seams,sha(original)),`${item.witness}: changed witness refused`);
 const first=item.seams[0][0];
 assert.throws(()=>restoreWitnessSource(proposed.toString('utf8').replace(first,first+'FOREIGN'),item.seams,sha(original)),`${item.witness}: changed inverse seam refused`);
 const current=readFileSync(`${root}proposal/tests/${item.name}`);
 const frozen=readFileSync(`${root}proposal/tests/fixtures/orbital-neonatal-frozen/${item.name}.raw`);
 assert.deepEqual(frozen,readFileSync(website+item.name),`${item.name}: authentic full frozen CODE`);
 assert.deepEqual(restoreFrozenCandidate(item.name,current,frozen),frozen,`${item.name}: actual adapter success`);
 assert.throws(()=>restoreFrozenCandidate(item.name,Buffer.concat([current,Buffer.from('FOREIGN')]),frozen),`${item.name}: changed candidate refused`);
 assert.throws(()=>restoreFrozenCandidate(item.name,current,Buffer.concat([frozen,Buffer.from('FOREIGN')])),`${item.name}: changed fixture refused`);
 hashes.push({witness:item.witness,original:sha(original),proposal:sha(proposed),name:item.name,frozen:sha(frozen),current:sha(current)});
}
console.log(JSON.stringify({hashes,pure:true},null,2));
