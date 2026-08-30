"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import type { LearnerProfile } from "@/lib/education-platform";

const interests = ["CT", "MRI", "Plain radiography", "Ultrasound", "Radiological anatomy", "Neuroimaging", "Chest imaging", "Abdominal imaging", "Musculoskeletal imaging", "Pathology"];

export function LearnerOnboardingForm({ profile, returnTo = "/my-learning" }: { profile: LearnerProfile; returnTo?: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError("");
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/learner/account", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "save-profile",
          trainingStage: form.get("trainingStage"), discipline: form.get("discipline"),
          institutionName: form.get("institutionName"), countryCode: form.get("countryCode"), timezone: form.get("timezone"),
          interests: form.getAll("interests"), acceptTerms: form.get("acceptTerms") === "on", marketingOptIn: form.get("marketingOptIn") === "on",
        }),
      });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error ?? "Your learner profile could not be saved.");
      router.push(returnTo.startsWith("/") && !returnTo.startsWith("//") ? returnTo : "/my-learning");
      router.refresh();
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Your learner profile could not be saved."); }
    finally { setBusy(false); }
  }

  return <form className="onboarding-form" onSubmit={submit}>
    <div className="onboarding-section"><p className="section-index">01 · Your learning context</p><div className="two-fields">
      <label><span>Training stage</span><select name="trainingStage" defaultValue={profile.trainingStage} required><option value="">Choose stage</option><option>Medical student</option><option>Foundation doctor</option><option>Radiology trainee</option><option>Pathology trainee</option><option>Qualified clinician</option><option>Radiographer or technologist</option><option>Researcher</option><option>Educator</option><option>Other learner</option></select></label>
      <label><span>Primary discipline</span><select name="discipline" defaultValue={profile.discipline} required><option value="">Choose discipline</option><option>Radiology</option><option>Pathology</option><option>Medicine</option><option>Surgery</option><option>Emergency medicine</option><option>Radiography</option><option>Biomedical science</option><option>Medical education</option><option>Other</option></select></label>
    </div><div className="two-fields"><label><span>Institution (optional)</span><input name="institutionName" defaultValue={profile.institutionName} placeholder="University, hospital or research group" /></label><label><span>Country code</span><input name="countryCode" defaultValue={profile.countryCode || "GB"} maxLength={2} required /></label></div><label><span>Timezone</span><input name="timezone" defaultValue={profile.timezone || "Europe/London"} required /></label></div>
    <fieldset className="interest-picker"><legend>02 · What would you like to learn?</legend><p>Select at least one. These choices personalise course discovery; they do not affect clinical access.</p><div>{interests.map((interest) => <label key={interest}><input type="checkbox" name="interests" value={interest} defaultChecked={profile.interests.includes(interest)} /><span>{interest}</span></label>)}</div></fieldset>
    <div className="onboarding-consent"><label><input type="checkbox" name="acceptTerms" defaultChecked={Boolean(profile.termsAcceptedAt)} required /><span><b>Education-only account</b>I understand this platform is for education and research only and must not be used for diagnosis, reporting, patient care or clinical decisions.</span></label><label><input type="checkbox" name="marketingOptIn" defaultChecked={profile.marketingOptIn} /><span><b>Product updates (optional)</b>Send me occasional Visible Medicine course and platform updates.</span></label></div>
    {error && <p className="form-error" role="alert">{error}</p>}
    <button className="primary-button" disabled={busy}>{busy ? "Saving profile…" : profile.onboardingStatus === "complete" ? "Save learner profile" : "Create learner profile"}<span>→</span></button>
  </form>;
}
