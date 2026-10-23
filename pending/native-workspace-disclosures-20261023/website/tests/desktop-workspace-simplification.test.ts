import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";
import { isPublicFocusPath, shouldFocusPublicRoute } from "../lib/public-route-focus.ts";
import { reviewDestination, reviewDestinationActive } from "../lib/review-destination.ts";

const require = createRequire(import.meta.url);
let pathname = "/workspace";
let roles = ["administrator"];
let reviewAuthorizationError: Error | null = null;
let reviewAuthorizationCalls = 0;
function compile(path: string, mocks: Record<string, unknown>) {
  const source = readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
  const code = ts.transpileModule(source, { compilerOptions: {
    jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2022, esModuleInterop: true,
  } }).outputText;
  const module = { exports: {} as Record<string, unknown> };
  new Function("require", "module", "exports", code)((name: string) => name in mocks ? mocks[name] : require(name), module, module.exports);
  return module.exports;
}
const Link = ({ children, ...props }: React.PropsWithChildren<React.AnchorHTMLAttributes<HTMLAnchorElement>>) => React.createElement("a", props, children);
const navMock = { usePathname: () => pathname };
const { SiteFrame } = compile("components/SiteFrame.tsx", {
  "next/link": Link, "next/navigation": navMock, "./SiteHeader": { SiteHeader: () => null },
  "./SiteFooter": { SiteFooter: () => null }, "./workspace-navigation.css": {},
  "../lib/public-route-focus": { isPublicFocusPath, shouldFocusPublicRoute },
  "../lib/review-destination": { reviewDestination, reviewDestinationActive },
}) as { SiteFrame: React.ComponentType<React.PropsWithChildren<{ signedIn: boolean; reviewAvailable: boolean }>> };
const { NativeDisclosure } = compile("components/NativeDisclosure.tsx", {
  "../lib/head-disclosure-keyboard": require("../lib/head-disclosure-keyboard.ts"),
});
const { StudioNavigation } = compile("components/StudioNavigation.tsx", {
  "next/link": Link, "next/navigation": navMock, "./NativeDisclosure": { NativeDisclosure },
}) as { StudioNavigation: React.ComponentType<{ educationRoles: readonly string[] }> };
const snapshot = {
  organization: { name: "Education Trust", role: "educator" },
  entitlement: { status: "active", plan: "Education", storageBytes: 1073741824,
    learnerLimit: 20, educatorLimit: 5, atlasAccess: true, studioAccess: true,
    reportingAccess: true, embedsAccess: false },
  usage: { learners: 3, courses: 2, workbooks: 4, governedMedia: 0 },
  publications: [], embedOrigins: [], educationRoles: ["administrator"],
};
const { default: WorkspacePage } = compile("app/workspace/page.tsx", {
  "next/link": Link, "next/navigation": { redirect: (href: string) => { throw new Error(`redirect:${href}`); } },
  "../chatgpt-auth": { requireChatGPTUser: async () => ({ userId: "one", email: "one@example.test", displayName: "Educator" }) },
  "../../db/platform": { getPlatformSnapshot: async () => snapshot },
  "../../components/EmbedOriginManager": { EmbedOriginManager: () => React.createElement("div", { "data-testid": "embed-manager" }) },
  "../../components/NativeDisclosure": { NativeDisclosure },
  "@/db/bootstrap": { ensureEducationUser: async () => ({ roles }) },
  "@/lib/clinical-review-server": { authorizeClinicalReview: async () => {
    reviewAuthorizationCalls++;
    if (reviewAuthorizationError) throw reviewAuthorizationError;
  } },
}) as { default: () => Promise<React.ReactElement> };

test("workspace offers three clear administrator destinations and retains all existing actions", async () => {
  roles = ["administrator"];
  reviewAuthorizationError = null;
  reviewAuthorizationCalls = 0;
  const html = renderToStaticMarkup(await WorkspacePage());
  assert.equal(reviewAuthorizationCalls, 1);
  assert.match(html, /aria-label="Choose your work"/);
  for (const href of ["/my-learning", "/studio/workspace", "/workspace/clinical-review-inbox"])
    assert.match(html, new RegExp(`href="${href}"`));
  for (const href of ["/search", "/workspace/atlas-review", "/learn/fracture-review", "/workspace/people",
    "/workspace/readiness", "/studio/analytics", "/api/platform/report", "/workspace/control#identity",
    "/workspace/control#publishing", "/workspace/control"])
    assert.match(html, new RegExp(`href="${href}"`));
  assert.match(html, /<details><summary>Administration/);
  assert.match(html, /<details class="workspace-overview"><summary>Institution overview/);
  assert.match(html, /data-testid="embed-manager"/);
});

test("workspace preserves role redirect and keeps administrator-only review content out of instructor view", async () => {
  roles = ["instructor"];
  reviewAuthorizationCalls = 0;
  const html = renderToStaticMarkup(await WorkspacePage());
  assert.equal(reviewAuthorizationCalls, 0);
  assert.doesNotMatch(html, /href="\/workspace\/clinical-review-inbox"/);
  assert.doesNotMatch(html, /href="\/workspace\/atlas-review"/);
  assert.doesNotMatch(html, /href="\/learn\/fracture-review"/);
  assert.doesNotMatch(html, /data-testid="embed-manager"/);
  roles = ["examiner"];
  const examiner = renderToStaticMarkup(await WorkspacePage());
  assert.equal(reviewAuthorizationCalls, 0);
  assert.match(examiner, /href="\/studio\/workspace"/);
  assert.doesNotMatch(examiner, /href="\/workspace\/clinical-review-inbox"/);
  roles = ["learner"];
  await assert.rejects(WorkspacePage(), /redirect:\/my-learning/);
  assert.equal(reviewAuthorizationCalls, 0);
});

