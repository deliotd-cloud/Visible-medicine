import pins from "../content/wrist-imaging-pins.json" with { type: "json" };
import {
  wristImagingTopics,
  wristImagingReferences,
  wristImagingSelectionNotes,
  type WristImagingGroup,
  type WristImagingModality,
} from "../content/wrist-imaging-concepts";
import type { ContentTab } from "../app/anatomy-data";
import type { BodyStructure } from "../app/body-types";
import type { ContentLesson } from "./content-types";

const canonical = (v: unknown): string =>
  Array.isArray(v)
    ? `[${v.map(canonical).join(",")}]`
    : v && typeof v === "object"
      ? `{${Object.keys(v)
          .sort()
          .map(
            (k) =>
              `${JSON.stringify(k)}:${canonical((v as Record<string, unknown>)[k])}`,
          )
          .join(",")}}`
      : JSON.stringify(v);
const bound = new Map(
  pins.entries.map((p) => [
    p.identity.id,
    { signature: canonical(p.identity), group: p.group as WristImagingGroup },
  ]),
);
const names = { ct: "CT", mri: "MRI", xray: "X-ray" };

/** Full-record admission, not a name/FMA fallback or a patient-image mapping. */
export function wristImagingLesson(
  s: BodyStructure,
  tab: ContentTab,
): ContentLesson | undefined {
  if (!["ct", "mri", "xray"].includes(tab)) return undefined;
  const match = bound.get(s.id);
  if (!match || canonical(s) !== match.signature) return undefined;
  const modality = tab as WristImagingModality,
    value = wristImagingTopics[match.group][modality];
  const selection = wristImagingSelectionNotes.find((n) =>
    n.fmaIds.includes(s.fmaId),
  );
  if (!selection) return undefined;
  return {
    readiness: "draft",
    title: `${s.name} · ${names[modality]} orientation · draft`,
    body: value.body,
    bullets: [
      selection.note,
      ...value.bullets,
      "Return separation to zero before comparing source relationswrists. Cutaway and Explode do not generate acquired scan slices, tissue signal or diagnostic measurements.",
    ],
    note: "Independent anatomy/radiology review pending. No patient images, scan registration or paid-lecture access. Confirm the actual patient, side, region, image orientation and series before comparison. This teaching does not select an examination or provide diagnosis, treatment or procedural planning.",
    citations: [
      ...new Set(value.references.map((key) => wristImagingReferences[key])),
    ],
  };
}
