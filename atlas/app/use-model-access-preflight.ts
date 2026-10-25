'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { containedModelPreflight, modelPreflightSignature, type PreflightDecision } from '@/lib/model-access-preflight';
import { modelDeliveryUrl } from '@/lib/model-delivery';

type Bundle = { id: string; url: string; sha256: string };
type Epoch = { signature: string };
type Result = { epoch: Epoch; decision: PreflightDecision };

/** Only a contained scene probes. Retry and scene-scope changes get a new epoch. */
export function useModelAccessPreflight(
  assetBase: string | undefined,
  bundles: readonly Bundle[],
  scopeKey: string,
  retries: Record<string, number> | undefined,
  onFailure: (id: string, reason: 'sign-in' | 'access-denied') => void,
) {
  const signature = modelPreflightSignature(assetBase, scopeKey, bundles, retries);
  // An A→B→A transition creates a new object even when its string equals old A.
  const epoch = useMemo<Epoch>(() => ({ signature }), [signature]);
  const [result, setResult] = useState<Result | null>(null);
  const reported = useRef<Epoch | null>(null);
  const firstUrl = bundles.length ? modelDeliveryUrl(bundles[0].url, assetBase) : null;
  useEffect(() => {
    if (!assetBase || !firstUrl) return;
    const controller = new AbortController();
    void containedModelPreflight(assetBase, firstUrl, window.location.origin, controller.signal)
      .then(decision => { if (!controller.signal.aborted) setResult({ epoch, decision }); });
    return () => controller.abort();
  }, [assetBase, firstUrl, epoch]);
  const decision = !assetBase || !firstUrl ? 'proceed' : result?.epoch === epoch ? result.decision : null;
  useEffect(() => {
    if ((decision !== 'sign-in' && decision !== 'access-denied') || reported.current === epoch) return;
    reported.current = epoch;
    for (const bundle of bundles) onFailure(bundle.id, decision);
  }, [decision, epoch, bundles, onFailure]);
  return decision === 'proceed';
}
