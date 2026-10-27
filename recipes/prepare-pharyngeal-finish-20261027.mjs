// Reuse the established native checkpoint path with bounded, explicit edits.
import fs from'node:fs';import assert from'node:assert/strict';
let text=fs.readFileSync('finish-forehead-nerve-us-20261027.mjs','utf8');
const replacements=[
 ['20261027-forehead-nerve-us-native','20261027-pharyngeal-mri-native'],
 ['20261027-forehead-nerve-us','20261027-pharyngeal-mri'],
 ['forehead-nerve-ultrasound','pharyngeal-mri'],
 ['test-forehead-nerve-review','test-pharyngeal-mri-review'],
 ['FOREHEAD_NERVE_ULTRASOUND.md','PHARYNGEAL_MRI_TEACHING.md'],
 ["(p==='tests'?3:1)",'1'],
 ['checks/tests-3/','checks/tests-1/'],
 ['"proposedDrafts":4','"proposedDrafts":9'],
 ['"staleRefused":12','"staleRefused":27'],
 ['Add source-bound forehead nerve ultrasound teaching drafts','Add source-bound palatal and pharyngeal MRI teaching drafts'],
 ['vm-forehead-nerve-us-native-source/1','vm-pharyngeal-mri-native-source/1'],
 ['Four source-bound research-orientation ultrasound drafts for existing bilateral supraorbital/supratrochlear selections. No new imagery or geometry; clinical acceptance and website import pending.','Nine MRI draft placements across five existing palatal/pharyngeal muscle groups. Technique, unilateral and proximal-only research limits retained. No new imagery/geometry. Clinical acceptance and website import pending.'],
 ['changedPlacements:4,preservedPlacements:9932,identityMutationsRefused:64,currentWorksheetsParsed:4,oldWorksheetsRefused:4,tamperedWorksheetsRefused:12,staleDecisionsRefusedBeforeStorage:12','changedPlacements:9,preservedPlacements:9927,identityMutationsRefused:162,currentWorksheetsParsed:9,oldWorksheetsRefused:9,tamperedWorksheetsRefused:27,staleDecisionsRefusedBeforeStorage:27'],
 ['prepare-forehead-nerve-us-native-20261027.mjs','prepare-pharyngeal-mri-native-20261027.mjs'],
 ['flatten-owned-native-alternates-20261027.mjs','flatten-pharyngeal-native-alternates-20261027.mjs'],
 ['integrate-forehead-nerve-us-20261027.mjs','integrate-pharyngeal-mri-20261027.mjs'],
 ['prepare-forehead-verification-20261027.mjs','prepare-pharyngeal-finish-20261027.mjs'],
 ['run-forehead-native-checks-20261027.mjs','run-pharyngeal-native-checks-20261027.mjs'],
 ['finish-forehead-nerve-us-20261027.mjs','finish-pharyngeal-mri-20261027.mjs'],
 ['github-forehead-nerve-us-source-20261027.git','github-pharyngeal-mri-source-20261027.git'],
 ['backup/forehead-nerve-us-source-20261027','backup/pharyngeal-mri-source-20261027'],
 ["kind:'pharyngeal-mri-original-teaching'","kind:'pharyngeal-mri-original-teaching'"],
 ['changedDraftPlacements:4','changedDraftPlacements:9'],
 ['beforeRevision:262','beforeRevision:282'],
 ["rootKey:'foreheadnerveus'","rootKey:'pharyngealmri'"],
 ["'Four original cited ultrasound drafts cover existing bilateral supraorbital/supratrochlear selections. Selected-site research does not validate full nerves, branches, individual visibility or model-image registration. Actual resolver preserves9932otherplacements and rejects64identity mutations; four current worksheets parse, four old/12tampered worksheets and12stale decisions refuse. Stock metadata/fulltypes/nativebuild pass; four display pins advance. No images/geometry/clinical decisions changed. Website export/import pending; installed preview unchanged.'","'Nine MRI placements across five palatal/pharyngeal muscle groups now have original cited draft teaching. Actual resolver preserves9927otherplacements and rejects162identity mutations. Nine current worksheets parse; nine old/27tampered worksheets and27stale decisions refuse. Stock metadata/fulltypes/nativebuild pass; nine display pins advance. No images/geometry/clinical decisions changed. Website export/import pending; installed preview unchanged.'"],
 ["'Added four source-bound forehead nerve ultrasound research-orientation drafts with exact-source review protection. Clinical acceptance and website integration remain pending.'","'Added nine source-bound palatal/pharyngeal MRI drafts with exact-source review protection; clinical acceptance and website integration remain pending.'"],
 ['pendingForeheadNerveUltrasound','pendingPharyngealMri'],
 ["'Integrate four source-bound ultrasound drafts into website without changing owner preview'","'Integrate nine MRI drafts into website without changing owner preview'"],
 ];
for(const[a,b]of replacements){assert(text.includes(a),'Missing template input '+a);text=text.replaceAll(a,b);}
const historyStart=text.indexOf('priorTestFailures:['),historyEnd=text.indexOf(',evidence:pin',historyStart);assert(historyStart>0&&historyEnd>historyStart);text=text.slice(0,historyStart)+'priorTestFailures:[]'+text.slice(historyEnd);
const nextStart=text.indexOf("  const next='Continue the full71requirements"),nextEnd=text.indexOf('\n  save(dir',nextStart);assert(nextStart>0&&nextEnd>nextStart);
text=text.slice(0,nextStart)+`  const next='Continue full71requirements/eightideas. Native '+source.head+' adds nine source-bound pharyngeal/palatal MRI draft placements. Export and import into a descendant of unpublished website dfcec576 before claiming website availability. Current integrated native remains a28d03ac/Review5f135b65; normal installedb953ff/6d7a preview unchanged. Root pending454 after this increment. Clinical sign-off remains pending; continue independent useful work. Keep WSL running; preserve accepted masks, permissions and desktop PACS. No public deployment.';`+text.slice(nextEnd);
const prefixStart=text.indexOf('  const prefix=`## Current:'),prefixEnd=text.indexOf('\n  for(const p',prefixStart);assert(prefixStart>0&&prefixEnd>prefixStart);
text=text.slice(0,prefixStart)+`  const prefix=\`## Current: Palatal/pharyngeal MRI drafts verified — 27 October 2026\\n\\nNine MRI placements across five muscle groups now have original cited teaching, including research technique, side and extent limitations. No figures, scans or new geometry imported. All9,927otherrootplacements remain unchanged. Current worksheets and stale/tampered refusals pass; stockmetadata, fulltypes and nativebuild pass. Exactly nine display pins advance. Clinical review and website export/import remain pending.\\n\\nChecklist\${ledger.revision}; source-only supplement independently fetched/restored at\${backup.head}. Checkpoint: \${checkpoint.path} (\${checkpoint.sha256}). \${next}\\n\\n\`;`+text.slice(prefixEnd);
fs.writeFileSync('finish-pharyngeal-mri-20261027.mjs',text,{flag:'wx'});
let flatten=fs.readFileSync('flatten-owned-native-alternates-20261027.mjs','utf8').replaceAll('20261027-forehead-nerve-us-native','20261027-pharyngeal-mri-native');fs.writeFileSync('flatten-pharyngeal-native-alternates-20261027.mjs',flatten,{flag:'wx'});
console.log('Prepared native finishing and bounded alternate-store scripts.');
