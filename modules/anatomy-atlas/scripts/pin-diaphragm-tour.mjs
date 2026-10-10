import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {build} from './workspace-test-build.mjs';

const baseline='214cec892da967a8057ab1647003200e4f934d92';
const path='content/diaphragm-tour-pins.json';
const catalogPath='public/models/bodyparts3d/full-body/catalog.json';
const raw=readFileSync(catalogPath);
assert(raw.equals(execFileSync('git',['show',baseline+':'+catalogPath],{maxBuffer:32e6,windowsHide:true})),'The catalogue differs from the pinned baseline.');
const result=await build({stdin:{contents:"export {bodyDisplayCatalog} from './lib/body-display-catalog';",resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,platform:'node',format:'esm'});
const {bodyDisplayCatalog}=await import('data:text/javascript;base64,'+Buffer.from(result.outputFiles[0].text).toString('base64'));
const catalog=bodyDisplayCatalog(JSON.parse(raw));
const targets=[
  ['FMA13295','thorax-muscles','thorax'],
  ['FMA7131','thorax-organs','thorax'],
  ['FMA87217','thorax-vessels-recovery','thorax'],
  ['FMA3789','abdomen-vessels-recovery','abdomen'],
  ['FMA10951','abdomen-vessels-recovery','abdomen'],
];
const resolve=([fma,bundle,region])=>{
  const found=catalog.structures.filter(s=>s.fmaId===fma);
  assert.equal(found.length,1,`Source identity ${fma}`);
  assert.equal(found[0].bundle,bundle,`Bundle for ${fma}`);
  assert(found[0].regions.includes(region),`Region for ${fma}`);
  return found[0];
};
const entries=targets.map(resolve);
const contextEntries=[resolve(['FMA7148','abdomen-organs','abdomen'])];
const all=[...entries,...contextEntries];
assert.equal(new Set(all.map(s=>s.id)).size,6);
const bundles=catalog.bundles.filter(b=>all.some(s=>s.bundle===b.id));
assert.equal(bundles.length,5);
assert.equal(bundles.length,new Set(all.map(s=>s.bundle)).size);
for(const b of bundles){
  const file='public'+b.url.split('?')[0];
  const actual=readFileSync(file);
  assert.equal(actual.length,b.bytes);
  assert.equal(createHash('sha256').update(actual).digest('hex'),b.sha256);
  assert(actual.equals(execFileSync('git',['show',baseline+':'+file],{maxBuffer:32e6,windowsHide:true})),`Asset differs from baseline: ${b.id}`);
}
const pins={schemaVersion:1,baseline,tourRevision:'diaphragm-tour-20261010-r1',sourceVersion:catalog.sourceVersion,coordinateSystem:catalog.coordinateSystem,license:catalog.license,entries,contextEntries,bundles};
if(process.argv.includes('--check'))assert.deepEqual(JSON.parse(readFileSync(path)),pins);
else{
  assert(!existsSync(path));
  assert.equal(execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),baseline);
  writeFileSync(path,JSON.stringify(pins,null,2)+'\n',{flag:'wx'});
}
console.log(JSON.stringify({targets:entries.length,context:contextEntries.length,bundles:bundles.length,pinsHash:createHash('sha256').update(JSON.stringify(pins)).digest('hex')}));
