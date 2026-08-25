export type CourseDiscoveryRecord = {
  id: string;
  title: string;
  summary: string;
  level: string;
  outcomes: string[];
  publisherKind: string;
  accessModel: string;
};

export type LearnerDiscoveryProfile = {
  trainingStage: string;
  discipline: string;
  interests: string[];
};

export type ReleaseReadinessInput = {
  title: string;
  summary: string;
  outcomes: string[];
  publisher: string;
  workbookCount: number;
  visibility: string;
  accessModel: string;
  priceMinor: number;
  currency: string;
  reviewedBy?: string | null;
  reviewNotes?: string;
};

export const PILOT_READINESS_GATES = [
  { key: "identity", label: "Education identity", owner: "Platform", evidence: "Approved identity adapter, lifecycle and role mapping" },
  { key: "tenancy", label: "Institution isolation", owner: "Security", evidence: "Organisation-scoped authorization tests and review" },
  { key: "content", label: "Medical content", owner: "Clinical publishing", evidence: "Rights, de-identification and specialist review evidence" },
  { key: "privacy", label: "Privacy and learner rights", owner: "Governance", evidence: "Approved notices, retention, export and deletion process" },
  { key: "accessibility", label: "Accessibility", owner: "Product", evidence: "Keyboard, contrast, assistive-technology and learner review" },
  { key: "security", label: "Security", owner: "Engineering", evidence: "Threat review, dependency review, rate limits and incident plan" },
  { key: "operations", label: "Operations", owner: "Operations", evidence: "Monitoring, support, backup, restore and withdrawal exercise" },
  { key: "commercial", label: "Commercial operations", owner: "Commercial", evidence: "Approved contract, tax, invoice, refund and support process" },
] as const;

export const READINESS_STATUSES = ["not-started", "in-progress", "ready", "blocked", "not-applicable"] as const;

function normal(value: string) {
  return value.normalize("NFKC").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

export function scoreCourseForLearner(course: CourseDiscoveryRecord, profile: LearnerDiscoveryProfile | null) {
  if (!profile) return 0;
  const haystack = normal([course.title, course.summary, course.level, ...course.outcomes].join(" "));
  const signals = [...profile.interests, profile.discipline, profile.trainingStage].map(normal).filter(Boolean);
  const matched = signals.filter((signal) => signal.split(" ").some((token) => token.length > 2 && haystack.includes(token)));
  return new Set(matched).size;
}

export function courseSearchText(course: CourseDiscoveryRecord) {
  return normal([course.title, course.summary, course.level, course.publisherKind, course.accessModel, ...course.outcomes].join(" "));
}

export function releaseReadiness(input: ReleaseReadinessInput) {
  const checks = [
    { key: "title", label: "Learner-facing title", ready: input.title.trim().length >= 8 },
    { key: "summary", label: "Course summary", ready: input.summary.trim().length >= 30 },
    { key: "outcomes", label: "At least two learning outcomes", ready: input.outcomes.filter(Boolean).length >= 2 },
    { key: "publisher", label: "Publisher identified", ready: input.publisher.trim().length >= 2 },
    { key: "workbooks", label: "Published workbook selected", ready: input.workbookCount > 0 },
    { key: "access", label: "Audience and access selected", ready: Boolean(input.visibility && input.accessModel) },
    { key: "price", label: "Commercial fields internally consistent", ready: input.accessModel !== "paid" || (input.priceMinor > 0 && /^[A-Z]{3}$/.test(input.currency)) },
    { key: "review", label: "Independent review recorded", ready: Boolean(input.reviewedBy && input.reviewNotes?.trim()) },
  ];
  return { checks, ready: checks.every((check) => check.ready), complete: checks.filter((check) => check.ready).length };
}

export function normaliseInvitationRole(value: unknown) {
  const role = typeof value === "string" ? value.trim().toLowerCase() : "";
  if (!["learner", "educator", "reviewer", "administrator"].includes(role)) throw new Error("Choose an approved education role.");
  return role;
}

export function normaliseEmail(value: unknown) {
  const email = typeof value === "string" ? value.normalize("NFKC").trim().toLowerCase() : "";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) throw new Error("Enter a valid email address.");
  return email;
}

export function parseRosterInput(value: unknown, maxRows = 250) {
  const source = typeof value === "string" ? value : "";
  const rows = source.split(/\r?\n/).map((row) => row.trim()).filter(Boolean);
  if (!rows.length) throw new Error("Add at least one roster row.");
  if (rows.length > maxRows) throw new Error(`A roster upload is limited to ${maxRows} rows.`);
  const parsed = rows.map((row, index) => {
    const [emailValue, roleValue = "learner"] = row.split(",").map((part) => part.trim());
    try {
      return { email: normaliseEmail(emailValue), role: normaliseInvitationRole(roleValue) };
    } catch (error) {
      throw new Error(`Roster row ${index + 1}: ${error instanceof Error ? error.message : "invalid value"}`);
    }
  });
  const unique = new Map(parsed.map((item) => [item.email, item]));
  return [...unique.values()];
}

export function safeReturnPath(value: unknown, fallback = "/my-learning") {
  const path = typeof value === "string" ? value.trim() : "";
  return path.startsWith("/") && !path.startsWith("//") && !path.includes("\\") ? path : fallback;
}
