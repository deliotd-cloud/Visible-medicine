import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {context,snapshot,hash} from './pin-pica-clinical.mjs';
const parentCommit='54afec873f51042f93df97dce6f8a35ab28b8ebe';
assert.equal(execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),parentCommit);
const {api,display}=await context({current:true});
const found=display.structures.filter(s=>s.fmaId==='FMA78497');assert.equal(found.length,1);
const identity=found[0],topics=['ct','mri','ultrasound'];
const previous=Object.fromEntries(topics.map(tab=>{const lesson=api.bodyLesson(identity,tab);assert.equal(lesson.readiness,'pending');return [tab,lesson];}));
const bundles=display.bundles.filter(b=>b.id===identity.bundle);assert.equal(bundles.length,1);
for(const bundle of bundles){const bytes=await readFile('public'+bundle.url.split('?')[0]);assert.equal(bytes.length,bundle.bytes);assert.equal(createHash('sha256').update(bytes).digest('hex'),bundle.sha256);}
const pins={parentCommit,sourceVersion:display.sourceVersion,license:display.license,coordinateSystem:display.coordinateSystem,bundles,previousAllLessonsAndRecipesHash:hash(snapshot(api,display)),entries:[{identity,topics,previous}]};
await writeFile('content/central-canal-imaging-pins.json',JSON.stringify(pins,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({pinsHash:hash(pins),identity:identity.id,bundle:identity.bundle,topics}));
