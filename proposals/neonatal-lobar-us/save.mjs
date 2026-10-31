import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { hash, json } from 'file:///C:/Users/delio/Documents/Codex/2026-09-05/referenced-chatgpt-conversation-this-is-an-2/bounded-source-hash-20261026.mjs';
import { backup } from 'file:///C:/Users/delio/Documents/Codex/2026-09-05/referenced-chatgpt-conversation-this-is-an-2/source-only-backup-20261019.mjs';
import { saveIndex } from 'file:///F:/VisibleMedicine/staging/20261028-head-search-comparison-recipes/state.mjs';
import { validateChecklist, renderChecklist } from 'file:///F:/VisibleMedicine/website/scripts/refresh-completion-checklist.mjs';
const proposal = 'G:/VisibleMedicine-temp/proposals/20261031-neonatal-lobar-us';
const root = 'G:/VisibleMedicine-temp/staging/20261031-review-shared-filters-ready';
const queueRoot = 'G:/VisibleMedicine-temp/staging/20261031-release-partition8-ready';
const cp = 'F:/VisibleMedicine/recovery/checkpoints/20261031-neonatal-lobar-draft-verified';
const prior = 'F:/VisibleMedicine/recovery/checkpoints/20261031-review-shared-filters-verified';
const canonical = 'F:/VisibleMedicine/website', atlas = 'F:/VisibleMedicine/atlas';
const ref = p => ({ path: p, sha256: hash(p) });
const read = p => fs.readFileSync(p);
const write = (p, v) => { fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, Buffer.isBuffer(v) ? v : typeof v === 'string' ? v : JSON.stringify(v, null, 2) + '\n', { flag: 'wx' }); };
const source = json(root + '/SOURCE.json');
function verify() {
  assert.equal(hash(root + '/SOURCE.json'), '4a0db69ce9d84d24da84bff5aeed8da5ea65c750d09bc8de6543dadf97961700');
  for (const row of source.sourceRows) assert.equal(hash(source.website + '/' + row.path), row.sha256, row.path);
  assert.equal(json(canonical + '/atlas-review/integration-inputs.json').sha256, '3648a75bdf7543a29047e74193231fad27afd450d9b0ebc7164393ba2a0d3b2f');
  const v = json(proposal + '/VERIFIED.json'); assert(v.passed && !v.canonicalModified && !v.clinicalApproval);
  assert.equal(hash(proposal + '/content/cerebral-lobar-imaging.ts'), v.content.afterSha256);
  for (const [p, sha] of Object.entries(v.sourceHashes)) assert.equal(hash(p), sha, p);
  assert.equal(execFileSync('git', ['status', '--porcelain'], { cwd: atlas, encoding: 'utf8' }).trim(), '');
}
verify(); assert(!fs.existsSync(cp)); const at = new Date().toISOString();
write(cp + '/INDEX_BEFORE.json', read('CURRENT_CHECKPOINT.json'));
for (const file of ['CHANGE.json', 'VERIFIED.json', 'REFERENCE_REVIEW.md', 'README.md']) write(cp + '/' + file, read(proposal + '/' + file));
for (const file of ['inventory.json', 'REPORT.md']) write(cp + '/nested-inventory/' + file, read('G:/VisibleMedicine-temp/proposals/20261031-nested-teaching-gap/' + file));
const queue = json(queueRoot + '/RELEASE_QUEUE.json'); assert(queue.terminal && queue.completed.length === 2 && queue.stopReason);
write(cp + '/QUEUE_TERMINAL.json', queue);
const receipts = {
  8: queueRoot + '/website/.local/website-test-runs/2026-10-31T04-47-39-513Z-55a89480-4a8e-4bd4-8478-aed4783886b3/receipt.json',
  9: queueRoot + '/website/.local/website-test-runs/2026-10-31T05-01-52-804Z-e8351859-e51b-4267-a9f0-1c3fa97babfc/receipt.json',
};
for (const n of [8,9]) {
  const result = json(queueRoot + '/PARTITION_RESULT-' + n + '.json'), receipt = json(receipts[n]);
  assert(result.process.terminalObserved && result.sourceUnchanged && !receipt.testInputDrift && !receipt.publicPreviewAssetDrift);
  assert.deepEqual(receipt.counts, n === 8 ? { tests:227,pass:227,fail:0,cancelled:0,skipped:0,todo:0 } : { tests:445,pass:442,fail:3,cancelled:0,skipped:0,todo:0 });
  write(cp + '/partition-' + n + '/RESULT.json', result); write(cp + '/partition-' + n + '/receipt.json', read(receipts[n]));
}
write(cp + '/RELEASE_FINDINGS.json', { at, source: queue.source, partition8: { pass:227, fail:0, skipped:0 }, partition9: { pass:442, fail:3, skipped:0 }, wholeSuitePassing:false,
  failures: ['clinical-review-hepatic-arterial-xray.test.ts: source epoch comparison', 'clinical-review-navigation-preservation.test.mjs: previous component reconstruction', 'head-epoch-projections.test.mjs: delivery exact successor'],
  diagnosisPending:true, agent:'/root/release_partition9_repair_1031', proposal:'G:/VisibleMedicine-temp/proposals/20261031-release-partition9-repair',
  currentCandidateNotFullyTested:true, queueSession:41260, queueSessionTerminal:true, installedChanged:false });
