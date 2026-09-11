'use client';
import {
  useEffect,
  useId,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from 'react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  comparisonAvailability,
  comparisonBridge,
  imagePlanes,
  type ComparisonSnapshot,
  type ImagePlane,
} from '@/lib/imaging-comparison';
import type { AnatomyLinkEntry } from '@/lib/anatomy-link-registry';
import type { useImagingLink } from './imaging-link';
import './imaging-comparison.css';

const serverSnapshot = () => null;
export const comparisonMessages = {
  disconnected: 'The comparison viewer is disconnected.',
  paused: 'Linked selection is paused. Enable it in Imaging link to compare.',
  'select-structure': 'Select a structure in the anatomy viewer.',
  'source-mismatch':
    'The mapped anatomy revision has changed. This image is withheld until the mapping is reviewed.',
  loading: 'Loading the selected teaching image…',
  unmapped:
    'No teaching image is mapped to this selection. No image has been substituted.',
  'access-denied':
    'This imaging resource is not included in your current access. Your atlas remains available.',
  error:
    'The imaging viewer could not display this frame. Your anatomy view is unchanged.',
};
function ImageSurface({ snapshot }: { snapshot: ComparisonSnapshot }) {
  const host = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const element = host.current;
    if (!element) return;
    const dispose = comparisonBridge.mount(element, snapshot);
    return () => {
      dispose();
      element.replaceChildren();
    };
  }, [snapshot]);
  return (
    <div
      className="vm-comparison-surface"
      ref={host}
      aria-label={`${snapshot.modality} ${snapshot.frame.plane} teaching image`}
    />
  );
}
export function ComparisonPanel({
  snapshot,
  status,
}: {
  snapshot: ComparisonSnapshot;
  status: ReturnType<typeof comparisonAvailability>;
}) {
  const frame = snapshot.frame;
  return (
    <>
      <p className="vm-comparison-boundary">
        Teaching comparison · not spatially registered
      </p>
      {status !== 'ready' ? (
        <p className="vm-comparison-message" role="status">
          {comparisonMessages[status]}
        </p>
      ) : (
        <>
          <div className="vm-comparison-plane">
            <Select
              value={frame.plane}
              onValueChange={(value) => {
                if (imagePlanes.includes(value as ImagePlane))
                  comparisonBridge.request(snapshot, {
                    plane: value as ImagePlane,
                  });
              }}
            >
              <SelectTrigger aria-label="Imaging plane">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {imagePlanes.map((plane) => (
                  <SelectItem key={plane} value={plane}>
                    {plane[0].toUpperCase() + plane.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span>
              {snapshot.modality} · {frame.slice + 1} / {frame.sliceCount}
            </span>
          </div>
          <ImageSurface snapshot={snapshot} />
          <div className="vm-comparison-slices">
            <Button
              variant="outline"
              aria-label="Previous image slice"
              disabled={frame.slice === 0}
              onClick={() =>
                comparisonBridge.request(snapshot, { slice: frame.slice - 1 })
              }
            >
              −
            </Button>
            <Slider
              aria-label="Image slice"
              min={0}
              max={Math.max(1, frame.sliceCount - 1)}
              step={1}
              value={[frame.slice]}
              disabled={frame.sliceCount === 1}
              onValueChange={(value) =>
                comparisonBridge.request(snapshot, {
                  slice: Array.isArray(value) ? value[0] : value,
                })
              }
            />
            <Button
              variant="outline"
              aria-label="Next image slice"
              disabled={frame.slice === frame.sliceCount - 1}
              onClick={() =>
                comparisonBridge.request(snapshot, { slice: frame.slice + 1 })
              }
            >
              +
            </Button>
          </div>
        </>
      )}
    </>
  );
}
/** The model subtree never unmounts when comparison is opened or closed. */
export function ImagingComparisonWorkspace({
  children,
  selected,
  link,
}: {
  children: ReactNode;
  selected: AnatomyLinkEntry | null;
  link: ReturnType<typeof useImagingLink>;
}) {
  const snapshot = useSyncExternalStore(
    comparisonBridge.subscribe,
    comparisonBridge.getSnapshot,
    serverSnapshot,
  );
  const [opened, setOpened] = useState(false);
  const [mobilePane, setMobilePane] = useState('model');
  const toggle = useRef<HTMLButtonElement>(null);
  const panelId = useId();
  const connected = !!snapshot && snapshot.adapterId === link.adapter?.id;
  const open = opened && connected && !link.disabled;
  const status = comparisonAvailability(
    snapshot,
    selected,
    link.adapter?.id ?? null,
    link.enabled,
    link.disabled,
  );
  useEffect(() => {
    if (!connected || link.disabled) {
      setOpened(false);
      setMobilePane('model');
    }
  }, [connected, link.disabled]);
  return (
    <div
      className="vm-comparison"
      data-open={open}
      data-mobile-pane={mobilePane}
    >
      {connected && !link.disabled && (
        <div className="vm-comparison-toolbar">
          <Button
            ref={toggle}
            variant="outline"
            aria-expanded={open}
            aria-controls={panelId}
            onClick={() => {
              setOpened(!open);
              setMobilePane('model');
            }}
          >
            {open ? 'Close comparison' : `Compare ${snapshot.modality}`}
          </Button>
          {open && (
            <>
              <span className="vm-comparison-label">{snapshot.label}</span>
              <RadioGroup
                className="vm-comparison-mobile-choice"
                aria-label="Visible comparison pane"
                value={mobilePane}
                onValueChange={setMobilePane}
              >
                {['model', 'image'].map((pane) => (
                  <label key={pane}>
                    <RadioGroupItem value={pane} />
                    {pane === 'model' ? 'Anatomy' : snapshot.modality}
                  </label>
                ))}
              </RadioGroup>
            </>
          )}
        </div>
      )}
      <div className="vm-comparison-model">{children}</div>
      <section
        id={panelId}
        className="vm-comparison-image"
        aria-label="Imaging comparison"
        hidden={!open}
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            event.stopPropagation();
            setOpened(false);
            toggle.current?.focus();
          }
        }}
      >
        {open && snapshot && (
          <ComparisonPanel snapshot={snapshot} status={status} />
        )}
      </section>
    </div>
  );
}
