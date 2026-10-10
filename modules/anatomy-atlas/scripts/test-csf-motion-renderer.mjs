import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {runInNewContext} from 'node:vm';
import {build} from './workspace-component-test-build.mjs';
const require=createRequire(import.meta.url),React=require('react');
const built=await build({stdin:{contents:`export {CsfMotion} from './app/csf-motion';export {default as data} from './content/csf-motion.v1.json';export {csfMarkerY} from './lib/csf-motion';`,resolveDir:process.cwd(),loader:'tsx'},bundle:true,platform:'node',format:'cjs',write:false});
let frame,invalidations=0,cleanup;
const document={hidden:false};
const react={...React,useMemo:fn=>fn(),useRef:value=>({current:value}),useEffect:fn=>{cleanup=fn();}};
const module={exports:{}};
runInNewContext(built.outputFiles[0].text,{module,exports:module.exports,document,
  require:id=>id==='react'?react:id==='@react-three/fiber'?{useFrame:fn=>frame=fn,useThree:fn=>fn({invalidate:()=>invalidations++})}:require(id)});
const api=module.exports,record=api.data.records[0];
const tree=api.CsfMotion({structure:record.structure,bundleHash:api.data.bundle.sha256});
assert.equal(tree.type,'points');assert.equal(tree.props.raycast(),null);assert.equal(tree.props.frustumCulled,false);
const p=tree.props.geometry.getAttribute('position');assert.equal(p.count,40);assert.equal(invalidations,1);
const original=Array.from(p.array);frame({},2);assert.equal(invalidations,2);
for(const [i,t]of record.tracks.entries()){
  assert.equal(p.getX(i),original[i*3]);assert.equal(p.getZ(i),original[i*3+2]);
  assert(Math.abs(p.getY(i)-api.csfMarkerY(t.center[1],t.amplitude,t.phase,0.05))<1e-6);
}
assert(original.some((value,i)=>i%3===1&&value!==p.array[i]),'Actual positions change');
document.hidden=true;const paused=Array.from(p.array);frame({},2);assert.deepEqual(Array.from(p.array),paused);assert.equal(invalidations,2);
document.hidden=false;frame({},0.01);assert.equal(invalidations,3);
const material=tree.props.children.props;assert.equal(material.depthWrite,false);assert.equal(material.depthTest,true);
assert(!('onClick' in tree.props));let disposed=false;tree.props.geometry.addEventListener('dispose',()=>disposed=true);cleanup();assert(disposed);
console.log('Actual CSF component: changing Three positions, bounded delta, hidden-page pause, demand invalidation, non-picking markers and owned-geometry cleanup. No browser/GPU or clinical acceptance inferred.');
