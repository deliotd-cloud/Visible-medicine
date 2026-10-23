import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";
import { filterReleaseQueue, parseReleaseQueue, workbookMatchesStatus, workbookQueue } from "../lib/studio-queues.ts";
import { canOfferIndependentReview, isPendingIndependentReview, partitionStudioReviewQueue } from "../lib/studio-review-queue.ts";

const require = createRequire(import.meta.url);

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
const { StudioWorkbookTable } = compile("components/StudioWorkbookTable.tsx", {
  "next/link": Link,
}) as { StudioWorkbookTable: React.ComponentType<{ workbooks: Array<Record<string, unknown>>; initialQueue?: "all" | "editing" }> };

test("workbook queue accepts only the exact editing token", () => {
  assert.equal(workbookQueue({ queue: "editing" }), "editing");
  for (const queue of [undefined, "", "all", "Editing", "editing ", "published", ["editing"], ["editing", "all"]]) {
    assert.equal(workbookQueue({ queue }), "all");
  }
  assert.equal(workbookMatchesStatus({ status: "draft" }, "editing"), true);
  assert.equal(workbookMatchesStatus({ status: "changes-requested" }, "editing"), true);
  assert.equal(workbookMatchesStatus({ status: "in-review" }, "editing"), false);
  assert.equal(workbookMatchesStatus({ status: "published" }, "editing"), false);
  assert.equal(workbookMatchesStatus({ status: "published" }, "all"), true);
  assert.equal(workbookMatchesStatus({ status: "published" }, "published"), true);
  assert.equal(workbookMatchesStatus({ status: "draft" }, "published"), false);
});

test("release queue rejects malformed and duplicate parameters", () => {
  assert.deepEqual(parseReleaseQueue({}), { status: "all", course: "", valid: true });
  assert.deepEqual(parseReleaseQueue({ status: "in-review", course: "course:one" }), {
    status: "in-review", course: "course:one", valid: true,
  });
  for (const status of ["", "editing", "unknown", "In-Review", ["in-review"], ["in-review", "approved"]]) {
    assert.equal(parseReleaseQueue({ status }).valid, false);
  }
  for (const course of [["course:one"], ["course:one", "course:two"], "x".repeat(257)]) {
    assert.equal(parseReleaseQueue({ course }).valid, false);
  }
  assert.equal(parseReleaseQueue({ course: "x".repeat(256) }).valid, true);
});

test("release queue intersects course and status without mutating the authorised snapshot", () => {
  const releases = Object.freeze([
    Object.freeze({ id: "a", status: "in-review", courseId: "course:one" }),
    Object.freeze({ id: "b", status: "changes-requested", courseId: "course:one" }),
    Object.freeze({ id: "c", status: "in-review", courseId: "course:two" }),
  ]);
  assert.deepEqual(filterReleaseQueue(releases, parseReleaseQueue({ status: "in-review", course: "course:one" })).map((item) => item.id), ["a"]);
  assert.deepEqual(filterReleaseQueue(releases, parseReleaseQueue({ status: "in-review" })).map((item) => item.id), ["a", "c"]);
  assert.deepEqual(filterReleaseQueue(releases, parseReleaseQueue({ course: "missing" })), []);
  assert.deepEqual(filterReleaseQueue(releases, parseReleaseQueue({ status: ["in-review", "approved"] })), []);
  assert.deepEqual(releases.map((item) => item.id), ["a", "b", "c"]);
});

test("workbook table starts in editing queue and defaults to all statuses", () => {
  const workbooks = [
    { id: "draft", status: "draft", title: "Draft workbook" },
    { id: "revision", status: "changes-requested", title: "Revision workbook" },
    { id: "published", status: "published", title: "Published workbook" },
  ].map((item) => ({ ...item, courseId: "course:one", moduleId: "module:one", courseTitle: "Course one",
    moduleTitle: "Module one", mode: "teaching", version: 1, durationMinutes: 0, caseCount: 1 }));
  const editing = renderToStaticMarkup(React.createElement(StudioWorkbookTable, { workbooks, initialQueue: "editing" }));
  assert.match(editing, /2 of 3 workbooks/);
  assert.match(editing, /Draft workbook/);
  assert.match(editing, /Revision workbook/);
  assert.doesNotMatch(editing, /Published workbook/);
  assert.match(editing, /<option value="editing" selected="">Drafts to continue<\/option>/);

  const all = renderToStaticMarkup(React.createElement(StudioWorkbookTable, { workbooks }));
  assert.match(all, /3 of 3 workbooks/);
  assert.match(all, /Published workbook/);
  assert.match(all, /<option value="all" selected="">All statuses<\/option>/);
});

