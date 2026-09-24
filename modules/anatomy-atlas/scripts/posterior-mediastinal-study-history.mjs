// Exact offline reversal. Runtime retains the source-bound focus in both scopes.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import {hasPesAnserineProfiles,prePesAnserineProfiles} from './pes-anserine-study-history.mjs';

const hash = (value) => createHash('sha256').update(JSON.stringify(value)).digest('hex');
export const prePosteriorMediastinalProfilesHash = '4bc5b531e04448fb36afa7394cf318f3761012cbd921366d0bfb8a0a99244ce9';
const afterHash = 'f767da8224dc3d729fb46c383a3714cd7a704c91f0b73d83084bcc92bc2c50ff';
const additionHash = '35fa467f50f4e8c474911e85bff2882b5814bbf3ecfc672bc1a364633e38d62d';
const id = 'posterior-mediastinal-conduits';
const regions = ['thorax', 'whole-body'];

export function prePosteriorMediastinalProfiles(profiles) {
  if(hasPesAnserineProfiles(profiles))profiles=prePesAnserineProfiles(profiles);
  const currentHash = hash(profiles);
  if (currentHash === prePosteriorMediastinalProfilesHash) return structuredClone(profiles);
  assert.equal(currentHash, afterHash, 'Unrecorded posterior-mediastinal recipe edit');
  const previous = structuredClone(profiles);
  const addition = Object.fromEntries(regions.map((region) => [region,
    previous[region].focuses.filter((focus) => focus.id === id),
  ]));
  for (const region of regions)
    assert.equal(addition[region].length, 1, `Exactly one ${region} posterior-mediastinal focus`);
  assert.equal(hash(addition), additionHash, 'Exact ordered posterior-mediastinal additions');
  for (const region of regions)
    previous[region].focuses = previous[region].focuses.filter((focus) => focus.id !== id);
  assert.equal(hash(previous), prePosteriorMediastinalProfilesHash, 'Every preceding recipe and reference remains identical');
  return previous;
}
