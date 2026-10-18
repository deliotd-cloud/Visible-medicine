import assert from 'node:assert/strict';
import {buildLedger} from './build-root.mjs';
import {parseProducerArgs,createCoverageSource,hash,writeCoverageOutput} from './source-context.mjs';

const args=parseProducerArgs(process.argv.slice(2));
const source=createCoverageSource(args);
const coveragePath='docs/FULL_BODY_COVERAGE.md';
try{
  source.hook();
  const raw=source.json('public/models/bodyparts3d/full-body/catalog.json');
  const {bodyDisplayCatalog}=await import(source.rootUrl+'lib/body-display-catalog.ts');
  const catalog=bodyDisplayCatalog(raw);
  const bytes=source.read(coveragePath),text=bytes.toString();
  const docEvidence={path:coveragePath,sha256:hash(bytes)};
  for(const claim of [
    'No limb peripheral nerves or brachial/lumbosacral plexuses are present.',
    'it is not a cord segmentation.',
    'This is not a full nervous system.',
    'No complete joint, fascial, lymphatic, ocular-layer or organ-interior anatomy is supplied.',
  ]) assert(text.includes(claim),'Coverage statement changed: '+claim);
  const upper=['shoulder-arm','forearm','hand'],lower=['pelvis','thigh','leg','foot'];
  const target=(id,state,regions,reason,extras={})=>({id,state,regions,system:'nerves',reason,evidence:docEvidence,...extras});
  const declaredTargets=[
    target('upper-limb-peripheral-nerves','missing',upper,'The saved coverage statement explicitly discloses no limb peripheral nerve geometry, and these current regional memberships have no nervous-system records.',{assertNoSystemGeometry:true}),
    target('lower-limb-peripheral-nerves','missing',lower,'The saved coverage statement explicitly discloses no limb peripheral nerve geometry; motor-innervation teaching does not supply nerve meshes.',{assertNoSystemGeometry:true}),
    target('brachial-plexus','missing',upper,'The saved source coverage explicitly discloses no brachial plexus. This is a target group, not an estimated count of missing branches.',{assertNoSystemGeometry:true}),
    target('lumbosacral-plexus','missing',lower,'The saved source coverage explicitly discloses no lumbosacral plexus. This is a target group, not an estimated count of missing branches.',{assertNoSystemGeometry:true}),
    target('spinal-cord-tissue','held',['spine'],'The source-labelled spinal cord and central canal share a source file. Exposed FMA78497 is described as a space, not a cord segmentation; source/adjudication work remains separate.'),
    target('nervous-system-completeness','partial',['head-neck','spine'],'The source coverage explicitly disclaims a full nervous system. Selected cranial/orbital and central landmarks do not establish full pathways or nerve courses.'),
    {id:'lymphatic-curriculum',state:'not-yet-inventoried',regions:catalog.regions.map(region=>region.id),reason:'The source coverage disclaims complete lymphatic anatomy. The expected curriculum and relevant source identities have not been exhaustively inventoried by this root ledger.',evidence:docEvidence},
  ];
  // This digest is calculated from the resolver loaded above, never a saved audit.
  const displayedStructuresSha256=hash(Buffer.from(JSON.stringify(catalog.structures)));
  const sourceInputs=source.verify();
  const ledger=buildLedger({catalog,sourceRevision:source.revision,evidence:{sourceInputs,displayedStructuresSha256,
    method:'Current pure display resolver loaded directly with confined extension resolution; no model assets, teaching bundle or private decisions read.'},declaredTargets});
  assert.equal(ledger.counts.declaredTargetGroups,7);
  source.verify();
  writeCoverageOutput(args,ledger);
  source.verify();
  console.log(JSON.stringify({sourceRevision:source.revision,...ledger.counts,regionsIncludingWholeBody:ledger.byRegion.length,sourceFiles:Object.keys(sourceInputs).length,clinicalApproval:false,anatomicalCompletenessProven:false}));
}finally{source.close();}
