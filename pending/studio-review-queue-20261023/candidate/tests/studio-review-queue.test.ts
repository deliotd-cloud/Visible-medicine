import assert from "node:assert/strict";
import test from "node:test";
import { canOfferIndependentReview, isPendingIndependentReview, partitionStudioReviewQueue, type ReviewQueueContext } from "../lib/studio-review-queue.ts";

const revision = "a".repeat(64);
const context: ReviewQueueContext = Object.freeze({
  actorId: "edu:reviewer", organizationId: "org:one", educationRoles: Object.freeze(["instructor"]),
});
const release = Object.freeze({
  id: "release:one", version: 1, status: "in-review", materialRevision: revision,
  createdBy: "edu:author", organizationId: "org:one", approvalCurrent: false,
});

test("pending means in-review or an approved release with explicitly stale approval", () => {
  assert.equal(isPendingIndependentReview(release), true);
  assert.equal(isPendingIndependentReview({ status: "in-review", approvalCurrent: true }), true);
  assert.equal(isPendingIndependentReview({ status: "approved", approvalCurrent: false }), true);
  for (const approvalCurrent of [true, undefined]) {
    assert.equal(isPendingIndependentReview({ status: "approved", approvalCurrent }), false);
  }
  for (const status of ["draft", "changes-requested", "published", "In-review", "unknown"]) {
    assert.equal(isPendingIndependentReview({ status, approvalCurrent: false }), false);
  }
});

test("only exact existing education roles offer an independent review", () => {
  for (const role of ["instructor", "examiner", "administrator"]) {
    assert.equal(canOfferIndependentReview(release, { ...context, educationRoles: [role] }), true);
  }
  for (const role of ["reviewer", "learner", "Instructor", "examiner-extra", " administrator", "administrator ", "admin"]) {
    assert.equal(canOfferIndependentReview(release, { ...context, educationRoles: [role] }), false);
  }
  assert.equal(canOfferIndependentReview(release, { ...context, educationRoles: [] }), false);
});

test("author and organisation bindings must be exact and normalized", () => {
  assert.equal(canOfferIndependentReview({ ...release, createdBy: context.actorId }, context), false);
  assert.equal(canOfferIndependentReview({ ...release, createdBy: "edu:someone-else" }, context), true);
  for (const createdBy of [undefined, "", "author", " edu:author", "edu:", "edu: "]) {
    assert.equal(canOfferIndependentReview({ ...release, createdBy }, context), false);
  }
  for (const organizationId of [undefined, "", "org:other", " org:one", "org:one "]) {
    assert.equal(canOfferIndependentReview({ ...release, organizationId }, context), false);
  }
  for (const actorId of ["reviewer", "edu:", " edu:reviewer", "edu:reviewer "]) {
    assert.equal(canOfferIndependentReview(release, { ...context, actorId }), false);
  }
  assert.equal(canOfferIndependentReview(release, { ...context, organizationId: "org:other" }), false);
  assert.equal(canOfferIndependentReview(release, { ...context, organizationId: " org:one" }), false);
});

test("missing or malformed revision bindings never offer an action", () => {
  for (const id of [undefined, "", " ", "x".repeat(121)]) {
    assert.equal(canOfferIndependentReview({ ...release, id }, context), false);
  }
  assert.equal(canOfferIndependentReview({ ...release, id: "x".repeat(120) }, context), true);
  for (const version of [undefined, 0, -1, 1.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1, "1"]) {
    assert.equal(canOfferIndependentReview({ ...release, version }, context), false);
  }
  for (const materialRevision of [undefined, null, "", "A".repeat(64), "g".repeat(64), "a".repeat(63), "a".repeat(65)]) {
    assert.equal(canOfferIndependentReview({ ...release, materialRevision }, context), false);
  }
  assert.equal(canOfferIndependentReview({ ...release, status: "approved", approvalCurrent: false }, context), true);
  assert.equal(canOfferIndependentReview({ ...release, status: "approved", approvalCurrent: true }, context), false);
  assert.equal(canOfferIndependentReview({ ...release, status: "approved", approvalCurrent: undefined }, context), false);
});

test("partition retains pending order and release identity without changing frozen inputs", () => {
  const ready = Object.freeze({ ...release, id: "ready", extra: { harmless: true } });
  const waiting = Object.freeze({ ...release, id: "waiting", createdBy: context.actorId });
  const stale = Object.freeze({ ...release, id: "stale", status: "approved", approvalCurrent: false });
  const unknown = Object.freeze({ ...release, id: "unknown", materialRevision: undefined });
  const published = Object.freeze({ ...release, id: "published", status: "published" });
  const items = Object.freeze([ready, waiting, stale, unknown, published]);
  const result = partitionStudioReviewQueue(items, context);
  assert.deepEqual(result.independent, [ready, stale]);
  assert.deepEqual(result.awaiting, [waiting, unknown]);
  assert.equal(result.independent[0], ready);
  assert.equal(result.awaiting[0], waiting);
  assert.notEqual(result.independent, items);
  assert.deepEqual(items.map((item) => item.id), ["ready", "waiting", "stale", "unknown", "published"]);
});

test("display identity bounds match the existing mutation context without accepting control characters",()=>{
  const actorId='edu:'+'x'.repeat(252),organizationId='y'.repeat(256);
  assert.equal(canOfferIndependentReview({...release,organizationId},{...context,actorId,organizationId}),true);
  for(const bad of ['edu:bad\nactor','edu:bad\u0000actor','edu:bad\u007factor','edu:'+'x'.repeat(253)])assert.equal(canOfferIndependentReview(release,{...context,actorId:bad}),false);
  for(const bad of ['org\nname','x'.repeat(257)])assert.equal(canOfferIndependentReview({...release,organizationId:bad},{...context,organizationId:bad}),false);
});
