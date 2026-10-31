import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { hash, json } from 'file:///C:/Users/delio/Documents/Codex/2026-09-05/referenced-chatgpt-conversation-this-is-an-2/bounded-source-hash-20261026.mjs';
import { backup } from 'file:///C:/Users/delio/Documents/Codex/2026-09-05/referenced-chatgpt-conversation-this-is-an-2/source-only-backup-20261019.mjs';
import { saveIndex } from 'file:///F:/VisibleMedicine/staging/20261028-head-search-comparison-recipes/state.mjs';
import { validateChecklist, renderChecklist } from 'file:///F:/VisibleMedicine/website/scripts/refresh-completion-checklist.mjs';
const root = 'G:/VisibleMedicine-temp/staging/20261031-review-group-order-ready', source = json(root + '/SOURCE.json'), site = source.website;
const parentRoot = 'G:/VisibleMedicine-temp/staging/20261031-release-partition8-ready';
const prior = 'F:/VisibleMedicine/recovery/checkpoints/20261031-release-partition8-focused';
const cp = 'F:/VisibleMedicine/recovery/checkpoints/20261031-review-group-order-verified', canonical = 'F:/VisibleMedicine/website';
const read = p => fs.readFileSync(p), ref = p => ({ path: p, sha256: hash(p) });
const write = (p, value) => { fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, Buffer.isBuffer(value) ? value : typeof value === 'string' ? value : JSON.stringify(value, null, 2) + '\n', { flag: 'wx' }); };
function verify() {
  assert.equal(hash(root + '/SOURCE.json'), 'd719b7a0ab1dba6a89ef67677ed120036e246df46f96a92b3abee0572c968714');
  for (const row of source.sourceRows) assert.equal(hash(site + '/' + row.path), row.sha256, row.path);
  for (const row of json(site + '/atlas-review/integration-inputs.json').inputs) assert.equal(hash(site + '/' + row.path), row.sha256, row.path);
  assert.equal(json(canonical + '/atlas-review/integration-inputs.json').sha256, '3648a75bdf7543a29047e74193231fad27afd450d9b0ebc7164393ba2a0d3b2f');
  assert.equal(json(root + '/VERIFIED.json').pass, 19);
  assert.equal(json(root + '/VERIFIED.json').source.sha256, hash(root + '/SOURCE.json'));
}
verify(); assert(!fs.existsSync(cp)); const at = new Date().toISOString();
write(cp + '/INDEX_BEFORE.json', read('CURRENT_CHECKPOINT.json'));
for (const p of ['SOURCE.json', 'COMPOSITION.json', 'VERIFIED.json', 'FOCUSED.tap']) write(cp + '/' + p, read(root + '/' + p));
write(cp + '/FINDING.md', read('G:/VisibleMedicine-temp/proposals/20261031-review-desktop-next-gap/findings.md'));
const cervical = json(parentRoot + '/CERVICAL_DIAGNOSTIC.json');
assert(cervical.passing && cervical.process.terminalObserved && cervical.counts.pass === 3 && cervical.counts.fail === 0 && cervical.counts.skipped === 0);
write(cp + '/cervical/RESULT.json', read(parentRoot + '/CERVICAL_DIAGNOSTIC.json'));
for (const p of ['PROCESS-TERMINAL.json', 'PREPARATION.json', 'STARTED.json', 'runner.stdout.log', 'runner.stderr.log', 'memory.jsonl']) write(cp + '/cervical/' + p, read(parentRoot + '/cervical-diagnostic/' + p));
const queue = json(parentRoot + '/RELEASE_QUEUE.json');
const queueEvidence = { queue: parentRoot + '/RELEASE_QUEUE.json', source: queue.source, observedAt: at, terminal: queue.terminal, completed: queue.completed };
let handle = null;
if (!queue.terminal) {
  process.kill(queue.coordinatorPid, 0);
  const started = json(queue.current.evidence + '/STARTED.json');
  process.kill(started.supervisorPid, 0); process.kill(started.runnerPid, 0);
  handle = { sessionId: 41260, kind: 'parent 1bd8a279 sequential stock release checks', coordinatorPid: queue.coordinatorPid,
    supervisorPid: started.supervisorPid, runnerPid: started.runnerPid, evidence: queue.current.evidence, sourceSha256: queue.source.sha256, verifiedLiveAt: at };
}
write(cp + '/QUEUE_SNAPSHOT.json', { ...queueEvidence, handle, notCurrentCandidateFullSuite: true });
write(cp + '/BUILD_ADMISSION.json', { at, source: ref(parentRoot + '/SOURCE.json'), admitted: false, availableMiB: 5523, requiredMiB: 6144,
  fullBuildPassed: false, terminalDiagnostic: 'Build recipe exited 1 before a build job was started; memory admission refused the run.', evidence: 'tool execution chunk666c51', noUnrelatedProcessesStopped: true });
