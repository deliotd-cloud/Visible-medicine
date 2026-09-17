// Offline exact editorial reconstruction, never an approval/runtime migration.
import assert from 'node:assert/strict';
import {isDeepStrictEqual} from 'node:util';
import {createHash} from 'node:crypto';
import baseline from '../content/pulmonary-imaging-baseline.json' with {type:'json'};
import transition from '../content/pulmonary-imaging.transition.json' with {type:'json'};
const hash=v=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
export function nestedBeforePulmonaryImaging(api){
 assert.equal(hash(baseline),'c20c23f10f47ddc4b2165954076c0864e22eeeb3b14d12492adaf59ae1d24626');
 assert.equal(hash(transition),'ec3e86d43ceef9717752054e16af11b01821d3535a852049c6f7d3ee86aae6b1');
 const current=JSON.parse(JSON.stringify(api.nestedConcepts.filter(c=>c.study==='pulmonary')));
 const keys=Object.keys(transition.references);
 const references=Object.fromEntries(keys.filter(k=>Object.hasOwn(api.nestedTeachingReferences,k)).map(k=>[k,api.nestedTeachingReferences[k]]));
 if(isDeepStrictEqual(current,baseline.pulmonary)){assert.deepEqual(references,{});return api;}
 assert.deepEqual(current,transition.pulmonary,'Unrecorded pulmonary imaging teaching');
 assert.deepEqual(JSON.parse(JSON.stringify(references)),transition.references,'Mixed pulmonary imaging references');
 return {...api,nestedConcepts:api.nestedConcepts.map(c=>c.study==='pulmonary'?structuredClone(baseline.pulmonary.find(p=>p.id===c.id)):c),nestedTeachingReferences:Object.fromEntries(Object.entries(api.nestedTeachingReferences).filter(([k])=>!keys.includes(k)))};
}
