import assert from "node:assert/strict";
import test from "node:test";

import { decideEducationUserProvisioning, NEW_EDUCATION_USER_ROLES } from "../lib/education-user-provisioning.ts";

const auth = { userId: "edu:learner", externalSubject: "sites:learner", email: "learner@example.org" };

test("production learners receive only the learner role and no implicit organisation", () => {
  const previous = process.env.VISIBLE_MEDICINE_EVALUATION_ADMIN_EMAILS;
  delete process.env.VISIBLE_MEDICINE_EVALUATION_ADMIN_EMAILS;
  try {
    const decision = decideEducationUserProvisioning(null, auth, "production");
    assert.equal(decision.roles, NEW_EDUCATION_USER_ROLES);
    assert.equal(decision.bootstrapDefaultOrganization, false);
    assert.equal(decision.evaluationAdministrator, false);
  } finally {
    if (previous === undefined) delete process.env.VISIBLE_MEDICINE_EVALUATION_ADMIN_EMAILS;
    else process.env.VISIBLE_MEDICINE_EVALUATION_ADMIN_EMAILS = previous;
  }
});

test("only an explicitly configured evaluation administrator bootstraps the pilot organisation", () => {
  const previous = process.env.VISIBLE_MEDICINE_EVALUATION_ADMIN_EMAILS;
  process.env.VISIBLE_MEDICINE_EVALUATION_ADMIN_EMAILS = "owner@example.org";
  try {
    const decision = decideEducationUserProvisioning(null, { ...auth, email: "OWNER@example.org" }, "production");
    assert.equal(decision.evaluationAdministrator, true);
    assert.equal(decision.bootstrapDefaultOrganization, true);
    assert.match(decision.roles, /administrator/);
  } finally {
    if (previous === undefined) delete process.env.VISIBLE_MEDICINE_EVALUATION_ADMIN_EMAILS;
    else process.env.VISIBLE_MEDICINE_EVALUATION_ADMIN_EMAILS = previous;
  }
});
