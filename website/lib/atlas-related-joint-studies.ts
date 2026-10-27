import {limbDefinitions} from '../atlas-review/lib/um-limb-studies';
import {makeSpecimenLink} from '../atlas-review/lib/um-limb-navigation';
import reviewManifest from '../atlas-review/manifest.json';
import bodyManifest from '../public/atlas-runtime/head-neck/manifest.json';
import limbManifest from '../public/atlas-runtime/lower-limb/manifest.json';
import {lowerLimbStudySuffix} from './lower-limb-study-transport';

export type RelatedJointStudy={id:string;title:string;note:string;href:string};

/** Regional discovery only: these are independent right-limb source specimens,
 * not correspondences to a selected body structure, side or patient scan. */
export function relatedJointStudies(regionId:string):RelatedJointStudy[]{
  if(regionId!=='thigh'&&regionId!=='leg')return [];
  const revision=limbManifest.sourceCommit;
  if(!/^[a-f0-9]{40}$/.test(revision)||revision!==bodyManifest.sourceCommit||revision!==reviewManifest.revision)return [];
  const scope=regionId==='thigh'?'hip-thigh':'knee';
  const definition=limbDefinitions[scope];
  const choices=regionId==='thigh'?['hip-cartilage']:['cruciates','collaterals','articular'];
  return choices.flatMap(id=>{
    const study=definition.studies.find(item=>item.id===id);
    if(!study)return [];
    const authored=makeSpecimenLink(definition,{selectedId:study.selectedId,studyId:study.id,view:study.view});
    if(!authored?.startsWith('/specimens/lower-limb?'))return [];
    const query=new URLSearchParams(authored.slice(authored.indexOf('?')+1));
    const suffix=lowerLimbStudySuffix(Object.fromEntries(query));
    if(!suffix||suffix!=='?'+query.toString())return [];
    query.set('atlasRevision',revision);
    return [{id,title:study.title,note:study.note,href:'/atlas/lower-limb-3d?'+query.toString()}];
  });
}
