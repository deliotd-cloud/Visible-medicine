// Reproduce existing paired arterial selections without changing geometry.
import fs from 'node:fs';import assert from 'node:assert/strict';import {fileURLToPath} from 'node:url';import {build} from './workspace-test-build.mjs';
const flags=process.argv.slice(2);assert(flags.length===0||flags.length===1&&flags[0]==='--check');const root=new URL('../',import.meta.url);
const compiled=await build({stdin:{contents:"export {bodyDisplayCatalog} from './lib/body-display-catalog';",resolveDir:fileURLToPath(root),loader:'ts'},bundle:true,write:false,platform:'node',format:'esm'});
const api=await import('data:text/javascript;base64,'+Buffer.from(compiled.outputFiles[0].text).toString('base64')),catalog=api.bodyDisplayCatalog(JSON.parse(fs.readFileSync(new URL('public/models/bodyparts3d/full-body/catalog.json',root))));
const groups=[
 ['femoral-artery','thigh',['FMA70249','FMA70250'],[['FJ2143'],['FJ2074']]],
 ['deep-femoral-artery','thigh',['FMA20796','FMA20797'],[['FJ2137','FJ2158'],['FJ2069','FJ2078']]],
 ['descending-lateral-circumflex-femoral-artery','thigh',['FMA21422','FMA21423'],[['FJ2057'],['FJ2063']]],
 ['popliteal-artery','leg',['FMA77380','FMA77381'],[['FJ2170'],['FJ2086']]],
 ['anterior-tibial-artery','leg',['FMA43896','FMA43897'],[['FJ2130'],['FJ2065']]],
 ['posterior-tibial-artery','leg',['FMA43898','FMA43899'],[['FJ2172'],['FJ2087']]],
];
const entries=groups.flatMap(([slug,region,fmas,files])=>fmas.map((fma,i)=>{const rows=catalog.structures.filter(s=>s.fmaId===fma);assert.equal(rows.length,1,fma);const identity=rows[0],regions=region==='leg'?['leg','foot']:slug.startsWith('descending-')?['thigh','leg']:['thigh','pelvis','leg'];assert.equal(identity.region,region);assert.deepEqual(identity.regions,regions);assert.equal(identity.bundle,region==='leg'?'leg-vessels-recovery':slug.startsWith('descending-')?'circumflex-femoral':'thigh-vessels-recovery');assert.equal(identity.system,'vessels');assert.equal(identity.category,'vessel');assert.equal(identity.sourceTree,slug==='deep-femoral-artery'?'partof':'isa');assert.equal(identity.laterality,i===0?'right':'left');assert.deepEqual(identity.sources.map(source=>source.file),files[i]);return{key:'lower-arterial-'+slug,identity};}));
const value={schemaVersion:1,parentSource:'d143c28fb1e5da200712af6629a375c25d17dad7',entries},output=new URL('content/lower-arterial-reasoning-pins.json',root);if(flags.length)assert.deepEqual(JSON.parse(fs.readFileSync(output)),value);else fs.writeFileSync(output,JSON.stringify(value,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({pins:entries.length,checked:flags.length>0,geometryChanged:false}));
