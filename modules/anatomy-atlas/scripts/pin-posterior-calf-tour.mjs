import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {build} from './workspace-test-build.mjs';
const baseline='38f225ff2d4b6cd0f2e4434c0a2d3a759f1af875',path='content/posterior-calf-tour-pins.json',catalogPath='public/models/bodyparts3d/full-body/catalog.json';
assert(process.argv.length===2||(process.argv.length===3&&process.argv[2]==='--check'));
const old=p=>execFileSync('git',['show',baseline+':'+p],{maxBuffer:64e6,windowsHide:true}),sha=b=>createHash('sha256').update(b).digest('hex'),raw=readFileSync(catalogPath);assert.deepEqual(raw,old(catalogPath));
const compiled=await build({stdin:{contents:"export {bodyDisplayCatalog} from './lib/body-display-catalog';",resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,platform:'node',format:'esm'});
const {bodyDisplayCatalog}=await import('data:text/javascript;base64,'+Buffer.from(compiled.outputFiles[0].text).toString('base64')),catalog=bodyDisplayCatalog(JSON.parse(raw));
const resolve=(fma,bundle)=>{const found=catalog.structures.filter(s=>s.fmaId===fma);assert.equal(found.length,1,fma);const s=found[0];assert.equal(s.bundle,bundle);assert.equal(s.laterality,'right');assert(s.regions.every(r=>['leg','foot'].includes(r)));assert.equal(s.validation.anatomicalReview,false);return s;};
const entries=[['FMA45957','leg-muscles-dissection'],['FMA45960','leg-muscles-dissection'],['FMA22558','leg-muscles'],['FMA258847','leg-connective-gaps'],['FMA24497','foot-skeleton']].map(([fma,bundle])=>resolve(fma,bundle)),contextEntries=[resolve('FMA24477','leg-skeleton'),resolve('FMA24480','leg-skeleton')],all=[...entries,...contextEntries];assert.equal(new Set(all.map(s=>s.id)).size,7);
const bundles=catalog.bundles.filter(b=>all.some(s=>s.bundle===b.id));assert.equal(bundles.length,5);for(const b of bundles){const file='public'+b.url.split('?')[0],bytes=readFileSync(file);assert.equal(bytes.length,b.bytes);assert.equal(sha(bytes),b.sha256);assert.deepEqual(bytes,old(file));}
const pins={schemaVersion:1,baseline,tourRevision:'right-posterior-calf-20261015-r1',sourceVersion:catalog.sourceVersion,coordinateSystem:catalog.coordinateSystem,license:catalog.license,scopeRegions:['leg','foot'],entries,contextEntries,bundles};
if(process.argv.includes('--check'))assert.deepEqual(JSON.parse(readFileSync(path)),pins);else{assert(!existsSync(path));assert.equal(execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),baseline);writeFileSync(path,JSON.stringify(pins,null,2)+'\n',{flag:'wx'});}
console.log(JSON.stringify({targets:5,context:2,bundles:5,pinsHash:sha(JSON.stringify(pins)),clinicalApproval:false}));
