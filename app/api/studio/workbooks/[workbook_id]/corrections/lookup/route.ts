import { authenticateEducationApi, EducationApiError } from '@/lib/education-api';
import { enforceRateLimit, InstitutionOperationsError } from '@/lib/institution-operations';
import { readBoundedMutationJson } from '@/lib/mutation-json';
import {
  WorkbookCorrectionError, workbookCorrectionId, parseWorkbookCorrectionLookup,
  parseWorkbookCorrectionLookupRequest,
} from '@/lib/workbook-correction-contract';
import { lookupStudioWorkbookCorrection } from '@/lib/workbook-correction-repository';

export const dynamic = 'force-dynamic';
const headers = {'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'};
type Context = {params: Promise<{workbook_id: string}>};

function failure(error: unknown) {
  if (error instanceof WorkbookCorrectionError || error instanceof EducationApiError || error instanceof InstitutionOperationsError)
    return Response.json({error:error.message},{status:error.status,headers});
  console.error('Visible Medicine Studio correction lookup error',{type:error instanceof Error ? error.name : 'unknown'});
  return Response.json({error:'Studio could not confirm this change. Refresh and check the workbook before retrying.'},{status:500,headers});
}

export async function POST(request: Request, context: Context) {
  try {
    const auth = await authenticateEducationApi();
    await enforceRateLimit(auth.userId,'studio-write',45,60);
    if (request.url.includes('?')) throw new WorkbookCorrectionError('Send the correction identity in the JSON body.',422);
    const input = await readBoundedMutationJson(request,{maxBytes:8_000,
      error:(message,status)=>new WorkbookCorrectionError(message,status),
      crossOriginMessage:'Cross-origin Studio changes are not allowed.',jsonMessage:'Send Studio changes as JSON.'});
    const id = (await context.params).workbook_id;
    if (!workbookCorrectionId(id)) throw new WorkbookCorrectionError('A valid workbook ID is required.',422);
    const parsed = parseWorkbookCorrectionLookupRequest(input,id);
    if (!parsed) throw new WorkbookCorrectionError('Confirm the correction request identity and exact published source.',422);
    const lookup = parseWorkbookCorrectionLookup(await lookupStudioWorkbookCorrection(auth,id,parsed),parsed);
    if (!lookup) throw new Error('Invalid correction lookup response');
    return Response.json(lookup,{headers});
  } catch (error) { return failure(error); }
}