const selected = new Map();
function collect(dir, prefix = '') { for (const entry of fs.readdirSync(dir, { withFileTypes: true })) { const name = prefix + entry.name; if (entry.isDirectory()) collect(dir + '/' + entry.name, name + '/'); else selected.set(name, dir + '/' + entry.name); } }
collect(prior + '/selected-source');
for (const relative of source.currentChanges) selected.set('website/' + relative, site + '/' + relative);
for (const p of ['compose.mjs', 'verify.mjs', 'save.mjs']) selected.set('recipes/review-group-order/' + p, root + '/' + p);
for (const p of ['release-queue.mjs', 'build-4096.mjs', 'build-child-4096.mjs']) selected.set('recipes/release-partition8/' + p, parentRoot + '/' + p);
for (const [relative, file] of selected) { const target = cp + '/selected-source/' + relative; fs.mkdirSync(path.dirname(target), { recursive: true });
  if (file.startsWith(prior + '/selected-source/')) fs.linkSync(file, target); else fs.copyFileSync(file, target, fs.constants.COPYFILE_EXCL);
  assert.equal(hash(target), hash(file)); }
const files = [...selected].map(([relative, file]) => ({ path: relative, sha256: hash(file), bytes: fs.statSync(file).size }));
let sourceBackup;
try {
  backup({ root: cp + '/source-only-backup', repo: root + '/source-only-backup.git', branch: 'backup/review-group-order-20261031', files,
    bytesFor: p => read(selected.get(p)), sourceIdentity: { source: ref(cp + '/SOURCE.json') },
    scope: 'Selected authored source and reproducible recipes only. No scans, masks, model assets, private observations or decisions, release logs, clone objects or canonical Git ancestry. Immutable prior selected-source files share storage; independent GitHub fetch/tree/byte verification follows.',
    proof: { at, focusedPasses: 19, wholeSuitePassing: false, installed: false }, verifySource: verify });
  sourceBackup = { ...ref(cp + '/source-only-backup/github-backup.json'), verified: true };
} catch (error) { write(cp + '/SOURCE_BACKUP_FAILURE.json', { at, error: String(error), verified: false }); sourceBackup = { ...ref(cp + '/SOURCE_BACKUP_FAILURE.json'), verified: false }; }
const next = 'Keep installed quick review available. Staged d719b7a0 orders group options by displayed name;19focused checks pass with exact IDs, issue priority and selection preserved. The unchanged whole cervical root passes3/3 on aba4. Parent1bd stock queue is indexed separately; poll session41260 while live, never start a second heavy job. Full current-source build/suite, partition7 historical spinal replay and remaining desktop/release work stay open. Build requires6144MiB free and was not admitted at5523MiB. No clinical approval or new installation; preserve71requirements/eightideas.';
write(cp + '/checkpoint.json', { schema: 'vm-review-group-order-checkpoint/1', at, source: ref(cp + '/SOURCE.json'), focused: ref(cp + '/VERIFIED.json'),
  cervical: ref(cp + '/cervical/RESULT.json'), parentQueue: ref(cp + '/QUEUE_SNAPSHOT.json'), sourceBackup, prior: ref(prior + '/checkpoint.json'), next, installed: false, wholeSuitePassing: false, clinicalApproval: false });
