"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

const anatomyLevels = [
  ["Frontal lobe", "Falx cerebri", "Superior sagittal sinus"],
  ["Lateral ventricle", "Caudate nucleus", "Corpus callosum"],
  ["Thalamus", "Third ventricle", "Internal capsule"],
  ["Midbrain", "Ambient cistern", "Temporal lobe"],
  ["Pons", "Fourth ventricle", "Cerebellar peduncle"],
  ["Cerebellum", "Foramen magnum", "Medulla"],
];

const filters = ["All", "Brain", "CSF spaces", "Vessels", "Skull"];

type AtlasExplorerProps = { moduleSlug: string; totalImages: number };

export function AtlasExplorer({ moduleSlug, totalImages }: AtlasExplorerProps) {
  const [slice, setSlice] = useState(34);
  const [labelsVisible, setLabelsVisible] = useState(true);
  const [quizMode, setQuizMode] = useState(false);
  const [revealed, setRevealed] = useState<number | null>(null);
  const [filter, setFilter] = useState("All");
  const [windowPreset, setWindowPreset] = useState<"brain" | "bone">("brain");
  const [message, setMessage] = useState("");
  const level = Math.min(anatomyLevels.length - 1, Math.floor((slice / totalImages) * anatomyLevels.length));
  const structures = anatomyLevels[level];
  const scanClass = useMemo(() => `module-scan scan-level-${level} ${windowPreset === "bone" ? "bone-window" : ""}`, [level, windowPreset]);

  async function saveProgress() {
    setMessage("Saving…");
    try {
      const response = await fetch("/api/progress", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ resourceType: "atlas", resourceSlug: moduleSlug, progress: Math.round((slice / totalImages) * 100), lastPosition: slice }),
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

  return (
    <section className="module-explorer" aria-label="CT head atlas module">
      <aside className="module-sidebar">
        <div className="module-sidebar-heading">
          <span>Structure index</span><strong>76</strong>
        </div>
        <label className="structure-search">
          <span className="sr-only">Search structures</span>
          <input type="search" placeholder="Search anatomy" />
          <i aria-hidden="true">⌕</i>
        </label>
        <div className="filter-list" role="group" aria-label="Anatomical system">
          {filters.map((item) => (
            <button className={filter === item ? "active" : ""} type="button" key={item} onClick={() => setFilter(item)}>
              <span>{item}</span><i>{item === "All" ? 76 : item === "Brain" ? 42 : 8}</i>
            </button>
          ))}
        </div>
        <div className="current-structures">
          <p>At this level</p>
          {structures.map((structure, index) => (
            <button type="button" key={structure} onClick={() => { setLabelsVisible(true); setRevealed(index); }}>
              <i>{index + 1}</i><span>{structure}</span><b>→</b>
            </button>
          ))}
        </div>
      </aside>

      <div className="module-viewer">
        <div className="module-toolbar">
          <div className="tool-group">
            <button type="button" className={windowPreset === "brain" ? "active" : ""} onClick={() => setWindowPreset("brain")}>Brain</button>
            <button type="button" className={windowPreset === "bone" ? "active" : ""} onClick={() => setWindowPreset("bone")}>Bone</button>
          </div>
          <div className="tool-group">
            <button type="button" className={labelsVisible ? "active" : ""} onClick={() => setLabelsVisible((value) => !value)}>{labelsVisible ? "Hide labels" : "Show labels"}</button>
            <button type="button" className={quizMode ? "active accent" : ""} onClick={() => { setQuizMode((value) => !value); setRevealed(null); }}>Practice</button>
            <button type="button" onClick={saveProgress}>Save position</button>
          </div>
        </div>

        <div className="module-stage">
          <span className="module-orientation top">A</span><span className="module-orientation bottom">P</span>
          <span className="module-orientation side-left">R</span><span className="module-orientation side-right">L</span>
          <div className={scanClass} aria-hidden="true"><i /><i /></div>
          {labelsVisible && structures.map((structure, index) => (
            <button
              type="button"
              className={`module-label module-label-${index + 1} ${revealed === index ? "selected" : ""}`}
              key={structure}
              onClick={() => setRevealed(index)}
              aria-label={quizMode && revealed !== index ? `Reveal structure ${index + 1}` : structure}
            >
              <span>{quizMode && revealed !== index ? index + 1 : structure}</span><i />
            </button>
          ))}
          <div className="module-counter"><b>{slice}</b><span>/ {totalImages}</span></div>
          <p className="demo-note">Illustrative interface preview · publication-cleared imaging will replace this generated demonstration</p>
        </div>

        <div className="module-scrubber">
          <button type="button" onClick={() => setSlice(Math.max(1, slice - 1))} aria-label="Previous image">←</button>
          <input aria-label="Image position" type="range" min="1" max={totalImages} value={slice} onChange={(event) => { setSlice(Number(event.target.value)); setRevealed(null); }} />
          <button type="button" onClick={() => setSlice(Math.min(totalImages, slice + 1))} aria-label="Next image">→</button>
        </div>
        <p className="save-message" role="status" aria-live="polite">{message}</p>
      </div>

      <aside className="module-info">
        <p className="panel-kicker">Selected structure</p>
        <span className="structure-number">{revealed === null ? "—" : `0${revealed + 1}`}</span>
        <h2>{revealed === null ? "Choose a label" : structures[revealed]}</h2>
        <p>{revealed === null ? "Select a structure in the image or index to open its reviewed description, relationships and course references." : `This demonstration entry shows how ${structures[revealed].toLowerCase()} content, hierarchy, synonyms, citations and linked teaching material will appear.`}</p>
        <div className="info-metadata">
          <span>System</span><b>{filter === "All" ? "Neuroanatomy" : filter}</b>
          <span>Level</span><b>Image {slice}</b>
          <span>Review</span><b>Demonstration</b>
        </div>
        <Link href="/courses/foundations-ct-head">Open linked lesson <span>↗</span></Link>
      </aside>
    </section>
  );
}
