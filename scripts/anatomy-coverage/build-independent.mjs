import assert from 'node:assert/strict';
const nonempty=v=>typeof v==='string'&&v.trim().length>0;
const hash=v=>typeof v==='string'&&/^[a-f0-9]{64}$/.test(v);
const matrix=v=>Array.isArray(v)&&v.length===16&&v.every(Number.isFinite);
const sorted=v=>[...v].sort((a,b)=>a<b?-1:a>b?1:0);

/** Scope-qualified source inventory. Never combines donors or supplies approval. */
export function buildIndependentLedger({sourceRevision,sourceInputs,scopes,shoulder,withheldCatalogs=[]}){
 assert(/^[a-f0-9]{40}$/.test(sourceRevision),'Exact committed source required');
 assert(sourceInputs&&Object.keys(sourceInputs).length>0,'Missing provenance');
 for(const [path,sha256]of Object.entries(sourceInputs))assert(nonempty(path)&&!path.startsWith('/')&&!path.split('/').includes('..')&&hash(sha256),'Invalid source provenance');
 assert(Array.isArray(scopes)&&scopes.length>0,'Missing independent definitions');
 const scopeKeys=new Set(),surfaceKeys=new Map(),frameMatrices=new Map(),frameUnits=new Map(),declaredBundles=new Map(),sourceFiles=new Map();
 const views=scopes.map(scope=>{
  assert(nonempty(scope.key)&&!scopeKeys.has(scope.key),'Duplicate or missing view');scopeKeys.add(scope.key);
  assert(nonempty(scope.name)&&nonempty(scope.limitations),'Missing scope disclosure');
  assert(nonempty(scope.frame)&&matrix(scope.displayTransformColumnMajor),'Missing independent frame');
  assert(Number.isFinite(scope.unitsPerMillimetre)&&scope.unitsPerMillimetre>0,'Missing declared display units');
  if(frameUnits.has(scope.frame))assert.equal(scope.unitsPerMillimetre,frameUnits.get(scope.frame),'Conflicting declared display units in shared frame');
  else frameUnits.set(scope.frame,scope.unitsPerMillimetre);
  if(frameMatrices.has(scope.frame))assert.deepEqual(scope.displayTransformColumnMajor,frameMatrices.get(scope.frame),'Conflicting display transforms in the same declared frame');
  else frameMatrices.set(scope.frame,scope.displayTransformColumnMajor);
  assert(nonempty(scope.source?.license)&&nonempty(scope.source?.credit)&&nonempty(scope.source?.version),'Missing source rights metadata');
  assert(Array.isArray(scope.bundles)&&scope.bundles.length>0,'Missing source bundles');
  const bundles=new Set();
  for(const bundle of scope.bundles){
   assert(nonempty(bundle.id)&&!bundles.has(bundle.id)&&hash(bundle.sha256)&&Number.isSafeInteger(bundle.bytes)&&bundle.bytes>0,'Unpinned or duplicate bundle');bundles.add(bundle.id);
   const key=JSON.stringify([scope.frame,bundle.id]);
   if(declaredBundles.has(key))assert.deepEqual(bundle,declaredBundles.get(key),'Conflicting declared bundle in shared source frame');
   else declaredBundles.set(key,bundle);
  }
  assert(Array.isArray(scope.surfaces)&&scope.surfaces.length>0,'Missing source selections');
  const ids=new Set();
  const surfaces=scope.surfaces.map(surface=>{
   assert(nonempty(surface.id)&&!ids.has(surface.id),'Duplicate source selection');ids.add(surface.id);
   assert(nonempty(surface.name)&&nonempty(surface.laterality)&&nonempty(surface.tissue)&&bundles.has(surface.bundle),'Incomplete source selection');
   assert(surface.fmaId===null||nonempty(surface.fmaId),'Absent mapping must remain null, not invented');
   assert(Array.isArray(surface.sources)&&surface.sources.length>0&&surface.sources.every(s=>nonempty(s.file)&&hash(s.sha256)),'Missing source-file bindings');
   assert.equal(new Set(surface.sources.map(s=>s.file)).size,surface.sources.length,'Repeated source filename');
   for(const source of surface.sources){
    const key=JSON.stringify([scope.frame,source.file]);
    if(sourceFiles.has(key))assert.equal(source.sha256,sourceFiles.get(key),'Conflicting source-file digest in shared frame');
    else sourceFiles.set(key,source.sha256);
   }
   const key=JSON.stringify([scope.frame,surface.id]);
   if(surfaceKeys.has(key))assert.deepEqual(surface,surfaceKeys.get(key),'Conflicting surface reused across views');
   else surfaceKeys.set(key,surface);
   return {...structuredClone(surface),engineeringState:'included-source-selection',clinicalApprovalAsserted:false};
  });
  assert(Array.isArray(scope.studies)&&scope.studies.length>0,'Missing source studies');
  const studyIds=new Set();
  for(const study of scope.studies){
   assert(nonempty(study.id)&&!studyIds.has(study.id),'Duplicate study');studyIds.add(study.id);
   assert(Array.isArray(study.ids)&&study.ids.length>0&&new Set(study.ids).size===study.ids.length&&study.ids.every(id=>ids.has(id))&&study.ids.includes(study.selectedId),'Foreign or unselectable study target');
  }
  assert(studyIds.has(scope.initialStudy),'Unknown initial study');
  return {...structuredClone(scope),surfaces,selectionMemberships:surfaces.length,clinicalApprovalAsserted:false,patientRegistrationAsserted:false};
 });
 assert(Array.isArray(shoulder?.structures)&&shoulder.structures.length>0&&Array.isArray(shoulder.parts)&&shoulder.parts.length>0,'Missing dedicated shoulder bindings');
 assert(hash(shoulder.manifestSha256)&&hash(shoulder.declaredModelSha256)&&matrix(shoulder.coordinateSystem?.sourceToSceneColumnMajor),'Unpinned shoulder display metadata');
 const shoulderIds=new Set(shoulder.structures.map(s=>s.id));assert.equal(shoulderIds.size,shoulder.structures.length,'Duplicate shoulder identity');
 const nodes=new Set();
 for(const part of shoulder.parts){
  assert(shoulderIds.has(part.structureId)&&nonempty(part.nodeName)&&!nodes.has(part.nodeName)&&nonempty(part.sourceFile)&&hash(part.sourceSha256)&&nonempty(part.fmaId),'Unbound shoulder source part');nodes.add(part.nodeName);
 }
 for(const s of shoulder.structures){
  assert(nonempty(s.name)&&shoulder.parts.some(p=>p.structureId===s.id),'Shoulder selection without source part');
  assert(Array.isArray(s.sourceFmaIds)&&s.sourceFmaIds.length>0&&s.sourceFmaIds.every(nonempty)&&new Set(s.sourceFmaIds).size===s.sourceFmaIds.length,'Shoulder source FMA mapping missing or duplicated');
  assert.deepEqual(sorted(new Set(shoulder.parts.filter(p=>p.structureId===s.id).map(p=>p.fmaId))),sorted(s.sourceFmaIds),'Shoulder part FMA differs from selection source binding');
 }
 for(const catalog of withheldCatalogs){
  assert(nonempty(catalog.path)&&sourceInputs[catalog.path]===catalog.sha256&&nonempty(catalog.specimenId)&&nonempty(catalog.frame),'Unbound withheld-source catalogue');
  assert(catalog.heldNodes&&typeof catalog.heldNodes==='object','Missing original withheld-source metadata');
 }
 return {schema:'vm-independent-source-coverage-ledger-1',sourceRevision,evidence:{sourceInputs:structuredClone(sourceInputs)},
  scope:'Declared independent specimen definitions and dedicated shoulder; not unique anatomical completeness or geometry validation.',
  counts:{independentViews:views.length,independentSourceFrames:frameMatrices.size,independentSelectionMemberships:views.reduce((n,v)=>n+v.surfaces.length,0),
   independentFrameQualifiedSelectionIds:surfaceKeys.size,independentFrameQualifiedDeclaredBundles:declaredBundles.size,
   dedicatedShoulderSelections:shoulder.structures.length,dedicatedShoulderSourcePartBindings:shoulder.parts.length},
  frames:sorted(frameMatrices.keys()).map(id=>({id,displayTransformColumnMajor:[...frameMatrices.get(id)],unitsPerMillimetre:frameUnits.get(id),coordinateCalibrationAsserted:false,patientRegistrationAsserted:false})),views,
  withheldCatalogs:structuredClone(withheldCatalogs),
  dedicatedShoulder:{...structuredClone(shoulder),clinicalApprovalAsserted:false,patientRegistrationAsserted:false},
  limitations:['Counts are separate units and must not be added to root or nested selections as unique anatomy.',
   'A frame-qualified selection ID is a source identity, not a clinically unique structure.',
   'Declared bundle hashes are verified metadata bindings; this generator does not read model payloads.',
   'Display transforms are not cross-donor or patient-space registration.',
   'Rights metadata and engineering inclusion are not clinical, privacy or release approval.',
   'Expected curriculum and excluded or held originals need separate source-specific adjudication.'],
  clinicalApprovalAsserted:false,anatomicalCompletenessProven:false,patientRegistrationAsserted:false};
}
