import assert from 'node:assert/strict';
import {readFile, writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {contentContext} from './content-contract-tools.mjs';
import {exactSourceHistoryApi} from './exact-source-history-api.mjs';
import pins from '../content/girdle-bone-ultrasound-pins.json' with {type:'json'};
assert(process.argv.slice(2).every(arg=>arg==='--check'));
const hash=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
assert.equal(hash(pins),'b7f114cb431e73eca380b017ebe74ab1657639c3e8f4f25ccbc21f1317b4dc19');
const {api,catalog}=await contentContext();
const parent=await exactSourceHistoryApi(pins.parentCommit,'display-review');
const display=api.bodyDisplayCatalog(catalog);
assert.equal(hash(display),pins.catalogHash);
assert.deepEqual(display,parent.bodyDisplayCatalog(catalog));
assert.deepEqual(api.structures,parent.structures);
assert.deepEqual(api.dissectionProfiles,parent.dissectionProfiles);
const ids=new Set(pins.entries.map(e=>e.identity.id));
let preserved=0;
for(const s of display.structures)for(const tab of api.contentTabs){
  if(ids.has(s.id)&&tab==='ultrasound')continue;
  assert.deepEqual(api.bodyLesson(s,tab),parent.bodyLesson(s,tab),s.id+'|'+tab);
  preserved++;
}
assert.equal(preserved,9931);
const entries=pins.entries.map(({identity,previous})=>{
  assert.deepEqual(parent.bodyLesson(identity,'ultrasound'),previous);
  const current=api.bodyLesson(identity,'ultrasound');
  assert.equal(current.readiness,'draft');assert.notDeepEqual(current,previous);
  return {id:identity.id,tab:'ultrasound',previousHash:hash(previous),currentHash:hash(current)};
});
const record={parentCommit:pins.parentCommit,pinsHash:hash(pins),entries,preserved};
const path=new URL('../content/girdle-bone-ultrasound.transition.json',import.meta.url);
const output=JSON.stringify(record,null,2)+'\n';
if(process.argv.includes('--check'))assert.equal((await readFile(path,'utf8')).replaceAll('\r\n','\n'),output);
else await writeFile(path,output,{flag:'wx'});
console.log(JSON.stringify({changed:entries.length,preserved,transitionHash:hash(record),clinicalApproval:false}));
