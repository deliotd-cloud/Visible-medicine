import {backupReviewedRegressionQueue} from './backup-reviewed-regression-queue-20261022.mjs';
backupReviewedRegressionQueue({
 queuePath:'F:/VisibleMedicine/staging/20261022-regional-tour-orbital-family-consolidated/QUEUE.json',
 queueSha256:'fe42957087638a24a934a5f1edddd7c44b38841951f8b0e76b2d2584df282a76',expectedProposals:124,
 parentReceipt:'F:/VisibleMedicine/recovery/checkpoints/20261022-regional-imaging-history-admission-source-backup/github-backup.json',
 parentReceiptSha256:'d0c7b52e03286d75d55e206257d30616dd67b7139e04da12cbe5ab7c3b5d29fc',
 parentRepo:'F:/VisibleMedicine/history/website-work/github-regional-imaging-history-admission-20261022.git',
 stem:'regional-tour-orbital-family-admission',
 coordinationScripts:['checkpoint-regional-imaging-history-admission-20261022.mjs','save-regional-tour-leg-handoff-20261022.mjs','prepare-leg-vessel-source-family-admission-20261022.mjs','verify-leg-vessel-source-family-admission-20261022.mjs','consolidate-regional-tour-orbital-family-admission-20261022.mjs','backup-regional-tour-orbital-family-admission-20261022.mjs'],
});
