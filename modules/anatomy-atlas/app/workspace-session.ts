'use client';
import { useCallback, useMemo, useRef, useState } from 'react';
import type { WorkspaceMode } from '@/lib/atlas-navigation';

/** Local display snapshots only. Selection, teaching, entitlements and scans are not copied. */
export function useWorkspaceSession<T>(capture: () => T, restore: (state: T) => void, initial: (mode: WorkspaceMode) => T) {
  const [mode, setMode] = useState<WorkspaceMode>('explore');
  const saved = useRef<Partial<Record<WorkspaceMode, T>>>({});
  const current = useRef({ mode, capture, restore, initial });
  current.current = { mode, capture, restore, initial };
  const chooseMode = useCallback((next: WorkspaceMode) => {
    const active = current.current;
    if (next === active.mode) return;
    // Practice is a temporary working view; never overwrite the saved learning modes.
    if (active.mode !== 'practice') saved.current[active.mode] = structuredClone(active.capture());
    if (next !== 'practice') active.restore(structuredClone(saved.current[next] ?? active.initial(next)));
    current.current.mode = next;
    setMode(next);
  }, []);
  return useMemo(() => ({ mode, chooseMode }), [mode, chooseMode]);
}
