import assert from 'node:assert/strict';
import {readFile,writeFile,access} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {build} from './workspace-test-build.mjs';
export const hash=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
export async function context(){
 const compiled=await build({stdin:{contents:"export {bodyDisplayCatalog} from './lib/body-display-catalog'; export {bodyLesson,bodyContent} from './app/body-content'; export {structures} from './app/anatomy-data'; export {contentTabs} from './lib/content-types'; export {dissectionProfiles} from './app/dissection-data';",resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,format:'esm',platform:'node'});
 const api=await import('data:text/javascript;base64,'+Buffer.from(compiled.outputFiles[0].text).toString('base64'));
 const catalog=JSON.parse(await readFile('public/models/bodyparts3d/full-body/catalog.json'));
 return {api,catalog,display:api.bodyDisplayCatalog(catalog)};
}
export const snapshot=(api,display)=>({body:display.structures.map(s=>({id:s.id,sections:Object.fromEntries(api.contentTabs.map(t=>[t,api.bodyLesson(s,t)]))})),shoulder:api.structures,recipes:api.dissectionProfiles});
if(process.argv[1]?.replaceAll('\\','/').endsWith('/pin-pica-clinical.mjs')){
 const {api,display}=await context(),checking=process.argv.includes('--check');
 const entries=[['FMA50519','right'],['FMA50520','left']].map(([fma,side])=>{
  const matches=display.structures.filter(s=>s.fmaId===fma);assert.equal(matches.length,1);const identity=matches[0];
  assert.equal(identity.bundle,'cranial-arteries');assert.equal(identity.laterality,side);assert.equal(identity.system,'vessels');assert.equal(identity.category,'vessel');assert.deepEqual(identity.regions,['head-neck']);assert.equal(identity.sourceTree,'isa');assert.equal(identity.sources.length,13);
  const topics=['clinical','pathology'];return {identity,topics,previous:Object.fromEntries(topics.map(t=>{const lesson=api.bodyLesson(identity,t);if(!checking)assert.equal(lesson.readiness,'pending');return[t,lesson];}))};
 });
 const bundles=display.bundles.filter(b=>b.id==='cranial-arteries');assert.equal(bundles.length,1);
 for(const bundle of bundles){const b=await readFile('public'+bundle.url.split('?')[0]);assert.equal(b.length,bundle.bytes);assert.equal(createHash('sha256').update(b).digest('hex'),bundle.sha256);}
 const base={sourceCommit:'ae073d6a5b2dc1468cb2d40b3cacb6a4b58e35fd',sourceVersion:display.sourceVersion,license:display.license,coordinateSystem:display.coordinateSystem,bundles},file='content/pica-clinical-pins.json';
 if(checking){const saved=JSON.parse(await readFile(file));for(const key of Object.keys(base))assert.deepEqual(saved[key],base[key]);assert.deepEqual(saved.entries.map(({previous,...e})=>e),entries.map(({previous,...e})=>e));for(const e of saved.entries)for(const t of e.topics)assert.equal(e.previous[t].readiness,'pending');console.log(JSON.stringify({checked:true,pinsHash:hash(saved)}));}
 else{assert.equal(execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),base.sourceCommit);await assert.rejects(access(file));const pins={...base,previousAllLessonsAndRecipesHash:hash(snapshot(api,display)),entries};await writeFile(file,JSON.stringify(pins,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({source:base.sourceCommit,targets:entries.map(e=>({id:e.identity.id,sources:e.identity.sources.map(s=>s.file)})),pinsHash:hash(pins),beforeHash:pins.previousAllLessonsAndRecipesHash}));}
}
