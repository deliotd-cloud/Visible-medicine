'use client';

import { useRouter } from 'next/navigation';
import { atlasRegionLinks, type AtlasModalityId } from '../lib/atlas-navigation';

export function AtlasRegionNavigation({ modality, selected }: { modality: AtlasModalityId; selected: string }) {
  const router = useRouter();
  const regions = atlasRegionLinks(modality);
  const name = modality === '3d' ? '3D' : modality.toUpperCase();

  return <nav className="atlas-region-navigation" aria-label={`${name} anatomical regions`}>
    <form className="atlas-region-form" key={`${modality}:${selected}`} onSubmit={event => {
      event.preventDefault();
      const choice = event.currentTarget.elements.namedItem('atlas-region') as HTMLSelectElement | null;
      const destination = regions.find(region => region.id === choice?.value);
      if (destination && destination.id !== selected) router.push(destination.href);
    }}>
    <label className="atlas-region-picker">
      <span>Region</span>
      <select name="atlas-region" defaultValue={selected}>
        {regions.map(region => <option key={region.id} value={region.id}>
          {region.label}{region.planned ? ' · in preparation' : ''}
        </option>)}
      </select>
    </label>
    <button className="atlas-region-open" type="submit" aria-label="Open selected anatomical region">Go</button>
    </form>
  </nav>;
}
