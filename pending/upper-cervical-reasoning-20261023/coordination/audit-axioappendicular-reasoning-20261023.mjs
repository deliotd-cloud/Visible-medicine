// Pure current-source coverage query: no project/private-record writes.
import fs from 'node:fs';import assert from 'node:assert/strict';import {pathToFileURL} from 'node:url';
const root='F:/VisibleMedicine/staging/20261023-ventricular-landmark-reasoning/atlas';
process.chdir(root);const {build}=await import(pathToFileURL(root+'/scripts/workspace-test-build.mjs'));
const result=await build({stdin:{contents:"export {bodyDisplayCatalog} from './lib/body-display-catalog';export {reasoningConceptFor} from './lib/reasoning-questions';",resolveDir:root,loader:'ts'},bundle:true,write:false,platform:'node',format:'esm'});
const api=await import('data:text/javascript;base64,'+Buffer.from(result.outputFiles[0].text).toString('base64'));
const catalog=api.bodyDisplayCatalog(JSON.parse(fs.readFileSync('public/models/bodyparts3d/full-body/catalog.json')));
const rows=catalog.structures.filter(s=>s.system==='muscles'&&!api.reasoningConceptFor(s)&&s.regions.some(r=>['thorax','shoulder-arm','spine'].includes(r)));
console.log(JSON.stringify({root,count:rows.length,rows:rows.map(s=>({id:s.id,name:s.name,fma:s.fmaId,region:s.region,regions:s.regions,side:s.laterality,sourceTree:s.sourceTree,files:s.sources.map(x=>x.file)}))},null,2));
