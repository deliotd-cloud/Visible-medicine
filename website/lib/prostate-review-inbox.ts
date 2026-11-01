import type { InboxDescriptor, InboxItem, InboxStatus } from './clinical-review-inbox-contract.ts';
import { prostateReviewInboxCatalog, prostateReviewMaterial } from './prostate-review-material.ts';
import { prostateReviewContext, parseProstateReviewHistory, sameProstateReviewContext } from './prostate-review-contract.ts';
import { getProstateReviews } from './prostate-review-api.ts';
export { prostateReviewInboxCatalog } from './prostate-review-material.ts';

/** One grouped row; only both exact-revision sections approved can complete it. */
export async function prostateReviewInboxStatuses(request: Request, db: Pick<D1Database, 'prepare'> | undefined, catalog: InboxDescriptor[]): Promise<InboxItem[]> {
  const expected = (await prostateReviewInboxCatalog())[0];
  const output: InboxItem[] = [];
  for (const item of catalog.filter(d => d.key === expected.key)) {
    let status: InboxStatus = 'unavailable';
    if (expected.revision && Object.keys(item).length === Object.keys(expected).length &&
        Object.entries(expected).every(([key, value]) => item[key as keyof InboxDescriptor] === value)) try {
      const context = prostateReviewContext(await prostateReviewMaterial());
      const url = new URL('/api/atlas-review/prostate', request.url);
      url.searchParams.set('revision', context.contentRevision);
      const headers = new Headers(request.headers); headers.delete('X-Prostate-Review-Before');
      const response = await getProstateReviews(new Request(url, {headers}), db);
      if (response.ok) {
        const latest = parseProstateReviewHistory(await response.json(), context).history[0];
        status = !latest ? 'not-started' : !sameProstateReviewContext(latest.context, context) ? 're-review'
          : latest.decision.geometry === 'changes-required' || latest.decision.teaching === 'changes-required' ? 'changes-required'
          : latest.decision.geometry === 'approved' && latest.decision.teaching === 'approved' ? 'approval-recorded' : 'in-progress';
      }
    } catch { /* Missing or unconfirmed history is never approval or an empty history. */ }
    output.push({...item, status});
  }
  return output;
}
