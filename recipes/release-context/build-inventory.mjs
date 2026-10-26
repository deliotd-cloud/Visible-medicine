import {readFileSync,readdirSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {join} from 'node:path';
const out='F:/VisibleMedicine/staging/20261026-current-release-context-map-proposal';
const root='F:/VisibleMedicine/staging/20261026-title-tour-website/website';
const sourceReceipt='F:/VisibleMedicine/staging/20261026-title-tour-website/SOURCE_CANDIDATE_V3.json';
const oldFailures='F:/VisibleMedicine/staging/20261025-coherent-stock-runtime-diagnostic/evidence/failure-inventory.jsonl';
const verification='F:/VisibleMedicine/staging/20261026-source-epoch-reliability/VERIFICATION_SUMMARY.json';
const sha=p=>createHash('sha256').update(readFileSync(p)).digest('hex');
const oldRows=readFileSync(oldFailures,'utf8').trim().split(/\r?\n/).map(JSON.parse);
const failureMap=new Map(); let unmapped=0;
for(const f of oldRows){const loc=f.diagnostic.join(' ').match(/tests\\+([^\\:]+\.test\.(?:ts|mjs))/);if(!loc){unmapped++;continue}const name=loc[1];const x=failureMap.get(name)||{count:0,samples:[]};x.count++;if(x.samples.length<2)x.samples.push({marker:f.marker,line:f.line,diagnostic:f.diagnostic.find(s=>s.includes('error:')||s.includes('code:'))||null});failureMap.set(name,x)}
const verified=JSON.parse(readFileSync(verification,'utf8'));
const epoch=new Map(verified.nineWholeRoots.map(x=>[x.root.replace('tests/',''),{site:x.site,receipt:x.receipt}]));
const focused={
'ui':['anatomy-coverage-review-ui.test.ts','clinical-review-ui-simplification.test.ts','head-mri-independent-review-ui.test.ts','regional-mri-inline-inspection-ui.test.ts','regional-mri-learning-ui.test.ts','structure-learning-ui.test.ts','ui-teaching-current-delivery.test.mjs','current-ui-delivery-transition.test.mjs'],
'native-mri':['head-mri-anatomy-checks.test.ts','head-mri-independent-review-ui.test.ts','head-mri-only-clinical.test.ts','head-mri-review-api.test.ts','regional-mri-inline-inspection.test.ts','regional-mri-package.test.ts','regional-mri-review-viewer.test.ts','native-disclosure.test.mjs','native-focus-review-binding.test.mjs','native-slice-display-epoch.test.mjs'],
'links':['fda-reference-review-links.test.mjs','head-link-availability.test.ts','head-link-menu-bound-delivery.test.mjs','regional-mri-learning-review-link.test.ts','clinical-review-inbox-link-context.test.mjs'],
'access':['head-model-access-integration.test.mjs','atlas-delivery-access-sql.test.mjs','atlas-shoulder-access.test.ts','atlas-specimen-access.test.ts','studio-membership-context.test.mjs','studio-platform-access-errors.test.mjs'],
'studio':['studio-lineage-integration.test.mjs','studio-release-workflow-ui.test.ts','studio-review-queue.test.ts','studio-course-editor.test.ts','studio-action-guards.test.ts','studio-workspace.test.ts','studio-release-atomic.test.mjs']};
const domains=new Map();for(const [domain,names] of Object.entries(focused))for(const name of names){const x=domains.get(name)||[];x.push(domain);domains.set(name,x)}
const all=readdirSync(join(root,'tests')).filter(x=>/\.test\.(ts|mjs)$/.test(x)).sort();
const wrapper='atlas-glottic-muscle-imaging.test.ts', target='atlas-glottic-muscle-imaging.test.mjs';
const wrapperHash='a3d30dd530ad31ccc4e55b60c16cd68bddf421ad77a661340d1bbc414e880e0b';
const mirror=all.includes(wrapper)&&all.includes(target)&&sha(join(root,'tests',wrapper))===wrapperHash;
const discovered=all;
const rows=discovered.map(name=>{const path=`tests/${name}`,full=join(root,path),bytes=readFileSync(full),body=bytes.toString('utf8');const old=failureMap.get(name)||{count:0,samples:[]};const v=epoch.get(name),ds=domains.get(name);let applicability='unclassified',context='requires source review',missingProof='Determine current functional versus historical role before attributing a result.';if(v){applicability='authenticated-epoch-role';context=v.site==='role727'?'separate authenticated role727 context':'verified 2026-10-26 historical/current-context receipt; not a01';missingProof='Fresh a01 whole-suite execution plus role/context compatibility; prior receipt does not transfer.'}else if(ds){applicability='current-functional-candidate';context='a01 candidate source under stock discovery';missingProof='Fresh a01 whole-suite result and relevant UI/native/access/Studio runtime receipt; static source alone is insufficient.'}return {root:path,executionDisposition:mirror&&name===target?'covered-by-wrapper-import':'executed-root',sha256:sha(full),bytes:bytes.length,applicability,context,focus:ds||[],testImport:body.includes("from 'node:test'")||body.includes('from "node:test"'),currentDeliveryBinding:body.includes('current-atlas-delivery'),oldDiagnostic:{failedCases:old.count,samples:old.samples},priorEpochReceipt:v?.receipt||null,missingProof}});
const absent=[...failureMap].filter(([name])=>!all.includes(name)).map(([name,x])=>({root:`tests/${name}`,failedCases:x.count}));
const counts=rows.reduce((o,x)=>(o[x.applicability]=(o[x.applicability]||0)+1,o),{});
const output={schema:'vm-current-release-context-map-proposal/1',generatedAt:new Date().toISOString(),sourceOnly:true,runPerformed:false,primarySource:{path:sourceReceipt,sha256:sha(sourceReceipt),atlasHead:'a01ea4a00740dee0905204a33893761b8ae1ff1e'},stockDiscovery:{runner:'scripts/run-website-tests.mjs',patterns:['tests/*.test.ts','tests/*.test.mjs'],physicalRoots:all.length,mirrorWrapper:mirror?{wrapper:`tests/${wrapper}`,target:`tests/${target}`,sha256:wrapperHash}:null,executedRootsIfMirrorActive:rows.length-(mirror?1:0),coveredByImport:mirror?['tests/'+target]:[]},savedFailureInventory:{path:oldFailures,sha256:sha(oldFailures),at:'2026-10-25',failedCases:oldRows.length,mappedCases:oldRows.length-unmapped,mappedRoots:failureMap.size,unmappedCases:unmapped,absentRoots:absent,limitation:'Earlier snapshot, incomplete and drifted; failure counts are diagnostic leads only.'},epochVerification:{path:verification,sha256:sha(verification),scope:verified.scope},counts,rows};
writeFileSync(join(out,'INVENTORY.json'),JSON.stringify(output,null,2)+'\n');
console.log(JSON.stringify({physical:all.length,inventoryRows:rows.length,counts,oldFailedCases:oldRows.length,mapped:oldRows.length-unmapped,oldFailedRoots:failureMap.size,absent},null,2));





