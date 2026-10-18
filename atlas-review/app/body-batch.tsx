'use client';
import { useLayoutEffect, useState } from 'react';
import { useThree } from '@react-three/fiber';
import { bodyBatchLimits, createBodyBatch, type BodyBatch, type BodyBatchSource } from '@/atlas-review/lib/body-batching';

/** Capability-gated, allocation-stable batch. Unsupported devices retain the individual renderer. */
export function useBodyBatch(sources: BodyBatchSource[], renderedCount: number) {
  const gl = useThree(s => s.gl), invalidate = useThree(s => s.invalidate);
  const enabled = renderedCount >= bodyBatchLimits.minSceneSurfaces &&
    gl.extensions.has('WEBGL_multi_draw');
  const [owned, setOwned] = useState<{ sources: BodyBatchSource[]; batch: BodyBatch } | null>(null);
  useLayoutEffect(() => {
    if (!enabled) { setOwned(null); return; }
    let batch: BodyBatch | null = null;
    try { batch = createBodyBatch(sources); } catch { /* Individual surfaces remain available. */ }
    setOwned(batch ? { sources, batch } : null);
    invalidate();
    return () => { batch?.dispose(); };
  }, [sources, enabled, invalidate]);
  return enabled && owned?.sources === sources ? owned.batch : null;
}
