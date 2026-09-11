// Exact offline recipe transition; never runtime state or approval migration.
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import record from "../content/elbow-study-transition.json" with { type: "json" };
const hash = (v) =>
  createHash("sha256").update(JSON.stringify(v)).digest("hex");
export const elbowStudyProfilesHash = record.after;
export function preElbowRecipeProfiles(profiles) {
  assert.equal(
    hash(record),
    "b9b9250551e394cc4a54bf13215cb9c989dd6ef4a6d60aba7e9d1ca01323f856",
  );
  if (hash(profiles) === record.before) return structuredClone(profiles);
  assert.equal(hash(profiles), record.after, "Unrecorded elbow recipe edit");
  const previous = structuredClone(profiles),
    forearm = previous.forearm;
  const has = (s) => record.ids.includes(s.id);
  assert.equal(
    hash({
      stages: forearm.stages.filter(has),
      focuses: forearm.focuses.filter(has),
      references: forearm.references.slice(-2),
    }),
    record.addition,
  );
  forearm.stages = forearm.stages.filter((s) => !has(s));
  forearm.focuses = forearm.focuses.filter((s) => !has(s));
  forearm.references = forearm.references.slice(0, -2);
  assert.equal(hash(previous), record.before, "Every prior recipe unchanged");
  return previous;
}
