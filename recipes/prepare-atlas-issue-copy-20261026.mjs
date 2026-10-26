import fs from 'node:fs';
import {clonePinnedWebsite} from './clone-pinned-website-stage-20261026.mjs';
const stage='F:/VisibleMedicine/staging/20261026-atlas-issue-copy';
const {site}=clonePinnedWebsite({stage,parentFile:'F:/VisibleMedicine/staging/20261026-body-contract-integration/SOURCE_CANDIDATE.json',parentSha256:'9c3dee2e144e7f1778ea28ba0137b22ee083519026278fee247f2e16d05b8bd8'});
fs.writeFileSync(stage+'/SCOPE.json',JSON.stringify({existing:['components/AtlasBodyLearning.tsx','components/HeadAtlasViewer.tsx','scripts/bind-clinical-review.mjs'],new:['components/AtlasIssueDetails.tsx','components/atlas-issue-details.css','lib/atlas-issue-context.ts','tests/atlas-issue-context.test.mjs','tests/atlas-issue-integration.test.mjs','docs/ATLAS_ISSUE_CONTEXT.md'],normalPreviewChanged:false,localOnly:true},null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({site,prepared:true}));
