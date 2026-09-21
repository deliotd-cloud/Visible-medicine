import { env } from "cloudflare:workers";
import type { AuthContext } from "@/lib/auth";
import { appendAudit, ensureEducationUser } from "@/db/bootstrap";
import { getPlatformSnapshot } from "@/db/platform";
import { canAccessPublishedWorkbook } from "@/lib/workbook-access";
import { validateLectureSlides, type LectureSlide } from "@/lib/lecture-content";
import { createLectureManifestRecord, parseAndVerifyLectureManifest } from "@/lib/lecture-manifest";

export class LectureError extends Error {
  constructor(message: string, public status = 400) { super(message); }
}

type LectureRow = {
  id: string; title: string; version: number; status: string; course_id: string;
  course_title: string; author_id: string; organization_id: string;
  slides_json: string | null; review_hash: string | null;
};
export type LectureStudioView = {
  id: string; title: string; version: number; status: string; courseId: string;
  courseTitle: string; slides: LectureSlide[]; canEdit: boolean; canReview: boolean;
  canPublish: boolean;
  reviews: Array<{reviewerName: string; decision: string; comment: string; version: number; createdAt: string}>;
  published: {version: number; integrityHash: string; publishedAt: string} | null;
};

function identifier(value: unknown) {
  if (typeof value !== "string" || !/^[a-zA-Z0-9:_-]{1,140}$/.test(value))
    throw new LectureError("A valid lecture identifier is required.", 422);
  return value;
}
function titleText(value: unknown) {
  if (typeof value !== "string" || value.trim().length < 4 || value.length > 160 || value.includes("\0"))
    throw new LectureError("Use a lecture title between 4 and 160 characters.", 422);
  return value.trim();
}
function slidesFrom(row: LectureRow, allowEmpty = true) {
  try { return validateLectureSlides(JSON.parse(row.slides_json ?? "[]"), {allowEmpty,allowIncomplete:allowEmpty}); }
  catch { throw new LectureError("The lecture content is incomplete or invalid.", 422); }
}
async function staffLecture(auth: AuthContext, id: string) {
  const { roles } = await ensureEducationUser(auth);
  if (!roles.some(role => ["instructor", "examiner", "administrator"].includes(role)))
    throw new LectureError("An educator role is required.", 403);
  const platform = await getPlatformSnapshot(auth);
  if (!platform.entitlement.studioAccess) throw new LectureError("Studio is not enabled for this organization.", 403);
  const row = await env.DB.prepare(`SELECT w.id,w.title,w.version,w.status,m.course_id,c.title AS course_title,wa.author_id,o.organization_id,ld.slides_json,ld.review_hash
    FROM workbooks w JOIN modules m ON m.id=w.module_id JOIN courses c ON c.id=m.course_id
    JOIN course_ownership o ON o.course_id=c.id JOIN workbook_authorship wa ON wa.workbook_id=w.id
    LEFT JOIN lecture_drafts ld ON ld.workbook_id=w.id
    WHERE w.id=? AND w.mode='lecture' AND o.organization_id=?`).bind(identifier(id),platform.organization.id).first<LectureRow>();
  if (!row) throw new LectureError("This lecture is not available in your Studio workspace.", 404);
  return {row, roles};
}
async function recordFor(row: LectureRow) {
  try { return await createLectureManifestRecord({
    schema:"visible-medicine-lecture-v1", product:"Visible Medicine", intendedPurpose:"education-only",
    workbook:{id:row.id,title:row.title,mode:"lecture",version:Number(row.version)}, slides:slidesFrom(row,false),
  }); } catch(error) {
    if(error instanceof LectureError) throw error;
    throw new LectureError("The lecture cannot be reviewed until its title and slides are valid.",422);
  }
}

export async function getLectureStudio(auth: AuthContext, id: string): Promise<LectureStudioView> {
  const {row,roles} = await staffLecture(auth,id);
  const [reviews, published] = await Promise.all([
    env.DB.prepare(`SELECT u.display_name AS reviewerName,r.decision,r.comment,r.workbook_version AS version,r.created_at AS createdAt FROM lecture_reviews r JOIN users u ON u.id=r.reviewer_id WHERE r.workbook_id=? ORDER BY r.created_at DESC,r.id`).bind(id).all<LectureStudioView["reviews"][number]>(),
    env.DB.prepare(`SELECT version,integrity_hash AS integrityHash,published_at AS publishedAt FROM lecture_versions WHERE workbook_id=? AND version=?`).bind(id,Number(row.version)).first<NonNullable<LectureStudioView["published"]>>(),
  ]);
  return {id:row.id,title:row.title,version:Number(row.version),status:row.status,courseId:row.course_id,courseTitle:row.course_title,slides:slidesFrom(row),
    canEdit:["draft","changes-requested"].includes(row.status) && (row.author_id===auth.userId || roles.includes("administrator")),
    canReview:row.status==="in-review" && row.author_id!==auth.userId,
    canPublish:row.status==="approved",reviews:reviews.results,published};
}

