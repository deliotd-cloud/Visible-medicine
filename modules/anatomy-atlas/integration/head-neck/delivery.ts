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
import {cardiacContextViewCatalog,cardiacRelationshipsFor} from '../../lib/cardiac-context';
import {pulmonaryContextViewCatalog} from '../../lib/pulmonary-context';
import {hepaticBiliaryViewCatalog,hepaticBiliaryRelationshipsFor} from '../../lib/hepatic-biliary-context';
import {renalRelationshipViewCatalog,renalRelationshipsFor} from '../../lib/renal-relationships';
import {pancreaticViewCatalog} from '../../lib/pancreatic';
import {abdominalWallDefinition} from '../../lib/abdominal-wall';
import {hraRenalDefinition} from '../../lib/hra-renal';
import {backLayersDefinition} from '../../lib/back-layers';
import {hraPelvisDefinition} from '../../lib/hra-pelvis';
import {limbDefinitions} from '../../lib/um-limb-studies';
import {femoralComponentViewCatalog} from '../../lib/femoral-components';
import {regionalModules,type RegionalModule} from './regions';

/** All selectable root structures plus every supported child/context state, not a reduced catalogue. */
export function regionalDelivery(raw:BodyCatalog,region:RegionalModule) {
  if(!Object.hasOwn(regionalModules,region))throw Error('Region needs delivery review');
  const catalog=bodyDisplayCatalog(raw);
  const regional=catalog.structures.filter(s=>region==='whole-body'||s.regions.includes(region));
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
        case 'femoral-components': views.push(femoralComponentViewCatalog(parent));break;
        case 'cardiac':
          views.push(cardiacContextViewCatalog(parent));
          for(const relation of cardiacRelationshipsFor(parent))views.push(cardiacContextViewCatalog(parent,relation.id));
          break;
        case 'pulmonary': views.push(pulmonaryContextViewCatalog(parent,true,'all'));break;
        case 'hepatic':
          views.push(hepaticBiliaryViewCatalog(parent,true));
          for(const relation of hepaticBiliaryRelationshipsFor(parent))views.push(hepaticBiliaryViewCatalog(parent,true,relation.id));
          break;
        case 'renal':
          views.push(renalRelationshipViewCatalog(parent,true));
          for(const relation of renalRelationshipsFor(parent))views.push(renalRelationshipViewCatalog(parent,true,relation.id));
          break;
        case 'pancreatic': views.push(pancreaticViewCatalog(parent,true));break;
        case 'visual-pathway':
          views.push(visualContextViewCatalog(parent,true));
          for(const relation of visualRelationshipsFor(parent)) views.push(visualContextViewCatalog(parent,true,relation.id));
          break;
        default: throw Error('New regional nested study needs delivery review: '+study);
      }
    }
  }
  const specimens=region==='abdomen'?[abdominalWallDefinition,hraRenalDefinition]
    :region==='spine'?[backLayersDefinition]
    :region==='pelvis'?[hraPelvisDefinition,...Object.values(limbDefinitions)]
    :['thigh','leg','foot'].includes(region)?Object.values(limbDefinitions)
    :region==='whole-body'?[backLayersDefinition,hraPelvisDefinition,hraRenalDefinition]:[];
  // Distinct catalogues/frames and licences; never fit these specimens into v4.
  views.push(...specimens.map(specimen=>specimen.catalog));
  const bundles=new Map<string,BodyCatalog['bundles'][number]>();
  for(const view of views) for(const structure of view.structures) {
    const matches=view.bundles.filter(b=>b.id===structure.bundle);
    if(matches.length!==1)throw Error('Missing or ambiguous bundle: '+structure.id);
    const bundle=matches[0],prior=bundles.get(bundle.url);
    if(prior && (prior.sha256!==bundle.sha256 || prior.bytes!==bundle.bytes))throw Error('Conflicting delivery identity');
    bundles.set(bundle.url,bundle);
  }
  return {region,regionalIds:regional.map(s=>s.id),nestedTargets:targets.map(({structure,...target})=>target),
    independentSpecimens:specimens.map(specimen=>({key:specimen.key,label:specimen.label,license:specimen.source.license,
      surfaceIds:specimen.surfaces.map(surface=>surface.id),studyIds:specimen.studies.map(study=>study.id),
      sourceFrame:specimen.catalog.coordinateSystem,bundles:specimen.catalog.bundles})),
    bundles:[...bundles.values()].sort((a,b)=>a.url.localeCompare(b.url)),
    sourceVersion:catalog.sourceVersion,license:catalog.license};
}

export const headNeckDelivery=(raw:BodyCatalog)=>regionalDelivery(raw,'head-neck');
export function regionalWebsiteDelivery(raw:BodyCatalog) {
  const scopes=(Object.keys(regionalModules) as RegionalModule[]).map(region=>regionalDelivery(raw,region));
  const byUrl=new Map<string,BodyCatalog['bundles'][number]>();
  for(const scope of scopes)for(const bundle of scope.bundles){
    const previous=byUrl.get(bundle.url);
    if(previous && (previous.sha256!==bundle.sha256 || previous.bytes!==bundle.bytes))throw Error('Conflicting shared source');
    byUrl.set(bundle.url,bundle);
  }
  return {defaultRegion:'head-neck',sourceVersion:scopes[0].sourceVersion,license:scopes[0].license,scopes,
    bundles:[...byUrl.values()].sort((a,b)=>a.url.localeCompare(b.url))};
}
