import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {build} from './workspace-test-build.mjs';
const baseline='74ed7e65a65c919c787d0086ce50a11c21bf779b';
const path='content/upper-venous-tour-pins.json';
const rawPath='public/models/bodyparts3d/full-body/catalog.json';
const bytes=execFileSync('git',['show',baseline+':'+rawPath],{maxBuffer:32e6,windowsHide:true});
assert(readFileSync(rawPath).equals(bytes));
const result=await build({stdin:{contents:"export {bodyDisplayCatalog} from './lib/body-display-catalog';",resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,platform:'node',format:'esm'});
const {bodyDisplayCatalog}=await import('data:text/javascript;base64,'+Buffer.from(result.outputFiles[0].text).toString('base64'));
const catalog=bodyDisplayCatalog(JSON.parse(bytes));
const select=fma=>{const found=catalog.structures.filter(s=>s.fmaId===fma);assert.equal(found.length,1,fma);assert.equal(found[0].laterality,'right');return found[0];};
const entries=['FMA62506','FMA13325','FMA22909','FMA22935','FMA13330','FMA4755'].map(select);
const contextIds=['vm:anatomy:body:hand:right:bone:right-third-metacarpal-bone','vm:anatomy:upper-limb:shoulder:right:bone:humerus','vm:anatomy:upper-limb:shoulder:right:bone:clavicle','vm:anatomy:body:thorax:right:bone:right-first-rib'];
const contextEntries=contextIds.map(id=>{const found=catalog.structures.filter(s=>s.id===id);assert.equal(found.length,1,id);assert.equal(found[0].system,'skeleton');assert.equal(found[0].laterality,'right');return found[0];});
const admitted=[...entries,...contextEntries];
const bundles=catalog.bundles.filter(b=>admitted.some(s=>s.bundle===b.id));
for(const b of bundles){const actual=readFileSync('public'+b.url.split('?')[0]);assert.equal(actual.length,b.bytes);assert.equal(createHash('sha256').update(actual).digest('hex'),b.sha256);}
const pins={schemaVersion:1,baseline,tourRevision:'right-upper-limb-venous-orientation-v1',sourceVersion:catalog.sourceVersion,coordinateSystem:catalog.coordinateSystem,license:catalog.license,entries,contextEntries,bundles};
if(process.argv.includes('--check'))assert.deepEqual(JSON.parse(readFileSync(path)),pins);
else {assert(!existsSync(path),'Do not replace existing source pins');assert.equal(execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),baseline);writeFileSync(path,JSON.stringify(pins,null,2)+'\n',{flag:'wx'});}
console.log(JSON.stringify({targets:entries.length,context:contextEntries.length,bundles:bundles.length,pinsHash:createHash('sha256').update(JSON.stringify(pins)).digest('hex')}));
