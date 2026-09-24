// Offline recipe replay only. Runtime keeps the authored focus.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';

const hash = (value) =>
  createHash('sha256').update(JSON.stringify(value)).digest('hex');
const beforeHash =
  '1a6c020cad6f3bb3e50f4e1d014a191273d9b66d3eaf6503211f0f2df3ba4c8f';
const afterHash =
  '32d547014691a309b584843574b9df034ef3b3234a35a20bf52b70ba2ed33fb2';
const focusHash =
  '7375e3f10e1fa084774e80928b6dbaffc0498621bb5c9c5b94153790f5e539f9';
// Earlier curriculum replays may already hold the independently pinned knee
// checkpoint, before either later Thorax focus existed.
const preThoraxCheckpointHash =
  'dc6ea9198a24ac28e02df8729d9d06543eada6786a6ebd2d6b139f626043a4be';

export function preMediastinalOrganProfiles(profiles) {
  const currentHash = hash(profiles);
  if ([beforeHash, preThoraxCheckpointHash].includes(currentHash))
    return structuredClone(profiles);
  assert.equal(currentHash, afterHash, 'Unrecorded mediastinal recipe edit');
  const prior = structuredClone(profiles);
  const id = 'mediastinal-conduits-thymus';
  const selected = prior.thorax.focuses.filter((focus) => focus.id === id);
  assert.equal(selected.length, 1, 'Exactly one Thorax mediastinal focus');
  assert.equal(hash(selected[0]), focusHash, 'Exact mediastinal focus');
  prior.thorax.focuses = prior.thorax.focuses.filter((focus) => focus.id !== id);
  assert.equal(hash(prior), beforeHash, 'Every earlier recipe retained');
  return prior;
}
