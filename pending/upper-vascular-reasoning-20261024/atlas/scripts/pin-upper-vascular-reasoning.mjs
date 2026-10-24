// Reproduce complete displayed source identities, not inferred vessel joins.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {build} from './workspace-test-build.mjs';
const flags=process.argv.slice(2);
assert(flags.length===0||flags.length===1&&flags[0]==='--check');
const root=new URL('../',import.meta.url);
const compiled=await build({stdin:{contents:"export {bodyDisplayCatalog} from './lib/body-display-catalog';",resolveDir:fileURLToPath(root),loader:'ts'},bundle:true,write:false,platform:'node',format:'esm'});
const api=await import('data:text/javascript;base64,'+Buffer.from(compiled.outputFiles[0].text).toString('base64'));
const catalog=api.bodyDisplayCatalog(JSON.parse(fs.readFileSync(new URL('public/models/bodyparts3d/full-body/catalog.json',root))));
const groups=[
 ['axillary-artery','shoulder-arm',['shoulder-arm'],'shoulder-arm-vessels-recovery',['FMA22655','FMA22656'],['FJ2268','FJ2216']],
 ['brachial-artery','shoulder-arm',['shoulder-arm'],'shoulder-arm-vessels-recovery',['FMA22691','FMA22692'],['FJ2271','FJ2219']],
 ['deep-brachial-artery','shoulder-arm',['shoulder-arm'],'shoulder-arm-vessels-recovery',['FMA22696','FMA22697'],['FJ2277','FJ2225']],
 ['radial-artery','forearm',['forearm','hand'],'forearm-vessels-recovery',['FMA22733','FMA22734'],['FJ2294','FJ2242']],
 ['ulnar-artery','forearm',['forearm','hand'],'forearm-vessels-recovery',['FMA22797','FMA22798'],['FJ2310','FJ2258']],
 ['common-interosseous-artery','forearm',['forearm'],'forearm-vessels-forearm-vascular',['FMA22807','FMA22808'],['FJ2275','FJ2223']],
 ['anterior-interosseous-artery','forearm',['forearm','hand'],'forearm-vessels-recovery',['FMA22812','FMA22813'],['FJ2266','FJ2214']],
 ['axillary-vein','shoulder-arm',['shoulder-arm','thorax'],'shoulder-arm-vessels-inventory',['FMA13330','FMA13331'],['FJ2269','FJ2217']],
 ['cephalic-vein','forearm',['forearm','shoulder-arm'],'forearm-vessels-recovery',['FMA13325','FMA13326'],['FJ2272','FJ2220']],
 ['basilic-vein','forearm',['forearm','shoulder-arm'],'forearm-vessels-recovery',['FMA22909','FMA22910'],['FJ2270','FJ2218']],
];
const entries=groups.flatMap(([slug,region,regions,bundle,fmas,files])=>fmas.map((fma,i)=>{
 const rows=catalog.structures.filter(s=>s.fmaId===fma);assert.equal(rows.length,1,fma);
 const identity=rows[0];assert.equal(identity.region,region);assert.deepEqual(identity.regions,regions);
 assert.equal(identity.bundle,bundle);assert.equal(identity.sourceTree,'isa');
 assert.equal(identity.system,'vessels');assert.equal(identity.category,'vessel');
 assert.equal(identity.laterality,i===0?'right':'left');
 assert.equal(identity.id,`vm:anatomy:body:${region}:${identity.laterality}:vessel:${identity.laterality}-${slug}`);
 assert.equal(identity.sources.length,1);assert.equal(identity.sources[0].file,files[i]);
 assert.match(identity.sources[0].sha256,/^[a-f0-9]{64}$/);
 return {key:'upper-vascular-'+slug,identity};
}));
const value={schemaVersion:1,parentSource:'cf9b5091db90219981929f6a9cbfdf1056bac9d6',entries};
const output=new URL('content/upper-vascular-reasoning-pins.json',root);
if(flags.length)assert.deepEqual(JSON.parse(fs.readFileSync(output)),value);
else fs.writeFileSync(output,JSON.stringify(value,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({pins:entries.length,checked:flags.length>0,geometryChanged:false}));
