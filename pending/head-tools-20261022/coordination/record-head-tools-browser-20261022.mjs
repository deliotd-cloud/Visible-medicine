import assert from 'node:assert/strict';
import fs from 'node:fs';
import {json,read,sha} from './source-only-backup-20261019.mjs';
const root='F:/VisibleMedicine/staging/20261022-head-tools-bound-successor',inputPath=root+'/browser-specimen-tsx/INPUTS.json',inputs=json(inputPath);
assert.equal(inputs.sourceReceiptSha256,'b1c8248969db0df0ab77da5458c08b744bceac1a5105af435a9c6eafc6a5f142');
for(const row of inputs.inputs)assert.equal(sha(read(row.path)),row.sha256,row.path);
const result={at:new Date().toISOString(),inputPath,inputSha256:sha(read(inputPath)),browser:'Codex In-app Browser',ownedTab:'136',
 scope:'Actual extracted toolbar and pane-button JSX, real CSS/helper/React, synthetic controls only; not the native scan or signed-in workflow',
 viewport:{width:1280,height:720},toolbarWidth:735,beforeToolbarHeight:111.78125,compactToolbarHeight:78.484375,reclaimedToolbarPixels:33.296875,
 initialDisplaySettingsClosed:true,allFiveLayoutsRetained:true,horizontalOverflow:false,localizerAndConditionalCentrelineWithinExistingDisclosure:true,
 secondaryControls:{checkboxUpdatesObserved:true,panelRect:{left:467.5,right:637.5,top:254.90625,bottom:510.15625},withinViewer:true},
 escape:{closesSettings:true,focusesOwnSummary:true},coronalExpansion:{changesLayout:true,updatesAccessibleNameToRestoreCoronal:true},
 mriQuizToolbar:{levelAndWidthLabelledNotHU:true,localizerAvailable:true,centrelineHidden:true,ctPresetsAbsent:true,clearAndOverlayAbsent:true,multiplanarAnd3dDisabled:true},
 consoleWarningsAndErrors:[],ownedTabClosed:true,ownedServerStopped:true,ownerPreviewPort:3000,ownerPreviewListenerObserved:297128,ownerPreviewChanged:false,
 firstSpecimenCompilerFailure:'Extracted TypeScript JSX used .jsx names and rejected as const. Kept first sources; corrected generated wrappers to .tsx without changing product inputs.',
 nativeScanWorkflowTested:false,signedInWorkflowTested:false,screenReaderCertification:false,wholeSuitePassing:false,clinicalApproval:false,spatialRegistration:false,publicDeployment:false};
const target=root+'/browser-specimen-tsx/BROWSER_RESULT.json';assert(!fs.existsSync(target));fs.writeFileSync(target,JSON.stringify(result,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({browser:target,sha256:sha(read(target)),reclaimedToolbarPixels:result.reclaimedToolbarPixels,ownerPreviewChanged:false}));
