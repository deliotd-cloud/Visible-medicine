type SavedLearning = { resourceType: string; resourceSlug: string };
type Enrolment = { slug: string; resumeWorkbookId: string | null; firstWorkbookId: string | null };

const courseSlug = (value: string) => /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);
const workbookId = (value: string) => /^[a-zA-Z0-9:_-]+$/.test(value);

export function courseDetailsHref(slug: string): string | null {
  return courseSlug(slug) ? `/courses/${slug}` : null;
}

export function courseWorkbookHref(slug: string, workbook: string | null | undefined): string | null {
  return courseSlug(slug) && typeof workbook === "string" && workbookId(workbook)
    ? `/learn/${slug}/${encodeURIComponent(workbook)}` : null;
}

export function savedLearningHref(
  item: SavedLearning,
  { knownAtlas, knownCourse, enrolments }: { knownAtlas: boolean; knownCourse: boolean; enrolments: readonly Enrolment[] },
): string {
  const slug = item.resourceSlug;
  if (item.resourceType === "atlas") return knownAtlas && courseSlug(slug) ? `/atlas/${slug}` : "/atlas";
  if (item.resourceType !== "course") return "/my-learning";
  const enrolled = enrolments.find((course) => course.slug === slug);
  const resume = enrolled && (courseWorkbookHref(slug, enrolled.resumeWorkbookId) ?? courseWorkbookHref(slug, enrolled.firstWorkbookId));
  return resume || ((knownCourse || enrolled) && courseDetailsHref(slug)) || "/courses";
}
