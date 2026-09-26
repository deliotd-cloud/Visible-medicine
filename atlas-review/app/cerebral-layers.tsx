import { Button } from '@/atlas-review/components/ui/button';
import { Switch } from '@/atlas-review/components/ui/switch';
import { cerebralGroups, type CerebralStructure } from '@/atlas-review/lib/cerebral';

export function CerebralLayers({
  layers,
  selectedId,
  hidden,
  onSelect,
  onVisibility,
}: {
  layers: CerebralStructure[];
  selectedId: string | null;
  hidden: string[];
  onSelect: (id: string) => void;
  onVisibility: (id: string, visible: boolean) => void;
}) {
  return (
    <div
      className="cerebral-pairs"
      aria-label="Cerebral structure selection and visibility"
    >
      <div className="cerebral-pair-heading" aria-hidden="true">
        <span>Structure</span>
        <span>Left</span>
        <span>Right</span>
      </div>
      {cerebralGroups.map((group) => (
        <div className="cerebral-pair" key={group.id}>
          <span className="cerebral-pair-name">{group.name}</span>
          {['left', 'right'].map((side) => {
            const s = layers.find(
              (v) => v.group === group.id && v.laterality === side,
            );
            return s ? (
              <div key={side} className="cerebral-side">
                <Button
                  size="sm"
                  variant={selectedId === s.id ? 'secondary' : 'ghost'}
                  aria-label={`Select ${s.name.toLowerCase()}`}
                  aria-pressed={selectedId === s.id}
                  onClick={() => onSelect(s.id)}
                >
                  {side === 'left' ? 'L' : 'R'}
                </Button>
                <Switch
                  className="after:inset-x-0"
                  checked={!hidden.includes(s.id)}
                  aria-label={`Show ${s.name.toLowerCase()}`}
                  onCheckedChange={(visible) => onVisibility(s.id, visible)}
                />
              </div>
            ) : (
              <span key={side} aria-label={`${side} source unavailable`}>
                —
              </span>
            );
          })}
        </div>
      ))}
    </div>
  );
}
