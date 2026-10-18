import {appendLectureTourContext,lectureTourContextMatches,type LectureTourContext} from './lecture-tour-context.ts';
/** Published slide links bind stable slide IDs to the verified publication hash.
 * They select educational content, never confer lecture or Atlas access. */
export type LectureSlideRequest =
  | { kind: 'none' }
  | { kind: 'requested'; slideId: string; revision: string }
  | { kind: 'invalid' };

export type LectureSearchParams = Record<string, string | string[] | undefined>;
export type PublishedLectureNavigation = {
  workbookId: string;
  courseSlug?: string;
  revision: string;
  request: LectureSlideRequest;
  tourContext?: LectureTourContext;
};
export type LectureSlideResolution =
  | { kind: 'ready'; index: number }
  | { kind: 'unavailable'; reason: 'invalid-link' | 'stale-revision' | 'missing-slide' | 'invalid-publication' };

const slideIdPattern = /^[A-Za-z0-9][A-Za-z0-9_-]{0,99}$/;
const workbookIdPattern = /^[A-Za-z0-9][A-Za-z0-9:_-]{0,139}$/;
const revisionPattern = /^[a-f0-9]{64}$/;

export function parseLectureSlideRequest(params: LectureSearchParams | URLSearchParams): LectureSlideRequest {
  if (!(params instanceof URLSearchParams) &&
      ((Object.hasOwn(params,'lectureSlide') && Array.isArray(params.lectureSlide)) ||
       (Object.hasOwn(params,'lectureRevision') && Array.isArray(params.lectureRevision)))) return {kind:'invalid'};
  const read = (key: string): string[] => params instanceof URLSearchParams
    ? params.getAll(key)
    : !Object.hasOwn(params, key) || params[key] === undefined ? []
      : Array.isArray(params[key]) ? params[key] : [params[key]];
  const slides = read('lectureSlide'), revisions = read('lectureRevision');
  if (!slides.length && !revisions.length) return { kind: 'none' };
  if (slides.length !== 1 || revisions.length !== 1 ||
      !slideIdPattern.test(slides[0]) || !revisionPattern.test(revisions[0])) return { kind: 'invalid' };
  return { kind: 'requested', slideId: slides[0], revision: revisions[0] };
}

export function lectureRoutePath(workbookId: string, courseSlug?: string): string {
  return courseSlug === undefined
    ? `/learn/lectures/${encodeURIComponent(workbookId)}`
    : `/learn/${encodeURIComponent(courseSlug)}/${encodeURIComponent(workbookId)}`;
}

/** Retain a bounded invalid marker through sign-in instead of silently discarding
 * a malformed/stale link and displaying an unrelated first slide. */
export function lectureRequestReturnPath(workbookId: string, courseSlug: string | undefined, request: LectureSlideRequest, tourContext?: LectureTourContext): string {
  const path = lectureRoutePath(workbookId, courseSlug);
  if (request.kind === 'none') return appendLectureTourContext(path,tourContext)??appendLectureTourContext(path,{kind:'invalid'})??path;
  const valid = request.kind === 'requested' && slideIdPattern.test(request.slideId) && revisionPattern.test(request.revision);
  const query = new URLSearchParams({
    lectureSlide: valid ? request.slideId : 'invalid',
    lectureRevision: valid ? request.revision : 'invalid',
  });
  const href=`${path}?${query}`;
  return appendLectureTourContext(href,tourContext)??appendLectureTourContext(href,{kind:'invalid'})??href;
}

export function lectureSlideHref(source: PublishedLectureNavigation, slideId: string): string | null {
  if (!workbookIdPattern.test(source.workbookId) || !revisionPattern.test(source.revision) ||
      (source.courseSlug !== undefined && !/^[a-z0-9-]{1,140}$/.test(source.courseSlug)) ||
      !slideIdPattern.test(slideId)) return null;
  return lectureRequestReturnPath(source.workbookId, source.courseSlug, { kind: 'requested', slideId, revision: source.revision },source.tourContext);
}

export function resolveLectureSlideRequest(request: LectureSlideRequest, revision: string, slides: readonly { id: string }[]): LectureSlideResolution {
  if (!revisionPattern.test(revision) || !slides.length ||
      slides.some(slide => !slideIdPattern.test(slide.id)) || new Set(slides.map(slide => slide.id)).size !== slides.length)
    return { kind: 'unavailable', reason: 'invalid-publication' };
  if (request.kind === 'none') return { kind: 'ready', index: 0 };
  if (request.kind !== 'requested' || !slideIdPattern.test(request.slideId) || !revisionPattern.test(request.revision))
    return { kind: 'unavailable', reason: 'invalid-link' };
  if (request.revision !== revision) return { kind: 'unavailable', reason: 'stale-revision' };
  const index = slides.findIndex(slide => slide.id === request.slideId);
  return index < 0 ? { kind: 'unavailable', reason: 'missing-slide' } : { kind: 'ready', index };
}

/** Match only this learner route; never let a stale callback rewrite another
 * workbook/course, an external URL, or an editor preview. */
export function lectureLocationMatches(source: PublishedLectureNavigation, location: { pathname: string;search?:string }): boolean {
  if (!lectureSlideHref(source, 'check')) return false;
  try {
    const segments = location.pathname.split('/').map(segment=>decodeURIComponent(segment));
    if(segments.some(segment=>/[\/\\]/.test(segment))) return false;
    return segments.join('/') === decodeURIComponent(lectureRoutePath(source.workbookId, source.courseSlug))&&
      (!source.tourContext||lectureTourContextMatches(source.tourContext,new URLSearchParams(location.search??'')));
  }
  catch { return false; }
}
