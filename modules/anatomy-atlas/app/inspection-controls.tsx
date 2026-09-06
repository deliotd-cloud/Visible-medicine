'use client';
import { useId } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  initialInspection,
  sectionAxes,
  type InspectionState,
  type SectionPlane,
} from '@/lib/inspection-state';
import './inspection.css';

export function InspectionControls({
  value,
  onChange,
  systems,
  plate,
  onPlate,
  disabled = false,
}: {
  value: InspectionState;
  onChange: (value: InspectionState) => void;
  systems: { id: string; name: string; enabled: boolean }[];
  plate: boolean;
  onPlate: (value: boolean) => void;
  disabled?: boolean;
}) {
  const axis = value.plane === 'off' ? null : sectionAxes[value.plane];
  const id = useId();
  return (
    <details className="vm-inspection">
      <summary>
        Inspect deeper{' '}
        <span>
          {axis
            ? `${value.plane} cutaway`
            : 'Cutaway · transparency · illustration view'}
        </span>
      </summary>
      <fieldset disabled={disabled}>
        <legend className="sr-only">Anatomy inspection controls</legend>
        <div className="vm-inspection-grid">
          <div>
            <h3>Cutaway plane</h3>
            <Select
              disabled={disabled}
              value={value.plane}
              onValueChange={(plane) =>
                plane && onChange({ ...value, plane: plane as SectionPlane })
              }
            >
              <SelectTrigger aria-label="Cutaway plane">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="off">No cutaway</SelectItem>
                <SelectItem value="axial">Axial — horizontal</SelectItem>
                <SelectItem value="coronal">Coronal — front / back</SelectItem>
                <SelectItem value="sagittal">
                  Sagittal — right / left
                </SelectItem>
              </SelectContent>
            </Select>
            {axis && (
              <>
                <div className="vm-inspection-scale">
                  <span>{axis.low}</span>
                  <output>{value.position}%</output>
                  <span>{axis.high}</span>
                </div>
                <Slider
                  disabled={disabled}
                  value={[value.position]}
                  min={0}
                  max={100}
                  step={1}
                  aria-label={`${value.plane} cutaway position`}
                  onValueChange={(v) =>
                    onChange({
                      ...value,
                      position: Array.isArray(v) ? v[0] : v,
                    })
                  }
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    onChange({ ...value, flipped: !value.flipped })
                  }
                >
                  Keep{' '}
                  {value.flipped
                    ? axis.low.toLowerCase()
                    : axis.high.toLowerCase()}{' '}
                  side · reverse
                </Button>
                <p>
                  Open surface cutaway, not a scan or a reconstruction of
                  internal tissue. Cuts follow each structure during explode.
                </p>
              </>
            )}
          </div>
          <div>
            <h3>Tissue opacity</h3>
            {systems.map((system) => (
              <div className="vm-opacity" key={system.id}>
                <div>
                  <span>
                    {system.name}
                    {!system.enabled && ' · hidden'}
                  </span>
                  <output>{value.opacity[system.id] ?? 100}%</output>
                </div>
                <Slider
                  min={5}
                  max={100}
                  step={5}
                  value={[value.opacity[system.id] ?? 100]}
                  disabled={!system.enabled || disabled}
                  aria-label={`${system.name} opacity`}
                  onValueChange={(v) =>
                    onChange({
                      ...value,
                      opacity: {
                        ...value.opacity,
                        [system.id]: Array.isArray(v) ? v[0] : v,
                      },
                    })
                  }
                />
              </div>
            ))}
            <p>
              Below 20%, clicks pass through to deeper surfaces. Search can
              still select these tissues.
            </p>
          </div>
        </div>
        <div className="vm-inspection-options">
          <label htmlFor={`${id}-solid`}>
            <Switch
              id={`${id}-solid`}
              disabled={disabled}
              checked={value.keepSelectedSolid}
              onCheckedChange={(checked) =>
                onChange({ ...value, keepSelectedSolid: checked })
              }
              aria-label="Keep selected structure opaque"
            />
            Keep selection solid
          </label>
          <label htmlFor={`${id}-plate`}>
            <Switch
              id={`${id}-plate`}
              disabled={disabled}
              checked={plate}
              onCheckedChange={onPlate}
              aria-label="Orthographic illustration view"
            />
            Orthographic illustration
          </label>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              onChange(initialInspection);
              onPlate(false);
            }}
          >
            Reset inspection
          </Button>
        </div>
      </fieldset>
      {disabled && (
        <p>Inspection settings are suspended during identification practice.</p>
      )}
    </details>
  );
}
