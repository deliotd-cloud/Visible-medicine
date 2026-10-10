import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {contentContext} from './content-contract-tools.mjs';
import {exactSourceHistoryApi} from './exact-source-history-api.mjs';
const hash=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
const sha=x=>createHash('sha256').update(x).digest('hex');
const baseline='ae13b8de049671e2cac8dd789a6bfb385f147769';
const groups={rightLung:{fma:'FMA7309',tabs:['anatomy']},leftLung:{fma:'FMA7310',tabs:['anatomy']},trachea:{fma:'FMA7394',tabs:['anatomy','function']},rightBronchus:{fma:'FMA7395',tabs:['anatomy','function']},leftBronchus:{fma:'FMA7396',tabs:['anatomy','function']}};
const{api,catalog}=await contentContext(),display=api.bodyDisplayCatalog(catalog);
const parent=await exactSourceHistoryApi(baseline,'display-content');
assert.deepEqual(display,parent.bodyDisplayCatalog(catalog));
const snapshot={body:display.structures.map(s=>({id:s.id,sections:Object.fromEntries(api.contentTabs.map(t=>[t,parent.bodyLesson(s,t)]))})),shoulder:parent.structures,recipes:parent.dissectionProfiles};
const entries=Object.entries(groups).map(([group,{fma,tabs}])=>{
 const matches=display.structures.filter(s=>s.fmaId===fma);assert.equal(matches.length,1);
 const identity=matches[0];assert.equal(identity.system,'organs');assert.equal(identity.category,'organ');assert.equal(identity.region,'thorax');assert(identity.regions.includes('thorax'));
 const previous=Object.fromEntries(tabs.map(t=>[t,parent.bodyLesson(identity,t)]));
 for(const v of Object.values(previous))assert.equal(v.readiness,'draft');
 return {identity,group,previous};
});
assert.equal(entries.length,5);assert.equal(entries.flatMap(e=>Object.keys(e.previous)).length,8);
const bundles=display.bundles.filter(b=>entries.some(e=>e.identity.bundle===b.id));
for(const b of bundles){const bytes=await readFile('public'+b.url.split('?')[0]);assert.equal(bytes.length,b.bytes);assert.equal(sha(bytes),b.sha256);}
const pins={baseline,sourceVersion:display.sourceVersion,coordinateSystem:display.coordinateSystem,bundles,previousAllLessonsAndRecipesHash:hash(snapshot),entries};
const path='content/respiratory-core-depth-pins.json';
if(process.argv.includes('--check'))assert.deepEqual(JSON.parse(await readFile(path)),pins);
else{
 assert.equal(execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),baseline);
 for(const s of display.structures)for(const t of api.contentTabs)assert.deepEqual(api.bodyLesson(s,t),parent.bodyLesson(s,t),'Capture before integrating new teaching');
 await writeFile(path,JSON.stringify(pins,null,2)+'\n',{flag:'wx'});
}
console.log(JSON.stringify({selections:5,placements:8,bundles:bundles.length,baseline,pinsHash:hash(pins)}));
