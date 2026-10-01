'use client';

import { useRouter } from 'next/navigation';
import { atlasRegionLinks, type AtlasModalityId } from '../lib/atlas-navigation';

export function AtlasRegionNavigation({ modality, selected }: { modality: AtlasModalityId; selected: string }) {
  const router = useRouter();
  const regions = atlasRegionLinks(modality);
  const name = modality === '3d' ? '3D' : modality.toUpperCase();

  return <nav className="atlas-region-navigation" aria-label={`${name} anatomical regions`}>
    <label className="atlas-region-picker">
      <span>Region</span>
      <select value={selected} onChange={event => {
        const destination = regions.find(region => region.id === event.currentTarget.value);
        if (destination) router.push(destination.href);
      }}>
        {regions.map(region => <option key={region.id} value={region.id}>
          {region.label}{region.planned ? ' · in preparation' : ''}
        </option>)}
      </select>
    </label>
  </nav>;
}
