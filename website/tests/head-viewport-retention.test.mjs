import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createHeadViewportMemory,defaultHeadViewportFrame} from '../lib/head-viewport-memory.ts';

const frame=(zoom,x,y)=>({zoom,pan:{x,y}});

test('axial framing survives coronal and 3D expansion while each native plane is independent',()=>{
  const memory=createHeadViewportMemory(),studyScope={};
  memory.activate(studyScope);
  memory.write(studyScope,'axial',frame(2.5,40,-20));
  assert.deepEqual(memory.read(studyScope,'coronal'),defaultHeadViewportFrame());
  memory.write(studyScope,'coronal',frame(3,-15,18));
  // Enlarging 3D unmounts native canvases; it does not create another scope.
  assert.deepEqual(memory.read(studyScope,'axial'),frame(2.5,40,-20));
  assert.deepEqual(memory.read(studyScope,'coronal'),frame(3,-15,18));
  assert.deepEqual(memory.read(studyScope,'sagittal'),defaultHeadViewportFrame());
});

test('Fit replaces only its plane and changed study, selection, reset or practice scope clears all frames',()=>{
  const memory=createHeadViewportMemory();let scope={};
  memory.activate(scope);
  memory.write(scope,'axial',frame(3,25,30));
  memory.write(scope,'coronal',frame(2,10,-5));
  memory.write(scope,'axial',defaultHeadViewportFrame());
  assert.deepEqual(memory.read(scope,'axial'),defaultHeadViewportFrame());
  assert.deepEqual(memory.read(scope,'coronal'),frame(2,10,-5));
  for(const boundary of ['new source','selected structure','explicit reset','new question','new practice attempt','mode','outcome']){
    const old=scope;scope={boundary};memory.activate(scope);
    assert.deepEqual(memory.read(scope,'coronal'),defaultHeadViewportFrame(),boundary);
    assert.equal(memory.write(old,'axial',frame(4,999,999)),false,boundary);
    memory.write(scope,'coronal',frame(2,10,-5));
  }
});

test('speculative reads never activate or mutate a scope; stale callbacks cannot write after commit',()=>{
  const memory=createHeadViewportMemory(),committed={},speculative={};
  memory.activate(committed);memory.write(committed,'axial',frame(2,16,9));
  assert.deepEqual(memory.read(speculative,'axial'),defaultHeadViewportFrame());
  assert.equal(memory.write(speculative,'axial',frame(4,80,80)),false);
  assert.deepEqual(memory.read(committed,'axial'),frame(2,16,9));
  memory.activate(speculative);
  assert.equal(memory.write(committed,'axial',frame(3,100,100)),false);
  assert.deepEqual(memory.read(speculative,'axial'),defaultHeadViewportFrame());
});

test('stored frames are detached snapshots, and viewport wiring does not cache cursor or window',()=>{
  const memory=createHeadViewportMemory(),scope={};memory.activate(scope);
  const original=frame(2,24,-11);memory.write(scope,'axial',original);
  original.pan.x=999;
  const restored=memory.read(scope,'axial');restored.pan.y=999;
  assert.deepEqual(memory.read(scope,'axial'),frame(2,24,-11));
  const source=readFileSync(new URL('../components/HeadAtlasViewer.tsx',import.meta.url),'utf8');
  assert.match(source,/planes\.filter\(plane=>!expanded\|\|expanded===plane\)/);
  assert.match(source,/viewportMemory=\{\{cache:viewportCache,scope:viewportScope\}\}/);
  assert.match(source,/const viewportScope=useMemo\(\(\)=>\(\{\}\),\[study,sliceSelection\?\.entry\.id,viewResetVersion,quizActive,practice\.mode,practice\.index,practice\.target,practice\.outcome\]\)/);
  assert.match(source,/const \[viewState,setViewState\]=useState<HeadViewportFrame>/);
  assert.match(source,/const \[cursor,setCursor\]=useState/);
  assert.match(source,/\[windowing,setWindowing\]=useState/);
  assert.match(source,/const viewport=headSliceViewport\(fit,\{width:physicalWidth,height:physicalHeight\},viewState\.zoom,viewState\.pan\)/);
});