test("Studio queue links feed the filtered pages and preserve course identity", () => {
  const source = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
  const home = source("app/studio/workspace/page.tsx");
  assert.match(home, /href: "\/studio\/workbooks\?queue=editing"/);
  assert.match(home, /href: "\/studio\/publishing\?review=independent"/);
  assert.match(home, /href: "\/studio\/publishing\?review=awaiting"/);
  assert.match(home, /href: "\/studio\/publishing\?status=changes-requested"/);

  const workbooksPage = source("app/studio/workbooks/page.tsx");
  assert.match(workbooksPage, /workbookQueue\(await searchParams\)/);
  assert.match(workbooksPage, /requireChatGPTUser\(queue === "editing" \? "\/studio\/workbooks\?queue=editing"/);
  assert.match(workbooksPage, /<StudioWorkbookTable key=\{queue\} workbooks=\{snapshot\.workbooks\} initialQueue=\{queue\}/);

  const publishingPage = source("app/studio/publishing/page.tsx");
  assert.match(publishingPage, /filterReleaseQueue\(snapshot\.releases, queue\)/);
  assert.match(publishingPage, /<form action="\/studio\/publishing" method="get"/);
  assert.match(publishingPage, /<select name="status"/);
  assert.match(publishingPage, /<select name="course"/);
  assert.match(publishingPage, /href="\/studio\/publishing">Clear filters/);
  assert.match(publishingPage, /Unavailable course/);

  const courseEditor = source("components/StudioCourseEditor.tsx");
  assert.match(courseEditor, /\/studio\/publishing\?course=\$\{encodeURIComponent\(course\.id\)\}/);
});

test("publishing page renders only selected authorised releases and handles invalid filters", async () => {
  const snapshot = {
    organization: { id: "synthetic-publishing-org" },
    educationRoles: ["administrator"],
    courses: [{ id: "course:one", title: "Course one" }, { id: "course:two", title: "Course two" }],
    releases: [
      { id: "release:a", courseId: "course:one", status: "in-review", title: "Release Alpha", publisherKind: "organisation", version: 1, summary: "Alpha", visibility: "private", accessModel: "invitation", workbookCount: 1, enrolmentOpen: false },
      { id: "release:b", courseId: "course:one", status: "changes-requested", title: "Release Beta", publisherKind: "organisation", version: 1, summary: "Beta", visibility: "private", accessModel: "invitation", workbookCount: 1, enrolmentOpen: false },
      { id: "release:c", courseId: "course:two", status: "in-review", title: "Release Gamma", publisherKind: "organisation", version: 1, summary: "Gamma", visibility: "private", accessModel: "invitation", workbookCount: 1, enrolmentOpen: false },
    ],
    releaseHistory: [],
  };
  const returnPaths: string[] = [];
  const { default: PublishingPage } = compile("app/studio/publishing/page.tsx", {
    "next/link": Link,
    "../../chatgpt-auth": { requireChatGPTUser: async (returnPath: string) => {
      returnPaths.push(returnPath);
      return { userId: "synthetic-user", email: "test@example.invalid", displayName: "Test User" };
    } },
    "@/components/StudioForms": { ReleaseWorkflowActions: () => null },
    "@/components/CourseInvitationPanel": { CourseInvitationPanel: () => null },
    "@/components/StudioShell": { StudioShell: ({ children }: React.PropsWithChildren) => React.createElement("main", null, children) },
    "@/lib/education-platform": { getStudioSnapshot: async () => snapshot },
    "@/lib/pilot-readiness": { releaseReadiness: () => ({ complete: 0, checks: [] }) },
    "@/lib/studio-queues": { filterReleaseQueue, parseReleaseQueue, RELEASE_QUEUE_STATUSES: ["draft", "in-review", "changes-requested", "approved", "published"] },
    "@/lib/studio-review-queue": { canOfferIndependentReview, isPendingIndependentReview, partitionStudioReviewQueue },
  }) as { default: (props: { searchParams: Promise<Record<string, string | string[] | undefined>> }) => Promise<React.ReactElement> };
  async function render(params: Record<string, string | string[] | undefined>) {
    return renderToStaticMarkup(await PublishingPage({ searchParams: Promise.resolve(params) }));
  }

  const selected = await render({ status: "in-review", course: "course:one" });
  assert.match(selected, /<h2>Release Alpha<\/h2>/);
  assert.doesNotMatch(selected, /<h2>Release Beta<\/h2>|<h2>Release Gamma<\/h2>/);
  assert.match(selected, /1 of 3 releases/);
  assert.match(selected, /<select name="status"/);
  assert.match(selected, /<select name="course"/);
  assert.equal(returnPaths.at(-1), "/studio/publishing?status=in-review&course=course%3Aone");

  const unknownCourse = await render({ course: "course:missing" });
  assert.doesNotMatch(unknownCourse, /<h2>Release (Alpha|Beta|Gamma)<\/h2>/);
  assert.match(unknownCourse, /Unavailable course/);
  assert.match(unknownCourse, /0 of 3 releases/);

  const invalid = await render({ status: ["in-review", "approved"] });
  assert.doesNotMatch(invalid, /<h2>Release (Alpha|Beta|Gamma)<\/h2>/);
  assert.match(invalid, /Invalid filter/);
  assert.equal(returnPaths.at(-1), "/studio/publishing");
});
