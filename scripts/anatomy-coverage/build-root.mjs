import assert from 'node:assert/strict';
const systems=['skeleton','muscles','organs','nerves','vessels','connective'];
const sorted=values=>[...values].sort((a,b)=>a<b?-1:a>b?1:0);
const nonempty=value=>typeof value==='string'&&value.trim().length>0;

/** Engineering inclusion and disclosed gaps, never an anatomical sign-off. */
export function buildLedger({catalog,sourceRevision,evidence,declaredTargets=[]}){
  assert(/^[a-f0-9]{40}$/.test(sourceRevision),'Exact source commit required');
  assert(Array.isArray(catalog?.structures)&&catalog.structures.length>0,'Missing displayed catalogue');
  assert(Array.isArray(catalog.regions)&&catalog.regions.length>0,'Missing regional definitions');
  const regionIds=catalog.regions.map(region=>region.id);
  assert.equal(new Set(regionIds).size,regionIds.length,'Duplicate region');
  assert(!regionIds.includes('whole-body'),'Whole body is derived, not another additive region');
  assert(Array.isArray(catalog.bundles)&&catalog.bundles.length>0,'Missing source model bindings');
  const bundleIds=new Set();
  for(const bundle of catalog.bundles){
    assert(nonempty(bundle.id)&&!bundleIds.has(bundle.id),'Missing or duplicate source bundle');bundleIds.add(bundle.id);
    assert(/^[a-f0-9]{64}$/.test(bundle.sha256)&&Number.isSafeInteger(bundle.bytes)&&bundle.bytes>0,'Unpinned source bundle');
  }
  const ids=new Set();
  const representations=catalog.structures.map(structure=>{
    assert(nonempty(structure.id)&&!ids.has(structure.id),'Missing or duplicate root representation ID');ids.add(structure.id);
    assert(systems.includes(structure.system),'Unknown system');
    assert(regionIds.includes(structure.region),'Unknown primary region');
    assert(Array.isArray(structure.regions)&&structure.regions.includes(structure.region),'Primary region absent from memberships');
    assert.equal(new Set(structure.regions).size,structure.regions.length,'Duplicate region membership');
    assert(structure.regions.every(region=>regionIds.includes(region)),'Unknown regional membership');
    assert(nonempty(structure.name)&&nonempty(structure.fmaId)&&nonempty(structure.bundle),'Incomplete representation identity');
    assert(bundleIds.has(structure.bundle),'Unknown source bundle');
    assert(['isa','partof'].includes(structure.sourceTree),'Unknown source tree');
    assert(Array.isArray(structure.sources)&&structure.sources.length>0&&structure.sources.every(source=>nonempty(source.file)&&/^[a-f0-9]{64}$/.test(source.sha256)),'Missing exact source-file provenance');
    return {id:structure.id,fmaId:structure.fmaId,name:structure.name,system:structure.system,category:structure.category,
      primaryRegion:structure.region,regions:sorted(structure.regions),laterality:structure.laterality,bundle:structure.bundle,
      sourceTree:structure.sourceTree,sources:structuredClone(structure.sources),
      engineeringState:'admitted',clinicalApprovalAsserted:false,
      sourceExtent:structure.coverageNote?'see-source-limit':'not-clinically-assessed',sourceLimit:structure.coverageNote??null};
  }).sort((a,b)=>a.id<b.id?-1:a.id>b.id?1:0);
  const targetIds=new Set();
  for(const target of declaredTargets){
    assert(nonempty(target.id)&&!targetIds.has(target.id),'Missing or duplicate target');targetIds.add(target.id);
    assert(['missing','partial','held','not-yet-inventoried'].includes(target.state),'Invalid target state');
    assert(Array.isArray(target.regions)&&target.regions.every(region=>regionIds.includes(region)),'Unknown target region');
    assert(nonempty(target.reason)&&nonempty(target.evidence.path)&&/^[a-f0-9]{64}$/.test(target.evidence.sha256),'Target evidence missing');
    if(target.assertNoSystemGeometry){
      assert(systems.includes(target.system),'Unknown gap system');
      assert(!representations.some(row=>row.system===target.system&&row.regions.some(region=>target.regions.includes(region))),'Documented gap conflicts with current admitted geometry');
    }
  }
  const byRegion=[{id:'whole-body',name:'Whole body'},...catalog.regions].map(region=>{
    const rows=region.id==='whole-body'?representations:representations.filter(row=>row.regions.includes(region.id));
    return {id:region.id,name:region.name,representationCount:rows.length,systemCoverage:systems.map(system=>{
      const matches=rows.filter(row=>row.system===system);
      const gaps=declaredTargets.filter(target=>target.system===system&&(region.id==='whole-body'||target.regions.includes(region.id)));
      return {system,representations:matches.length,engineeringState:matches.length?'admitted':gaps.some(gap=>gap.state==='missing')?'missing':'not-yet-inventoried',
        completeness:gaps.some(gap=>gap.state==='partial')?'documented-partial':'not-clinically-assessed',targetIds:gaps.map(gap=>gap.id)};
    })};
  });
  const heldRootExclusions=structuredClone(catalog.excluded??[]);
  for(const row of heldRootExclusions)assert(!representations.some(item=>item.fmaId===row.fmaId),'A held root exclusion is also admitted');
  return {schema:'vm-root-anatomy-coverage-ledger-1',sourceRevision,scope:'displayed-root-body-only',
    evidence,clinicalApproval:false,anatomicalCompletenessProven:false,expectedCurriculumInventoried:false,
    counts:{rootRepresentations:representations.length,declaredModelBindings:catalog.bundles.length,regionalMemberships:representations.reduce((n,row)=>n+row.regions.length,0),heldRootExclusions:heldRootExclusions.length,declaredTargetGroups:declaredTargets.length},
    byRegion,representations,declaredModelBindings:structuredClone(catalog.bundles),heldRootExclusions,declaredTargets:structuredClone(declaredTargets),
    limits:[
      'Admitted means included by the source-bound display resolver, not clinically approved or complete anatomy.',
      'Root representation IDs, regional memberships, target groups and held source definitions are different overlapping units. Never sum them as unique anatomy or calculate a completion percentage.',
      'A zero system count is not proof that a structure is missing; only an explicitly evidenced target may be labelled missing.',
      'Source-limited notes do not prove tissue extent, branch completeness, connected lumens or patient registration.',
      'Separate shoulder, nested dissections and independent specimen frames are not added to root counts. Their detailed coverage and further source holds remain separate inventories.',
      'Editorial teaching readiness, CT/MRI bindings, paid access and actual private clinical decisions are not measured by this ledger.',
      'Model binding hashes are copied from exact committed resolver metadata. This ledger does not read or independently validate model payload bytes or segmentation quality.',
    ]};
}
