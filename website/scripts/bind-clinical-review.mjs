// Bind website renderer adaptations as well as the independently versioned
// Atlas renderer. No saved decisions are changed or migrated by this script.
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
const sha = value => createHash('sha256').update(value).digest('hex');
const manifest = JSON.parse(readFileSync('atlas-review/manifest.json'));
const revisionPaths = ['content/body-renderer-revision.json','content/review-revisions.json'];
const adapterPaths = ['components/GroupedReviewConfirmation.tsx','lib/review-draft-autosave.ts','lib/clinical-review-navigation-guard.ts','scripts/import-clinical-review.mjs','scripts/build-clinical-review-viewer.mjs','scripts/review-license-notices.mjs','scripts/bind-clinical-review.mjs','lib/clinical-review-links.ts','lib/clinical-review-return.ts','lib/clinical-review-fetch.ts','components/review-ui-variants.css','components/ClinicalReviewAreas.tsx','components/clinical-review-areas.css','package-lock.json',
  // Independent unitless references use separate private assets and exact links.
  // Registry, routing, account gate and rendering adaptations all invalidate Review.
  'lib/clinical-review-reference-selection.ts','lib/clinical-review-reference-assets.json','lib/clinical-review-reference-registry.ts','lib/clinical-review-reference-delivery.ts',
  'app/api/atlas-delivery/references/[...asset]/route.ts','lib/clinical-review-server.ts','lib/clinical-review-access.ts','lib/atlas-static-boundary.ts','worker/index.ts',
  ...['reviews','body-review','body-review/decisions','nested-review','specimen-review','review-overview'].map(path=>'app/api/atlas-review/'+path+'/route.ts'),
  'vite.config.ts','scripts/local-atlas-development-plugin.mjs','scripts/website-distribution-inventory.mjs',
  // Public review branding is part of the exact presentation being reviewed.
  "components/AtlasPublicBrandImage.tsx","scripts/atlas-public-brand-image-plugin.mjs","public/brand/approved/visible-medicine-lockup-dark.png","public/brand/approved/visible-medicine-lockup-light.png",
  // Source-bound read-only live learning presentation. It cannot focus scans.
  'components/AtlasRuntimeFrame.tsx','components/AtlasBodyLearning.tsx','components/atlas-runtime-state.ts','components/atlas-body-learning.css','lib/atlas-body-learning-selection.ts',
  'components/atlas-runtime-expansion.ts','components/atlas-runtime-frame.css',
  'components/AtlasIssueDetails.tsx','components/atlas-issue-details.css','lib/atlas-issue-context.ts',
  // Bind every native streamlined worksheet as well as the imported editors.
  // Changes to review controls must invalidate the exact presentation revision.
  'components/HeadCtBoneDecisionForm.tsx','components/HeadCtBoneTeachingDecisionForm.tsx','components/HeadMriReviewNotes.tsx','components/HeadPairedDecisionForm.tsx',
  'components/PlexusReviewWorksheet.tsx','components/RegionalGuideReviewNotes.tsx','components/RegionalReferenceReviewNotes.tsx',
  'lib/anatomy-coverage-view.ts','components/AnatomyCoverageReview.tsx','components/anatomy-coverage-review.css','docs/anatomy-coverage/index.json',
  'lib/head-anatomy-checks.ts','lib/head-atlas-teaching.ts','lib/head-atlas-links.ts','lib/head-cerebellar-clinical.ts','components/HeadCerebellarClinicalReview.tsx',
  'lib/head-ct-facial-comparison-review.ts','lib/head-ct-bone-decision-contract.ts','components/HeadCtFacialComparisonReview.tsx',
  'lib/head-atlas-learning.ts','lib/head-ct-facial-learning.ts','components/HeadCtFacialLearningReview.tsx',
  // Exact guided-packet inspectors and sequence sources rendered by this page.
  'components/HeadMriComparisonReview.tsx','components/HeadInsulaComparisonReview.tsx','components/HeadOrbitalComparisonReview.tsx','components/HeadCtBoneLearningReview.tsx','components/HeadImageOnlyComparisonReview.tsx',
  'lib/head-mri-learning.ts','lib/head-insula-learning.ts','lib/head-orbital-learning.ts','lib/head-ct-bone-learning.ts','lib/head-cerebellar-learning.ts',
  'lib/head-deep-grey-clinical.ts','components/HeadDeepGreyClinicalReview.tsx',
  'lib/head-lobar-clinical.ts','components/HeadLobarClinicalReview.tsx',
  'lib/head-hippocampal-clinical.ts','components/HeadHippocampalClinicalReview.tsx',
  'lib/head-mri-only-clinical.ts','components/HeadMriOnlyClinicalReview.tsx',
  'lib/head-mri-anatomy-checks.ts','components/HeadMriAnatomyChecksReview.tsx',
  'lib/head-mri-only-teaching.ts','lib/head-link-availability.ts','lib/head-atlas-import.ts','lib/head-surface-validation.ts','lib/head-atlas-overlays.ts','lib/head-overlay-loading.ts','lib/head-local-source.ts','lib/head-load-progress.ts','lib/head-asset-checksum.ts',
  'LICENSES/head-atlas-noble-hashes-LICENSE.txt','public/licenses/head-atlas-noble-hashes-LICENSE.txt','scripts/rebind-plexus-review-dependency.mjs',
  'lib/head-teaching-review-contract.ts','lib/head-teaching-review-api.ts','lib/head-teaching-review-store.ts','lib/head-teaching-review-client.ts','lib/head-review-working-copy.ts','components/HeadTeachingReviewNotes.tsx',
  'app/api/atlas-review/head-learning/route.ts','app/api/atlas-review/head-brainstem-clinical/route.ts','app/api/atlas-review/head-ventricular-clinical/route.ts','app/api/atlas-review/head-cerebellar-clinical/route.ts','app/api/atlas-review/head-deep-grey-clinical/route.ts','app/api/atlas-review/head-lobar-clinical/route.ts',
  'app/api/atlas-review/head-hippocampal-clinical/route.ts',
  'app/api/atlas-review/head-mri-only-clinical/route.ts','app/api/atlas-review/head-mri-anatomy-checks/route.ts',
  'components/HeadAnatomyCheck.tsx','components/HeadAnatomyChecksReview.tsx','components/HeadAtlasTeaching.tsx','components/HeadAtlasReferenceTeaching.tsx','components/HeadAtlasTeachingReview.tsx','components/HeadTeachingReviewNavigator.tsx','components/head-atlas.css',
  'lib/head-ct-facial-teaching.ts',
  'lib/head-ct-facial-clinical.ts',
  'components/useVerifiedFacialTeaching.ts',
  'components/HeadAtlasConceptTeaching.tsx',
  'components/HeadAtlasLinkedModel.tsx',
  'components/HeadCtFacialTeachingReview.tsx',
  'lib/head-ct-facial-decision-contract.ts','lib/head-ct-facial-decision-store.ts','lib/head-ct-facial-decision-api.ts','lib/head-ct-facial-decision-client.ts','lib/head-ct-facial-working-copy.ts','lib/head-ct-facial-review-inbox.ts',
  'components/HeadCtFacialDecisionPanel.tsx','components/HeadCtFacialDecisionForm.tsx','app/api/atlas-review/head-ct-facial-decisions/route.ts','lib/clinical-review-extra-inbox.ts',
  'components/HeadAtlasComparisonNavigation.tsx','components/HeadAtlasLearningPicker.tsx','components/HeadAtlasViewer.tsx','components/HeadOtherViews.tsx','components/HeadImageLayoutControl.tsx','lib/head-disclosure-keyboard.ts','lib/head-atlas-display.ts','lib/head-view-history.ts',
  'lib/head-window-drag.ts','lib/head-viewport-memory.ts','lib/head-practice-navigation.ts',
  'components/HeadAtlasSurface.tsx','components/HeadAtlasSurfaceLoader.tsx','components/head-surface.css','lib/head-surface-context.ts','lib/head-surface-camera.ts',
  'components/ImagingAtlasShell.tsx','components/ImagingPaneNavigation.tsx','components/imaging-atlas-shell.css','lib/imaging-pane-focus.ts',
  'components/AtlasWorkspaceNavigation.tsx','components/AtlasRegionNavigation.tsx',
  'components/HeadAtlasGuidedLearning.tsx','components/HeadAtlasInlineComparison.tsx','lib/head-inline-comparison.ts','components/HeadAtlasInlineComparisonLoader.tsx','components/HeadTourPlayback.tsx','lib/head-tour-playback.ts','lib/head-tour-speed-preference.ts',
  // Exact concept/step new-tab actions retain the current native study.
  'components/HeadSeparateComparisonLink.tsx','lib/head-separate-comparison.ts',
  'components/HeadAtlasLearningNavigation.tsx','lib/lecture-tour-context.ts','lib/lecture-related-links.ts',
  'lib/lecture-anatomy-reference.ts','lib/head-atlas-navigation.ts','lib/head-image-only-links.ts','lib/head-image-only-comparison-review.ts',
  'components/head-tour-playback.css','components/HeadAtlasGuidedModel.tsx','lib/head-guided-playback.ts','lib/head-guided-focus.ts','app/atlas/head-neck-3d/head-learning.css',
  'components/HeadAtlasPractice.tsx','components/HeadAtlasPracticeReview.tsx','components/HeadPracticeSummaryDownload.tsx',
  'lib/head-atlas-practice.ts','lib/head-practice-summary.ts','lib/head-practice-learning.ts','lib/head-practice-review-filter.ts','lib/head-study-set.ts','lib/head-atlas-focus.ts','lib/head-atlas-geometry.mjs',
  'lib/head-index-keyboard.ts',
  ...readdirSync('scripts/clinical-review-viewer').map(p=>'scripts/clinical-review-viewer/'+p),
  ...readdirSync('app/workspace/atlas-review',{recursive:true}).filter(p=>/\.(tsx|css)$/.test(p)).map(p=>'app/workspace/atlas-review/'+p.replaceAll('\\','/'))];
