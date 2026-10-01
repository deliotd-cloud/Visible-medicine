"use client";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { ReviewSignInLink } from '@/components/review-sign-in-link';
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { specimenTopicLabels } from "@/lib/specimen-links";
import type {
  SpecimenReviewMaterial,
  specimenReviewRows,
} from "@/lib/specimen-review-material";
import {
  specimenReviewTracks,
  specimenDecisionLabel,
  specimenApprovalProblems,
  parseSavedSpecimenReview,
  type SpecimenReviewTrack,
  type SpecimenReviewDraft,
} from "@/lib/specimen-review";
import {
  parseSpecimenHistory,
  specimenDraftFromSaved,
} from "@/lib/specimen-review-client";

function download(value: unknown, filename: string) {
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(value, null, 2)], { type: "application/json" }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
const titles = {
  geometry: "3D anatomy",
  teaching: "Teaching & self-check",
  imaging: "Acquired imaging",
};
const responseError = (data: unknown, fallback: string) =>
  data &&
  typeof data === "object" &&
  "error" in data &&
  typeof data.error === "string"
    ? data.error
    : fallback;
export function SpecimenReviewWorkspace({
  rows,
  packet,
  invalid,
}: {
  rows: typeof specimenReviewRows;
  packet: SpecimenReviewMaterial | null;
  invalid: boolean;
}) {
  const [query, setQuery] = useState(""),
    [key, setKey] = useState(packet?.context.specimenKey ?? rows[0].key);
  const [dirty, setDirty] = useState(false),
    [track, setTrack] = useState<SpecimenReviewTrack>("geometry");
  useEffect(() => {
    if (!dirty) return;
    const unload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    const click = (e: MouseEvent) => {
      const anchor = (e.target as Element).closest?.("a");
      if (
        anchor &&
        anchor.target !== "_blank" &&
        !anchor.hasAttribute("download") &&
        !window.confirm(
          "Leave and discard unsaved review edits? Save or export first if needed.",
        )
      ) {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    window.addEventListener("beforeunload", unload);
    document.addEventListener("click", click, true);
    return () => {
      window.removeEventListener("beforeunload", unload);
      document.removeEventListener("click", click, true);
    };
  }, [dirty]);
  const group = rows.find((r) => r.key === key)!;
  const filtered = group.surfaces.filter((s) =>
    `${s.name} ${s.id} ${s.laterality}`
      .toLowerCase()
      .includes(query.trim().toLowerCase()),
  );
  return (
    <div className="body-review-grid specimen-review">
      <aside className="body-review-queue">
        <label htmlFor="review-specimen">Specimen</label>
        <Select
          value={key}
          onValueChange={(v) => {
            if (v && rows.some((r) => r.key === v)) setKey(v);
          }}
        >
          <SelectTrigger id="review-specimen">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {rows.map((r) => (
              <SelectItem key={r.key} value={r.key}>
                {r.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <label htmlFor="specimen-review-search">Find a structure</label>
        <Input
          id="specimen-review-search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Name, side or exact ID"
        />
        <p>{filtered.length} selections</p>
        <ul>
          {filtered.map((s) => (
            <li key={s.id}>
              <a
                className="specimen-review-choice"
                aria-current={
                  packet?.context.structureId === s.id ? "page" : undefined
                }
                href={`/review/specimens?specimen=${encodeURIComponent(key)}&structure=${encodeURIComponent(s.id)}`}
              >
                {s.name}
              </a>
            </li>
          ))}
        </ul>
        <small>
          HRA kidneys and female pelvis, abdominal wall, back layers and five
          lower-limb study regions. Overlapping source surfaces have separate
          regional review scopes; approvals are never inherited.
        </small>
      </aside>
      <section className="body-review-paper">
        {!packet ? (
          <p role={invalid ? "alert" : undefined}>
            {invalid
              ? "This link is outside the available specimen review scope. Choose a valid selection."
              : "Choose a source selection to inspect its worksheet and private review history."}
          </p>
        ) : (
          <>
            <h2>{packet.context.structureName}</h2>
            <p>{packet.source.limitations}</p>
            <p>
              {packet.atlasLink ? <a href={packet.atlasLink} target="_blank" rel="noreferrer">Open this exact structure in 3D</a> : 'The exact source link is unavailable.'}{' '}
              · Opens the selected source and study. Opening the viewer alone does not complete a review.
            </p>
            <code className="specimen-review-id">
              {packet.context.structureId}
            </code>
            <details>
              <summary>Source identity &amp; worksheet</summary>
              <p>{packet.source.catalogue.source.credit}</p>
              <p>Frame: {packet.context.sourceFrame}</p>
              <p>
                {packet.source.structure.sourceName} ·{" "}
                {packet.source.structure.laterality}
              </p>
              <p>
                Review scope: this exact selection, surrounding source geometry
                and available draft copy. No patient registration, other
                specimen, paid lecture or interactive exam approval.
              </p>
              <p>
                Material fingerprint: <code>{packet.context.materialHash}</code>
              </p>
              <Button
                variant="outline"
                onClick={() =>
                  download(
                    {
                      kind: "unsigned-specimen-worksheet",
                      approval: false,
                      packet,
                    },
                    "specimen-worksheet.json",
                  )
                }
              >
                Export unsigned worksheet
              </Button>
            </details>
            <details>
              <summary>
                Teaching to review · {packet.context.teachingTabs.length}{" "}
                available items
              </summary>
              {packet.teaching.topics.map((t) => (
                <section key={t.tab}>
                  <h3>{specimenTopicLabels[t.tab]}</h3>
                  <p>{t.body ?? "Pending — no authored topic to approve."}</p>
                  {t.tab === 'anatomy' && packet.teaching.lesson?.attachments && <dl><dt>Proximal attachment / origin</dt><dd>{packet.teaching.lesson.attachments.proximal}</dd><dt>Distal attachment / insertion</dt><dd>{packet.teaching.lesson.attachments.distal}</dd></dl>}
                  {t.tab === 'function' && packet.teaching.lesson?.attachments && <dl><dt>Motor supply</dt><dd>{packet.teaching.lesson.attachments.motor}</dd></dl>}
                  {t.tab === 'function' && packet.teaching.motorSupplies?.map((m,i) => <div key={i}><p>{m.label}{m.part ? ` · ${m.part}` : ''}</p><p>{m.caveat} {m.note}</p></div>)}
                  {t.references.map((url) => (
                    <p key={url}>
                      <a href={url} target="_blank" rel="noreferrer">
                        {packet.teaching.referenceTitles[url] ??
                          "Source reference"}
                      </a>
                    </p>
                  ))}
                </section>
              ))}
              {packet.teaching.guidedDissection && <section aria-label="Guided dissection to review">
                <h3>{packet.teaching.guidedDissection.title} · Draft</h3>
                <p>{packet.teaching.guidedDissection.limitation}</p>
                <p>Source frame: {packet.teaching.guidedDissection.sourceFrame}. This sequence is part of this teaching fingerprint; earlier approval does not cover it.</p>
                <ol>{packet.teaching.guidedDissection.steps.map(step => <li key={step.id}>
                  <h4>{step.title} · {step.view} view</h4><p>{step.caption}</p>
                  <p>Selected: <code>{step.selectedId}</code></p>
                  <details><summary>Exact visible source surfaces ({step.ids.length})</summary>
                    <ul>{step.ids.map(id => <li key={id}><code>{id}</code></li>)}</ul>
                  </details>
                </li>)}</ol>
              </section>}
              {packet.teaching.lesson?.extended && (
                <>
                  <h3>Model-specific caution</h3>
                  <p>{packet.teaching.lesson.extended.modelLimit}</p>
                  <h3>Self-check</h3>
                  <p>{packet.teaching.lesson.extended.selfCheck.question}</p>
                  <p>{packet.teaching.lesson.extended.selfCheck.answer}</p>
                  {packet.teaching.lesson.extended.selfCheck.references.map(
                    (url) => (
                      <p key={url}>
                        <a href={url} target="_blank" rel="noreferrer">
                          {packet.teaching.referenceTitles[url] ??
                            "Source reference"}
                        </a>
                      </p>
                    ),
                  )}
                </>
              )}
            </details>
            <label htmlFor="specimen-review-track">Review track</label>
            <Select
              value={track}
              onValueChange={(v) => {
                if (
                  v &&
                  specimenReviewTracks.includes(v as SpecimenReviewTrack) &&
                  (!dirty ||
                    window.confirm(
                      "Discard unsaved edits for this track? Save or export first if needed.",
                    ))
                ) {
                  setDirty(false);
                  setTrack(v as SpecimenReviewTrack);
                }
              }}
            >
              <SelectTrigger id="specimen-review-track">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {specimenReviewTracks.map((t) => (
                  <SelectItem key={t} value={t}>
                    {titles[t]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <SpecimenDecisionEditor
              key={track}
              packet={packet}
              track={track}
              onDirty={setDirty}
            />
          </>
        )}
      </section>
    </div>
  );
}
export function SpecimenDecisionEditor({
  packet,
  track,
  onDirty,
}: {
  packet: SpecimenReviewMaterial;
  track: SpecimenReviewTrack;
  onDirty: (v: boolean) => void;
}) {
  const c = packet.context;
  const [draft, setDraft] = useState(() =>
    specimenDraftFromSaved(undefined, c, track),
  );
  const [page, setPage] = useState<ReturnType<
    typeof parseSpecimenHistory
  > | null>(null);
  const [history, setHistory] = useState<ReturnType<
    typeof parseSpecimenHistory
  > | null>(null);
  const [busy, setBusy] = useState(false),
    [dirty, setDirty] = useState(false),
    [reconcile, setReconcile] = useState(false);
  const [needsRefresh, setNeedsRefresh] = useState(false);
  const [error, setError] = useState(""),
    [message, setMessage] = useState("");
  const pendingRead = useRef<AbortController | null>(null);
  function beginRead() {
    pendingRead.current?.abort();
    const controller = new AbortController();
    pendingRead.current = controller;
    return controller;
  }
  useEffect(() => {
    onDirty(dirty || busy);
  }, [dirty, busy, onDirty]);
  async function read(before?: number, signal?: AbortSignal) {
    const q = new URLSearchParams({
      specimenKey: c.specimenKey,
      structureId: c.structureId,
      track,
    });
    if (before) q.set("before", String(before));
    const res = await fetch(`/api/specimen-review?${q}`, {
      cache: "no-store",
      signal,
    });
    const data = await res.json();
    if (!res.ok)
      throw Error(responseError(data, "Unable to load private history."));
    return parseSpecimenHistory(data, c, track, before);
  }
  useEffect(() => {
    const controller = beginRead();
    read(undefined, controller.signal)
      .then((p) => {
        if (!controller.signal.aborted) {
          setPage(p);
          setHistory(p);
          setDraft(specimenDraftFromSaved(p.history[0], c, track));
        }
      })
      .catch((e) => {
        if (!controller.signal.aborted) setError(e.message);
      });
    return () => pendingRead.current?.abort();
  }, []);
  function edit(patch: Partial<SpecimenReviewDraft>) {
    if (busy) return;
    setDraft((d) => ({ ...d, attested: false, ...patch }));
    setDirty(true);
    setMessage("");
  }
  async function refresh() {
    if (busy) return;
    const controller = beginRead();
    setBusy(true);
    setError("");
    try {
      const p = await read(undefined, controller.signal);
      if (controller.signal.aborted) return;
      setPage(p);
      setHistory(p);
      setNeedsRefresh(false);
      if (dirty) {
        setReconcile(true);
        setMessage(
          "Your edits are retained. Compare saved history, then explicitly load the saved draft. Export your edits first if needed.",
        );
      } else {
        setDraft(specimenDraftFromSaved(p.history[0], c, track));
        setReconcile(false);
      }
    } catch (e) {
      if (!controller.signal.aborted) setError((e as Error).message);
    } finally {
      if (!controller.signal.aborted) setBusy(false);
    }
  }
  async function save() {
    if (!page || busy || reconcile) return;
    setBusy(true);
    setError("");
    setMessage("");
    let uncertain = true;
    try {
      const res = await fetch("/api/specimen-review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          catalogScope: c.catalogScope,
          specimenKey: c.specimenKey,
          sourceFrame: c.sourceFrame,
          structureId: c.structureId,
          track,
          expectedVersion: page.history[0]?.version ?? 0,
          materialHash: c.materialHash,
          revisionHash: c.revisions[track],
          checklistVersion: c.checklistVersion,
          draft,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        uncertain = ![400, 401, 403, 413, 415, 422].includes(res.status);
        throw Error(responseError(data, "Save not confirmed."));
      }
      const r = parseSavedSpecimenReview(
        data && typeof data === "object" && "review" in data
          ? data.review
          : undefined,
      );
      if (
        r.specimenKey !== c.specimenKey ||
        r.structureId !== c.structureId ||
        r.sourceFrame !== c.sourceFrame ||
        r.track !== track ||
        r.version !== (page.history[0]?.version ?? 0) + 1 ||
        r.material.materialHash !== c.materialHash ||
        r.revisionHash !== c.revisions[track]
      )
        throw Error("Unexpected save response. Refresh before retrying.");
      const p = {
        history: [r, ...page.history].slice(0, 20),
        nextBefore: null as number | null,
      };
      p.nextBefore = p.history.length === 20 ? p.history.at(-1)!.version : null;
      setPage(p);
      setHistory(p);
      setDraft(specimenDraftFromSaved(r, c, track));
      setDirty(false);
      setMessage(
        "Review saved privately for this exact revision. Previous records remain in history.",
      );
    } catch (e) {
      setError((e as Error).message);
      if (uncertain) {
        setReconcile(true);
        setNeedsRefresh(true);
      }
    } finally {
      setBusy(false);
    }
  }
  const problems = specimenApprovalProblems(draft, c, track);
  return (
    <div className="specimen-decision">
      <p aria-live="polite">
        {page
          ? specimenDecisionLabel(page.history[0], c)
          : "Private history not loaded"}
      </p>
      {error && <p role="alert">{error}</p>}
      {!page && error && <p><ReviewSignInLink target={{ scope: 'specimens',
        specimen: c.specimenKey, structure: c.structureId }} /></p>}
      {message && <p role="status">{message}</p>}
      <div className="specimen-review-actions">
        <Button variant="outline" disabled={busy} onClick={refresh}>
          Refresh saved history
        </Button>
        <Button
          variant="outline"
          onClick={() =>
            download(
              {
                kind: "unsaved-specimen-review-draft",
                approval: false,
                context: c,
                track,
                draft,
              },
              "specimen-review-draft.json",
            )
          }
        >
          Export my edits
        </Button>
      </div>
      {reconcile && (
        <p>
          <Button
            variant="outline"
            disabled={busy || !page || needsRefresh}
            onClick={() => {
              if (
                window.confirm(
                  "Replace your unsaved edits with the latest loaded saved draft? Export first if needed.",
                )
              ) {
                setDraft(specimenDraftFromSaved(page?.history[0], c, track));
                setDirty(false);
                setReconcile(false);
                setMessage(
                  "Saved draft loaded. Review it before saving again.",
                );
              }
            }}
          >
            Load saved draft after comparing
          </Button>
        </p>
      )}
      <fieldset disabled={busy || !page}>
        <legend>{titles[track]} checklist</legend>
        {c.checklists[track].map((item) => (
          <label className="specimen-check" key={item.id}>
            <input
              type="checkbox"
              checked={draft.checks[item.id]}
              onChange={(e) =>
                edit({
                  checks: { ...draft.checks, [item.id]: e.target.checked },
                })
              }
            />
            {item.label}
          </label>
        ))}
        {(["reviewer", "qualification", "scope", "notes"] as const).map((k) => (
          <label className="specimen-field" key={k}>
            {
              {
                reviewer: "Your name",
                qualification: "Professional role / qualification",
                scope: "Exact scope reviewed",
                notes: "Notes (do not enter patient information)",
              }[k]
            }
            <textarea
              value={draft[k]}
              maxLength={
                { reviewer: 150, qualification: 200, scope: 2000, notes: 6000 }[
                  k
                ]
              }
              rows={k === "notes" ? 3 : 2}
              onChange={(e) => edit({ [k]: e.target.value })}
            />
          </label>
        ))}
        <h3>Supporting evidence</h3>
        {draft.evidence.map((e, index) => (
          <div key={index} className="specimen-evidence">
            {(["title", "url", "note"] as const).map((k) => (
              <label key={k}>
                {k === "url"
                  ? "HTTPS reference URL"
                  : k === "title"
                    ? "Reference title"
                    : "What this supports"}
                <Input
                  value={e[k]}
                  maxLength={{ title: 180, url: 2048, note: 1000 }[k]}
                  onChange={(event) =>
                    edit({
                      evidence: draft.evidence.map((v, n) =>
                        n === index ? { ...v, [k]: event.target.value } : v,
                      ),
                    })
                  }
                />
              </label>
            ))}
            <Button
              variant="outline"
              onClick={() =>
                edit({ evidence: draft.evidence.filter((_, n) => n !== index) })
              }
            >
              Remove reference
            </Button>
          </div>
        ))}
        <Button
          variant="outline"
          disabled={draft.evidence.length >= 12}
          onClick={() =>
            edit({
              evidence: [...draft.evidence, { title: "", url: "", note: "" }],
            })
          }
        >
          Add evidence
        </Button>
        <details>
          <summary>Corrections &amp; issues ({draft.issues.length})</summary>
          {draft.issues.map((issue, index) => {
            const update = (patch: Partial<typeof issue>) =>
              edit({
                issues: draft.issues.map((v, n) =>
                  n === index ? { ...v, ...patch } : v,
                ),
              });
            return (
              <div className="specimen-evidence" key={issue.id}>
                <label>
                  Correction
                  <Input
                    value={issue.title}
                    maxLength={500}
                    onChange={(e) => update({ title: e.target.value })}
                  />
                </label>
                <label>
                  Severity
                  <Select
                    value={issue.severity}
                    onValueChange={(v) =>
                      update({ severity: v as typeof issue.severity })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {["blocker", "major", "minor"].map((v) => (
                        <SelectItem key={v} value={v}>
                          {v}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </label>
                <label className="specimen-check">
                  <input
                    type="checkbox"
                    checked={issue.resolved}
                    onChange={(e) => update({ resolved: e.target.checked })}
                  />
                  Resolved
                </label>
                <label>
                  Resolution explanation
                  <Input
                    value={issue.resolution}
                    maxLength={1500}
                    onChange={(e) => update({ resolution: e.target.value })}
                  />
                </label>
              </div>
            );
          })}
          <Button
            variant="outline"
            disabled={draft.issues.length >= 20}
            onClick={() =>
              edit({
                issues: [
                  ...draft.issues,
                  {
                    id: crypto.randomUUID(),
                    title: "",
                    severity: "major",
                    resolved: false,
                    resolution: "",
                  },
                ],
              })
            }
          >
            Add correction
          </Button>
          <p>
            Saved issues are retained, not deleted; resolve them with an
            explanation.
          </p>
        </details>
        <label className="specimen-field">
          Decision
          <Select
            value={draft.status}
            onValueChange={(v) =>
              edit({ status: v as SpecimenReviewDraft["status"] })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">In progress</SelectItem>
              <SelectItem value="changes-required">Changes required</SelectItem>
              <SelectItem
                value="approved"
                disabled={!!c.blockers[track].length || !c.revisions[track]}
              >
                Record approval
              </SelectItem>
            </SelectContent>
          </Select>
        </label>
        <label className="specimen-check">
          <input
            type="checkbox"
            checked={draft.attested}
            onChange={(e) => edit({ attested: e.target.checked })}
          />
          I personally reviewed this exact specimen and revision within the
          scope stated above.
        </label>
        {!!problems.length && (
          <details
            open={draft.status === "approved" || !!c.blockers[track].length}
          >
            <summary>Before approval ({problems.length})</summary>
            <ul>
              {problems.map((p, i) => (
                <li key={i}>{p}</li>
              ))}
            </ul>
          </details>
        )}
        <Button
          onClick={save}
          disabled={
            !dirty ||
            reconcile ||
            (draft.status === "approved" && !!problems.length)
          }
        >
          Save private review
        </Button>
      </fieldset>
      <details>
        <summary>Saved version history</summary>
        {history?.history.map((r) => (
          <details key={r.version}>
            <summary>
              Version {r.version} · {r.status} · {r.savedAt}
            </summary>
            <p>
              {r.reviewer} · {r.qualification}
            </p>
            <p>{r.scope}</p>
            <p>{r.notes}</p>
            <Button
              variant="outline"
              onClick={() => download(r, `specimen-review-v${r.version}.json`)}
            >
              Export this saved record
            </Button>
            <pre>
              {JSON.stringify(
                {
                  checks: r.checks,
                  evidence: r.evidence,
                  issues: r.issues,
                  revision: r.revisionHash,
                },
                null,
                2,
              )}
            </pre>
          </details>
        ))}
        {!!history?.nextBefore && (
          <Button
            variant="outline"
            disabled={busy}
            onClick={async () => {
              if (busy) return;
              const controller = beginRead();
              setBusy(true);
              try {
                const previous = await read(history.nextBefore!, controller.signal);
                if (!controller.signal.aborted) setHistory(previous);
              } catch (e) {
                if (!controller.signal.aborted) setError((e as Error).message);
              } finally {
                if (!controller.signal.aborted) setBusy(false);
              }
            }}
          >
            Older records
          </Button>
        )}
      </details>
      <p>
        <small>
          Records belong to the signed-in account. Entered qualifications are
          self-declared, not credential verification. This does not release or
          certify the entire atlas.
        </small>
      </p>
    </div>
  );
}
