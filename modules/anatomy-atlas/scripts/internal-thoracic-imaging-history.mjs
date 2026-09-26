// Test-only editorial replay. Never imported by runtime, review or approvals.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {isDeepStrictEqual} from 'node:util';
import pins from '../content/internal-thoracic-imaging-pins.json' with {type:'json'};
import transition from '../content/internal-thoracic-imaging-transition.json' with {type:'json'};
import {beforeLimbBoneUltrasound} from './limb-bone-ultrasound-history.mjs';

const hash=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
export function beforeInternalThoracicImaging(api){
  api=beforeLimbBoneUltrasound(api);
  if(typeof api.bodyLesson!=='function')return api;
  assert.equal(hash(pins),'20cbdd1ff2bac7d39b4d33c61b342ae1619a35443791e05bd61362543228daa6');
  assert.equal(hash(transition),'484781b74da136ea6988962aa810e5b1521017cd5352b0bd618f0ad2467c6b3a');
  assert.equal(transition.pinsHash,hash(pins));assert.equal(transition.parentCommit,pins.parentCommit);
  const records=new Map(transition.entries.map(e=>[e.id+'|'+e.tab,e]));
  assert.equal(records.size,4);assert.equal(transition.entries.length,4);
  const previous=new Map();let old=0,current=0;
  for(const e of pins.entries)for(const tab of e.topics){
    const key=e.identity.id+'|'+tab,record=records.get(key);assert(record);
    assert.equal(record.previousHash,hash(e.previous[tab]));
    const now=api.bodyLesson(e.identity,tab);
    if(isDeepStrictEqual(now,e.previous[tab]))old++;
    else{assert.equal(hash(now),record.currentHash,'Unrecorded internal thoracic imaging');current++;}
    previous.set(key,{identity:e.identity,lesson:e.previous[tab]});
  }
  assert(old===4||current===4,'Mixed internal thoracic imaging history');
  if(old===4)return api;
  const bodyLesson=(structure,tab)=>{
    const e=previous.get(structure.id+'|'+tab);
    return e&&isDeepStrictEqual(structure,e.identity)?structuredClone(e.lesson):api.bodyLesson(structure,tab);
  };
  // The pre-existing group/handler is extended, not replaced. Earlier tests
  // inspect that API as well as bodyLesson, so project exactly the four slots.
  const groups=structuredClone(api.thoracicBranchImagingGroups);
  for(const e of pins.entries)for(const tab of e.topics)delete groups[e.group].focus[tab];
  return {...api,bodyLesson,thoracicBranchImagingGroups:groups,
    thoracicBranchImagingLesson(structure,tab){
      const e=previous.get(structure.id+'|'+tab);
      return e&&isDeepStrictEqual(structure,e.identity)?undefined:api.thoracicBranchImagingLesson(structure,tab);
    },
    bodyContent(s,t){const{readiness:_readiness,...shown}=bodyLesson(s,t);return shown;},
  };
}
