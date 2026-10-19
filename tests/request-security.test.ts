import assert from "node:assert/strict";
import test from "node:test";

import { isJsonRequest, isSameOriginMutation } from "../lib/request-security.ts";

test("rejects cross-origin state changes and accepts same-origin requests", () => {
  assert.equal(isSameOriginMutation(new Request("https://visiblemedicine.com/api/learner/account", { method: "POST", headers: { origin: "https://evil.example", "sec-fetch-site": "cross-site" } })), false);
  assert.equal(isSameOriginMutation(new Request("https://visiblemedicine.com/api/learner/account", { method: "POST", headers: { origin: "https://visiblemedicine.com", "sec-fetch-site": "same-origin" } })), true);
});

test("account mutations require JSON", () => {
  assert.equal(isJsonRequest(new Request("https://visiblemedicine.com/api", { method: "POST", headers: { "content-type": "application/json; charset=utf-8" } })), true);
  assert.equal(isJsonRequest(new Request("https://visiblemedicine.com/api", { method: "POST", headers: { "content-type": "text/plain" } })), false);
});
