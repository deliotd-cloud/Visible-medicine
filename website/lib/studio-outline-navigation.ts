export type CourseOutlineKind = "all" | "lecture" | "teaching" | "assessment";
export type CourseOutlineFilter = {courseId: string; query: string; kind: CourseOutlineKind};

const keys = ["outlineCourse", "outlineQuery", "outlineKind"] as const;
const kinds = new Set<CourseOutlineKind>(["all", "lecture", "teaching", "assessment"]);
type Params = URLSearchParams | Record<string, string | string[] | undefined>;

function values(params: Params, key: string): string[] {
  if (params instanceof URLSearchParams) return params.getAll(key);
  const value = params[key];
  return typeof value === "string" ? [value] : Array.isArray(value) ? value : [];
}

export function readCourseOutlineFilter(courseId: string, params: Params): CourseOutlineFilter | null {
  const [course, query, kind] = keys.map(key => values(params, key));
  if (course.length !== 1 || query.length !== 1 || kind.length !== 1) return null;
  if (course[0] !== courseId || !courseId || courseId.length > 120) return null;
  if (query[0].length > 80 || /[\u0000-\u001f\u007f]/u.test(query[0])) return null;
  if (!kinds.has(kind[0] as CourseOutlineKind)) return null;
  return {courseId, query: query[0], kind: kind[0] as CourseOutlineKind};
}

export function courseOutlineReturnPath(courseId: string, params: Params): string {
  const path = `/studio/courses/${encodeURIComponent(courseId)}`;
  const filter = readCourseOutlineFilter(courseId, params);
  if (!filter) return path;
  const query = new URLSearchParams({outlineCourse: courseId, outlineQuery: filter.query, outlineKind: filter.kind});
  return `${path}?${query}`;
}

export function workbookBuilderPath(workbookId: string, filter: CourseOutlineFilter): string {
  const path = `/studio/workbooks/${encodeURIComponent(workbookId)}/builder`;
  const valid = readCourseOutlineFilter(filter.courseId, {outlineCourse: filter.courseId, outlineQuery: filter.query, outlineKind: filter.kind});
  if (!valid || (!valid.query && valid.kind === "all")) return path;
  const query = new URLSearchParams({outlineCourse: valid.courseId, outlineQuery: valid.query, outlineKind: valid.kind});
  return `${path}?${query}`;
}

export function clearCourseOutlineParams(params: URLSearchParams): void {
  for (const key of keys) params.delete(key);
}
