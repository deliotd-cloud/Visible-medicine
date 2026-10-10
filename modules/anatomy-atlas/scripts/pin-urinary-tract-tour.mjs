import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {build} from './workspace-test-build.mjs';

const baseline='cb412b50a1415c5662a346e509b23326799247f9';
const path='content/urinary-tract-tour-pins.json';
const rawPath='public/models/bodyparts3d/full-body/catalog.json';
const bytes=execFileSync('git',['show',baseline+':'+rawPath],{maxBuffer:32e6,windowsHide:true});
assert(readFileSync(rawPath).equals(bytes),'The catalogue differs from the pinned baseline.');
const result=await build({stdin:{contents:"export {bodyDisplayCatalog} from './lib/body-display-catalog';",resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,platform:'node',format:'esm'});
const {bodyDisplayCatalog}=await import('data:text/javascript;base64,'+Buffer.from(result.outputFiles[0].text).toString('base64'));
const catalog=bodyDisplayCatalog(JSON.parse(bytes));
const fmas=['FMA7204','FMA15571','FMA7205','FMA15572','FMA15900'];
const entries=fmas.map(fma=>{
  const found=catalog.structures.filter(s=>s.fmaId===fma);
  assert.equal(found.length,1,`Source identity ${fma}`);
  assert(found[0].regions.some(region=>region==='abdomen'||region==='pelvis'),`Region for ${fma}`);
  return found[0];
});
assert.equal(new Set(entries.map(s=>s.id)).size,entries.length);
const bundles=catalog.bundles.filter(b=>entries.some(s=>s.bundle===b.id));
assert.equal(bundles.length,3);
assert.equal(bundles.length,new Set(entries.map(s=>s.bundle)).size);
for(const b of bundles){
  const actual=readFileSync('public'+b.url.split('?')[0]);
  assert.equal(actual.length,b.bytes);
  assert.equal(createHash('sha256').update(actual).digest('hex'),b.sha256);
}
const pins={schemaVersion:1,baseline,tourRevision:'urinary-tract-tour-20261010-r1',sourceVersion:catalog.sourceVersion,coordinateSystem:catalog.coordinateSystem,license:catalog.license,entries,contextEntries:[],bundles};
if(process.argv.includes('--check'))assert.deepEqual(JSON.parse(readFileSync(path)),pins);
else{
  assert(!existsSync(path));
  assert.equal(execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),baseline);
  writeFileSync(path,JSON.stringify(pins,null,2)+'\n',{flag:'wx'});
}
console.log(JSON.stringify({targets:entries.length,context:0,bundles:bundles.length,pinsHash:createHash('sha256').update(JSON.stringify(pins)).digest('hex')}));
