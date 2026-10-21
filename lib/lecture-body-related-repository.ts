import {env} from 'cloudflare:workers';
import type {AuthContext} from '@/lib/auth';
import {ensureEducationUser} from '@/db/bootstrap';
import {getPlatformSnapshot} from '@/db/platform';
import {getPublishedLecture,LectureError} from '@/lib/lecture-repository';
import {lectureSlideBodyReferences,resolveLectureBodyReference} from './lecture-body-reference.ts';
import {lectureSlideHref} from '@/lib/lecture-slide-navigation';
import {bodyRelatedLectureHref,BODY_RELATED_LECTURE_PAGE_SIZE,type BodyRelatedLectureRequest} from './lecture-body-related-links.ts';
import type {RelatedPublishedLectures} from './lecture-related-repository.ts';

/** IDs are coarse candidates only: publication access/integrity checks precede all metadata. */
export async function getRelatedPublishedBodyLectures(auth:AuthContext,request:BodyRelatedLectureRequest):Promise<RelatedPublishedLectures>{
  if(!bodyRelatedLectureHref(request.reference,request.offset))return {items:[],nextOffset:null};
  const {roles}=await ensureEducationUser(auth);
  let organizationId:string|null=null;
  if(roles.some(role=>['instructor','examiner','administrator'].includes(role))){
    const platform=await getPlatformSnapshot(auth);
    if(platform.entitlement.studioAccess)organizationId=platform.organization.id;
  }
  const r=request.reference;
  const candidates=await env.DB.prepare(`SELECT w.id
    FROM workbooks w
    JOIN modules m ON m.id=w.module_id
    JOIN lecture_versions lv ON lv.workbook_id=w.id AND lv.version=w.version
    WHERE w.mode='lecture' AND w.status='published'
      AND (
        EXISTS(SELECT 1 FROM workbook_assignments a
          JOIN enrolments e ON e.course_id=m.course_id AND e.user_id=a.learner_id
          WHERE a.workbook_id=w.id AND a.learner_id=? AND a.status='active' AND e.status='active')
        OR EXISTS(SELECT 1 FROM cohort_workbook_assignments ca
          JOIN cohort_members cm ON cm.cohort_id=ca.cohort_id
          JOIN cohorts c ON c.id=ca.cohort_id
          JOIN enrolments e ON e.course_id=c.course_id AND e.user_id=cm.learner_id
          WHERE ca.workbook_id=w.id AND cm.learner_id=? AND cm.status='active'
            AND c.status='active' AND ca.status='active' AND c.course_id=m.course_id AND e.status='active')
        OR EXISTS(SELECT 1 FROM course_ownership o WHERE o.course_id=m.course_id AND o.organization_id=?)
      )
      AND EXISTS(SELECT 1 FROM json_each(
        CASE WHEN json_valid(lv.manifest_json) THEN lv.manifest_json ELSE '{"slides":[]}' END,'$.slides') s
        WHERE EXISTS(SELECT 1 FROM json_each(
          CASE WHEN json_type(CASE WHEN s.type='object' THEN s.value ELSE '{}' END,'$.bodyAnatomyReferences')='array'
            THEN json_extract(CASE WHEN s.type='object' THEN s.value ELSE '{}' END,'$.bodyAnatomyReferences') ELSE '[]' END) a
          WHERE json_extract(CASE WHEN a.type='object' THEN a.value ELSE '{}' END,'$.kind')='body-structure-v1'
            AND json_extract(CASE WHEN a.type='object' THEN a.value ELSE '{}' END,'$.structureId')=?
            AND json_extract(CASE WHEN a.type='object' THEN a.value ELSE '{}' END,'$.region')=?
            AND json_extract(CASE WHEN a.type='object' THEN a.value ELSE '{}' END,'$.side')=?
            AND json_extract(CASE WHEN a.type='object' THEN a.value ELSE '{}' END,'$.sourceSha256')=?
            AND json_extract(CASE WHEN a.type='object' THEN a.value ELSE '{}' END,'$.atlasRevision')=?))
    ORDER BY w.id LIMIT ? OFFSET ?`).bind(auth.userId,auth.userId,organizationId,r.structureId,r.region,r.side,r.sourceSha256,r.atlasRevision,BODY_RELATED_LECTURE_PAGE_SIZE+1,request.offset).all<{id:string}>();
  const items:RelatedPublishedLectures['items']=[];
  for(const candidate of candidates.results.slice(0,BODY_RELATED_LECTURE_PAGE_SIZE)){
    let publication:Awaited<ReturnType<typeof getPublishedLecture>>;
    try{publication=await getPublishedLecture(auth,candidate.id);}catch(error){
      if(error instanceof LectureError&&[403,404,409,422].includes(error.status))continue;
      throw error;
    }
    const {manifest,integrityHash}=publication;
    const slides=manifest.slides.flatMap(slide=>{
      const matches=lectureSlideBodyReferences(slide).some(pin=>resolveLectureBodyReference(pin)&&JSON.stringify(pin)===JSON.stringify(r));
      if(!matches)return [];
      const href=lectureSlideHref({workbookId:manifest.workbook.id,revision:integrityHash,request:{kind:'none'}},slide.id);
      return href?[{id:slide.id,title:slide.title,href}]:[];
    });
    if(slides.length)items.push({workbookId:manifest.workbook.id,title:manifest.workbook.title,version:manifest.workbook.version,slides});
  }
  const next=request.offset+BODY_RELATED_LECTURE_PAGE_SIZE;
  return {items,nextOffset:candidates.results.length>BODY_RELATED_LECTURE_PAGE_SIZE&&next<=1_000_000?next:null};
}
