"use client";

import { useState } from "react";
import { SplashConcept, type SplashConceptVariant } from "./SplashConcept";

const concepts: Array<{
  variant: SplashConceptVariant;
  number: string;
  name: string;
  description: string;
  recommended?: boolean;
}> = [
  {
    variant: "relay",
    number: "01",
    name: "Modality relay",
    description: "X-ray, CT and MRI arrive as a connected diagnostic-imaging sequence before resolving into the brand.",
    recommended: true,
  },
  {
    variant: "orbit",
    number: "02",
    name: "Imaging orbit",
    description: "The three modalities move through a circular acquisition field, giving the introduction a more technological feel.",
  },
  {
    variant: "cinematic",
    number: "03",
    name: "Cross-sectional dissolve",
    description: "Full-frame studies blend from projection imaging to CT and MRI for the most atmospheric treatment.",
  },
];

export function SplashPreviewGallery() {
  const [replays, setReplays] = useState<Record<SplashConceptVariant, number>>({
    relay: 0,
    orbit: 0,
    cinematic: 0,
  });

  return (
    <div className="splash-preview-grid">
      {concepts.map((concept) => (
        <article className="splash-preview-card" key={concept.variant}>
          <div className="splash-preview-stage">
            <SplashConcept key={replays[concept.variant]} variant={concept.variant} />
          </div>
          <div className="splash-preview-copy">
            <div className="splash-preview-heading">
              <span>{concept.number}</span>
              <div>
                <h2>{concept.name}</h2>
                {concept.recommended && <em>Recommended</em>}
              </div>
            </div>
            <p>{concept.description}</p>
            <button
              type="button"
              onClick={() => setReplays((current) => ({
                ...current,
                [concept.variant]: current[concept.variant] + 1,
              }))}
            >
              Replay animation <span aria-hidden="true">↻</span>
            </button>
          </div>
        </article>
      ))}
    </div>
  );
}
