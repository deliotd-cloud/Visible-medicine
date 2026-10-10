import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {build} from './workspace-test-build.mjs';
const parentCommit='ee6647564d871ebc86fa81c44c87718feb178567';
const targets=['anterior-cardiac-vein','great-cardiac-vein','middle-cardiac-vein'].map(name=>'vm:anatomy:body:thorax:unspecified:vessel:'+name);
targets.push('vm:anatomy:body:thorax:unpaired:organ:heart');
const compiled=await build({stdin:{contents:"export {bodyDisplayCatalog} from './lib/body-display-catalog';",resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,platform:'node',format:'esm'});
const {bodyDisplayCatalog}=await import('data:text/javascript;base64,'+Buffer.from(compiled.outputFiles[0].text).toString('base64'));
const catalog=bodyDisplayCatalog(JSON.parse(readFileSync('public/models/bodyparts3d/full-body/catalog.json')));
const entries=targets.map(id=>{const found=catalog.structures.filter(s=>s.id===id);assert.equal(found.length,1,id);assert(found[0].regions.includes('thorax'));return found[0];});
const sha=b=>createHash('sha256').update(b).digest('hex');
const bundles=catalog.bundles.filter(b=>entries.some(s=>s.bundle===b.id));
for(const b of bundles){const bytes=readFileSync('public'+b.url.split('?')[0]);assert.equal(bytes.length,b.bytes);assert.equal(sha(bytes),b.sha256);}
const value={parentCommit,sourceVersion:catalog.sourceVersion,license:catalog.license,coordinateSystem:catalog.coordinateSystem,entries,bundles};
const path='content/cardiac-venous-tour-pins.json';
if(process.argv.includes('--check'))assert.deepEqual(JSON.parse(readFileSync(path)),value);
else {assert.equal(execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),parentCommit);writeFileSync(path,JSON.stringify(value,null,2)+'\n',{flag:'wx'});}
console.log(JSON.stringify({records:entries.length,bundles:bundles.length,pinsHash:sha(JSON.stringify(value))}));