const selected = new Map();
function collect(dir, prefix = '') { for (const entry of fs.readdirSync(dir, { withFileTypes:true })) { const rel = prefix + entry.name; if (entry.isDirectory()) collect(dir + '/' + entry.name, rel + '/'); else selected.set(rel, dir + '/' + entry.name); } }
collect(prior + '/selected-source');
for (const file of ['content/cerebral-lobar-imaging.ts', 'prepare.mjs', 'verify.mjs', 'save.mjs', 'README.md', 'REFERENCE_REVIEW.md']) selected.set('proposals/neonatal-lobar-us/' + file, proposal + '/' + file);
selected.set('recipes/nested-teaching-inventory/probe.mjs', 'G:/VisibleMedicine-temp/proposals/20261031-nested-teaching-gap/probe.mjs');
for (const [relative, p] of selected) { const dest = cp + '/selected-source/' + relative; fs.mkdirSync(path.dirname(dest), {recursive:true});
  if (p.startsWith(prior + '/selected-source/')) fs.linkSync(p, dest); else fs.copyFileSync(p, dest, fs.constants.COPYFILE_EXCL); assert.equal(hash(dest), hash(p)); }
let sourceBackup;
try {
  backup({ root:cp + '/source-only-backup', repo:proposal + '/source-only-backup.git', branch:'backup/neonatal-lobar-draft-20261031',
    files:[...selected].map(([relative,p]) => ({path:relative,sha256:hash(p),bytes:fs.statSync(p).size})), bytesFor:p=>read(selected.get(p)),
    sourceIdentity:{websiteCandidate:ref(root + '/SOURCE.json'),atlasProposal:ref(proposal + '/CHANGE.json')},
    scope:'Selected source and reproducible recipes only, including an unintegrated neonatal ultrasound teaching draft. No scans, masks, model assets, images, private observations, decisions, release logs or canonical Git ancestry. Independent fetch/tree/byte verification follows.',
    proof:{at,changedDraftPlacements:4,unchangedPlacements:968,clinicalApproval:false,installed:false,wholeSuitePassing:false},verifySource:verify });
  sourceBackup={...ref(cp + '/source-only-backup/github-backup.json'),verified:true};
} catch(error) { write(cp + '/SOURCE_BACKUP_FAILURE.json',{at,error:String(error),verified:false}); sourceBackup={...ref(cp + '/SOURCE_BACKUP_FAILURE.json'),verified:false}; }
const next='Installed quick review stays available. Website candidate4a0db69c is unchanged and uninstalled. New neonatal frontal/parietal ultrasound draft proposal changes4 of972 nested topic placements;968unchanged,12stale identities rejected and4teaching revisions changed. Canonical Atlas remainsc32clean. Integrate through revision/history and generated-review pipeline before installation. Parent1bd partition8 passes227;partition9 stopped442pass3fail. Session41260 is terminal; do not poll it as live. Review bounded worker release_partition9_repair_1031, preserve exact old/current source tests, then verify/integrate a successor. Full latest-source build/suite and partition7remain open.71requirements/eightideas and all clinical/privacy/source gates remain.';
write(cp + '/checkpoint.json',{schema:'vm-neonatal-lobar-draft-checkpoint/1',at,websiteCandidate:ref(root + '/SOURCE.json'),draft:ref(cp + '/VERIFIED.json'),inventory:ref(cp + '/nested-inventory/inventory.json'),
  release:ref(cp + '/RELEASE_FINDINGS.json'),queue:ref(cp + '/QUEUE_TERMINAL.json'),sourceBackup,prior:ref(prior + '/checkpoint.json'),next,installed:false,clinicalApproval:false,wholeSuitePassing:false});
