import assert from 'node:assert/strict';

const sha = /^[a-f0-9]{64}$/;
const nonempty = v => typeof v === 'string' && v.trim().length > 0;
const sorted = xs => [...xs].sort((a,b) => a < b ? -1 : a > b ? 1 : 0);

/** Summarise actual navigation selections. No anatomical or clinical inference. */
export function buildNestedLedger({catalog, targets, registries, teachingConceptIds, declaredTeachingConceptIds, sourceRevision, sourceInputs}) {
  assert(/^[a-f0-9]{40}$/.test(sourceRevision), 'Exact source revision required');
  assert(Array.isArray(catalog?.structures) && Array.isArray(catalog?.bundles), 'Root display catalog required');
  assert(Array.isArray(targets), 'Actual nestedStudyTargets required');
  assert(Array.isArray(teachingConceptIds) && teachingConceptIds.length===targets.length, 'Teaching resolution required for every selection');
  assert(Array.isArray(declaredTeachingConceptIds) && new Set(declaredTeachingConceptIds).size===declaredTeachingConceptIds.length,'Duplicate declared teaching concept');
  assert(registries && typeof registries==='object', 'Study registries required');
  assert(sourceInputs && Object.keys(sourceInputs).length > 0, 'Hashed source inputs required');
  for (const [path,hash] of Object.entries(sourceInputs)) {
    assert(nonempty(path) && !path.includes('..') && sha.test(hash), 'Invalid source input');
  }
  const parentById = new Map(catalog.structures.map(s => [s.id,s]));
  assert.equal(parentById.size,catalog.structures.length,'Duplicate root parent');
  const rootBundleById = new Map(catalog.bundles.map(b => [b.id,b]));
  assert.equal(rootBundleById.size,catalog.bundles.length,'Duplicate root bundle ID');
  for(const [study,registry] of Object.entries(registries)){
    assert(Array.isArray(registry?.structures)&&Array.isArray(registry?.bundles),'Incomplete study registry: '+study);
    assert.equal(new Set(registry.structures.map(s=>s.id)).size,registry.structures.length,'Duplicate registry child ID: '+study);
    assert.equal(new Set(registry.bundles.map(b=>b.id)).size,registry.bundles.length,'Duplicate registry bundle ID: '+study);
    assert.deepEqual(registry.coordinateSystem,catalog.coordinateSystem,'Foreign nested source frame: '+study);
  }
  const seen = new Set();
  const rows = targets.map((t,index) => {
    const s=t.structure, parent=parentById.get(t.parentId);
    assert(parent && parent.id === t.parentId, 'Unknown parent');
    assert(nonempty(t.study) && nonempty(t.structureId) && t.structureId === s?.id, 'Invalid nested selection');
    assert(nonempty(s.fmaId) && nonempty(s.name) && nonempty(s.bundle), 'Missing child identity');
    if(s.parentId !== undefined) assert(s.parentId === parent.id, `Child parent mismatch: ${t.study}/${s.id}`);
    assert(sha.test(t.parentHash) && rootBundleById.get(parent.bundle)?.sha256 === t.parentHash, 'Parent bundle hash mismatch');
    assert(sha.test(t.sourceHash), 'Unpinned nested bundle');
    const registry=registries[t.study];
    assert(registry && Array.isArray(registry.structures) && Array.isArray(registry.bundles), 'Unknown study registry');
    const matches=registry.structures.filter(row=>row.id===s.id);
    assert.equal(matches.length,1,`Selection absent or ambiguous in study registry: ${t.study}/${s.id}`);
    assert.deepEqual(s,matches[0],`Selected child differs from exact registry record: ${t.study}/${s.id}`);
    assert(registry.bundles.some(bundle=>bundle.id===s.bundle && bundle.sha256===t.sourceHash),'Nested bundle hash mismatch');
    assert(Array.isArray(s.sources) && s.sources.length > 0 && s.sources.every(x => nonempty(x.file) && sha.test(x.sha256)), 'Missing source file provenance');
    assert(Array.isArray(s.regions) && s.regions.length > 0 && s.regions.every(nonempty), 'Missing child regions');
    const key=[t.parentId,t.study,s.id,t.sourceHash].join('|');
    assert(!seen.has(key),'Duplicate nested selection'); seen.add(key);
    return {
      parentId:parent.id,parentFmaId:parent.fmaId,parentName:parent.name,parentBundle:parent.bundle,parentHash:t.parentHash,
      parentSourceFiles:structuredClone(parent.sources),study:t.study,studyTitle:t.title,
      childId:s.id,childFmaId:s.fmaId,childName:s.name,childSystem:s.system,childCategory:s.category,
      laterality:s.laterality,regions:sorted(s.regions),sourceTree:s.sourceTree,sourceFiles:structuredClone(s.sources),
      nestedBundle:s.bundle,nestedBundleHash:t.sourceHash,sourceFrame:structuredClone(registry.coordinateSystem),
      coverageNote:s.coverageNote ?? null,role:s.role ?? null,engineeringState:'navigation-selection',clinicalApprovalAsserted:false,
      teachingConceptId:teachingConceptIds[index] ?? null,
    };
  }).sort((a,b) => [a.study,a.parentId,a.childId].join('|').localeCompare([b.study,b.parentId,b.childId].join('|')));
  const studies=sorted(new Set(rows.map(r=>r.study))).map(study=>{
    const selected=rows.filter(r=>r.study===study),ids=new Set(selected.map(r=>r.childId)),registry=registries[study];
    return {study,selections:selected.length,distinctChildFmaIds:new Set(selected.map(r=>r.childFmaId)).size,
      sourceBoundTeachingConcepts:new Set(selected.map(r=>r.teachingConceptId).filter(Boolean)).size,
      registryStructures:registry.structures.length,
      unselectedRegistryStructureIds:sorted(registry.structures.map(s=>s.id).filter(id=>!ids.has(id))),
      registryExcludedDefinitions:(registry.excluded??[]).map(x=>({fmaId:x.fmaId??null,name:x.name??null,reason:x.reason??null})),
      registryContextIds:sorted(registry.contextIds??[])};
  });
  const rootIds=new Set(catalog.structures.map(s=>s.id));
  const rootFma=new Set(catalog.structures.map(s=>s.fmaId));
  const childIds=new Set(rows.map(r=>r.childId));
  const childFma=new Set(rows.map(r=>r.childFmaId));
  const resolvedTeaching=new Set(rows.map(r=>r.teachingConceptId).filter(Boolean));
  assert([...resolvedTeaching].every(id=>declaredTeachingConceptIds.includes(id)),'Unregistered teaching concept');
  const overlap={childIdsAlsoRoot:sorted([...childIds].filter(id=>rootIds.has(id))),childFmaIdsAlsoRoot:sorted([...childFma].filter(id=>rootFma.has(id)))};
  return {
    schema:'vm-nested-anatomy-coverage-ledger-1',sourceRevision,scope:'current-nested-navigation-selections',
    evidence:{sourceInputs:Object.fromEntries(Object.entries(sourceInputs).sort(([a],[b])=>a.localeCompare(b)))},
    clinicalApproval:false,anatomicalCompletenessProven:false,expectedCurriculumInventoried:false,
    pendingTopicPlacementsInventoried:false,heldScopeExhaustive:false,
    counts:{nestedSelections:rows.length,distinctChildFmaIds:childFma.size,sourceBoundTeachingConcepts:resolvedTeaching.size,
      declaredTeachingConcepts:declaredTeachingConceptIds.length,teachingUnboundSelections:rows.filter(r=>!r.teachingConceptId).length,
      studies:studies.length,distinctParents:new Set(rows.map(r=>r.parentId)).size,
      rootIdOverlaps:overlap.childIdsAlsoRoot.length,rootFmaOverlaps:overlap.childFmaIdsAlsoRoot.length},
    studies,overlap,declaredTeachingConceptIds:sorted(declaredTeachingConceptIds),selections:rows,
    limits:[
      'Navigation selections are source-bound child displays, not unique anatomy or clinical approval.',
      'Parent, study, child, FMA, bundle, file and source-frame identities are recorded separately. Root and nested scopes overlap and must not be added as unique anatomy.',
      'Context meshes, held definitions, unrelated independent specimen frames and unselected registry records are outside this navigation ledger.',
      'Source-file and bundle hashes are registry metadata; this ledger does not read mesh payloads or verify anatomical completeness, registration or radiologist sign-off.',
      'Teaching concept IDs record source-bound bindings only; readiness, pending topic placements, imaging resources and private clinical decisions are outside this structural ledger.',
    ],
  };
}
