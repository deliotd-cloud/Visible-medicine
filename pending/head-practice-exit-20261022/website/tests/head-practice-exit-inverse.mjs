// Test-only closed source role. Never used to execute the current viewer.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const sha=s=>createHash('sha256').update(s).digest('hex');
const once=(s,from,to)=>{assert.equal(s.split(from).length,2,'Exact exit seam');return s.replace(from,to);};
export function restorePracticeExitViewer(current){
 assert.equal(sha(current),'97b93a4b7af313042a6a54e8f9983b42c3eb8beb8b30222e4ee2d5d9f4812d73','Authenticated complete guarded viewer');
 const start=current.indexOf('  // Exit controls belong to a committed practice snapshot.'),end=current.indexOf('  const comparisonOpen=',start);assert(start>0&&end>start);
 let prior=once(current,current.slice(start,end),'');
 prior=once(prior,"    const files=event.target.files?Array.from(event.target.files):[];if(!files.length)return;\n    if(!canExitPractice()){event.target.value='';return;}\n    const generation=++importGeneration.current;","    const files=event.target.files?Array.from(event.target.files):[];if(!files.length)return;const generation=++importGeneration.current;");
 prior=once(prior,"  function closeAtlas(){\n    if(!canExitPractice())return;","  function closeAtlas(){");
 prior=once(prior,"onClick={event=>{if(event.defaultPrevented)return;if(event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey||event.currentTarget.target==='_blank')return;if(!canExitPractice(false)){event.preventDefault();return;}rememberHistoryView();}}","onClick={()=>rememberHistoryView()}");
 assert.equal(sha(prior),'2597a39850383fcc7be5c11762ad767101f0c7978c33099b854d51ef8ddc0509','Complete preceding viewer retained');return prior;
}