export async function mutateLecture(auth: AuthContext, id: string, input: Record<string,unknown>) {
  const {row,roles} = await staffLecture(auth,id);
  const action=input.action;
  const fields=action==="save" ? ["action","id","expectedVersion","title","slides"] : action==="review" ? ["action","id","expectedVersion","decision","comment"] : ["action","id","expectedVersion"];
  if (Object.keys(input).some(key=>!fields.includes(key))) throw new LectureError("Unsupported lecture field.",422);
  if(input.id!==id) throw new LectureError("The lecture does not match this editor.",409);
  const expected=input.expectedVersion;
  if(typeof expected!=="number" || !Number.isSafeInteger(expected) || expected<1) throw new LectureError("A valid lecture version is required.",422);
  if(expected!==Number(row.version)) throw new LectureError("This lecture changed. Reload before continuing.",409);
  const now=new Date().toISOString();
  let statements:D1PreparedStatement[];
  if(action==="save") {
    if(!["draft","changes-requested"].includes(row.status)) throw new LectureError("Only an editable lecture draft can be saved.",409);
    if(row.author_id!==auth.userId && !roles.includes("administrator")) throw new LectureError("Only the author or an administrator may edit this draft.",403);
    const title=titleText(input.title);
    let slides:LectureSlide[];
    try { slides=validateLectureSlides(input.slides,{allowEmpty:true,allowIncomplete:true}); }
    catch(error) { throw new LectureError(error instanceof Error ? error.message : "Invalid lecture slides.",422); }
    // All guarded content writes precede the version transition in one atomic D1 batch.
    // A stale concurrent save therefore changes neither the draft nor its version.
    statements=[
      env.DB.prepare(`INSERT INTO lecture_drafts (workbook_id,slides_json,review_hash,updated_at)
        SELECT ?,?,NULL,? WHERE EXISTS (SELECT 1 FROM workbooks WHERE id=? AND mode='lecture' AND version=? AND status IN ('draft','changes-requested'))
        ON CONFLICT(workbook_id) DO UPDATE SET slides_json=excluded.slides_json,review_hash=NULL,updated_at=excluded.updated_at`).bind(id,JSON.stringify(slides),now,id,expected),
      env.DB.prepare(`UPDATE workbooks SET title=?,version=version+1 WHERE id=? AND mode='lecture' AND version=? AND status IN ('draft','changes-requested')`).bind(title,id,expected),
    ];
  } else if(action==="request-review") {
    if(!["draft","changes-requested"].includes(row.status)) throw new LectureError("Only editable lectures can be submitted for review.",409);
    if(row.author_id!==auth.userId && !roles.includes("administrator")) throw new LectureError("Only the author or an administrator may request review.",403);
    const frozen=await recordFor(row);
    statements=[
      env.DB.prepare(`UPDATE lecture_drafts SET review_hash=?,updated_at=? WHERE workbook_id=? AND EXISTS (SELECT 1 FROM workbooks WHERE id=? AND version=? AND status IN ('draft','changes-requested'))`).bind(frozen.integrityHash,now,id,id,expected),
      env.DB.prepare(`UPDATE workbooks SET status='in-review' WHERE id=? AND version=? AND status IN ('draft','changes-requested') AND EXISTS (SELECT 1 FROM lecture_drafts WHERE workbook_id=? AND review_hash=?)`).bind(id,expected,id,frozen.integrityHash),
    ];
  } else if(action==="review") {
    if(row.status!=="in-review") throw new LectureError("This lecture is not awaiting review.",409);
    if(row.author_id===auth.userId) throw new LectureError("A different education user must review this lecture.",403);
    if(!["approved","changes-requested"].includes(String(input.decision)) || typeof input.comment!=="string" || !input.comment.trim() || input.comment.length>2000)
      throw new LectureError("Choose a decision and add a review comment (up to 2,000 characters).",422);
    const frozen=await recordFor(row);
    if(frozen.integrityHash!==row.review_hash) throw new LectureError("The lecture no longer matches the submitted revision.",409);
    const reviewId=crypto.randomUUID();
    statements=[
      env.DB.prepare(`INSERT INTO lecture_reviews (id,workbook_id,workbook_version,content_hash,reviewer_id,decision,comment,created_at)
        SELECT ?,?,?,?,?,?,?,? WHERE EXISTS (SELECT 1 FROM workbooks w JOIN lecture_drafts ld ON ld.workbook_id=w.id WHERE w.id=? AND w.version=? AND w.status='in-review' AND ld.review_hash=?)`).bind(reviewId,id,expected,frozen.integrityHash,auth.userId,input.decision,input.comment.trim(),now,id,expected,frozen.integrityHash),
      env.DB.prepare(`UPDATE workbooks SET status=? WHERE id=? AND version=? AND status='in-review' AND EXISTS (SELECT 1 FROM lecture_reviews WHERE id=?)`).bind(input.decision,id,expected,reviewId),
    ];
  } else if(action==="publish") {
    if(row.status!=="approved") throw new LectureError("Independent review is required before publication.",409);
    const frozen=await recordFor(row);
    if(frozen.integrityHash!==row.review_hash) throw new LectureError("This content is not the approved revision.",409);
    const review=await env.DB.prepare(`SELECT id FROM lecture_reviews WHERE workbook_id=? AND workbook_version=? AND content_hash=? AND decision='approved' AND reviewer_id<>? LIMIT 1`).bind(id,expected,frozen.integrityHash,row.author_id).first<{id:string}>();
    if(!review) throw new LectureError("Approval for this exact lecture revision is missing.",409);
    const versionId=`lecture-version:${id}:${expected}`;
    statements=[
      env.DB.prepare(`INSERT INTO lecture_versions (id,workbook_id,version,integrity_hash,manifest_json,published_at)
        SELECT ?,?,?,?,?,? WHERE EXISTS (SELECT 1 FROM workbooks w JOIN lecture_drafts ld ON ld.workbook_id=w.id WHERE w.id=? AND w.version=? AND w.status='approved' AND ld.review_hash=?)`).bind(versionId,id,expected,frozen.integrityHash,frozen.manifestJson,now,id,expected,frozen.integrityHash),
      env.DB.prepare(`UPDATE workbooks SET status='published' WHERE id=? AND version=? AND status='approved' AND EXISTS (SELECT 1 FROM lecture_versions WHERE id=? AND integrity_hash=?)`).bind(id,expected,versionId,frozen.integrityHash),
    ];
  } else throw new LectureError("Unsupported lecture action.",422);
  const result=await env.DB.batch(statements);
  if(Number(result.at(-1)?.meta.changes)!==1) throw new LectureError("This lecture changed during the operation. Reload before continuing.",409);
  await appendAudit(auth.userId,`lecture.${action}`,"workbook",id,"success",`revision=${expected};case-free=true;independent-review=true`);
  return getLectureStudio(auth,id);
}

