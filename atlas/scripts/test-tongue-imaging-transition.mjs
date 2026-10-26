import assert from 'node:assert/strict';import fs from 'node:fs';import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';import {build} from './workspace-test-build.mjs';
const root=fileURLToPath(new URL('../',import.meta.url));
const baseline='643fd47491a41a0207f106806c17035cb938048b';
const original=path=>execFileSync('git',['show',baseline+':'+path],{cwd:root,windowsHide:true,maxBuffer:32e6});
const compiled=await build({stdin:{contents:`export {bodyLesson} from './app/body-content';export {bodyDisplayCatalog} from './lib/body-display-catalog';export {contentTabs} from './lib/content-types';export {sourceCanonical} from './lib/body-source-additions';export {decodeRegionalTeachingSnapshot} from './lib/regional-teaching-snapshot';`,resolveDir:root,loader:'ts'},bundle:true,write:false,platform:'node',format:'esm'});
const api=await import('data:text/javascript;base64,'+Buffer.from(compiled.outputFiles[0].text).toString('base64'));
const catalogPath='public/models/bodyparts3d/full-body/catalog.json';
assert.deepEqual(fs.readFileSync(root+'/'+catalogPath),original(catalogPath),'Original catalogue bytes retained');
const catalog=api.bodyDisplayCatalog(JSON.parse(fs.readFileSync(root+'/'+catalogPath,'utf8')));
const pins=JSON.parse(fs.readFileSync(root+'/content/tongue-imaging-pins.json','utf8'));
const targets=new Set(pins.entries.map(e=>e.identity.id));assert.equal(targets.size,5);
const baselineByRegion=new Map();
for(const region of new Set(catalog.structures.map(s=>s.region))){
  const raw=JSON.parse(original('content/regional-teaching/'+region+'.json'));
  baselineByRegion.set(region,{identities:new Map(raw.entries.map(e=>[JSON.parse(e.identity).id,e.identity])),reader:api.decodeRegionalTeachingSnapshot(raw,region)});
}
let changed=0,preserved=0;
for(const structure of catalog.structures){
  const previous=baselineByRegion.get(structure.region);
  assert.equal(api.sourceCanonical(structure),previous.identities.get(structure.id),'Complete geometry/source identity unchanged');
  for(const tab of api.contentTabs){
    const before=previous.reader.bodyLesson(structure,tab),after=api.bodyLesson(structure,tab);
    if(targets.has(structure.id)&&['ct','mri'].includes(tab)){
      assert.equal(before.readiness,'pending');assert.equal(after.readiness,'draft');
      assert(after.citations.length>=2);assert(after.note.includes('review pending'));changed++;
    }else{assert.deepEqual(after,before,structure.id+'/'+tab);preserved++;}
  }
}
assert.equal(catalog.structures.length,1104);assert.equal(changed,10);assert.equal(preserved,9926);
console.log(JSON.stringify({placements:changed+preserved,changed,preserved,geometryAndSourceIdentitiesUnchanged:true,clinicalApproval:false}));
