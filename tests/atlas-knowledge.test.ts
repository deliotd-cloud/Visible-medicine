import assert from "node:assert/strict";
import test from "node:test";

import {
  ctHeadLevels,
  ctHeadStructures,
  ctHeadSystems,
} from "../lib/atlas-knowledge.ts";

test("CT head demonstration structures have stable unique identifiers", () => {
  const ids = ctHeadStructures.map((structure) => structure.id);
  assert.equal(new Set(ids).size, ids.length);
  assert.ok(ids.every((id) => /^ELV-ANAT-CTH-\d{3}$/.test(id)));
});

test("each structure belongs to one bounded level and has learning metadata", () => {
  assert.equal(ctHeadLevels.flat().length, ctHeadStructures.length);
  for (const structure of ctHeadStructures) {
    assert.ok(structure.level >= 0 && structure.level < ctHeadLevels.length);
    assert.ok(structure.description.length >= 40);
    assert.ok(structure.parent.length > 0);
    assert.ok(structure.relationships.length > 0);
  }
});

test("system filters cover every indexed structure", () => {
  const systems = new Set(ctHeadSystems);
  assert.ok(systems.has("All"));
  assert.ok(ctHeadStructures.every((structure) => systems.has(structure.system)));
});
