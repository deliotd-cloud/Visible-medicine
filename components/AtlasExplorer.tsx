"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ctHeadLevels,
  ctHeadStructures,
  ctHeadSystems,
  type AtlasStructure,
} from "../lib/atlas-knowledge";

type AtlasExplorerProps = { moduleSlug: string; totalImages: number };

type StructureIndexProps = {
  filter: string;
  query: string;
  selectedId: string | null;
  currentLevel: number;
  onFilter: (value: string) => void;
  onQuery: (value: string) => void;
  onSelect: (structure: AtlasStructure) => void;
};

function StructureIndex({
  filter,
  query,
  selectedId,
  currentLevel,
  onFilter,
  onQuery,
  onSelect,
}: StructureIndexProps) {
  const normalizedQuery = query.trim().toLowerCase();
  const matches = ctHeadStructures.filter((structure) => {
    const matchesSystem = filter === "All" || structure.system === filter;
    const matchesQuery =
      !normalizedQuery ||
      structure.name.toLowerCase().includes(normalizedQuery) ||
      structure.synonyms.some((synonym) =>
        synonym.toLowerCase().includes(normalizedQuery),
      );
    return matchesSystem && matchesQuery;
  });

  return (
    <div className="structure-index-content">
      <div className="module-sidebar-heading">
        <span>Structure index</span><strong>{matches.length}</strong>
      </div>
      <label className="structure-search">
        <span className="sr-only">Search structures and synonyms</span>
        <input
          type="search"
          value={query}
          onChange={(event) => onQuery(event.target.value)}
          placeholder="Search anatomy or synonym"
        />
        <i aria-hidden="true">⌕</i>
      </label>
      <div className="filter-list" role="group" aria-label="Anatomical system">
        {ctHeadSystems.map((item) => {
          const count = item === "All"
            ? ctHeadStructures.length
            : ctHeadStructures.filter((structure) => structure.system === item).length;
          return (
            <button
              className={filter === item ? "active" : ""}
              type="button"
              key={item}
              onClick={() => onFilter(item)}
            >
              <span>{item}</span><i>{count}</i>
            </button>
          );
        })}
      </div>
      <div className="current-structures">
        <p>{query ? "Search results" : "Demonstration structures"}</p>
        {matches.map((structure) => (
          <button
            type="button"
            className={`${selectedId === structure.id ? "selected" : ""} ${currentLevel === structure.level ? "at-level" : ""}`}
            key={structure.id}
            onClick={() => onSelect(structure)}
          >
            <i>Slice {String(structure.level + 1).padStart(2, "0")}</i>
            <span>{structure.name}<small>{structure.system}</small></span>
            <b aria-hidden="true">→</b>
          </button>
        ))}
        {!matches.length && <p className="structure-empty">No structures match this search.</p>}
      </div>
    </div>
  );
}

