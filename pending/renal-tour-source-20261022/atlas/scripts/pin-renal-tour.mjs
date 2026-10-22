import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {build} from './workspace-test-build.mjs';

const baseline='389bd0ca846a42c7f21055f55904bcf5df81a09f';
const path='content/renal-tour-pins.json';
const rawPath='public/models/bodyparts3d/full-body/catalog.json';
const revision='renal-organs-arteries-orientation-20261022-source-bound-draft';
const gitBytes=path=>execFileSync('git',['show',baseline+':'+path],{maxBuffer:32e6,windowsHide:true});
const bytes=gitBytes(rawPath);
assert.equal(execFileSync('git',['hash-object',rawPath],{encoding:'utf8'}).trim(),
  execFileSync('git',['rev-parse',baseline+':'+rawPath],{encoding:'utf8'}).trim(),
  'The raw catalogue differs from the source baseline.');
const result=await build({stdin:{contents:"export {bodyDisplayCatalog} from './lib/body-display-catalog';",resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,platform:'node',format:'esm'});
const {bodyDisplayCatalog}=await import('data:text/javascript;base64,'+Buffer.from(result.outputFiles[0].text).toString('base64'));
const catalog=bodyDisplayCatalog(JSON.parse(bytes));
const select=fma=>{
  const found=catalog.structures.filter(s=>s.fmaId===fma);
  assert.equal(found.length,1,`Displayed source identity ${fma}`);
  assert(found[0].regions.includes('abdomen'),`Region for ${fma}`);
  return found[0];
};
const entries=['FMA7204','FMA14752','FMA7205','FMA14753'].map(select);
const contextEntries=[select('FMA3789')];
const records=[...entries,...contextEntries];
assert.equal(new Set(records.map(s=>s.id)).size,5);
assert.deepEqual(records.map(s=>s.id),[
  'vm:anatomy:body:abdomen:right:organ:right-kidney',
  'vm:anatomy:body:abdomen:right:vessel:right-renal-artery',
  'vm:anatomy:body:abdomen:left:organ:left-kidney',
  'vm:anatomy:body:abdomen:left:vessel:left-renal-artery',
  'vm:anatomy:body:abdomen:midline:vessel:abdominal-aorta',
]);
const bundleIds=new Set(records.map(s=>s.bundle));
const bundles=catalog.bundles.filter(b=>bundleIds.has(b.id));
assert.equal(bundleIds.size,2);
assert.equal(bundles.length,bundleIds.size);
for(const bundle of bundles){
  const asset='public'+bundle.url.split('?')[0],actual=readFileSync(asset);
  assert.equal(actual.length,bundle.bytes);
  assert.equal(createHash('sha256').update(actual).digest('hex'),bundle.sha256);
  assert(actual.equals(gitBytes(asset)),`Source asset differs from ${baseline}: ${asset}`);
}
const pins={schemaVersion:1,baseline,tourRevision:revision,sourceVersion:catalog.sourceVersion,
  coordinateSystem:catalog.coordinateSystem,license:catalog.license,credit:catalog.credit,entries,contextEntries,bundles};
if(process.argv.includes('--check'))assert.deepEqual(JSON.parse(readFileSync(path)),pins);
else{
  assert(!existsSync(path),'Pin creator is create-only; use --check for an existing pin.');
  assert.equal(execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),baseline);
  writeFileSync(path,JSON.stringify(pins,null,2)+'\n',{flag:'wx'});
}
console.log(JSON.stringify({targets:entries.length,context:contextEntries.length,bundles:bundles.length,
  pinsHash:createHash('sha256').update(JSON.stringify(pins)).digest('hex')}));
