export const STUDIO_COURSE_TEMPLATES = [
  {
    id: "guided-imaging",
    name: "Guided imaging course",
    description: "A teaching workbook followed by structured review and an optional assessment.",
    workbooks: [
      { title: "Guided cases", mode: "teaching", durationMinutes: 0 },
      { title: "Knowledge check", mode: "assessment", durationMinutes: 45 },
    ],
  },
  {
    id: "live-workshop",
    name: "Live teaching workshop",
    description: "A focused workbook for facilitated cases, polls, saved scenes and post-session review.",
    workbooks: [{ title: "Live workshop", mode: "teaching", durationMinutes: 0 }],
  },
  {
    id: "assessment-course",
    name: "Assessment course",
    description: "A practice workbook followed by a timed, independently reviewed assessment.",
    workbooks: [
      { title: "Practice cases", mode: "teaching", durationMinutes: 0 },
      { title: "Formal assessment", mode: "assessment", durationMinutes: 60 },
    ],
  },
] as const;

export function studioTemplate(id: unknown) {
  return STUDIO_COURSE_TEMPLATES.find((item) => item.id === id) ?? null;
}
