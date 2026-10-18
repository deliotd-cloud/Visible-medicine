import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const hash=b=>createHash('sha256').update(b).digest('hex');
const scopes=['root','nested','independent','reference'];
const schemas={root:'vm-root-anatomy-coverage-ledger-1',nested:'vm-nested-anatomy-coverage-ledger-1',independent:'vm-independent-source-coverage-ledger-1'};

/** A provenance-bound index of distinct inventory units, never a completion score. */
export function buildCoverageIndex(artifacts){
 assert(Array.isArray(artifacts)&&artifacts.length===scopes.length,'All four scoped inventories are required');
 const byScope=new Map(),inputs=new Map();let revision=null;
 for(const artifact of artifacts){
  assert(scopes.includes(artifact.scope)&&!byScope.has(artifact.scope),'Unknown or repeated inventory scope');
  assert(typeof artifact.path==='string'&&artifact.path.length>0&&/^[a-f0-9]{64}$/.test(artifact.sha256),'Missing artifact identity');
  assert.equal(hash(artifact.bytes),artifact.sha256,'Inventory bytes differ from declared hash');
  const data=JSON.parse(artifact.bytes.toString());
  assert(/^[a-f0-9]{40}$/.test(data.sourceRevision),'Missing exact Atlas commit');
  if(revision)assert.equal(data.sourceRevision,revision,'Mixed Atlas epochs');else revision=data.sourceRevision;
  if(artifact.scope==='reference')assert.equal(data.schemaVersion,1,'Unsupported reference format');
  else assert.equal(data.schema,schemas[artifact.scope],'Unsupported inventory format');
  assert(data.clinicalApproval!==true&&data.clinicalApprovalAsserted!==true&&data.anatomicalCompletenessProven!==true,'Inventory cannot supply clinical or completeness approval');
  const sourceInputs=data.evidence?.sourceInputs;
  assert(sourceInputs&&Object.keys(sourceInputs).length>0,'Missing committed source provenance');
  for(const [path,sha256]of Object.entries(sourceInputs)){
   assert(!path.startsWith('/')&&!path.includes('\\')&&!path.includes(':')&&!path.split('/').some(s=>!s||s==='.'||s==='..')&&/^[a-f0-9]{64}$/.test(sha256),'Unsafe or unpinned source path');
   if(inputs.has(path))assert.equal(inputs.get(path),sha256,'Conflicting source dependency across inventories');else inputs.set(path,sha256);
  }
  byScope.set(artifact.scope,{data,path:artifact.path,sha256:artifact.sha256});
 }
 const root=byScope.get('root').data,nested=byScope.get('nested').data,independent=byScope.get('independent').data,reference=byScope.get('reference').data;
 assert.equal(root.representations.length,root.counts.rootRepresentations,'Root count mismatch');
 assert.equal(root.declaredTargets.length,root.counts.declaredTargetGroups,'Target group count mismatch');
 assert.equal(nested.selections.length,nested.counts.nestedSelections,'Nested count mismatch');
 assert.equal(new Set(nested.selections.map(s=>s.teachingConceptId).filter(Boolean)).size,nested.counts.sourceBoundTeachingConcepts,'Nested concept count mismatch');
 assert.equal(independent.views.length,independent.counts.independentViews,'Independent view count mismatch');
 assert.equal(independent.views.reduce((n,v)=>n+v.surfaces.length,0),independent.counts.independentSelectionMemberships,'Independent membership count mismatch');
 assert.equal(independent.dedicatedShoulder.structures.length,independent.counts.dedicatedShoulderSelections,'Shoulder selection count mismatch');
 assert.equal(independent.dedicatedShoulder.parts.length,independent.counts.dedicatedShoulderSourcePartBindings,'Shoulder part count mismatch');
 assert.equal(reference.counts.rootSelections,root.counts.rootRepresentations,'Reference root scope mismatch');
 assert.equal(reference.counts.reachableNestedSelections,nested.counts.nestedSelections,'Reference nested scope mismatch');
 assert.equal(reference.counts.shoulderBindings,independent.counts.dedicatedShoulderSourcePartBindings,'Reference shoulder scope mismatch');
 assert.equal(reference.backlog.length,reference.counts.currentRootDifferences,'Reference difference count mismatch');
 assert.equal(Object.values(reference.counts.categories).reduce((n,v)=>n+v,0),reference.counts.referenceFiles,'Reference category partition mismatch');
 assert.equal(Object.values(reference.counts.currentDifferenceCategories).reduce((n,v)=>n+v,0),reference.backlog.length,'Backlog category partition mismatch');
 assert.equal(new Set(reference.backlog.map(r=>r.file)).size,reference.backlog.length,'Duplicate reference file');
 const rows=reference.backlog.reduce((counts,row)=>({...counts,[row.category]:(counts[row.category]??0)+1}),{});
 assert.deepEqual(rows,reference.counts.currentDifferenceCategories,'Backlog classifications differ from counts');
 const sourceArtifacts=scopes.map(scope=>({scope,path:byScope.get(scope).path,sha256:byScope.get(scope).sha256}));
 return {schema:'vm-anatomy-coverage-index-1',sourceRevision:revision,sourceArtifacts,
  evidence:{sourceInputs:Object.fromEntries([...inputs].sort(([a],[b])=>a<b?-1:a>b?1:0))},
  scopedCounts:Object.fromEntries(scopes.map(scope=>[scope,structuredClone(byScope.get(scope).data.counts)])),
  documentedRootTargetGroups:structuredClone(root.declaredTargets),
  independentWithheldSourceCatalogs:structuredClone(independent.withheldCatalogs??[]),referenceBacklog:structuredClone(reference.backlog),
  assessment:{expectedCurriculumInventoried:false,clinicalDecisionsRead:false,clinicalApprovalAsserted:false,anatomicalCompletenessProven:false,meshPayloadsRead:false,patientRegistrationAsserted:false},
  remainingScope:['Define the expected curriculum per region/system; these are actual-source inventories, not that expected list.',
   'Adjudicate source-condition and identity holds without automatically adding ambiguous sources.',
   'Review unsupported reference-file coverage against original geometry and licensed evidence; file differences do not count missing anatomy.',
   'Complete source-specific nested pending teaching and independent-source hold inventories.',
   'Review actual renderer, boundaries, teaching and imaging separately in the protected clinical workflow.'],
  countingRules:['Do not add root, nested, shoulder or independent source counts as unique anatomy.',
   'Regional/view memberships overlap. Frame-qualified IDs identify supplied source selections, not distinct anatomical concepts.',
   'Reference-file partitions are neither mesh counts nor a count of missing anatomical structures.',
   'No percentage-complete, accepted-source or clinical-release claim is derived here.']};
}
