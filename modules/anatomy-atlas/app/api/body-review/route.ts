import { bodyReviewMaterial } from '../../../lib/body-review-material';
import {
  authenticatedReviewer,
  reviewJson,
  ReviewHttpError,
} from '../../../lib/review-http';

export const dynamic = 'force-dynamic';
export async function GET(request: Request) {
  try {
    authenticatedReviewer(request.headers);
    const params = new URL(request.url).searchParams;
    if (params.getAll('structure').length !== 1)
      return reviewJson({ error: 'Choose one body-catalogue structure.' }, 400);
    const material = await bodyReviewMaterial(params.get('structure')!);
    if (!material)
      return reviewJson(
        { error: 'Unknown body-catalogue structure. No worksheet created.' },
        404,
      );
    const response = reviewJson(material);
    if (params.get('download') === '1') {
      const name = /^FMA\d+$/.test(material.source.structure.fmaId)
        ? material.source.structure.fmaId
        : 'structure';
      response.headers.set(
        'Content-Disposition',
        `attachment; filename="visible-medicine-${name}-review-worksheet.json"`,
      );
    }
    return response;
  } catch (error) {
    if (error instanceof ReviewHttpError)
      return reviewJson({ error: error.message }, error.status);
    return reviewJson(
      {
        error: 'Review material is unavailable. No decisions have been saved.',
      },
      503,
    );
  }
}
