// Reproduce only8existing displayed identities; never change catalogue or geometry.
import fs from 'node:fs';import assert from 'node:assert/strict';import {build} from './workspace-test-build.mjs';
import {fileURLToPath} from 'node:url';
const flags=process.argv.slice(2);assert(flags.length===0||flags.length===1&&flags[0]==='--check');
const root=new URL('../',import.meta.url),result=await build({stdin:{contents:"export {bodyDisplayCatalog} from './lib/body-display-catalog';",resolveDir:fileURLToPath(root),loader:'ts'},bundle:true,write:false,platform:'node',format:'esm'});
const api=await import('data:text/javascript;base64,'+Buffer.from(result.outputFiles[0].text).toString('base64'));
const catalog=api.bodyDisplayCatalog(JSON.parse(fs.readFileSync(new URL('public/models/bodyparts3d/full-body/catalog.json',root))));
const groups=[['rectus-capitis-posterior-minor',['FMA32532','FMA32533'],['FJ1590','FJ1568']],['obliquus-capitis-superior',['FMA32534','FMA32535'],['FJ1585','FJ1564']],['rectus-capitis-anterior',['FMA46313','FMA46314'],['FJ1588','FJ1566']],['rectus-capitis-lateralis',['FMA46317','FMA46318'],['FJ1591','FJ1569']]];
const entries=groups.flatMap(([slug,fmas,files])=>fmas.map((fma,i)=>{const rows=catalog.structures.filter(s=>s.fmaId===fma);assert.equal(rows.length,1);const identity=rows[0];assert.equal(identity.region,'spine');assert.deepEqual(identity.regions,['spine']);assert.equal(identity.sourceTree,'isa');assert.equal(identity.laterality,i===0?'right':'left');assert.equal(identity.sources.length,1);assert.equal(identity.sources[0].file,files[i]);return{key:'upper-cervical-'+slug,identity};}));
const value={schemaVersion:1,parentSource:'0327b6360e18b62563265d115df2b779c9397792',entries},output=new URL('content/upper-cervical-reasoning-pins.json',root);
if(flags.length)assert.deepEqual(JSON.parse(fs.readFileSync(output)),value);else fs.writeFileSync(output,JSON.stringify(value,null,2)+'\n');
console.log(JSON.stringify({pins:entries.length,checked:flags.length>0,geometryChanged:false}));
