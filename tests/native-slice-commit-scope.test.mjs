import assert from 'node:assert/strict';import test from 'node:test';import {readFileSync} from 'node:fs';import {createHash} from 'node:crypto';
import {readHistoricalSource} from './head-study-set-historical-source.mjs';
const normal=s=>s.replaceAll('\r\n','\n'),sha=s=>createHash('sha256').update(s).digest('hex');
test('four declared lifecycle seams reconstruct the complete exact parent component',()=>{
  // This preimage belongs to the exact native-slice proposal, not this test's
  // current Website checkout.
  const raw=readFileSync('F:/VisibleMedicine/staging/20261024-native-slice-website/before/HeadAtlasViewer.tsx','utf8');
  assert.equal(sha(raw),'6296ff18c86691f22cfa02294dae295395b9f8035768a3990a9af4fe16beeff1');
  let current=normal(readHistoricalSource('components/HeadAtlasViewer.tsx').toString());
  const seams=[
    ["  const liveCursor=useRef(cursor),liveWindow=useRef(windowing);\n  // Native listeners belong to the committed image, never a speculative render.\n  useLayoutEffect(()=>{liveCursor.current=cursor;liveWindow.current=windowing;},[cursor,windowing]);\n  useLayoutEffect(()=>{", "  const liveCursor=useRef(cursor);liveCursor.current=cursor;\n  const liveWindow=useRef(windowing);liveWindow.current=windowing;\n  useEffect(()=>{"],
    ["  const panSession=panInputs.some((value,index)=>!Object.is(value,panIdentity.current.inputs[index]))?{inputs:panInputs}:panIdentity.current;", "  if(panInputs.some((value,index)=>!Object.is(value,panIdentity.current.inputs[index])))panIdentity.current={inputs:panInputs};\n  const panSession=panIdentity.current;"],
    ["  useLayoutEffect(()=>{panIdentity.current=panSession;return()=>{if(drag.current?.scope===panSession)endPan();};},[panSession]);", "  useEffect(()=>()=>{if(drag.current?.scope===panSession)endPan();},[panSession]);"],
    ["  useLayoutEffect(()=>{\n    const area=areaRef.current;if(!area)return;\n    return bindSliceWheel(area,{getSlice:()=>liveCursor.current[view.fixedAxisIJK],sliceCount:view.sliceCount,pagePixels:()=>area.clientHeight,onSlice:slice=>{const next=[...liveCursor.current] as Vec3;next[view.fixedAxisIJK]=slice;liveCursor.current=next;onCursor(next);}});\n  },[study,view,onCursor,viewResetVersion]);", "  useEffect(()=>{\n    const area=areaRef.current;if(!area)return;\n    return bindSliceWheel(area,{getSlice:()=>liveCursor.current[view.fixedAxisIJK],sliceCount:view.sliceCount,pagePixels:()=>area.clientHeight,onSlice:slice=>{const next=[...liveCursor.current] as Vec3;next[view.fixedAxisIJK]=slice;liveCursor.current=next;onCursor(next);}});\n  },[study,view,onCursor]);"],
  ];
  for(const [after,before]of seams){assert.equal(current.split(after).length,2,'exact unique declared seam');current=current.replace(after,before);}
  assert.equal(current,normal(raw),'no extra function, renderer, mask, teaching, navigation or access change');
});
