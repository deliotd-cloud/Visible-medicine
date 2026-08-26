import assert from "node:assert/strict";
import test from "node:test";

import { liveClassroomHref } from "../lib/live-classroom-links.ts";

test("live classroom links open teaching and request the video panel", () => {
  assert.equal(
    liveClassroomHref("head-and-neck", "workbook / one"),
    "/learn/head-and-neck/workbook%20%2F%20one?view=teaching&video=1",
  );
});
