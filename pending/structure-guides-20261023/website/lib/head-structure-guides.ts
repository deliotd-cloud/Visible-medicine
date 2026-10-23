import {HEAD_LINK_REVISION} from './head-atlas-links.ts';
import {headLearningNavigation,headLearningSequencesForModality} from './head-atlas-learning.ts';
import {headImageConceptById} from './head-image-only-links.ts';
import {headLinksCurrent} from './head-link-availability.ts';

export type HeadStructureGuide={
  id:string;
  label:string;
  step:number;
  total:number;
  views:Array<{key:'3d'|'ct'|'mri';label:string;href:string}>;
};

/** Existing, revision-bound head tours containing this exact registered concept. */
export function headStructureGuides(conceptId:string,revision:string):HeadStructureGuide[]{
  if(typeof conceptId!=='string'||typeof revision!=='string'||revision!==HEAD_LINK_REVISION||!headLinksCurrent()||!headImageConceptById(conceptId))return [];
  const guides:HeadStructureGuide[]=[];
  const seen=new Set<string>();
  const surfaces=[
    {key:'3d',label:'3D Atlas',modality:undefined,hrefKey:'atlasHref'},
    {key:'ct',label:'CT',modality:'CT',hrefKey:'ctHref'},
    {key:'mri',label:'MRI',modality:'MRI',hrefKey:'mriHref'},
  ] as const;
  for(const sequence of headLearningSequencesForModality()){
    if(seen.has(sequence.id))continue;
    seen.add(sequence.id);
    const index=sequence.concepts.indexOf(conceptId);
    if(index<0)continue;
    const position={sequenceId:sequence.id,conceptId};
    const views:HeadStructureGuide['views']=[];
    for(const surface of surfaces){
      if(!headLearningSequencesForModality(surface.modality).some(candidate=>candidate.id===sequence.id))continue;
      const navigation=headLearningNavigation(position,surface.modality);
      const href=navigation?.current[surface.hrefKey];
      if(href)views.push({key:surface.key,label:surface.label,href});
    }
    if(views.length)guides.push({id:sequence.id,label:sequence.label,step:index+1,total:sequence.concepts.length,views});
  }
  return guides;
}
