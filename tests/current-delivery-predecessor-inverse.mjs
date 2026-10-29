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
export function predecessorDeliverySource(current){
 assert.equal(hash(current),'101be6f4288eff0f4c351207260095c32e86cfe02f38c1df218c420c0c5241ee','Exact successor contract including all active refusal cases');
 let before=current;for(const [a,b,count]of edits){assert.equal(before.split(a).length-1,count,'Exact declared delivery transition seam');before=before.replaceAll(a,b);}
 assert.equal(hash(before),'ad5a1db42623b9a35d023c5b867a85a6cc776c8cf4982c1d2664628161bf900e','Exact whole predecessor contract');
 return before;
}
