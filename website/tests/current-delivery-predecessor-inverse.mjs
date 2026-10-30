// Test-only complete source mapping. It does not claim historical execution.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const hash=s=>createHash('sha256').update(s).digest('hex');
const edits=[
  [
    "9cef8900417bf592d3130f6ff92bf3e748cb55fc",
    "ea2413a6ea7e932f3ed6911bea15797037519ab7",
    6
  ],
  [
    "3d71e1e991e8a6cb69e6fac6f085c87ede58afd0",
    "24cb47f810f6454e06a6157a24899c1f39b3a8b3",
    2
  ],
  [
    ",1640",
    ",1625",
    3
  ],
  [
    ",1851",
    ",1833",
    2
  ],
  [
    "current 9cef delivery retains the verified abdominal ultrasound sources",
    "current 27b abdominal ultrasound delivery preserves all 44 predecessor cases",
    1
  ],
  [
    " const preferences=binding.inputs.filter(row=>row.path==='lib/head-tour-speed-preference.ts');assert.equal(preferences.length,1);assert.equal(preferences[0].sha256,sha(read('lib/head-tour-speed-preference.ts')),'The new playback preference is bound to the exact Review source');\n",
    "",
    1
  ],
  [
    "});\n\ntest('historical 27b delivery preserves all 44 predecessor cases',()=>{\n",
    "",
    1
  ]
];
export function restorePreRecoveryCurrentDeliverySource(current){
 assert.equal(typeof current,'string');assert.equal(hash(current),'dfd4195012a9ac2661ba28b069416bfb2412d5859c96b71c1149aeacdcd2b2f7','Exact c32 note-recovery current contract');
 const added=" const recovery=binding.inputs.filter(row=>row.path==='lib/head-teaching-review-recovery.ts');assert.equal(recovery.length,1);assert.equal(recovery[0].sha256,sha(read('lib/head-teaching-review-recovery.ts')),'Note recovery remains bound to the exact Review presentation');\n";assert.equal(current.split(added).length,2,'One exact new recovery binding assertion');let prior=current.replace(added,'');
 for(const [before,after,count]of [["9cef8900417bf592d3130f6ff92bf3e748cb55fc","c32bc81cf0fd7ec22fa83e8b1365019297f9a0b3",6],["3d71e1e991e8a6cb69e6fac6f085c87ede58afd0","d7ead7f3673ddf5c4b68db755b559b08b921eec6",2],[",1640",",1647",3],[",1852",",1861",2],["current 9cef delivery retains the verified abdominal ultrasound sources","current c32 delivery retains the verified abdominal ultrasound sources",1]]){assert.equal(prior.split(after).length-1,count,'Exact c32 delivery transition');prior=prior.replaceAll(after,before);}
 assert.equal(hash(prior),'95f246d6f65f5b6afb06b8e4a9c6eb47a00313e03aadf22bba271822eaea3fdd','Every complete predecessor assertion remains intact');return prior;
}
export function predecessorDeliverySource(current){
 current=restorePreRecoveryCurrentDeliverySource(current);
 assert.equal(hash(current),'95f246d6f65f5b6afb06b8e4a9c6eb47a00313e03aadf22bba271822eaea3fdd','Exact successor contract including all active refusal cases');
 assert.equal(current.split(',1852').length-1,2,'Only the two current Review input counts change');
 const prior=current.replaceAll(',1852',',1851');
 assert.equal(hash(prior),'101be6f4288eff0f4c351207260095c32e86cfe02f38c1df218c420c0c5241ee','All preceding executable assertions remain byte-exact');
 let before=prior;for(const [a,b,count]of edits){assert.equal(before.split(a).length-1,count,'Exact declared delivery transition seam');before=before.replaceAll(a,b);}
 assert.equal(hash(before),'ad5a1db42623b9a35d023c5b867a85a6cc776c8cf4982c1d2664628161bf900e','Exact whole predecessor contract');
 return before;
}
