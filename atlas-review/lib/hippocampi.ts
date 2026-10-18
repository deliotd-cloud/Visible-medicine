import addition from '../public/models/bodyparts3d/hippocampi/catalog.json' with {type:'json'};
import type {BodyCatalog,BodyStructure} from '../app/body-types';

/** Add source-aligned children only while the exact reviewed base still matches.
 * Never refit a stale child to a changed brain or silently replace original meshes. */
export function withHippocampi<T extends BodyCatalog & {parent:BodyStructure;selectableIds:string[]}>(base:T):T {
  for(const [current,pinned] of [
    [base.parent,addition.parent],
    [base.coordinateSystem,addition.coordinateSystem],
    [base.structures,addition.baseStructures],
    [base.bundles,addition.baseBundles],
    [base.selectableIds,addition.baseSelectableIds],
  ]) if(JSON.stringify(current)!==JSON.stringify(pinned))return base;
  if(base.license!==addition.license || base.sourceVersion!==addition.sourceVersion)return base;
  const structures=addition.structures;
  if(structures.some(s=>base.structures.some(p=>p.id===s.id||p.sources.some(f=>s.sources.some(t=>f.file===t.file)))))return base;
  return {...base,structures:[...base.structures,...structures],
    selectableIds:[...base.selectableIds,...addition.selectableIds],
    bundles:[...base.bundles,...addition.bundles]};
}
