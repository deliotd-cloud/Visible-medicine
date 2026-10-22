import assert from 'node:assert/strict';
import fs from 'node:fs';
import {json,read,sha} from './source-only-backup-20261019.mjs';
const root='F:/VisibleMedicine/staging/20261022-head-tools-bound-successor',phase=process.argv[2];assert(['pre-bind','built'].includes(phase));
const sourceReceipt=root+(phase==='pre-bind'?'/PRE_BIND_SOURCE.json':'/BUILT_SOURCE.json'),source=json(sourceReceipt);
const focused=['head-pane-expansion-labels.test.mjs','head-toolbar-compact.test.mjs'];
const existing=['current-atlas-delivery.test.mjs','head-window-drag.test.ts','head-viewer-disclosure-keyboard.test.mjs','head-slice-keyboard.test.ts','head-slice-zoom.test.ts',
 'head-mask-picking-ui.test.ts','head-open-state.test.ts','head-image-history.test.ts','head-view-history-client.test.mjs','head-filtered-layout.test.mjs','head-index-tab-stop.test.mjs',
 'native-head-toolbar-compact.test.mjs','head-guided-desktop-layout.test.mjs','head-disclosure-current-delivery.test.mjs','head-disclosure-role-preservation-20261021.test.mjs',
 'head-disclosure-harness-preservation.test.mjs','head-slice-viewport.test.ts','head-slice-playback.test.ts','head-slice-playback-reentrancy.test.ts','head-view-history-controller.test.mjs'];
const tests=[...focused,...(phase==='built'?existing:[])].map(name=>'tests/'+name);
for(const test of tests)assert(source.sourceRows.some(row=>row.path===test));
const plan={sourceReceipt,sourceReceiptSha256:sha(read(sourceReceipt)),evidence:root+'/native-'+phase,tests,
 scope:phase==='pre-bind'?'Actual new pane-label and compact-toolbar JSX/inverse tests before the expensive real Review rebuild; not bound delivery acceptance.':'Actual combined current delivery and affected native toolbar/display, pane expansion, keyboard, slice navigation, quiz/picking, disclosure, history and retained full-source contracts. No whole-suite, clinical, spatial, signed-in or browser claim.'};
const target=root+'/NATIVE_'+phase.toUpperCase().replace('-','_')+'_PLAN.json';assert(!fs.existsSync(target));fs.writeFileSync(target,JSON.stringify(plan,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({plan:target,entryFiles:tests.length,sourceReceiptSha256:plan.sourceReceiptSha256}));
