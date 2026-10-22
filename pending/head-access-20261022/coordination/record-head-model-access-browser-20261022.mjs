// Sanitized local UI evidence only; no scan pixels, bytes, identifiers or headers saved.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {json,read,sha,runGit} from './source-only-backup-20261019.mjs';
const root='F:/VisibleMedicine/staging/20261022-head-model-access-candidate',site='F:/VisibleMedicine/website';
assert.equal(json('CURRENT_CHECKPOINT.json').activeWork.current.ownerPreviewPolicy.websiteCutoverPermitted,false);
assert.equal(runGit(['-C',site,'rev-parse','HEAD']).toString().trim(),'b953ff3f5f1891599cb6e91cb91311d9d6006270');
const sources=['components/HeadAtlasViewer.tsx','components/HeadAtlasInlineComparison.tsx','lib/head-live-selection.ts','lib/head-view-history.ts','public/atlas-runtime/head-neck/manifest.json'].map(path=>({path,sha256:sha(read(site+'/'+path))}));
fs.writeFileSync(root+'/BROWSER_BASELINE.json',JSON.stringify({at:new Date().toISOString(),tool:'Chrome DevTools native actions and targeted DOM reads',source:'Installed local website, not the pending candidate',sources,
 preview:'127.0.0.1:3000',previewProcess:297128,context:'vm-mri-semantic-qa-20261022',ownedPage:52,ownedPageClosed:true,existingPage2Preserved:true,ownerTabRefreshedOrNavigated:false,
 checked:[
  {id:'native-mri-pons',result:'Pons loads on native axial145/256 with117annotations at1280x720. Page scrollY0/document height720, no console error at initial check.'},
  {id:'model-access-explained-in-frame',result:'Actual brainstem iframe opens the Pons source dissection but reports that model files require sign-in. Host only shows generic unconfirmed-loading/unavailable copy. No model-matched or access-granted claim. This is the reproduced reason for the new protocol/host proposal.'},
  {id:'concept-to-generic-inline',result:'Native Clear selection changes to generic MRI URL, removes selection and iframe, and displays honest unmapped-comparison guidance. No old target substitute; scrollY0.'},
  {id:'native-back',result:'Native Back restores exact Pons concept and selected anatomy with comparison frame mounted; no matching/rendered-model claim because this isolated anonymous context has no 3D asset sign-in.'},
  {id:'native-forward',result:'Native Forward returns to generic MRI URL, no selected anatomy and no comparison iframe, with honest generic guidance and scrollY0.'}
 ],
 limits:'One anonymous installed-MRI journey, no signed-in role/tenant/paid-access acceptance. New candidate not browser-tested here. No clinical accuracy, whole-suite, performance, assistive-technology or spatial-registration certificate.',
 scanOrMaskWrites:false,scanPixelsOrRawBodiesOrPatientIdentifiersSaved:false,diagnosticPacsEdited:false,authenticationBypassed:false,serverRestarted:false,ownerPreviewChanged:false,publicDeployment:false,clinicalApproval:false,spatialRegistration:false},null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({path:root+'/BROWSER_BASELINE.json',sha256:sha(read(root+'/BROWSER_BASELINE.json')),ownerPreviewChanged:false}));
