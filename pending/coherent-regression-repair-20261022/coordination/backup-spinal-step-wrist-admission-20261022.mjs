import {backupReviewedRegressionQueue} from './backup-reviewed-regression-queue-20261022.mjs';

backupReviewedRegressionQueue({
 queuePath:'F:/VisibleMedicine/staging/20261022-spinal-step-wrist-consolidated/QUEUE.json',
 queueSha256:'9de5a86b16d6cd39e935a566ae94c38fdebe2015cb74517c86541b8768c1d62d',
 expectedProposals:58,
 parentReceipt:'F:/VisibleMedicine/recovery/checkpoints/20261022-extra-expansion-family-source-backup/github-backup.json',
 parentReceiptSha256:'3177a69ec35e99dfe7e9ed9134f04bdff5a3b40c3cc7a5b35ff71759f8f0a3c0',
 parentRepo:'F:/VisibleMedicine/history/website-work/github-extra-expansion-family-20261022.git',
 stem:'spinal-step-wrist-admission',
 coordinationScripts:[
  'checkpoint-extra-expansion-family-admission-20261022.mjs',
  'consolidate-xray-quiz-reflow-admission-20261022.mjs',
  'consolidate-spinal-step-wrist-admission-20261022.mjs',
  'backup-spinal-step-wrist-admission-20261022.mjs',
 ],
});
