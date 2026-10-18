'use client';
import { Button } from '@/atlas-review/components/ui/button';
import type { SelectionVisibility } from '@/atlas-review/lib/selection-visibility';
import './selection-visibility.css';

export function SelectionVisibilityNotice({
  name,
  report,
  onRecover,
  onReapply,
}: {
  name: string;
  report: SelectionVisibility | null;
  onRecover: () => void;
  onReapply: () => void;
}) {
  if (!report || (!report.reasons.length && !report.uncut)) return null;
  return (
    <div className="vm-selection-visibility">
      <output aria-live="polite" aria-atomic="true">
        <strong>{name}</strong>
        <span>
          {report.reasons.length
            ? report.reasons.join(' · ')
            : 'Selected structure kept uncut; other structures still follow the cutaway.'}
        </span>
      </output>
      <Button
        size="sm"
        variant="outline"
        onClick={report.reasons.length ? onRecover : onReapply}
      >
        {report.reasons.length ? 'Reveal selection' : 'Reapply cutaway'}
      </Button>
    </div>
  );
}
