import assert from "node:assert/strict";
import test from "node:test";

import {
  courseSearchText,
  normaliseEmail,
  normaliseInvitationRole,
  parseRosterInput,
  releaseReadiness,
  safeReturnPath,
  scoreCourseForLearner,
} from "../lib/pilot-readiness.ts";

const course = {
  id: "course-1",
  title: "Normal CT head foundations",
  summary: "Build a systematic approach to normal cross-sectional neuroanatomy.",
  level: "Foundation",
  outcomes: ["Recognise normal ventricles", "Identify the basal ganglia"],
  publisherKind: "elivion",
  accessModel: "open",
};

test("normalises identity inputs and limits education roles", () => {
  assert.equal(normaliseEmail("  Learner@Example.ORG "), "learner@example.org");
  assert.equal(normaliseInvitationRole("Reviewer"), "reviewer");
  assert.throws(() => normaliseEmail("not-an-email"), /valid email/i);
  assert.throws(() => normaliseInvitationRole("clinician"), /approved education role/i);
});

test("parses bounded rosters, defaults roles and deduplicates by email", () => {
  assert.deepEqual(parseRosterInput("one@example.org,learner\nTWO@example.org\none@example.org,reviewer"), [
    { email: "one@example.org", role: "reviewer" },
    { email: "two@example.org", role: "learner" },
  ]);
  assert.throws(() => parseRosterInput("one@example.org\ntwo@example.org", 1), /limited to 1 row/i);
});

test("only accepts local return paths", () => {
  assert.equal(safeReturnPath("/courses/head-ct"), "/courses/head-ct");
  assert.equal(safeReturnPath("//malicious.example"), "/my-learning");
  assert.equal(safeReturnPath("https://malicious.example"), "/my-learning");
  assert.equal(safeReturnPath("/safe\\redirect"), "/my-learning");
});

test("course discovery text and ranking use learner-profile signals", () => {
  const matching = scoreCourseForLearner(course, { trainingStage: "Foundation", discipline: "Radiology", interests: ["Neuroanatomy"] });
  const unrelated = scoreCourseForLearner(course, { trainingStage: "Consultant", discipline: "Pathology", interests: ["Dermatology"] });
  assert.ok(matching > unrelated);
  assert.match(courseSearchText(course), /normal ct head foundations/);
});

test("publication readiness requires complete metadata and independent review", () => {
  const incomplete = releaseReadiness({ ...course, publisher: "Elivion", workbookCount: 1, visibility: "public", priceMinor: 0, currency: "GBP" });
  assert.equal(incomplete.ready, false);
  assert.equal(incomplete.checks.find((check) => check.key === "review")?.ready, false);

  const ready = releaseReadiness({ ...course, publisher: "Elivion", workbookCount: 1, visibility: "public", priceMinor: 0, currency: "GBP", reviewedBy: "Reviewer 2", reviewNotes: "Scope, wording and learner safety reviewed." });
  assert.equal(ready.ready, true);
  assert.equal(ready.complete, ready.checks.length);
});

test("paid releases must have a positive price and ISO-style currency", () => {
  const invalid = releaseReadiness({ ...course, publisher: "Elivion", workbookCount: 1, visibility: "public", accessModel: "paid", priceMinor: 0, currency: "gbp", reviewedBy: "Reviewer", reviewNotes: "Reviewed." });
  assert.equal(invalid.checks.find((check) => check.key === "price")?.ready, false);
});
