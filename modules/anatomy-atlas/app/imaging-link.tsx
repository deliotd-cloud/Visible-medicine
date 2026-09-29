'use client';
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import {
  createAtlasReceiver,
  imagingBridge,
  type AdapterInfo,
  type createImagingBridge,
} from '@/lib/imaging-sync';
import {
  type AnatomyLinkEntry,
  type SelectionResolution,
} from '@/lib/anatomy-link-registry';
import './imaging-link.css';

export function useImagingLink({
  entries,
  allowedIds,
  disabled,
  onSelect,
  bridge = imagingBridge,
}: {
  entries: AnatomyLinkEntry[];
  allowedIds: string[];
  disabled: boolean;
  onSelect: (id: string) => void;
  bridge?: ReturnType<typeof createImagingBridge>;
}) {
  const [enabled, setEnabled] = useState(false);
  const [adapter, setAdapter] = useState<AdapterInfo | null>(null);
  const [notice, setNotice] = useState('');
  const [choice, setChoice] = useState<SelectionResolution | null>(null);
  const current = useRef({ entries, allowedIds, disabled, onSelect, enabled });
  useLayoutEffect(() => {
    current.current = { entries, allowedIds, disabled, onSelect, enabled };
  });
  useEffect(() => {
    const update = () => {
      setAdapter(bridge.getAdapter());
      setEnabled(false);
      current.current.enabled = false;
      setChoice(null);
      setNotice('');
    };
    update();
    const unsubscribe = bridge.subscribe(update);
    const detach = bridge.attachAtlas(
      createAtlasReceiver(
        () => current.current,
        (resolution) => {
          setChoice(
            resolution.status === 'choice-required' ? resolution : null,
          );
          if (resolution.status === 'selected') {
            setNotice(
              `Selected ${resolution.candidates[0].name} from the linked viewer.`,
            );
          } else
            setNotice(
              resolution.status === 'out-of-scope'
                ? 'This structure is outside the current region or side. Change the atlas scope and send the selection again.'
                : resolution.status === 'unknown-structure'
                  ? 'This identity is not available in this atlas view. No anatomy was substituted.'
                  : resolution.mapping === 'aggregate'
                    ? 'This view represents that component within a larger structure. Choose whether to show the group.'
                    : 'This structure has separately selectable parts here. Choose a part; none has been selected automatically.',
            );
        },
      ),
    );
    return () => {
      unsubscribe();
      detach();
    };
  }, [bridge]);
  const publish = useCallback((id: string) => {
    if (!current.current.enabled || current.current.disabled) return;
    if (!current.current.allowedIds.includes(id)) return;
    setChoice(null);
    const entry = current.current.entries.find((entry) => entry.id === id);
    if (entry && bridge.publish(entry))
      setNotice(
        `Sent ${entry.name} to the linked viewer. Selection only; no patient alignment.`,
      );
  }, [bridge]);
  function choose(id: string) {
    if (
      !enabled ||
      disabled ||
      !adapter ||
      !choice?.candidates.some((c) => c.id === id) ||
      !allowedIds.includes(id)
    )
      return;
    onSelect(id);
    setChoice(null);
    publish(id);
  }
  return {
    enabled,
    adapter,
    notice,
    choice,
    disabled,
    publish,
    choose,
    setEnabled(value: boolean) {
      current.current.enabled = value;
      setEnabled(value);
      setChoice(null);
      setNotice('');
    },
    clearChoice() {
      setChoice(null);
    },
    allowedIds,
  };
}
export function ImagingLink({
  link,
}: {
  link: ReturnType<typeof useImagingLink>;
}) {
  const candidates =
    link.choice?.candidates.filter((c) => link.allowedIds.includes(c.id)) ?? [];
  const active = !!link.adapter && link.enabled && !link.disabled;
  return (
    <details className="vm-imaging-link">
      <summary>
        Imaging link{' '}
        <span>
          {!link.adapter
            ? 'Not connected'
            : active
              ? 'Selection linked'
              : 'Selection paused'}
        </span>
      </summary>
      <div className="vm-imaging-content">
        <p>
          Link Didanix Education to select corresponding CT, MRI, X-ray or
          ultrasound anatomy in either direction.
        </p>
        {link.adapter ? (
          <p>
            <strong>{link.adapter.label}</strong> · {link.adapter.modality}{' '}
            adapter registered. This status does not verify that a study is
            loaded.
          </p>
        ) : (
          <p>
            No imaging viewer is connected. Reference anatomy remains available
            on its own.
          </p>
        )}
        <label>
          <input
            type="checkbox"
            checked={link.enabled}
            disabled={!link.adapter || link.disabled}
            onChange={(event) => link.setEnabled(event.target.checked)}
          />{' '}
          Allow linked structure selection
        </label>
        <p className="vm-imaging-boundary">
          Selection only · no patient registration. Reference points are
          assembled source-model millimetres, not patient coordinates or
          measured landmarks. No scans are included.
        </p>
        {link.disabled && <p>Linked selection is paused in this view. Return to a loaded, unfiltered exploration view to reconnect.</p>}
        <output aria-live="polite">{!link.disabled && link.notice}</output>
        {active && candidates.length > 0 && (
          <div className="vm-imaging-choices">
            {candidates.map((candidate) => (
              <button
                type="button"
                key={candidate.id}
                onClick={() => link.choose(candidate.id)}
              >
                {candidate.name}
              </button>
            ))}
            <button type="button" onClick={() => link.clearChoice()}>
              Dismiss choice
            </button>
          </div>
        )}
      </div>
    </details>
  );
}
