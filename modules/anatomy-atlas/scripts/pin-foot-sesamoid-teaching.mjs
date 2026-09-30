import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {context,snapshot,hash} from './pin-pica-clinical.mjs';
import {exactSourceHistoryApi} from './exact-source-history-api.mjs';
const parentCommit='9dbdcfa1a8acdded407fc0be56f9369237fd1264';
const {display}=await context({current:true}),previous=await exactSourceHistoryApi(parentCommit);
assert.deepEqual(previous.bodyDisplayCatalog(display),display);
const entries=['FMA45097','FMA45098'].map(fmaId=>{const matches=display.structures.filter(s=>s.fmaId===fmaId);assert.equal(matches.length,1);const identity=matches[0];assert.equal(identity.system,'skeleton');assert.equal(identity.region,'foot');return {identity,topics:[...previous.contentTabs],previous:Object.fromEntries(previous.contentTabs.map(t=>[t,previous.bodyLesson(identity,t)]))};});
const bundles=display.bundles.filter(b=>entries.some(e=>e.identity.bundle===b.id));
for(const b of bundles){const bytes=await readFile('public'+b.url.split('?')[0]);assert.equal(bytes.length,b.bytes);assert.equal(createHash('sha256').update(bytes).digest('hex'),b.sha256);}
const pins={parentCommit,coordinateSystem:display.coordinateSystem,bundles,previousAllLessonsAndRecipesHash:hash(snapshot(previous,display)),entries},path='content/foot-sesamoid-teaching-pins.json';
if(process.argv.includes('--check'))assert.deepEqual(JSON.parse(await readFile(path)),pins);else await writeFile(path,JSON.stringify(pins,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({identities:entries.length,topics:entries.reduce((n,e)=>n+e.topics.length,0),pinsHash:hash(pins)}));
