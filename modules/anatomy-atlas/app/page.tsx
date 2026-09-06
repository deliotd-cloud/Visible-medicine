import BodyExplorer from './body-explorer';
import {
  parseStudyLink,
  studyLinkKey,
  type StudySearchParams,
} from '../lib/study-links';
export default async function Home({
  searchParams,
}: {
  searchParams?: Promise<StudySearchParams>;
}) {
  const link = parseStudyLink((await searchParams) ?? {});
  return (
    <BodyExplorer
      key={studyLinkKey(link)}
      initialRegion="whole-body"
      studyLink={link}
    />
  );
}
