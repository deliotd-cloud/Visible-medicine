// Bulk-mechanical derivation of the previously verified isolated integration driver.
import fs from 'node:fs';import assert from 'node:assert/strict';import {createHash} from 'node:crypto';
const from='integrate-practice-actions-website-20261024.mjs',to='integrate-cervical-vascular-website-20261024.mjs';
const old=fs.readFileSync(from,'utf8');let next=old;
const seams=[
 ['20261024-practice-actions-website','20261024-cervical-vascular-website'],
 ['20261024-practice-actions/atlas','20261024-cervical-vascular-draft/atlas'],
 ['7659453d7d99da78742b06ee6e6665a467e5d972','b79e110d2d28f18993263926ba35aa7a3f478b20'],
 ['386b175434aa1f7cbcd705e05f0946b3b594ca54','0dd97cc55ef9aff3493b91752309d1d661c0b0c8'],
 ['20261024-upper-vascular-website/SOURCE_BOUND.json','20261024-guided-review-navigation/SOURCE_BOUND.json'],
 ['20261024-practice-actions/SOURCE_BOUND.json','20261024-cervical-vascular-draft/SOURCE_BOUND.json'],
 ['40fd40cba3b6f75253e0f3b825bd02d6a94e876e6d8aafedb5e8a043ce1ed8e2','c5fceb2bc64d8b0d4464b3da940bd3721111657d9a4d57f2dbf5b8b30fe0b6f3'],
 ['65f5d2747c9a2229cb0c3e723315103f618db6d8bc2fdec2fc41d60939e8f660','110b2214968c69a229f8d7c0855b93ab8ebbdc41c101e9103a8620ffcefd7b69'],
 ['tests/upper-vascular-current-delivery.test.mjs\',\'tests/current-atlas-delivery.test.mjs','tests/practice-actions-current-delivery.test.mjs\',\'tests/current-atlas-delivery.test.mjs'],
 ["'tests/practice-actions-current-delivery.test.mjs']],","'tests/cervical-vascular-current-delivery.test.mjs']],"],
 ["'tests/practice-actions-current-delivery.test.mjs','tests/current-atlas-delivery.test.mjs','tests/head-practice-navigation-policy.test.ts'","'tests/practice-actions-current-delivery.test.mjs','tests/cervical-vascular-current-delivery.test.mjs','tests/current-atlas-delivery.test.mjs','tests/head-practice-navigation-policy.test.ts'"],
 ['practice-actions-website\'','cervical-vascular-website\''],
];
// Most seams are singletons; the role name occurs twice in the unchanged state writer.
for(const [a,b]of seams){const count=next.split(a).length-1;assert(count>0,a);next=next.replaceAll(a,b);}
fs.writeFileSync(to,next,{flag:'wx'});
const sha=b=>createHash('sha256').update(b).digest('hex');
fs.writeFileSync('cervical-vascular-website-driver-transition.json',JSON.stringify({at:new Date().toISOString(),from,to,fromSha256:sha(old),toSha256:sha(next),seams,bulkMechanicalOnly:true,previewChanged:false},null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({driver:to,sha256:sha(next),previewChanged:false}));
