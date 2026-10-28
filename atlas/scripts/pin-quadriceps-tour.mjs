import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {build} from './workspace-test-build.mjs';

const baseline='dc0f5d9648b73e4baf25f468e52963b1d503df68';
const path='content/quadriceps-tour-pins.json';
const catalogPath='public/models/bodyparts3d/full-body/catalog.json';
assert(process.argv.length===2||(process.argv.length===3&&process.argv[2]==='--check'));
const old=p=>execFileSync('git',['show',baseline+':'+p],{maxBuffer:64e6,windowsHide:true});
const sha=b=>createHash('sha256').update(b).digest('hex');
const raw=readFileSync(catalogPath);
assert.deepEqual(raw,old(catalogPath));

const compiled=await build({stdin:{contents:"export {bodyDisplayCatalog} from './lib/body-display-catalog';",resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,platform:'node',format:'esm'});
const {bodyDisplayCatalog}=await import('data:text/javascript;base64,'+Buffer.from(compiled.outputFiles[0].text).toString('base64'));
const catalog=bodyDisplayCatalog(JSON.parse(raw));
const resolve=(fma,bundle,region)=>{
  const found=catalog.structures.filter(s=>s.fmaId===fma);
  assert.equal(found.length,1,fma);
  const s=found[0];
  assert.equal(s.bundle,bundle);
  assert.equal(s.laterality,'right');
  assert.equal(s.region,region);
  assert(s.regions.some(r=>['thigh','leg'].includes(r)));
  assert.equal(s.validation.anatomicalReview,false);
  return s;
};
const entries=[
  ['FMA38928','thigh-muscles-dissection','thigh'],
  ['FMA38930','thigh-muscles-dissection','thigh'],
  ['FMA38932','thigh-muscles-dissection','thigh'],
  ['FMA38934','thigh-muscles-dissection','thigh'],
  ['FMA24486','leg-skeleton','leg'],
  ['FMA24477','leg-skeleton','leg'],
].map(([fma,bundle,region])=>resolve(fma,bundle,region));
const contextEntries=[resolve('FMA24474','thigh-skeleton','thigh')];
const all=[...entries,...contextEntries];
assert.equal(new Set(all.map(s=>s.id)).size,7);
const expectedBundles=['thigh-muscles-dissection','leg-skeleton','thigh-skeleton'];
const bundles=catalog.bundles.filter(b=>expectedBundles.includes(b.id));
assert.equal(bundles.length,3);
assert.deepEqual(bundles.map(b=>b.id).sort(),expectedBundles.sort());
for(const b of bundles){
  const file='public'+b.url.split('?')[0],bytes=readFileSync(file);
  assert.equal(bytes.length,b.bytes);
  assert.equal(sha(bytes),b.sha256);
  assert.deepEqual(bytes,old(file));
}
const pins={schemaVersion:1,baseline,tourRevision:'right-quadriceps-20261027-r1',catalogVersion:catalog.version,sourceVersion:catalog.sourceVersion,
  coordinateSystem:catalog.coordinateSystem,license:catalog.license,scopeRegions:['thigh','pelvis','leg'],entries,contextEntries,bundles};
if(process.argv.includes('--check'))assert.deepEqual(JSON.parse(readFileSync(path)),pins);
else{
  assert(!existsSync(path));
  assert.equal(execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),baseline);
  writeFileSync(path,JSON.stringify(pins,null,2)+'\n',{flag:'wx'});
}
console.log(JSON.stringify({targets:6,context:1,bundles:3,pinsHash:sha(JSON.stringify(pins)),clinicalApproval:false}));
