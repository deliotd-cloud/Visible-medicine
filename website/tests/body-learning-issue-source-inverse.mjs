import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const sha=text=>createHash('sha256').update(text).digest('hex');
const current='36ba41a0c702d4f14f9be9d9b999e258294807ac1b0cd21491ef80630fabd730';
const before='058b63bd82d999cbc2020bc0e9221990432156f1d943b958b7aed1c222185af7';
const issueContext=`  const readIssueContext=useMemo(()=>()=>{
    const latest=liveSelection.current;
    if(!context||document.hidden||!liveFrame.current?.()||snapshotRef.current.identity!==identity||
      snapshotRef.current.value!==value||latest!==value||latest?.status!=='selected'||
      frame.current?.getAttribute('src')!==src)return null;
    return {atlas:'3D' as const,region:context.region,sourceRevision:context.revision,
      structure:{id:latest.reference.structureId,label:latest.label}};
  },[context,identity,value,frame,src]);
`;
/** Exact original source role only; actual UI tests still render current code. */
export function restorePreIssueDetails(source){
  let text=source.replaceAll('\r\n','\n');
  if(sha(text)===before)return text;
  assert.equal(sha(text),current,'Only the exact issue-details successor is admitted');
  for(const seam of ["import {AtlasIssueDetails} from './AtlasIssueDetails';\n",issueContext,'    <AtlasIssueDetails readContext={readIssueContext}/>\n']){
    assert.equal(text.split(seam).length,2,'One exact issue-details seam');text=text.replace(seam,'');
  }
  assert.equal(sha(text),before,'Complete pre-issue source recovered');return text;
}
