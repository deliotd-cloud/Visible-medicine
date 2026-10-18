import {
  bodyReviewSummaries,
  bodyReviewRegions,
} from '../../../lib/body-review-material';
import { BodyReviewDashboard } from './review-dashboard';
import './body-review.css';

export const metadata = { title: 'Body Review Worksheets | Visible Medicine' };
export const dynamic = 'force-dynamic';
export default async function BodyReviewPage({
  searchParams,
}: {
  searchParams: Promise<{ structure?: string }>;
}) {
  const params = await searchParams;
  const selected = bodyReviewSummaries.find((s) => s.id === params.structure);
  return (
    <BodyReviewDashboard
      rows={bodyReviewSummaries}
      regions={bodyReviewRegions}
      initialId={selected?.id ?? null}
      initialRegion={selected?.regions[0] ?? 'shoulder-arm'}
    />
  );
}
