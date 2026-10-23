/** Display filters only. Call after obtaining the user's authorised Studio snapshot. */
export type StudioQueueParams = Record<string, string | string[] | undefined>;
export const RELEASE_QUEUE_STATUSES = ["draft", "in-review", "changes-requested", "approved", "published"] as const;

export function workbookQueue(params: StudioQueueParams): "editing" | "all" {
  return params.queue === "editing" ? "editing" : "all";
}

export function workbookMatchesStatus(workbook: { status: string }, status: string): boolean {
  return status === "all" || (status === "editing"
    ? workbook.status === "draft" || workbook.status === "changes-requested"
    : workbook.status === status);
}

type ParsedReleaseQueue = {status:string;course:string;valid:boolean;review?:"independent"|"awaiting"};
export function parseReleaseQueue(params: StudioQueueParams): ParsedReleaseQueue {
  const status = params.status ?? "all";
  const course = params.course ?? "";
  const valid = typeof status === "string" && (status === "all" || RELEASE_QUEUE_STATUSES.some((item) => item === status))
    && typeof course === "string" && course.length <= 256;
  const parsed = { status: typeof status === "string" ? status : "all", course: typeof course === "string" ? course : "", valid };
  if(params.review===undefined)return parsed;
  if(params.review!=="independent"&&params.review!=="awaiting")return {...parsed,valid:false};
  return {...parsed,review:params.review};
}

export function filterReleaseQueue<T extends { status: string; courseId: string }>(releases: readonly T[], queue: ReturnType<typeof parseReleaseQueue>): T[] {
  if (!queue.valid) return [];
  return releases.filter((release) => (queue.status === "all" || release.status === queue.status) && (!queue.course || release.courseId === queue.course));
}
