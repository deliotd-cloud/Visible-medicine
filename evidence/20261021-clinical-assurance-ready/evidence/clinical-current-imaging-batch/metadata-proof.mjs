// Metadata only: checked source, Review and declared learner inputs; no corpus bundle.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {admitPreservedClinicalReview} from '../20261020-combined-website-ui/website/tests/clinical-review-current-admission.mjs';
import {validateCurrentAtlasDelivery} from '../20261020-combined-website-ui/website/tests/current-atlas-delivery.mjs';

for(const [name,scopes] of [
 ['internal-iliac-ultrasound',['head-neck']],
 ['pectoral-ultrasound',['head-neck','shoulder']],
 ['orbital-support-quiz',['head-neck','shoulder']],
 ['root-cuff-xray',['head-neck']],
 ['iliac-xray',['head-neck']],
]){
 const text=readFileSync(new URL(`./tests/clinical-review-${name}.test.ts`,import.meta.url),'utf8');
 const start=text.indexOf(name==='iliac-xray'?'const sourceHashes={':name==='root-cuff-xray'||name==='internal-iliac-ultrasound'?'const sourceFiles={':'const sourceHashes:');
 assert(start>=0,name);
 const end=text.indexOf(name==='root-cuff-xray'||name==='internal-iliac-ultrasound'?'} as const;':'};',start);assert(end>start,name);
 const block=text.slice(start,end);
 const sourceHashes=Object.fromEntries([...block.matchAll(/'([^']+)'\s*:\s*'([a-f0-9]{64})'/g)].map(([,path,hash])=>[path,hash]));
 assert(Object.keys(sourceHashes).length>=2&&Object.keys(sourceHashes).length<=3,`${name}: feature paths`);
 const revision=admitPreservedClinicalReview({revision:'9fba9a1e24b6669aafd48e945d55fc0939d50ab2',sourceHashes,learnerModules:scopes});
 assert.equal(revision,validateCurrentAtlasDelivery().source,name);
}
process.stdout.write('five unchanged 9f feature maps admitted to checked current Review and declared learner metadata\n');
