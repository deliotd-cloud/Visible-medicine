import assert from "node:assert/strict";
import test from "node:test";
import { cleanCourseCatalogueQuery, courseCatalogueHref, courseCatalogueSearchParams, courseCatalogueSearchTerm, emptyCourseCatalogueFilters, parseCourseCatalogueFilters } from "../lib/course-catalogue-filters.ts";
import { courseSearchText } from "../lib/pilot-readiness.ts";
import * as filtersModule from "../lib/course-catalogue-filters.ts";
import * as discovery from "../lib/pilot-readiness.ts";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import ts from "typescript";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

const levels = ["Foundation", "Advanced"];

test("a saved catalogue link restores all filters and keeps unrelated navigation context", () => {
  const original = "https://visiblemedicine.test/courses?source=home&q=CT%2FMRI&level=Advanced&access=free&publisher=official#course-catalogue";
  const filters = parseCourseCatalogueFilters(new URL(original).searchParams, levels);
  assert.deepEqual(filters, { query: "CT/MRI", level: "Advanced", access: "free", publisher: "official" });
  assert.equal(courseCatalogueHref(original, filters), original.replace("https://visiblemedicine.test", ""));
  assert.equal(courseCatalogueHref(original, emptyCourseCatalogueFilters()), "/courses?source=home#course-catalogue");
});

test("unknown and repeated filter values safely return to defaults", () => {
  const params = courseCatalogueSearchParams({ q: ["CT", "MRI"], level: "Unknown", access: ["free", "paid"], publisher: "other" });
  assert.deepEqual(parseCourseCatalogueFilters(params, levels), emptyCourseCatalogueFilters());
  assert.deepEqual(parseCourseCatalogueFilters(new URLSearchParams("q=CT%00MRI&level=Foundation&access=free&publisher=institution"), levels), {
    query: "CTMRI", level: "Foundation", access: "free", publisher: "institution",
  });
  assert.equal(cleanCourseCatalogueQuery("a".repeat(200)).length, 160);
});

test("the typed term uses the same title normalization as indexed courses", () => {
  const course = { id: "example", title: "CT/MRI and X-ray", summary: "", level: "Foundation", outcomes: [], publisherKind: "official", accessModel: "free" };
  assert(courseSearchText(course).includes(courseCatalogueSearchTerm("CT/MRI")));
  assert(courseSearchText(course).includes(courseCatalogueSearchTerm("X-ray")));
  assert.equal(courseCatalogueSearchTerm(" ＣＴ／ＭＲＩ "), "ct mri");
});

test("the real page passes normalized filters into its first render without changing catalogue authorization", async () => {
  const require = createRequire(import.meta.url);
  const Link = ({ children, ...props }: any) => React.createElement("a", props, children);
  const load = (relative: string, dependencies: Record<string, unknown>) => {
    const source = readFileSync(new URL(relative, import.meta.url), "utf8");
    const compiled = ts.transpileModule(source, { reportDiagnostics: true, compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } });
    assert.equal(compiled.diagnostics?.filter(d => d.category === ts.DiagnosticCategory.Error).length, 0);
    const module = { exports: {} as Record<string, any> };
    new Function("require", "module", "exports", compiled.outputText)((name: string) => dependencies[name] ?? require(name), module, module.exports);
    return module.exports;
  };
  const catalogue = load("../components/CourseCatalogue.tsx", {
    "next/link": { default: Link }, "@/lib/pilot-readiness": discovery, "@/lib/course-catalogue-filters": filtersModule,
  });
  const courses = [{ id: "synthetic", title: "CT/MRI Brain", slug: "synthetic", summary: "Synthetic course", level: "Foundation", outcomes: [], publisherKind: "official", accessModel: "free", workbookCount: 1, duration: "10 min", currency: "GBP", priceMinor: 0 }];
  for (const signedIn of [false, true]) {
    const user = signedIn ? { userId: "synthetic", email: "synthetic@example.invalid", displayName: "Synthetic learner" } : null;
    const expectedAuth = user ? { userId: "edu:synthetic", externalSubject: "sites:synthetic", email: user.email, displayName: user.displayName } : null;
    let profileReads = 0;
    const page = load("../app/courses/page.tsx", {
      "next/link": { default: Link }, "../chatgpt-auth": { getChatGPTUser: async () => user },
      "@/lib/education-platform": { listCatalogueCourses: async (auth: unknown) => { assert.deepEqual(auth, expectedAuth); return courses; }, getLearnerProfile: async (auth: unknown) => { assert.deepEqual(auth, expectedAuth); profileReads++; return null; } },
      "@/components/CourseCatalogue": catalogue, "@/lib/course-catalogue-filters": filtersModule,
    });
    const html = renderToStaticMarkup(await page.default({ searchParams: Promise.resolve({ q: "CT/MRI", level: "Foundation", access: "free", publisher: "official" }) }));
    assert.match(html, /value="CT\/MRI"/);
    assert.match(html, /href="\/courses\/synthetic"/);
    assert.match(html, /role="status" aria-live="polite" aria-atomic="true"/);
    assert.equal(profileReads, signedIn ? 1 : 0);
  }
});
