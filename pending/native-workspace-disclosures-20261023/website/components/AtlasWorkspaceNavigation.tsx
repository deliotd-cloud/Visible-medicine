'use client';

import Link from 'next/link';
import {NativeDisclosure} from './NativeDisclosure';
import {AtlasRegionNavigation} from './AtlasRegionNavigation';
import {atlas3dReturnRegionForImaging,atlasModalities,atlasRegionLinks,type AtlasModalityId} from '../lib/atlas-navigation';
import {headConceptById,HEAD_LINK_REVISION} from '../lib/head-atlas-links.ts';
import {headLearningLinks,headLearningSequencesForModality} from '../lib/head-atlas-learning.ts';
import {headLinksCurrent} from '../lib/head-link-availability.ts';
import {headImageHref,type HeadImageNavigationContext} from '../lib/head-atlas-navigation';
import './atlas-workspace-navigation.css';

/** Semantic navigation between separate subjects; never forwards image URL state. */
function head3dDestination(modality:'ct'|'mri',context:HeadImageNavigationContext|undefined){
  if(!context||!headLinksCurrent()||context.revision!==HEAD_LINK_REVISION)return null;
  const {conceptId,position}=context;
  if(!conceptId||position&&position.conceptId!==conceptId)return null;
  const source=modality==='ct'?'CT':'MRI';
  if(!headImageHref(source,conceptId,position,context.revision))return null;
  const concept=headConceptById(conceptId);
  if(!concept||concept.headRevision!==HEAD_LINK_REVISION||!concept.atlasHref)return null;
  if(!position)return {href:concept.atlasHref,label:`View ${concept.label} in 3D Atlas`};
  const sequence=headLearningSequencesForModality(source).find(item=>item.id===position.sequenceId);
  const index=sequence?.concepts.indexOf(conceptId)??-1;
  if(!sequence||index<0)return null;
  const href=headLearningLinks(position)?.atlasHref;
  return href?{href,label:`View ${concept.label} in 3D Atlas · ${sequence.label}, step ${index+1} of ${sequence.concepts.length}`}:null;
}

/** A route switcher. Only verified head links carry learning context. */
export function AtlasWorkspaceNavigation({modality,regionId,headNavigation}:{modality:AtlasModalityId;regionId:string;headNavigation?:HeadImageNavigationContext}){
  return <div className="imaging-workspace-navigation atlas-workspace-navigation">
    <nav className="imaging-workspace-modalities" aria-label="Atlas modalities">
      {atlasModalities.map(item=>{
        const sameModality=item.id===modality;
        // Staying in the current modality must not reset a source-bound study,
        // structure or tour to the region's general landing URL.
        if (sameModality) return <span key={item.id} aria-current="page">{item.label}</span>;
        const region=item.id==='3d'
          ?modality==='3d'?atlasRegionLinks('3d').find(candidate=>candidate.id===regionId):atlas3dReturnRegionForImaging(regionId)
          :atlasRegionLinks(item.id).find(candidate=>candidate.id===regionId);
        // This is the established, revision-bound CT/MRI head path; no other route inherits a focus.
        const headHref=regionId==='head-neck'&&(modality==='ct'||modality==='mri')&&(item.id==='ct'||item.id==='mri')&&headNavigation
          ?headImageHref(item.id==='ct'?'CT':'MRI',headNavigation.conceptId,headNavigation.position,headNavigation.revision):null;
        const head3d=regionId==='head-neck'&&(modality==='ct'||modality==='mri')&&item.id==='3d'
          ?head3dDestination(modality,headNavigation):null;
        const unlinkedHead=regionId==='head-neck'&&(modality==='ct'||modality==='mri')&&(item.id==='ct'||item.id==='mri')&&!!headNavigation&&(!!headNavigation.conceptId||!!headNavigation.position)&&!headHref;
        const unlinked3d=regionId==='head-neck'&&(modality==='ct'||modality==='mri')&&item.id==='3d'&&!!headNavigation&&(!!headNavigation.conceptId||!!headNavigation.position)&&!head3d;
        const browse=unlinkedHead||unlinked3d||(!sameModality&&!headHref&&!head3d);
        const href=headHref??head3d?.href??region?.href??item.href;
        const browseContext=unlinkedHead||unlinked3d?`leave ${headNavigation?.position?'tour':'anatomy focus'}`:'no focus or registration carried';
        const ariaLabel=head3d?.label??(browse?`Browse ${item.label} ${regionId==='head-neck'?'head':'atlas'} · ${browseContext}`:undefined);
        const title=head3d?'These views show separate subjects; anatomical concepts are linked, but the images and 3D model are not spatially registered.':browse?unlinkedHead||unlinked3d?'No verified comparison for this context. Opens the general atlas without carrying the current focus.':'Browse this atlas. This navigation does not carry an anatomical focus or spatial registration.':undefined;
        // A fresh document mounts the head model reliably; preserve native link and modifier behavior.
        if(item.id==='3d'&&regionId==='head-neck')return <a key={item.id} href={href} aria-label={ariaLabel} title={title}>{item.label}</a>;
        return <Link key={item.id} href={href} aria-current={sameModality?'page':undefined}
          aria-label={ariaLabel} title={title}>
          {item.label}
        </Link>;
      })}
    </nav>
    <NativeDisclosure className="atlas-workspace-navigation-help">
      <summary>About modality links</summary>
      <p>Modality tabs browse another atlas. Verified, source-bound CT/MRI head links and exact 3D head concept or tour links retain learning context; other tabs do not carry anatomical focus. These views show separate subjects and are not spatially registered. Atlas, imaging cases and lectures have separate access.</p>
    </NativeDisclosure>
    <AtlasRegionNavigation modality={modality} selected={regionId}/>
  </div>;
}
