// Source-only proposed inverse for the exact 39dbb747 regional entry transport.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';

const sha = source => createHash('sha256').update(source).digest('hex');
const nowHash = 'e6fdd287be3a2239304477bbb9dcb02e5d3d553c27666091f7206097a9924e5d';
const beforeHash = '625ba92655fc0c0ec609566d611a918ae99d81f85af8e58f7c1eaee4b21dc685';
const seams = [
  ["import {parseRegionalTourEntry} from '../../lib/regional-tour-entry';\n", ''],
  [' studyLink={parseStudyLink(params)} tourEntry={parseRegionalTourEntry(params)} sourceRevision={__VM_HEAD_SOURCE_REVISION__} presentation=',
   ' studyLink={parseStudyLink(params)} presentation='],
];

export function restorePreRegionalTourHeadEntry(source) {
  assert.equal(typeof source, 'string');
  assert.equal(sha(source), nowHash, 'Exact current head entrypoint required');
  let restored = source;
  for (const [now, before] of seams) {
    assert.equal(restored.split(now).length, 2, 'Exactly one regional tour entry seam');
    restored = restored.replace(now, before);
  }
  assert.equal(sha(restored), beforeHash, 'Exact pre-tour head entrypoint recovered');
  return restored;
}
