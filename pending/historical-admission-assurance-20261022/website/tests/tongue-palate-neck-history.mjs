// Explicit historical roles, not a current-source compatibility fallback.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const sha=b=>createHash('sha256').update(b).digest('hex');
export function beforeNeckXraySnapshot(current,before){
 assert.equal(sha(current),'574d55fe8bfdfdc0b6af35c2e1497162320a42e4190962795639667d72e240fd','Exact later neck teaching');
 assert.equal(sha(before),'e6a486cc4ab9745eae110615b340fa1797bb0e6e0b72195f083bec766543da25','Exact colic-era head teaching');
 const source=JSON.parse(current),old=JSON.parse(before),changed=[];
 assert.equal(source.entries.length,262);assert.equal(old.entries.length,262);
 const expected=new Map([[0,'vm:anatomy:body:head-neck:midline:bone:hyoid-bone'],
  [128,'vm:anatomy:body:head-neck:midline:cartilage:cricoid-cartilage'],
  [233,'vm:anatomy:body:head-neck:unpaired:organ:epiglottis']]);
 for(let i=0;i<source.entries.length;i++){
  const after=source.entries[i],prior=old.entries[i];assert.equal(after.identity,prior.identity);
  if(JSON.stringify(after)!==JSON.stringify(prior)){
   assert.equal(JSON.parse(after.identity).id,expected.get(i),'Only exact neck landmark selections');
   assert.equal(prior.lessons.xray.readiness,'pending');assert.equal(after.lessons.xray.readiness,'draft');
   assert.notDeepEqual(after.lessons.xray,prior.lessons.xray);changed.push(i);after.lessons.xray=prior.lessons.xray;
  }
 }
 assert.deepEqual(changed,[0,128,233]);
 const restored=Buffer.from(JSON.stringify(source)+'\n');assert.deepEqual(restored,before,'Every other source identity, lesson and snapshot field survives');return restored;
}
export function beforeNeckXrayBody(current,before){
 assert.equal(sha(current),'ffb559ac6ca94d8b5713c2b2aac44aa6b9f47766dd47ff162f6625f51f4e1382','Exact later body dispatcher');
 assert.equal(sha(before),'26320b064b5648f4f5b6ca8c123806a02dedefb761b894935707559d530882fc','Exact colic-era body dispatcher');
 let source=current.toString();for(const addition of [
  "import { neckLandmarkXrayLesson } from '../lib/neck-landmark-xray';\n",
  '  const neckLandmarkXray = neckLandmarkXrayLesson(s, tab);\n  if (neckLandmarkXray) return neckLandmarkXray;\n',
 ]){assert.equal(source.split(addition).length,2,'One exact later neck dispatcher seam');source=source.replace(addition,'');}
 const restored=Buffer.from(source);assert.deepEqual(restored,before,'Every other dispatcher byte survives');return restored;
}
