import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {build} from './workspace-test-build.mjs';
import {exactSourceHistoryApi} from './exact-source-history-api.mjs';
const parentCommit='7d77c973aab2a7135635ab2e65a2831f3e7d22c4';
assert(process.argv.slice(2).every(arg=>arg==='--check'));
const sha=b=>createHash('sha256').update(b).digest('hex');
const catalogPath='public/models/bodyparts3d/full-body/catalog.json';
const catalogBytes=await readFile(catalogPath);
assert.deepEqual(catalogBytes,execFileSync('git',['show',parentCommit+':'+catalogPath],{windowsHide:true,maxBuffer:64e6,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}}));
const raw=JSON.parse(catalogBytes);
const compiled=await build({stdin:{contents:"export {bodyDisplayCatalog} from './lib/body-display-catalog';",resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,platform:'node',format:'esm'});
const api=await import('data:text/javascript;base64,'+Buffer.from(compiled.outputFiles[0].text).toString('base64'));
const before=await exactSourceHistoryApi(parentCommit,'display-review');
const display=api.bodyDisplayCatalog(raw);
assert.deepEqual(display,before.bodyDisplayCatalog(raw));
const groups={superficialis:['FMA38470','FMA38471'],profundus:['FMA38479','FMA38480'],
 ulnaris:['FMA38617','FMA38618','FMA38619','FMA38620'],supinator:['FMA38513','FMA38514'],
 adductor:['FMA22456','FMA22457'],sartorius:['FMA22354','FMA22355'],
 posterior:['FMA65018','FMA65019'],anterior:['FMA22544','FMA22545']};
const entries=Object.entries(groups).flatMap(([group,fmas])=>fmas.map(fma=>{
 const found=display.structures.filter(s=>s.fmaId===fma);assert.equal(found.length,1,fma);
 const identity=found[0];assert.equal(identity.category,'muscle');
 const previous=before.bodyLesson(identity,'quiz');assert.equal(previous.readiness,'draft');
 assert(previous.correctAnswer&&previous.bullets.filter(c=>c===previous.correctAnswer).length===1);
 return {identity,group,previous};
}));
assert.equal(entries.length,18);assert.equal(new Set(entries.map(e=>e.identity.id)).size,18);
const bundles=display.bundles.filter(b=>entries.some(e=>e.identity.bundle===b.id));assert.equal(bundles.length,4);
for(const bundle of bundles){const bytes=await readFile('public'+bundle.url.split('?')[0]);assert.equal(bytes.length,bundle.bytes);assert.equal(sha(bytes),bundle.sha256);}
const record={parentCommit,catalogHash:sha(JSON.stringify(display)),coordinateSystem:display.coordinateSystem,bundles,entries};
const path='content/limb-nerve-quiz-pins.json',output=JSON.stringify(record,null,2)+'\n';
if(process.argv.includes('--check'))assert.equal((await readFile(path,'utf8')).replaceAll('\r\n','\n'),output);
else await writeFile(path,output,{flag:'wx'});
console.log(JSON.stringify({identities:18,groups:8,bundles:4,clinicalApproval:false}));
