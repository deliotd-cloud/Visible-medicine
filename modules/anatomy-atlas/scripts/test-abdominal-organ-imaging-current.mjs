// Current and historical contracts are separate; neither expected value is rebased.
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {contentContext} from './content-contract-tools.mjs';
import {verifyCurrentAbdominalImaging,currentAbdominalImagingBefore} from './abdominal-organ-imaging-current-contract.mjs';
const root=fileURLToPath(new URL('../',import.meta.url));
const pins=JSON.parse(await readFile(new URL('../content/abdominal-organ-imaging-pins.json',import.meta.url)));
const {api,catalog}=await contentContext(),display=api.bodyDisplayCatalog(catalog);
const result=verifyCurrentAbdominalImaging(api,catalog),before=currentAbdominalImagingBefore({api,catalog});
const targets=new Set(pins.entries.flatMap(entry=>entry.topics.map(tab=>entry.identity.id+'|'+tab)));
let unrelated=0;
for(const structure of display.structures)for(const tab of api.contentTabs){
  if(targets.has(structure.id+'|'+tab))continue;
  assert.deepEqual(before.bodyLesson(structure,tab),api.bodyLesson(structure,tab),'Unrelated current lesson rewound');unrelated++;
}
assert.equal(unrelated,display.structures.length*api.contentTabs.length-32);
const target=pins.entries[0],tab=target.topics[0];
const changed={...api,bodyLesson(s,t){const lesson=api.bodyLesson(s,t);return s.id===target.identity.id&&t===tab?{...lesson,body:lesson.body+' foreign'}:lesson;}};
assert.throws(()=>verifyCurrentAbdominalImaging(changed,catalog),/Unrecorded abdominal-organ imaging change/,'Changed live content must not pass');
assert.throws(()=>currentAbdominalImagingBefore({api:changed,catalog}),/Unrecorded abdominal-organ imaging change/,'Rewind must not hide changed live content');
const nonTarget=display.structures.find(s=>!pins.entries.some(e=>e.identity.id===s.id));
const unrelatedApi={...api,bodyLesson(s,t){const lesson=api.bodyLesson(s,t);return s.id===nonTarget.id&&t==='anatomy'?{...lesson,title:'Unrelated current change retained'}:lesson;}};
assert.equal(currentAbdominalImagingBefore({api:unrelatedApi,catalog}).bodyLesson(nonTarget,'anatomy').title,'Unrelated current change retained');
const original=execFileSync('git',['--no-replace-objects','show','6c06c9bcb7967010f4eaa14fa3009b1f4e3c4300:scripts/validate-abdominal-organ-imaging.mjs'],{cwd:root,encoding:'utf8',windowsHide:true});
const current=await readFile(new URL('./validate-abdominal-organ-imaging.mjs',import.meta.url),'utf8');
const protectedLines=original.split(/\r?\n/).filter(line=>line.startsWith('assert.equal(hash({body:')||line.startsWith('for(const path of preserved)assert.equal('));
assert.equal(protectedLines.length,2);for(const line of protectedLines)assert(current.split(/\r?\n/).includes(line),'Original historical assertion removed or altered');
console.log(JSON.stringify({...result,unrelatedCurrentSectionsExact:unrelated,currentMutationCanaries:2,unrelatedChangeRetained:true,originalAssertionLinesExact:2,clinicalApproval:false}));
