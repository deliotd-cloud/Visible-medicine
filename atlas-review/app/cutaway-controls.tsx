'use client';
import { Button } from '@/atlas-review/components/ui/button';
import { Slider } from '@/atlas-review/components/ui/slider';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/atlas-review/components/ui/select';
import {
  initialInspection,
  sectionAxes,
  type InspectionState,
  type SectionPlane,
} from '@/atlas-review/lib/inspection-state';

export const cutPlanes: Record<SectionPlane, string> = {
  off: 'Off · whole components',
  axial: 'Axial · horizontal',
  coronal: 'Coronal · front–back',
  sagittal: 'Sagittal · right–left',
};

export function CutawayControls({
  value,
  onChange,
  subject = 'Eye',
  positionId = 'eye-layer-cut-position',
}: {
  value: InspectionState;
  onChange: (next: InspectionState) => void;
  subject?: string;
  positionId?: string;
}) {
  const axis = value.plane === 'off' ? null : sectionAxes[value.plane];
  return (
    <details className="eye-layer-cutaway">
      <summary>
        Cutaway · {value.plane === 'off' ? 'Off' : cutPlanes[value.plane]}
      </summary>
      <Select
        value={value.plane}
        onValueChange={(plane) => {
          if (plane && Object.hasOwn(cutPlanes, plane))
            onChange({ ...initialInspection, plane: plane as SectionPlane });
        }}
      >
        <SelectTrigger aria-label={`${subject} cutaway plane`}>
          <SelectValue>{cutPlanes[value.plane]}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          {Object.entries(cutPlanes).map(([plane, label]) => (
            <SelectItem key={plane} value={plane}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {axis && (
        <>
          <label htmlFor={positionId}>Cut position · {value.position}%</label>
          <Slider
            id={positionId}
            aria-label={`${subject} cutaway position`}
            aria-valuetext={`${value.position}% from ${axis.low.toLowerCase()} to ${axis.high.toLowerCase()}`}
            min={0}
            max={100}
            step={1}
            value={[value.position]}
            onValueChange={(values) => {
              const position = Array.isArray(values) ? values[0] : values;
              if (Number.isFinite(position))
                onChange({
                  ...value,
                  position: Math.max(0, Math.min(100, position)),
                });
            }}
          />
          <div className="eye-layer-cut-axis" aria-hidden="true">
            <span>{axis.low}</span>
            <span>{axis.high}</span>
          </div>
          <Button
            size="sm"
            variant="outline"
            aria-label={`Reverse ${subject.toLowerCase()} cutaway side`}
            onClick={() => onChange({ ...value, flipped: !value.flipped })}
          >
            Keep {value.flipped ? axis.low : axis.high} · reverse
          </Button>
          <p>
            Artificial open-surface cut, not a scan or reconstructed tissue. It
            also cuts the selected component and follows separated parts.
          </p>
        </>
      )}
    </details>
  );
}
