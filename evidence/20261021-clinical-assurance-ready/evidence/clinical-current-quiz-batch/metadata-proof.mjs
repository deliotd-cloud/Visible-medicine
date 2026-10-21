// Local metadata-only admission check. Does not bundle or execute quiz modules.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {admitPreservedClinicalReview} from '../20261020-combined-website-ui/website/tests/clinical-review-current-admission.mjs';
import {validateCurrentAtlasDelivery} from '../20261020-combined-website-ui/website/tests/current-atlas-delivery.mjs';

const families=['lacrimal','laryngeal-framework','laryngeal-muscle','neuro-organ','ocular-support','scapular-muscle'];
for(const family of families){
 const text=readFileSync(new URL(`./tests/clinical-review-${family}-quiz.test.ts`,import.meta.url),'utf8');
 const start=text.indexOf('const sourceHashes');assert(start>=0,family);
 const mapIndex=text.indexOf('new Map(',start);
 const isMap=mapIndex>=0&&mapIndex<text.indexOf(';',start);
 const end=text.indexOf(isMap?']);':'};',start);
 const stop=end+(isMap?3:2);
 assert(stop>start,family);
 const block=text.slice(start,stop);
 const sourceHashes=Object.fromEntries([...block.matchAll(/'([^']+)'\s*[:,]\s*'([a-f0-9]{64})'/g)].map(([,path,hash])=>[path,hash]));
 assert(Object.keys(sourceHashes).length>=2&&Object.keys(sourceHashes).length<=3,`${family}: exact feature path count`);
 const revision=admitPreservedClinicalReview({revision:'9fba9a1e24b6669aafd48e945d55fc0939d50ab2',sourceHashes,learnerModules:['head-neck','shoulder']});
 assert.equal(revision,validateCurrentAtlasDelivery().source,`${family}: checked current source`);
}
process.stdout.write('six literal 9f feature maps admitted to checked 485 Review/head-neck/shoulder metadata\n');
