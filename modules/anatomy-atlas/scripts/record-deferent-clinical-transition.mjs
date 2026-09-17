import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {build} from './workspace-test-build.mjs';
import pins from '../content/deferent-clinical-pins.json' with {type:'json'};

const compiled=await build({stdin:{contents:"export {bodyDisplayCatalog} from './lib/body-display-catalog'; export {bodyLesson} from './app/body-content'; export {structures} from './app/anatomy-data'; export {contentTabs} from './lib/content-types'; export {dissectionProfiles} from './app/dissection-data';",resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,format:'esm',platform:'node'});
const api=await import('data:text/javascript;base64,'+Buffer.from(compiled.outputFiles[0].text).toString('base64'));
const sha=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
const raw=JSON.parse(await readFile('public/models/bodyparts3d/full-body/catalog.json')),catalog=api.bodyDisplayCatalog(raw);
const currentAllLessonsAndRecipesHash=sha({body:catalog.structures.map(s=>({id:s.id,sections:Object.fromEntries(api.contentTabs.map(t=>[t,api.bodyLesson(s,t)]))})),shoulder:api.structures,recipes:api.dissectionProfiles});
const result={parentCommit:pins.sourceCommit,previousAllLessonsAndRecipesHash:pins.previousAllLessonsAndRecipesHash,currentAllLessonsAndRecipesHash,entries:pins.entries.map(entry=>({id:entry.identity.id,sections:Object.fromEntries(entry.topics.map(topic=>{const lesson=api.bodyLesson(entry.identity,topic);assert.equal(lesson.readiness,'draft');return[topic,sha(lesson)];}))}))};
const file='content/deferent-clinical.transition.json',text=JSON.stringify(result,null,2)+'\n';
if(process.argv.includes('--check'))assert.equal((await readFile(file,'utf8')).replace(/\r\n/g,'\n'),text);else await writeFile(file,text,{flag:'wx'});
console.log(JSON.stringify({pinsHash:sha(pins),transitionHash:sha(result),placements:4}));
