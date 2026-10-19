import assert from 'node:assert/strict';
import {buildIndependentLedger} from './build-independent.mjs';
import {parseProducerArgs,createCoverageSource,hash,writeCoverageOutput} from './source-context.mjs';

const args=parseProducerArgs(process.argv.slice(2));
const source=createCoverageSource(args);
try{
  source.hook();
  const renal=await import(source.rootUrl+'lib/hra-renal.ts');
  const pelvis=await import(source.rootUrl+'lib/hra-pelvis.ts');
  const abdominal=await import(source.rootUrl+'lib/abdominal-wall.ts');
  const back=await import(source.rootUrl+'lib/back-layers.ts');
  const limb=await import(source.rootUrl+'lib/um-limb-studies.ts');
  const routes=await import(source.rootUrl+'lib/independent-study-links.ts');
  const shoulder=await import(source.rootUrl+'app/anatomy-data.ts');
  const reviewSource=source.read('lib/specimen-review-material.ts').toString();
  const limbFrame='um-5t6tz7-v1-2:source-lps';
  assert(reviewSource.includes("sourceFrame:'"+limbFrame+"'"),'Declared limb frame changed');
  const definitions=[renal.hraRenalDefinition,pelvis.hraPelvisDefinition,abdominal.abdominalWallDefinition,back.backLayersDefinition,...Object.values(limb.limbDefinitions)];
  const scopes=definitions.map(d=>({key:d.key,name:d.label,source:d.source,
    frame:routes.independentStudyRoutes.find(r=>r.key===d.key)?.frame??(Object.values(limb.limbDefinitions).includes(d)?limbFrame:null),
    displayTransformColumnMajor:d.catalog.coordinateSystem.sourceToSceneColumnMajor,
    unitsPerMillimetre:d.catalog.coordinateSystem.unitsPerMillimetre,
    surfaces:d.surfaces,bundles:d.catalog.bundles,studies:d.studies,initialStudy:d.initialStudy,limitations:d.limitations,
    coordinateCalibrationAsserted:false,clinicalApprovalAsserted:false}));
  const manifestPath='public/models/bodyparts3d/manifest.json';
  const manifestBytes=source.read(manifestPath),manifest=JSON.parse(manifestBytes);
  const dedicated={structures:shoulder.structures.map(s=>({id:s.id,name:s.name,laterality:s.laterality,category:s.category,sourceFmaIds:s.sourceFmaIds??null})),
    parts:manifest.parts,manifestPath,manifestSha256:hash(manifestBytes),declaredModelSha256:manifest.sha256,coordinateSystem:manifest.coordinateSystem,
    source:manifest.source,version:manifest.version,license:manifest.license,credit:manifest.credit,changes:manifest.changes};
  const withheldCatalogs=['public/models/hra-renal/catalog.json','public/models/hra-pelvis/catalog.json'].map(path=>{
    const bytes=source.read(path),raw=JSON.parse(bytes);
    return {path,sha256:hash(bytes),specimenId:raw.specimenId,frame:raw.sourceFrame,heldNodes:raw.heldNodes,
      scope:'Original catalogue withheld-source metadata; not a new approval or exhaustive independent-source hold inventory.'};
  });
  const sourceInputs=source.verify();
  const ledger=buildIndependentLedger({scopes,shoulder:dedicated,withheldCatalogs,sourceInputs,sourceRevision:source.revision});
  source.verify();
  writeCoverageOutput(args,ledger);
  source.verify();
  console.log(JSON.stringify({sourceRevision:source.revision,...ledger.counts,sourceFiles:Object.keys(sourceInputs).length,clinicalApprovalAsserted:false,anatomicalCompletenessProven:false}));
}finally{source.close();}
