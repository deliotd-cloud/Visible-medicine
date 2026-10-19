import assert from 'node:assert/strict';
import {buildNestedLedger} from './build-nested.mjs';
import {parseProducerArgs,createCoverageSource,writeCoverageOutput} from './source-context.mjs';

const args=parseProducerArgs(process.argv.slice(2));
const source=createCoverageSource(args);
try{
  source.hook();
  const raw=source.json('public/models/bodyparts3d/full-body/catalog.json');
  const {bodyDisplayCatalog}=await import(source.rootUrl+'lib/body-display-catalog.ts');
  const catalog=bodyDisplayCatalog(raw);
  const {nestedStudyTargets}=await import(source.rootUrl+'lib/nested-anatomy.ts');
  const targets=nestedStudyTargets(catalog);
  const registryExports={
    'cranial-artery-components':['cranial-artery-components','cranialArteryComponentCatalog'],
    'femoral-components':['femoral-components','femoralComponentCatalog'],cricothyroid:['cricothyroid','cricothyroidCatalog'],
    pancreatic:['pancreatic','pancreaticCatalog'],renal:['renal','renalCatalog'],hepatic:['hepatic','hepaticCatalog'],
    pulmonary:['pulmonary','pulmonaryCatalog'],'coronary-venous':['coronary-venous','coronaryVenousCatalog'],
    cardiac:['cardiac','cardiacCatalog'],eye:['eye-layers','eyeCatalog'],ventricles:['ventricles','ventricleCatalog'],
    brainstem:['brainstem','brainstemCatalog'],cerebral:['cerebral','cerebralCatalog'],
    'visual-pathway':['visual-pathway','visualPathwayCatalog'],
  };
  assert.deepEqual([...new Set(targets.map(t=>t.study))].sort(),Object.keys(registryExports).sort(),'Study registry list differs from live selections');
  const registries={};
  for(const [study,[name,exportName]] of Object.entries(registryExports)){
    const module=await import(source.rootUrl+`lib/${name}.ts`);
    registries[study]=module[exportName];
    assert(registries[study]?.coordinateSystem&&Array.isArray(registries[study]?.structures),`Missing registry ${study}`);
  }
  const {nestedTeachingFor}=await import(source.rootUrl+'lib/nested-teaching.ts');
  const {nestedConcepts}=await import(source.rootUrl+'content/nested-teaching.ts');
  const parents=new Map(catalog.structures.map(s=>[s.id,s]));
  const teachingConceptIds=targets.map(t=>nestedTeachingFor(parents.get(t.parentId),t.study,t.structure)?.id??null);
  const sourceInputs=source.verify();
  const ledger=buildNestedLedger({catalog,targets,registries,teachingConceptIds,
    declaredTeachingConceptIds:nestedConcepts.map(c=>c.id),sourceRevision:source.revision,sourceInputs});
  source.verify();
  writeCoverageOutput(args,ledger);
  source.verify();
  console.log(JSON.stringify({sourceRevision:source.revision,...ledger.counts,sourceFiles:Object.keys(sourceInputs).length,clinicalApproval:false,anatomicalCompletenessProven:false}));
}finally{source.close();}
