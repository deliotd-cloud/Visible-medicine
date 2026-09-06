'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight, Compass } from 'lucide-react';
import type { DissectionView } from './dissection-data';
import { filterRemovedStructures } from '@/lib/dissection-workbench';
import {
  dissectionOrientation,
  guideAvailabilityText,
  guidanceRecipeAction,
  type DissectionGuidance,
} from '@/lib/dissection-guidance';

export function DissectionOrientation({
  guide,
  side,
  view,
  onOrient,
  onSelect,
  onRecipe,
  disabled = false,
}: {
  guide: DissectionGuidance;
  side: string;
  view: DissectionView;
  onOrient: () => void;
  onSelect: (id: string) => void;
  onRecipe: (kind: 'recipe' | 'next') => void;
  disabled?: boolean;
}) {
  const [query, setQuery] = useState('');
  if (disabled) return null;
  const matchedIds = new Set(
    filterRemovedStructures(guide.expected, query).map((s) => s.id),
  );
  const matches = guide.members.filter(({ structure }) =>
    matchedIds.has(structure.id),
  );
  const recipeAction = guidanceRecipeAction(guide, 'recipe', disabled);
  const changed = guide.missing.length > 0 || guide.added.length > 0;
  return (
    <div className="dissection-orientation">
      <div className="dissection-orientation-heading">
        <Compass aria-hidden="true" />
        <strong>Orient this dissection</strong>
      </div>
      <p>
        {side === 'both'
          ? 'Both sides'
          : side === 'left'
            ? 'Left-side scope'
            : 'Right-side scope'}{' '}
        · midline, unpaired and source-unspecified entries remain included.
      </p>
      <dl>
        <div>
          <dt>Camera preset</dt>
          <dd>{dissectionOrientation[view]}</dd>
        </div>
        {guide.recipe && (
          <div>
            <dt>Recipe orientation</dt>
            <dd>{dissectionOrientation[guide.recipe.view]}</dd>
          </div>
        )}
      </dl>
      <p className="dissection-guidance-note">
        Free rotation can differ from the preset. Reorient resets pan, zoom and
        selected-only framing; tissue visibility and separation amount stay
        unchanged.
      </p>
      <Button variant="outline" size="sm" onClick={onOrient}>
        <Compass />
        Reorient {guide.recipe ? 'to recipe' : 'to preset'}
      </Button>
      <details className="dissection-view-inventory">
        <summary>
          What is in this view?{' '}
          <span>{guide.visible.length} enabled entries</span>
        </summary>
        <p>
          {guide.counts.ready} ready · {guide.counts.pending} loading ·{' '}
          {guide.counts.failed} unavailable. {guide.counts.removed} removed ·{' '}
          {guide.counts.systemOff} system off.
        </p>
        <p className="dissection-guidance-note">
          Counts are catalogue entries, not visible pixels. Ghosting, fading,
          clipping and separation do not change these counts.
        </p>
        {guide.recipe ? (
          <>
            <p>
              {changed
                ? `${guide.missing.length} recipe entries omitted · ${guide.added.length} extra entries enabled.`
                : 'Enabled entries match the recipe.'}
            </p>
            {guide.targets && (
              <p>
                {guide.targets.length} recipe targets ·{' '}
                {guide.context?.length ?? 0} context entries in the clean
                recipe. Context is a study grouping, not a validated anatomical
                relationship.
              </p>
            )}
            {changed && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onRecipe('recipe')}
                  disabled={!recipeAction}
                >
                  Reopen clean recipe
                </Button>
                <p className="dissection-guidance-note">
                  Restores the recipe, enables systems and resets manual edits,
                  cutaways and separation. Failed downloads may still need Retry
                  missing anatomy.
                </p>
              </>
            )}
            <label className="dissection-member-search">
              <span>Find a recipe member</span>
              <input
                type="search"
                value={query}
                maxLength={256}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Name or FMA ID"
              />
            </label>
            <output aria-live="polite">
              {matches.length} of {guide.members.length} recipe entries match.
            </output>
            <ul className="dissection-member-list">
              {matches.map(({ structure: s, status, role }) => (
                <li key={s.id}>
                  <button type="button" onClick={() => onSelect(s.id)}>
                    <span>{s.name}</span>
                    <small>
                      {role === 'member'
                        ? 'Recipe member'
                        : role === 'target'
                          ? 'Target'
                          : 'Context'}{' '}
                      · {guideAvailabilityText[status]}
                    </small>
                    <small>{s.fmaId}</small>
                  </button>
                </li>
              ))}
            </ul>
            {!matches.length && (
              <p>
                No recipe members match. Clear the search or choose another
                view.
              </p>
            )}
          </>
        ) : (
          <p>
            Free exploration has no fixed recipe. Reassemble to restart the
            region, or choose a study window.
          </p>
        )}
      </details>
      {guide.next && (
        <div className="dissection-next-guidance">
          <strong>Next layer: {guide.next.stage.title}</strong>
          <p>
            {guide.next.removed.length} to hide · {guide.next.restored.length}{' '}
            to restore · {guide.next.retained.length} retained.
          </p>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onRecipe('next')}
            disabled={!guidanceRecipeAction(guide, 'next', disabled)}
          >
            Open next layer
            <ArrowRight />
          </Button>
          <p className="dissection-guidance-note">
            Starts a clean recipe; manual edits, system filters, cutaways and
            separation reset. This is a visibility sequence, not an operative
            order.
          </p>
        </div>
      )}
      {guide.finalLayer && (
        <p>
          Final layer reached. Step back, reassemble or choose an independent
          study window.
        </p>
      )}
      {guide.landmarks.length > 0 && (
        <div className="dissection-landmarks" aria-label="Stage landmarks">
          {guide.landmarks.map(({ structure: s, status }) => (
            <button type="button" key={s.id} onClick={() => onSelect(s.id)}>
              <span>{s.name}</span>
              <small>{guideAvailabilityText[status]}</small>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
