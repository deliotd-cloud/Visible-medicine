export const STUDIO_COURSES_PAGE_SIZE = 12;

type SearchableCourse = {
  title: string;
  code: string;
  description?: string | null;
};

export function normalizeStudioCourseQuery(value: unknown): string {
  return typeof value === "string" ? value.slice(0, 160).replace(/\s+/gu, " ").trim().slice(0, 80) : "";
}

export function studioCourseDirectoryUrl(query: string, page: number): string {
  const params = new URLSearchParams();
  if (query) params.set("q", query);
  if (page > 1) params.set("page", String(page));
  const suffix = params.toString();
  return `/studio/courses${suffix ? `?${suffix}` : ""}`;
}

export function getStudioCourseDirectory<T extends SearchableCourse>(courses: readonly T[], rawQuery: unknown, rawPage: unknown) {
  const query = normalizeStudioCourseQuery(rawQuery);
  const needle = query.toLowerCase();
  const matchingCourses = needle
    ? courses.filter((course) => [course.title, course.code, course.description ?? ""].some((value) => value.toLowerCase().includes(needle)))
    : courses;
  const matchingCount = matchingCourses.length;
  const pageCount = Math.ceil(matchingCount / STUDIO_COURSES_PAGE_SIZE);
  const validPage = typeof rawPage === "string" && /^[1-9]\d*$/u.test(rawPage);
  const requestedPage = validPage ? Number(rawPage) : 1;
  const page = pageCount > 0 ? Math.min(requestedPage, pageCount) : 1;
  const firstIndex = (page - 1) * STUDIO_COURSES_PAGE_SIZE;

  return {
    query,
    totalCount: courses.length,
    matchingCount,
    page,
    pageCount,
    firstItem: matchingCount ? firstIndex + 1 : 0,
    lastItem: Math.min(firstIndex + STUDIO_COURSES_PAGE_SIZE, matchingCount),
    pageCourses: matchingCourses.slice(firstIndex, firstIndex + STUDIO_COURSES_PAGE_SIZE),
    previousHref: pageCount > 1 && page > 1 ? studioCourseDirectoryUrl(query, page - 1) : null,
    nextHref: pageCount > 1 && page < pageCount ? studioCourseDirectoryUrl(query, page + 1) : null,
  };
}
