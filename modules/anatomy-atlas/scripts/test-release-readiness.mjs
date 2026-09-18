import test from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { evaluateReleaseReadiness, REQUIRED_GATE_IDS, runReleaseReadiness } from "./release-readiness.mjs";

const A = "a".repeat(40);
const W = "b".repeat(40);

function manifest(status = "pending") {
  return {
    schemaVersion: 1,
    candidate: { atlasRevision: A, websiteRevision: W },
    releaseAuthority: { status: "external-verification-required" },
    gates: REQUIRED_GATE_IDS.map((id) => ({
      id,
      status,
      owner: id === "imaging" || id === "assurance" ? "radiologist" : "agent",
      criterion: `Concrete ${id} criterion`,
      action: `Complete ${id} action`,
      attestation: status === "pass" ? {
        kind: "gate-record",
        atlasRevision: A,
        websiteRevision: W,
        evidence: [`evidence/${id}-review.json`],
        reviewer: `${id} reviewer`,
        timestamp: "2026-09-18T12:00:00Z",
      } : null,
    })),
  };
}

function capture() {
  let value = "";
  return { stream: { write(chunk) { value += chunk; } }, read: () => value };
}

test("pending baseline is valid but is not ready", () => {
  const result = evaluateReleaseReadiness(manifest());
  assert.equal(result.valid, true);
  assert.equal(result.ready, false);
  assert.deepEqual(result.counts, { pass: 0, pending: 6 });
});

test("rejects missing, duplicate and unexpected gates", () => {
  const missing = manifest();
  missing.gates.pop();
  assert.match(evaluateReleaseReadiness(missing).errors.join("\n"), /missing required gate: assurance/);

  const duplicate = manifest();
  duplicate.gates.push({ ...duplicate.gates[0] });
  assert.match(evaluateReleaseReadiness(duplicate).errors.join("\n"), /duplicate gate: scope/);

  const unknown = manifest();
  unknown.gates.push({ ...unknown.gates[0], id: "deployment" });
  assert.match(evaluateReleaseReadiness(unknown).errors.join("\n"), /unknown gate: deployment/);
});

test("rejects malformed candidate revisions and unknown states", () => {
  const fixture = manifest();
  fixture.schemaVersion = 2;
  fixture.candidate.atlasRevision = "26b7c097";
  fixture.gates[0].status = "approved";
  const errors = evaluateReleaseReadiness(fixture).errors.join("\n");
  assert.match(errors, /schemaVersion must be 1/);
  assert.match(errors, /exact 40-character hexadecimal revision/);
  assert.match(errors, /unknown status: approved/);
});

test("rejects stale revision-bound pass attestations", () => {
  const fixture = manifest("pass");
  fixture.gates[0].attestation.atlasRevision = "c".repeat(40);
  fixture.gates[1].attestation.websiteRevision = "d".repeat(40);
  const errors = evaluateReleaseReadiness(fixture).errors.join("\n");
  assert.match(errors, /scope attestation atlas revision does not match/);
  assert.match(errors, /viewer attestation website revision does not match/);
});

test("pass requires evidence, reviewer and timestamp", () => {
  const fixture = manifest("pass");
  fixture.gates[0].attestation.evidence = [];
  fixture.gates[1].attestation.reviewer = "TODO";
  fixture.gates[2].attestation.timestamp = "yesterday";
  fixture.gates[3].attestation.evidence = ["TODO evidence"];
  fixture.gates[4].attestation.timestamp = "2026-02-30T12:00:00Z";
  const errors = evaluateReleaseReadiness(fixture).errors.join("\n");
  assert.match(errors, /scope pass requires at least one evidence reference/);
  assert.match(errors, /viewer pass requires a named reviewer/);
  assert.match(errors, /teaching pass requires an ISO UTC timestamp/);
  assert.match(errors, /imaging evidence\[0\] must be a syntactically valid, non-placeholder reference/);
  assert.match(errors, /access pass requires an ISO UTC timestamp/);
});

test("a fully documented fixture is ready but retains external authority boundary", async () => {
  const fixture = manifest("pass");
  const result = evaluateReleaseReadiness(fixture);
  assert.equal(result.valid, true);
  assert.equal(result.ready, true);
  const cwd = await mkdtemp(join(tmpdir(), "release-readiness-api-"));
  try {
    await writeFile(join(cwd, "manifest.json"), `${JSON.stringify(fixture)}\n`);
    const out = capture();
    assert.equal(await runReleaseReadiness({ argv: ["--check", "manifest.json"], cwd, stdout: out.stream }), 0);
    assert.match(out.read(), /external release authorization is still required/);
    assert.match(out.read(), /resolution and authenticity remain externally verified/);
  } finally {
    await rm(cwd, { recursive: true, force: true });
  }
});

function runCli(args, cwd) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [join(import.meta.dirname, "release-readiness.mjs"), ...args], {
      cwd, shell: false, windowsHide: true,
    });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => { stdout += chunk; });
    child.stderr.on("data", (chunk) => { stderr += chunk; });
    child.once("error", reject);
    child.once("close", (code) => resolve({ code, stdout, stderr }));
  });
}

test("CLI report exits zero for valid pending data and --check exits nonzero", async () => {
  const cwd = await mkdtemp(join(tmpdir(), "release-readiness-cli-"));
  try {
    await writeFile(join(cwd, "manifest.json"), `${JSON.stringify(manifest())}\n`);
    const report = await runCli(["manifest.json"], cwd);
    assert.equal(report.code, 0);
    assert.match(report.stdout, /0\/6 pass, 6 pending/);
    assert.match(report.stdout, /does not grant or verify publication or clinical release authority/);
    assert.equal((await runCli(["--check", "manifest.json"], cwd)).code, 1);
  } finally {
    await rm(cwd, { recursive: true, force: true });
  }
});
