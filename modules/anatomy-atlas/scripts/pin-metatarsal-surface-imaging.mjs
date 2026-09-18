import assert from 'node:assert/strict';
import {access,readFile,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {context,hash,snapshot} from './pin-pica-clinical.mjs';
import {build} from './workspace-test-build.mjs';

const compiled=await build({stdin:{contents:"export {metatarsalSurfaceSelections} from './content/metatarsal-surface-imaging.ts';export {acralBoneImagingGroups} from './content/acral-bone-imaging.ts';",resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,platform:'node',format:'esm'});
const {metatarsalSurfaceSelections,acralBoneImagingGroups}=await import('data:text/javascript;base64,'+Buffer.from(compiled.outputFiles[0].text).toString('base64'));

const sourceCommit='7ef514621befce5e7d63c6eb3e555829b538b2f1';
const {api,display}=await context({current:true}),checking=process.argv.includes('--check');
const entries=metatarsalSurfaceSelections.map(spec=>{
 const matches=display.structures.filter(s=>s.fmaId===spec.fmaId);assert.equal(matches.length,1,spec.fmaId);
 const identity=matches[0];
 assert.equal(identity.region,'foot');assert.deepEqual(identity.regions,['foot']);assert.equal(identity.sourceTree,'isa');
 assert.equal(identity.system,'skeleton');assert.equal(identity.category,'bone');assert.deepEqual(identity.sources.map(s=>s.file),[spec.file]);
 const imagingGroup=Object.entries(acralBoneImagingGroups).find(([,group])=>group.fmaIds.includes(spec.fmaId));assert(imagingGroup,spec.fmaId);
 assert.equal(imagingGroup[1].region,'foot');assert.equal(imagingGroup[1].segment,undefined);
 assert.equal(spec.group,imagingGroup[1].digit===1?'first':imagingGroup[1].digit===5?'fifth':'central');
 const previous=Object.fromEntries(spec.topics.map(topic=>[topic,api.bodyLesson(identity,topic)]));
 if(!checking)for(const lesson of Object.values(previous))assert.equal(lesson.readiness,'pending');
 return {identity,group:spec.group,imagingGroup:imagingGroup[0],topics:spec.topics,previous};
});
assert.equal(entries.length,10);assert.equal(new Set(entries.map(e=>e.identity.id)).size,10);
assert.equal(entries.reduce((n,e)=>n+e.topics.length,0),20);
assert.deepEqual(Object.fromEntries(entries.map(e=>[e.identity.fmaId,e.identity.sources[0].file])),{
 FMA24508:'FJ3241',FMA24510:'FJ3244',FMA24512:'FJ3247',FMA24514:'FJ3250',FMA24516:'FJ3253',
 FMA24507:'FJ3351',FMA24509:'FJ3353',FMA24511:'FJ3355',FMA24513:'FJ3357',FMA24515:'FJ3359',
});
const bundles=display.bundles.filter(bundle=>entries.some(e=>e.identity.bundle===bundle.id));assert.equal(bundles.length,1);
for(const bundle of bundles){const bytes=await readFile('public'+bundle.url.split('?')[0]);assert.equal(bytes.length,bundle.bytes);assert.equal(createHash('sha256').update(bytes).digest('hex'),bundle.sha256);}
const base={sourceCommit,sourceVersion:display.sourceVersion,license:display.license,coordinateSystem:display.coordinateSystem,bundles};
const path='content/metatarsal-surface-imaging-pins.json';
if(checking){
 const saved=JSON.parse(await readFile(path));for(const key of Object.keys(base))assert.deepEqual(saved[key],base[key]);
 assert.deepEqual(saved.entries.map(({previous,...e})=>e),entries.map(({previous,...e})=>e));
 for(const e of saved.entries)for(const topic of e.topics)assert.equal(e.previous[topic].readiness,'pending');
 console.log(JSON.stringify({checked:true,selections:entries.length,placements:20,pinsHash:hash(saved)}));
}else{
 assert.equal(execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),sourceCommit);await assert.rejects(access(path));
 const pins={...base,previousAllLessonsAndRecipesHash:hash(snapshot(api,display)),entries};
 await writeFile(path,JSON.stringify(pins,null,2)+'\n',{flag:'wx'});
 console.log(JSON.stringify({sourceCommit,selections:entries.length,placements:20,pinsHash:hash(pins),beforeHash:pins.previousAllLessonsAndRecipesHash}));
}
