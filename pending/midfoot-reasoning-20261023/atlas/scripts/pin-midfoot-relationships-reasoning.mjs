// Reproduce twelve existing displayed ISA bones; do not infer a ligament mesh.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {build} from './workspace-test-build.mjs';
const flags=process.argv.slice(2);
assert(flags.length===0 || flags.length===1 && flags[0]==='--check');
const root=new URL('../',import.meta.url);
const compiled=await build({stdin:{contents:"export {bodyDisplayCatalog} from './lib/body-display-catalog';",resolveDir:fileURLToPath(root),loader:'ts'},bundle:true,write:false,platform:'node',format:'esm'});
const api=await import('data:text/javascript;base64,'+Buffer.from(compiled.outputFiles[0].text).toString('base64'));
const catalog=api.bodyDisplayCatalog(JSON.parse(fs.readFileSync(new URL('public/models/bodyparts3d/full-body/catalog.json',root))));
const groups=[
  ['medial-cuneiform',['FMA24521','FMA24522'],['FJ3377','FJ3271']],
  ['intermediate-cuneiform',['FMA24523','FMA24524'],['FJ3370','FJ3264']],
  ['lateral-cuneiform',['FMA24525','FMA24526'],['FJ3373','FJ3267']],
  ['first-metatarsal',['FMA24507','FMA24508'],['FJ3351','FJ3241']],
  ['second-metatarsal',['FMA24509','FMA24510'],['FJ3353','FJ3244']],
  ['fourth-metatarsal',['FMA24513','FMA24514'],['FJ3357','FJ3250']],
];
const entries=groups.flatMap(([slug,fmas,files])=>fmas.map((fma,i)=>{
  const rows=catalog.structures.filter(s=>s.fmaId===fma);assert.equal(rows.length,1);
  const identity=rows[0];assert.equal(identity.region,'foot');assert.deepEqual(identity.regions,['foot']);
  assert.equal(identity.system,'skeleton');assert.equal(identity.category,'bone');assert.equal(identity.sourceTree,'isa');
  assert.equal(identity.bundle,'foot-skeleton');assert.equal(identity.laterality,i===0?'right':'left');
  assert.equal(identity.sources.length,1);assert.equal(identity.sources[0].file,files[i]);
  return {key:'midfoot-relationships-'+slug,identity};
}));
const value={schemaVersion:1,parentSource:'66ac064579ee23c5739d0907e8378e0e2d57d7bd',entries};
const output=new URL('content/midfoot-relationships-reasoning-pins.json',root);
if(flags.length)assert.deepEqual(JSON.parse(fs.readFileSync(output)),value);
else fs.writeFileSync(output,JSON.stringify(value,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({pins:entries.length,checked:flags.length>0,geometryChanged:false}));
