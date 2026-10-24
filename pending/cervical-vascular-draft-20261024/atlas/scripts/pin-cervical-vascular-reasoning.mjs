// Exact existing catalogue identities only; never creates or joins geometry.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {build} from './workspace-test-build.mjs';
const flags=process.argv.slice(2);assert(flags.length===1&&flags[0]==='--check','Authoring pins requires a separately reviewed source transition');
const root=new URL('../',import.meta.url);
const built=await build({stdin:{contents:"export {bodyDisplayCatalog} from './lib/body-display-catalog';",resolveDir:fileURLToPath(root),loader:'ts'},bundle:true,write:false,platform:'node',format:'esm'});
const api=await import('data:text/javascript;base64,'+Buffer.from(built.outputFiles[0].text).toString('base64'));
const catalog=api.bodyDisplayCatalog(JSON.parse(fs.readFileSync(new URL('public/models/bodyparts3d/full-body/catalog.json',root))));
const groups=[['common-carotid-artery',['FMA3941','FMA4058'],['FJ3564','FJ3483']],['internal-carotid-artery',['FMA3949','FMA4062'],['FJ1682','FJ1682M']],['vertebral-artery',['FMA3958','FMA4066'],['FJ1725','FJ1725M']],['internal-jugular-vein',['FMA4754','FMA4762'],['FJ3585','FJ3485']]];
const official=fs.readFileSync(new URL('LICENSES/bodyparts3d-v4-index/isa_element_parts.txt',root),'utf8').trim().split(/\r?\n/).slice(1).map(x=>x.split('\t'));
const entries=groups.flatMap(([slug,fmas,files])=>fmas.map((fma,i)=>{
 const found=catalog.structures.filter(s=>s.fmaId===fma);assert.equal(found.length,1,fma);const identity=found[0];
 assert.equal(identity.region,'head-neck');assert.deepEqual(identity.regions,['head-neck','thorax']);assert.equal(identity.bundle,'head-neck-vessels-recovery');assert.equal(identity.sourceTree,'isa');assert.equal(identity.system,'vessels');assert.equal(identity.category,'vessel');assert.equal(identity.laterality,i===0?'right':'left');assert.equal(identity.id,`vm:anatomy:body:head-neck:${identity.laterality}:vessel:${identity.laterality}-${slug}`);
 assert.equal(identity.sources.length,1);assert.equal(identity.sources[0].file,files[i]);assert.match(identity.sources[0].sha256,/^[a-f0-9]{64}$/);assert.deepEqual(official.filter(r=>r[0]===fma).map(r=>r[2]),files.slice(i,i+1));
 return{key:'cervical-vascular-'+slug,identity};
}));
assert.deepEqual(JSON.parse(fs.readFileSync(new URL('content/cervical-vascular-reasoning-pins.json',root))),{schemaVersion:1,parentSource:'7659453d7d99da78742b06ee6e6665a467e5d972',entries});
console.log(JSON.stringify({pins:entries.length,exactOfficialMembership:true,geometryChanged:false,checked:true}));
