export function liveClassroomHref(courseSlug: string, workbookId: string) {
  return `/learn/${encodeURIComponent(courseSlug)}/${encodeURIComponent(workbookId)}?view=teaching&video=1`;
}