test("admitted teaching staff see Studio and reports without institution administration", async () => {
  for (const role of ["instructor", "examiner"]) {
    roles = [role];
    const html = renderToStaticMarkup(await WorkspacePage());
    assert.match(html, /href="\/studio\/workspace"/);
    assert.match(html, /<summary>Teaching reports/);
    assert.match(html, /href="\/studio\/analytics"/);
    assert.doesNotMatch(html, /<summary>Administration/);
    for (const href of ["/workspace/people", "/workspace/readiness", "/workspace/control#identity",
      "/workspace/control#publishing", "/workspace/control", "/api/platform/report"])
      assert.doesNotMatch(html, new RegExp(`href="${href}"`));
  }
});

test("Studio entitlement removes Studio and reports destinations while retaining permitted tools", async () => {
  const prior = snapshot.entitlement.studioAccess;
  snapshot.entitlement.studioAccess = false;
  try {
    for (const role of ["instructor", "administrator"]) {
      roles = [role];
      const html = renderToStaticMarkup(await WorkspacePage());
      assert.match(html, /href="\/my-learning"/);
      assert.doesNotMatch(html, /href="\/studio\/workspace"/);
      assert.doesNotMatch(html, /href="\/studio\/analytics"/);
      assert.doesNotMatch(html, /<summary>Teaching reports/);
      if (role === "administrator") {
        assert.match(html, /href="\/workspace\/people"/);
        assert.match(html, /href="\/workspace\/control"/);
      } else {
        assert.doesNotMatch(html, /<summary>Administration/);
      }
    }
  } finally {
    snapshot.entitlement.studioAccess = prior;
  }
});

test("administrator without Clinical Review eligibility keeps Workspace and Studio but not the review tile", async () => {
  roles = ["administrator"];
  for (const reason of ["membership denied", "review storage unavailable"]) {
    reviewAuthorizationError = new Error(reason);
    reviewAuthorizationCalls = 0;
    const html = renderToStaticMarkup(await WorkspacePage());
    assert.equal(reviewAuthorizationCalls, 1);
    assert.match(html, /href="\/my-learning"/);
    assert.match(html, /href="\/studio\/workspace"/);
    assert.doesNotMatch(html, /href="\/workspace\/clinical-review-inbox"/);
    assert.doesNotMatch(html, /03 · Review/);
    assert.doesNotMatch(html, new RegExp(reason));
    assert.match(html, /href="\/workspace\/people"/);
    assert.match(html, /data-testid="embed-manager"/);
  }
  reviewAuthorizationError = null;
});

test("frame separates Clinical Review from Administration active states", () => {
  for (const route of ["/workspace/clinical-review-inbox", "/workspace/atlas-review/regional-mri",
    "/workspace/atlas-review/source-comparisons"] ) {
    pathname = route;
    const html = renderToStaticMarkup(React.createElement(SiteFrame, { signedIn: true, reviewAvailable: true }, "content"));
    assert.match(html, /aria-label="Clinical Review navigation"/);
    assert.match(html, /aria-current="page" href="\/workspace\/clinical-review-inbox">Clinical Review/);
    assert.match(html, /class="workspace-admin-link" href="\/workspace">Administration/);
    assert.match(html, /Education &amp; research only/);
  }
  pathname = "/workspace/people";
  const html = renderToStaticMarkup(React.createElement(SiteFrame, { signedIn: true, reviewAvailable: false }, "content"));
  assert.match(html, /aria-label="Administration navigation"/);
  assert.match(html, /aria-current="page" href="\/workspace\/people">People/);
  assert.match(html, /aria-current="page" href="\/workspace">Workspace/);
  assert.doesNotMatch(html, /href="\/workspace\/clinical-review-inbox"/);
  assert.doesNotMatch(html, /class="workspace-admin-link"/);
  for (const route of ["/my-learning", "/studio/workspace", "/workspace", "/account/settings"]) {
    pathname = route;
    const ordinary = renderToStaticMarkup(React.createElement(SiteFrame, { signedIn: true, reviewAvailable: false }, "content"));
    assert.match(ordinary, /href="\/workspace">Workspace/);
    assert.doesNotMatch(ordinary, /href="\/workspace\/clinical-review-inbox"/);
    assert.doesNotMatch(ordinary, /class="workspace-admin-link"/);
    if (route === "/workspace") assert.doesNotMatch(ordinary, /aria-label="Administration navigation"/);
  }
});

test("Studio keeps course and workbook tasks primary and role filters secondary links", () => {
  pathname = "/studio/publishing";
  const examiner = renderToStaticMarkup(React.createElement(StudioNavigation, { educationRoles: ["examiner"] }));
  assert.match(examiner, /href="\/studio\/courses">Courses/);
  assert.match(examiner, /href="\/studio\/workbooks">Workbooks/);
  assert.doesNotMatch(examiner, /<details class="studio-manage-navigation" open="">/);
  assert.match(examiner, /aria-current="page" href="\/studio\/publishing">Review &amp; publish/);
  assert.match(examiner, /href="\/studio\/analytics">Reports/);
  assert.doesNotMatch(examiner, /href="\/studio\/cohorts"/);
  assert.doesNotMatch(examiner, /href="\/workspace">Organisation/);
  const admin = renderToStaticMarkup(React.createElement(StudioNavigation, { educationRoles: ["administrator"] }));
  assert.match(admin, /href="\/studio\/cohorts">Learner groups/);
  assert.match(admin, /href="\/workspace">Organisation/);
});
