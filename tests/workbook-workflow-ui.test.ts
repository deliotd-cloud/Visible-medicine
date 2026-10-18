import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";
import { workbookWorkflowRequest } from "../lib/workbook-workflow-request.ts";

const workbook = {
  id: "workbook-1",
  version: 7,
  status: "in-review",
  workflow: {
    materialRevision: "a".repeat(64),
    reviewRevision: 3,
    submissionCurrent: true,
    approvalCurrent: false,
  },
};

test("review payload carries exact displayed workbook and material binding", () => {
  assert.deepEqual(workbookWorkflowRequest(workbook, "review-workbook", {
    decision: "approved", comment: "  Independently checked  ",
  }), {
    action: "review-workbook", id: "workbook-1", decision: "approved",
    comment: "Independently checked", expectedVersion: 7,
    expectedStatus: "in-review", expectedReviewRevision: 3,
    expectedMaterialRevision: "a".repeat(64),
  });
  const request = workbookWorkflowRequest({ ...workbook, status: "draft" }, "request-workbook-review");
  assert.equal(request?.expectedStatus, "draft");
  assert.equal(request?.expectedMaterialRevision, "a".repeat(64));
  const publish = workbookWorkflowRequest({ ...workbook, status: "approved", workflow: { ...workbook.workflow, approvalCurrent: true } }, "publish-workbook");
  assert.equal(publish?.expectedReviewRevision, 3);
  assert.equal(publish?.expectedVersion, 7);
});

test("absent or invalid workflow binding fails closed", () => {
  for (const workflow of [undefined, null, { ...workbook.workflow, materialRevision: "" }, { ...workbook.workflow, materialRevision: "A".repeat(64) }, { ...workbook.workflow, materialRevision: "g".repeat(64) }, { ...workbook.workflow, reviewRevision: -1 }, { ...workbook.workflow, submissionCurrent: undefined }]) {
    assert.equal(workbookWorkflowRequest({ ...workbook, workflow: workflow as typeof workbook.workflow }, "review-workbook", { decision: "approved", comment: "yes" }), null);
  }
});

test("stale submission permits changes requested, not approval; any approved revision permits independent re-review", () => {
  const stale = { ...workbook, workflow: { ...workbook.workflow, submissionCurrent: false } };
  assert.equal(workbookWorkflowRequest(stale, "review-workbook", { decision: "approved", comment: "yes" }), null);
  assert.ok(workbookWorkflowRequest(stale, "review-workbook", { decision: "changes-requested", comment: "revise" }));
  const approved = { ...workbook, status: "approved" };
  assert.equal(workbookWorkflowRequest(approved, "publish-workbook"), null);
  assert.ok(workbookWorkflowRequest(approved, "review-workbook", { decision: "approved", comment: "re-review" }));
  assert.equal(workbookWorkflowRequest(approved, "review-workbook", { decision: "changes-requested", comment: "no" }), null);
  const currentlyApproved = { ...approved, workflow: { ...approved.workflow, approvalCurrent: true } };
  assert.deepEqual(workbookWorkflowRequest(currentlyApproved, "review-workbook", { decision: "approved", comment: "  Renderer changed  " }), {
    action: "review-workbook", id: "workbook-1", decision: "approved", comment: "Renderer changed",
    expectedVersion: 7, expectedStatus: "approved", expectedReviewRevision: 3,
    expectedMaterialRevision: "a".repeat(64),
  });
  assert.ok(workbookWorkflowRequest(currentlyApproved, "publish-workbook"));
});

test("review note must be a bounded valid decision without NUL", () => {
  const request = (comment: string, decision: string = "approved") =>
    workbookWorkflowRequest(workbook, "review-workbook", { comment, decision: decision as "approved" });
  assert.equal(request(" "), null);
  assert.equal(request("x".repeat(2001)), null);
  assert.equal(request("valid\0invalid"), null);
  assert.equal(request("valid", "unknown"), null);
  assert.equal(request(" x ")?.comment, "x");
  assert.equal(request("x".repeat(2000))?.comment?.length, 2000);
});

