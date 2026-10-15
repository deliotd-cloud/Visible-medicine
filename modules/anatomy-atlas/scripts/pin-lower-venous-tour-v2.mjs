import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {build} from './workspace-test-build.mjs';
const baseline='c22c42edc7a663be4cce788d882edb0a83b752fd';
const path='content/lower-venous-tour-v2-pins.json',catalogPath='public/models/bodyparts3d/full-body/catalog.json';
const git=(...a)=>execFileSync('git',a,{maxBuffer:64e6,windowsHide:true});
const raw=readFileSync(catalogPath);assert(raw.equals(git('show',baseline+':'+catalogPath)));
const compiled=await build({stdin:{contents:"export {bodyDisplayCatalog} from './lib/body-display-catalog';",resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,platform:'node',format:'esm'});
const {bodyDisplayCatalog}=await import('data:text/javascript;base64,'+Buffer.from(compiled.outputFiles[0].text).toString('base64'));
const catalog=bodyDisplayCatalog(JSON.parse(raw));
const targets=[['leg','small-saphenous'],['leg','popliteal'],['leg','anterior-tibial'],['leg','posterior-tibial'],
 ['thigh','femoral'],['thigh','deep-femoral'],['thigh','great-saphenous'],['pelvis','external-iliac'],['pelvis','common-iliac']];
const resolve=id=>{const found=catalog.structures.filter(s=>s.id===id);assert.equal(found.length,1,id);
 assert.equal(found[0].laterality,'right');assert.equal(found[0].validation.anatomicalReview,false);return found[0];};
const entries=targets.map(([region,name])=>resolve(`vm:anatomy:body:${region}:right:vessel:right-${name}-vein`));
const contextEntries=[['pelvis','hip-bone'],['thigh','femur'],['leg','tibia'],['leg','fibula']]
 .map(([region,name])=>resolve(`vm:anatomy:body:${region}:right:bone:right-${name}`));
assert.equal(new Set([...entries,...contextEntries].map(s=>s.id)).size,13);
assert.deepEqual(entries.slice(0,4).map(s=>s.fmaId),['FMA44334','FMA44328','FMA44336','FMA44338']);
assert.deepEqual(entries[2].sources.map(s=>s.file),['FJ2132','FJ2193']);
const bundles=catalog.bundles.filter(b=>[...entries,...contextEntries].some(s=>s.bundle===b.id));
for(const bundle of bundles){const file='public'+bundle.url.split('?')[0],bytes=readFileSync(file);
 assert.equal(bytes.length,bundle.bytes);assert.equal(createHash('sha256').update(bytes).digest('hex'),bundle.sha256);
 assert(bytes.equals(git('show',baseline+':'+file)),bundle.id);}
const pins={schemaVersion:1,baseline,tourRevision:'right-lower-limb-venous-orientation-v2',sourceVersion:catalog.sourceVersion,
 coordinateSystem:catalog.coordinateSystem,license:catalog.license,entries,contextEntries,bundles};
if(process.argv.includes('--check'))assert.deepEqual(JSON.parse(readFileSync(path)),pins);
else{assert(!existsSync(path));assert.equal(git('rev-parse','HEAD').toString().trim(),baseline);writeFileSync(path,JSON.stringify(pins,null,2)+'\n',{flag:'wx'});}
console.log(JSON.stringify({targets:entries.map(s=>({id:s.id,fma:s.fmaId,bundle:s.bundle})),context:contextEntries.map(s=>({id:s.id,fma:s.fmaId,bundle:s.bundle})),bundles:bundles.map(b=>b.id),regions:[...new Set([...entries,...contextEntries].flatMap(s=>s.regions))]}));
