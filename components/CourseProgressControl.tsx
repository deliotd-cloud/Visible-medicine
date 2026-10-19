"use client";

import { useEffect, useRef, useState } from "react";

type Visit = { slug: string; pending: object | null; recorded: boolean; completionAttempted: boolean };
type Notice = { visit: Visit; kind: "status" | "alert"; text: string };
const uncertainSave = "Progress response could not confirm this course save. Check My Learning before trying again.";

function confirmedProgress(value: unknown, slug: string, progress: number, lastPosition: number): value is {
  progress: { resourceType: "course"; resourceSlug: string; progress: number; lastPosition: number; updatedAt: string };
  completionId: string | null;
} {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const result = value as Record<string, unknown>;
  const saved = result.progress;
  if (!saved || typeof saved !== "object" || Array.isArray(saved) || Object.hasOwn(result, "error")) return false;
  const record = saved as Record<string, unknown>;
  if (Object.hasOwn(record, "error")) return false;
  const timestamp = record.updatedAt;
  const completionId = result.completionId;
  const validCompletion = progress === 100
    ? completionId === null || (typeof completionId === "string" && completionId.length > 0 && completionId.length <= 200
      && completionId.trim() === completionId && !/[\u0000-\u001f\u007f]/.test(completionId))
    : completionId === null;
  return record.resourceType === "course" && record.resourceSlug === slug
    && typeof record.progress === "number" && Number.isInteger(record.progress) && record.progress >= progress && record.progress <= 100
    && typeof record.lastPosition === "number" && Number.isSafeInteger(record.lastPosition) && record.lastPosition >= lastPosition && typeof timestamp === "string"
    && Number.isFinite(Date.parse(timestamp)) && new Date(timestamp).toISOString() === timestamp
    && validCompletion;
}

export function CourseProgressControl({ courseSlug }: { courseSlug: string }) {
  const [, refresh] = useState(0);
  const [notice, setNotice] = useState<Notice | null>(null);
  const visit = useRef<Visit>({ slug: courseSlug, pending: null, recorded: false, completionAttempted: false });
  const lifecycle = useRef({ epoch: 0, mounted: true, setup: false });

  // A changed slug starts a new visit even when React reuses this component instance.
  if (visit.current.slug !== courseSlug) {
    visit.current = { slug: courseSlug, pending: null, recorded: false, completionAttempted: false };
  }
  const currentVisit = visit.current;
  const epoch = lifecycle.current.epoch;

  useEffect(() => {
    if (lifecycle.current.setup) {
      lifecycle.current.epoch++;
      refresh(value => value + 1);
    }
    lifecycle.current.setup = true;
    lifecycle.current.mounted = true;
    return () => { lifecycle.current.mounted = false; lifecycle.current.epoch++; };
  }, []);

  function canStart() {
    return visit.current === currentVisit && lifecycle.current.epoch === epoch && lifecycle.current.mounted
      && currentVisit.pending === null && !currentVisit.recorded;
  }

  async function save(progress: number) {
    if (!canStart() || (progress < 100 && currentVisit.completionAttempted)) return;
    const request = {};
    currentVisit.pending = request;
    // The server may commit100 even if its acknowledgement is lost or malformed.
    // Keep lower saves blocked for this visit; an explicit100 retry stays possible.
    if (progress === 100) currentVisit.completionAttempted = true;
    setNotice(null);
    refresh(value => value + 1);
    const lastPosition = progress === 100 ? 999 : 1;
    const ownsResponse = () => visit.current === currentVisit && lifecycle.current.epoch === epoch
      && lifecycle.current.mounted && currentVisit.pending === request;
    try {
      const response = await fetch("/api/progress", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resourceType: "course", resourceSlug: courseSlug, progress, lastPosition }),
      });
      let result: unknown;
      try { result = await response.json(); }
      catch { throw new Error(uncertainSave); }
      if (!ownsResponse()) return;
      if (!response.ok) {
        const error = result && typeof result === "object" ? (result as { error?: unknown }).error : null;
        throw new Error(typeof error === "string" && error ? error : "Progress could not be saved.");
      }
      if (!confirmedProgress(result, courseSlug, progress, lastPosition)) {
        throw new Error(uncertainSave);
      }
      if (progress === 100) currentVisit.recorded = true;
      else if (result.progress.progress === 100) currentVisit.completionAttempted = true;
      const text = progress === 100
        ? result.completionId === null
          ? "Progress saved; completion record could not be confirmed. Check My Learning before trying again."
          : "Course completion recorded. Your education-only record is available in My Learning."
        : result.progress.progress > progress
          ? `Course saved to My Learning. Your existing ${result.progress.progress}% progress was preserved. See My Learning for completion records.`
          : "Course saved to My Learning.";
      setNotice({ visit: currentVisit, kind: "status", text });
    } catch (error) {
      if (ownsResponse()) setNotice({ visit: currentVisit, kind: "alert", text: error instanceof Error ? error.message : "Progress could not be saved." });
    } finally {
      if (currentVisit.pending === request) {
        currentVisit.pending = null;
        if (visit.current === currentVisit && lifecycle.current.mounted) refresh(value => value + 1);
      }
    }
  }

  const disabled = currentVisit.pending !== null || currentVisit.recorded || !lifecycle.current.mounted;
  const visibleNotice = notice?.visit === currentVisit ? notice : null;
  return <div className="course-progress-control">
    <button disabled={disabled || currentVisit.completionAttempted} onClick={() => void save(5)}>Save course</button>
    <button disabled={disabled} onClick={() => {
      if (canStart() && window.confirm("Confirm that you have completed the course content? This creates an education-only completion record, not a clinical qualification.")) void save(100);
    }}>Record completion</button>
    {visibleNotice && <p role={visibleNotice.kind}>{visibleNotice.text}</p>}
  </div>;
}
