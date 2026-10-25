import assert from 'node:assert/strict';
import fs from 'node:fs';
import {hash} from './seal-simple-website-successor.mjs';
let next=fs.readFileSync(new URL('./verify-ultrasound-polish-20261025.mjs',import.meta.url),'utf8');next=next.replaceAll('20261025-ultrasound-polished-website-v2','20261025-learning-delivery-website').replaceAll('c9629da2042cae437055c092f790c73548c2718e30f4d85c51088907cab314dd','dc0c39a602401d0d6911703600f27945697cf9d7f4996b823377a6008ddcf3ed');
// Source is already sealed by the exact seven-change/83-addition integrator.
next=next.replace("assert(['seal','focused','types','build','types-child'].includes(phase))","assert(['focused','types','build','types-child'].includes(phase))");
next=next.replace("'imaging-atlas-shell.test.ts'];","'imaging-atlas-shell.test.ts','head-atlas-teaching.test.ts','head-teaching-current.test.ts','head-teaching-historical-source.test.mjs','clinical-review-abdominal-eus.test.ts','clinical-review-abdominal-eus-current.test.ts','eus-source-commitment.test.mjs','head-atlas-overlays.test.ts'];");
next=next.replace("phase==='focused'?256:1536","phase==='focused'?768:1536").replaceAll('counts.tests===399&&counts.pass===399','counts.tests===430&&counts.pass===430').replaceAll('sourcePaths:6679','sourcePaths:6762');
next=next.replace('VM_ATLAS_SOURCE_REPO:prep.atlas,VM_WEBSITE_ROOT:site',"VM_ATLAS_SOURCE_REPO:prep.atlas,VM_EUS_HISTORICAL_WEBSITE:'F:/VisibleMedicine/staging/20261024-head-active-identity-website/website',VM_EUS_HISTORICAL_ATLAS:'F:/VisibleMedicine/staging/20261024-pancreatic-venous-us-draft/atlas',VM_WEBSITE_ROOT:site");
assert(next.includes('counts.tests===430'));assert(next.includes("'head-atlas-overlays.test.ts'"));fs.writeFileSync(new URL('./verify-learning-delivery-20261025.mjs',import.meta.url),next,{flag:'wx'});console.log(JSON.stringify({verifier:'verify-learning-delivery-20261025.mjs',sha256:hash('verify-learning-delivery-20261025.mjs')}));
