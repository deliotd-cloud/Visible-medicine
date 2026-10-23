import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';

export const CURRENT_PAN_PRESENTATION_SHA256='180d034774956e77d62a0b2d0ad517b38d70581dfc8da935fd937f1c8f4dc08a';

export function admitCurrentPanPresentation(bytes){
  assert(bytes instanceof Uint8Array,'Pan presentation must be file bytes');
  const actual=createHash('sha256').update(bytes).digest('hex');
  assert.equal(actual,CURRENT_PAN_PRESENTATION_SHA256,'Unreviewed pan presentation');
  return actual;
}
