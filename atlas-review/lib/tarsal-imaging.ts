import pins from "../content/tarsal-imaging-pins.json" with { type: "json" };
import {
  tarsalImagingTopics,
  tarsalImagingReferences,
  tarsalImagingSelectionNotes,
  type TarsalImagingGroup,
  type TarsalImagingModality,
} from "../content/tarsal-imaging-concepts";
import { sourceCanonical } from "./body-source-additions";
import type { ContentTab } from "../app/anatomy-data";
import type { BodyStructure } from "../app/body-types";
import type { ContentLesson } from "./content-types";

const bound = new Map(
  pins.entries.map((e) => [
    e.identity.id,
    {
      signature: sourceCanonical(e.identity),
      group: e.group as TarsalImagingGroup,
    },
  ]),
);
const names = { ct: "CT", mri: "MRI", xray: "X-ray" };
/** Exact source representation only; never matches the laryngeal cuneiform cartilages. */
export function tarsalImagingLesson(
  s: BodyStructure,
  tab: ContentTab,
): ContentLesson | undefined {
  if (!["ct", "mri", "xray"].includes(tab)) return undefined;
  const entry = bound.get(s.id);
  if (!entry || sourceCanonical(s) !== entry.signature) return undefined;
  const selected = tarsalImagingSelectionNotes.find((n) =>
    n.fmaIds.includes(s.fmaId),
  );
  if (!selected) return undefined;
  const topic = tarsalImagingTopics[entry.group][tab as TarsalImagingModality];
  return {
    readiness: "draft",
    title: `${s.name} · ${names[tab as TarsalImagingModality]} orientation · draft`,
    body: topic.body,
    bullets: [
      selected.note,
      ...topic.bullets,
      "Set separation to zero before comparing source relationships. Rotation and cutaway do not generate acquired slices, tissue signal or diagnostic measurements.",
    ],
    note: "Independent anatomy/radiology review pending. No patient images, scan registration or paid-lecture access. Confirm patient, side, region, orientation and series when using future imaging links. This is introductory teaching, not diagnosis, an examination recommendation or procedural planning.",
    citations: [
      ...new Set(
        ["anatomy", ...topic.references].map(
          (key) =>
            tarsalImagingReferences[
              key as keyof typeof tarsalImagingReferences
            ],
        ),
      ),
    ],
  };
}
