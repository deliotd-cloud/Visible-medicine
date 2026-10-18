'use client';

import Link from 'next/link';
import {AtlasRegionNavigation} from './AtlasRegionNavigation';
import {atlas3dReturnRegionForImaging,atlasModalities,atlasRegionLinks,type AtlasModalityId} from '../lib/atlas-navigation';
import {headImageHref,type HeadImageNavigationContext} from '../lib/head-atlas-navigation';
import './atlas-workspace-navigation.css';

/** A route switcher. Only verified head CT/MRI links carry learning context. */
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
        const unlinkedHead=regionId==='head-neck'&&(modality==='ct'||modality==='mri')&&(item.id==='ct'||item.id==='mri')&&!!headNavigation&&(!!headNavigation.conceptId||!!headNavigation.position)&&!headHref;
        const browse=unlinkedHead||(!sameModality&&!headHref);
        const href=headHref??region?.href??item.href;
        const browseContext=unlinkedHead?`leave ${headNavigation?.position?'tour':'anatomy focus'}`:'no focus or registration carried';
        return <Link key={item.id} href={href} aria-current={sameModality?'page':undefined}
          aria-label={browse?`Browse ${item.label} ${regionId==='head-neck'?'head':'atlas'} · ${browseContext}`:undefined}
          title={browse?unlinkedHead?'No verified comparison for this context. Opens the general atlas without carrying the current focus.':'Browse this atlas. This navigation does not carry an anatomical focus or spatial registration.':undefined}>
          {item.label}
        </Link>;
      })}
    </nav>
    <details className="atlas-workspace-navigation-help">
      <summary>Switching views</summary>
      <p>Modality tabs browse another atlas. Only verified, source-bound CT/MRI head links retain learning context; other tabs do not carry anatomical focus. These views are not spatially registered. Atlas, imaging cases and lectures have separate access.</p>
    </details>
    <AtlasRegionNavigation modality={modality} selected={regionId}/>
  </div>;
}
