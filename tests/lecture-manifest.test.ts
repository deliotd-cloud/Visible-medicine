import assert from "node:assert/strict";
import test from "node:test";

import {
  MAX_LECTURE_SLIDES_BYTES,
  validateLectureSlides,
} from "../lib/lecture-content.ts";
import {
  createLectureManifestRecord,
  LECTURE_MANIFEST_SCHEMA,
  parseAndVerifyLectureManifest,
} from "../lib/lecture-manifest.ts";

const slide = {
  id: "slide-1",
  title: "Orientation",
  body: "An education-only introduction.",
  referenceUrl: "https://example.edu/reference",
};

const manifest = (overrides: Record<string, unknown> = {}) => ({
  schema: LECTURE_MANIFEST_SCHEMA,
  product: "Visible Medicine",
  intendedPurpose: "education-only",
  workbook: { id: "lecture_1", title: "Head and neck", mode: "lecture", version: 7 },
  slides: [slide],
  ...overrides,
});

test("validates exact slide fields while preserving input order", () => {
  const second = { ...slide, id: "slide-2", title: "Second" };
  assert.deepEqual(validateLectureSlides([second, slide]).map((item) => item.id), ["slide-2", "slide-1"]);
  assert.throws(() => validateLectureSlides([{ ...slide, extra: true }]));
  assert.throws(() => validateLectureSlides([{ ...slide, title: 12 }]));
  assert.throws(() => validateLectureSlides([{ ...slide, body: "" }]));
  assert.throws(() => validateLectureSlides([{ ...slide, id: "not simple" }]));
});

test("allows empty slides only when explicitly validating a draft", () => {
  assert.throws(() => validateLectureSlides([]));
  assert.deepEqual(validateLectureSlides([], { allowEmpty: true }), []);
});

test("rejects duplicate identifiers and invalid reference URLs", () => {
  assert.throws(() => validateLectureSlides([slide, { ...slide }]));
  for (const referenceUrl of [
    "http://example.edu/reference",
    "https://user:password@example.edu/reference",
    "relative/reference",
    " https://example.edu/reference",
  ]) assert.throws(() => validateLectureSlides([{ ...slide, referenceUrl }]));
  assert.equal(validateLectureSlides([{ ...slide, referenceUrl: "" }])[0].referenceUrl, "");
});

test("rejects individual and aggregate limits instead of truncating", () => {
  assert.throws(() => validateLectureSlides([{ ...slide, title: "t".repeat(161) }]));
  assert.throws(() => validateLectureSlides([{ ...slide, body: "b".repeat(5_001) }]));
  assert.throws(() => validateLectureSlides([{ ...slide, referenceUrl: `https://example.edu/${"r".repeat(981)}` }]));
  assert.throws(() => validateLectureSlides(Array.from({ length: 81 }, (_, index) => ({ ...slide, id: `slide-${index}` }))));
  const oversized = Array.from({ length: 10 }, (_, index) => ({
    ...slide,
    id: `slide-${index}`,
    body: "é".repeat(2_500),
  }));
  assert.ok(new TextEncoder().encode(JSON.stringify(oversized)).byteLength > MAX_LECTURE_SLIDES_BYTES);
  assert.throws(() => validateLectureSlides(oversized));
});

test("creates deterministic canonical manifests and binds workbook version identity", async () => {
  const first = await createLectureManifestRecord(manifest());
  const reorderedInput = {
    slides: [{ body: slide.body, referenceUrl: slide.referenceUrl, title: slide.title, id: slide.id }],
    workbook: { version: 7, mode: "lecture", title: "Head and neck", id: "lecture_1" },
    intendedPurpose: "education-only",
    product: "Visible Medicine",
    schema: LECTURE_MANIFEST_SCHEMA,
  };
  const second = await createLectureManifestRecord(reorderedInput);
  assert.equal(first.manifestJson, second.manifestJson);
  assert.equal(first.integrityHash, second.integrityHash);
  assert.equal(first.manifest.workbook.version, 7);
  assert.deepEqual(await parseAndVerifyLectureManifest(first.manifestJson, first.integrityHash), first.manifest);

  const nextVersion = await createLectureManifestRecord(manifest({
    workbook: { id: "lecture_1", title: "Head and neck", mode: "lecture", version: 8 },
  }));
  assert.notEqual(first.integrityHash, nextVersion.integrityHash);
});

test("rejects malformed manifest fields, empty publication, and tampering", async () => {
  await assert.rejects(() => createLectureManifestRecord(manifest({ extra: true })));
  await assert.rejects(() => createLectureManifestRecord(manifest({ product: "Other" })));
  await assert.rejects(() => createLectureManifestRecord(manifest({ workbook: { id: "lecture_1", title: "Head and neck", mode: "teaching", version: 7 } })));
  await assert.rejects(() => createLectureManifestRecord(manifest({ workbook: { id: "lecture_1", title: "Head and neck", mode: "lecture", version: "7" } })));
  await assert.rejects(() => createLectureManifestRecord(manifest({ slides: [] })));

  const record = await createLectureManifestRecord(manifest());
  const tampered = record.manifestJson.replace("Orientation", "Altered");
  await assert.rejects(() => parseAndVerifyLectureManifest(tampered, record.integrityHash));
  await assert.rejects(() => parseAndVerifyLectureManifest(record.manifestJson, "not-a-hash"));
  await assert.rejects(() => parseAndVerifyLectureManifest("{", record.integrityHash));
});
