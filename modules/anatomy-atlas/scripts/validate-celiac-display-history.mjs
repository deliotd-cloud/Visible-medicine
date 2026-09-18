import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {build} from './workspace-test-build.mjs';
import {beforeCeliacDisplay} from './celiac-display-history.mjs';
const compiled=await build({stdin:{contents:"export {bodyDisplayCatalog} from './lib/body-display-catalog';",resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,format:'esm',platform:'node'});
const api=await import('data:text/javascript;base64,'+Buffer.from(compiled.outputFiles[0].text).toString('base64'));
const raw=JSON.parse(await readFile('public/models/bodyparts3d/full-body/catalog.json'));
const record=JSON.parse(await readFile('content/celiac-display-transition.json'));
const old=beforeCeliacDisplay(api,raw);assert.equal(beforeCeliacDisplay(old,raw),old);
assert.deepEqual(old.bodyDisplayCatalog(raw).structures.find(s=>s.id===record.original.id),record.original);
let rejected=0;
for(const change of [
 d=>d.structures.find(s=>s.id===record.original.id).sources.reverse(),
 d=>d.structures.find(s=>s.id===record.original.id).bundle=record.original.bundle,
 d=>d.bundles=d.bundles.filter(b=>b.id!==record.bundle.id),
 d=>d.bundles.find(b=>b.id===record.bundle.id).sha256='0'.repeat(64),
 d=>d.structures[0].name+=' foreign',
]) {const bad=structuredClone(api.bodyDisplayCatalog(raw));change(bad);assert.throws(()=>beforeCeliacDisplay({bodyDisplayCatalog(){return bad;}},raw));rejected++;}
console.log(JSON.stringify({exactHistory:true,idempotent:true,mixedAndForeignHistoryRejections:rejected}));
