import {readFileSync,writeFileSync,copyFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const root='F:/VisibleMedicine/staging/20261022-viewer-assurance-candidate';
const source=root+'/website/tests/expanded-viewer-type-preservation.test.mjs';
const bytes=readFileSync(source);
copyFileSync(source,root+'/website/tests/fixtures/expanded-viewer-test-types/expanded-viewer-type-preservation.first-attempt.mjs.raw');
writeFileSync(root+'/TYPE_PROOF_FIRST_REFUSAL.json',JSON.stringify({at:new Date().toISOString(),testSourceSha256:createHash('sha256').update(bytes).digest('hex'),observedExit:1,observedCounts:{tests:21,pass:19,fail:2,skipped:0},rawLogCaptured:false,commandOutputRetainedInTask:true,cause:'New witness incorrectly claimed identical executable JS for two explicitly changed historical reader URLs. The two actual TS annotation inverses and every old native assertion passed. Correct witness distinguishes type-erased identity from exact reader-seam preservation.',passingClaim:false,ownerPreviewChanged:false},null,2)+'\n',{flag:'wx'});
