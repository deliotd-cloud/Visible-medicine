import { authenticateEducationApi, EducationApiError } from '@/lib/education-api';
import { enforceRateLimit, InstitutionOperationsError } from '@/lib/institution-operations';
import { readBoundedMutationJson } from '@/lib/mutation-json';
import { WorkbookCorrectionError, workbookCorrectionId } from '@/lib/workbook-correction-contract';
import { getStudioWorkbookCorrectionLineage } from '@/lib/workbook-correction-lineage-repository';
import { parseWorkbookCorrectionLineage, parseWorkbookCorrectionLineageRequest } from '@/lib/workbook-correction-lineage-contract';

export const dynamic = 'force-dynamic';
const headers = {'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'};
type Context = {params: Promise<{workbook_id: string}>};

export async function POST(request: Request, context: Context) {
  try {
    const auth = await authenticateEducationApi();
    await enforceRateLimit(auth.userId,'studio-write',45,60);
    if (request.url.includes('?')) throw new WorkbookCorrectionError('Send the draft context in the JSON body.',422);
    const input = await readBoundedMutationJson(request,{maxBytes:8_000,
      error:(message,status)=>new WorkbookCorrectionError(message,status),
      crossOriginMessage:'Cross-origin Studio requests are not allowed.',jsonMessage:'Send Studio requests as JSON.'});
    const id = (await context.params).workbook_id;
    if (!workbookCorrectionId(id)) throw new WorkbookCorrectionError('A valid workbook ID is required.',422);
    const parsed = parseWorkbookCorrectionLineageRequest(input,id);
    if (!parsed) throw new WorkbookCorrectionError('Confirm the exact draft workbook context.',422);
    const lineage = parseWorkbookCorrectionLineage(await getStudioWorkbookCorrectionLineage(auth,id,parsed),parsed);
    if (!lineage) throw new Error('Invalid correction lineage response');
    return Response.json(lineage,{headers});
  } catch (error) {
    if (error instanceof WorkbookCorrectionError || error instanceof EducationApiError || error instanceof InstitutionOperationsError)
      return Response.json({error:error.message},{status:error.status,headers});
    console.error('Visible Medicine Studio correction lineage error',{type:error instanceof Error ? error.name : 'unknown'});
    return Response.json({error:'Studio could not verify correction lineage. Refresh and check the workbook.'},{status:500,headers});
  }
}
