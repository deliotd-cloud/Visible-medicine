// Sanitized local-only browser evidence: no scan pixels, masks, headers or IDs.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {json,read,sha} from './source-only-backup-20261019.mjs';
const root='F:/VisibleMedicine/staging/20261022-head-access-browser-qa',preview=json(root+'/OWNED_PREVIEW.json'),source=json(preview.sourceReceipt);
assert.equal(json(root+'/SERVER_TERMINAL.json').pid,339232);
for(const r of source.sourceRows)assert.equal(sha(read(source.website+'/'+r.path)),r.sha256,r.path);
const result={at:new Date().toISOString(),sourceReceipt:preview.sourceReceipt,sourceReceiptSha256:preview.sourceReceiptSha256,atlas:preview.atlas,review:preview.review,
 ownedPage:53,ownedContext:'vm-head-access-qa-20261022',ownedServerPort:3022,ownedServerPid:339232,ownedPageClosed:true,ownedServerStopped:true,
 steps:[
 {action:'Open native MRI Pons',observed:{slice:145,slices:256,selection:'Pons',viewport:[1280,720],scrollY:0,documentSize:[1280,720]}},
 {action:'Native Compare beside 3D Atlas',observed:{realContainedCanvas:true,realModelResourceSignIn:true,hostSignInMessage:true,noMatchingClaim:true,scanRemainsOpen:true,nativeFullAtlasLink:{target:'_blank',rel:'noopener noreferrer'}}},
 {action:'Select Midbrain in native MRI index while model access is blocked',observed:{concept:'brainstem-midbrain',hostHeading:'Midbrain',hostSignInMessageRetained:true,fullAtlasFallbackConcept:'brainstem-midbrain',slice:126,slices:256,noHorizontalOverflow:true}},
 {action:'Native Check model access again',observed:{newFrameTarget:'midbrain',signInCauseReturns:true,scanRemainsOpen:true,noAccessBypass:true}},
 {action:'Native Clear selection',observed:{concept:null,inlineFrames:0,scanRemainsOpen:true,scrollY:0}},
 {action:'Browser Back then Forward',observed:{backRestoresMidbrainComparison:true,unreadyAnnotationInitiallyPausesComparison:true,forwardClearsConceptAndFrame:true,neitherClaimsMatched:true}},
 {action:'Browser Back and resize desktop',observed:{viewport:[1536,864],documentSize:[1536,864],scrollY:0,settledSignInCause:true}},
 {action:'Native Continue this anatomy on CT',observed:{ctConcept:'brainstem-midbrain',slice:82,slices:199,scanLoads:true,noHorizontalOverflow:true}},
 {action:'Native CT Compare beside 3D Atlas',observed:{realContainedCanvas:true,hostSignInMessage:true,scanRemainsOpen:true,fullAtlasFallback:true,viewport:[1536,864],documentSize:[1536,864],scrollY:0}}
 ],
 initialReadinessFailure:{observed:'ECONNREFUSED before Vite had bound its port',sameOwnedProcessConfirmedLive:true,sameProcessBecameReady:true,serverRestarted:false},
 consoleLimits:'Expected model401s, three404resource failures and development preload/deprecation warnings were observed; this is not a clean-console certificate.',
 actualSignInDeniedPath:true,authenticatedModelSuccess:false,accessDenied403Path:false,registeredSpatialMatch:false,completeGpuOrGeometryAcceptance:false,
 privateDataUploaded:false,privatePixelEvidenceSaved:false,patientIdentifiersSaved:false,actualReviewRecordsChanged:false,ownerPreviewPid:297128,ownerPreviewChanged:false,canonicalInstalled:false,clinicalApproval:false,publicDeployment:false};
fs.writeFileSync(root+'/NATIVE_QA.json',JSON.stringify(result,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({receipt:root+'/NATIVE_QA.json',sha256:sha(read(root+'/NATIVE_QA.json')),steps:result.steps.length,ownerPreviewChanged:false}));
