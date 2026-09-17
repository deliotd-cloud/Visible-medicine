"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { specimenTopicLabels } from "@/lib/specimen-links";
import bindings from '@/content/nested-review-bindings.json';
import type {
  NestedReviewMaterial,
  nestedReviewRows,
} from "@/lib/nested-review-material";
import {
  nestedReviewTracks,
  nestedDecisionLabel,
  nestedApprovalProblems,
  parseSavedNestedReview,
  type NestedReviewTrack,
  type NestedReviewDraft,
} from "@/lib/nested-review";
import {
  parseNestedHistory,
  nestedDraftFromSaved,
} from "@/lib/nested-review-client";

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
export function NestedReviewWorkspace({
  rows,
  packet,
  invalid,
}: {
  rows: typeof nestedReviewRows;
  packet: NestedReviewMaterial | null;
  invalid: boolean;
}) {
  const [query, setQuery] = useState(""),
    [key, setKey] = useState(packet?.context.nestedKey ?? rows[0].key);
  const [dirty, setDirty] = useState(false),
    [track, setTrack] = useState<NestedReviewTrack>("geometry");
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
    <div className="body-review-grid nested-review">
      <aside className="body-review-queue">
        <label htmlFor="review-nested">Parent and study</label>
        <Select
          value={key}
          onValueChange={(v) => {
            if (v && rows.some((r) => r.key === v)) setKey(v);
          }}
        >
          <SelectTrigger id="review-nested">
            <SelectValue>{group.name}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {rows.map((r) => (
              <SelectItem key={r.key} value={r.key}>
                {r.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <label htmlFor="nested-review-search">Find a structure</label>
        <Input
          id="nested-review-search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Name, side or exact ID"
        />
        <p>{filtered.length} selections</p>
        <ul>
          {filtered.map((s) => (
            <li key={s.id}>
              <a
                className="nested-review-choice"
                aria-current={packet?.context.structureId === s.id && packet.context.nestedKey === key ? "page" : undefined}
                href={`/review/nested?parent=${encodeURIComponent(group.parentId)}&study=${encodeURIComponent(group.study)}&structure=${encodeURIComponent(s.id)}&source=${bindings.groups.find(g=>g.key===key)?.selections.find(r=>r.id===s.id)?.sourceToken??''}`}
              >
                {s.name}
              </a>
            </li>
          ))}
        </ul>
        <small>
          Each parent, dissection study and child has a separate review scope. Whole-organ and independent-specimen approvals are never inherited.
        </small>
      </aside>
      <section className="body-review-paper">
        {!packet ? (
          <p role={invalid ? "alert" : undefined}>
            {invalid
              ? "This link is outside the available nested review scope. Choose a valid selection."
              : "Choose a nested selection to inspect its worksheet and private review history."}
          </p>
        ) : (
          <>
            <h2>{packet.context.structureName}</h2>
            <p>{packet.source.parent.name} · {packet.source.studyTitle}</p><p>{packet.source.limitations}</p>
            <p>
              {packet.atlasLink ? <a href={packet.atlasLink} >Return to this exact dissection</a> : 'The exact source link is unavailable.'}{' '}
              · Opens the exact parent, study and child. Opening it alone does not complete a review.
            </p>
            <code className="nested-review-id">
              {packet.context.structureId}
            </code>
            <details>
              <summary>Source identity &amp; worksheet</summary>
              <p>{packet.source.credit}</p>
              <p>Frame: {packet.context.sourceFrame}</p>
              <p>
                {packet.source.structure.name} ·{" "}
                {packet.source.structure.laterality}
              </p>
              <p>
                Review scope: this exact selection, surrounding source geometry
                and available draft copy. No patient registration, other
                nested, paid lecture or interactive exam approval.
              </p>
              <p>
                Material fingerprint: <code>{packet.context.materialHash}</code>
              </p>
              <Button
                variant="outline"
                onClick={() =>
                  download(
                    {
                      kind: "unsigned-nested-worksheet",
                      approval: false,
                      packet,
                    },
                    "nested-worksheet.json",
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
                  <p>{t.readiness === "pending" ? "Pending — no authored topic to approve." : t.body}</p>{t.note && <p>{t.note}</p>}{t.bullets.length > 0 && <ul>{t.bullets.map(b=><li key={b}>{b}</li>)}</ul>}
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
            <label htmlFor="nested-review-track">Review track</label>
            <Select
              value={track}
              onValueChange={(v) => {
                if (
                  v &&
                  nestedReviewTracks.includes(v as NestedReviewTrack) &&
                  (!dirty ||
                    window.confirm(
                      "Discard unsaved edits for this track? Save or export first if needed.",
                    ))
                ) {
                  setDirty(false);
                  setTrack(v as NestedReviewTrack);
                }
              }}
            >
              <SelectTrigger id="nested-review-track">
                <SelectValue>{titles[track]}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {nestedReviewTracks.filter(t => t !== "imaging").map((t) => (
                  <SelectItem key={t} value={t}>
                    {titles[t]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p>Acquired imaging review is unavailable. Teaching approval does not validate scan registration.</p>
            <NestedDecisionEditor
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
export function NestedDecisionEditor({
  packet,
  track,
  onDirty,
}: {
  packet: NestedReviewMaterial;
  track: NestedReviewTrack;
  onDirty: (v: boolean) => void;
}) {
  const c = packet.context;
  const [draft, setDraft] = useState(() =>
    nestedDraftFromSaved(undefined, c, track),
  );
  const [page, setPage] = useState<ReturnType<
    typeof parseNestedHistory
  > | null>(null);
  const [history, setHistory] = useState<ReturnType<
    typeof parseNestedHistory
  > | null>(null);
  const [busy, setBusy] = useState(false),
    [dirty, setDirty] = useState(false),
    [reconcile, setReconcile] = useState(false);
  const [needsRefresh, setNeedsRefresh] = useState(false);
  const [error, setError] = useState(""),
    [message, setMessage] = useState("");
  useEffect(() => {
    onDirty(dirty || busy);
  }, [dirty, busy, onDirty]);
  async function read(before?: number, signal?: AbortSignal) {
    const q = new URLSearchParams({
      nestedKey: c.nestedKey,
      structureId: c.structureId,
      track,
    });
    if (before) q.set("before", String(before));
    const res = await fetch(`/api/nested-review?${q}`, {
      cache: "no-store",
      signal,
    });
    const data = await res.json();
    if (!res.ok)
      throw Error(responseError(data, "Unable to load private history."));
    return parseNestedHistory(data, c, track, before);
  }
  useEffect(() => {
    const controller = new AbortController();
    read(undefined, controller.signal)
      .then((p) => {
        if (!controller.signal.aborted) {
          setPage(p);
          setHistory(p);
          setDraft(nestedDraftFromSaved(p.history[0], c, track));
        }
      })
      .catch((e) => {
        if (!controller.signal.aborted) setError(e.message);
      });
    return () => controller.abort();
  }, []);
  function edit(patch: Partial<NestedReviewDraft>) {
    if (busy) return;
    setDraft((d) => ({ ...d, attested: false, ...patch }));
    setDirty(true);
    setMessage("");
  }
  async function refresh() {
    setBusy(true);
    setError("");
    try {
      const p = await read();
      setPage(p);
      setHistory(p);
      setNeedsRefresh(false);
      if (dirty) {
        setReconcile(true);
        setMessage(
          "Your edits are retained. Compare saved history, then explicitly load the saved draft. Export your edits first if needed.",
        );
      } else {
        setDraft(nestedDraftFromSaved(p.history[0], c, track));
        setReconcile(false);
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function save() {
    if (!page || busy || reconcile) return;
    setBusy(true);
    setError("");
    setMessage("");
    let uncertain = true;
    try {
      const res = await fetch("/api/nested-review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          catalogScope: c.catalogScope,
          nestedKey: c.nestedKey,
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
      const r = parseSavedNestedReview(
        data && typeof data === "object" && "review" in data
          ? data.review
          : undefined,
      );
      if (
        r.nestedKey !== c.nestedKey ||
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
      setDraft(nestedDraftFromSaved(r, c, track));
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
  const problems = nestedApprovalProblems(draft, c, track);
  return (
    <div className="nested-decision">
      <p aria-live="polite">
        {page
          ? nestedDecisionLabel(page.history[0], c)
          : "Private history not loaded"}
      </p>
      {error && <p role="alert">{error}</p>}
      {message && <p role="status">{message}</p>}
      <div className="nested-review-actions">
        <Button variant="outline" disabled={busy} onClick={refresh}>
          Refresh saved history
        </Button>
        <Button
          variant="outline"
          onClick={() =>
            download(
              {
                kind: "unsaved-nested-review-draft",
                approval: false,
                context: c,
                track,
                draft,
              },
              "nested-review-draft.json",
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
                setDraft(nestedDraftFromSaved(page?.history[0], c, track));
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
          <label className="nested-check" key={item.id}>
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
          <label className="nested-field" key={k}>
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
          <div key={index} className="nested-evidence">
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
              <div className="nested-evidence" key={issue.id}>
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
                <label className="nested-check">
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
        <label className="nested-field">
          Decision
          <Select
            value={draft.status}
            onValueChange={(v) =>
              edit({ status: v as NestedReviewDraft["status"] })
            }
          >
            <SelectTrigger>
              <SelectValue>{{draft:'In progress','changes-required':'Changes required',approved:'Record approval'}[draft.status]}</SelectValue>
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
        <label className="nested-check">
          <input
            type="checkbox"
            checked={draft.attested}
            onChange={(e) => edit({ attested: e.target.checked })}
          />
          I personally reviewed this exact parent, study, child and revision within the
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
              onClick={() => download(r, `nested-review-v${r.version}.json`)}
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
              setBusy(true);
              try {
                setHistory(await read(history.nextBefore!));
              } catch (e) {
                setError((e as Error).message);
              } finally {
                setBusy(false);
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
