'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { atlasRegionLinks, type AtlasModalityId } from '../lib/atlas-navigation';

export function AtlasRegionNavigation({ modality, selected }: { modality: AtlasModalityId; selected: string }) {
  const router = useRouter();
  const regions = atlasRegionLinks(modality);
  const name = modality === '3d' ? '3D' : modality.toUpperCase();
  const selectRef = useRef<HTMLSelectElement>(null);
  const selectedHref = regions.find(region => region.id === selected)?.href;

  useEffect(() => {
    let active = true;
    let pendingRestore: number | undefined;
    const restoreSelection = () => {
      // Back/forward cache can restore a pending choice in an uncontrolled form.
      // Only correct the picker when this mounted route still owns the document.
      // The dedicated CT/MRI head document can carry a concept or tour query.
      // Those parameters do not change its region; keep them entirely intact.
      // Query-selected 3D and planned imaging routes still need the exact URL.
      const linkedHeadDocument = selected === 'head-neck' &&
        (modality === 'ct' || modality === 'mri') &&
        window.location.pathname === selectedHref;
      if (active && selectedHref &&
          (window.location.pathname + window.location.search === selectedHref || linkedHeadDocument) &&
          selectRef.current) selectRef.current.value = selected;
    };
    const scheduleRestore = () => {
      if (!active) return;
      restoreSelection();
      if (pendingRestore !== undefined) window.clearTimeout(pendingRestore);
      // Native history restoration can set form values after pageshow dispatch.
      // Recheck the still-owned route on the next task, not just in the event.
      pendingRestore = window.setTimeout(() => {
        pendingRestore = undefined;
        restoreSelection();
      }, 0);
    };
    window.addEventListener('pageshow', scheduleRestore);
    // Covers a history document whose pageshow preceded this subscription.
    // Same-scope rerenders do not resubscribe or clear a user's pending choice.
    scheduleRestore();
    return () => {
      active = false;
      window.removeEventListener('pageshow', scheduleRestore);
      if (pendingRestore !== undefined) window.clearTimeout(pendingRestore);
    };
  }, [modality, selected, selectedHref]);

  return <nav className="atlas-region-navigation" aria-label={`${name} anatomical regions`}>
    <form className="atlas-region-form" key={`${modality}:${selected}`} onSubmit={event => {
      event.preventDefault();
      const choice = event.currentTarget.elements.namedItem('atlas-region') as HTMLSelectElement | null;
      const destination = regions.find(region => region.id === choice?.value);
      if (!destination || destination.id === selected) return;
      // Mount the head model in a fresh document. A client-route transition can
      // leave this embedded viewer at its initial empty about:blank document.
      // Only the explicit Go action navigates; never remount a live model here.
      if (modality === '3d' && destination.id === 'head-neck') {
        window.location.assign(destination.href);
        return;
      }
      router.push(destination.href);
    }}>
    <label className="atlas-region-picker">
      <span>Region</span>
      <select ref={selectRef} name="atlas-region" defaultValue={selected}>
        {regions.map(region => <option key={region.id} value={region.id}>
          {region.label}{region.planned ? ' · in preparation' : ''}
        </option>)}
      </select>
    </label>
    <button className="atlas-region-open" type="submit" aria-label="Open selected anatomical region">Go</button>
    </form>
  </nav>;
}
