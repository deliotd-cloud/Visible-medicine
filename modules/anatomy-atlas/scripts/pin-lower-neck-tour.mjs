import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {build} from './workspace-test-build.mjs';

const baseline='00a3698417318997c8660db266784eb9d0649cdd';
const path='content/lower-neck-tour-pins.json';
const rawPath='public/models/bodyparts3d/full-body/catalog.json';
const bytes=execFileSync('git',['show',baseline+':'+rawPath],{maxBuffer:32e6,windowsHide:true});
assert(readFileSync(rawPath).equals(bytes),'The catalogue differs from the pinned baseline.');
const result=await build({stdin:{contents:"export {bodyDisplayCatalog} from './lib/body-display-catalog';",resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,platform:'node',format:'esm'});
const {bodyDisplayCatalog}=await import('data:text/javascript;base64,'+Buffer.from(result.outputFiles[0].text).toString('base64'));
const catalog=bodyDisplayCatalog(JSON.parse(bytes));
const select=fma=>{
  const found=catalog.structures.filter(s=>s.fmaId===fma);
  assert.equal(found.length,1,`Source identity ${fma}`);
  assert(found[0].regions.includes('head-neck'),`Region for ${fma}`);
  return found[0];
};
const entries=['FMA13392','FMA13390','FMA3953','FMA4755','FMA3941','FMA4754'].map(select);
const contextEntries=['FMA13408','FMA13348'].map(select);
const admitted=[...entries,...contextEntries];
assert.equal(new Set(admitted.map(s=>s.id)).size,admitted.length);
const bundles=catalog.bundles.filter(b=>admitted.some(s=>s.bundle===b.id));
assert.equal(bundles.length,new Set(admitted.map(s=>s.bundle)).size);
for(const b of bundles){
  const actual=readFileSync('public'+b.url.split('?')[0]);
  assert.equal(actual.length,b.bytes);
  assert.equal(createHash('sha256').update(actual).digest('hex'),b.sha256);
}
const pins={schemaVersion:1,baseline,tourRevision:'right-lower-neck-vessel-scalene-orientation-v1',sourceVersion:catalog.sourceVersion,coordinateSystem:catalog.coordinateSystem,license:catalog.license,entries,contextEntries,bundles};
if(process.argv.includes('--check'))assert.deepEqual(JSON.parse(readFileSync(path)),pins);
else{
  assert(!existsSync(path));
  assert.equal(execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),baseline);
  writeFileSync(path,JSON.stringify(pins,null,2)+'\n',{flag:'wx'});
}
console.log(JSON.stringify({targets:entries.length,context:contextEntries.length,bundles:bundles.length,pinsHash:createHash('sha256').update(JSON.stringify(pins)).digest('hex')}));
