// Restore the authenticated October 24 composition source before its existing inverse.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const currentSha='55f6e6d1a38d66786421fa3f1a1289b1f4bca60e5561d81da8700722624bd4fb';
const priorSha='0bc8ab0d9928b19bac75b36ffc8a0870d0e6cc4b7aba5fd7487dce553fc49a9a';
const replaceOnce=(text,before,after)=>{
 assert.equal(text.split(before).length,2,'One exact later composition seam');
 return text.replace(before,after);
};
export function restoreRelease18LowerComposition(currentBytes){
 assert.equal(sha(currentBytes),currentSha,'Complete current composition source');
 const prior=readFileSync(new URL('./fixtures/release18-lower/release-epoch-composition-preservation.test.mjs.raw',import.meta.url));
 assert.equal(sha(prior),priorSha,'Authentic October 24 composition source');
 let expected=prior.toString('utf8');
 expected=replaceOnce(expected,
  "import {restoreClinicalStructureCurrentRole} from './clinical-structure-current-role-inverse.mjs';\n",
  "import {restoreClinicalStructureCurrentRole} from './clinical-structure-current-role-inverse.mjs';\n"+
  "import {restoreRegionalQueryLoaderPreservationSource} from './regional-query-source-role.mjs';\n");
 expected=replaceOnce(expected,
  "assert.equal(sha(bytes),row.after,'Exact reviewed composed source');",
  "if(row.path==='tests/atlas-learning-loader-preservation.test.mjs')bytes=Buffer.from(restoreRegionalQueryLoaderPreservationSource(bytes.toString()));assert.equal(sha(bytes),row.after,'Exact reviewed composed source');");
 assert.deepEqual(Buffer.from(expected),Buffer.from(currentBytes),'Only two declared later composition edits');
 return prior;
}
