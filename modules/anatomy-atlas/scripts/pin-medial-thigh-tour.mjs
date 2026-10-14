import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {build} from './workspace-test-build.mjs';
const baseline='c26ef4bf570f05e4b0e078a620db49ca67922ed9',path='content/medial-thigh-tour-pins.json',catalogPath='public/models/bodyparts3d/full-body/catalog.json';
const raw=readFileSync(catalogPath);assert(raw.equals(execFileSync('git',['show',baseline+':'+catalogPath],{maxBuffer:32e6,windowsHide:true})),'Catalogue differs from baseline');
const compiled=await build({stdin:{contents:"export {bodyDisplayCatalog} from './lib/body-display-catalog';",resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,platform:'node',format:'esm'});
const {bodyDisplayCatalog}=await import('data:text/javascript;base64,'+Buffer.from(compiled.outputFiles[0].text).toString('base64'));
const catalog=bodyDisplayCatalog(JSON.parse(raw));
const resolve=(fma,bundle)=>{const found=catalog.structures.filter(s=>s.fmaId===fma);assert.equal(found.length,1,fma);assert.equal(found[0].bundle,bundle);assert.equal(found[0].laterality,'right');assert(found[0].regions.includes('thigh'));assert.equal(found[0].validation.anatomicalReview,false);return found[0];};
const entries=['FMA22450','FMA22456','FMA22452','FMA22459','FMA43883'].map(fma=>resolve(fma,'thigh-muscles')),contextEntries=[resolve('FMA24474','thigh-skeleton')],all=[...entries,...contextEntries];
assert.equal(new Set(all.map(s=>s.id)).size,6);const bundles=catalog.bundles.filter(b=>all.some(s=>s.bundle===b.id));assert.equal(bundles.length,2);
for(const bundle of bundles){const file='public'+bundle.url.split('?')[0],bytes=readFileSync(file);assert.equal(bytes.length,bundle.bytes);assert.equal(createHash('sha256').update(bytes).digest('hex'),bundle.sha256);assert(bytes.equals(execFileSync('git',['show',baseline+':'+file],{maxBuffer:32e6,windowsHide:true})),bundle.id);}
const pins={schemaVersion:1,baseline,tourRevision:'right-medial-thigh-20261015-r1',sourceVersion:catalog.sourceVersion,coordinateSystem:catalog.coordinateSystem,license:catalog.license,entries,contextEntries,bundles};
if(process.argv.includes('--check'))assert.deepEqual(JSON.parse(readFileSync(path)),pins);else{assert(!existsSync(path));assert.equal(execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),baseline);writeFileSync(path,JSON.stringify(pins,null,2)+'\n',{flag:'wx'});}
console.log(JSON.stringify({targets:5,context:1,bundles:2,pinsHash:createHash('sha256').update(JSON.stringify(pins)).digest('hex')}));
