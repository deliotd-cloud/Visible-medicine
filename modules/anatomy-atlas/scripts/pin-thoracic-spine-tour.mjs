import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {build} from './workspace-test-build.mjs';
const baseline='de82626457fb60c3b92b4e4d87a0016b6c3c09ce';
const rawPath='public/models/bodyparts3d/full-body/catalog.json';
const rawBytes=execFileSync('git',['show',baseline+':'+rawPath],{maxBuffer:32e6,windowsHide:true});
assert(readFileSync(rawPath).equals(rawBytes),'Tour does not admit a changed model catalogue.');
const compiled=await build({stdin:{contents:"export {bodyDisplayCatalog} from './lib/body-display-catalog';",resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,platform:'node',format:'esm'});
const api=await import('data:text/javascript;base64,'+Buffer.from(compiled.outputFiles[0].text).toString('base64'));
const catalog=api.bodyDisplayCatalog(JSON.parse(rawBytes));
const bone=name=>'vm:anatomy:body:spine:midline:bone:'+name+'-thoracic-vertebra';
const disc=name=>'vm:anatomy:body:spine:midline:cartilage:intervertebral-disk-of-'+name+'-thoracic-vertebra';
const ids=[...['first','second','fifth','sixth','eighth','ninth','eleventh','twelfth'].map(bone),...['first','fifth','eighth'].map(disc)];
const entries=ids.map(id=>{const matches=catalog.structures.filter(s=>s.id===id);assert.equal(matches.length,1,id);assert(matches[0].regions.includes('spine'));return matches[0];});
const bundles=catalog.bundles.filter(b=>entries.some(s=>s.bundle===b.id));
for(const b of bundles){const bytes=readFileSync('public'+b.url.split('?')[0]);assert.equal(bytes.length,b.bytes);assert.equal(createHash('sha256').update(bytes).digest('hex'),b.sha256);}
const pins={schemaVersion:1,baseline,sourceVersion:catalog.sourceVersion,coordinateSystem:catalog.coordinateSystem,license:catalog.license,entries,bundles};
const path='content/thoracic-spine-tour-pins.json';
if(process.argv.includes('--check'))assert.deepEqual(JSON.parse(readFileSync(path)),pins);
else{assert.equal(execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),baseline);writeFileSync(path,JSON.stringify(pins,null,2)+'\n',{flag:'wx'});}
console.log(JSON.stringify({baseline,selections:entries.length,bundles:bundles.length,ids:entries.map(s=>({id:s.id,bundle:s.bundle})),pinsHash:createHash('sha256').update(JSON.stringify(pins)).digest('hex')}));
