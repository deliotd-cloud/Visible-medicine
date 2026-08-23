"use client";

import { useState } from "react";

export function CourseProgressControl({ courseSlug }: { courseSlug: string }) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function save(progress: number) {
    setBusy(true); setMessage("");
    try {
      const response = await fetch("/api/progress", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ resourceType: "course", resourceSlug: courseSlug, progress, lastPosition: progress === 100 ? 999 : 1 }) });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error ?? "Progress could not be saved.");
      setMessage(progress === 100 ? "Course completion recorded. Your education-only record is available in My Learning." : "Course saved to My Learning.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Progress could not be saved."); }
    finally { setBusy(false); }
  }

  return <div className="course-progress-control"><button disabled={busy} onClick={() => void save(5)}>Save course</button><button disabled={busy} onClick={() => { if (window.confirm("Confirm that you have completed the course content? This creates an education-only completion record, not a clinical qualification.")) void save(100); }}>Record completion</button>{message && <p role="status">{message}</p>}</div>;
}
