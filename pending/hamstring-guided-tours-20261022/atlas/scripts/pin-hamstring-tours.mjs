import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';

const source=resolve(import.meta.dirname,'../../20261022-review-traversal-candidate/atlas');
const catalogPath='public/models/bodyparts3d/full-body/catalog.json';
const path=resolve(import.meta.dirname,'../content/hamstring-tour-pins.json');
const baseline='2381efe43b75f8a7fb768a069eecd7268c508dac';
const raw=readFileSync(resolve(source,catalogPath));
const git=(args,encoding)=>execFileSync('git',args,{cwd:source,windowsHide:true,maxBuffer:64e6,encoding});
assert.equal(git(['rev-parse','HEAD'],'utf8').trim(),baseline);
assert.deepEqual(raw,git(['show',`${baseline}:${catalogPath}`]));
const catalog=JSON.parse(raw);
const fmas={right:['FMA45888','FMA45891','FMA22358','FMA22448'],left:['FMA45889','FMA45892','FMA22359','FMA22449']};
const bone={right:'FMA24474',left:'FMA24475'};
function exact(fma,side,bundle){
  const found=catalog.structures.filter(s=>s.fmaId===fma);
  assert.equal(found.length,1,fma);const record=found[0];
  assert.equal(record.laterality,side);assert.equal(record.bundle,bundle);
  assert(record.regions.includes('thigh'));assert.equal(record.validation.anatomicalReview,false);
  return record;
}
const entries=Object.entries(fmas).flatMap(([side,ids])=>ids.map((fma,i)=>exact(fma,side,i<2?'thigh-muscles-dissection':'thigh-muscles')));
const contextEntries=Object.entries(bone).map(([side,fma])=>exact(fma,side,'thigh-skeleton'));
assert.equal(new Set([...entries,...contextEntries].map(s=>s.id)).size,10);
const bundles=['thigh-muscles-dissection','thigh-muscles','thigh-skeleton'].map(id=>{
  const found=catalog.bundles.filter(b=>b.id===id);assert.equal(found.length,1,id);
  const bundle=found[0];assert.equal(typeof bundle.bytes,'number');assert.match(bundle.sha256,/^[a-f0-9]{64}$/);
  return bundle;
});
const pins={schemaVersion:1,baseline,revision:'bilateral-hamstring-orientation-20261022-r1',
  sourceVersion:catalog.sourceVersion,coordinateSystem:catalog.coordinateSystem,license:catalog.license,
  entries,contextEntries,bundles};
if(process.argv.includes('--check'))assert.deepEqual(JSON.parse(readFileSync(path)),pins);
else{assert(!existsSync(path));writeFileSync(path,JSON.stringify(pins,null,2)+'\n',{flag:'wx'});}
console.log(JSON.stringify({muscles:entries.length,femurs:contextEntries.length,bundles:bundles.length,
  pinsSha256:createHash('sha256').update(readFileSync(path)).digest('hex')}));
