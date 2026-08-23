import { env } from "cloudflare:workers";
import { getAuthContext } from "@/lib/auth";
import { appendAudit } from "@/db/bootstrap";
import { classifyTeachingContent, safeText, type ContentSignal } from "@/lib/domain";
import { authorizeRoles, DomainError, getAppSnapshot } from "@/lib/repository";

export const runtime = "edge";
const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;
const RADIOLOGY_EXTENSIONS = new Set(["dcm", "dicom"]);
const PATHOLOGY_EXTENSIONS = new Set(["svs", "ndpi", "tif", "tiff"]);

function jsonError(message: string, status: number) { return Response.json({ error: message }, { status, headers: { "Cache-Control": "no-store" } }); }
function extension(name: string) { return name.toLowerCase().split(".").pop() ?? ""; }
function safeFilename(name: string) { return name.normalize("NFKC").replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 140) || "teaching-media.bin"; }
function hasDicomMagic(bytes: Uint8Array) { return bytes.length >= 132 && new TextDecoder().decode(bytes.slice(128, 132)) === "DICM"; }
function hasTiffMagic(bytes: Uint8Array) { return bytes.length >= 4 && ((bytes[0] === 0x49 && bytes[1] === 0x49 && bytes[2] === 0x2a && bytes[3] === 0) || (bytes[0] === 0x4d && bytes[1] === 0x4d && bytes[2] === 0 && bytes[3] === 0x2a)); }
function containsIdentifierMarker(bytes: Uint8Array) { const text = new TextDecoder("utf-8", { fatal: false }).decode(bytes).toLowerCase(); return /patient[ _-]?(name|id)|medical[ _-]?record|date[ _-]?of[ _-]?birth/.test(text); }

export async function POST(request: Request) {
  try {
    const statedLength = Number(request.headers.get("content-length") ?? 0);
    if (statedLength > MAX_UPLOAD_BYTES + 1_000_000) return jsonError("Teaching-media upload exceeds the 25 MB private MVP limit.", 413);
    const auth = await getAuthContext(); if (!auth) throw new DomainError("Sign in through the authorized education site to continue.", 401); await authorizeRoles(auth, "instructor", "administrator");
    const form = await request.formData(); const title = safeText(form.get("title"), 160).trim();
    const deidentified = form.get("deidentified") === "true"; const publicationCleared = form.get("publicationCleared") === "true";
    const files = form.getAll("media").filter((value): value is File => value instanceof File && value.size > 0).slice(0, 12);
    if (!title) throw new DomainError("A teaching case title is required.");
    if (!files.length) throw new DomainError("Choose at least one staff teaching-media file.");
    const totalBytes = files.reduce((sum, file) => sum + file.size, 0);
    if (totalBytes > MAX_UPLOAD_BYTES) throw new DomainError("Teaching-media upload exceeds the 25 MB private MVP limit.", 413);

    const jobId = crypto.randomUUID(); const fileRecords: Array<{ file: File; bytes: ArrayBuffer; kind: ContentSignal["kind"]; format: string; identifierMarker: boolean }> = [];
    for (const file of files) {
      const bytes = await file.arrayBuffer(); const header = new Uint8Array(bytes.slice(0, Math.min(bytes.byteLength, 65_536))); const ext = extension(file.name);
      const radiology = RADIOLOGY_EXTENSIONS.has(ext) || file.type === "application/dicom" || hasDicomMagic(header);
      const pathology = PATHOLOGY_EXTENSIONS.has(ext) || hasTiffMagic(header);
      const kind: ContentSignal["kind"] = radiology && !pathology ? "radiology" : pathology && !radiology ? "pathology" : "unknown";
      fileRecords.push({ file, bytes, kind, format: ext || file.type || "unknown", identifierMarker: containsIdentifierMarker(header) });
    }
    const effectiveDeidentified = deidentified && !fileRecords.some((item) => item.identifierMarker);
    const signals: ContentSignal[] = fileRecords.map((item) => ({ kind: item.kind, format: item.format, supported: item.kind !== "unknown", integrityValid: item.file.size > 0, deidentified: effectiveDeidentified, publicationCleared }));
    const decision = classifyTeachingContent(signals); const reasonCodes = [...decision.reasonCodes];
    if (fileRecords.some((item) => item.identifierMarker)) reasonCodes.push("POTENTIAL_IDENTIFIER_MARKER");
    const fileDigests: string[] = [];
    for (const item of fileRecords) {
      const digest = await crypto.subtle.digest("SHA-256", item.bytes); const digestText = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join(""); fileDigests.push(digestText);
      await env.FILES.put(`quarantine/${jobId}/${safeFilename(item.file.name)}`, item.bytes, { httpMetadata: { contentType: item.file.type || "application/octet-stream" }, customMetadata: { purpose: "education-only", jobId, detectedKind: item.kind, uploadedBy: auth.userId } });
    }
    const setDigest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(fileDigests.join("|"))); const contentHash = Array.from(new Uint8Array(setDigest), (byte) => byte.toString(16).padStart(2, "0")).join("");
    const status = decision.publishable ? "ready-for-review" : decision.classification;
    const now = new Date().toISOString();
    await env.DB.prepare(`INSERT INTO ingestion_jobs (id, title, declared_type, detected_type, status, deidentified, publication_cleared, reason_codes_json, content_hash, created_by, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).bind(jobId, title, "server-inspected-upload", decision.classification, status, effectiveDeidentified ? 1 : 0, publicationCleared ? 1 : 0, JSON.stringify(reasonCodes), contentHash, auth.userId, now).run();
    await appendAudit(auth.userId, "ingestion.media-quarantined", "ingestion", jobId, "success", `${decision.classification};files=${files.length};bytes=${totalBytes}`);
    return Response.json(await getAppSnapshot(auth), { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof DomainError) return jsonError(error.message, error.status);
    return jsonError(error instanceof Error ? error.message : "Teaching-media intake failed.", 500);
  }
}
