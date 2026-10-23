// Record only existing displayed source identities; never admit new geometry.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {build} from './workspace-test-build.mjs';
const root=fileURLToPath(new URL('../',import.meta.url));
const parentCommit='ed3c8cc0e99f6cf850a915d7a08de2e6489c1b6f';
const old=p=>execFileSync('git',['show',parentCommit+':'+p],{cwd:root,maxBuffer:32e6});
const sha=b=>createHash('sha256').update(b).digest('hex');
for(const p of ['lib/body-display-catalog.ts','public/models/bodyparts3d/full-body/catalog.json','package-lock.json'])assert.equal(sha(fs.readFileSync(root+p)),sha(old(p)),'Source dependency changed: '+p);
const code=await build({stdin:{contents:"export {bodyDisplayCatalog} from './lib/body-display-catalog.ts'",resolveDir:root,loader:'ts'},bundle:true,write:false,format:'esm',platform:'node'});
const {bodyDisplayCatalog}=await import('data:text/javascript;base64,'+Buffer.from(code.outputFiles[0].text).toString('base64'));
const catalog=bodyDisplayCatalog(JSON.parse(fs.readFileSync(root+'public/models/bodyparts3d/full-body/catalog.json')));
const targets=[['choroid-plexus','FMA61934',['FJ1755','FJ1803']],['mammillary-body','FMA74877',['FJ1768','FJ1815']],['lamina-terminalis','FMA61975',['FJ1764','FJ1812']]];
const entries=targets.map(([slug,fma,files])=>{
 const matches=catalog.structures.filter(s=>s.fmaId===fma);assert.equal(matches.length,1);
 const identity=matches[0];assert.equal(identity.system,'nerves');assert.equal(identity.category,'organ');assert.equal(identity.sourceTree,'isa');assert.equal(identity.laterality,'midline');assert.equal(identity.region,'head-neck');assert.deepEqual(identity.regions,['head-neck']);assert.deepEqual(identity.sources.map(s=>s.file),files);assert.equal(identity.validation.anatomicalReview,false);
 return {key:'ventricular-landmark-'+slug,identity};
});
const bundles=catalog.bundles.filter(b=>entries.some(e=>e.identity.bundle===b.id));assert.equal(bundles.length,2);
for(const b of bundles){const p=new URL(b.url,'https://atlas.invalid').pathname;assert(p.startsWith('/models/bodyparts3d/'));assert.equal(sha(fs.readFileSync(root+'public'+p)),b.sha256);}
const pins={parentCommit,sourceVersion:catalog.sourceVersion,coordinateSystem:catalog.coordinateSystem,bundles,entries};
const output=JSON.stringify(pins,null,2)+'\n',file=root+'content/ventricular-landmark-reasoning-pins.json';
if(process.argv.length!==3)throw Error('Specify --record or --check');
if(process.argv[2]==='--record')fs.writeFileSync(file,output,{flag:'wx'});
else if(process.argv[2]==='--check')assert.equal(fs.readFileSync(file,'utf8'),output);
else throw Error('Specify --record or --check');
console.log('Three existing ventricular/hypothalamic landmark identities and two unchanged bundles verified');
