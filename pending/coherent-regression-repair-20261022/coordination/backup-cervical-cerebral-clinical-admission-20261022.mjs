import {backupReviewedRegressionQueue} from './backup-reviewed-regression-queue-20261022.mjs';

backupReviewedRegressionQueue({
 queuePath:'F:/VisibleMedicine/staging/20261022-cervical-cerebral-clinical-consolidated/QUEUE.json',
 queueSha256:'95a1317144b420492f9ffe49e1492ef5ee55d51b77f168eb69e38d450a5ea87d',
 expectedProposals:69,
 parentReceipt:'F:/VisibleMedicine/recovery/checkpoints/20261022-tour-reading-admission-source-backup/github-backup.json',
 parentReceiptSha256:'4833d4e08c45643e2290400cc2bbb8ca3b51910c0385c6dc50223926a406be62',
 parentRepo:'F:/VisibleMedicine/history/website-work/github-tour-reading-admission-20261022.git',
 stem:'cervical-cerebral-clinical-admission',
 coordinationScripts:[
  'checkpoint-reviewed-regression-queue-20261022.mjs',
  'checkpoint-tour-reading-admission-20261022.mjs',
  'consolidate-cervical-cerebral-clinical-admission-20261022.mjs',
  'backup-cervical-cerebral-clinical-admission-20261022.mjs',
 ],
});
