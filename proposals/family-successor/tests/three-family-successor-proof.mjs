import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {reconstructFamilyPrior} from './clinical-family-prior-current-inverse.mjs';
import {reconstructFamilyPrior as originalInverse} from 'file:///G:/VisibleMedicine-temp/staging/20261031-release14-shoulder-ready/website/tests/clinical-family-prior-current-inverse.mjs';
const root='G:/VisibleMedicine-temp/staging/20261031-release14-shoulder-ready/website/tests/';
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const rows=[
 {name:'arterial',source:'clinical-review-femoral-arterial-xray.test.ts',prior:'fixtures/clinical-review-femoral-arterial-xray.test.ts.prior-current.raw',witness:'arterial-family-later-current-source-seams.json',currentSha:'d512d615f13fa82369837d747f3237aa5ca66030a2c9b6c6d277c2bdd327cf29',priorSha:'79f3d0da5c4a192719522bc5979f03b0ec48add178c0071bc152d9c7354a67a8',hunks:6},
 {name:'venous',source:'clinical-review-femoral-venous-xray.test.ts',prior:'fixtures/clinical-review-femoral-venous-xray.test.ts.prior-current.raw',witness:'venous-family-later-guide-source-seams.json',currentSha:'a1b4d75239f6c876e29ce9a3859ccf2e79cf93497d3090be762808d0b033c3d3',priorSha:'4faaa1d2a8b97ae3933f5acb889d5c5447dee2487d23676e21650b889fabef0e',hunks:3},
 {name:'girdle',source:'clinical-review-girdle-muscle-xray.test.ts',prior:'fixtures/clinical-review-girdle-muscle-xray.test.ts.prior-current.raw',witness:'girdle-family-later-renal-source-seams.json',currentSha:'f3947bb370e3fa79a8929c7d57d5dd65dc809e6104bbdcdddd1e8e65231b52ae',priorSha:'78850a6971b9f44907ef303dadac564408c6dfa34dbfe9295a940fd7f8f35288',hunks:3},
];
for(const row of rows)test(`${row.name}: authenticated successor retains full original inverse and rejects mutations`,()=>{
 const current=readFileSync(root+row.source),raw=readFileSync(root+row.prior);
 assert.equal(sha(current),row.currentSha);
 const witness=JSON.parse(readFileSync(new URL('./fixtures/'+row.witness,import.meta.url)));
 assert.equal(witness.priorSourceSha256,row.priorSha);
 assert.equal(witness.currentSourceSha256,row.currentSha);
 assert.equal(witness.seams.length,row.hunks);
 const lines=current.toString('utf8').match(/[^\n]*\n|[^\n]+$/g)||[];
 for(const seam of [...witness.seams].reverse()){
  assert.deepEqual(lines.slice(seam.afterStart,seam.afterStart+seam.after.length),seam.after);
  lines.splice(seam.afterStart,seam.after.length,...seam.before);
 }
 const predecessor=Buffer.from(lines.join(''));
 assert.equal(sha(predecessor),row.priorSha);
 assert.deepEqual(originalInverse(row.name,predecessor,raw),raw);
 assert.deepEqual(reconstructFamilyPrior(row.name,predecessor,raw),raw);
 assert.deepEqual(reconstructFamilyPrior(row.name,current,raw),raw);
 const first=witness.seams[0].after.join('');assert(first.length>0);
 const text=current.toString('utf8');assert(text.includes(first));
 assert.throws(()=>reconstructFamilyPrior(row.name,Buffer.from(text.replace(first,'')),raw));
 const changed=Buffer.from(current);changed[0]^=1;
 assert.throws(()=>reconstructFamilyPrior(row.name,changed,raw));
 const changedPredecessor=Buffer.from(predecessor);changedPredecessor[0]^=1;
 assert.throws(()=>reconstructFamilyPrior(row.name,changedPredecessor,raw));
 const changedRaw=Buffer.from(raw);changedRaw[0]^=1;
 assert.throws(()=>reconstructFamilyPrior(row.name,current,changedRaw));
 assert.throws(()=>reconstructFamilyPrior(row.name,Buffer.from(text+text),raw));
});
test('undeclared family is refused',()=>{
 assert.throws(()=>reconstructFamilyPrior('unlisted',Buffer.alloc(0),Buffer.alloc(0)));
});
