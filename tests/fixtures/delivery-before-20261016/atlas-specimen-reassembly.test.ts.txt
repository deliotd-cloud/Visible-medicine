import assert from 'node:assert/strict';
import test from 'node:test';
import {currentBindings,delivery,pins} from './atlas-spinal-study-specimen-fixture.ts';

const original={
  'app/specimen-removal-focus.ts':'eb7b9f29bbab0e9524a5162e0254d6c0561a773ad8bf9c7ca89cc59fefe3f362',
  'app/um-knee-study.tsx':'40162143a83d5650cf24570e94a994323dcb65c9677682ccaf838696a8bbd2d6',
};
for(const epoch of ['specimen','current'] as const)test(`${epoch} specimen reassembly preserves focus and review boundary`,()=>{
  const {inputs,files,chunk}=delivery(epoch);
  if(epoch==='specimen')pins(inputs,original,epoch);
  else currentBindings(inputs,Object.keys(original));
  const emitted=chunk('um-knee-study');
  for(const marker of ['.um-knee-separation','input[type="range"]','Return to source positions','preventScroll','specialist review pending'])
    assert.ok(emitted.includes(marker),`${epoch}: ${marker}`);
  assert(!files.some(f=>/ct-handoff|\.local\/|\.(dcm|dicom|nii|nrrd)(\.|$)/i.test(f.path)));
});
