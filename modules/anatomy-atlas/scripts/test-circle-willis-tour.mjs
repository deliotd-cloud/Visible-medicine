import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {build} from './workspace-test-build.mjs';

const base='a1f7f82d524f5c40e53151a2d4e36f29d8e85d0f';
const old=path=>execFileSync('git',['show',`${base}:${path}`],{maxBuffer:16e6});
const entry=`export {circleWillisTour} from './lib/circle-willis-tour';
export {regionalTourStructures,regionalTourFrame,regionalTourStepFrames} from './lib/regional-tours';
import raw from './public/models/bodyparts3d/full-body/catalog.json';
import {bodyDisplayCatalog} from './lib/body-display-catalog';
export const catalog=bodyDisplayCatalog(raw as any);`;
const result=await build({stdin:{contents:entry,resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,platform:'node',format:'esm'});
const api=await import('data:text/javascript;base64,'+Buffer.from(result.outputFiles[0].text).toString('base64'));
const {circleWillisTour:tour,catalog}=api;
const expected=[
  ['right-internal-carotid-artery','right','FMA3949'],
  ['left-internal-carotid-artery','left','FMA4062'],
  ['right-anterior-cerebral-artery','right','FMA50029'],
  ['left-anterior-cerebral-artery','left','FMA50030'],
  ['anterior-communicating-artery','midline','FMA50169'],
  ['right-posterior-communicating-artery','right','FMA50085'],
  ['left-posterior-communicating-artery','left','FMA50086'],
  ['basilar-artery','midline','FMA50542'],
  ['right-posterior-cerebral-artery','right','FMA50584'],
  ['left-posterior-cerebral-artery','left','FMA50585'],
].map(([name,side,fmaId])=>({id:`vm:anatomy:body:head-neck:${side}:vessel:${name}`,side,fmaId}));
const ids=expected.map(x=>x.id),bundleId='head-neck-vessels-recovery';
assert.equal(tour.id,'circle-willis-arterial-orientation');
assert.equal(tour.revision,tour.id+'-v1');
assert.equal(tour.region,'head-neck');
assert.equal(tour.status,'draft');
assert.deepEqual(tour.contextIds,[]);
assert.deepEqual(tour.steps.map(s=>s.selectedId),ids);
assert.equal(new Set(tour.steps.map(s=>s.id)).size,10);
assert.deepEqual(tour.requiredDisplayBundles,Object.fromEntries(ids.map(id=>[id,bundleId])));
const structures=api.regionalTourStructures(catalog,tour);
assert.deepEqual(structures.map(s=>[s.id,s.fmaId,s.laterality,s.bundle]),expected.map(x=>[x.id,x.fmaId,x.side,bundleId]));
const assertExactIdentity=source=>assert.deepEqual(
  api.regionalTourStructures(source,tour).map(s=>[s.id,s.fmaId,s.laterality,s.bundle]),
  expected.map(x=>[x.id,x.fmaId,x.side,bundleId]));
const rawPath='public/models/bodyparts3d/full-body/catalog.json';
assert.deepEqual(readFileSync(rawPath),old(rawPath));
const baseline=JSON.parse(old(rawPath));
assert.deepEqual(catalog.structures.filter(s=>ids.includes(s.id)),baseline.structures.filter(s=>ids.includes(s.id)));
const bundle=catalog.bundles.find(b=>b.id===bundleId);
assert.deepEqual(bundle,baseline.bundles.find(b=>b.id===bundleId));
const bundlePath='public'+bundle.url.split('?')[0],bytes=readFileSync(bundlePath);
assert.deepEqual(bytes,old(bundlePath));
assert.equal(bytes.length,bundle.bytes);
assert.equal(createHash('sha256').update(bytes).digest('hex'),bundle.sha256);
for(const id of ids){
  const s=catalog.structures.find(x=>x.id===id);
  for(const changed of [catalog.structures.filter(x=>x.id!==id),[...catalog.structures,s],
    catalog.structures.map(x=>x.id===id?{...x,bundle:'wrong-bundle'}:x)])
    assert.throws(()=>api.regionalTourStructures({...catalog,structures:changed},tour));
  for(const patch of [{fmaId:'FMA0'},{laterality:'unspecified'},{id:id+'-other'}])
    assert.throws(()=>assertExactIdentity({...catalog,structures:catalog.structures.map(x=>x.id===id?{...x,...patch}:x)}));
  const changed=structuredClone(tour);changed.requiredDisplayBundles[id]='wrong-bundle';
  assert.throws(()=>api.regionalTourStructures(catalog,changed));
}
for(const changed of [catalog.bundles.filter(x=>x.id!==bundleId),[...catalog.bundles,bundle]])
  assert.throws(()=>api.regionalTourStructures({...catalog,bundles:changed},tour));
const allowed=new Set([
  'https://nba.uth.tmc.edu/neuroanatomy/l4/Lab04p06_index.html',
  'https://nba.uth.tmc.edu/neuroanatomy/l4/Lab04p07_index.html',
  'https://www.radiologyinfo.org/en/info/angioct',
  'https://www.radiologyinfo.org/en/info/angiomr',
]);
assert.deepEqual(tour.steps[7].references,['https://nba.uth.tmc.edu/neuroanatomy/l4/Lab04p07_index.html']);
assert.equal(tour.steps.filter(s=>s.references.includes('https://www.radiologyinfo.org/en/info/angioct')).length,1);
assert.equal(tour.steps.filter(s=>s.references.includes('https://www.radiologyinfo.org/en/info/angiomr')).length,1);
assert.match(tour.limitations,/revision-bound radiologist review/);
for(const word of ['exterior','A1','P1','terminal ICA','whole-course ICA','MCA','ring','lumens','flow','variant','stenosis','aneurysm','patient images','registration','measurements'])
  assert(tour.limitations.includes(word),`Missing caveat: ${word}`);
const frames=api.regionalTourStepFrames(catalog,tour);
assert.equal(frames.length,10);
for(const [index,s] of tour.steps.entries()){
  assert.equal(s.durationMs,16000);assert.equal(s.fadeOthers,true);
  assert(s.frameIds.length>0&&s.frameIds.includes(s.selectedId));
  assert.equal(new Set(s.frameIds).size,s.frameIds.length);
  assert(s.frameIds.every(id=>ids.includes(id)));
  assert(s.references.length&&s.references.every(url=>allowed.has(url)));
  const frame=frames[index];
  assert(frame.min.every((x,a)=>Number.isFinite(x)&&Number.isFinite(frame.max[a])&&x<frame.max[a]));
  for(const id of s.frameIds){
    const b=catalog.structures.find(x=>x.id===id).bounds;
    assert(b.min.every((x,a)=>x>=frame.min[a]&&b.max[a]<=frame.max[a]));
  }
  for(const bad of [[],['missing'],[s.selectedId,s.selectedId],[ids.find(id=>id!==s.selectedId)]]){
    const changed=structuredClone(tour);changed.steps[index].frameIds=bad;
    assert.throws(()=>api.regionalTourFrame(catalog,changed,index));
  }
}
const words=tour.steps.map(s=>s.caption).join(' ').trim().split(/\s+/).length;
assert(words<160,`Reference-derived caption budget: ${words}`);
console.log(JSON.stringify({tour:tour.id,targets:10,steps:10,sourceBundleSha256:bundle.sha256,captionWords:words,sourceRecordsUnchanged:true,clinicalApproval:false}));