const cpRef=ref(cp + '/checkpoint.json');
const cf=canonical + '/docs/completion-checklist.json',mf=canonical + '/docs/completion-checklist.md', checklist=json(cf), old=structuredClone(checklist);
assert.equal(checklist.revision,426); assert.equal(read(mf).toString(),renderChecklist(old)); write(cp + '/CHECKLIST_BEFORE.json',read(cf));
checklist.revision=427; checklist.updatedAt=at.slice(0,10); checklist.roots.neonatallobardraft=cp;
for (const id of ['TEACH-07','REL-01']) checklist.items.find(item=>item.id===id).evidence.push('neonatallobardraft:checkpoint.json');
checklist.changeLog.unshift({revision:427,date:checklist.updatedAt,change:'Current nested inventory verified108selections/972topics:721draft/251pending. Separate source-backed neonatal frontal/parietal US proposal changes4placements to draft (725/247projected);968unchanged,12stale identity rejections,4teaching revision changes. No assets, approval, canonical change or installation. Parent1bd release partition8passes227;partition9terminal442pass3fail; bounded source-epoch diagnosis underway. Current4a website full build/suite still open. Original71requirements/eightideas preserved.'});
validateChecklist(checklist); assert.deepEqual(checklist.items.map(({id,status,acceptance})=>({id,status,acceptance})),old.items.map(({id,status,acceptance})=>({id,status,acceptance})));
fs.writeFileSync(cf,JSON.stringify(checklist,null,2)+'\n'); fs.writeFileSync(mf,renderChecklist(checklist));
const index=json('CURRENT_CHECKPOINT.json'),current=index.activeWork.current;
current.latestCheckpoint=cpRef; if(sourceBackup.verified)current.latestSourceOnlyBackup=sourceBackup;
current.pendingNeonatalLobarDraft={checkpoint:cpRef,proposal,changedPlacements:4,unchangedPlacements:968,canonicalIntegrated:false,installed:false};
current.latestNestedTeachingInventory={checkpoint:cpRef,selections:108,topics:972,draft:721,pending:251,canonical:true};
current.currentReleaseQueue={queue:queueRoot+'/RELEASE_QUEUE.json',source:queue.source,observedAt:at,terminal:true,completed:queue.completed,handle:null,candidateDeltaRequiresReconciliation:true};
current.activeExecutionSessions=[]; current.pendingPartition9Repair={checkpoint:cpRef,agent:'/root/release_partition9_repair_1031',proposal:'G:/VisibleMedicine-temp/proposals/20261031-release-partition9-repair',complete:false};
current.pendingPartition8Repair.stockRerunPending=false; current.pendingPartition8Repair.stockResult={source:queue.source,pass:227,fail:0,skipped:0,receipt:ref(cp+'/partition-8/receipt.json')};
current.next=next; current.beforeFurtherWork=next; index.next=next; current.lastUpdated=at; index.activeWork.updated=at; index.activeWork.lastUpdated=at; index.goal.previousTurn='progress';
index.historyArchive={...ref(cp+'/INDEX_BEFORE.json'),allHistoryRetained:true,format:'Full prior index at original JSON paths with archive chain. Missing fields imply no approval or completion.'};
// Omitted older details remain recoverable at their original paths in the archive.
for(const key of ['pendingBrandProvenance','latestInstalledHeadDesktop','pendingReviewGroupOrder','latestBuildTrial','pendingReviewReturnFocus']) {
  if(Buffer.byteLength(JSON.stringify(index)+'\n') <= fs.statSync('CURRENT_CHECKPOINT.json').size-512) break;
  delete current[key];
}
saveIndex(index);
const intro='## Current: ultrasound draft checked; release failures isolated — 31 October 2026\n\nInstalled quick review unchanged. Four neonatal frontal/parietal ultrasound draft placements verified separately;968other placements unchanged. Canonical Atlas remains clean. Parent1bd partition8passes227;partition9stopped442pass3fail. Source-version diagnosis underway. Latest website candidate4a0db69c full build/suite remain open.\n\nCheckpoint:'+cp+'/checkpoint.json ('+cpRef.sha256+').\n\n';
write(cp+'/WORKSPACE_MAP_BEFORE.md',read('WORKSPACE_MAP.md'));
const text=Buffer.from(intro+'Website F:/VisibleMedicine/website; Atlas F:/VisibleMedicine/atlas; temporary outputs G:/VisibleMedicine-temp. Checklist427; no active heavy session.\n'),size=fs.statSync('WORKSPACE_MAP.md').size;assert(text.length<=size);
const fd=fs.openSync('WORKSPACE_MAP.md','r+');try{fs.writeSync(fd,Buffer.concat([text,Buffer.alloc(size-text.length,32)]));fs.fsyncSync(fd);}finally{fs.closeSync(fd);}
const master=canonical+'/docs/master-plan.md';write(cp+'/MASTER_PREFIX_ROLLBACK.json',{path:master,previous:ref(master),prefix:intro,method:'Remove exact prefix and verify prior bytes.'});fs.writeFileSync(master,intro+read(master).toString());
write(cp+'/SAVED.json',{checkpoint:cpRef,sourceBackup,checklist:427,index:ref('CURRENT_CHECKPOINT.json'),selectedFiles:selected.size,goalActive:true,ownerPreviewChanged:false});
console.log(JSON.stringify({checkpoint:cpRef,sourceBackup,checklist:427,selectedFiles:selected.size,queueTerminal:true}));
