import assert from "node:assert/strict";
import test from "node:test";
import { moveStudioReleaseItem, normalizeStudioReleaseOrder, studioSelectedReleaseOrder } from "../lib/studio-release-order.ts";

test("normalize release order keeps exact valid requested IDs, then remaining available IDs", () => {
  const available = Object.freeze(["case:a", "case:b", "case:a", "case:c"]);
  const requested = Object.freeze(["case:c", "case:missing", "case:c", "case:A", "case:b"]);
  assert.deepEqual(normalizeStudioReleaseOrder(available, requested), ["case:c", "case:b", "case:a"]);
  assert.deepEqual(normalizeStudioReleaseOrder(available, []), ["case:a", "case:b", "case:c"]);
  assert.deepEqual(available, ["case:a", "case:b", "case:a", "case:c"]);
  assert.deepEqual(requested, ["case:c", "case:missing", "case:c", "case:A", "case:b"]);
});

test("move release item swaps one adjacent entry and preserves inputs at boundaries", () => {
  const order = Object.freeze(["case:a", "case:b", "case:c"]);
  assert.deepEqual(moveStudioReleaseItem(order, "case:b", "up"), ["case:b", "case:a", "case:c"]);
  assert.deepEqual(moveStudioReleaseItem(order, "case:b", "down"), ["case:a", "case:c", "case:b"]);
  assert.deepEqual(moveStudioReleaseItem(order, "case:a", "up"), [...order]);
  assert.deepEqual(moveStudioReleaseItem(order, "case:c", "down"), [...order]);
  assert.deepEqual(moveStudioReleaseItem(order, "case:A", "up"), [...order]);
  assert.deepEqual(order, ["case:a", "case:b", "case:c"]);
});

test("selected release order intersects IDs exactly, once, in current order", () => {
  const order = Object.freeze(["case:b", "case:a", "case:b", "case:c"]);
  const selected = Object.freeze(["case:c", "case:b", "case:B", "case:missing"]);
  assert.deepEqual(studioSelectedReleaseOrder(order, selected), ["case:b", "case:c"]);
  assert.deepEqual(order, ["case:b", "case:a", "case:b", "case:c"]);
  assert.deepEqual(selected, ["case:c", "case:b", "case:B", "case:missing"]);
});
