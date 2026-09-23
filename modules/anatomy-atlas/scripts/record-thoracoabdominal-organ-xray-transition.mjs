// One-time X-ray extension record. Existing CT/MRI/ultrasound pins are immutable.
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {contentContext} from './content-contract-tools.mjs';
const hash=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
const pins=JSON.parse(await readFile('content/thoracoabdominal-organ-imaging-pins.json'));
const {api}=await contentContext();
const previous={readiness:'pending',title:'X-ray teaching pending',body:'A source-specific X-ray lesson has not yet been authored for this selection. The coloured 3D surface is not a radiograph.',note:'No X-ray image, detector geometry or registered correspondence is loaded. Separate imaging-atlas and lecture access will be checked independently.'};
const entries=pins.entries.filter(e=>api.thoracoabdominalOrganImagingGroups[e.group].focus.xray).map(e=>{
  const lesson=api.bodyLesson(e.identity,'xray');
  assert.equal(lesson.readiness,'draft');
  assert.deepEqual(lesson,api.thoracoabdominalOrganImagingLesson(e.identity,'xray'));
  return {id:e.identity.id,draftHash:hash(lesson)};
});
assert.equal(entries.length,11);
const record={parentCommit:'c3bbeb492cd14cc0f01bc2a85e6303291aab5414',originalPinsHash:hash(pins),previous,entries};
if(process.argv.includes('--print')){
  console.log(JSON.stringify(record,null,2));
  process.exit(0);
}
await writeFile('content/thoracoabdominal-organ-xray.transition.json',JSON.stringify(record,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({entries:entries.length,recordHash:hash(record)}));
