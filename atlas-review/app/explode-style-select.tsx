'use client';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/atlas-review/components/ui/select';
import type { BodyLayout } from '@/atlas-review/lib/body-arrangement';
import './explode-style-select.css';

const styles = [
  { value: 'spatial', label: 'Spread' },
  { value: 'extract', label: 'Extract selected' },
  { value: 'tray', label: 'Tray' },
] as const;

export function ExplodeStyleSelect({
  value,
  disabled,
  onChange,
}: {
  value: BodyLayout;
  disabled: boolean;
  onChange: (value: BodyLayout) => void;
}) {
  return (
    <Select
      value={value}
      items={styles}
      disabled={disabled}
      onValueChange={(next) => {
        if (!disabled && styles.some((style) => style.value === next))
          onChange(next as BodyLayout);
      }}
    >
      <SelectTrigger
        className="vm-explode-style"
        aria-label="Explode style"
        title="Choose how structures separate"
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent className="vm-explode-menu" alignItemWithTrigger={false}>
        {styles.map((style) => (
          <SelectItem key={style.value} value={style.value}>
            {style.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
