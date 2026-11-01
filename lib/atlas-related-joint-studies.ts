import {limbDefinitions} from '../atlas-review/lib/um-limb-studies';
import {makeSpecimenLink} from '../atlas-review/lib/um-limb-navigation';
import reviewManifest from '../atlas-review/manifest.json';
import bodyManifest from '../public/atlas-runtime/head-neck/manifest.json';
import limbManifest from '../public/atlas-runtime/lower-limb/manifest.json';
import limbInputs from '../public/atlas-runtime/lower-limb/source-inputs.json';
import {lowerLimbStudySuffix} from './lower-limb-study-transport';

export type RelatedJointStudy={id:string;title:string;note:string;href:string};

// These seven imported inputs are byte-identical at the two committed Atlas
// revisions. This is a narrow source bridge for the four UM joint presets.
const jointSourceBridge={
  runtime:'c32bc81cf0fd7ec22fa83e8b1365019297f9a0b3',
  review:'7b2e5accf8538f3ffef396f95b0a206b06a76c1b',
  inputs:{
    'lib/um-limb-studies.ts':'a544d566b88d1a55c23f85e743d5cbabcc2518c54458c18eff6faa429a9ce810',
    'lib/um-knee-study.ts':'80908fce33eb88fe5d217d8ed70c948559c19981c48a7daf034353224ee25b55',
    'lib/um-limb-navigation.ts':'4697de9da3dc98ae0888681e9c799301a54eab2a8919c0f4b004664606bdd83f',
    'lib/specimen-links.ts':'a185fc2f0c8f439c423660acfe1ada45605245e1131b6e317d130a7339944d76',
    'content/um-limb-navigation.v1.json':'34833f71e385972efb27f5798a094cb23f4df608c8baa4ca8256bb725332174c',
    'public/models/um-limb/catalog.json':'fc27b778fe8a0e13f773f272bd0bd9bdf9d22117029bd5a5b5d11f0dc39c83fb',
    'public/models/um-knee/catalog.json':'946249f2b30bf29f4338e5c11cd324aec00b8616fcb02349376a258f93a6544e',
  },
} as const;

function exactJointSourceBridge():boolean{
  if(limbManifest.sourceCommit!==jointSourceBridge.runtime||
    bodyManifest.sourceCommit!==jointSourceBridge.review||
    reviewManifest.revision!==jointSourceBridge.review)return false;
  return Object.entries(jointSourceBridge.inputs).every(([path,hash])=>{
    const runtime=limbInputs.filter(item=>item.path===path);
    const imported=reviewManifest.files.filter(item=>item.path===path);
    return runtime.length===1&&runtime[0].sha256===hash&&imported.length===1&&
      imported[0].sourceSha256===hash&&imported[0].importedSha256===hash;
  });
}

/** Regional discovery only: these are independent right-limb source specimens,
 * not correspondences to a selected body structure, side or patient scan. */
export function relatedJointStudies(regionId:string):RelatedJointStudy[]{
  if(regionId!=='thigh'&&regionId!=='leg')return [];
  const revision=limbManifest.sourceCommit;
  if(!exactJointSourceBridge())return [];
  const scope=regionId==='thigh'?'hip-thigh':'knee';
  const definition=limbDefinitions[scope];
  const choices=regionId==='thigh'?['hip-cartilage']:['cruciates','collaterals','articular'];
  const links:RelatedJointStudy[]=[];
  for(const id of choices){
    const study=definition.studies.find(item=>item.id===id);
    if(!study)return [];
    const authored=makeSpecimenLink(definition,{selectedId:study.selectedId,studyId:study.id,view:study.view});
    if(!authored?.startsWith('/specimens/lower-limb?'))return [];
    const query=new URLSearchParams(authored.slice(authored.indexOf('?')+1));
    const suffix=lowerLimbStudySuffix(Object.fromEntries(query));
    if(!suffix||suffix!=='?'+query.toString())return [];
    query.set('atlasRevision',revision);
    links.push({id,title:study.title,note:study.note,href:'/atlas/lower-limb-3d?'+query.toString()});
  }
  return links;
}
