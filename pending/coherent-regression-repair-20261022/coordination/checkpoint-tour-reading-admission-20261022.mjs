import {checkpointReviewedRegressionQueue} from './checkpoint-reviewed-regression-queue-20261022.mjs';

checkpointReviewedRegressionQueue({
 stem:'tour-reading-verified',
 queuePath:'F:/VisibleMedicine/staging/20261022-tour-reading-consolidated/QUEUE.json',
 queueSha256:'bb6464ab3973dad317a12081eaf96d068b09264774e0854c373c3f7f4e22a415',
 expectedProposals:60,
 backupPath:'F:/VisibleMedicine/recovery/checkpoints/20261022-tour-reading-admission-source-backup/github-backup.json',
 backupSha256:'4833d4e08c45643e2290400cc2bbb8ca3b51910c0385c6dc50223926a406be62',
 milestone:{newUniqueReviewedSourcePaths:2,completeOriginalSourceInverses:60,sourceInverseEditSeams:10,sourceMutationRefusals:6,nativeRootsRerun:false,actualVerifiedSourceBackup:true,
  leftColicAccessFollowupLocalOnly:'F:/VisibleMedicine/staging/20261022-left-colic-ultrasound-evidence/PUBLIC_ACCESS_FOLLOWUP.json',leftColicStillPending:true,articleAssetsOrProseImported:false},
});