// Recovery changes the private review presentation and must share its exact binding.
adapterPaths.push('lib/head-teaching-review-recovery.ts');
// Prostate approvals cover the exact website presentation as well as authored
// native anatomy. The compact output below is derived from this seal, so it
// must not itself be an input (which would create a self-referential hash).
adapterPaths.push('components/ProstateReviewNotes.tsx','components/prostate-review-notes.css',
  'lib/prostate-review-material.ts','lib/prostate-review-link.ts','lib/prostate-review-contract.ts',
  'lib/prostate-review-store.ts','lib/prostate-review-api.ts','lib/prostate-review-inbox.ts',
  'app/api/atlas-review/prostate/route.ts','scripts/verify-prostate-review-presentation.mjs');
const inputs = [...manifest.files.filter(f=>!revisionPaths.includes(f.path)).map(f=>({path:'atlas-review/'+f.path,sha256:sha(readFileSync('atlas-review/'+f.path))})),
  ...adapterPaths.map(path=>({path,sha256:sha(readFileSync(path))}))].sort((a,b)=>a.path.localeCompare(b.path));
const integrationHash = sha(JSON.stringify(inputs));
const bodyPath = 'atlas-review/' + revisionPaths[0], shoulderPath = 'atlas-review/' + revisionPaths[1];
const body = JSON.parse(readFileSync(bodyPath)), shoulder = JSON.parse(readFileSync(shoulderPath));
body.sourceRendererSha256 ??= body.sha256;
body.websiteIntegrationSha256 = integrationHash;
body.sha256 = sha(JSON.stringify({source:body.sourceRendererSha256,website:integrationHash}));
shoulder.sourceRevisions ??= structuredClone(shoulder.revisions);
shoulder.websiteIntegrationSha256 = integrationHash;
for (const [id, tracks] of Object.entries(shoulder.sourceRevisions))
  for (const track of ['geometry','teaching']) shoulder.revisions[id][track] = tracks[track] === null ? null : sha(JSON.stringify({source:tracks[track],website:integrationHash}));
writeFileSync(bodyPath,JSON.stringify(body,null,2)+'\n');
writeFileSync(shoulderPath,JSON.stringify(shoulder,null,2)+'\n');
for (const file of manifest.files) if(revisionPaths.includes(file.path)) file.importedSha256=sha(readFileSync('atlas-review/'+file.path));
manifest.websiteIntegrationSha256 = integrationHash;
writeFileSync('atlas-review/manifest.json',JSON.stringify(manifest,null,2)+'\n');
writeFileSync('atlas-review/integration-inputs.json',JSON.stringify({sourceCommit:manifest.revision,sha256:integrationHash,inputs},null,2)+'\n');
writeFileSync('lib/prostate-review-presentation.json',JSON.stringify({schema:'vm.prostate-review-presentation/1',sourceCommit:manifest.revision,presentationRevision:integrationHash},null,2)+'\n');
console.log(JSON.stringify({integrationHash,bodyRenderer:body.sha256,shoulderStructures:Object.keys(shoulder.revisions).length}));
