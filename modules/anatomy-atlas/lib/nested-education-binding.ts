import type {BodyCatalog,BodyStructure} from '../app/body-types';
import type {NestedLearningStudy} from './learning-resource-types';
import {nestedLearningAnatomyRepresentations} from './nested-learning-anatomy';
import {nestedStudyTargets} from './nested-anatomy';
import {bodyDisplayCatalog} from './body-display-catalog';
import {bodyLinkEntries} from './anatomy-link-registry';

const sourceKey=(sources:BodyStructure['sources'])=>JSON.stringify(sources.map(s=>`${s.file}:${s.sha256}`).sort());

/** Reconcile local view inputs against current trusted source records. Bounds,
 * names and coordinates always come from the current source, never the host. */
export function nestedEducationBinding(catalog:BodyCatalog|undefined,parent:BodyStructure,study:NestedLearningStudy,layers:BodyStructure[]){
  const empty={records:[],entries:[]} as {
    records:ReturnType<typeof nestedLearningAnatomyRepresentations>;
    entries:ReturnType<typeof bodyLinkEntries>;
  };
  if(!catalog)return empty;
  try{
    // Parents may use an admitted display-correction bundle (not the raw one).
    // Resolve both the records and bundle identity in that same trusted frame.
    const current=bodyDisplayCatalog(catalog);
    const records=nestedLearningAnatomyRepresentations(catalog).filter(a=>
      a.nested.study===study&&a.nested.parentId===parent.id&&
      sourceKey(a.nested.parentSources)===sourceKey(parent.sources)&&
      current.bundles.some(b=>b.id===parent.bundle&&b.sha256===a.nested.parentBundleSha256)&&
      layers.some(s=>s.id===a.structureId&&sourceKey(s.sources)===sourceKey(a.sources)));
    const targets=nestedStudyTargets(current).filter(t=>records.some(a=>
      a.structureId===t.structureId&&a.nested.parentId===t.parentId&&
      a.nested.study===t.study&&a.nested.bundleSha256===t.sourceHash&&
      a.nested.parentBundleSha256===t.parentHash));
    return {records,entries:bodyLinkEntries({...current,structures:targets.map(t=>t.structure)})};
  }catch{return empty;}
}
