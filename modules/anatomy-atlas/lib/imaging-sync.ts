export type ImagingPlane = 'axial' | 'coronal' | 'sagittal';

export type ImagingSyncDetail = {
  structureId: string;
  plane: ImagingPlane;
  normalizedSlice: number;
  source: '3d' | 'imaging';
  /** Reference-anatomy coordinates only; NEVER assume these equal patient coordinates. */
  referencePointLpsMm?: [number, number, number];
  /** Required by future patient adapters after a separately validated registration. */
  frameOfReferenceUid?: string;
};

export const IMAGING_SYNC_EVENT = 'visible-medicine:imaging-sync';

export function emitImagingSync(detail: ImagingSyncDetail) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent<ImagingSyncDetail>(IMAGING_SYNC_EVENT, { detail }));
}

export function subscribeToImagingSync(listener: (detail: ImagingSyncDetail) => void) {
  if (typeof window === 'undefined') return () => undefined;
  const handler = (event: Event) => listener((event as CustomEvent<ImagingSyncDetail>).detail);
  window.addEventListener(IMAGING_SYNC_EVENT, handler);
  return () => window.removeEventListener(IMAGING_SYNC_EVENT, handler);
}
