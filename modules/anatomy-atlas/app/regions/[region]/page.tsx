import BodyExplorer from '../../body-explorer';
import {
  parseStudyLink,
  studyLinkKey,
  type StudySearchParams,
} from '../../../lib/study-links';
export default async function RegionPage({
  params,
  searchParams,
}: {
  params: Promise<{ region: string }>;
  searchParams?: Promise<StudySearchParams>;
}) {
  const { region } = await params;
  const link = parseStudyLink((await searchParams) ?? {});
  return (
    <BodyExplorer
      key={`${region}:${studyLinkKey(link)}`}
      initialRegion={region}
      studyLink={link}
    />
  );
}
