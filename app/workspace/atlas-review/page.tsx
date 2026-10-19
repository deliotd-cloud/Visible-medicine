import ClinicalReviewOverview from '@/atlas-review/app/review/overview/page';
import { ClinicalReviewAreas } from '@/components/ClinicalReviewAreas';
export { metadata, dynamic } from '@/atlas-review/app/review/overview/page';

export default function ClinicalReviewPage(props: Parameters<typeof ClinicalReviewOverview>[0]) {
  return <><ClinicalReviewAreas current="structures" /><ClinicalReviewOverview {...props} /></>;
}
