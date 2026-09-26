import pins from "../content/elbow-study-pins.json" with { type: "json" };
import { elbowStudySets } from "../content/elbow-studies.ts";
import type { BodyCatalog, BodyStructure } from "../app/body-types";

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
const signatures = new Map(pins.entries.map((s) => [s.id, canonical(s)]));
export function elbowStudyBounds({
  catalog,
  region,
  recipeId,
  structures,
  visibleIds,
  enabled,
}: {
  catalog: BodyCatalog | null;
  region: string;
  recipeId: string | null;
  structures: BodyStructure[];
  visibleIds: string[];
  enabled: boolean;
}) {
  const study = elbowStudySets.find((s) => s.id === recipeId);
  if (
    !enabled ||
    !catalog ||
    region !== "forearm" ||
    !study ||
    !visibleIds.length
  )
    return null;
  if (
    catalog.sourceVersion !== pins.sourceVersion ||
    canonical(catalog.coordinateSystem) !== canonical(pins.coordinateSystem)
  )
    return null;
  for (const pin of pins.entries) {
    const matches = catalog.structures.filter((s) => s.id === pin.id);
    if (
      matches.length !== 1 ||
      canonical(matches[0]) !== signatures.get(pin.id)
    )
      return null;
  }
  for (const pin of pins.bundles) {
    const matches = catalog.bundles.filter((b) => b.id === pin.id);
    if (matches.length !== 1 || canonical(matches[0]) !== canonical(pin))
      return null;
  }
  if (new Set(visibleIds).size !== visibleIds.length) return null;
  const allowed = new Set([
    ...study.targetFmaIds,
    ...study.context.flatMap((s) => s.fmaIds ?? []),
  ]);
  const visible = structures.filter((s) => visibleIds.includes(s.id));
  if (
    visible.length !== visibleIds.length ||
    visible.some(
      (s) => !allowed.has(s.fmaId) || canonical(s) !== signatures.get(s.id),
    )
  )
    return null;
  const sides = [...new Set(visible.map((s) => s.laterality))];
  if (sides.some((s) => s !== "left" && s !== "right")) return null;
  const bounds = sides.map((s) => pins.cameraBounds[s as "left" | "right"]);
  // Return detached viewing bounds. Geometry, label identities and source anchors stay unchanged.
  return {
    min: [0, 1, 2].map((i) => Math.min(...bounds.map((b) => b.min[i]))),
    max: [0, 1, 2].map((i) => Math.max(...bounds.map((b) => b.max[i]))),
  };
}