export async function isLectureWorkbook(id: string) {
  return Boolean(await env.DB.prepare(`SELECT id FROM workbooks WHERE id=? AND mode='lecture'`).bind(identifier(id)).first());
}

export async function getPublishedLecture(auth: AuthContext, id: string, courseSlug?: string) {
  const {roles}=await ensureEducationUser(auth);
  let staffOwns=false;
  if(roles.some(role=>["instructor","examiner","administrator"].includes(role))) {
    const platform=await getPlatformSnapshot(auth);
    staffOwns=platform.entitlement.studioAccess && Boolean(await env.DB.prepare(`SELECT w.id FROM workbooks w JOIN modules m ON m.id=w.module_id JOIN course_ownership o ON o.course_id=m.course_id WHERE w.id=? AND o.organization_id=?`).bind(identifier(id),platform.organization.id).first());
  }
  // No Atlas subscription or case permission substitutes for this workbook's allocation.
  if(!staffOwns && !await canAccessPublishedWorkbook(auth.userId,[],identifier(id)))
    throw new LectureError("This lecture is not available with your current course access.",403);
  if(courseSlug && !await env.DB.prepare(`SELECT cr.id FROM course_releases cr JOIN course_release_workbooks rw ON rw.release_id=cr.id WHERE cr.slug=? AND cr.status='published' AND rw.workbook_id=?`).bind(courseSlug,id).first())
    throw new LectureError("This lecture is not part of the published course.",404);
  const published=await env.DB.prepare(`SELECT lv.manifest_json,lv.integrity_hash,lv.version,lv.published_at FROM lecture_versions lv JOIN workbooks w ON w.id=lv.workbook_id AND w.version=lv.version WHERE w.id=? AND w.mode='lecture' AND w.status='published'`).bind(id).first<{manifest_json:string;integrity_hash:string;version:number;published_at:string}>();
  if(!published) throw new LectureError("This lecture has not been published.",404);
  try {
    const manifest=await parseAndVerifyLectureManifest(published.manifest_json,published.integrity_hash);
    if(manifest.workbook.id!==id || manifest.workbook.version!==Number(published.version)) throw new Error("identity mismatch");
    return {manifest,integrityHash:published.integrity_hash,publishedAt:published.published_at};
  } catch { throw new LectureError("The published lecture could not be verified.",409); }
}
