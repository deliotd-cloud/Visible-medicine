// Formatting-only conversion of one admitted test postimage; raw preimage untouched.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {read,sha} from './source-only-backup-20261019.mjs';
const file='F:/VisibleMedicine/staging/20261021-clinical-git-root-proposal/tests/clinical-review-salivary-stylohyoid-quiz.test.ts';
const before=read(file);assert.equal(sha(before),'1293e6e5162ec8c6c1c10670c43b66cbd55c6c083133a1cec3dba5e66e97fed5');
const formatted=Buffer.from(before.toString().replace(/\r\n/g,'\n'));
assert.equal(sha(formatted),'13e34a676028b2f622f9f703d4f196da3810c4c3108475b82c2c5146155f124f');
fs.writeFileSync(file,formatted);
assert.equal(sha(read(file)),sha(formatted));
console.log(JSON.stringify({formatOnly:true,sha256:sha(formatted),originalRawFixtureUnchanged:true}));
