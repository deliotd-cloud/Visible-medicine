import assert from "node:assert/strict";
import test from "node:test";
import {
  introductoryTeachingSlides,
  TeachingContentValidationError,
  validateTeachingContentBlock,
} from "../lib/teaching-content.ts";

const baseSlide = {
  caseId: "case-1",
  type: "presentation-slide" as const,
  title: "Learning objectives",
  body: "Review the anatomy before opening the imaging viewer.",
  url: "",
};

test("an introduction slide is valid without an image", () => {
  assert.deepEqual(validateTeachingContentBlock(baseSlide), baseSlide);
});

test("an introduction slide rejects external content addresses", () => {
  assert.throws(
    () => validateTeachingContentBlock({ ...baseSlide, url: "https://example.org/slide.png" }),
    TeachingContentValidationError,
  );
});

test("introductory slides are isolated from case content and ordered", () => {
  const blocks = [
    { ...baseSlide, id: "slide-2", workbookId: "workbook-1", position: 4, version: 1 },
    { ...baseSlide, id: "case-note", workbookId: "workbook-1", position: 2, version: 1, type: "text" as const },
    { ...baseSlide, id: "slide-1", workbookId: "workbook-1", position: 1, version: 1 },
  ];
  assert.deepEqual(
    introductoryTeachingSlides(blocks).map((slide) => slide.id),
    ["slide-1", "slide-2"],
  );
});
