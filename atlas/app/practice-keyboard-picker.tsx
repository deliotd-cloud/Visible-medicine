import { Button } from '@/components/ui/button';

type PracticeKeyboardPickerProps = {
  /** Eligible structures in current scene/catalogue order, independent of question order. */
  ids: readonly string[];
  activeId: string | null;
  disabled: boolean;
  onPreview: (id: string | null) => void;
  onAnswer: (id: string) => void;
};

/** An unnamed, keyboard-operable way to inspect a 3D target before answering. */
export function PracticeKeyboardPicker({
  ids,
  activeId,
  disabled,
  onPreview,
  onAnswer,
}: PracticeKeyboardPickerProps) {
  const activeIndex = activeId === null ? -1 : ids.indexOf(activeId);
  const hasChoices = ids.length > 0;
  const canChoose = !disabled && activeIndex >= 0;

  const preview = (direction: -1 | 1) => {
    if (disabled || !hasChoices) return;
    const nextIndex = activeIndex < 0
      ? direction === 1 ? 0 : ids.length - 1
      : (activeIndex + direction + ids.length) % ids.length;
    onPreview(ids[nextIndex]);
  };

  return (
    <details
      className="vm-practice-options vm-practice-keyboard-picker"
      onToggle={event => {
        if (event.target === event.currentTarget && !event.currentTarget.open)
          onPreview(null);
      }}
    >
      <summary>Keyboard selection</summary>
      <p>Previous and next highlight visible anatomy without its name. Inspect the highlight, then choose it.</p>
      <p role="status" aria-live="polite">
        {activeIndex >= 0
          ? `Structure ${activeIndex + 1} of ${ids.length}`
          : hasChoices ? 'No structure highlighted yet.' : 'No visible structures to choose.'}
      </p>
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" disabled={disabled || !hasChoices} onClick={() => preview(-1)}>
          Previous structure
        </Button>
        <Button type="button" variant="outline" disabled={disabled || !hasChoices} onClick={() => preview(1)}>
          Next structure
        </Button>
        <Button type="button" disabled={!canChoose} onClick={() => {
          if (disabled || activeIndex < 0) return;
          onAnswer(ids[activeIndex]);
        }}>
          Choose highlighted
        </Button>
      </div>
    </details>
  );
}