test("focused and table review actions share the central guarded request", () => {
  const source = readFileSync(new URL("../components/EducationRuntime.tsx", import.meta.url), "utf8");
  const guard = source.indexOf("async function postAction(");
  const fetch = source.indexOf("const response = await fetch(endpoint", guard);
  assert.ok(guard >= 0 && fetch > guard);
  assert.match(source.slice(guard, fetch), /workbookWorkflowRequest\(shown, action, options\)/);
  assert.match(source.slice(guard, fetch), /workbookWorkflowRequest\(latest, action, options\)/);
  assert.match(source.slice(guard, fetch), /payload = shownRequest/);
  assert.equal((source.match(/void postAction\(\{ action: "review-workbook"/g) ?? []).length >= 4, true);
  assert.equal((source.match(/<summary>Independent re-review<\/summary>/g) ?? []).length, 2);
  assert.match(source, /focusedWorkbook\.status === "approved" && <details>/);
  assert.match(source, /workbook\.status === "approved" && <details>/);
  assert.match(source, /Boolean\(focusedWorkbook\.authorId\) && focusedWorkbook\.authorId !== data\.currentUser\.id/);
  assert.equal((source.match(/disabled=\{busy \|\| !workbook\.authorId \|\| workbook\.authorId === data\.currentUser\.id/g) ?? []).length, 3);
});

test("closed read-only source preview keeps order and escapes source text", () => {
  const source = readFileSync(new URL("../components/EducationRuntime.tsx", import.meta.url), "utf8");
  const start = source.indexOf("function previewJsonText(");
  const end = source.indexOf("function WorkbookBuilder(", start);
  assert.ok(start >= 0 && end > start);
  const code = ts.transpileModule(source.slice(start, end) + "\nexports.Preview = WorkbookReviewSourcePreview;", {
    compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const evaluated = { exports: {} as { Preview: (props: unknown) => unknown } };
  new Function("require", "module", "exports", code)(createRequire(import.meta.url), evaluated, evaluated.exports);
  const html = renderToStaticMarkup(evaluated.exports.Preview({ content: {
    cases: [
      { id: "c2", title: "Second <script>", description: "B", position: 1, unavailable: false,
        questions: [{ id: "q2", prompt: "Edited <b>question", maxMarks: 2, responseType: "text", optionsJson: '[{"id":"o2","label":"Choice <script>"},{"id":"o1","label":"Other"}]', rubric: { version: 2, criteriaJson: '[{"label":"Safe <mark>","marks":2}]' } }] },
      { id: "c1", title: "First", description: "A", position: 2, unavailable: false, questions: [] },
    ],
    notes: [{ caseId: "c2", title: "Private note", body: "Do not persist", keyPointsJson: "[]", revealText: "Reveal" }],
    blocks: [{ caseId: "c2", title: "Teaching block", body: "Block body", type: "key-points", url: "", position: 1 }],
    polls: [{ caseId: "c2", prompt: "Poll?", selectionMode: "single", optionsJson: '[{"id":"o1","label":"Option"}]', correctOptionIdsJson: '["o1"]', explanation: "Because", position: 1 }],
  } }) as Parameters<typeof renderToStaticMarkup>[0]);
  assert.match(html, /<details[^>]*><summary>Inspect current review source<\/summary>/);
  assert.ok(html.indexOf("Second &lt;script&gt;") < html.indexOf("First"));
  assert.match(html, /Edited &lt;b&gt;question/);
  assert.match(html, /Safe &lt;mark&gt;/);
  assert.match(html, /&quot;id&quot;:&quot;o2&quot;/);
  assert.match(html, /&quot;marks&quot;:2/);
  assert.ok(html.indexOf("o2") < html.indexOf("o1"));
  assert.doesNotMatch(html, />1\. Second/);
  assert.match(html, /Private note/);
  assert.match(html, /Teaching block/);
  assert.match(html, /Poll\?/);
  assert.doesNotMatch(html, /<input|<textarea|<script>/);
});
