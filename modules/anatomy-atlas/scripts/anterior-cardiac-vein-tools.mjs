import {build} from './workspace-test-build.mjs';
import {createHash} from 'node:crypto';
import {beforePalmarArterialImaging} from './palmar-arterial-imaging-history.mjs';
export const cardiacVeinBase='430c9abbf66b14d9e485acdf2502ab33e42379a7';
export const hash=v=>createHash('sha256').update(typeof v==='string'||Buffer.isBuffer(v)?v:JSON.stringify(v)).digest('hex');
export async function cardiacVeinApi(){
 const result=await build({stdin:{contents:"export * from './lib/body-display-catalog';export * from './lib/anterior-cardiac-vein';export * from './lib/study-links';export * from './lib/body-review-material';export * from './lib/body-source-additions';export * from './app/dissection-data';export * from './lib/dissection-workbench';export {bodyLesson,bodyContent} from './app/body-content';export {contentTabs} from './lib/content-types';export {structures} from './app/anatomy-data';",resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,platform:'node',format:'esm'});
 return import('data:text/javascript;base64,'+Buffer.from(result.outputFiles[0].text).toString('base64'));
}
export function priorCardiacVeinState(api,raw){
 // Reconstruct only the recorded later teaching, retaining the immutable source baseline.
 api=beforePalmarArterialImaging(api);
 const catalog=api.bodyDisplayCatalog(raw),old=catalog.structures.filter(s=>s.fmaId!=='FMA76767');
 const profiles=structuredClone(api.dissectionProfiles);profiles.thorax.focuses=profiles.thorax.focuses.filter(f=>f.id!=='cardiac-venous-surfaces');
 const lessons=old.flatMap(s=>['anatomy','function','ct','mri','ultrasound','xray','pathology','clinical','quiz'].map(tab=>[s.id,tab,api.bodyLesson(s,tab)]));
 return {structures:old.length,structureHash:hash(old),bundlesHash:hash(catalog.bundles.filter(b=>b.id!=='anterior-cardiac-vein')),profilesHash:hash(profiles),lessonCount:lessons.length,lessonsHash:hash(lessons)};
}
