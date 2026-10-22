import assert from 'node:assert/strict';
import {readFileSync,copyFileSync,mkdirSync,existsSync,symlinkSync,realpathSync} from 'node:fs';
const root='F:/VisibleMedicine/staging/20261022-viewer-assurance-candidate';
const website=root+'/website',fixture=website+'/tests/fixtures/expanded-viewer-test-types';
assert(!existsSync(fixture));mkdirSync(fixture);
for(const path of ['atlas-cerebral-lobar-imaging.test.ts','clinical-review-cervical-disc-tour.test.ts'])
 copyFileSync(website+'/tests/'+path,fixture+'/'+path+'.raw');
assert(!existsSync(root+'/atlas'));
assert(existsSync('F:/VisibleMedicine/atlas/scripts/exact-source-history-api.mjs'));
symlinkSync('F:/VisibleMedicine/atlas',root+'/atlas','junction');
assert.equal(realpathSync(root+'/atlas'),realpathSync('F:/VisibleMedicine/atlas'));
console.log('Original test sources preserved; candidate sibling Atlas resolves to the unchanged separate canonical repository.');
