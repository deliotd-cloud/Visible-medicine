// Test-only inverse of the four exact guided-note announcement additions.
// Current behaviour remains exercised by head-guided-caption-live.test.ts.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const sha=s=>createHash('sha256').update(s).digest('hex');
const seams=[
  [
    "import {HeadAtlasReferenceTeaching,type HeadCompactNote} from './HeadAtlasReferenceTeaching';",
    "import {HeadAtlasReferenceTeaching} from './HeadAtlasReferenceTeaching';"
  ],
  [
    "  const announced=useRef<string|null>(null);\n  const [announcement,setAnnouncement]=useState('');\n",
    ""
  ],
  [
    "  // Retire spoken teaching as soon as the visible model selection loses confirmation.\n  useLayoutEffect(()=>{\n    if(!ready){\n      announced.current=null;\n      if(announcement)setAnnouncement('');\n    }\n  });\n  function reportCompactNote(note:HeadCompactNote){\n    if(!isCurrent()||liveStatus.current!=='ready'||confirmedSource.current!==sourceRevision||!headLinksCurrent()||\n      pending.current!==null||focusOutstanding.current||!snapshot.current||!headGuidedMatches(snapshot.current,desired.current)||\n      note.conceptId!==desired.current.position.conceptId||note.revision!==HEAD_MANIFEST_SHA256)return;\n    const position=desired.current.position;\n    const key=`${sourceRevision}:${position.sequenceId}:${note.conceptId}`;\n    if(announced.current===key)return;\n    const plan=headGuidedPlaybackPlan(position);\n    if(!plan||!note.label||!note.anatomy)return;\n    announced.current=key;\n    setAnnouncement(`Step ${plan.index+1} of ${plan.total}: ${note.label}. ${note.anatomy}`);\n  }\n",
    ""
  ],
  [
    "      <p role={ready?undefined:'status'}>{notice}</p>\n      <p className=\"sr-only\" aria-live=\"polite\" aria-atomic=\"true\">{announcement}</p>\n      {ready&&<HeadAtlasReferenceTeaching key={`caption:${destination.position.conceptId}`} compact conceptId={destination.position.conceptId!} revision={HEAD_MANIFEST_SHA256} onCompactNote={reportCompactNote}/>}",
    "      <p role=\"status\">{notice}</p>\n      {ready&&<HeadAtlasReferenceTeaching key={`caption:${destination.position.conceptId}`} compact conceptId={destination.position.conceptId!} revision={HEAD_MANIFEST_SHA256}/>}"
  ]
];
export function restorePreGuidedCaption(source){
  assert.equal(sha(source),"7e0679112cf194cb55be49416cd03fb0879c2913db2e155419b979be303545a2",'Exact post-caption guided wrapper');
  let restored=source;
  for(const [added,prior]of seams){
    assert.equal(restored.split(added).length,2,'Exactly one declared caption seam');
    restored=restored.replace(added,prior);
  }
  assert.equal(sha(restored),"c10c75828276cf858fae4397d04cb16ca7962e1221d9ce0e2abe778d1fa9cf39",'Exact pre-caption guided wrapper');
  return restored;
}
