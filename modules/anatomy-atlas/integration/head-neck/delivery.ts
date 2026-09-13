import type {BodyCatalog} from '../../app/body-types';
import {bodyDisplayCatalog} from '../../lib/body-display-catalog';
import {nestedStudyTargets} from '../../lib/nested-anatomy';
import {eyeCatalog} from '../../lib/eye-layers';
import {ventricleCatalog} from '../../lib/ventricles';
import {brainstemCatalog} from '../../lib/brainstem';
import {cerebralCatalog} from '../../lib/cerebral';
import {visualContextViewCatalog,visualRelationshipsFor} from '../../lib/visual-pathway-context';
import {cricothyroidViewCatalog} from '../../lib/cricothyroid';
import {cranialArteryComponentViewCatalog} from '../../lib/cranial-artery-components';

/** All selectable root structures plus every supported child/context state, not a reduced catalogue. */
export function headNeckDelivery(raw:BodyCatalog) {
  const catalog=bodyDisplayCatalog(raw);
  const regional=catalog.structures.filter(s=>s.regions.includes('head-neck'));
  const scoped={...catalog,structures:regional};
  const targets=nestedStudyTargets(scoped);
  const views:BodyCatalog[]=[scoped];
  for(const parent of regional) {
    const studies=new Set(targets.filter(t=>t.parentId===parent.id).map(t=>t.study));
    for(const study of studies) {
      switch(study) {
        case 'eye': views.push(eyeCatalog);break;
        case 'ventricles': views.push(ventricleCatalog);break;
        case 'brainstem': views.push(brainstemCatalog);break;
        case 'cerebral': views.push(cerebralCatalog);break;
        case 'cricothyroid': views.push(cricothyroidViewCatalog(parent,true));break;
        case 'cranial-artery-components': views.push(cranialArteryComponentViewCatalog(parent));break;
        case 'visual-pathway':
          views.push(visualContextViewCatalog(parent,true));
          for(const relation of visualRelationshipsFor(parent)) views.push(visualContextViewCatalog(parent,true,relation.id));
          break;
        default: throw Error('New regional nested study needs delivery review: '+study);
      }
    }
  }
  const bundles=new Map<string,BodyCatalog['bundles'][number]>();
  for(const view of views) for(const structure of view.structures) {
    const matches=view.bundles.filter(b=>b.id===structure.bundle);
    if(matches.length!==1)throw Error('Missing or ambiguous bundle: '+structure.id);
    const bundle=matches[0],prior=bundles.get(bundle.url);
    if(prior && (prior.sha256!==bundle.sha256 || prior.bytes!==bundle.bytes))throw Error('Conflicting delivery identity');
    bundles.set(bundle.url,bundle);
  }
  return {regionalIds:regional.map(s=>s.id),nestedTargets:targets.map(({structure,...target})=>target),
    bundles:[...bundles.values()].sort((a,b)=>a.url.localeCompare(b.url)),
    sourceVersion:catalog.sourceVersion,license:catalog.license};
}

