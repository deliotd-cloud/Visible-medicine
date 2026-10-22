import {backupReviewedRegressionQueue} from './backup-reviewed-regression-queue-20261022.mjs';
backupReviewedRegressionQueue({
 queuePath:'F:/VisibleMedicine/staging/20261022-guided-clinical-shared-consolidated/QUEUE.json',
 queueSha256:'31565e5a62ea302bf4c6b05afdf7391658d511b126f1fed7cae99b47b6e889df',
 expectedProposals:78,
 parentReceipt:'F:/VisibleMedicine/recovery/checkpoints/20261022-cervical-cerebral-clinical-admission-source-backup/github-backup.json',
 parentReceiptSha256:'a8fe443ec50bf93be6b2e2d8786dcfdb7dfbf6b3a6aad6dd9dcce618efc4c2be',
 parentRepo:'F:/VisibleMedicine/history/website-work/github-cervical-cerebral-clinical-admission-20261022.git',
 stem:'guided-clinical-shared-admission',
 coordinationScripts:[
  'checkpoint-reviewed-regression-queue-20261022.mjs','checkpoint-cervical-cerebral-clinical-admission-20261022.mjs','save-cervical-clinical-worker-handoff-20261022.mjs',
  'prepare-reviewed-regression-candidate-20261022.mjs','verify-reviewed-regression-planner-20261022.mjs','verify-reviewed-regression-terminal-gates-20261022.mjs','verify-guided-clinical-assembly-plan-20261022.mjs',
  'consolidate-guided-clinical-shared-admission-20261022.mjs','backup-guided-clinical-shared-admission-20261022.mjs',
 ],
});
