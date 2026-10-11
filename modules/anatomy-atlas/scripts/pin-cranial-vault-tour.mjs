import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {build} from './workspace-test-build.mjs';

const baseline='4624f82b6c517767238da9c31daf5d8c7fbe7d8b';
const path='content/cranial-vault-tour-pins.json';
const catalogPath='public/models/bodyparts3d/full-body/catalog.json';
const raw=readFileSync(catalogPath);
assert(raw.equals(execFileSync('git',['show',baseline+':'+catalogPath],{maxBuffer:32e6,windowsHide:true})),
  'The catalogue differs from the pinned baseline.');
const result=await build({stdin:{contents:"export {bodyDisplayCatalog} from './lib/body-display-catalog';",resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,platform:'node',format:'esm'});
const {bodyDisplayCatalog}=await import('data:text/javascript;base64,'+Buffer.from(result.outputFiles[0].text).toString('base64'));
const catalog=bodyDisplayCatalog(JSON.parse(raw));
const targets=[
  ['FMA52734','vm:anatomy:body:head-neck:midline:bone:frontal-bone'],
  ['FMA52788','vm:anatomy:body:head-neck:right:bone:right-parietal-bone'],
  ['FMA52738','vm:anatomy:body:head-neck:right:bone:right-temporal-bone'],
  ['FMA52735','vm:anatomy:body:head-neck:midline:bone:occipital-bone'],
  ['FMA52739','vm:anatomy:body:head-neck:left:bone:left-temporal-bone'],
  ['FMA52789','vm:anatomy:body:head-neck:left:bone:left-parietal-bone'],
];
const entries=targets.map(([fma,id])=>{
  const found=catalog.structures.filter(s=>s.fmaId===fma||s.id===id);
  assert.equal(found.length,1,`Source identity ${fma}`);
  assert.equal(found[0].fmaId,fma);
  assert.equal(found[0].id,id);
  assert.equal(found[0].bundle,'head-neck-skeleton',`Bundle for ${fma}`);
  assert(found[0].regions.includes('head-neck'),`Region for ${fma}`);
  return found[0];
});
assert.equal(new Set(entries.map(s=>s.id)).size,6);
const contextEntries=[];
const bundles=catalog.bundles.filter(b=>entries.some(s=>s.bundle===b.id));
assert.equal(bundles.length,1);
assert.equal(bundles[0].id,'head-neck-skeleton');
for(const b of bundles){
  const file='public'+b.url.split('?')[0];
  const actual=readFileSync(file);
  assert.equal(actual.length,b.bytes);
  assert.equal(createHash('sha256').update(actual).digest('hex'),b.sha256);
  assert(actual.equals(execFileSync('git',['show',baseline+':'+file],{maxBuffer:32e6,windowsHide:true})),
    `Asset differs from baseline: ${b.id}`);
}
const pins={schemaVersion:1,baseline,tourRevision:'cranial-vault-tour-20261011-r1',sourceVersion:catalog.sourceVersion,coordinateSystem:catalog.coordinateSystem,license:catalog.license,entries,contextEntries,bundles};
if(process.argv.includes('--check'))assert.deepEqual(JSON.parse(readFileSync(path)),pins);
else{
  assert(!existsSync(path));
  assert.equal(execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),baseline);
  writeFileSync(path,JSON.stringify(pins,null,2)+'\n',{flag:'wx'});
}
console.log(JSON.stringify({targets:entries.map(e=>({fmaId:e.fmaId,id:e.id,bundle:e.bundle})),context:contextEntries.length,bundles:bundles.map(b=>({id:b.id,sha256:b.sha256,bytes:b.bytes})),pinsHash:createHash('sha256').update(JSON.stringify(pins)).digest('hex')}));
