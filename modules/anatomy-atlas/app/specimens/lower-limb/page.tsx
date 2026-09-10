import { parseSpecimenLink, specimenLinkKey } from '../../../lib/specimen-links';
import type { StudySearchParams } from '../../../lib/study-links';
import SpecimenLinkedPage from './specimen-linked-page';

export default async function LowerLimbPage({ searchParams }: { searchParams?: Promise<StudySearchParams> }) {
  const link = parseSpecimenLink((await searchParams) ?? {});
  return <SpecimenLinkedPage key={specimenLinkKey(link)} link={link} />;
}
