import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {build} from './workspace-test-build.mjs';

const baseline='6b6d9bba99985dfc5ca8deb52ca9e2632b837d25';
const path='content/cervical-disc-tour-pins.json';
const catalogPath='public/models/bodyparts3d/full-body/catalog.json';
const raw=readFileSync(catalogPath);
assert(raw.equals(execFileSync('git',['show',baseline+':'+catalogPath],{maxBuffer:32e6,windowsHide:true})),'The catalogue differs from the pinned baseline.');
const compiled=await build({stdin:{contents:"export {bodyDisplayCatalog} from './lib/body-display-catalog';",resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,platform:'node',format:'esm'});
const {bodyDisplayCatalog}=await import('data:text/javascript;base64,'+Buffer.from(compiled.outputFiles[0].text).toString('base64'));
const catalog=bodyDisplayCatalog(JSON.parse(raw));
const discFmas=['FMA25058','FMA13896','FMA13897','FMA13898','FMA13899','FMA13900'];
const boneFmas=['FMA12520','FMA12521','FMA12522','FMA12523','FMA12524','FMA12525','FMA9165'];
const resolve=(fma,bundle)=>{
  const found=catalog.structures.filter(s=>s.fmaId===fma);
  assert.equal(found.length,1,`Source identity ${fma}`);
  assert.equal(found[0].bundle,bundle,`Bundle for ${fma}`);
  assert(found[0].regions.includes('spine'),`Region for ${fma}`);
  return found[0];
};
const entries=discFmas.map(fma=>resolve(fma,'spine-connective-gaps'));
const contextEntries=boneFmas.map(fma=>resolve(fma,'spine-skeleton'));
const all=[...entries,...contextEntries];
assert.equal(new Set(all.map(s=>s.id)).size,13);
const bundles=catalog.bundles.filter(b=>all.some(s=>s.bundle===b.id));
assert.equal(bundles.length,2);
for(const bundle of bundles){
  const file='public'+bundle.url.split('?')[0];
  const actual=readFileSync(file);
  assert.equal(actual.length,bundle.bytes);
  assert.equal(createHash('sha256').update(actual).digest('hex'),bundle.sha256);
  assert(actual.equals(execFileSync('git',['show',baseline+':'+file],{maxBuffer:32e6,windowsHide:true})),`Asset differs from baseline: ${bundle.id}`);
}
const pins={schemaVersion:1,baseline,tourRevision:'cervical-whole-discs-20261014-r1',sourceVersion:catalog.sourceVersion,coordinateSystem:catalog.coordinateSystem,license:catalog.license,entries,contextEntries,bundles};
if(process.argv.includes('--check'))assert.deepEqual(JSON.parse(readFileSync(path)),pins);
else{
  assert(!existsSync(path));
  assert.equal(execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),baseline);
  writeFileSync(path,JSON.stringify(pins,null,2)+'\n',{flag:'wx'});
}
console.log(JSON.stringify({targets:entries.length,context:contextEntries.length,bundles:bundles.length,pinsHash:createHash('sha256').update(JSON.stringify(pins)).digest('hex')}));
