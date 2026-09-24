// Offline test replay only: never changes runtime dissection or approval.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import record from '../content/pes-anserine-study.transition.json' with {type:'json'};
const hash=v=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
export const hasPesAnserineProfiles=profiles=>profiles['whole-body'].focuses.some(f=>record.ids.includes(f.id));
export function prePesAnserineProfiles(profiles){
  assert.equal(record.beforeHash,'f767da8224dc3d729fb46c383a3714cd7a704c91f0b73d83084bcc92bc2c50ff');
  assert.equal(record.afterHash,'e539625ae07979d395fd9b46efa1a880bb2b4a33522efba9f0dd3ffc2f4a234b');
  if(hash(profiles)===record.beforeHash)return structuredClone(profiles);
  assert.equal(hash(profiles),record.afterHash,'Unrecorded pes-anserine recipe edit');
  const previous=structuredClone(profiles),body=previous['whole-body'];
  const additions=body.focuses.filter(f=>record.ids.includes(f.id));
  assert.deepEqual(additions.map(f=>f.id),record.ids);
  assert.equal(hash(additions),record.additionsHash);
  body.focuses=body.focuses.filter(f=>!record.ids.includes(f.id));
  assert.equal(body.references[record.reference.index],record.reference.url);
  body.references.splice(record.reference.index,1);
  assert.equal(hash(previous),record.beforeHash,'Every prior recipe/reference remains exact');
  return previous;
}