export function AtlasExplorer({ moduleSlug, totalImages }: AtlasExplorerProps) {
  const [slice, setSlice] = useState(34);
  const [labelsVisible, setLabelsVisible] = useState(true);
  const [quizMode, setQuizMode] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filter, setFilter] = useState("All");
  const [query, setQuery] = useState("");
  const [windowPreset, setWindowPreset] = useState<"brain" | "bone">("brain");
  const [confidence, setConfidence] = useState<"low" | "medium" | "high" | null>(null);
  const [favourites, setFavourites] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const saved = window.localStorage.getItem("visible-medicine-atlas-favourites") ?? window.localStorage.getItem("elivion-atlas-favourites");
      return saved ? JSON.parse(saved) as string[] : [];
    } catch {
      return [];
    }
  });
  const [message, setMessage] = useState("");

  const level = Math.min(
    ctHeadLevels.length - 1,
    Math.floor(((slice - 1) / totalImages) * ctHeadLevels.length),
  );
  const structures = ctHeadLevels[level];
  const selected = selectedId
    ? ctHeadStructures.find((structure) => structure.id === selectedId) ?? null
    : null;
  const scanClass = useMemo(
    () => `module-scan scan-level-${level} ${windowPreset === "bone" ? "bone-window" : ""}`,
    [level, windowPreset],
  );

  function moveToStructure(structure: AtlasStructure) {
    const target = Math.max(
      1,
      Math.min(
        totalImages,
        Math.round(((structure.level + 0.5) / ctHeadLevels.length) * totalImages),
      ),
    );
    setSlice(target);
    setSelectedId(structure.id);
    setLabelsVisible(true);
    setConfidence(null);
  }

  function selectStageStructure(structure: AtlasStructure) {
    setSelectedId(structure.id);
    setConfidence(null);
    if (quizMode) setMessage("Structure revealed. Rate how confident you were before moving on.");
  }

  function toggleFavourite() {
    if (!selected) return;
    const next = favourites.includes(selected.id)
      ? favourites.filter((id) => id !== selected.id)
      : [...favourites, selected.id];
    setFavourites(next);
    try {
      window.localStorage.setItem("visible-medicine-atlas-favourites", JSON.stringify(next));
      setMessage(
        next.includes(selected.id)
          ? `${selected.name} saved to this device.`
          : `${selected.name} removed from saved structures.`,
      );
    } catch {
      setMessage("This browser could not save the structure locally.");
    }
  }

  async function saveProgress() {
    setMessage("Saving…");
    try {
      const response = await fetch("/api/progress", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          resourceType: "atlas",
          resourceSlug: moduleSlug,
          progress: Math.round((slice / totalImages) * 100),
          lastPosition: slice,
        }),
      });
      if (response.status === 401) {
        setMessage("Sign in through My learning to save your position.");
        return;
      }
      if (!response.ok) throw new Error("save failed");
      setMessage(`Position saved at image ${slice}.`);
    } catch {
      setMessage("Your position could not be saved. Please try again.");
    }
  }

  const indexProps: StructureIndexProps = {
    filter,
    query,
    selectedId,
    currentLevel: level,
    onFilter: setFilter,
    onQuery: setQuery,
    onSelect: moveToStructure,
  };

  return (
    <section className="module-explorer" aria-label="CT head atlas module">
      <aside className="module-sidebar">
        <StructureIndex {...indexProps} />
      </aside>

      <div className="module-viewer">
        <details className="mobile-atlas-index">
          <summary>
            <span>Structures</span>
            <b>{selected?.name ?? `${ctHeadStructures.length} indexed`}</b>
            <i aria-hidden="true">⌄</i>
          </summary>
          <StructureIndex {...indexProps} />
        </details>

        <div className="module-toolbar">
          <div className="tool-group" aria-label="CT window preset">
            <button type="button" className={windowPreset === "brain" ? "active" : ""} onClick={() => setWindowPreset("brain")}>Brain</button>
            <button type="button" className={windowPreset === "bone" ? "active" : ""} onClick={() => setWindowPreset("bone")}>Bone</button>
          </div>
          <div className="tool-group" aria-label="Label display">
            <button type="button" className={labelsVisible ? "active" : ""} onClick={() => setLabelsVisible((value) => !value)}>{labelsVisible ? "Hide labels" : "Show labels"}</button>
          </div>
          <div className="tool-group learning-mode-group" aria-label="Learning mode"><span>Mode</span><button type="button" className={!quizMode ? "active" : ""} aria-pressed={!quizMode} onClick={() => { setQuizMode(false); setSelectedId(null); setConfidence(null); setMessage("Explore mode."); }}>Explore</button><button type="button" className={quizMode ? "active accent" : ""} aria-pressed={quizMode} onClick={() => { setQuizMode(true); setLabelsVisible(true); setSelectedId(null); setConfidence(null); setMessage("Practice mode: choose a numbered marker, then rate your confidence."); }}>Practice</button></div>
          <button className="save-position-button" type="button" onClick={saveProgress}>Save position</button>
          <span className="atlas-viewer-credit didanix-credit"><small>Powered by</small> <b>Didanix</b></span>
        </div>

        {quizMode && (
          <div className="practice-banner" role="status">
            <span>Retrieval practice</span>
            <p>{selected ? `${selected.name} revealed. How confident were you?` : "Choose a numbered marker before revealing its name."}</p>
            <div role="group" aria-label="Confidence before answer reveal">
              {(["low", "medium", "high"] as const).map((value) => (
                <button
                  type="button"
                  className={confidence === value ? "active" : ""}
                  disabled={!selected}
                  key={value}
                  onClick={() => {
                    setConfidence(value);
                    setMessage(`${value[0].toUpperCase()}${value.slice(1)} confidence recorded for this practice step.`);
                  }}
                >{value}</button>
              ))}
            </div>
          </div>
        )}

        <div className="module-stage">
          <span className="module-orientation top">A</span><span className="module-orientation bottom">P</span>
          <span className="module-orientation side-left">R</span><span className="module-orientation side-right">L</span>
          <div className={scanClass} aria-hidden="true"><i /><i /></div>
          {labelsVisible && structures.map((structure, index) => (
            <button
              type="button"
              className={`module-label module-label-${index + 1} ${selectedId === structure.id ? "selected" : ""}`}
              key={structure.id}
              onClick={() => selectStageStructure(structure)}
              aria-label={quizMode && selectedId !== structure.id ? `Reveal structure ${index + 1}` : structure.name}
            >
              <span>{quizMode && selectedId !== structure.id ? index + 1 : structure.name}</span><i />
            </button>
          ))}
          <div className="module-counter"><b>{slice}</b><span>/ {totalImages}</span></div>
          <p className="demo-note">Illustrative interface preview · publication-cleared CT imaging will replace this generated demonstration</p>
        </div>

        <div className="module-scrubber">
          <button type="button" onClick={() => { setSlice(Math.max(1, slice - 1)); setSelectedId(null); }} aria-label="Previous image">←</button>
          <input aria-label="Image position" type="range" min="1" max={totalImages} value={slice} onChange={(event) => { setSlice(Number(event.target.value)); setSelectedId(null); setConfidence(null); }} />
          <button type="button" onClick={() => { setSlice(Math.min(totalImages, slice + 1)); setSelectedId(null); }} aria-label="Next image">→</button>
        </div>
        <p className="save-message" role="status" aria-live="polite">{message}</p>
      </div>

      <aside className="module-info">
        <p className="panel-kicker">Selected structure</p>
        <span className="structure-number">{selected?.id ?? "—"}</span>
        <h2>{selected?.name ?? "Choose a structure"}</h2>
        <p>{selected?.description ?? "Select a structure in the image or index to open its reviewed definition, hierarchy, synonyms and linked learning."}</p>
        {selected && (
          <>
            <div className="structure-relations">
              <span>Synonyms</span><p>{selected.synonyms.join(" · ")}</p>
              <span>Hierarchy</span><p>{selected.parent} → {selected.name}</p>
              <span>Related anatomy</span><p>{selected.relationships.join(" · ")}</p>
            </div>
            <button
              type="button"
              className="favourite-structure"
              aria-pressed={favourites.includes(selected.id)}
              onClick={toggleFavourite}
            >
              <span aria-hidden="true">{favourites.includes(selected.id) ? "★" : "☆"}</span>
              {favourites.includes(selected.id) ? "Saved on this device" : "Save structure"}
            </button>
          </>
        )}
        <div className="info-metadata">
          <span>System</span><b>{selected?.system ?? "Neuroanatomy"}</b>
          <span>Image</span><b>{slice} of {totalImages}</b>
          <span>Terminology</span><b>{selected?.terminologyStatus ?? "Selection required"}</b>
          <span>Review</span><b>Demonstration content</b>
        </div>
        <Link href="/courses">Browse related courses <span>↗</span></Link>
      </aside>
    </section>
  );
}
