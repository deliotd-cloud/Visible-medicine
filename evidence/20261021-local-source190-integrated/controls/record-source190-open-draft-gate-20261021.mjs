import assert from 'node:assert/strict';
import fs from 'node:fs';
import {json} from './source-only-backup-20261019.mjs';
const root='F:/VisibleMedicine/recovery/local-cutover/20261021-source190-prepared';
assert(json('F:/VisibleMedicine/staging/20261020-local-review-cutover/PREVIEW.json').ownerAuthorizedSwitch);
const gate={at:'2026-10-21T10:39:51.546Z',recordedAt:new Date().toISOString(),method:'Read-only current in-app-browser DOM through documented CUA; no navigation, edits, saves, approvals or history changes.',
 scope:'Existing IAB local tabs: shoulder80/body66/body75/Studio69; remaining local tabs are atlas/exploration/inbox, not authoring forms. No claim about unobserved applications.',
 shoulder:{zeroUnsavedTrackDrafts:true,dirtyMarkers:0},body66:{activeNoteFields:0,saveControls:0},body75:{activeNoteFields:0,saveControls:0},studio69:{activeNoteFields:0},
 noActiveReviewEdits:true,ownerLocalSwitchPreviouslyAuthorized:true,noNotesOrDecisionsChanged:true,openTabsWillNotBeReloaded:true,stablePreviewHmr:false,rawDomOrMediaExported:false};
assert(Date.now()-Date.parse(gate.at)<600000);fs.writeFileSync(root+'/OPEN_DRAFT_GATE.json',JSON.stringify(gate,null,2)+'\n',{flag:'wx'});console.log('Fresh read-only draft gate recorded.');
