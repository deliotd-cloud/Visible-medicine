import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';
import {json,read,sha} from './source-only-backup-20261019.mjs';
const pointer=json('CURRENT_CHECKPOINT.json');
assert.equal(pointer.activeWork.pendingRegressionRepairQueue.sha256,'31565e5a62ea302bf4c6b05afdf7391658d511b126f1fed7cae99b47b6e889df');
pointer.activeWork.pendingRegressionWorkerHandoffs={at:new Date().toISOString(),sourceOnly:true,mainIntegrationRequired:true,noNativeRerunWhileSession92110Live:true,
 workers:[
  {agent:'/root/nonhead_expansion_harness_1022',stage:'F:/VisibleMedicine/staging/20261022-clinical-study-tour-face-family-admission',paths:['tests/clinical-review-desktop-study-identity.test.ts','tests/clinical-review-guided-learning.test.ts','tests/clinical-review-digestive-tract-tour.test.ts','tests/clinical-review-facial-bone-xray.test.ts','tests/next-six-admission-contract.test.mjs'],authorizedExtras:'One pure source adapter and two complete frozen CODE fixtures if required',mainReviewed:false},
  {agent:'/root/paused_pelvic_source_families_1022',stage:'F:/VisibleMedicine/staging/20261022-clinical-femoral-girdle-family-admission',paths:['tests/clinical-review-femoral-arterial-xray.test.ts','tests/clinical-review-femoral-venous-xray.test.ts','tests/clinical-review-girdle-muscle-xray.test.ts','tests/clinical-review-femoral-arterial-admission-56-closed.test.mjs','tests/clinical-review-femoral-venous-admission-56-closed.test.mjs','tests/clinical-review-girdle-history-preservation.test.mjs'],authorizedExtras:'One pure adapter and three full authentic frozen CODE fixtures; retain exact historical46c/b4db pins',mainReviewed:false},
 ],
 mainDiagnosedNotYetEdited:[
  {path:'tests/clinical-review-elbow-us-followup.test.ts',actualFailure:'TAP874 at line260: current-source assertion still pins190a, while current validated Review/Git is6d7. Historical9f assertions remain correct; TAP875 also reaches the queued shared helper.',requiredWitness:'tests/elbow-us-followup-preservation.test.mjs'},
  {path:'tests/clinical-review-forearm-vascular-xray.test.ts',actualFailure:'TAP911 at line220: same obsolete current190a literal; historical9f snapshot and485 previous-delivery witness must remain. TAP912 has queued shared-helper mismatch.',requiredWitness:'tests/forearm-xray-preservation.test.mjs'},
  {path:'tests/clinical-review-genicular-ultrasound.test.ts',actualFailure:'TAP module340 prelude lines8215–8248 reaches old shared-helper line35 at module import. Queue78 shared helper addresses that observed prefix; latent direct manifest checks remain current-source conflations and need separate exact admission.',requiredWitness:'tests/genicular-current-preservation.test.mjs'},
 ],
 sourceAssemblyPlanner:{script:'prepare-reviewed-regression-candidate-20261022.mjs',sha256:sha(read('prepare-reviewed-regression-candidate-20261022.mjs')),proof:'F:/VisibleMedicine/staging/20261022-guided-clinical-assembly-plan-proof/RESULT.json',proofSha256:'75c02ef342a352fe195f929dfe760a94254deb5d55f53f67817429a61656cb9c',realAssemblyPerformed:false},
};
pointer.activeWork.latestMainCoordinationMapSha256=sha(read('WORKSPACE_MAP.md'));
writeFileSync('CURRENT_CHECKPOINT.json',JSON.stringify(pointer,null,2)+'\n');
console.log(JSON.stringify({nextWorkSaved:true,queueProposals:78,liveRunLeftUntouched:true,ownerPreviewChanged:false}));
