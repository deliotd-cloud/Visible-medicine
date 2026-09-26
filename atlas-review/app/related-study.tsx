'use client';
import { useId, useState } from 'react';
import { StructureNavigator } from './structure-navigator';
import type { StudyMembership } from '../lib/study-navigation';
import type { BodyStructure } from './body-types';

export function RelatedStudy({
  views,
  selectedId,
  currentFocusId,
  onOpen,
  onSelect,
  detail,
}: {
  views: StudyMembership[];
  selectedId: string;
  currentFocusId: string | null;
  onOpen: (focusId: string) => void;
  onSelect: (id: string) => void;
  detail: (item: BodyStructure) => string;
}) {
  const id = useId();
  const [chosen, setChosen] = useState<string | null>(currentFocusId);
  const view = views.find((item) => item.focusId === chosen) ?? views[0];
  if (!view)
    return (
      <div className="related-study-empty">
        No focused study group is authored for this structure in this region
        yet. Use the structure browser to choose your own comparison.
      </div>
    );
  const targetIds = new Set(view.targets.map((item) => item.id));
  return (
    <details className="related-study">
      <summary id={`${id}-title`}>
        Study together · {views.length} focused{' '}
        {views.length === 1 ? 'view' : 'views'}
      </summary>
      <p>
        Authored study groups, not verified attachments or nerve connections.
        Automatic skeletal background is not listed as a related structure.
      </p>
      <label htmlFor={`${id}-view`}>Focused study view ({views.length})</label>
      <select
        id={`${id}-view`}
        value={view.focusId}
        onChange={(event) => setChosen(event.target.value)}
      >
        {views.map((item) => (
          <option key={item.focusId} value={item.focusId}>
            {item.title}
          </option>
        ))}
      </select>
      <p>
        This selection is a study {view.role}. {view.targets.length} target
        {view.targets.length === 1 ? '' : 's'} · {view.context.length} explicit
        context structure{view.context.length === 1 ? '' : 's'}.
      </p>
      <button type="button" onClick={() => onOpen(view.focusId)}>
        Open study view · keep selection
      </button>
      <small className="related-study-reset">
        Resets cutaway, separation and camera; restores this recipe’s{' '}
        {view.visibleIds.length} structures, including any skeletal background.
        Dissection Undo restores the previous removal state.
      </small>
      <details>
        <summary>Browse study targets & context</summary>
        <StructureNavigator
          key={view.focusId}
          items={[...view.targets, ...view.context]}
          selectedId={selectedId}
          label="Study group structures"
          onSelect={(selected) => {
            setChosen(view.focusId);
            onSelect(selected);
          }}
          detail={(item) =>
            `${targetIds.has(item.id) ? 'Target' : 'Context'} · ${detail(item)}`
          }
        />
      </details>
    </details>
  );
}
