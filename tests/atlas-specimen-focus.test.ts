import assert from 'node:assert/strict';
import test from 'node:test';
import {currentBindings,delivery,pins} from './atlas-spinal-study-specimen-fixture.ts';

const original={
  'app/specimen-removal-focus.ts':'eb7b9f29bbab0e9524a5162e0254d6c0561a773ad8bf9c7ca89cc59fefe3f362',
  'app/um-knee-study.tsx':'40162143a83d5650cf24570e94a994323dcb65c9677682ccaf838696a8bbd2d6',
};
for(const epoch of ['specimen','current'] as const)test(`${epoch} specimen removal/history focus excludes CT preflight`,()=>{
  const {inputs,files,chunk}=delivery(epoch);
  if(epoch==='specimen')pins(inputs,original,epoch);
  else currentBindings(inputs,Object.keys(original));
  assert(!inputs.some(i=>/ct-handoff-preflight|\.local\//.test(i.path)));
  assert(!files.some(f=>/ct-handoff|preflight|\.local\//.test(f.path)));
  const emitted=chunk('um-knee-study');
  for(const marker of ['ownerDocument','activeElement','isConnected','preventScroll','scrollTop','Set aside'])
    assert.ok(emitted.includes(marker),`${epoch}: ${marker}`);
});
