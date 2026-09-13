// One-time audit record, not a clinical approval or a runtime migration.
import {writeFile,readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {contentContext} from './content-contract-tools.mjs';
const hash=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
const pins=JSON.parse(await readFile('content/thoracic-branch-imaging-pins.json'));
const {api}=await contentContext();
const transition={parentCommit:pins.sourceCommit,entries:pins.entries.map(e=>({id:e.identity.id,sections:Object.fromEntries(e.topics.map(t=>[t,hash(api.bodyLesson(e.identity,t))]))}))};
await writeFile('content/thoracic-branch-imaging.transition.json',JSON.stringify(transition,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({pinsHash:hash(pins),transitionHash:hash(transition)}));
