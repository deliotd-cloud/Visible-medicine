#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const REQUIRED_GATE_IDS = Object.freeze([
  "scope", "viewer", "teaching", "imaging", "access", "assurance",
]);

const REVISION = /^[0-9a-f]{40}$/i;
const SHA256 = /^[0-9a-f]{64}$/i;
const OWNERS = new Set(["agent", "radiologist", "shared"]);
const STATES = new Set(["pending", "pass"]);
const PLACEHOLDER = /^(?:t(?:o be determined|bd|odo)|n\/?a|none|placeholder|pending)$/i;

function nonPlaceholder(value) {
  return typeof value === "string" && value.trim().length > 0 && !PLACEHOLDER.test(value.trim());
}

function validEvidenceReference(value) {
  if (!nonPlaceholder(value) || /\b(?:todo|tbd|placeholder)\b/i.test(value)) return false;
  return /(?:[\\/#]|:\/\/|^urn:)/i.test(value);
}

function validateRevision(value, label, errors) {
  if (typeof value !== "string" || !REVISION.test(value)) {
    errors.push(`${label} must be an exact 40-character hexadecimal revision`);
  }
}

function validTimestamp(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(value)) return false;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return false;
  const canonical = parsed.toISOString();
  return value.includes(".") ? canonical === value : canonical.replace(".000Z", "Z") === value;
}

function validateEvidence(references, label, errors) {
  if (!Array.isArray(references) || references.length === 0) {
    errors.push(`${label} requires at least one evidence reference`);
  } else {
    references.forEach((reference, index) => {
      if (!validEvidenceReference(reference)) errors.push(`${label} evidence[${index}] must be a syntactically valid, non-placeholder reference`);
    });
  }
}

function validateDelivery(candidate, errors) {
  const delivery = candidate?.delivery;
  if (!delivery || typeof delivery !== "object" || Array.isArray(delivery)) {
    errors.push("candidate.delivery must be an object");
    return false;
  }

  const website = delivery.website;
  if (!website || typeof website !== "object" || Array.isArray(website)) {
    errors.push("candidate.delivery.website must be an object");
  } else {
    validateRevision(website.sourceRevision, "candidate.delivery.website.sourceRevision", errors);
    validateRevision(website.deployedRevision, "candidate.delivery.website.deployedRevision", errors);
    if (website.sourceRevision !== candidate.websiteRevision) errors.push("candidate.delivery.website.sourceRevision does not match candidate.websiteRevision");
    if (website.deployedRevision !== candidate.websiteRevision) errors.push("candidate.delivery.website.deployedRevision does not match candidate.websiteRevision");
    if (!Number.isSafeInteger(website.versionNumber) || website.versionNumber < 1) errors.push("candidate.delivery.website.versionNumber must be a positive integer");
    if (!nonPlaceholder(website.versionId)) errors.push("candidate.delivery.website.versionId must be non-placeholder");
    if (!nonPlaceholder(website.deploymentId)) errors.push("candidate.delivery.website.deploymentId must be non-placeholder");
    if (website.status !== "succeeded") errors.push('candidate.delivery.website.status must be "succeeded"');
    if (website.audience !== "owner-only") errors.push('candidate.delivery.website.audience must be "owner-only"');
    validateEvidence(website.evidence, "candidate.delivery.website", errors);
  }

  const viewer = delivery.sharedViewer;
  if (!viewer || typeof viewer !== "object" || Array.isArray(viewer)) {
    errors.push("candidate.delivery.sharedViewer must be an object");
  } else {
    validateRevision(viewer.atlasRevision, "candidate.delivery.sharedViewer.atlasRevision", errors);
    if (viewer.atlasRevision !== candidate.atlasRevision) errors.push("candidate.delivery.sharedViewer.atlasRevision does not match candidate.atlasRevision");
    if (typeof viewer.manifestSha256 !== "string" || !SHA256.test(viewer.manifestSha256)) errors.push("candidate.delivery.sharedViewer.manifestSha256 must be 64 hexadecimal characters");
    if (typeof viewer.inventorySha256 !== "string" || !SHA256.test(viewer.inventorySha256)) errors.push("candidate.delivery.sharedViewer.inventorySha256 must be 64 hexadecimal characters");
    if (!Number.isSafeInteger(viewer.modelCount) || viewer.modelCount < 1) errors.push("candidate.delivery.sharedViewer.modelCount must be a positive integer");
    if (!Number.isSafeInteger(viewer.pathCount) || viewer.pathCount < 1) errors.push("candidate.delivery.sharedViewer.pathCount must be a positive integer");
  }

  const validation = delivery.validation;
  if (!validation || typeof validation !== "object" || Array.isArray(validation)) {
    errors.push("candidate.delivery.validation must be an object");
  } else {
    validateRevision(validation.atlasRevision, "candidate.delivery.validation.atlasRevision", errors);
    if (validation.atlasRevision !== candidate.atlasRevision) errors.push("candidate.delivery.validation.atlasRevision does not match candidate.atlasRevision");
    if (validation.status !== "source-checked-only") errors.push('candidate.delivery.validation.status must be "source-checked-only"');
  }

  const clinical = delivery.clinicalApproval;
  if (!clinical || typeof clinical !== "object" || Array.isArray(clinical)) {
    errors.push("candidate.delivery.clinicalApproval must be an object");
    return false;
  }
  if (!Array.isArray(clinical.records)) {
    errors.push("candidate.delivery.clinicalApproval.records must be an array");
    return false;
  }
  if (clinical.status === "none-recorded") {
    if (clinical.records.length !== 0) errors.push("candidate.delivery.clinicalApproval none-recorded requires empty records");
    return false;
  }
  if (clinical.status !== "revision-bound-recorded") {
    errors.push('candidate.delivery.clinicalApproval.status must be "none-recorded" or "revision-bound-recorded"');
    return false;
  }
  if (clinical.records.length === 0) errors.push("candidate.delivery.clinicalApproval revision-bound-recorded requires at least one record");
  clinical.records.forEach((record, index) => {
    const label = `candidate.delivery.clinicalApproval.records[${index}]`;
    if (!record || typeof record !== "object" || Array.isArray(record)) {
      errors.push(`${label} must be an object`);
      return;
    }
    validateRevision(record.atlasRevision, `${label}.atlasRevision`, errors);
    validateRevision(record.websiteRevision, `${label}.websiteRevision`, errors);
    if (record.atlasRevision !== candidate.atlasRevision) errors.push(`${label}.atlasRevision does not match candidate.atlasRevision`);
    if (record.websiteRevision !== candidate.websiteRevision) errors.push(`${label}.websiteRevision does not match candidate.websiteRevision`);
    if (!nonPlaceholder(record.reviewer)) errors.push(`${label}.reviewer must be named`);
    if (!validTimestamp(record.timestamp)) errors.push(`${label}.timestamp must be an ISO UTC timestamp`);
    if (!nonPlaceholder(record.scope)) errors.push(`${label}.scope must be concrete`);
    validateEvidence(record.evidence, label, errors);
  });
  return clinical.records.length > 0;
}

export function evaluateReleaseReadiness(manifest) {
  const errors = [];
  if (!manifest || typeof manifest !== "object" || Array.isArray(manifest)) {
    return { valid: false, ready: false, errors: ["manifest must be a JSON object"], counts: { pass: 0, pending: 0 } };
  }

  if (manifest.schemaVersion !== 2) errors.push("schemaVersion must be 2");
  validateRevision(manifest.candidate?.atlasRevision, "candidate.atlasRevision", errors);
  validateRevision(manifest.candidate?.websiteRevision, "candidate.websiteRevision", errors);
  const clinicalRecorded = validateDelivery(manifest.candidate, errors);
  if (manifest.releaseAuthority?.status !== "external-verification-required") {
    errors.push('releaseAuthority.status must be "external-verification-required"');
  }

  const gates = Array.isArray(manifest.gates) ? manifest.gates : [];
  if (!Array.isArray(manifest.gates)) errors.push("gates must be an array");
  const ids = gates.map((gate) => gate?.id);
  for (const id of REQUIRED_GATE_IDS) {
    const count = ids.filter((candidate) => candidate === id).length;
    if (count === 0) errors.push(`missing required gate: ${id}`);
    else if (count > 1) errors.push(`duplicate gate: ${id}`);
  }
  for (const id of new Set(ids)) {
    if (!REQUIRED_GATE_IDS.includes(id)) errors.push(`unknown gate: ${String(id)}`);
  }

  for (const gate of gates) {
    const label = `gate ${String(gate?.id)}`;
    if (!STATES.has(gate?.status)) errors.push(`${label} has unknown status: ${String(gate?.status)}`);
    if (!OWNERS.has(gate?.owner)) errors.push(`${label} has unknown owner: ${String(gate?.owner)}`);
    if (!nonPlaceholder(gate?.criterion)) errors.push(`${label} requires a concrete criterion`);
    if (!nonPlaceholder(gate?.action)) errors.push(`${label} requires a concrete action`);

    if (gate?.status === "pass") {
      const record = gate.attestation;
      if (!record || typeof record !== "object" || Array.isArray(record)) {
        errors.push(`${label} pass requires a gate-record attestation`);
        continue;
      }
      if (record.kind !== "gate-record") errors.push(`${label} attestation.kind must be "gate-record"`);
      if (record.atlasRevision !== manifest.candidate?.atlasRevision) errors.push(`${label} attestation atlas revision does not match candidate`);
      if (record.websiteRevision !== manifest.candidate?.websiteRevision) errors.push(`${label} attestation website revision does not match candidate`);
      if (!nonPlaceholder(record.reviewer)) errors.push(`${label} pass requires a named reviewer`);
      if (!validTimestamp(record.timestamp)) errors.push(`${label} pass requires an ISO UTC timestamp`);
      validateEvidence(record.evidence, `${label} pass`, errors);
    }
  }

  const counts = {
    pass: gates.filter((gate) => gate?.status === "pass").length,
    pending: gates.filter((gate) => gate?.status === "pending").length,
  };
  const valid = errors.length === 0;
  return { valid, ready: valid && clinicalRecorded && counts.pass === REQUIRED_GATE_IDS.length, errors, counts };
}

export function parseArgs(argv) {
  let check = false;
  let manifestPath;
  for (const arg of argv) {
    if (arg === "--check") check = true;
    else if (arg.startsWith("-")) throw new Error(`Unknown option: ${arg}`);
    else if (manifestPath) throw new Error("Specify at most one manifest path");
    else manifestPath = arg;
  }
  return { check, manifestPath };
}

export async function runReleaseReadiness({
  argv = process.argv.slice(2),
  cwd = process.cwd(),
  stdout = process.stdout,
  stderr = process.stderr,
} = {}) {
  try {
    const options = parseArgs(argv);
    const path = resolve(cwd, options.manifestPath ?? "content/first-release-milestone.json");
    const manifest = JSON.parse(await readFile(path, "utf8"));
    const result = evaluateReleaseReadiness(manifest);
    if (!result.valid) {
      for (const error of result.errors) stderr.write(`ERROR ${error}\n`);
      return 2;
    }

    stdout.write(`First-release gates: ${result.counts.pass}/${REQUIRED_GATE_IDS.length} pass, ${result.counts.pending} pending.\n`);
    stdout.write(`Candidate: Atlas ${manifest.candidate.atlasRevision}; website ${manifest.candidate.websiteRevision}.\n`);
    stdout.write(`Delivery declarations: website version ${manifest.candidate.delivery.website.versionNumber} ${manifest.candidate.delivery.website.status} (${manifest.candidate.delivery.website.audience}); shared viewer ${manifest.candidate.delivery.sharedViewer.modelCount} models / ${manifest.candidate.delivery.sharedViewer.pathCount} paths; validation ${manifest.candidate.delivery.validation.status}; clinical approval ${manifest.candidate.delivery.clinicalApproval.status}.\n`);
    for (const gate of manifest.gates) {
      stdout.write(`${gate.status.toUpperCase()} ${gate.id} [${gate.owner}] — ${gate.status === "pass" ? "attestation recorded" : gate.action}\n`);
    }
    stdout.write("Gate passes are recorded attestations; this tool does not grant or verify publication or clinical release authority.\n");
    stdout.write("Delivery declarations and evidence references are syntax-checked only; deployment, inventory, reviewer identity, clinical content, resolution and authenticity remain externally verified.\n");
    if (!result.ready) {
      const pending = manifest.gates.filter((gate) => gate.status !== "pass").map((gate) => gate.id);
      if (manifest.candidate.delivery.clinicalApproval.status === "none-recorded") pending.push("clinical approval");
      stdout.write(`Pending: ${pending.join(", ")}.\n`);
    }
    else stdout.write("All mandatory gate attestations are recorded for this candidate; external release authorization is still required.\n");
    return options.check && !result.ready ? 1 : 0;
  } catch (error) {
    stderr.write(`ERROR ${error.message}\n`);
    return 2;
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.exitCode = await runReleaseReadiness();
}
