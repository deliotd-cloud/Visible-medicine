import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {build} from './workspace-test-build.mjs';
const baseline='b9269c83867fbcae73e0de19ae6ca818fefb713a',path='content/portal-hepatic-tour-pins.json',catalogPath='public/models/bodyparts3d/full-body/catalog.json';
assert.equal(process.argv.includes('--write')!==process.argv.includes('--check'),true,'Choose --write or --check.');
const raw=readFileSync(catalogPath),git=p=>execFileSync('git',['show',baseline+':'+p],{maxBuffer:64e6,windowsHide:true});assert(raw.equals(git(catalogPath)));
const compiled=await build({stdin:{contents:"export {bodyDisplayCatalog} from './lib/body-display-catalog';",resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,platform:'node',format:'esm'});
const {bodyDisplayCatalog}=await import('data:text/javascript;base64,'+Buffer.from(compiled.outputFiles[0].text).toString('base64')),catalog=bodyDisplayCatalog(JSON.parse(raw));
const vessel=(name,side='unspecified')=>`vm:anatomy:body:abdomen:${side}:vessel:${name}`;
const targets=[['FMA14332',vessel('superior-mesenteric-vein')],['FMA14331',vessel('splenic-vein')],['FMA15391',vessel('inferior-mesenteric-vein')],['FMA50735',vessel('hepatic-portal-vein')],['FMA14338',vessel('right-hepatic-vein','right')],['FMA14340',vessel('middle-hepatic-vein')],['FMA14339',vessel('left-hepatic-vein','left')],['FMA10951',vessel('inferior-vena-cava')]];
const contexts=[['FMA7197','vm:anatomy:body:abdomen:unpaired:organ:liver'],['FMA7198','vm:anatomy:body:abdomen:unpaired:organ:pancreas'],['FMA7196','vm:anatomy:body:abdomen:unpaired:organ:spleen']];
const select=([fma,id])=>{const found=catalog.structures.filter(s=>s.fmaId===fma||s.id===id);assert.equal(found.length,1,fma);assert.equal(found[0].id,id);assert.equal(found[0].fmaId,fma);assert(found[0].regions.includes('abdomen'));return found[0];};
const entries=targets.map(select),contextEntries=contexts.map(select),all=[...entries,...contextEntries];assert.equal(new Set(all.map(s=>s.id)).size,11);
const bundles=catalog.bundles.filter(b=>all.some(s=>s.bundle===b.id));
for(const b of bundles){const file='public'+b.url.split('?')[0],bytes=readFileSync(file);assert.equal(bytes.length,b.bytes);assert.equal(createHash('sha256').update(bytes).digest('hex'),b.sha256);assert(bytes.equals(git(file)),b.id);}
const pins={schemaVersion:1,baseline,tourRevision:'portal-hepatic-venous-relationships-20261014-r1',sourceVersion:catalog.sourceVersion,coordinateSystem:catalog.coordinateSystem,license:catalog.license,entries,contextEntries,bundles};
if(process.argv.includes('--check'))assert.deepEqual(JSON.parse(readFileSync(path)),pins);else{assert(!existsSync(path));assert.equal(execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8',windowsHide:true}).trim(),baseline);writeFileSync(path,JSON.stringify(pins,null,2)+'\n',{flag:'wx'});}
console.log(JSON.stringify({targets:entries.length,context:contextEntries.length,bundles:bundles.map(b=>b.id),pinsHash:createHash('sha256').update(JSON.stringify(pins)).digest('hex')}));
