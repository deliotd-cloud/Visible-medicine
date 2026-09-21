import type { Metadata } from "next";
import { EducationRuntime } from "@/components/EducationRuntime";
import { requireChatGPTUser } from "../../../../chatgpt-auth";
import { getStudioSnapshot } from "@/lib/education-platform";
import { notFound } from "next/navigation";
import { LectureEditor } from "@/components/LectureEditor";
import Link from "next/link";
import { getLectureStudio } from "@/lib/lecture-repository";
import { WorkspaceContextBar } from "@/components/SiteFrame";
import "../../../../learn/runtime.css";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Studio workbook builder",
  description: "Institution-scoped Visible Medicine workbook authoring.",
  robots: { index: false, follow: false },
};

export default async function StudioWorkbookBuilderPage({
  params,
}: {
  params: Promise<{ workbookId: string }>;
}) {
  const rawWorkbookId = (await params).workbookId;
  const workbookId = decodeURIComponent(rawWorkbookId).replace(
    /[^a-zA-Z0-9:_-]/g,
    "",
  );
  const returnPath = `/studio/workbooks/${encodeURIComponent(workbookId)}/builder`;
  const user = await requireChatGPTUser(returnPath);
  const snapshot = await getStudioSnapshot({ userId: `edu:${user.userId}`, externalSubject: `sites:${user.userId}`, email: user.email, displayName: user.displayName });
  const workbook = snapshot.workbooks.find((item) => item.id === workbookId);
  if (!workbook) notFound();
  if(workbook.mode === "lecture") {
    const initial=await getLectureStudio({userId:`edu:${user.userId}`,externalSubject:`sites:${user.userId}`,email:user.email,displayName:user.displayName},workbookId);
    return <><WorkspaceContextBar pathname={returnPath} signedIn={true} /><div className="intended-use-strip"><span>Education &amp; research only</span><p>No diagnosis, reporting or patient care.</p></div><main className="lecture-workspace">
      <header className="lecture-workspace-heading"><nav aria-label="Breadcrumb"><Link href="/studio/workspace">Studio</Link><span aria-hidden="true"> / </span><Link href={`/studio/courses/${encodeURIComponent(workbook.courseId)}`}>{workbook.courseTitle}</Link></nav><h1>Lecture editor</h1></header>
      <LectureEditor initial={initial} courseOutline={snapshot.workbooks.filter(item=>item.courseId===workbook.courseId).map(({id,title})=>({id,title}))} />
    </main></>;
  }
  return (
    <EducationRuntime
      workbookId={workbookId}
      initialView="authoring"
      accessMode="authoring"
      returnTo={`/studio/courses/${encodeURIComponent(workbook.courseId)}`}
      courseOutline={{ title: workbook.courseTitle, items: snapshot.workbooks.filter((item) => item.courseId === workbook.courseId).map(({ id, title }) => ({ id, title })) }}
    />
  );
}
