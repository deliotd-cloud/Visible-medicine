import assert from "node:assert/strict";
import test from "node:test";
import { decideWorkbookAuthoringAccess } from "../lib/workbook-authoring-policy.ts";

const base = {
  roles: ["instructor"],
  studioAccess: true,
  activeOrganizationId: "org-one",
  ownerOrganizationId: "org-one",
  status: "draft",
};

test("an educator can edit an owned draft", () => {
  assert.deepEqual(decideWorkbookAuthoringAccess(base), {
    allowed: true,
    editable: true,
    reason: "editable",
  });
});

test("a learner cannot enter the authoring boundary", () => {
  assert.deepEqual(
    decideWorkbookAuthoringAccess({ ...base, roles: ["learner"] }),
    { allowed: false, editable: false, reason: "role-required" },
  );
});

test("an educator cannot inspect another institution's workbook", () => {
  assert.deepEqual(
    decideWorkbookAuthoringAccess({ ...base, ownerOrganizationId: "org-two" }),
    { allowed: false, editable: false, reason: "not-owned" },
  );
});

test("Studio entitlement is required", () => {
  assert.deepEqual(
    decideWorkbookAuthoringAccess({ ...base, studioAccess: false }),
    { allowed: false, editable: false, reason: "studio-disabled" },
  );
});

test("review and published states open read-only", () => {
  for (const status of ["in-review", "approved", "published", "archived"])
    assert.deepEqual(decideWorkbookAuthoringAccess({ ...base, status }), {
      allowed: true,
      editable: false,
      reason: "read-only",
    });
});
