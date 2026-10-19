'use client';
import { useId, useMemo, useRef, useState } from 'react';
import { bodySystems, type BodyStructure, type BodySystem } from './body-types';
import {
  filterStudyStructures,
  structureNavigationIndex,
} from '../lib/study-navigation';

/** Native buttons with roving focus: arrows never reveal or select anatomy. */
export function StructureNavigator({
  items,
  selectedId,
  onSelect,
  label,
  detail,
  enabledIds,
}: {
  items: BodyStructure[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  label: string;
  detail: (item: BodyStructure) => string;
  enabledIds?: ReadonlySet<string>;
}) {
  const id = useId();
  const box = useRef<HTMLUListElement>(null);
  const options = useRef(new Map<string, HTMLButtonElement>());
  const [query, setQuery] = useState('');
  const [system, setSystem] = useState('all');
  const [enabledOnly, setEnabledOnly] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(selectedId);
  const filtered = useMemo(
    () =>
      filterStudyStructures(
        items,
        query,
        system,
        enabledOnly ? enabledIds : undefined,
      ),
    [items, query, system, enabledOnly, enabledIds],
  );
  const active =
    filtered.find((item) => item.id === activeId) ??
    filtered.find((item) => item.id === selectedId) ??
    filtered[0];
  const systems = (Object.keys(bodySystems) as BodySystem[]).filter((key) =>
    items.some((item) => item.system === key),
  );
  function activate(item: BodyStructure) {
    setActiveId(item.id);
    options.current.get(item.id)?.focus({ preventScroll: true });
    onSelect(item.id);
  }
  return (
    <div className="structure-navigator">
      <label htmlFor={`${id}-search`}>Filter {label.toLowerCase()}</label>
      <input
        id={`${id}-search`}
        type="search"
        value={query}
        placeholder="Name, source ID or laterality…"
        onChange={(event) => {
          setQuery(event.target.value);
          setActiveId(null);
        }}
      />
      <div className="structure-navigator-filters">
        <label htmlFor={`${id}-system`}>System</label>
        <select
          id={`${id}-system`}
          value={system}
          onChange={(event) => {
            setSystem(event.target.value);
            setActiveId(null);
          }}
        >
          <option value="all">All systems</option>
          {systems.map((key) => (
            <option key={key} value={key}>
              {bodySystems[key].name}
            </option>
          ))}
        </select>
        {enabledIds && (
          <label className="structure-navigator-check">
            <input
              type="checkbox"
              checked={enabledOnly}
              onChange={(event) => {
                setEnabledOnly(event.target.checked);
                setActiveId(null);
              }}
            />
            Enabled in this dissection only
          </label>
        )}
      </div>
      <p id={`${id}-help`} className="structure-navigator-help">
        ↑ ↓ Home End to browse; Enter or Space to select. Selecting restores a
        removed structure and enables its system.
      </p>
      <output
        className="structure-navigator-count"
        aria-live="polite"
        aria-atomic="true"
      >
        {filtered.length} of {items.length} structures
      </output>
      <ul
        ref={box}
        aria-label={label}
        aria-describedby={`${id}-help`}
        className="structure-navigator-list"
      >
        {filtered.map((item) => (
          <li key={item.id}>
            <button
              type="button"
              aria-current={selectedId === item.id ? 'true' : undefined}
              aria-describedby={`${id}-help`}
              tabIndex={active?.id === item.id ? 0 : -1}
              ref={(node) => {
                if (node) options.current.set(item.id, node);
                else options.current.delete(item.id);
              }}
              className="structure-navigator-option"
              onFocus={() => setActiveId(item.id)}
              onClick={() => activate(item)}
              onKeyDown={(event) => {
                if (
                  event.defaultPrevented ||
                  event.nativeEvent.isComposing ||
                  event.altKey ||
                  event.ctrlKey ||
                  event.metaKey ||
                  event.shiftKey
                )
                  return;
                const next = structureNavigationIndex(
                  event.key,
                  filtered.indexOf(item),
                  filtered.length,
                );
                if (next !== null) {
                  event.preventDefault();
                  const item = filtered[next];
                  setActiveId(item.id);
                  // Scroll only this list, not the page or the anatomical camera.
                  const element = options.current.get(item.id);
                  const container = box.current;
                  if (element && container) {
                    element.focus({ preventScroll: true });
                    const row = element.getBoundingClientRect();
                    const bounds = container.getBoundingClientRect();
                    if (row.top < bounds.top)
                      container.scrollTop -= bounds.top - row.top;
                    else if (row.bottom > bounds.bottom)
                      container.scrollTop += row.bottom - bounds.bottom;
                  }
                } else if (
                  event.repeat &&
                  (event.key === 'Enter' || event.key === ' ')
                ) {
                  event.preventDefault();
                }
              }}
            >
              <i
                aria-hidden="true"
                style={{ background: bodySystems[item.system].color }}
              />
              <span>
                <strong>{item.name}</strong>
                <small>
                  {item.fmaId} · {detail(item)}
                </small>
              </span>
              {selectedId === item.id && (
                <span className="structure-navigator-selected">Selected</span>
              )}
            </button>
          </li>
        ))}
      </ul>
      {!filtered.length && (
        <p className="structure-navigator-help">
          No matching structures. Clear the filter or include other systems.
        </p>
      )}
    </div>
  );
}
