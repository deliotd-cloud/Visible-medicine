import '../review-model-embedded.css';
import { renderReviewModel } from '../model-view';
export const dynamic = 'force-dynamic';
export default async function EmbeddedReviewModel({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  return renderReviewModel(await searchParams, true);
}
