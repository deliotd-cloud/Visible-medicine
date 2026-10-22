import {backupReviewedRegressionQueue} from './backup-reviewed-regression-queue-20261022.mjs';

backupReviewedRegressionQueue({
 queuePath:'F:/VisibleMedicine/staging/20261022-tour-reading-consolidated/QUEUE.json',
 queueSha256:'bb6464ab3973dad317a12081eaf96d068b09264774e0854c373c3f7f4e22a415',
 expectedProposals:60,
 parentReceipt:'F:/VisibleMedicine/recovery/checkpoints/20261022-spinal-step-wrist-admission-source-backup/github-backup.json',
 parentReceiptSha256:'dbd3fb779c0f2e1b70d7c38aa2761a77d6fa1579595b318a4538ec04b241fcbd',
 parentRepo:'F:/VisibleMedicine/history/website-work/github-spinal-step-wrist-admission-20261022.git',
 stem:'tour-reading-admission',
 coordinationScripts:[
  'checkpoint-spinal-step-wrist-admission-20261022.mjs',
  'consolidate-tour-reading-admission-20261022.mjs',
  'backup-tour-reading-admission-20261022.mjs',
 ],
});
