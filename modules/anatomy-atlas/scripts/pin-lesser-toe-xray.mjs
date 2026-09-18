import assert from 'node:assert/strict';
import {access,readFile,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {context,hash,snapshot} from './pin-pica-clinical.mjs';
import {build} from './workspace-test-build.mjs';
const compiled=await build({stdin:{contents:"export {lesserToeXraySelections} from './content/lesser-toe-xray';export {acralBoneImagingGroups} from './content/acral-bone-imaging';",resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,platform:'node',format:'esm'});
const {lesserToeXraySelections,acralBoneImagingGroups}=await import('data:text/javascript;base64,'+Buffer.from(compiled.outputFiles[0].text).toString('base64'));
const sourceCommit='810cd1eb14b61115215a0eab1b574d14568584ec';
const {api,display}=await context({current:true}),checking=process.argv.includes('--check');
const entries=lesserToeXraySelections.map(spec=>{
 const matches=display.structures.filter(s=>s.fmaId===spec.fmaId);assert.equal(matches.length,1);
 const identity=matches[0];assert.equal(identity.region,'foot');assert.deepEqual(identity.regions,['foot']);
 assert.equal(identity.sourceTree,'isa');assert.equal(identity.system,'skeleton');assert.equal(identity.category,'bone');
 assert.deepEqual(identity.sources.map(s=>s.file),[spec.file]);assert.equal(identity.bundle,'foot-skeleton');
 const group=Object.entries(acralBoneImagingGroups).find(([,g])=>g.fmaIds.includes(spec.fmaId));assert(group);
 assert.equal(group[1].region,'foot');assert([2,3,4,5].includes(group[1].digit));assert.equal(group[1].segment,spec.group);
 assert.equal(api.bodyLesson(identity,'ct').readiness,'draft');assert.equal(api.bodyLesson(identity,'mri').readiness,'draft');
 const previous={xray:api.bodyLesson(identity,'xray')};if(!checking)assert.equal(previous.xray.readiness,'pending');
 return {identity,group:spec.group,imagingGroup:group[0],topics:spec.topics,previous};
});
assert.equal(entries.length,24);assert.equal(new Set(entries.map(e=>e.identity.id)).size,24);
for(const group of ['proximal','middle','distal'])assert.equal(entries.filter(e=>e.group===group).length,8);
const bundles=display.bundles.filter(b=>entries.some(e=>e.identity.bundle===b.id));assert.equal(bundles.length,1);
for(const b of bundles){const bytes=await readFile('public'+b.url.split('?')[0]);assert.equal(bytes.length,b.bytes);assert.equal(createHash('sha256').update(bytes).digest('hex'),b.sha256);}
const base={sourceCommit,sourceVersion:display.sourceVersion,license:display.license,coordinateSystem:display.coordinateSystem,bundles};
const path='content/lesser-toe-xray-pins.json';
if(checking){
 const saved=JSON.parse(await readFile(path));for(const key of Object.keys(base))assert.deepEqual(saved[key],base[key]);
 assert.deepEqual(saved.entries.map(({previous,...e})=>e),entries.map(({previous,...e})=>e));
 for(const e of saved.entries)assert.equal(e.previous.xray.readiness,'pending');
 console.log(JSON.stringify({checked:true,selections:24,pinsHash:hash(saved)}));
}else{
 assert.equal(execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),sourceCommit);await assert.rejects(access(path));
 const pins={...base,previousAllLessonsAndRecipesHash:hash(snapshot(api,display)),entries};
 await writeFile(path,JSON.stringify(pins,null,2)+'\n',{flag:'wx'});
 console.log(JSON.stringify({sourceCommit,selections:24,pinsHash:hash(pins),beforeHash:pins.previousAllLessonsAndRecipesHash}));
}
