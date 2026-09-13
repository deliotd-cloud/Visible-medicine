'use client';
import {useRouter} from 'next/navigation';
import Link from 'next/link';
import {atlasRegionLinks,type AtlasModalityId} from '../lib/atlas-navigation';
export function AtlasRegionNavigation({modality,selected}:{modality:AtlasModalityId;selected:string}){
  const router=useRouter();
  const regions=atlasRegionLinks(modality);
  return <nav className="atlas-region-navigation" aria-label={`${modality==='3d'?'3D':modality.toUpperCase()} anatomical regions`}>
    <span className="atlas-region-heading">Region</span>
    <div className="atlas-region-links">{regions.map(region=><Link key={region.id} href={region.href} aria-current={region.id===selected?'page':undefined} title={region.planned?`${region.label} — in preparation`:undefined}>{region.label}{region.planned&&<span className="sr-only"> — in preparation</span>}</Link>)}</div>
    <label className="atlas-region-mobile"><span className="sr-only">Anatomical region</span><select value={selected} onChange={event=>{
      const destination=regions.find(region=>region.id===event.target.value);
      if(destination)router.push(destination.href);
    }}>{regions.map(region=><option key={region.id} value={region.id}>{region.label}{region.planned?' · in preparation':''}</option>)}</select></label>
  </nav>;
}
