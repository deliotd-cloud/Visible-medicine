import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";

const require = createRequire(import.meta.url);
let pathname = "/studio/workspace";

function compile(path: string, mocks: Record<string, unknown>) {
  const source = readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
  const code = ts.transpileModule(source, { compilerOptions: {
    jsx: ts.JsxEmit.ReactJSX,
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2022,
    esModuleInterop: true,
  } }).outputText;
  const compiledModule = { exports: {} as Record<string, unknown> };
  new Function("require", "module", "exports", code)(
    (name: string) => name in mocks ? mocks[name] : require(name), compiledModule, compiledModule.exports,
  );
  return compiledModule.exports;
}

const Link = ({ children, ...props }: React.PropsWithChildren<React.AnchorHTMLAttributes<HTMLAnchorElement>>) => React.createElement("a", props, children);
const { StudioNavigation } = compile("components/StudioNavigation.tsx", {
  "next/link": Link,
  "next/navigation": { usePathname: () => pathname },
}) as { StudioNavigation: React.ComponentType<{ educationRoles: readonly string[] }> };
const { StudioWorkbookTable } = compile("components/StudioWorkbookTable.tsx", {
  "next/link": Link,
}) as { StudioWorkbookTable: React.ComponentType<{ workbooks: Array<Record<string, unknown>> }> };

test("Studio navigation keeps the compact primary IA and role-filters Manage links", () => {
  pathname = "/studio/workbooks/example";
  const instructor = renderToStaticMarkup(React.createElement(StudioNavigation, { educationRoles: ["instructor"] }));
  assert.match(instructor, />Home</);
  assert.match(instructor, />Courses</);
  assert.match(instructor, /aria-current="page" href="\/studio\/workbooks">Library</);
  assert.match(instructor, />Review &amp; publish</);
  assert.match(instructor, />Learner groups</);
  assert.match(instructor, />Reports</);
  assert.doesNotMatch(instructor, />Organisation</);
  assert.doesNotMatch(instructor, /<details class="studio-manage-navigation" open/);

  const examiner = renderToStaticMarkup(React.createElement(StudioNavigation, { educationRoles: ["examiner"] }));
  assert.doesNotMatch(examiner, />Learner groups</);
  assert.match(examiner, />Reports</);
  assert.doesNotMatch(examiner, />Organisation</);

  const administrator = renderToStaticMarkup(React.createElement(StudioNavigation, { educationRoles: ["administrator"] }));
  assert.match(administrator, />Learner groups</);
  assert.match(administrator, />Reports</);
  assert.match(administrator, /href="\/workspace">Organisation</);

  pathname = "/studio/analytics";
  const activeReports = renderToStaticMarkup(React.createElement(StudioNavigation, { educationRoles: ["examiner"] }));
  assert.match(activeReports, /<details class="studio-manage-navigation" open="">/);
  assert.match(activeReports, /aria-current="page" href="\/studio\/analytics">Reports</);
});

test("Library exposes direct builder entry while preserving workbook details and version", () => {
  const html = renderToStaticMarkup(React.createElement(StudioWorkbookTable, { workbooks: [{
    id: "workbook:one",
    courseId: "course:one",
    moduleId: "module:one",
    courseTitle: "Course one",
    moduleTitle: "Module one",
    title: "Draft workbook",
    mode: "teaching",
    status: "draft",
    version: 3,
    durationMinutes: 0,
    caseCount: 2,
  }] }));
  assert.match(html, /href="\/studio\/workbooks\/workbook%3Aone">Details</);
  assert.match(html, /href="\/studio\/workbooks\/workbook%3Aone\/builder">Edit →</);
  assert.match(html, />v3</);
});

test("Studio home uses one explicit new-course action and sends drafts to the builder", () => {
  const source = readFileSync(new URL("../app/studio/workspace/page.tsx", import.meta.url), "utf8");
  assert.equal((source.match(/\/studio\/courses\?new=1/g) ?? []).length, 1);
  assert.match(source, /\/studio\/workbooks\/\$\{encodeURIComponent\(workbook\.id\)\}\/builder/);
  assert.match(source, /\.filter\(\(queue\) => queue\.count > 0\)/);
  assert.doesNotMatch(source, /studio-metrics/);
});
