import { structures } from '../anatomy-data';
import { ReviewDashboard } from './review-dashboard';
import './review.css';

export const metadata = {
  title: 'Shoulder Review Workspace | Visible Medicine',
};
export const dynamic = 'force-dynamic';

export default async function ReviewPage({
  searchParams,
}: {
  searchParams: Promise<{ structure?: string }>;
}) {
  const query = await searchParams;
  const initialId =
    structures.find((s) => s.id === query.structure)?.id ?? structures[0].id;
  return <ReviewDashboard initialId={initialId} />;
}