const cpRef = ref(cp + '/checkpoint.json');
const cf = canonical + '/docs/completion-checklist.json', mf = canonical + '/docs/completion-checklist.md', checklist = json(cf), old = structuredClone(checklist);
assert.equal(checklist.revision, 424); assert.equal(read(mf).toString(), renderChecklist(old)); write(cp + '/CHECKLIST_BEFORE.json', read(cf));
checklist.revision = 425; checklist.updatedAt = at.slice(0, 10); checklist.roots.reviewgrouporder = cp;
for (const id of ['REL-01', 'UX-01']) checklist.items.find(item => item.id === id).evidence.push('reviewgrouporder:checkpoint.json');
checklist.changeLog.unshift({ revision: 425, date: checklist.updatedAt, change: 'Quick-review group picker now sorts displayed names while preserving exact scope, issue priority, qualifiers and stale selections.19focused contract/component checks pass in stagedd719b7a0. Unchanged whole cervical diagnostic passes3/3 at larger admitted test memory. Parent1bd stock queue continues separately; full latest-source suite and full build remain pending. Build refused before launch at5523MiB free versus6144required. Installed quick review and all clinical decisions unchanged; original71requirements/eightideas preserved.' });
validateChecklist(checklist);
assert.deepEqual(checklist.items.map(({ id, status, acceptance }) => ({ id, status, acceptance })), old.items.map(({ id, status, acceptance }) => ({ id, status, acceptance })));
fs.writeFileSync(cf, JSON.stringify(checklist, null, 2) + '\n'); fs.writeFileSync(mf, renderChecklist(checklist));
const index = json('CURRENT_CHECKPOINT.json'), current = index.activeWork.current;
current.latestCheckpoint = cpRef; if (sourceBackup.verified) current.latestSourceOnlyBackup = sourceBackup;
current.currentStagedCandidate = { stage: root, source: ref(cp + '/SOURCE.json'), review: source.review, buildPassed: false, installed: false };
current.pendingReviewGroupOrder = { checkpoint: cpRef, focusedPasses: 19, installed: false };
current.pendingPartition8Repair.cervical = { terminal: true, passing: true, counts: cervical.counts, evidence: ref(cp + '/cervical/RESULT.json'), executedSource: cervical.source };
current.currentReleaseQueue = { ...queueEvidence, handle, candidateDeltaRequiresReconciliation: true };
current.activeExecutionSessions = handle ? [handle] : [];
current.next = next; current.beforeFurtherWork = next; index.next = next;
current.lastUpdated = at; index.activeWork.updated = at; index.activeWork.lastUpdated = at; index.goal.previousTurn = 'progress';
index.historyArchive = { ...ref(cp + '/INDEX_BEFORE.json'), allHistoryRetained: true, format: 'Full prior index at original JSON paths with archive chain. Missing fields imply no approval or completion.' };
for (const key of ['pendingSavedStudyPlan', 'completeReleaseFollowups', 'latestEducationResponseContract', 'latestLowerLimbNerveSourceStudy']) {
  if (Buffer.byteLength(JSON.stringify(index) + '\n') <= fs.statSync('CURRENT_CHECKPOINT.json').size - 768) break;
  delete current[key];
}
saveIndex(index);
const intro = '## Current: review navigation refined; cervical checks passed — 31 October 2026\n\nStagedd719b7a0 sorts review groups by displayed name;19focused checks pass. Whole cervical diagnostic passes3/3. Parent1bd release queue continues separately; full latest-source build/suite remain open. Installed quick review unchanged.\n\nCheckpoint:' + cp + '/checkpoint.json (' + cpRef.sha256 + ').\n\n';
write(cp + '/WORKSPACE_MAP_BEFORE.md', read('WORKSPACE_MAP.md'));
const text = Buffer.from(intro + 'Website F:/VisibleMedicine/website; Atlas F:/VisibleMedicine/atlas. Candidate ' + root + '. Checklist425; use CURRENT_CHECKPOINT handles.\n'), size = fs.statSync('WORKSPACE_MAP.md').size;
assert(text.length <= size); const fd = fs.openSync('WORKSPACE_MAP.md', 'r+'); try { fs.writeSync(fd, Buffer.concat([text, Buffer.alloc(size - text.length, 32)])); fs.fsyncSync(fd); } finally { fs.closeSync(fd); }
const master = canonical + '/docs/master-plan.md'; write(cp + '/MASTER_PREFIX_ROLLBACK.json', { path: master, previous: ref(master), prefix: intro, method: 'Remove exact prefix and verify prior bytes.' }); fs.writeFileSync(master, intro + read(master).toString());
write(cp + '/SAVED.json', { checkpoint: cpRef, sourceBackup, checklist: 425, index: ref('CURRENT_CHECKPOINT.json'), selectedFiles: files.length, goalActive: true, ownerPreviewChanged: false });
console.log(JSON.stringify({ checkpoint: cpRef, sourceBackup, checklist: 425, selectedFiles: files.length, queueSession: handle?.sessionId }));
