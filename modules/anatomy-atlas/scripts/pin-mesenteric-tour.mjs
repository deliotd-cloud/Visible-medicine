import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {build} from './workspace-test-build.mjs';
const baseline='613daed2219432ba4c5321105d9552c7c9765e3e',path='content/mesenteric-tour-pins.json',rawPath='public/models/bodyparts3d/full-body/catalog.json';
const bytes=execFileSync('git',['show',baseline+':'+rawPath],{maxBuffer:32e6,windowsHide:true});
assert(readFileSync(rawPath).equals(bytes));
const result=await build({stdin:{contents:"export {bodyDisplayCatalog} from './lib/body-display-catalog';",resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,platform:'node',format:'esm'});
const {bodyDisplayCatalog}=await import('data:text/javascript;base64,'+Buffer.from(result.outputFiles[0].text).toString('base64'));
const catalog=bodyDisplayCatalog(JSON.parse(bytes));
const select=fma=>{const found=catalog.structures.filter(s=>s.fmaId===fma);assert.equal(found.length,1,fma);assert(found[0].regions.includes('abdomen'));return found[0];};
const entries=['FMA14749','FMA14810','FMA14815','FMA14750','FMA14826'].map(select),contextEntries=[select('FMA3789')];
const bundles=catalog.bundles.filter(b=>[...entries,...contextEntries].some(s=>s.bundle===b.id));
for(const b of bundles){const actual=readFileSync('public'+b.url.split('?')[0]);assert.equal(actual.length,b.bytes);assert.equal(createHash('sha256').update(actual).digest('hex'),b.sha256);}
const pins={schemaVersion:1,baseline,tourRevision:'mesenteric-arterial-branch-orientation-v1',sourceVersion:catalog.sourceVersion,coordinateSystem:catalog.coordinateSystem,license:catalog.license,entries,contextEntries,bundles};
if(process.argv.includes('--check'))assert.deepEqual(JSON.parse(readFileSync(path)),pins);
else{assert(!existsSync(path));assert.equal(execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),baseline);writeFileSync(path,JSON.stringify(pins,null,2)+'\n',{flag:'wx'});}
console.log(JSON.stringify({targets:entries.length,context:contextEntries.length,bundles:bundles.length,pinsHash:createHash('sha256').update(JSON.stringify(pins)).digest('hex')}));
