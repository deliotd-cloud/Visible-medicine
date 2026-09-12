import { parseIndependentStudyLink } from '@/lib/independent-study-links';
import type { StudySearchParams } from '@/lib/study-links';
import IndependentLinkedPage from '../independent-linked-page';
export default async function Page({searchParams}:{searchParams?:Promise<StudySearchParams>}) {
  const link=parseIndependentStudyLink((await searchParams) ?? {});
  return <IndependentLinkedPage key={JSON.stringify(link)} kind="female-pelvis" link={link} />;
}
