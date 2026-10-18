'use client';
import { useId, useMemo, useState } from 'react';
import { Button } from '@/atlas-review/components/ui/button';
import { bodySystems, type BodyStructure, type BodySystem } from './body-types';
import type { DissectionProfile, DissectionState } from './dissection-data';
import {
  studyLibrary,
  filterStudyLibrary,
  studyRecipePreview,
  studyRecipeActive,
  studyLibraryAction,
  type StudyRecipe,
  type StudyLibrarySort,
} from '@/atlas-review/lib/study-library';

export function StudyLibrary({
  profile,
  state,
  structures,
  visibleIds,
  loaded,
  failed,
  disabled,
  onStage,
  onFocus,
}: {
  profile: DissectionProfile;
  state: DissectionState;
  structures: BodyStructure[];
  visibleIds: string[];
  loaded: string[];
  failed: string[];
  disabled: boolean;
  onStage: (id: string) => void;
  onFocus: (id: string) => void;
}) {
  const controlId = useId();
  const [query, setQuery] = useState('');
  const [system, setSystem] = useState<BodySystem | 'all'>('all');
  const [kind, setKind] = useState<StudyRecipe['kind'] | 'all'>('all');
  const [sort, setSort] = useState<StudyLibrarySort>('authored');
  const [expanded, setExpanded] = useState<string | null>(null);
  const cards = useMemo(
    () => studyLibrary(structures, profile),
    [structures, profile],
  );
  const matches = useMemo(
    () => filterStudyLibrary(cards, query, system, kind, sort),
    [cards, query, system, kind, sort],
  );
  const selected = matches.find((card) => card.key === expanded);
  const selectedPreview = selected
    ? studyRecipePreview(
        selected.recipes[0],
        structures,
        visibleIds,
        loaded,
        failed,
      )
    : null;
  function open(key: string) {
    const action = studyLibraryAction(structures, profile, key, disabled);
    if (!action) return;
    if (action.kind === 'focus') onFocus(action.id);
    else onStage(action.id);
  }
  if (disabled)
    return (
      <p className="study-library-notice">
        End practice to browse study views.
      </p>
    );
  return (
    <section className="study-library" aria-label="Study view library">
      <div className="study-library-filters">
        <label className="study-library-search" htmlFor={`${controlId}-search`}>
          Find a study view
          <input
            id={`${controlId}-search`}
            type="search"
            maxLength={256}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="View name, included structure or FMA ID…"
          />
        </label>
        <label htmlFor={`${controlId}-system`}>
          Includes system
          <select
            id={`${controlId}-system`}
            value={system}
            onChange={(event) =>
              setSystem(event.target.value as BodySystem | 'all')
            }
          >
            <option value="all">All systems</option>
            {(Object.keys(bodySystems) as BodySystem[]).map((id) => (
              <option key={id} value={id}>
                {bodySystems[id].name}
              </option>
            ))}
          </select>
        </label>
        <label htmlFor={`${controlId}-kind`}>
          View type
          <select
            id={`${controlId}-kind`}
            value={kind}
            onChange={(event) =>
              setKind(event.target.value as StudyRecipe['kind'] | 'all')
            }
          >
            <option value="all">Windows & focuses</option>
            <option value="window">Study windows</option>
            <option value="focus">Compartment focuses</option>
          </select>
        </label>
        <label htmlFor={`${controlId}-sort`}>
          Order
          <select
            id={`${controlId}-sort`}
            value={sort}
            onChange={(event) =>
              setSort(event.target.value as StudyLibrarySort)
            }
          >
            <option value="authored">Authored order</option>
            <option value="small-first">Fewest structures first</option>
            <option value="large-first">Broadest views first</option>
            <option value="name">Name A–Z</option>
          </select>
        </label>
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            setQuery('');
            setSystem('all');
            setKind('all');
            setSort('authored');
          }}
        >
          Clear filters
        </Button>
      </div>
      <p className="study-library-help">
        Search includes retained context. Preview a view before opening it;
        these are independent study choices, not successive tissue depths.
      </p>
      <output
        className="study-library-status"
        aria-live="polite"
        aria-atomic="true"
      >
        {matches.length} of {cards.length} study groups match.
        {selectedPreview && selected
          ? ` Preview: ${selected.title}. ${selectedPreview.hide.length} to hide, ${selectedPreview.restore.length} to restore.`
          : ''}
      </output>
      <ul className="study-library-list" aria-label="Available study views">
        {matches.map((card) => {
          const first = card.recipes[0],
            show = expanded === card.key;
          const active = card.recipes.some((recipe) =>
            studyRecipeActive(recipe, state),
          );
          const focus = card.recipes.find((recipe) => recipe.kind === 'focus');
          const targets = new Set(focus?.targets?.map((item) => item.id));
          const preview = show
            ? studyRecipePreview(first, structures, visibleIds, loaded, failed)
            : null;
          const panelId = `${controlId}-${card.key}`;
          return (
            <li
              key={card.key}
              className={
                active ? 'study-library-card active' : 'study-library-card'
              }
            >
              <button
                type="button"
                className="study-library-summary"
                aria-expanded={show}
                aria-controls={panelId}
                onClick={() => setExpanded(show ? null : card.key)}
              >
                <span>
                  <strong>{card.title}</strong>
                  <small>
                    {card.recipes
                      .map((recipe) =>
                        recipe.kind === 'focus'
                          ? 'Compartment focus'
                          : 'Study window',
                      )
                      .join(' · ')}{' '}
                    · {first.visible.length} retained
                  </small>
                </span>
                <span className="study-library-tag">
                  {active
                    ? 'Active recipe'
                    : show
                      ? 'Close preview'
                      : 'Preview'}
                </span>
              </button>
              <div
                id={panelId}
                className="study-library-preview"
                hidden={!show}
              >
                {show && preview && (
                  <>
                    <p>{first.description}</p>
                    <p className="study-library-inspect">{first.inspect}</p>
                    <dl className="study-library-counts">
                      <div>
                        <dt>Hide</dt>
                        <dd>{preview.hide.length}</dd>
                      </div>
                      <div>
                        <dt>Restore</dt>
                        <dd>{preview.restore.length}</dd>
                      </div>
                      <div>
                        <dt>Keep</dt>
                        <dd>{preview.keep.length}</dd>
                      </div>
                    </dl>
                    <p className="study-library-help">
                      {preview.loaded.length}/{first.visible.length} retained
                      entries loaded · {preview.waiting.length} not loaded ·{' '}
                      {preview.failed.length} failed. Counts describe catalogue
                      entries, not screen occlusion.
                    </p>
                    {focus && (
                      <p className="study-library-help">
                        {focus.targets?.length} focus targets ·{' '}
                        {first.visible.length - targets.size} context entries.
                        Context may include automatic skeletal background;
                        grouping does not establish an anatomical connection.
                      </p>
                    )}
                    <details className="study-library-members">
                      <summary>
                        Retained structures ({first.visible.length})
                      </summary>
                      <ul>
                        {first.visible.map((item) => (
                          <li key={item.id}>
                            <span>{item.name}</span>
                            <small>
                              {item.fmaId}
                              {focus
                                ? targets.has(item.id)
                                  ? ' · Target'
                                  : ' · Context'
                                : ''}
                            </small>
                          </li>
                        ))}
                      </ul>
                    </details>
                    <p className="study-library-reset">
                      Opening a view clears manual removals, system filters,
                      selection, cutaway and separation, then frames its preset.
                      Browsing changes none of these.
                    </p>
                    <div className="study-library-actions">
                      {card.recipes.map((recipe) => (
                        <Button
                          key={recipe.key}
                          size="sm"
                          variant={
                            recipe.kind === 'focus' ? 'default' : 'outline'
                          }
                          disabled={!recipe.available}
                          onClick={() => open(recipe.key)}
                        >
                          {recipe.kind === 'focus'
                            ? 'Open compartment focus'
                            : 'Open study window'}
                        </Button>
                      ))}
                    </div>
                    {!card.recipes.some((recipe) => recipe.available) && (
                      <p className="study-library-notice">
                        No eligible targets in the current side/region. Change
                        the side filter to inspect the available source anatomy.
                      </p>
                    )}
                  </>
                )}
              </div>
            </li>
          );
        })}
      </ul>
      {!matches.length && (
        <p className="study-library-notice">
          No study views match. Clear the filters or try an included structure
          name.
        </p>
      )}
    </section>
  );
}
