// Deterministically reproduce6existing displayed source identities.
import fs from 'node:fs';import assert from 'node:assert/strict';import {build} from './workspace-test-build.mjs';import {fileURLToPath} from 'node:url';
const flags=process.argv.slice(2);assert(flags.length===0||flags.length===1&&flags[0]==='--check');
const root=new URL('../',import.meta.url),compiled=await build({stdin:{contents:"export {bodyDisplayCatalog} from './lib/body-display-catalog';",resolveDir:fileURLToPath(root),loader:'ts'},bundle:true,write:false,platform:'node',format:'esm'});
const api=await import('data:text/javascript;base64,'+Buffer.from(compiled.outputFiles[0].text).toString('base64'));
const catalog=api.bodyDisplayCatalog(JSON.parse(fs.readFileSync(new URL('public/models/bodyparts3d/full-body/catalog.json',root))));
const groups=[['obturator-externus',['FMA22326','FMA22327'],['FJ1425','FJ1425M']],['gluteus-minimus',['FMA22332','FMA22333'],['FJ1420','FJ1420M']],['tensor-fasciae-latae',['FMA22425','FMA22426'],['FJ1438','FJ1438M']]];
const entries=groups.flatMap(([slug,fmas,files])=>fmas.map((fma,i)=>{const rows=catalog.structures.filter(s=>s.fmaId===fma);assert.equal(rows.length,1);const identity=rows[0];assert.equal(identity.region,'thigh');assert.deepEqual(identity.regions,slug==='tensor-fasciae-latae'?['thigh']:['thigh','pelvis']);assert.equal(identity.sourceTree,'isa');assert.equal(identity.laterality,i===0?'right':'left');assert.equal(identity.sources.length,1);assert.equal(identity.sources[0].file,files[i]);return{key:'hip-relationships-'+slug,identity};}));
const value={schemaVersion:1,parentSource:'39dbb747a44feb0f4bc83e757310c5e3d1b49580',entries},output=new URL('content/hip-relationships-reasoning-pins.json',root);
if(flags.length)assert.deepEqual(JSON.parse(fs.readFileSync(output)),value);else fs.writeFileSync(output,JSON.stringify(value,null,2)+'\n');
console.log(JSON.stringify({pins:entries.length,checked:flags.length>0,geometryChanged:false}));
