import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {inverseNewestShoulder} from '../CODE/tests/spinal-current-source-inverse.mjs';
const root='F:/VisibleMedicine/staging/20261022-spinal-neck-row-followup';
const sha=b=>createHash('sha256').update(b).digest('hex');
const b=fs.readFileSync(root+'/CODE/tests/atlas-spinal-muscle-xray.test.mjs');
const prior=fs.readFileSync(root+'/RAW/tests/atlas-spinal-muscle-xray.test.mjs');
assert.equal(sha(prior),'9ce897d60b62261f9ed75918700cba2580fdc58ca99bf9a487618a70a1c82e6d');
assert.equal(sha(b),'887c9e268da834c19d3774faa9ba8f44ac6d95cf7fdc47c4d01cc38fc6937308');
const adapted="    [new Map([...neckSelected].map(([id,identity])=>[id,{identity}])),'xray',api.neckLandmarkXrayLesson],";
assert.equal(b.toString().split(adapted).length,2);
assert.equal(b.toString().replace(adapted,"    [neckSelected,'xray',api.neckLandmarkXrayLesson],"),prior.toString(),
 'Complete previous test is retained outside one new neck-loop adapter');
assert.deepEqual(inverseNewestShoulder(b),fs.readFileSync('F:/VisibleMedicine/staging/20261022-surface-spinal-consumer-successor/website/tests/atlas-spinal-muscle-xray.test.mjs'));
let refused=0;
for(const from of ['{identity}','packet.approval,false']){
 const text=b.toString();assert(text.includes(from));assert.throws(()=>inverseNewestShoulder(Buffer.from(text.replace(from,from+'-tampered'))));refused++;
}
// The actual new list previously supplied a flat catalogue row to an identity-row
// loop. Wrap only the three explicit catalogue rows, preserving each whole record.
const rows=[{id:'one',name:'one',sources:['source1']},{id:'two',name:'two',sources:['source2']},{id:'three',name:'three',sources:['source3']}];
const selected=new Map(rows.map(r=>[r.id,r]));
assert.throws(()=>[...selected.values()].map(row=>row.identity.id),TypeError);
const wrapped=new Map([...selected].map(([id,identity])=>[id,{identity}]));
for(const [id,row] of wrapped)assert.equal(row.identity,selected.get(id));
assert.deepEqual([...wrapped.values()].map(row=>row.identity.id),rows.map(r=>r.id));
for(const name of ['atlas-spinal-muscle-xray.test.mjs','spinal-current-source-inverse.mjs'])execFileSync(process.execPath,['--check',root+'/CODE/tests/'+name],{windowsHide:true,stdio:'pipe'});
console.log(JSON.stringify({exactEarlierWholeTestRestored:true,onlyOneNeckRowAdapterChanged:true,allThreeWholeIdentitiesPreserved:true,oldShapeNegativeControl:true,mutationsRefused:refused,
 helperSha256:sha(fs.readFileSync(root+'/CODE/tests/spinal-current-source-inverse.mjs')),nativeAcceptance:false}));
